import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchHealth } from '../api/client';
import type { HealthStatus } from '../types';
import { TrendingUp, BookOpen, CheckCircle, Clock, Zap, ArrowRight, Activity } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const MOCK_PATHS = [
  {
    id: 'p1',
    skill: 'Python Programming',
    progress: 65,
    totalWeeks: 12,
    completedWeeks: 8,
    nextModule: 'Build a REST API with FastAPI',
    color: 'from-blue-600 to-violet-600',
  },
  {
    id: 'p2',
    skill: 'Web Development',
    progress: 30,
    totalWeeks: 20,
    completedWeeks: 6,
    nextModule: 'React: The Complete Guide',
    color: 'from-violet-600 to-pink-600',
  },
];

const MOCK_ACTIVITY = [
  { date: 'Today', action: 'Completed: Python for Everybody – Week 3', type: 'complete' },
  { date: 'Yesterday', action: 'Watched: FastAPI Tutorial (2h)', type: 'learn' },
  { date: '2 days ago', action: 'Submitted: CLI Todo Manager project', type: 'project' },
  { date: '3 days ago', action: 'Started: Web Development Path', type: 'start' },
];

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealthError(true))
      .finally(() => setHealthLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Track your learning progress and milestones</p>
          </div>
          <Link
            to="/onboarding"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors self-start md:self-auto"
          >
            <Zap size={16} /> New Learning Path
          </Link>
        </div>

        {/* Backend Status */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border mb-8 text-sm ${
          healthLoading ? 'border-[#334155] bg-[#1e293b]' :
          health ? 'border-green-500/30 bg-green-500/10' :
          'border-red-500/30 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <Activity size={16} className={health ? 'text-green-400' : healthError ? 'text-red-400' : 'text-slate-400'} />
            <span className={health ? 'text-green-400' : healthError ? 'text-red-400' : 'text-slate-400'}>
              {healthLoading ? 'Checking backend…' :
               health ? `Backend online — ${health.service} v${health.version}` :
               'Backend offline — start the FastAPI server on port 8000'}
            </span>
          </div>
          {health?.ai_engine && (
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-2.5 py-1 rounded-full border ${health.ai_engine.gemini_configured ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-yellow-500/40 text-yellow-400'}`}>
                Gemini: {health.ai_engine.gemini_configured ? 'Ready' : 'No key'}
              </span>
              <span className={`px-2.5 py-1 rounded-full border ${health.ai_engine.tavily_configured ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-yellow-500/40 text-yellow-400'}`}>
                Tavily: {health.ai_engine.tavily_configured ? 'Ready' : 'No key'}
              </span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Active Paths', value: '2', icon: BookOpen },
            { label: 'Hours Studied', value: '47h', icon: Clock },
            { label: 'Modules Done', value: '14', icon: CheckCircle },
            { label: 'Week Streak', value: '🔥 5', icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Icon size={15} />
                {label}
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Paths */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white">Active Learning Paths</h2>
            <p className="text-slate-500 text-xs">
              📌 Demo data — complete the onboarding to generate a real path
            </p>
            {MOCK_PATHS.map(path => (
              <div
                key={path.id}
                className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 hover:border-violet-500/40 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{path.skill}</h3>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Week {path.completedWeeks} of {path.totalWeeks}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-violet-400">{path.progress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-[#0f172a] rounded-full mb-4">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r ${path.color}`}
                    style={{ width: `${path.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-sm">
                    Next: <span className="text-white">{path.nextModule}</span>
                  </p>
                  <Link
                    to="/roadmap"
                    className="flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm transition-colors"
                  >
                    View <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Start new CTA */}
            <Link
              to="/onboarding"
              className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-[#334155] hover:border-violet-500 text-slate-400 hover:text-violet-400 transition-all text-sm"
            >
              + Start a new learning path
            </Link>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 space-y-4">
              {MOCK_ACTIVITY.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    item.type === 'complete' ? 'bg-green-400' :
                    item.type === 'project' ? 'bg-yellow-400' :
                    item.type === 'start' ? 'bg-blue-400' :
                    'bg-violet-400'
                  }`} />
                  <div>
                    <p className="text-slate-300 text-sm leading-snug">{item.action}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {healthLoading && <LoadingSpinner message="Checking backend status…" className="mt-6" />}
      </div>
    </div>
  );
}
