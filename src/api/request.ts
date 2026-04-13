// api/request.ts
export async function request<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_OPENAI_API_BASE_URL}${url}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        ...options,
      }
    );

    if (!res.ok) {
      throw new Error(`HTTP error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("请求错误:", err);
    throw err;
  }
}