export const parseSSE = (chunk: string) => {
  const lines = chunk.split("\n").filter(Boolean);

  const results = [];

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;

    const data = line.replace("data: ", "").trim();

    if (data === "[DONE]") {
      results.push({ done: true });
      continue;
    }

    try {
      const json = JSON.parse(data);

      results.push({
        content: json?.choices?.[0]?.delta?.content,
        usage: json?.usage,
        done: false,
      });
    } catch {
      continue;
    }
  }

  return results;
}