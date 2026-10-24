// ============================================================
// PathPilot AI — Shared TypeScript Types
// ============================================================

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
  week: number;
  title: string;
  description: string;
  resource_id: string | null;
  resource_title: string | null;
  resource_url?: string | null;
  hours: number;
  type: 'learn' | 'practice' | 'project';
}

export interface Project {
  title: string;
  difficulty: string;
  hours: number;
}

export interface PathPreview {
  disclaimer: string;
  learner_name: string;
  target_skill: string;
  total_weeks: number;
  total_hours: number;
  modules: Module[];
  suggested_projects: Project[];
  next_steps: string[];
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  ai_engine?: {
    gemini_configured: boolean;
    tavily_configured: boolean;
    gemini_model?: string;
  };
}
