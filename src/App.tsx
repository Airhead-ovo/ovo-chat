import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input } from "antd";
import ChatPage from "./pages/ChatPage/ChatPage";
import ProjectTaskPage from "./pages/ProjectTaskPage/ProjectTaskPage";
import { login } from "./api/chat";
import { clearToken, getToken, setToken } from "./api/request";
import styles from "./App.module.css";

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState<"chat" | "projects">("chat");
  const logout = () => { clearToken(); setAuthenticated(false); };
  useEffect(() => {
    const expired = () => {
      setAuthenticated(false);
      setError("登录已失效，请重新登录");
    };
    window.addEventListener("ovo-chat:unauthorized", expired);
    return () => window.removeEventListener("ovo-chat:unauthorized", expired);
  }, []);
  const submit = async ({ email, password }: { email: string; password: string }) => {
    setLoading(true); setError("");
    try {
      const result = await login(email.trim(), password);
      setToken(result.access_token); setAuthenticated(true);
    } catch (err) { setError(err instanceof Error ? err.message : "登录失败"); }
    finally { setLoading(false); }
  };
  if (authenticated) return <div className={styles.shell}>
    <nav className={styles.navigation}>
      <Button type={page === "chat" ? "primary" : "text"} onClick={() => setPage("chat")}>智能体对话</Button>
      <Button type={page === "projects" ? "primary" : "text"} onClick={() => setPage("projects")}>项目与任务</Button>
      {page === "projects" && <Button style={{ marginLeft: "auto" }} onClick={logout}>退出登录</Button>}
    </nav>
    <main className={styles.main}>
      {page === "chat" ? <ChatPage onLogout={logout} /> : <ProjectTaskPage />}
    </main>
  </div>;
  return <Card title="OvO Chat · 登录" style={{ width: 400, maxWidth: "95%", margin: "12vh auto", textAlign: "left" }}>
    <p style={{ marginBottom: 20 }}>使用 FastAPI 后端已有的邮箱和密码登录。</p>
    {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}
    <Form layout="vertical" onFinish={submit}>
      <Form.Item name="email" label="邮箱" rules={[{ required: true, type: "email", message: "请输入正确的邮箱" }]}>
        <Input autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" label="密码" rules={[{ required: true, message: "请输入密码" }]}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>登录</Button>
    </Form>
    <p style={{ marginTop: 16, fontSize: 12 }}>首次使用可在后端文档的 /auth/register 接口注册。</p>
  </Card>;
}
