// ============================================================
// PathPilot AI — Axios API Client
// All calls route through VITE_API_BASE_URL (defaults to localhost:8000)
// ============================================================

import axios from 'axios';
import type { HealthStatus, LearnerProfile, PathPreview, Resource } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Health ---
export async function fetchHealth(): Promise<HealthStatus> {
  const { data } = await api.get<HealthStatus>('/health');
  return data;
}

// --- Resources ---
export async function fetchResources(params?: {
  topic?: string;
  level?: string;
  cost?: string;
  q?: string;
}): Promise<Resource[]> {
  const { data } = await api.get<Resource[]>('/api/resources', { params });
  return data;
}

// --- Path Preview ---
export async function previewPath(profile: LearnerProfile): Promise<PathPreview> {
  const { data } = await api.post<PathPreview>('/api/paths/preview', profile);
  return data;
}
