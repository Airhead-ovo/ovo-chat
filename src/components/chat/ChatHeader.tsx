import { Button, Empty, Popconfirm } from "antd";
import type { Conversation } from "@/api/chat";
import styles from "./ChatHeader.module.css";

type Props = {
  conversations: Conversation[]; selected: number | null; disabled: boolean;
  onSelect: (id: number) => void; onRename: (conversation: Conversation) => void;
  onDelete: (conversation: Conversation) => void;
  onNew: () => void; onLogout: () => void;
};

export default function ChatHeader(props: Props) {
  return <aside className={styles.sidebar}>
    <div className={styles.sidebarHeader}>
      <div className={styles.title}>对话</div>
      <div className={styles.subtitle}>{props.conversations.length} 条记录</div>
      <Button type="primary" className={styles.newButton} onClick={props.onNew} disabled={props.disabled}>＋ 新对话</Button>
    </div>
    <div className={styles.list} role="list" aria-label="会话目录">
      {!props.conversations.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有对话" />}
      {props.conversations.map(item => <div key={item.id} role="listitem"
        className={`${styles.conversationRow} ${props.selected === item.id ? styles.active : ""}`}>
        <button type="button" className={styles.conversation} disabled={props.disabled}
          onClick={() => props.onSelect(item.id)} title={item.title}>
          <span className={styles.chatIcon}>◇</span><span className={styles.conversationTitle}>{item.title}</span>
        </button>
        <div className={styles.actions}>
          <button type="button" className={styles.actionButton} disabled={props.disabled}
            aria-label={`重命名 ${item.title}`} title="重命名" onClick={() => props.onRename(item)}>✎</button>
          <Popconfirm title="删除这段对话？" description="该对话中的消息也会被删除。"
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={() => props.onDelete(item)}>
            <button type="button" className={`${styles.actionButton} ${styles.deleteButton}`} disabled={props.disabled}
              aria-label={`删除 ${item.title}`} title="删除">×</button>
          </Popconfirm>
        </div>
      </div>)}
    </div>
    <div className={styles.footer}><Button type="text" block onClick={props.onLogout} disabled={props.disabled}>退出登录</Button></div>
  </aside>;
}
