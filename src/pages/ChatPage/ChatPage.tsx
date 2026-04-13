import { useRef, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import ReactMarkdown from "react-markdown";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatInput from "@/components/chat/ChatInput";
import { useChatMessages, type Message } from "@/hooks/useChatMessages";
import { formatTime } from "@/utils/time";
import "@/assets/styles/markdown.css";
import styles from "./ChatPage.module.css";

type RenderPart =
  | { type: "think"; content: string }
  | { type: "text"; content: string };

export default function ChatPage() {
  const [model, setModel] = useState("grok-4");
  const { messages, isLoading, sendMessage } = useChatMessages(model);
  const inputRef = useRef<{ clearInput: () => void } | null>(null);

  const handleSend = async (data: { content: string; image?: string }) => {
    await sendMessage(data);
    inputRef.current?.clearInput();
  }

  const formatMarkdown = (text: string) => {
    const normalizedText = text
      .replace(/\r\n/g, "\n") // 把 Windows 换行 \r\n → 统一成 \n
      .replace(/([^\n])(#{1,6}\s*)/g, "$1\n\n$2") // 强制让标题 ### 前面换行
      .replace(/([。！？：:])\s*(#{1,6}\s+)/g, "$1\n\n$2") // 标点符号后面接标题 → 强制换行
      .replace(/([。！？：:])\s*(-\s*)/g, "$1\n$2") // 标点符号后接列表 - → 换行
      .replace(/([。！？：:])\s*(\d+\.\s+)/g, "$1\n$2"); // 标点符号后接有序列表 1. → 换行

    const lines = normalizedText.split("\n"); // 变成数组
    const formattedLines: string[] = [];
    let shouldIndentNestedBullet = false;

    for (const rawLine of lines) {
      let nextLine = rawLine.trimEnd(); // 去掉行尾空格

      nextLine = nextLine.replace(/^(#{1,6})([^\s#])/, "$1 $2"); // 标题 ### 前面加空格
      nextLine = nextLine.replace(/^(\s*)-(?!\s)/, "$1- "); // 修复 -标题 -> - 标题   \s* = “0个或多个空白字符”  ?!\s = 判断不是空格
      nextLine = nextLine.replace(/^(-\s+[^：:]+[：:])(\S)/, "$1\n$2"); // - 到冒号为止 后面换行

      const trimmedLine = nextLine.trimStart(); // 只去掉左边空格
      const isBulletLine = /^-\s+/.test(trimmedLine);
      const previousLine = formattedLines.at(-1)?.trimEnd() ?? "";
      const previousIsColonListItem =
        /^\s*(?:-|\*|\+|\d+\.)\s+/.test(previousLine) && /[：:]\s*$/.test(previousLine);

      if (!trimmedLine) {
        shouldIndentNestedBullet = false;
        formattedLines.push("");
        continue;
      }

      if (isBulletLine) {
        const normalizedBulletLine = trimmedLine;

        if (shouldIndentNestedBullet || previousIsColonListItem) {
          formattedLines.push(`  ${normalizedBulletLine}`);
          shouldIndentNestedBullet = true;
        } else {
          formattedLines.push(normalizedBulletLine);
          shouldIndentNestedBullet = false;
        }

        continue;
      }

      shouldIndentNestedBullet = false;
      formattedLines.push(nextLine);
    }

    return formattedLines.join("\n").replace(/\n{3,}/g, "\n\n");
  }


  const parseMessageParts = (text: string): RenderPart[] => {
    const parts: RenderPart[] = [];
    const regex = /<think>([\s\S]*?)<\/think>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      parts.push({
        type: "think",
        content: match[1].trim(),
      })

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      })
    }

    if (parts.length === 0) {
      parts.push({ type: "text", content: text });
    }

    return parts;
  }

  const renderMessageContent = (msg: Message) => {
    const parts = parseMessageParts(msg.content);
    const isStreamingAssistant = msg.role === "assistant" && !msg.done;

    return (
      <div className="markdown">
        {parts.map((part, index) => {
          if (part.type === "think") {
            return (
              <details
                key={`${msg.id}-think-${index}`}
                className="thinkBlock"
                open={isStreamingAssistant}
              >
                <summary className="thinkSummary">
                  <span className="thinkLabel">已深度思考</span>
                  {isStreamingAssistant && (
                    <span className="thinkLoadingInline">
                      <Spin indicator={<LoadingOutlined spin />} size="small" />
                      <span>思考中</span>
                    </span>
                  )}
                </summary>
                <div className="thinkContent">{part.content}</div>
              </details>
            )
          }

          if (!part.content.trim()) return null;

          return (
            <ReactMarkdown key={`${msg.id}-text-${index}`}>
              {formatMarkdown(part.content)}
            </ReactMarkdown>
          )
        })}
      </div>
    )
  }

  const showStandaloneLoading =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "assistant" &&
    !messages[messages.length - 1]?.content;

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
              style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}
            >
              <div className={styles.msgWrapper}>
                <div
                  className={styles.msgContent}
                  style={{ background: isUser ? "#f3f3f3" : "#fff" }}
                >
                  {renderMessageContent(msg)}
                </div>

                {msg.role === "assistant" && msg.done && msg.usage && (
                  <div className={styles.tokenInfo}>
                    <div>
                      {formatTime(msg.created)} &nbsp;&nbsp; {msg.model}
                    </div>
                    tokens: {msg.usage.total_tokens} &nbsp;&nbsp; (in: {msg.usage.prompt_tokens}, out: {msg.usage.completion_tokens})
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {showStandaloneLoading && (
          <div className={styles.msgContainer} style={{ justifyContent: "flex-start" }}>
            <div className={styles.msgWrapper}>
              <div className={styles.loadingState}>
                <Spin indicator={<LoadingOutlined spin />} size="small" />
                <span>正在思考中…</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} ref={inputRef} disabled={isLoading} />
    </div>
  )
}
