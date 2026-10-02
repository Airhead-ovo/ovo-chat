import { Button, Dropdown, Empty, Modal } from "antd";
import type { Conversation } from "@/api/chat";
import styles from "./ChatHeader.module.css";

type Props = {
  conversations: Conversation[]; selected: number | null; disabled: boolean;
  onSelect: (id: number) => void; onRename: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void; onPin: (conversation: Conversation) => void;
  pinningId: number | null;
  onNew: () => void; onLogout: () => void;
};

export default function ChatHeader(props: Props) {
  const [modal, modalContext] = Modal.useModal();
  const pinned = props.conversations.filter(item => item.pinned_at);
  const others = props.conversations.filter(item => !item.pinned_at);
  const renderGroup = (label: string, items: Conversation[]) => items.length > 0 && <section className={styles.group}>
    <div className={styles.groupTitle}>{label}</div>
    {items.map(item => <div key={item.id} role="listitem"
      className={`${styles.conversationRow} ${props.selected === item.id ? styles.active : ""}`}>
      <button type="button" className={styles.conversation} disabled={props.disabled}
        onClick={() => props.onSelect(item.id)} title={item.title}>
        <span className={styles.chatIcon}>◇</span><span className={styles.conversationTitle}>{item.title}</span>
      </button>
      {item.pinned_at && <span className={styles.pinMarker} title="已置顶">◆</span>}
      <Dropdown trigger={["click"]} disabled={props.disabled || props.pinningId === item.id}
        menu={{
          items: [
            { key: "pin", label: item.pinned_at ? "取消置顶" : "置顶" },
            { key: "rename", label: "重命名" },
            { type: "divider" },
            { key: "delete", label: "删除", danger: true },
          ],
          onClick: ({ key }) => {
            if (key === "pin") props.onPin(item);
            else if (key === "rename") props.onRename(item);
            else if (key === "delete") modal.confirm({
              title: "删除这段对话？",
              content: "该对话中的消息也会被删除。",
              okText: "删除",
              cancelText: "取消",
              okButtonProps: { danger: true },
              onOk: () => props.onDelete(item),
            });
          },
        }}>
        <button type="button" className={styles.moreButton} aria-label={`${item.title} 的更多操作`} title="更多操作">•••</button>
      </Dropdown>
    </div>)}
  </section>;

  return <aside className={styles.sidebar}>
    {modalContext}
    <div className={styles.sidebarHeader}>
      <div className={styles.title}>对话</div>
      <div className={styles.subtitle}>{props.conversations.length} 条记录</div>
      <Button type="primary" className={styles.newButton} onClick={props.onNew} disabled={props.disabled}>＋ 新对话</Button>
    </div>
    <div className={styles.list} role="list" aria-label="会话目录">
      {!props.conversations.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有对话" />}
      {renderGroup("置顶", pinned)}
      {renderGroup("其他对话", others)}
    </div>
    <div className={styles.footer}><Button type="text" block onClick={props.onLogout} disabled={props.disabled}>退出登录</Button></div>
  </aside>;
}
