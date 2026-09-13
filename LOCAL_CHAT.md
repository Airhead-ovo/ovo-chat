# 本地 FastAPI 对话（仅前端适配）

后端由你自行维护；本前端只调用已有接口：
- POST /auth/login：邮箱和密码登录。
- POST /conversations?title=...：创建会话。
- POST /conversations/{id}/messages：发送 {"content":"..."}，接收完整 JSON 回复。
- POST /conversations/{id}/messages/stream：接收纯文本 SSE 流。
- GET /conversations：加载当前用户会话；GET /conversations/{id}/messages：加载历史。

启动：后端运行于 8000 端口；本目录 npm ci 后 npm run dev，打开终端显示的地址。
Vite 将 /api/* 代理到 http://127.0.0.1:8000/*，无需修改后端 CORS。
旧 .env 未修改，但前端不再读取模型 URL 或 API Key。Token 存于 sessionStorage。
生产部署需自行配置 /api 反向代理。

使用后端已有账号登录，页面会恢复会话列表和历史消息。智能体工具模式调用非流式接口，
支持后端 Tool 循环；流式聊天模式逐段显示，但后端该接口目前不调用 Tools。
模型由后端配置；当前不支持模型切换和 Token 用量统计。

后端待用户修改（这里只说明，不自动修改）：
1. 流式接口应使用 JSON SSE（例如 data: {"content":"..."}），否则模型 chunk 内换行无法可靠编码。
2. services/message.py 的摘要函数与导入的 CRUD 函数同名；且查询最多 20 条却判断 40 条，摘要无法触发。
3. 建议一问一答成功后统一提交，模型失败时 rollback，避免残留问题。

测试：npm test / npm run lint / npm run build。前端测试使用模拟响应，不调用模型。
