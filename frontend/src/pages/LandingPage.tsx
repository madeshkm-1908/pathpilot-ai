import { Link } from 'react-router-dom';
import { Brain, BookOpen, Target, TrendingUp, Zap, Users, Star, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Personalized Paths',
    desc: 'Tailored roadmaps built around your skill level, goals, learning style, and schedule.',
  },
  {
    icon: BookOpen,
    title: 'Curated Resources',
    desc: 'Handpicked courses, articles, and videos from top providers like Coursera, Khan Academy, and more.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    desc: 'Visual dashboards to monitor your weekly progress and celebrate milestones.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Suggestions',
    desc: 'Smart recommendations that adapt as you complete modules and improve your skills.',
  },
  {
    icon: Users,
    title: 'Community Projects',
    desc: 'Practical project ideas that build your portfolio and reinforce real-world skills.',
  },
  {
    icon: Star,
    title: 'Flexible & Budget-Aware',
    desc: 'Free-first options with paid alternatives. You decide what fits your timeline and wallet.',
  },
];

const testimonials = [
  {
    name: 'Priya S.',
    role: 'Software Engineer',
    quote: 'PathPilot helped me structure 6 months of self-study into a coherent roadmap. I landed my first dev role!',
  },
  {
    name: 'Marcus R.',
    role: 'Data Analyst',
    quote: 'I\'d been procrastinating learning ML for a year. PathPilot\'s weekly plan made it actually manageable.',
  },
  {
    name: 'Anika T.',
    role: 'UX Designer',
    quote: 'The resource explorer is a gem. Filtered by free courses and got a complete frontend curriculum in minutes.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-700/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm mb-8">
            <Brain size={14} />
            AI-Powered Learning Paths
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Your Personal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
              {' '}Learning Pilot
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Tell us your goal, skill level, and available hours — PathPilot AI builds you a
            step-by-step learning roadmap with curated resources, projects, and weekly checkpoints.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/onboarding"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-lg transition-all shadow-lg shadow-violet-900/40"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link
              to="/resources"
              className="px-8 py-4 rounded-xl border border-slate-600 hover:border-violet-500 text-slate-300 hover:text-white font-semibold text-lg transition-all"
            >
              Browse Resources
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-500 text-sm">
            {['Beginner-friendly', 'No credit card needed', 'Free resources first'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-violet-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-[#1e293b]/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Everything you need to learn faster
          </h2>
          <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
            One platform to plan, track, and execute your entire learning journey.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-6 rounded-2xl bg-[#1e293b] border border-[#334155] hover:border-violet-500/50 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4 group-hover:bg-violet-600/30 transition-colors">
                  <Icon size={22} className="text-violet-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-14">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Tell us your goal', desc: 'Fill in a quick onboarding form about your skill level, target, and schedule.' },
              { step: '02', title: 'Get your roadmap', desc: 'PathPilot generates a week-by-week learning path with curated resources.' },
              { step: '03', title: 'Learn & track', desc: 'Follow your roadmap, complete projects, and track your progress on the dashboard.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {step}
                </div>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-[#1e293b]/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Learners love PathPilot</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, quote }) => (
              <div key={name} className="p-6 rounded-2xl bg-[#0f172a] border border-[#334155]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{quote}"</p>
                <div>
                  <p className="text-white font-medium text-sm">{name}</p>
                  <p className="text-slate-500 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Start your learning journey today</h2>
          <p className="text-slate-400 mb-8">
            It takes 3 minutes to set up your personalized roadmap.
          </p>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 text-white font-bold text-lg transition-all shadow-xl shadow-violet-900/40"
          >
            Build My Learning Path <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
