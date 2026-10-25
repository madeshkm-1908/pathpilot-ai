// ============================================================
// PathPilot AI — Axios API Client
// All calls route through VITE_API_BASE_URL (defaults to localhost:8000)
// Automatically attaches Bearer tokens from localStorage
// ============================================================

import axios from 'axios';
import type {
  AuthResponse,
  DashboardData,
  HealthStatus,
  LearnerProfile,
  Module,
  PathPreview,
  Resource,
  SavedPath,
  User,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pathpilot_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Health ---
export async function fetchHealth(): Promise<HealthStatus> {
  const { data } = await api.get<HealthStatus>('/health');
  return data;
}

// --- Authentication ---
export async function signupApi(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/signup', payload);
  return data;
}

export async function loginApi(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/api/auth/me');
  return data;
}

export async function logoutApi(): Promise<{ message: string }> {
  try {
    const { data } = await api.post<{ message: string }>('/api/auth/logout');
    return data;
  } catch {
    return { message: 'Logged out' };
  }
}

// --- Dashboard & Paths ---
export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<DashboardData>('/api/dashboard');
  return data;
}

export async function fetchUserPaths(): Promise<SavedPath[]> {
  const { data } = await api.get<SavedPath[]>('/api/paths');
  return data;
}

export async function fetchPathById(pathId: number | string): Promise<SavedPath> {
  const { data } = await api.get<SavedPath>(`/api/paths/${pathId}`);
  return data;
}

export async function savePathApi(payload: {
  title: string;
  description?: string;
  learning_goal?: string;
  current_level?: string;
  target_skill: string;
  hours_per_week: number;
  total_weeks: number;
  total_hours: number;
  modules: Module[];
}): Promise<SavedPath> {
  const { data } = await api.post<SavedPath>('/api/paths', payload);
  return data;
}

export async function deletePathApi(pathId: number | string): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/api/paths/${pathId}`);
  return data;
}

export async function updateModuleProgressApi(
  moduleId: number | string,
  isCompleted: boolean
): Promise<{ module_id: number; is_completed: boolean; path_id: number; progress_percentage: number }> {
  const { data } = await api.patch(`/api/modules/${moduleId}/progress`, {
    is_completed: isCompleted,
  });
  return data;
}

// --- Resources (Tavily) ---
export async function fetchResources(params?: {
  topic?: string;
  level?: string;
  cost?: string;
  q?: string;
}): Promise<Resource[]> {
  const { data } = await api.get<Resource[]>('/api/resources', { params });
  return data;
}

// --- Path Preview (Tavily + Gemini) ---
export async function previewPath(profile: LearnerProfile): Promise<PathPreview> {
  const { data } = await api.post<PathPreview>('/api/paths/preview', profile);
  return data;
}
