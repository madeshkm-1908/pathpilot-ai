import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Menu, X, User as UserIcon, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/resources', label: 'Resources' },
  { to: '/dashboard', label: 'Dashboard' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#0f172a]/90 backdrop-blur border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
          <Brain className="text-violet-500" size={26} />
          PathPilot AI
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors ${
                pathname === to
                  ? 'text-violet-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-4 pl-2 border-l border-[#334155]">
              <div className="flex items-center gap-2 text-sm text-slate-300 font-medium">
                <div className="w-8 h-8 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-300 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-28 truncate">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#334155] text-slate-400 hover:text-white hover:border-violet-500/50 text-sm transition-all"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-300"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#1e293b] border-t border-[#334155] px-4 py-4 flex flex-col gap-4">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium ${
                pathname === to ? 'text-violet-400' : 'text-slate-300'
              }`}
            >
              {label}
            </Link>
          ))}

          {user ? (
            <div className="pt-3 border-t border-[#334155] flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                <UserIcon size={16} className="text-violet-400" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left py-2 text-sm text-red-400 flex items-center gap-2"
              >
                <LogOut size={16} /> Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#334155] flex flex-col gap-3">
              <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-slate-300">
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="text-center px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
