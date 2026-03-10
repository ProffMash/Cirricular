import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { GraduationCap, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      return;
    }
    if (result.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar p-10">
        <div className="flex items-center gap-3">
          <div className="bg-sidebar-primary rounded-xl p-2">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-sidebar-foreground font-bold text-xl">EduActivity</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight mb-4">
            Manage Your<br />
            <span className="text-sidebar-primary">Co-Curricular</span><br />
            Activities
          </h1>
          <p className="text-sidebar-foreground/60 text-base leading-relaxed">
            Join thousands of students discovering and registering for exciting events, sports, arts, and academic activities at your institution.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Active Events', value: '10+' },
              { label: 'Registered Students', value: '500+' },
              { label: 'Categories', value: '6' },
              { label: 'Activities This Year', value: '50+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-sidebar-accent rounded-xl p-4">
                <div className="text-2xl font-bold text-sidebar-primary">{stat.value}</div>
                <div className="text-sidebar-foreground/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sidebar-foreground/30 text-xs">© 2026 EduActivity System</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-primary rounded-xl p-2">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-foreground font-bold text-lg">EduActivity</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
