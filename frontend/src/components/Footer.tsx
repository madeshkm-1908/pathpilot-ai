import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#334155] bg-[#0f172a] mt-24">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 font-bold text-white text-lg mb-3">
            <Brain className="text-violet-500" size={22} />
            PathPilot AI
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            AI-powered personalized learning paths for students, professionals,
            and lifelong learners.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
            Product
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/onboarding" className="hover:text-violet-400 transition-colors">Get Started</Link></li>
            <li><Link to="/resources" className="hover:text-violet-400 transition-colors">Resources</Link></li>
            <li><Link to="/dashboard" className="hover:text-violet-400 transition-colors">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
            Account
          </h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/signup" className="hover:text-violet-400 transition-colors">Sign Up</Link></li>
            <li><Link to="/login" className="hover:text-violet-400 transition-colors">Log In</Link></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-slate-600 text-xs pb-6">
        © {new Date().getFullYear()} PathPilot AI — Demo Build
      </div>
    </footer>
  );
}
