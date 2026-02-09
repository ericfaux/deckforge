import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // If this is a chunk load failure, auto-reload once to fetch fresh assets
    if (this.isChunkLoadError(error)) {
      const key = 'chunk_error_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return;
      }
    }

    // Auto-save canvas state to localStorage before crash
    try {
      const canvasState = localStorage.getItem('deckforge-autosave');
      if (canvasState) {
        const backup = {
          timestamp: new Date().toISOString(),
          state: canvasState,
        };
        localStorage.setItem('deckforge-crash-backup', JSON.stringify(backup));
      }
    } catch (err) {
      console.error('Failed to save crash backup:', err);
    }
  }

  private isChunkLoadError(error: Error): boolean {
    const msg = error.message || '';
    return (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk') ||
      msg.includes('dynamically imported module')
    );
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorReport = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    const mailtoLink = `mailto:support@deckforge.com?subject=DeckForge Error Report&body=${encodeURIComponent(errorReport)}`;
    window.location.href = mailtoLink;
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="bg-card border-2 border-destructive p-8 space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="font-display text-2xl uppercase tracking-widest">
                  Something Went Wrong
                </h1>
                <p className="text-muted-foreground">
                  DeckForge encountered an unexpected error
                </p>
              </div>

              {/* Error details (collapsed) */}
              <details className="bg-secondary p-4 rounded border border-border">
                <summary className="cursor-pointer text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
                  Technical Details (click to expand)
                </summary>
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-mono bg-background p-3 rounded overflow-auto max-h-40">
                    <p className="text-destructive font-semibold">
                      {this.state.error?.message}
                    </p>
                    {this.state.error?.stack && (
                      <pre className="mt-2 text-muted-foreground text-[10px] whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              </details>

              {/* Recovery info */}
              <div className="bg-accent/10 border border-accent/30 p-4 rounded">
                <p className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-lg">💾</span>
                  <span>
                    <strong>Your work may be saved!</strong> We automatically backed up your design before the crash. 
                    Try reloading the page to recover it.
                  </span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={this.handleReportBug}
                  variant="outline"
                  className="gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Bug
                </Button>
              </div>

              {/* Help text */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  If this keeps happening,{' '}
                  <a href="/designs" className="text-accent hover:underline">
                    try starting a new design
                  </a>
                  {' '}or{' '}
                  <a href="mailto:support@deckforge.com" className="text-accent hover:underline">
                    contact support
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
