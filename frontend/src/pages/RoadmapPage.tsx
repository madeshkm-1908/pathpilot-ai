import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, Layers, Lightbulb, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import type { PathPreview, Module } from '../types';

const typeConfig = {
  learn: { color: 'bg-blue-600/20 text-blue-400 border-blue-500/30', icon: BookOpen, label: 'Learn' },
  practice: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30', icon: CheckCircle, label: 'Practice' },
  project: { color: 'bg-green-600/20 text-green-400 border-green-500/30', icon: Layers, label: 'Project' },
};

function ModuleCard({ mod, index }: { mod: Module; index: number }) {
  const cfg = typeConfig[mod.type];
  return (
    <div className="flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 ${
          mod.type === 'learn' ? 'border-blue-500 bg-blue-500/10 text-blue-400' :
          mod.type === 'practice' ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' :
          'border-green-500 bg-green-500/10 text-green-400'
        }`}>
          {index + 1}
        </div>
        {index < 100 && (
          <div className="w-0.5 flex-1 bg-[#334155] mt-1" style={{ minHeight: '32px' }} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 pb-8">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-violet-500/40 transition-all">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${cfg.color}`}>
                  <cfg.icon size={11} />
                  {cfg.label}
                </span>
                <span className="text-slate-500 text-xs">Week {mod.week}</span>
              </div>
              <h3 className="text-white font-semibold">{mod.title}</h3>
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
        </div>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const preview = location.state?.preview as PathPreview | undefined;

  if (!preview) {
    return (
      <div className="min-h-screen pt-28 px-4 flex flex-col items-center justify-center gap-6">
        <AlertTriangle size={40} className="text-yellow-400" />
        <h2 className="text-white text-xl font-semibold">No roadmap found</h2>
        <p className="text-slate-400">Please complete the onboarding form first.</p>
        <Link to="/onboarding" className="px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors">
          Go to Onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Disclaimer banner */}
        <div className="bg-violet-500/10 border border-violet-500/30 rounded-xl px-4 py-3 mb-8 text-violet-300 text-sm flex items-start gap-2">
          <CheckCircle size={16} className="shrink-0 mt-0.5 text-violet-400" />
          <span>{preview.disclaimer}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            {preview.learner_name}'s Learning Roadmap
          </h1>
          <p className="text-slate-400">
            <span className="text-violet-400 font-medium">{preview.target_skill}</span>
            {' · '}{preview.total_weeks} weeks · {preview.total_hours} total hours
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { label: 'Total Weeks', value: preview.total_weeks },
            { label: 'Total Hours', value: preview.total_hours },
            { label: 'Modules', value: preview.modules.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Layers size={18} className="text-violet-400" />
          Your Learning Modules
        </h2>
        <div>
          {preview.modules.map((mod, i) => (
            <ModuleCard key={i} mod={mod} index={i} />
          ))}
        </div>

        {/* Projects */}
        <div className="mt-8 bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-400" />
            Suggested Projects
          </h2>
          <div className="space-y-3">
            {preview.suggested_projects.map((p) => (
              <div key={p.title} className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-[#334155]">
                <div>
                  <p className="text-white text-sm font-medium">{p.title}</p>
                  <p className="text-slate-500 text-xs capitalize">{p.difficulty}</p>
                </div>
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Clock size={12} />{p.hours}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
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

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
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
      </div>
    </div>
  );
}
