import { Button, Empty } from "antd";
import type { Conversation } from "@/api/chat";
import styles from "./ChatHeader.module.css";

type Props = {
  conversations: Conversation[]; selected: number | null; disabled: boolean;
  onSelect: (id: number) => void; onNew: () => void; onLogout: () => void;
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
      {props.conversations.map(item => <button key={item.id} type="button" role="listitem"
        className={`${styles.conversation} ${props.selected === item.id ? styles.active : ""}`}
        disabled={props.disabled} onClick={() => props.onSelect(item.id)} title={item.title}>
        <span className={styles.chatIcon}>◇</span><span className={styles.conversationTitle}>{item.title}</span>
      </button>)}
    </div>
    <div className={styles.footer}><Button type="text" block onClick={props.onLogout} disabled={props.disabled}>退出登录</Button></div>
  </aside>;
}
