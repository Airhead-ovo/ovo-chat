import { request, requestResponse } from "./request";

export interface CurrentUser {
  id: number;
  email: string;
}

export interface AvatarUploadResult {
  filename: string;
  content_type: string;
  path: string;
}

export const getCurrentUser = () => request<CurrentUser>("/users/me");

export async function uploadAvatar(file: File) {
  const data = new FormData();
  data.append("file", file);
  return (await requestResponse("/file/users/avatar", {
    method: "POST",
    body: data,
  })).json() as Promise<AvatarUploadResult>;
}

export const avatarUrl = (filename: string) =>
  `/api/file/download/${encodeURIComponent(filename)}`;
