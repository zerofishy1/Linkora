/**
 * API Client for Linkora Backend
 *
 * Provides typed methods for all backend endpoints.
 * Handles auth tokens, error parsing, and request formatting.
 *
 * Usage:
 *   import { api } from "@/services/api";
 *   const { user, token } = await api.auth.login("email", "password");
 *   const { tasks } = await api.tasks.list();
 */

// Use the same hostname the browser used to open the page, but on port 3000
const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000/api`;

// ─── Token management ───

let authToken: string | null = localStorage.getItem("auth_token");

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

export function getToken(): string | null {
  return authToken;
}

export function isAuthenticated(): boolean {
  return Boolean(authToken);
}

// ─── Base fetch wrapper ───

interface ApiError {
  error: string;
  status: number;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (multipart)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error: ApiError = {
      error: body.error || `Ошибка ${response.status}`,
      status: response.status,
    };

    // Auto-logout on 401
    if (response.status === 401) {
      setToken(null);
    }

    throw error;
  }

  return response.json();
}

// ─── Auth API ───

export const auth = {
  async register(email: string, password: string, name: string) {
    const data = await request<{ user: any; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    setToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await request<{ user: any; token: string; workspace: any | null }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  async logout() {
    await request("/auth/logout", { method: "POST" });
    setToken(null);
  },

  async me() {
    return request<{ user: any; workspace: any | null }>("/auth/me");
  },

  async updateProfile(data: { name?: string; jobTitle?: string; tag?: string }) {
    return request<{ user: any }>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

// ─── Workspaces API ───

export const workspaces = {
  async list() {
    return request<{ workspaces: any[] }>("/workspaces");
  },

  async create(name: string) {
    const data = await request<{ workspace: any; token: string }>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setToken(data.token);
    return data;
  },

  async select(workspaceId: string) {
    const data = await request<{ workspace: any; token: string }>(`/workspaces/select/${workspaceId}`, {
      method: "POST",
    });
    setToken(data.token);
    return data;
  },

  async join(inviteToken: string) {
    const data = await request<{ workspace: any; token: string }>("/workspaces/join", {
      method: "POST",
      body: JSON.stringify({ inviteToken }),
    });
    setToken(data.token);
    return data;
  },

  async current() {
    return request<{ workspace: any }>("/workspaces/current");
  },

  async createInvite(role = "member", expiresInDays = 7, usageLimit = 0) {
    return request<{ invite: any }>("/workspaces/invite", {
      method: "POST",
      body: JSON.stringify({ role, expiresInDays, usageLimit }),
    });
  },

  async listInvites() {
    return request<{ invites: any[] }>("/workspaces/invites");
  },

  async revokeInvite(id: string) {
    return request<{ ok: boolean }>(`/workspaces/invites/${id}`, { method: "DELETE" });
  },

  async changeMemberRole(userId: string, role: string) {
    return request<{ member: any }>(`/workspaces/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async removeMember(userId: string) {
    return request<{ ok: boolean }>(`/workspaces/members/${userId}`, { method: "DELETE" });
  },
};

// ─── Tasks API ───

export const tasks = {
  async list(params?: { status?: string; priority?: string; search?: string; role?: string; scope?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ tasks: any[] }>(`/tasks${query}`);
  },

  async get(id: string) {
    return request<{ task: any }>(`/tasks/${id}`);
  },

  async create(data: {
    title: string;
    description?: string;
    deadline?: string;
    dueDate?: string;
    startDate?: string;
    assignee?: string;
    assigneeUserId?: string | null;
    assigneeGroupId?: string | null;
    groupId?: string | null;
    project?: string;
    priority?: string;
    status?: string;
    createChat?: boolean;
    files?: Array<{ filename: string; source: string }>;
    checklist?: Array<{ id: string; text: string; done: boolean }>;
    reminders?: Array<{ id: string; at: string; message: string }>;
    timeTrackedMin?: number;
    parentTaskId?: string | null;
    coAssigneeUserIds?: string[];
    watcherUserIds?: string[];
    linkedTaskIds?: string[];
  }) {
    return request<{ task: any }>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    status: string;
    priority: string;
    deadline: string;
    dueDate: string | null;
    startDate: string | null;
    assignee: string;
    assigneeUserId: string | null;
    assigneeGroupId: string | null;
    groupId: string | null;
    project: string;
    bucket: string;
    checklist: Array<{ id: string; text: string; done: boolean }>;
    reminders: Array<{ id: string; at: string; message: string }>;
    timeTrackedMin: number;
    parentTaskId: string | null;
    coAssigneeUserIds: string[];
    watcherUserIds: string[];
    linkedTaskIds: string[];
  }>) {
    return request<{ task: any }>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" });
  },

  async timeStart(id: string) {
    return request<{ task: any }>(`/tasks/${id}/time-start`, { method: "POST" });
  },

  async timeStop(id: string) {
    return request<{ task: any; addedMinutes: number }>(`/tasks/${id}/time-stop`, { method: "POST" });
  },

  async calendarMonth(month: string) {
    return request<{ tasks: any[] }>(`/tasks/calendar/month?month=${encodeURIComponent(month)}`);
  },
};

// ─── Chats API ───

export const chats = {
  async list(params?: { tab?: string; search?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ chats: any[] }>(`/chats${query}`);
  },

  async get(id: string) {
    return request<{ chat: any }>(`/chats/${id}`);
  },

  async create(data: { title: string; tab?: string; counterpart?: string; focus?: string }) {
    return request<{ chat: any }>("/chats", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async sendMessage(chatId: string, body: string) {
    return request<{ message: any }>(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/chats/${id}`, { method: "DELETE" });
  },
};

// ─── Events API ───

export const events = {
  async list(params?: { type?: string; date?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ events: any[] }>(`/events${query}`);
  },

  async get(id: string) {
    return request<{ event: any }>(`/events/${id}`);
  },

  async create(data: { title: string; date: string; time: string; type?: string }) {
    return request<{ event: any }>("/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{ title: string; date: string; time: string; type: string }>) {
    return request<{ event: any }>(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/events/${id}`, { method: "DELETE" });
  },
};

// ─── Feed API ───

export const feed = {
  async list(params?: { tag?: string; search?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ posts: any[] }>(`/feed${query}`);
  },

  async create(data: { title: string; body: string; tag?: string }) {
    return request<{ post: any }>("/feed", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{ title: string; body: string; tag: string }>) {
    return request<{ post: any }>(`/feed/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/feed/${id}`, { method: "DELETE" });
  },
};

// ─── Mail API ───

export const mail = {
  async list(params?: { unread?: string; search?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ mail: any[] }>(`/mail${query}`);
  },

  async get(id: string) {
    return request<{ mail: any }>(`/mail/${id}`);
  },

  async create(data: { fromAddr?: string; subject: string; preview?: string; body?: string }) {
    return request<{ mail: any }>("/mail", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async markRead(id: string, unread = false) {
    return request<{ mail: any }>(`/mail/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ unread }),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/mail/${id}`, { method: "DELETE" });
  },
};

// ─── Documents API ───

export const documents = {
  async list(params?: { kind?: string; search?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ documents: any[] }>(`/documents${query}`);
  },

  async get(id: string) {
    return request<{ document: any }>(`/documents/${id}`);
  },

  async create(data: { title: string; kind?: string; summary?: string; meta?: string }) {
    return request<{ document: any }>("/documents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{ title: string; kind: string; summary: string; meta: string }>) {
    return request<{ document: any }>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/documents/${id}`, { method: "DELETE" });
  },
};

// ─── Groups API ───

export const groups = {
  async list(params?: { search?: string; filter?: string; privacy?: string; type?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ groups: any[] }>(`/groups${query}`);
  },

  async get(id: string) {
    return request<{ group: any }>(`/groups/${id}`);
  },

  async create(data: { title: string; summary?: string; description?: string; type?: string; privacy?: string }) {
    return request<{ group: any }>("/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{ title: string; summary: string; description: string; type: string; privacy: string; isArchived: boolean }>) {
    return request<{ group: any }>(`/groups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/groups/${id}`, { method: "DELETE" });
  },

  async join(groupId: string) {
    return request<{ member: any; status: string }>(`/groups/${groupId}/join`, { method: "POST" });
  },

  async leave(groupId: string) {
    return request<{ ok: boolean }>(`/groups/${groupId}/leave`, { method: "POST" });
  },

  async addMember(groupId: string, userId: string, role?: string) {
    return request<{ member: any }>(`/groups/${groupId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    });
  },

  async changeMemberRole(groupId: string, userId: string, role: string) {
    return request<{ member: any }>(`/groups/${groupId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  },

  async removeMember(groupId: string, userId: string) {
    return request<{ ok: boolean }>(`/groups/${groupId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  // Posts
  async listPosts(groupId: string, params?: { postType?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ posts: any[] }>(`/groups/${groupId}/posts${query}`);
  },

  async createPost(groupId: string, data: { title?: string; body: string; postType?: string; metadata?: string }) {
    return request<{ post: any }>(`/groups/${groupId}/posts`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Tasks
  async listTasks(groupId: string, params?: { status?: string; kanbanStage?: string; search?: string; assignee?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ tasks: any[] }>(`/groups/${groupId}/tasks${query}`);
  },

  async createTask(groupId: string, data: { title: string; description?: string; priority?: string; deadline?: string; dueDate?: string; startDate?: string; assignee?: string; assigneeUserId?: string | null; assigneeGroupId?: string | null; kanbanStage?: string }) {
    return request<{ task: any }>(`/groups/${groupId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateTask(groupId: string, taskId: string, data: Partial<{ title: string; description: string; status: string; priority: string; deadline: string; dueDate: string | null; startDate: string | null; kanbanStage: string; assignee: string }>) {
    return request<{ task: any }>(`/groups/${groupId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Events (Calendar)
  async listEvents(groupId: string, params?: { dateFrom?: string; dateTo?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ events: any[] }>(`/groups/${groupId}/events${query}`);
  },

  async createEvent(groupId: string, data: { title: string; description?: string; date: string; time?: string; endTime?: string; type?: string }) {
    return request<{ event: any }>(`/groups/${groupId}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async deleteEvent(groupId: string, eventId: string) {
    return request<{ ok: boolean }>(`/groups/${groupId}/events/${eventId}`, { method: "DELETE" });
  },

  // Files (Disk)
  async listFiles(groupId: string, params?: { parentId?: string; trashed?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ files: any[] }>(`/groups/${groupId}/files${query}`);
  },

  async createFolder(groupId: string, data: { filename: string; parentId?: string }) {
    return request<{ file: any }>(`/groups/${groupId}/files/folder`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateFile(groupId: string, fileId: string, data: Partial<{ filename: string; parentId: string | null; isTrashed: boolean }>) {
    return request<{ file: any }>(`/groups/${groupId}/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async deleteFile(groupId: string, fileId: string) {
    return request<{ ok: boolean }>(`/groups/${groupId}/files/${fileId}`, { method: "DELETE" });
  },

  // Settings
  async updateSettings(groupId: string, data: Partial<{ defaultLanding: string; enabledTools: string; menuOrder: string; dateStart: string; dateEnd: string }>) {
    return request<{ group: any }>(`/groups/${groupId}/settings`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Follow / Unfollow
  async follow(groupId: string) {
    return request<{ ok: boolean; following: boolean }>(`/groups/${groupId}/follow`, { method: "POST" });
  },

  async unfollow(groupId: string) {
    return request<{ ok: boolean; following: boolean }>(`/groups/${groupId}/unfollow`, { method: "POST" });
  },
};

// ─── People API ───

export const people = {
  async list(params?: { search?: string }) {
    const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<{ people: any[] }>(`/people${query}`);
  },

  async create(data: { name: string; role?: string; state?: string; focus?: string }) {
    return request<{ person: any }>("/people", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{ name: string; role: string; state: string; focus: string }>) {
    return request<{ person: any }>(`/people/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/people/${id}`, { method: "DELETE" });
  },
};

// ─── Files API ───

export const files = {
  async upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ file: { id: string; name: string; size: number; url: string } }>("/files/upload", {
      method: "POST",
      body: formData,
    });
  },

  async uploadMultiple(fileList: File[]) {
    const formData = new FormData();
    fileList.forEach((f) => formData.append("files", f));
    return request<{ files: Array<{ id: string; name: string; size: number; url: string }> }>("/files/upload-multiple", {
      method: "POST",
      body: formData,
    });
  },

  async list() {
    return request<{ files: any[] }>("/files");
  },

  getDownloadUrl(fileId: string) {
    return `${API_BASE}/files/${fileId}`;
  },

  async remove(id: string) {
    return request<{ ok: boolean }>(`/files/${id}`, { method: "DELETE" });
  },
};

// ─── Health check ───

export async function checkHealth() {
  return request<{ status: string; timestamp: string }>("/health");
}

// ─── Unified API object ───

export const api = {
  auth,
  workspaces,
  tasks,
  chats,
  events,
  feed,
  mail,
  documents,
  groups,
  people,
  files,
  checkHealth,
  setToken,
  getToken,
  isAuthenticated,
};

export default api;
