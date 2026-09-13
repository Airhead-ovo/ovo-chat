import { request, requestResponse } from "./request";
import { readSSE, type SSEMessage } from "../utils/sse";
export type Conversation = { id: number; title: string; user_id: number };
export type ChatMessage = {
  id: number; role: string; content: string; conversation_id: number;
};
export const login = (email: string, password: string) =>
  request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST", body: JSON.stringify({ email, password }),
  });
export const createConversation = (title: string) =>
  request<Conversation>(`/conversations?title=${encodeURIComponent(title)}`, { method: "POST" });
export const getConversations = (signal?: AbortSignal) =>
  request<Conversation[]>("/conversations", { signal });
export const getConversationMessages = (id: number, signal?: AbortSignal) =>
  request<ChatMessage[]>(`/conversations/${id}/messages`, { signal });
export const sendMessageRequest = (id: number, content: string, signal?: AbortSignal) =>
  request<ChatMessage>(`/conversations/${id}/messages`, {
    method: "POST", body: JSON.stringify({ content }), signal,
  });

export async function streamMessageRequest(id: number, content: string, onMessage: (message: SSEMessage) => void, signal?: AbortSignal) {
  const response = await requestResponse(`/conversations/${id}/messages/stream`, {
    method: "POST", body: JSON.stringify({ content }), signal,
    headers: { Accept: "text/event-stream" },
  });
  if (!response.headers.get("content-type")?.includes("text/event-stream") || !response.body) {
    throw new Error("后端未返回 SSE 文本流");
  }
  await readSSE(response.body, onMessage);
}
