export type SSEMessage = { event: string; data: unknown };
export async function readSSE(stream: ReadableStream<Uint8Array>, onMessage: (message: SSEMessage) => void) {
  const reader = stream.getReader(), decoder = new TextDecoder();
  let buffer = "", event = "message", data: string[] = [];
  const line = (value: string) => {
    if (value === "") {
      if (data.length) {
        const raw = data.join("\n"); let parsed: unknown = raw;
        try { parsed = JSON.parse(raw); } catch { /* accept plain text */ }
        onMessage({ event, data: parsed });
      }
      event = "message"; data = [];
    } else if (value.startsWith("event:")) event = value.slice(6).trimStart();
    else if (value.startsWith("data:")) data.push(value.slice(5).replace(/^ /, ""));
  };
  const consume = (final = false) => {
    while (true) {
      const index = buffer.search(/[\r\n]/);
      if (index < 0) break;
      if (!final && buffer[index] === "\r" && index === buffer.length - 1) break;
      const width = buffer[index] === "\r" && buffer[index + 1] === "\n" ? 2 : 1;
      line(buffer.slice(0, index)); buffer = buffer.slice(index + width);
    }
  };
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      buffer += decoder.decode(value, { stream: true }); consume();
    }
    buffer += decoder.decode(); consume(true);
    if (buffer || data.length) throw new Error("回答流未完整结束");
  } finally {
    try { await reader.cancel(); } finally { reader.releaseLock(); }
  }
}
