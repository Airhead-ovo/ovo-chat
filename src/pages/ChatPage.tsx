import { useState, useRef, useEffect } from "react";
import ChatInput from "../components/chat/ChatInput";
import ChatHeader from "../components/chat/ChatHeader";
import { chatCompletionsRequest } from "../api/chat.ts"; 

type Message = {
  role: "user" | "assistant";
  content: string;
  model: string;
  created: number;
  usage?: {
    prompt_tokens: number; // 输入给ai的内容的花费 包含system prompt, user message, 历史上下文
    completion_tokens: number; // ai回复的花费
    total_tokens: number; // prompt_tokens + completion_tokens
  }
}

export default function ChatPage() {
  const [model, setModel] = useState('grok-4');

  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<any>(null);
  console.log("render");
  const handleSend = async (data: { content: string; image?: string }) => {
    const userMsg: Message = {
      role: "user",
      content: data.content,
    }

    setMessages((prev) => [...prev, userMsg]);

    // 模拟 AI 回复
    // setTimeout(() => {
    //   setMessages((prev) => [
    //     ...prev,
    //     {
    //       role: "assistant",
    //       content: "我收到了：" + data.content,
    //     },
    //   ]);
    // }, 500);
    
    const res = await chatCompletionsRequest(model, [userMsg]);
    setMessages((prev) =>{
      const next = [
        ...prev,
        {
          role: res.choices[0].message.role,
          content: res.choices[0].message.content,
          created: res.created,
          model: res.model,
          usage: {
            prompt_tokens: res.usage.prompt_tokens,
            completion_tokens: res.usage.completion_tokens,
            total_tokens: res.usage.total_tokens,
          },
        },
      ]
      console.log(next);
      return next;
    })

    inputRef.current?.clearInput();
  }

  const formatTime = (created: number) => {
    return new Date(created * 1000).toLocaleString();
  }

  return (
    <div style={styles.chatPageContainer}>
      <ChatHeader value={model} onModelChange={setModel} />

      <div style={styles.chatBox}>
        {/* 这一段等同于 
        <div v-for="msg in messages">
          {{ msg.content }}
        </div> */}
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={index}
              style={{
                ...styles.msgContainer,
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div style={styles.msgWrapper}>
                <div
                  style={{
                    ...styles.msgContent,
                    background: isUser ? "#f3f3f3" : "#fff",
                  }}
                >
                  {msg.content}
                </div>
                {!isUser && msg.usage && ( // A && B && C  A和B都成立才显示C
                  <div style={styles.tokenInfo}>
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

const styles: Record<string, any> = {
  chatPageContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: 16,
    paddingTop: 4,
    boxSizing: "border-box",
  },
  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
    marginBottom: 12,
  },
  msgContainer: {
    display: "flex",
    width: "100%",
  },
  msgContent: {
    padding: "10px 12px",
    borderRadius: 10,
  },
  msgWrapper: {
    display: "flex",
    flexDirection: "column",
  },
  tokenInfo: {
    fontSize: "11px",
    color: "#999",
    textAlign: "left",
    marginTop: "8px",
    lineHeight: "14px",
    paddingLeft: "12px",
  }
}