import { useState, useRef } from "react";
import ChatInput from "@/components/chat/ChatInput";
import ChatHeader from "@/components/chat/ChatHeader";
import ReactMarkdown from "react-markdown";
import "@/assets/styles/markdown.css";
import styles from "./ChatPage.module.css";
import { formatTime } from "@/utils/time";
import { useChatMessages, type Message } from "@/hooks/useChatMessages";

export default function ChatPage() {
  const [model, setModel] = useState('grok-4');
  const { messages, sendMessage } = useChatMessages(model);
  const inputRef = useRef<any>(null);

  const handleSend = async (data: { content: string; image?: string }) => {
    await sendMessage(data);
    inputRef.current?.clearInput();
  }
  const formatMarkdown = (text: string) => {
    return text
      // 修复 ###标题（补空格）
      .replace(/(#{1,6})([^\s#])/g, "$1 $2");
  }

  return (
    <div className={styles.chatPageContainer}>
      <ChatHeader value={model} onModelChange={setModel} />

      <div className={styles.chatBox}>
        {/* 这一段等同于 
        <div v-for="msg in messages">
          {{ msg.content }}
        </div> */}
        {messages.map((msg: Message) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={styles.msgContainer}
              style={{
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div className={styles.msgWrapper}>
                <div
                  className={styles.msgContent}
                  style={{
                    background: isUser ? "#f3f3f3" : "#fff",
                  }}
                >
                  <div className="markdown">
                    <ReactMarkdown>{formatMarkdown(msg.content)}</ReactMarkdown>
                  </div>
                </div>
                {msg.role === "assistant" && msg.done && msg.usage && ( // A && B && C  A和B都成立才显示C
                  <div className={styles.tokenInfo}>
                    <div>
                      {formatTime(msg.created)} &nbsp;&nbsp; {msg.model}
                    </div>
                    tokens: {msg.usage.total_tokens}  &nbsp;&nbsp;
                    (in: {msg.usage.prompt_tokens}, out: {msg.usage.completion_tokens})
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ChatInput onSend={handleSend} ref={inputRef} />
    </div>
  )
}