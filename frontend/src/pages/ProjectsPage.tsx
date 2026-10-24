import { useState } from 'react';
import { Layers, Clock, ChevronRight, Filter, Code, BarChart2, Globe } from 'lucide-react';

const ALL_PROJECTS = [
  // Python
  { id: 1, title: 'CLI Todo Manager', topic: 'python', difficulty: 'beginner', hours: 4, description: 'Build a command-line task manager with file persistence and categories.', skills: ['Python', 'File I/O', 'argparse'] },
  { id: 2, title: 'Web Scraper + CSV Export', topic: 'python', difficulty: 'intermediate', hours: 8, description: 'Scrape a public website and export structured data to CSV with BeautifulSoup.', skills: ['Python', 'BeautifulSoup', 'requests'] },
  { id: 3, title: 'REST API with FastAPI', topic: 'python', difficulty: 'intermediate', hours: 12, description: 'Build a full CRUD REST API with Pydantic validation and SQLite storage.', skills: ['FastAPI', 'Pydantic', 'SQLite'] },
  // Web Development
  { id: 4, title: 'Personal Portfolio Site', topic: 'web_development', difficulty: 'beginner', hours: 6, description: 'Design and build a responsive portfolio with HTML, CSS, and a contact form.', skills: ['HTML', 'CSS', 'JavaScript'] },
  { id: 5, title: 'Full-Stack Todo App', topic: 'web_development', difficulty: 'intermediate', hours: 16, description: 'React frontend + Node backend with user authentication and PostgreSQL.', skills: ['React', 'Node.js', 'PostgreSQL'] },
  { id: 6, title: 'Real-Time Chat App', topic: 'web_development', difficulty: 'advanced', hours: 24, description: 'WebSocket-based chat with rooms, typing indicators, and message history.', skills: ['React', 'WebSockets', 'Redis'] },
  // Machine Learning
  { id: 7, title: 'House Price Predictor', topic: 'machine_learning', difficulty: 'beginner', hours: 8, description: 'Train a regression model on housing data and deploy a simple prediction API.', skills: ['scikit-learn', 'Pandas', 'Flask'] },
  { id: 8, title: 'Image Classifier (CNN)', topic: 'machine_learning', difficulty: 'intermediate', hours: 20, description: 'Build and train a convolutional neural network for image classification.', skills: ['PyTorch', 'CNN', 'Transfer Learning'] },
  // Data Science
  { id: 9, title: 'EDA on Public Dataset', topic: 'data_science', difficulty: 'beginner', hours: 6, description: 'Perform exploratory data analysis on a real-world CSV dataset with visualizations.', skills: ['Pandas', 'Matplotlib', 'Seaborn'] },
  { id: 10, title: 'Sales Dashboard', topic: 'data_science', difficulty: 'intermediate', hours: 12, description: 'Interactive business intelligence dashboard using Plotly Dash.', skills: ['Plotly', 'Dash', 'Pandas'] },
];

const TOPICS = [
  { value: '', label: 'All Topics' },
  { value: 'python', label: '🐍 Python' },
  { value: 'web_development', label: '🌐 Web Dev' },
  { value: 'machine_learning', label: '🤖 ML/AI' },
  { value: 'data_science', label: '📊 Data Science' },
];

const DIFFICULTIES = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const DIFF_COLORS: Record<string, string> = {
  beginner: 'bg-green-600/20 text-green-400 border-green-500/30',
  intermediate: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  advanced: 'bg-red-600/20 text-red-400 border-red-500/30',
};

const TOPIC_ICONS: Record<string, typeof Code> = {
  python: Code,
  machine_learning: BarChart2,
  data_science: BarChart2,
  web_development: Globe,
};

export default function ProjectsPage() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = ALL_PROJECTS.filter(
    p => (!topic || p.topic === topic) && (!difficulty || p.difficulty === difficulty)
  );

  const selectCls = 'px-3 py-2 rounded-xl bg-[#1e293b] border border-[#334155] text-slate-300 text-sm focus:outline-none focus:border-violet-500 transition-colors cursor-pointer';

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="text-violet-400" size={28} />
            Project Recommendations
          </h1>
          <p className="text-slate-400 mt-2">
            Hands-on projects to reinforce your learning and build your portfolio.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">
              <Filter size={11} className="inline mr-1" />Topic
            </label>
            <select className={selectCls} value={topic} onChange={e => setTopic(e.target.value)}>
              {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Difficulty</label>
            <select className={selectCls} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>

        {/* Project List */}
        <div className="space-y-4">
          {filtered.map(project => {
            const TopicIcon = TOPIC_ICONS[project.topic] ?? Code;
            const isExpanded = expanded === project.id;
            return (
              <div
                key={project.id}
                className="bg-[#1e293b] border border-[#334155] rounded-2xl hover:border-violet-500/40 transition-all overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                  onClick={() => setExpanded(isExpanded ? null : project.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
                      <TopicIcon size={18} className="text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{project.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_COLORS[project.difficulty]}`}>
                          {project.difficulty}
                        </span>
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Clock size={11} /> {project.hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={`text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[#334155] pt-4">
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{project.description}</p>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">Skills practiced:</p>
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map(skill => (
                          <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Layers size={40} className="mx-auto mb-4 opacity-30" />
            <p>No projects match the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
