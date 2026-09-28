import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '@/services/auth-service';
import {
  Utensils,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [view, setView] = useState('login'); // 'login' | 'register'
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    hostel: '',
    roomNumber: '',
    year: '1',
    branch: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginData.email || !loginData.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: loginData.email, password: loginData.password });
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regData.email || !regData.password) {
      setError('Email and password are required.');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (regData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: regData.email,
        password: regData.password,
        hostel: regData.hostel,
        roomNumber: regData.roomNumber,
        year: regData.year,
        branch: regData.branch,
      });
      if (onLogin) onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setLoginData({
      email: 'student@hostel.app',
      password: 'password123'
    });
    setError('');
  };

  const fillDemoAdmin = () => {
    setLoginData({
      email: 'admin@hostel.app',
      password: 'adminpassword'
    });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        
        {/* Left Informational Sidebar */}
        <div className="md:col-span-5 bg-slate-900 text-slate-100 p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-teal-700 text-white flex items-center justify-center shadow-xs">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">
                  Hostel Mess Pro
                </h1>
                <p className="text-[11px] text-slate-400">Campus Dining Utility</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-lg font-bold text-white leading-snug">
                Real-time dining transparency for university residents.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Know what is actually being served right now through student consensus reports, meal photos, and verified dining schedules.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Live serving window enforcement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Peer-verified plate evidence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span>Dining pass & QR counter check-in</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="mt-8 pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Demo Access
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={fillDemoStudent}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors font-medium cursor-pointer"
              >
                Fill Student Demo <span className="text-[10px] text-slate-400 font-mono">(student@hostel.app)</span>
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-colors font-medium cursor-pointer"
              >
                Fill Admin Demo <span className="text-[10px] text-slate-400 font-mono">(admin@hostel.app)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white dark:bg-slate-900">
          {/* Segmented Controls: Sign In / Register */}
          <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-1 mb-5 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                view === 'login'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('register'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                view === 'register'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Register Resident
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────── LOGIN FORM ─────────────── */}
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="login-email">
                  University Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    placeholder="student@hostel.app"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-9 h-9.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-9 pr-9 h-9.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 shadow-xs"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </form>
          ) : (
            /* ─────────────── REGISTER FORM ─────────────── */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  University Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="resident@hostel.app"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <Input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <Input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hostel Block
                  </label>
                  <select
                    value={regData.hostel}
                    onChange={(e) => setRegData({ ...regData, hostel: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 outline-none"
                  >
                    <option value="">Select Block</option>
                    <option value="Freshers Block">Freshers Block</option>
                    <option value="Aryabhatta Hostel">Aryabhatta Hostel</option>
                    <option value="NNRI Hostel">NNRI Hostel</option>
                    <option value="PG Hostel">PG Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Room Number
                  </label>
                  <Input
                    placeholder="e.g. 204"
                    value={regData.roomNumber}
                    onChange={(e) => setRegData({ ...regData, roomNumber: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={regData.year}
                    onChange={(e) => setRegData({ ...regData, year: e.target.value })}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 outline-none"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <Input
                    placeholder="e.g. Computer Science"
                    value={regData.branch}
                    onChange={(e) => setRegData({ ...regData, branch: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs h-10 shadow-xs"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
