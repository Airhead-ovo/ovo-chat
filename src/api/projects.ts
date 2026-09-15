import { request, requestResponse } from "./request";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  owner_id?: number;
}

export type TaskStatus = "todo" | "doing" | "done";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface TaskList {
  items: Task[];
  page: number;
  page_size: number;
  total: number;
}

export const getProjects = () => request<Project[]>("/projects/me/projects");
export const createProject = (data: { name: string; description?: string }) =>
  request<Project>("/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id: number, data: { name?: string; description?: string }) =>
  request<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProject = (id: number) =>
  requestResponse(`/projects/${id}`, { method: "DELETE" });

export const getTasks = (projectId: number, page = 1, pageSize = 10,
  status?: TaskStatus, keyword?: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (status) params.set("status", status);
  if (keyword) params.set("keyword", keyword);
  return request<TaskList>(`/projects/${projectId}/tasks?${params}`, { signal });
};
export const createTask = (projectId: number, data: { title: string; description?: string }) =>
  request<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) });
export const updateTask = (projectId: number, taskId: number, data: { title?: string; description?: string; status?: TaskStatus }) =>
  request<Task>(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteTask = (projectId: number, taskId: number) =>
  requestResponse(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
