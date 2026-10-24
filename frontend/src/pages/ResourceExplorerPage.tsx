import { useState, useEffect, useCallback } from 'react';
import { fetchResources } from '../api/client';
import type { Resource } from '../types';
import { Search, ExternalLink, BookOpen, Star, Clock, Filter } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const COST_LABELS: Record<string, string> = {
  free: '🆓 Free',
  free_audit: '📖 Free Audit',
  paid: '💳 Paid',
};

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-600/20 text-green-400 border-green-500/30',
  intermediate: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  advanced: 'bg-red-600/20 text-red-400 border-red-500/30',
};

const TYPE_ICONS: Record<string, string> = {
  course: '🎓',
  curriculum: '📚',
  documentation: '📄',
  article_series: '📰',
  book: '📖',
};

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 hover:border-violet-500/50 transition-all flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${LEVEL_COLORS[resource.level]}`}>
              {resource.level}
            </span>
            <span className="text-slate-500 text-xs">
              {TYPE_ICONS[resource.type] ?? '📌'} {resource.type}
            </span>
          </div>
          <h3 className="text-white font-semibold leading-snug">{resource.title}</h3>
          <p className="text-slate-400 text-sm mt-0.5">{resource.provider}</p>
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-violet-400 hover:text-violet-300 transition-colors"
          aria-label="Open resource"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <Clock size={13} /> {resource.duration_hours}h
        </span>
        <span className="flex items-center gap-1">
          <Star size={13} className="text-yellow-400 fill-yellow-400" /> {resource.rating}
        </span>
        <span>{COST_LABELS[resource.cost] ?? resource.cost}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto">
        {resource.tags.slice(0, 4).map(tag => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-[#0f172a] text-slate-400 border border-[#334155]">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ResourceExplorerPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [cost, setCost] = useState('');
  const [topic, setTopic] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResources({
        q: q || undefined,
        level: level || undefined,
        cost: cost || undefined,
        topic: topic || undefined,
      });
      setResources(data);
    } catch (err: unknown) {
      let msg = 'Could not load resources. Make sure the backend is running on port 8000.';
      if (err && typeof err === 'object' && 'response' in err) {
        const r = (err as { response?: { data?: { detail?: string } } }).response;
        if (r?.data?.detail) msg = String(r.data.detail);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [q, level, cost, topic]);

  useEffect(() => { load(); }, [load]);

  const selectCls = 'px-3 py-2 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-300 text-sm focus:outline-none focus:border-violet-500 transition-colors cursor-pointer';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-violet-400" size={28} />
            Resource Explorer
          </h1>
          <p className="text-slate-400 mt-2">
            Explore real-world courses, tutorials, and documentation searched live across the web via Tavily.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-xs text-slate-400 mb-1.5">Search</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                placeholder="Search resources…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                <Filter size={11} className="inline mr-1" />Topic
              </label>
              <select className={selectCls} value={topic} onChange={e => setTopic(e.target.value)}>
                <option value="">All Topics</option>
                <option value="python">Python</option>
                <option value="web">Web Dev</option>
                <option value="machine learning">Machine Learning</option>
                <option value="data science">Data Science</option>
                <option value="computer science">Computer Science</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Level</label>
              <select className={selectCls} value={level} onChange={e => setLevel(e.target.value)}>
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Cost</label>
              <select className={selectCls} value={cost} onChange={e => setCost(e.target.value)}>
                <option value="">Any Price</option>
                <option value="free">Free</option>
                <option value="free_audit">Free Audit</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner message="Loading resources…" />
        ) : error ? (
          <ErrorMessage message={error} onRetry={load} />
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
            <p>No resources match your filters.</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-5">{resources.length} resource{resources.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
