// ============================================================
// PathPilot AI — Shared TypeScript Types
// ============================================================

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Resource {
  id: string;
  title: string;
  provider: string;
  type: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  duration_hours: number;
  cost: string;
  url: string;
  rating: number;
  tags: string[];
}

export interface LearnerProfile {
  name: string;
  target_skill: string;
  current_level: 'beginner' | 'intermediate' | 'advanced';
  learning_style: 'visual' | 'reading' | 'hands_on' | 'auditory' | 'mixed';
  hours_per_week: number;
  deadline_weeks: number;
  budget: 'free_only' | 'some_paid' | 'flexible';
  goal: string;
}

export interface Module {
  id?: number;
  week: number;
  title: string;
  description: string;
  resource_id: string | null;
  resource_title: string | null;
  resource_url?: string | null;
  hours: number;
  type: 'learn' | 'practice' | 'project';
  is_completed?: boolean;
  completed_at?: string | null;
}

export interface Project {
  title: string;
  difficulty: string;
  hours: number;
}

export interface PathPreview {
  id?: number;
  disclaimer: string;
  learner_name: string;
  target_skill: string;
  total_weeks: number;
  total_hours: number;
  modules: Module[];
  suggested_projects: Project[];
  next_steps: string[];
}

export interface SavedPath {
  id: number;
  title: string;
  description?: string;
  learning_goal?: string;
  current_level?: string;
  target_skill: string;
  hours_per_week: number;
  total_weeks: number;
  total_hours: number;
  progress_percentage: number;
  next_module?: string;
  completed_modules?: number;
  total_modules?: number;
  created_at: string;
  modules?: Module[];
  resources?: {
    id: number;
    title: string;
    url: string;
    provider?: string;
    resource_type?: string;
  }[];
}

export interface DashboardStats {
  active_paths: number;
  modules_done: number;
  hours_studied: number;
  streak_days: number;
}

export interface RecentActivityItem {
  id: number;
  date: string;
  action: string;
  type: string;
  hours: number;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  paths: SavedPath[];
  recent_activity: RecentActivityItem[];
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database?: string;
  database_type?: string;
  ai_engine?: {
    gemini_configured: boolean;
    tavily_configured: boolean;
    gemini_model?: string;
  };
}
