import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/api';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

function validateEmail(email: string): string | null {
  if (!email) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address';
  return null;
}

function getPasswordStrength(password: string) {
  const checks = {
    hasLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label = score === 0 ? '' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong';
  return { score, label, checks };
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, label, checks } = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const colors = ['', 'bg-destructive', 'bg-yellow-500', 'bg-primary'];
  const textColors = ['', 'text-destructive', 'text-yellow-500', 'text-primary'];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm transition-colors ${
              i <= score ? colors[score] : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs font-medium ${textColors[score]}`}>{label}</span>
      </div>
      <ul className="text-xs space-y-0.5 text-muted-foreground">
        <li className={checks.hasLength ? 'text-primary' : ''}>
          {checks.hasLength ? '✓' : '○'} At least 8 characters
        </li>
        <li className={checks.hasLetter ? 'text-primary' : ''}>
          {checks.hasLetter ? '✓' : '○'} Contains a letter
        </li>
        <li className={checks.hasNumber ? 'text-primary' : ''}>
          {checks.hasNumber ? '✓' : '○'} Contains a number
        </li>
      </ul>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signup, login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const isPasswordValid =
    passwordStrength.checks.hasLength &&
    passwordStrength.checks.hasLetter &&
    passwordStrength.checks.hasNumber;

  const handleEmailBlur = () => {
    if (email) {
      setEmailError(validateEmail(email));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setForgotError(null);

    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    if (isForgot) {
      setForgotLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setForgotSuccess(true);
      } catch (err) {
        setForgotError(err instanceof Error ? err.message : 'Failed to send reset email');
      } finally {
        setForgotLoading(false);
      }
      return;
    }

    if (isSignup && !isPasswordValid) {
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        await signup(email, password, username);
        setSignupSuccess(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setSocialLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      setSocialLoading(null);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'forgot') => {
    setMode(newMode);
    clearError();
    setEmailError(null);
    setForgotError(null);
    setSignupSuccess(false);
    setForgotSuccess(false);
  };

  // Signup success screen
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 page-transition">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="font-display text-4xl uppercase tracking-widest">
              Deck<span className="text-primary">Forge</span>
            </h1>
          </div>
          <div className="border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-display text-xl uppercase tracking-widest">
              Check Your Email
            </h2>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to{' '}
              <span className="text-foreground font-medium">{email}</span>.
              Check your inbox and click the link to verify your account.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => switchMode('login')}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password success screen
  if (forgotSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 page-transition">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="font-display text-4xl uppercase tracking-widest">
              Deck<span className="text-primary">Forge</span>
            </h1>
          </div>
          <div className="border border-border bg-card p-8 space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="font-display text-xl uppercase tracking-widest">
              Email Sent
            </h2>
            <p className="text-sm text-muted-foreground">
              If an account exists for{' '}
              <span className="text-foreground font-medium">{email}</span>,
              you'll receive a password reset link shortly.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => switchMode('login')}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 page-transition">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-display text-4xl uppercase tracking-widest">
            Deck<span className="text-primary">Forge</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground uppercase tracking-widest">
            Fingerboard Graphics Editor
          </p>
        </div>

        <div className="border border-border bg-card p-8 space-y-6">
          {!isForgot && (
            <div className="flex gap-2">
              <Button
                variant={isLogin ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => switchMode('login')}
              >
                Login
              </Button>
              <Button
                variant={isSignup ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </Button>
            </div>
          )}

          {isForgot && (
            <div>
              <h2 className="font-display text-lg uppercase tracking-widest text-center">
                Reset Password
              </h2>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Enter your email to receive a reset link
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fingerboarder123"
                  required={isSignup}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={handleEmailBlur}
                placeholder="you@example.com"
                required
                className={emailError ? 'border-destructive' : ''}
              />
              {emailError && (
                <p className="text-xs text-destructive">{emailError}</p>
              )}
            </div>

            {!isForgot && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={isSignup ? 8 : 6}
                />
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Forgot Password?
                  </button>
                )}
                {isSignup && <PasswordStrengthIndicator password={password} />}
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
                {error}
              </div>
            )}

            {forgotError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
                {forgotError}
              </div>
            )}

            <ButtonLoading
              type="submit"
              className="w-full"
              loading={isForgot ? forgotLoading : isLoading}
              disabled={
                (isForgot ? forgotLoading : isLoading) ||
                (isSignup && password.length > 0 && !isPasswordValid)
              }
            >
              {isForgot ? 'Send Reset Link' : isLogin ? 'Login' : 'Create Account'}
            </ButtonLoading>
          </form>

          {isForgot && (
            <Button
              variant="link"
              className="w-full text-xs uppercase tracking-widest"
              onClick={() => switchMode('login')}
            >
              Back to Login
            </Button>
          )}

          {!isForgot && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground tracking-widest">
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-background border border-border hover:border-primary/50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {socialLoading === 'google' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('github')}
                  disabled={!!socialLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-background border border-border hover:border-primary/50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {socialLoading === 'github' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GitHubIcon />
                  )}
                  Continue with GitHub
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate('/')}
              className="text-xs uppercase tracking-widest"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
