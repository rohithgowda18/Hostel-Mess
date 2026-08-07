import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '@/services/auth-service';

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
    year: '',
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
      setError('Please fill in all fields.');
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
      // Send fields matching the backend RegisterRequest DTO
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

  const switchToRegister = () => { setView('register'); setError(''); };
  const switchToLogin = () => { setView('login'); setError(''); };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-[Inter,sans-serif]">
      {/* Background Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#0056b3]/20 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-[#80f98b]/20 blur-[100px]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-xl shadow-sm border border-[#c2c6d4] p-5 md:p-7 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#0056b3]/10 mb-4 text-[#003f87]">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <h1 className="text-[32px] font-bold text-[#003f87] leading-10">MessMaster</h1>
          <p className="text-sm text-[#424752] mt-1">University Hostel Dining Portal</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* ─────────────── LOGIN VIEW ─────────────── */}
        {view === 'login' && (
          <div>
            <h2 className="text-[22px] font-medium text-[#191c1d] mb-6 text-center">Welcome Back</h2>
            <form className="space-y-4" onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="login-email">
                  University Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#424752] text-[20px]">mail</span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={loginData.email}
                    onChange={e => setLoginData(d => ({ ...d, email: e.target.value }))}
                    placeholder="student@university.edu"
                    className="w-full bg-[#f1f3f5] border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-3 pl-10 pr-4 rounded-t-md outline-none text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="login-password">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#424752] text-[20px]">lock</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={loginData.password}
                    onChange={e => setLoginData(d => ({ ...d, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full bg-[#f1f3f5] border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-3 pl-10 pr-10 rounded-t-md outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-3 text-[#424752] hover:text-[#191c1d] transition-colors"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <a href="#" className="text-[#003f87] text-[11px] font-medium hover:underline">Forgot Password?</a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003f87] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 mt-2"
              >
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-[#424752]">
                New resident?{' '}
                <button onClick={switchToRegister} className="text-[#003f87] font-bold hover:underline ml-1">
                  Register Here
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ─────────────── REGISTER VIEW ─────────────── */}
        {view === 'register' && (
          <div>
            <h2 className="text-[22px] font-medium text-[#191c1d] mb-5 text-center">Student Registration</h2>
            <form className="space-y-5" onSubmit={handleRegister} noValidate>

              {/* ── Account Credentials ── */}
              <div className="space-y-4 bg-[#f3f4f5] p-4 rounded-lg border border-[#c2c6d4]">
                <h3 className="text-sm font-semibold text-[#003f87] border-b border-[#c2c6d4] pb-2">Account Credentials</h3>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-email">University Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#424752] text-[18px]">mail</span>
                    <input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={regData.email}
                      onChange={e => setRegData(d => ({ ...d, email: e.target.value }))}
                      placeholder="student@university.edu"
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 pl-9 pr-3 rounded-t-md outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-password">Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#424752] text-[18px]">lock</span>
                    <input
                      id="reg-password"
                      type={showRegPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regData.password}
                      onChange={e => setRegData(d => ({ ...d, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 pl-9 pr-10 rounded-t-md outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(s => !s)}
                      className="absolute right-3 top-2 text-[#424752]"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[18px]">{showRegPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-confirm">Confirm Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#424752] text-[18px]">lock_reset</span>
                    <input
                      id="reg-confirm"
                      type={showRegPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={regData.confirmPassword}
                      onChange={e => setRegData(d => ({ ...d, confirmPassword: e.target.value }))}
                      placeholder="Re-enter password"
                      className={`w-full bg-white border-0 border-b-2 transition-colors py-2 pl-9 pr-3 rounded-t-md outline-none text-sm ${
                        regData.confirmPassword && regData.password !== regData.confirmPassword
                          ? 'border-[#ba1a1a] text-[#ba1a1a]'
                          : 'border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d]'
                      }`}
                    />
                  </div>
                  {regData.confirmPassword && regData.password !== regData.confirmPassword && (
                    <p className="text-[11px] text-[#ba1a1a] mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* ── Hostel Details ── */}
              <div className="space-y-4 bg-[#f3f4f5] p-4 rounded-lg border border-[#c2c6d4]">
                <h3 className="text-sm font-semibold text-[#003f87] border-b border-[#c2c6d4] pb-2">Hostel Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-hostel">Hostel Block</label>
                    <select
                      id="reg-hostel"
                      value={regData.hostel}
                      onChange={e => setRegData(d => ({ ...d, hostel: e.target.value }))}
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 px-3 rounded-t-md outline-none text-sm appearance-none"
                    >
                      <option value="" disabled>Select Block</option>
                      <option value="Freshers Block">Freshers Block (1st Year)</option>
                      <option value="Aryabhatta G">Aryabhatta G Block</option>
                      <option value="Aryabhatta F">Aryabhatta F Block</option>
                      <option value="Aryabhatta S">Aryabhatta S Block</option>
                      <option value="NNRI Hostel">NNRI Hostel</option>
                      <option value="PG Hostel">PG Hostel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-room">Room Number</label>
                    <input
                      id="reg-room"
                      type="text"
                      value={regData.roomNumber}
                      onChange={e => setRegData(d => ({ ...d, roomNumber: e.target.value }))}
                      placeholder="e.g. 204"
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 px-3 rounded-t-md outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-branch">Branch</label>
                    <select
                      id="reg-branch"
                      value={regData.branch}
                      onChange={e => setRegData(d => ({ ...d, branch: e.target.value }))}
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 px-3 rounded-t-md outline-none text-sm appearance-none"
                    >
                      <option value="" disabled>Select Branch</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Civil">Civil</option>
                      <option value="Chemical">Chemical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#424752] mb-1" htmlFor="reg-year">Year</label>
                    <select
                      id="reg-year"
                      value={regData.year}
                      onChange={e => setRegData(d => ({ ...d, year: e.target.value }))}
                      className="w-full bg-white border-0 border-b-2 border-[#c2c6d4] focus:border-[#003f87] text-[#191c1d] transition-colors py-2 px-3 rounded-t-md outline-none text-sm appearance-none"
                    >
                      <option value="" disabled>Select Year</option>
                      <option value="1">First Year</option>
                      <option value="2">Second Year</option>
                      <option value="3">Third Year</option>
                      <option value="4">Fourth Year</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-1">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="w-1/3 border border-[#003f87] text-[#003f87] rounded-lg py-3 text-sm font-bold hover:bg-[#e1e3e4]/50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-[#003f87] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 transition-colors shadow-sm active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
