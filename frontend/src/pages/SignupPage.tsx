import { Link } from 'react-router-dom';
import { Brain, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function SignupPage() {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white font-bold text-xl mb-6">
            <Brain className="text-violet-500" size={26} />
            PathPilot AI
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2 text-sm">Start your personalized learning journey</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8">
          {/* Auth Coming Soon Banner */}
          <div className="flex items-center gap-2 bg-violet-600/10 border border-violet-500/30 rounded-xl px-4 py-3 mb-6 text-violet-400 text-sm">
            <Lock size={14} />
            Authentication will be enabled in the next release (Supabase Auth).
          </div>

          <form onSubmit={e => e.preventDefault()} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Alex Johnson"
                className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  className="w-full px-4 pr-10 py-3 rounded-xl bg-[#0f172a] border border-[#334155] text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors mt-2"
            >
              Create Account (Coming Soon)
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-[#334155] text-center">
            <p className="text-slate-500 text-xs">
              In the meantime, try the app without an account:
            </p>
            <Link
              to="/onboarding"
              className="inline-block mt-3 px-5 py-2 rounded-xl border border-violet-500/50 text-violet-400 hover:bg-violet-600/10 text-sm transition-colors"
            >
              Try onboarding without signup →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
