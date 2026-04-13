import { useState } from "react";
import { chatStreamRequest } from "@/api/chat.ts";
import { parseSSE } from "@/utils/sse";

export type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  model: string;
  created: number;
  done?: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}

type SendPayload = {
  content: string;
  image?: string;
}
export function useChatMessages(model: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = async (data: SendPayload) => {
    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: data.content,
      created: Date.now() / 1000,
      model,
    }

    const aiMsgId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        role: "assistant",
        content: "",
        created: Date.now() / 1000,
        model,
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
        id: aiMsgId,
      },
    ])

    const stream = await chatStreamRequest(model, [userMsg]);
    const reader = stream?.getReader();

    if (!reader) return;

    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const parsedList = parseSSE(chunk);

      for (const parsed of parsedList) {
        if (parsed.done) break;

        if (parsed.content) {
          fullText += parsed.content;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: fullText } : m
            )
          )
        }

        if (parsed.usage) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? { ...m, usage: parsed.usage, done: true }
                : m
            )
          )
        }
      }
    }
  }

  return {
    messages,
    sendMessage,
  }
}
