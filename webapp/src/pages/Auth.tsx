import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const { signup, login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, username);
      }
      navigate('/');
    } catch (err) {
      // Error is already set in store
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
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
          <div className="flex gap-2">
            <Button
              variant={isLogin ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setIsLogin(true)}
            >
              Login
            </Button>
            <Button
              variant={!isLogin ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fingerboarder123"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

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
