import { useEffect, useRef, useState } from "react";
import { Alert, Button, Empty, Input, Modal, Spin } from "antd";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import { createConversation, getConversations, type Conversation } from "@/api/chat";
import { useChatMessages } from "@/hooks/useChatMessages";
import "@/assets/styles/markdown.css";
import styles from "./ChatPage.module.css";

export default function ChatPage({ onLogout }: { onLogout: () => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const { messages, isLoading, historyLoading, activity, error: chatError, canRetry,
    sendMessage, stopGeneration, retryLastMessage } = useChatMessages(selected);
  const bottom = useRef<HTMLDivElement>(null);
  const creating = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setListLoading(true);
    setListError("");
    getConversations(controller.signal)
      .then(items => {
        if (controller.signal.aborted) return;
        setConversations(items);
        setSelected(previous => items.some(item => item.id === previous)
          ? previous : items[0]?.id ?? null);
      })
      .catch(err => {
        if (!controller.signal.aborted) setListError(err instanceof Error ? err.message : "读取会话失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const newConversation = async () => {
    const title = newTitle.trim();
    if (creating.current || !title) return;
    creating.current = true;
    setListLoading(true);
    setListError("");
    try {
      const item = await createConversation(title);
      setConversations(items => [item, ...items.filter(existing => existing.id !== item.id)]);
      setSelected(item.id);
      setNewDialogOpen(false);
      setNewTitle("");
      setCreateError("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "创建会话失败");
    } finally {
      creating.current = false;
      setListLoading(false);
    }
  };

  const disabled = listLoading || historyLoading || isLoading;
  return <div className={styles.chatPageContainer}>
    <ChatHeader conversations={conversations} selected={selected} disabled={disabled}
      onSelect={setSelected} onNew={() => { setNewTitle(""); setCreateError(""); setNewDialogOpen(true); }} onLogout={onLogout} />
    <Modal title="新建对话" open={newDialogOpen} onCancel={() => { if (!creating.current) setNewDialogOpen(false); }}
      onOk={() => void newConversation()} okText="创建" okButtonProps={{ disabled: !newTitle.trim(), loading: creating.current }}
      cancelButtonProps={{ disabled: creating.current }} destroyOnHidden>
      <p style={{ marginBottom: 10 }}>给这段对话起个名字</p>
      <Input autoFocus aria-label="对话名称" placeholder="例如：本周项目计划" maxLength={100}
        value={newTitle} onChange={event => { setNewTitle(event.target.value); setCreateError(""); }}
        onPressEnter={() => void newConversation()} />
      {createError && <Alert type="error" title={createError} style={{ marginTop: 12 }} showIcon />}
    </Modal>
    {listError && <Alert type="error" title={listError}
      action={<Button size="small" onClick={() => setRevision(value => value + 1)}>重试</Button>} />}
    {chatError && <Alert type="warning" title={chatError}
      action={canRetry && <Button size="small" onClick={() => void retryLastMessage()}>重新生成</Button>} />}
    <div className={styles.chatBox}>
      {(listLoading || historyLoading) && <Spin />}
      {!listLoading && !historyLoading && !messages.length &&
        <Empty description={selected === null ? "点击新建对话，开始聊天" : "这个会话还没有消息"} />}
      {messages.map(message => <div key={message.id} className={styles.msgContainer}
        style={{ justifyContent: message.role === "user" ? "flex-end" : "flex-start", textAlign: "left" }}>
        <div className={styles.msgWrapper} style={{ maxWidth: "90%" }}>
          <div className={styles.msgContent} style={{ background: message.role === "user" ? "#f3f3f3" : "#fff" }}>
            <div className="markdown">
              {message.content.split(/(<think>[\s\S]*?<\/think>)/g).map((part, index) =>
                part.startsWith("<think>") ? <details key={index}>
                  <summary>思考过程</summary><ReactMarkdown remarkPlugins={[remarkGfm]}>{part.slice(7, -8)}</ReactMarkdown>
                </details> : <ReactMarkdown remarkPlugins={[remarkGfm]} key={index}>{part}</ReactMarkdown>
              )}
            </div>
          </div>
        </div>
      </div>)}
      {isLoading && <div className={styles.loadingState}><Spin size="small" /> {activity || "正在接收回答…"}
        <Button size="small" danger onClick={stopGeneration}>停止生成</Button></div>}
      <div ref={bottom} />
    </div>
    <ChatInput key={selected ?? "empty"} onSend={sendMessage}
      disabled={selected === null || disabled} />
  </div>;
}
