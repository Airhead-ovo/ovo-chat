import { useState } from "react";
import { Button, Input } from "antd";
type Props = { disabled?: boolean; onSend: (content: string) => Promise<boolean> };
export default function ChatInput({ disabled, onSend }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    const text = content.trim();
    if (disabled || sending || !text) return;
    setSending(true);
    try { if (await onSend(text)) setContent(""); }
    finally { setSending(false); }
  };
  return <div style={{ display: "flex", gap: 10, padding: 12, alignItems: "flex-end" }}>
    <Input.TextArea aria-label="消息" placeholder="输入问题，Enter 发送，Shift+Enter 换行"
      value={content} maxLength={20000} disabled={disabled || sending}
      onChange={event => setContent(event.target.value)} autoSize={{ minRows: 3, maxRows: 6 }}
      onKeyDown={event => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault(); void send();
        }
      }} />
    <Button type="primary" loading={sending} disabled={disabled || !content.trim()} onClick={() => void send()}>发送</Button>
  </div>;
}
