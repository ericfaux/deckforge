import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Lightweight error boundary for individual components
 * Shows inline error UI instead of crashing the whole page
 * 
 * Usage:
 * <ComponentErrorBoundary componentName="Inspector">
 *   <Inspector />
 * </ComponentErrorBoundary>
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Component';
    console.error(`${componentName} error:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const componentName = this.props.componentName || 'This component';

      return (
        <div className="flex items-center justify-center p-8 bg-destructive/5 border border-destructive/20 rounded-lg">
          <div className="max-w-md space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm">
                {componentName} Failed to Load
              </h3>
              <p className="text-xs text-muted-foreground">
                Something went wrong. Try refreshing or continue working on other parts.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left bg-background/50 p-3 rounded border border-border">
                <summary className="cursor-pointer text-xs font-medium mb-2 hover:text-foreground transition-colors">
                  Error details
                </summary>
                <pre className="text-[10px] overflow-auto text-muted-foreground font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <Button 
              onClick={this.handleReset} 
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
