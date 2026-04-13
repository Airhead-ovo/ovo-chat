import { request } from "./request.ts";

// 获取可用模型
export function getModelsRequest() {
  return request<ModelsResponse>("/models", {
    method: "GET",
  })
}

export function chatCompletionsRequest(model = "grok-4", messages) {
  return request<ChatResponse>("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    })
  })
}

export async function chatStreamRequest(model: string, messages: any[]) {
  const res = await fetch(
    `${import.meta.env.VITE_OPENAI_API_BASE_URL}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    }
  )

  return res.body;
}