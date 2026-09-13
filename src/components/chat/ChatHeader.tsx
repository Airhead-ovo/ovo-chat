import { Button, Select, Space } from "antd";
import type { Conversation } from "@/api/chat";
type Props = {
  conversations: Conversation[]; selected: number | null; disabled: boolean;
  onSelect: (id: number) => void; onNew: () => void; onLogout: () => void;
};
export default function ChatHeader(props: Props) {
  return <header style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "12px 16px", alignItems: "center" }}>
    <strong>OvO Chat</strong>
    <span style={{ color: "#888", fontSize: 12 }}>流式智能体</span>
    <Select aria-label="选择会话" placeholder="选择会话" style={{ minWidth: 200, flex: 1 }}
      value={props.selected ?? undefined} disabled={props.disabled}
      options={props.conversations.map(item => ({ value: item.id, label: item.title }))}
      onChange={props.onSelect} />
    <Space>
      <Button onClick={props.onNew} disabled={props.disabled}>新建对话</Button>
      <Button onClick={props.onLogout} disabled={props.disabled}>退出登录</Button>
    </Space>
  </header>;
}
