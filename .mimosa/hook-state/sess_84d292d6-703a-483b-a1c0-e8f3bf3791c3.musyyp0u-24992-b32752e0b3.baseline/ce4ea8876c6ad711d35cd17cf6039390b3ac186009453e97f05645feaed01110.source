import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh w-full items-center justify-center bg-bg px-6">
          <div className="glass-card max-w-xl w-full p-10 text-center border border-danger/20">
            <p className="text-xs uppercase tracking-[0.25em] text-danger mb-3">System Error</p>
            <h1 className="font-serif text-5xl font-bold text-white mb-3">Unexpected Error</h1>
            <p className="text-text-muted text-sm mb-2">Something went wrong. Your data is safe.</p>
            {this.state.message && (
              <p className="text-[11px] font-mono text-slate-500 bg-black/40 rounded-lg px-3 py-2 mb-6 break-all">
                {this.state.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-gold"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
