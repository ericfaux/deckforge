import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/api';
import { ButtonLoading } from '@/components/ui/button-loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain at least one letter and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
              Password Updated
            </h2>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully updated.
            </p>
            <Button className="w-full" onClick={() => navigate('/auth')}>
              Go to Login
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
            Set New Password
          </p>
        </div>

        <div className="border border-border bg-card p-8 space-y-6">
          {!ready ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Processing your reset link...
              </p>
              <p className="text-xs text-muted-foreground">
                If this takes too long, the link may have expired.{' '}
                <button
                  onClick={() => navigate('/auth')}
                  className="text-primary underline underline-offset-2"
                >
                  Request a new one
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
                  {error}
                </div>
              )}

              <ButtonLoading
                type="submit"
                className="w-full"
                loading={isLoading}
              >
                Update Password
              </ButtonLoading>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
