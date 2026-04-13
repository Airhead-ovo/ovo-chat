import { useState, useRef } from "react";
import ChatInput from "../components/chat/ChatInput";
import ChatHeader from "../components/chat/ChatHeader";
import { chatCompletionsRequest } from "../api/chat.ts"; 

type Message = {
  role: "user" | "assistant";
  content: string;
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
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "我收到了：" + data.content,
        },
      ]);
    }, 500);
    
    // const res = await chatCompletionsRequest(model, [userMsg]);
    // setMessages((prev) => [
    //   ...prev,
    //   {
    //     role: "assistant",
    //     content: res.choices[0].message.content,
    //   },
    // ])

    inputRef.current?.clearInput();
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
                alignItems: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.msgContent,
                  background: isUser ? "#f3f3f3" : "#fff",
                }}
              >
                {msg.content}
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
  msgContent: {
    maxWidth: "60%",
    padding: "10px 14px",
    borderRadius: 10,
  }
}