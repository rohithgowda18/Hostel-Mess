import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '@/services/auth-service';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  GraduationCap,
  DoorOpen,
  ArrowRight,
  Shield,
  UtensilsCrossed,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900 shadow-elevated overflow-hidden">
        
        {/* Left / Top Hero Branding Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle decorative circles */}
          <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">HostelOS</h1>
                <p className="text-xs text-blue-200">University Campus Living Portal</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                Streamlined hostel & mess management.
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                Live daily mess menus, roommate directories, instant QR counter check-ins, and peer consensus reports in one unified portal.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Live verified meal consensus & menus</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Real-time room allocation & resident directory</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Mess attendance forecasting & QR scanner</span>
              </div>
            </div>
          </div>

          {/* Quick Demo Credentials */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/15">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2">
              Quick Demo Access
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fillDemoStudent}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-medium text-white"
              >
                Fill Student Demo
              </button>
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all font-medium text-white"
              >
                Fill Warden / Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          {/* Tabs: Sign In / Create Account */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 border border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => { setView('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                view === 'login'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setView('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                view === 'register'
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Register as Student
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* ─────────────── LOGIN FORM ─────────────── */}
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="login-email">
                  University Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    placeholder="student@hostel.app"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-bold mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          ) : (
            /* ─────────────── REGISTER FORM ─────────────── */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  University Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="your.name@university.edu"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hostel Block
                  </label>
                  <select
                    value={regData.hostel}
                    onChange={(e) => setRegData({ ...regData, hostel: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 outline-none"
                  >
                    <option value="">Select Hostel Block</option>
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
                    placeholder="e.g. FR104 / 204"
                    value={regData.roomNumber}
                    onChange={(e) => setRegData({ ...regData, roomNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={regData.year}
                    onChange={(e) => setRegData({ ...regData, year: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 outline-none"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Branch / Department
                  </label>
                  <Input
                    placeholder="e.g. Computer Science, Mechanical..."
                    value={regData.branch}
                    onChange={(e) => setRegData({ ...regData, branch: e.target.value })}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-bold mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
