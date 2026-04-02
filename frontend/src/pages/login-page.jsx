import { useState } from 'react';
import { Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { login, register } from '@/services/auth-service';

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hostel, setHostel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitLabel = mode === 'login' ? 'Sign In' : 'Create Account';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        await register({ email, password, hostel, roomNumber, year, branch });
      } else {
        await login({ email, password });
      }

      onLogin();
    } catch (apiError) {
      setError(apiError.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-white shadow-card">
            HM
          </div>
          <CardTitle className="text-2xl font-semibold">Hostel Mess Management</CardTitle>
          <CardDescription>Secure access for mess operations and student engagement</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {mode === 'signup' ? (
              <>
                <Input
                  type="text"
                  placeholder="Hostel (optional)"
                  value={hostel}
                  onChange={(event) => setHostel(event.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Room Number (optional)"
                  value={roomNumber}
                  onChange={(event) => setRoomNumber(event.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Year (optional)"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Branch (optional)"
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                />
              </>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-danger/40 bg-danger/20 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : submitLabel}
            </Button>
          </form>

          <Button variant="secondary" className="w-full">
            <Chrome className="h-4 w-4" />
            Continue with Google
          </Button>

          <p className="text-center text-xs text-muted">
            Use your hostel account credentials. Signup creates a student account instantly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
