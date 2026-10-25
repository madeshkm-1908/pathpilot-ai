import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deletePathApi, fetchDashboard, fetchHealth } from '../api/client';
import type { DashboardData, HealthStatus, SavedPath } from '../types';
import {
  TrendingUp,
  BookOpen,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  Activity,
  Trash2,
  Calendar,
  Layers,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (err: unknown) {
      let msg = 'Could not load your dashboard. Please make sure the backend is reachable.';
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: { detail?: string } } }).response;
        if (r?.data?.detail) msg = String(r.data.detail);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchHealth()
      .then(setHealth)
      .catch(() => {})
      .finally(() => setHealthLoading(false));
  }, []);

  const handleDeletePath = async (pathId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    try {
      await deletePathApi(pathId);
      loadData();
    } catch {
      alert('Failed to delete path. Please try again.');
    }
  };

  const openPath = (path: SavedPath) => {
    // Navigate to roadmap with full path details
    navigate('/roadmap', {
      state: {
        preview: {
          id: path.id,
          disclaimer: 'Saved Learning Path from your Dashboard.',
          learner_name: user?.name || 'Learner',
          target_skill: path.target_skill,
          total_weeks: path.total_weeks,
          total_hours: path.total_hours,
          modules: path.modules || [],
          suggested_projects: [],
          next_steps: [
            'Review module objectives for this week',
            'Follow real resource links for your daily study sessions',
            'Mark completed modules on your roadmap to track progress',
          ],
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex items-center justify-center">
        <LoadingSpinner message="Loading your personal learning dashboard…" />
      </div>
    );
  }

  const stats = dashboard?.stats || {
    active_paths: 0,
    modules_done: 0,
    hours_studied: 0,
    streak_days: 0,
  };

  const statCards = [
    {
      label: 'Active Paths',
      value: String(stats.active_paths),
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Hours Studied',
      value: `${stats.hours_studied}h`,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Modules Done',
      value: String(stats.modules_done),
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Day Streak',
      value: `${stats.streak_days}d`,
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome, {user?.name || 'Learner'} 👋
            </h1>
            <p className="text-slate-400 mt-1">Track your personalized learning roadmaps and verified study progress</p>
          </div>
          <Link
            to="/onboarding"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors self-start md:self-auto shadow-lg shadow-violet-900/30"
          >
            <Zap size={16} /> New Learning Path
          </Link>
        </div>

        {/* Backend & Database Health Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border mb-8 text-sm bg-[#1e293b] border-[#334155]">
          <div className="flex items-center gap-2.5">
            <Activity size={16} className={health ? 'text-green-400' : 'text-slate-400'} />
            <span className={health ? 'text-green-400' : 'text-slate-400'}>
              {healthLoading
                ? 'Connecting to backend…'
                : health
                ? `System Online — ${health.service} v${health.version}`
                : 'System Offline'}
            </span>
          </div>
          {health && (
            <div className="flex items-center gap-2.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10">
                DB: {health.database_type || 'persistent'} ({health.database || 'connected'})
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10">
                Gemini: Ready
              </span>
              <span className="px-2.5 py-0.5 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10">
                Tavily: Ready
              </span>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} onRetry={loadData} />}

        {/* Real Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`p-5 rounded-2xl border ${bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">{label}</span>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Active Learning Paths */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-violet-400" />
              Your Learning Paths
            </h2>
          </div>

          {!dashboard?.paths || dashboard.paths.length === 0 ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 text-center">
              <Layers size={40} className="text-violet-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-white font-semibold text-lg mb-1">No learning paths yet</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                Tell us your target skill and schedule, and our AI will search the live web and build you a personalized curriculum.
              </p>
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors"
              >
                Create Your First Path <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {dashboard.paths.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#1e293b] border border-[#334155] hover:border-violet-500/50 rounded-2xl p-6 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg leading-snug">{p.title}</h3>
                      <button
                        onClick={() => handleDeletePath(p.id, p.title)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Delete path"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <p className="text-slate-400 text-xs mb-4 line-clamp-2">
                      {p.description || `Target skill: ${p.target_skill}`}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                        <span>Progress</span>
                        <span className="font-semibold text-violet-400">{p.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-[#0f172a] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-violet-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(p.progress_percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Next incomplete module */}
                    <div className="bg-[#0f172a] rounded-xl p-3 mb-4 text-xs">
                      <span className="text-slate-500 block mb-0.5">Next step:</span>
                      <span className="text-slate-300 font-medium truncate block">{p.next_module}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#334155] text-xs text-slate-400">
                    <span>
                      {p.completed_modules || 0}/{p.total_modules || 0} modules done · {p.total_hours}h
                    </span>
                    <button
                      onClick={() => openPath(p)}
                      className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      Open Roadmap <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Real Activity */}
        <div>
          <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
            <Calendar size={20} className="text-violet-400" />
            Recent Activity
          </h2>
          {!dashboard?.recent_activity || dashboard.recent_activity.length === 0 ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 text-center text-slate-500 text-sm">
              No learning activities recorded yet. Complete modules in your roadmap to log study sessions!
            </div>
          ) : (
            <div className="bg-[#1e293b] border border-[#334155] rounded-2xl divide-y divide-[#334155] overflow-hidden">
              {dashboard.recent_activity.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#0f172a]/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                    <span className="text-white text-sm truncate">{a.action}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                    {a.hours > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        +{a.hours}h
                      </span>
                    )}
                    <span>{a.date.split('T')[0].split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
