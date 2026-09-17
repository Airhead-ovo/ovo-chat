import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compile = source => "data:text/javascript;base64," + Buffer.from(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
).toString("base64");
const requestUrl = compile(readFileSync(new URL("../src/api/request.ts", import.meta.url), "utf8"));
const api = await import(requestUrl);
const sseUrl = compile(readFileSync(new URL("../src/utils/sse.ts", import.meta.url), "utf8"));
const { readSSE } = await import(sseUrl);
const chat = await import(compile(readFileSync(new URL("../src/api/chat.ts", import.meta.url), "utf8")
  .replace('from "./request"', 'from "' + requestUrl + '"')
  .replace('from "../utils/sse"', 'from "' + sseUrl + '"')));
const user = await import(compile(readFileSync(new URL("../src/api/user.ts", import.meta.url), "utf8")
  .replace('from "./request"', 'from "' + requestUrl + '"')));
const storage = new Map();
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.window = new EventTarget();

test("login uses JSON credentials without an old model key", async () => {
  api.clearToken();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/auth/login");
    assert.equal(options.headers.has("Authorization"), false);
    assert.deepEqual(JSON.parse(options.body), { email: "test@example.com", password: "test" });
    return Response.json({ access_token: "login-token", token_type: "bearer" });
  };
  assert.equal((await chat.login("test@example.com", "test")).access_token, "login-token");
});
test("create conversation uses title query and login token", async () => {
  api.setToken("login-token");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/conversations?title=" + encodeURIComponent("新对话 & test"));
    assert.equal(options.headers.get("Authorization"), "Bearer login-token");
    return Response.json({ id: 3, title: "test", user_id: 1 });
  };
  assert.equal((await chat.createConversation("新对话 & test")).id, 3);
});
test("conversation list and history use authenticated GET endpoints", async () => {
  api.setToken("login-token");
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.get("Authorization"), "Bearer login-token");
    if (url === "/api/conversations") {
      return Response.json([{ id: 3, title: "previous", user_id: 1 }]);
    }
    assert.equal(url, "/api/conversations/3/messages");
    return Response.json([{ id: 4, role: "user", content: "hello", conversation_id: 3 }]);
  };
  assert.equal((await chat.getConversations())[0].title, "previous");
  assert.equal((await chat.getConversationMessages(3))[0].content, "hello");
});
test("send uses conversation endpoint and non-streaming content", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/conversations/3/messages");
    assert.deepEqual(JSON.parse(options.body), { content: "hello" });
    return Response.json({ id: 7, role: "assistant", content: "reply", conversation_id: 3 });
  };
  assert.equal((await chat.sendMessageRequest(3, "hello")).content, "reply");
});
test("401 clears token and notifies login UI", async () => {
  let expired = false;
  window.addEventListener("ovo-chat:unauthorized", () => { expired = true; }, { once: true });
  globalThis.fetch = async () => Response.json({ detail: "expired" }, { status: 401 });
  await assert.rejects(chat.createConversation("test"), /expired/);
  assert.equal(api.getToken(), null);
  assert.equal(expired, true);
});
test("backend errors are surfaced, not parsed as SSE", async () => {
  globalThis.fetch = async () => Response.json({ detail: "模型暂时无法回答" }, { status: 502 });
  await assert.rejects(chat.sendMessageRequest(3, "hello"), /模型暂时无法回答/);
});
test("network errors explain configured backend availability", async () => {
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  await assert.rejects(chat.createConversation("test"), /API 地址和服务状态/);
});

test("avatar upload uses multipart form data without a JSON content type", async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/file/users/avatar");
    assert.equal(options.method, "POST");
    assert.ok(options.body instanceof FormData);
    assert.equal(options.headers.has("Content-Type"), false);
    assert.equal(options.body.get("file").name, "avatar.png");
    return Response.json({ filename: "avatar.png", content_type: "image/png", path: "uploads/avatar.png" });
  };
  const result = await user.uploadAvatar(new File(["image"], "avatar.png", { type: "image/png" }));
  assert.equal(result.filename, "avatar.png");
  assert.equal(user.avatarUrl("头像 1.png"), "/api/file/download/%E5%A4%B4%E5%83%8F%201.png");
});

function bytesStream(bytes, size = 1) {
  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size));
      controller.close();
    },
  });
}
test("stream endpoint uses login token and raw SSE without DONE", async () => {
  api.setToken("stream-token");
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "/api/conversations/3/messages/stream");
    assert.equal(options.headers.get("Authorization"), "Bearer stream-token");
    assert.equal(options.headers.get("Accept"), "text/event-stream");
    assert.deepEqual(JSON.parse(options.body), { content: "你好" });
    return new Response(bytesStream(new TextEncoder().encode("data: 你\n\ndata: 好\n\n")), {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  };
  const parts = [];
  await chat.streamMessageRequest(3, "你好", message => parts.push(message.data));
  assert.deepEqual(parts, ["你", "好"]);
});
test("named tool and content events preserve JSON payloads", async () => {
  const source = "event: tool_start\ndata: {\"tool_name\":\"create_project\"}\n\n" +
    "event: tool_end\ndata: {\"tool_name\":\"create_project\",\"result\":{\"id\":9}}\n\n" +
    "event: content\ndata: {\"content\":\"创建完成\"}\n\n";
  const messages = [];
  await readSSE(bytesStream(new TextEncoder().encode(source), 2), message => messages.push(message));
  assert.deepEqual(messages, [
    { event: "tool_start", data: { tool_name: "create_project" } },
    { event: "tool_end", data: { tool_name: "create_project", result: { id: 9 } } },
    { event: "content", data: { content: "创建完成" } },
  ]);
});
test("all byte boundaries, Chinese, multiline SSE, spaces and CRLF", async () => {
  const bytes = new TextEncoder().encode(": heartbeat\r\ndata: 中文🙂\r\n\r\ndata:  leading \r\ndata: second\r\n\r\n");
  for (let size = 1; size <= bytes.length; size++) {
    const parts = [];
    await readSSE(bytesStream(bytes, size), message => parts.push(message.data));
    assert.deepEqual(parts, ["中文🙂", " leading \nsecond"]);
  }
});
test("plain text resembling JSON or DONE is not reinterpreted", async () => {
  const parts = [];
  await readSSE(bytesStream(new TextEncoder().encode('data: {"answer":1}\n\ndata: [DONE]\n\n')),
    message => parts.push(message.data));
  assert.deepEqual(parts, [{ answer: 1 }, "[DONE]"]);
});
test("incomplete event is reported", async () => {
  await assert.rejects(readSSE(bytesStream(new TextEncoder().encode("data: incomplete")), () => {}),
    /未完整结束/);
});
test("stream interruption preserves already received content", async () => {
  let count = 0;
  const parts = [];
  const stream = new ReadableStream({
    pull(controller) {
      if (count++ === 0) controller.enqueue(new TextEncoder().encode("data: partial\n\n"));
      else controller.error(new Error("disconnected"));
    },
  });
  await assert.rejects(readSSE(stream, message => parts.push(message.data)), /disconnected/);
  assert.deepEqual(parts, ["partial"]);
});
test("non-SSE response rejected", async () => {
  globalThis.fetch = async () => Response.json({ content: "not streaming" });
  await assert.rejects(chat.streamMessageRequest(3, "test", () => {}), /未返回 SSE/);
});
test("stream rejects 401 and clears auth", async () => {
  api.setToken("expired");
  globalThis.fetch = async () => Response.json({ detail: "expired" }, { status: 401 });
  await assert.rejects(chat.streamMessageRequest(3, "test", () => {}), /expired/);
  assert.equal(api.getToken(), null);
});
