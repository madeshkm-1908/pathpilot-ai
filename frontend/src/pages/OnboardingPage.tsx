import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { previewPath } from '../api/client';
import type { LearnerProfile } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const STEPS = ['About You', 'Your Goal', 'Schedule & Budget', 'Review'];

const defaultProfile: LearnerProfile = {
  name: '',
  target_skill: '',
  current_level: 'beginner',
  learning_style: 'mixed',
  hours_per_week: 10,
  deadline_weeks: 12,
  budget: 'free_only',
  goal: '',
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<LearnerProfile>(defaultProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof LearnerProfile>(key: K, value: LearnerProfile[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.current_level;
    if (step === 1) return form.target_skill.trim().length >= 2 && form.goal.trim().length >= 5;
    if (step === 2) return form.hours_per_week >= 1 && form.deadline_weeks >= 1;
    return true;
  };

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const preview = await previewPath(form);
      navigate('/roadmap', { state: { preview, profile: form } });
    } catch (err: unknown) {
      let msg = 'Could not connect to the backend. Is the server running?';
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response: { data?: { detail?: string } } }).response;
        if (r.data?.detail) msg = String(r.data.detail);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const labelCls = 'block text-sm font-medium text-slate-300 mb-2';
  const inputCls =
    'w-full px-4 py-3 rounded-xl bg-[#1e293b] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-violet-400 mb-3">
            <Brain size={20} />
            <span className="text-sm font-medium">Onboarding</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Build your learning path</h1>
          <p className="text-slate-400 mt-2 text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < step
                    ? 'bg-violet-600 text-white'
                    : i === step
                    ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                    : 'bg-[#1e293b] text-slate-500 border border-[#334155]'
                }`}
              >
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-violet-400' : 'text-slate-600'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8">
          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => setError(null)}
            />
          )}

          {/* Step 0: About You */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Tell us about yourself</h2>
              <div>
                <label className={labelCls}>Your Name *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Alex Johnson"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Current Skill Level *</label>
                <select
                  className={selectCls}
                  value={form.current_level}
                  onChange={e => set('current_level', e.target.value as LearnerProfile['current_level'])}
                >
                  <option value="beginner">🌱 Beginner — I'm just starting out</option>
                  <option value="intermediate">🚀 Intermediate — I have some experience</option>
                  <option value="advanced">⚡ Advanced — I want to deepen expertise</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Preferred Learning Style *</label>
                <select
                  className={selectCls}
                  value={form.learning_style}
                  onChange={e => set('learning_style', e.target.value as LearnerProfile['learning_style'])}
                >
                  <option value="visual">👀 Visual — Videos and diagrams</option>
                  <option value="reading">📖 Reading — Articles and docs</option>
                  <option value="hands_on">🛠️ Hands-on — Projects and coding</option>
                  <option value="auditory">🎧 Auditory — Podcasts and lectures</option>
                  <option value="mixed">🔄 Mixed — A bit of everything</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 1: Your Goal */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">What do you want to learn?</h2>
              <div>
                <label className={labelCls}>Target Skill *</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Python, Web Development, Machine Learning"
                  value={form.target_skill}
                  onChange={e => set('target_skill', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Your Learning Goal *</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={4}
                  placeholder="Describe what success looks like for you. E.g. 'I want to build full-stack web apps and get a junior developer job within 6 months.'"
                  value={form.goal}
                  onChange={e => set('goal', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Schedule & Budget</h2>
              <div>
                <label className={labelCls}>
                  Hours per week you can dedicate: <span className="text-violet-400">{form.hours_per_week}h</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={form.hours_per_week}
                  onChange={e => set('hours_per_week', Number(e.target.value))}
                  className="w-full accent-violet-500 mt-1"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1h</span><span>40h</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  Target deadline: <span className="text-violet-400">{form.deadline_weeks} weeks</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={52}
                  value={form.deadline_weeks}
                  onChange={e => set('deadline_weeks', Number(e.target.value))}
                  className="w-full accent-violet-500 mt-1"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 week</span><span>52 weeks</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Budget preference *</label>
                <select
                  className={selectCls}
                  value={form.budget}
                  onChange={e => set('budget', e.target.value as LearnerProfile['budget'])}
                >
                  <option value="free_only">🆓 Free only — No paid resources</option>
                  <option value="some_paid">💳 Some paid — Up to \$50/month</option>
                  <option value="flexible">🏆 Flexible — Best resources regardless of cost</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Review your profile</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['Name', form.name],
                  ['Level', form.current_level],
                  ['Style', form.learning_style],
                  ['Target Skill', form.target_skill],
                  ['Weekly Hours', `${form.hours_per_week}h`],
                  ['Deadline', `${form.deadline_weeks} weeks`],
                  ['Budget', form.budget],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#0f172a] rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="text-white font-medium capitalize">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#0f172a] rounded-lg p-3 text-sm">
                <p className="text-slate-500 text-xs mb-1">Goal</p>
                <p className="text-white">{form.goal}</p>
              </div>
              <p className="text-violet-400 text-xs mt-4 flex items-center gap-1.5">
                <Brain size={14} /> PathPilot AI will search live web courses with Tavily and architect your roadmap with Gemini.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#334155] text-slate-300 hover:border-violet-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-semibold transition-all disabled:opacity-50"
              >
                {loading ? 'Generating Path…' : 'Generate My Path'} <ArrowRight size={16} />
              </button>
            )}
          </div>

          {loading && <LoadingSpinner message="Searching the live web with Tavily and crafting your roadmap with Gemini…" />}
        </div>
      </div>
    </div>
  );
}
