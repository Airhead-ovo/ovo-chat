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

