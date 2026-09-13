import { useEffect, useRef, useState } from "react";
import { getConversationMessages, streamMessageRequest, type ChatMessage } from "@/api/chat";
import type { SSEMessage } from "@/utils/sse";
export function useChatMessages(conversationId: number | null) {
  const [records, setRecords] = useState<Record<number, ChatMessage[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activity, setActivity] = useState("");
  const [error, setError] = useState("");
  const busy = useRef(false), controllerRef = useRef<AbortController | null>(null);
  const loadHistory = async (id: number, signal?: AbortSignal) => {
    const messages = await getConversationMessages(id, signal);
    if (!signal?.aborted) setRecords(previous => ({ ...previous, [id]: messages }));
  };
  useEffect(() => {
    const controller = new AbortController(); setError("");
    if (conversationId === null) { setHistoryLoading(false); return () => controller.abort(); }
    setHistoryLoading(true);
    loadHistory(conversationId, controller.signal)
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "读取历史消息失败"); })
      .finally(() => { if (!controller.signal.aborted) setHistoryLoading(false); });
    return () => controller.abort();
  }, [conversationId]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const sendMessage = async (content: string): Promise<boolean> => {
    if (conversationId === null || busy.current || historyLoading) return false;
    busy.current = true; setIsLoading(true); setActivity("智能体正在思考…"); setError("");
    const id = conversationId, stamp = Date.now(), answerId = -(stamp + 1);
    const controller = new AbortController(); controllerRef.current = controller;
    setRecords(previous => ({ ...previous, [id]: [...(previous[id] ?? []),
      { id: -stamp, role: "user", content, conversation_id: id },
      { id: answerId, role: "assistant", content: "", conversation_id: id }] }));
    let reply = "";
    const handleEvent = (message: SSEMessage) => {
      const payload = typeof message.data === "object" && message.data !== null ? message.data as Record<string, unknown> : {};
      if (message.event === "tool_start") setActivity(`正在调用工具：${String(payload.tool_name ?? "unknown")}`);
      else if (message.event === "tool_end") setActivity(`工具执行完成：${String(payload.tool_name ?? "unknown")}`);
      else if (["content", "message", "delta"].includes(message.event)) {
        const text = typeof message.data === "string" ? message.data : typeof payload.content === "string" ? payload.content : "";
        if (text) {
          reply += text;
          setRecords(previous => ({ ...previous, [id]: (previous[id] ?? []).map(item =>
            item.id === answerId ? { ...item, content: reply } : item) }));
        }
      } else if (message.event === "error") throw new Error(typeof payload.message === "string" ? payload.message : "后端处理失败");
    };
    try {
      await streamMessageRequest(id, content, handleEvent, controller.signal);
      if (!reply.trim()) throw new Error("流已结束，但后端没有发送最终回答 content 事件");
      await loadHistory(id); return true;
    } catch (err) {
      if (!controller.signal.aborted) setError((err instanceof Error ? err.message : "流式回答中断") + "。请刷新历史记录确认结果后再重发。");
      return false;
    } finally {
      busy.current = false; controllerRef.current = null; setActivity(""); setIsLoading(false);
    }
  };
  return { messages: conversationId === null ? [] : records[conversationId] ?? [],
    isLoading, historyLoading, activity, error, sendMessage };
}
