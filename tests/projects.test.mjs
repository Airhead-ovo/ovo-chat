import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const compile = source => "data:text/javascript;base64," + Buffer.from(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
).toString("base64");
const requestUrl = compile(readFileSync(new URL("../src/api/request.ts", import.meta.url), "utf8"));
const projects = await import(compile(readFileSync(new URL("../src/api/projects.ts", import.meta.url), "utf8")
  .replace('from "./request"', `from "${requestUrl}"`)));
globalThis.sessionStorage = { getItem: () => "test-token" };

test("project CRUD uses existing routes and authenticated JSON", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options.method ?? "GET", options.body ? JSON.parse(options.body) : null]);
    assert.equal(options.headers.get("Authorization"), "Bearer test-token");
    return options.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json(
      url.endsWith("/me/projects") ? [] : { id: 2, name: "项目", owner_id: 1 }
    );
  };
  await projects.getProjects();
  await projects.createProject({ name: "项目" });
  await projects.updateProject(2, { name: "新项目" });
  await projects.deleteProject(2);
  assert.deepEqual(calls, [
    ["/api/projects/me/projects", "GET", null],
    ["/api/projects", "POST", { name: "项目" }],
    ["/api/projects/2", "PATCH", { name: "新项目" }],
    ["/api/projects/2", "DELETE", null],
  ]);
});

test("task CRUD handles paginated list and empty DELETE response", async () => {
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push([url, options.method ?? "GET", options.body ? JSON.parse(options.body) : null]);
    return options.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json(
      url.includes("page=") ? { items: [], page: 2, page_size: 10, total: 0 } : { id: 4, title: "任务" }
    );
  };
  await projects.getTasks(2, 2);
  await projects.createTask(2, { title: "任务" });
  await projects.updateTask(2, 4, { status: "done" });
  await projects.deleteTask(2, 4);
  assert.deepEqual(calls, [
    ["/api/projects/2/tasks?page=2&page_size=10", "GET", null],
    ["/api/projects/2/tasks", "POST", { title: "任务" }],
    ["/api/projects/2/tasks/4", "PATCH", { status: "done" }],
    ["/api/projects/2/tasks/4", "DELETE", null],
  ]);
});
