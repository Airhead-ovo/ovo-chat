const TOKEN_KEY = "ovo-chat-token";
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "/api";
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export async function requestResponse(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(`无法连接后端（${API_BASE_URL}），请检查 API 地址和服务状态`);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event("ovo-chat:unauthorized"));
    }
    const detail = data?.detail;
    const message = typeof detail === "string" ? detail
      : Array.isArray(detail) ? detail.map((item: { msg: string }) => item.msg).join("；")
      : `请求失败（${response.status}）`;
    throw new ApiError(response.status, message);
  }
  return response;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  return (await requestResponse(path, options)).json();
}
