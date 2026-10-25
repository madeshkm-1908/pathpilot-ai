import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  Lightbulb,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  BookmarkPlus,
  Check,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { savePathApi, updateModuleProgressApi } from '../api/client';
import type { PathPreview, Module, LearnerProfile } from '../types';

const typeConfig = {
  learn: { color: 'bg-blue-600/20 text-blue-400 border-blue-500/30', icon: BookOpen, label: 'Learn' },
  practice: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30', icon: CheckCircle, label: 'Practice' },
  project: { color: 'bg-green-600/20 text-green-400 border-green-500/30', icon: Layers, label: 'Project' },
};

function ModuleCard({
  mod,
  index,
  isSaved,
  onToggle,
  isUpdating,
}: {
  mod: Module;
  index: number;
  isSaved: boolean;
  onToggle?: () => void;
  isUpdating?: boolean;
}) {
  const cfg = typeConfig[mod.type] || typeConfig.learn;
  const isCompleted = Boolean(mod.is_completed);

  return (
    <div className="flex gap-4">
      {/* Timeline line & Step/Checkbox */}
      <div className="flex flex-col items-center">
        {isSaved ? (
          <button
            type="button"
            onClick={onToggle}
            disabled={isUpdating}
            title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
              isCompleted
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'border-slate-600 bg-[#1e293b] text-slate-400 hover:border-violet-500 hover:text-white'
            }`}
          >
            {isCompleted ? <Check size={18} strokeWidth={3} /> : index + 1}
          </button>
        ) : (
          <div
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
              mod.type === 'learn'
                ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                : mod.type === 'practice'
                ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                : 'border-green-500 bg-green-500/10 text-green-400'
            }`}
          >
            {index + 1}
          </div>
        )}
        {index < 100 && (
          <div className="w-0.5 flex-1 bg-[#334155] mt-1" style={{ minHeight: '32px' }} />
        )}
      </div>

      {/* Card Body */}
      <div className="flex-1 pb-8">
        <div
          className={`bg-[#1e293b] border rounded-xl p-5 transition-all ${
            isCompleted
              ? 'border-emerald-500/40 bg-emerald-950/10'
              : 'border-[#334155] hover:border-violet-500/40'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.color}`}>
                  <cfg.icon size={11} />
                  {cfg.label}
                </span>
                <span className="text-slate-500 text-xs">Week {mod.week}</span>
                {isCompleted && (
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check size={10} /> Completed
                  </span>
                )}
              </div>
              <h3 className={`font-semibold text-base ${isCompleted ? 'text-slate-200 line-through opacity-80' : 'text-white'}`}>
                {mod.title}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm shrink-0">
              <Clock size={13} />
              <span>{mod.hours}h</span>
            </div>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{mod.description}</p>
          {mod.resource_title && (
            <div className="mt-3">
              {mod.resource_url ? (
                <a
                  href={mod.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
                >
                  <ExternalLink size={13} />
                  <span className="underline underline-offset-2">{mod.resource_title}</span>
                </a>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-violet-400 text-sm">
                  <ExternalLink size={13} />
                  <span>{mod.resource_title}</span>
                </div>
              )}
            </div>
          )}

          {isSaved && (
            <div className="mt-4 pt-3 border-t border-[#334155]/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isCompleted ? 'Module marked as completed' : 'Click checkmark or button to complete'}
              </span>
              <button
                type="button"
                onClick={onToggle}
                disabled={isUpdating}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isCompleted
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isCompleted ? 'Mark as Incomplete' : 'Mark Completed'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const preview = location.state?.preview as PathPreview | undefined;
  const profile = location.state?.profile as LearnerProfile | undefined;

  const [modules, setModules] = useState<Module[]>(preview?.modules || []);
  const [savedPathId, setSavedPathId] = useState<number | null>(preview?.id || null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatingModuleId, setUpdatingModuleId] = useState<number | null>(null);

  if (!preview) {
    return (
      <div className="min-h-screen pt-28 px-4 flex flex-col items-center justify-center gap-6">
        <AlertTriangle size={40} className="text-yellow-400" />
        <h2 className="text-white text-xl font-semibold">No roadmap found</h2>
        <p className="text-slate-400">Please complete the onboarding form first.</p>
        <Link
          to="/onboarding"
          className="px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors"
        >
          Go to Onboarding
        </Link>
      </div>
    );
  }

  const completedCount = modules.filter((m) => m.is_completed).length;
  const progressPercent = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const completedHours = modules
    .filter((m) => m.is_completed)
    .reduce((sum, m) => sum + (m.hours || 0), 0);

  // Handle saving the roadmap to user's dashboard
  async function handleSaveRoadmap() {
    if (!preview) return;

    if (!isAuthenticated) {
      // Guide user to login/signup
      navigate('/signup', {
        state: {
          returnTo: '/roadmap',
          preview,
          profile,
          message: 'Create your free account to save this personalized roadmap to your dashboard!',
        },
      });
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        title: `${preview.learner_name}'s ${preview.target_skill} Path`,
        description: `Personalized AI roadmap targeting ${preview.target_skill} (${profile?.learning_style || 'hands-on'} style).`,
        learning_goal: profile?.goal || `Master ${preview.target_skill}`,
        current_level: profile?.current_level || 'beginner',
        target_skill: preview.target_skill,
        hours_per_week: profile?.hours_per_week || 10,
        total_weeks: preview.total_weeks,
        total_hours: preview.total_hours,
        modules: modules.map((m) => ({
          week: m.week,
          title: m.title,
          description: m.description,
          hours: m.hours,
          type: m.type,
          resource_id: m.resource_id || null,
          resource_title: m.resource_title || null,
          resource_url: m.resource_url || null,
          is_completed: Boolean(m.is_completed),
        })),
      };

      const saved = await savePathApi(payload);
      setSavedPathId(saved.id);
      if (saved.modules && saved.modules.length > 0) {
        setModules(saved.modules);
      }
      setSaveSuccess(true);
    } catch (err: unknown) {
      let msg = 'Failed to save roadmap to your dashboard. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: { detail?: string } } }).response;
        if (r?.data?.detail) msg = String(r.data.detail);
      }
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  // Handle module completion toggle
  async function handleToggleModule(mod: Module, index: number) {
    if (!savedPathId || !mod.id) {
      // If not yet saved to backend, toggle locally in preview state
      const nextCompleted = !mod.is_completed;
      setModules((prev) =>
        prev.map((item, i) => (i === index ? { ...item, is_completed: nextCompleted } : item))
      );
      return;
    }

    setUpdatingModuleId(mod.id);
    const nextCompleted = !mod.is_completed;
    try {
      await updateModuleProgressApi(mod.id, nextCompleted);
      setModules((prev) =>
        prev.map((item) => (item.id === mod.id ? { ...item, is_completed: nextCompleted } : item))
      );
    } catch {
      alert('Could not update module progress. Please check your connection.');
    } finally {
      setUpdatingModuleId(null);
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Top Navigation & Status */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>

          {savedPathId ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle size={14} /> Saved to Your Dashboard
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Sparkles size={14} /> AI-Generated Preview
            </span>
          )}
        </div>

        {/* Save Notifications */}
        {saveSuccess && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-emerald-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              <span>Roadmap saved successfully! Your progress is now tracked in your personal dashboard.</span>
            </div>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shrink-0"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Disclaimer banner */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3 mb-8 text-violet-300 text-sm flex items-start gap-2">
          <CheckCircle size={16} className="shrink-0 mt-0.5 text-violet-400" />
          <span>{preview.disclaimer}</span>
        </div>

        {/* Header & Save Action */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {preview.learner_name}'s Learning Roadmap
            </h1>
            <p className="text-slate-400">
              <span className="text-violet-400 font-medium">{preview.target_skill}</span>
              {' · '}{preview.total_weeks} weeks · {preview.total_hours} total hours
            </p>
          </div>

          {!savedPathId && (
            <button
              type="button"
              onClick={handleSaveRoadmap}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-lg shadow-violet-900/30 shrink-0"
            >
              {saving ? (
                <>Saving Roadmap…</>
              ) : isAuthenticated ? (
                <>
                  <BookmarkPlus size={18} /> Save Roadmap to Dashboard
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In to Save Path
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress Tracker (if saved or partially completed) */}
        {savedPathId && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Overall Roadmap Progress</span>
              <span className="text-sm font-bold text-violet-400">
                {progressPercent}% ({completedCount}/{modules.length} modules)
              </span>
            </div>
            <div className="w-full bg-[#0f172a] rounded-full h-2.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{completedHours} study hours completed</span>
              <span>{preview.total_hours - completedHours} hours remaining</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Total Weeks', value: preview.total_weeks },
            { label: 'Total Hours', value: preview.total_hours },
            { label: 'Modules', value: modules.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Layers size={18} className="text-violet-400" />
            Your Learning Modules
          </h2>
          {savedPathId && (
            <span className="text-xs text-slate-400">Click a number or checkbox to mark complete</span>
          )}
        </div>

        <div>
          {modules.map((mod, i) => (
            <ModuleCard
              key={mod.id || i}
              mod={mod}
              index={i}
              isSaved={Boolean(savedPathId)}
              isUpdating={updatingModuleId === mod.id}
              onToggle={() => handleToggleModule(mod, i)}
            />
          ))}
        </div>

        {/* Projects */}
        {preview.suggested_projects && preview.suggested_projects.length > 0 && (
          <div className="mt-8 bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Lightbulb size={18} className="text-yellow-400" />
              Suggested Projects
            </h2>
            <div className="space-y-3">
              {preview.suggested_projects.map((p) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-[#334155]"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{p.title}</p>
                    <p className="text-slate-500 text-xs capitalize">{p.difficulty}</p>
                  </div>
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <Clock size={12} />
                    {p.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {preview.next_steps && preview.next_steps.length > 0 && (
          <div className="mt-6 bg-violet-600/10 border border-violet-500/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Next Steps</h2>
            <ul className="space-y-2">
              {preview.next_steps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-slate-300 text-sm">
                  <CheckCircle size={15} className="text-violet-400 mt-0.5 shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-wrap gap-4 items-center justify-between pt-6 border-t border-[#334155]">
          <div className="flex gap-4">
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
            >
              View Dashboard
            </Link>
            <Link
              to="/onboarding"
              className="px-6 py-3 rounded-xl border border-[#334155] hover:border-violet-500 text-slate-300 hover:text-white transition-colors"
            >
              Adjust My Path
            </Link>
          </div>

          {!savedPathId && (
            <button
              type="button"
              onClick={handleSaveRoadmap}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-lg shadow-violet-900/30"
            >
              {saving ? 'Saving…' : isAuthenticated ? 'Save to Dashboard' : 'Sign in to Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
