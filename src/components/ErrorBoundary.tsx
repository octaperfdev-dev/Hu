import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      let errorDetails: any = null;

      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.operationType) {
          errorMessage = parsedError.error;
          errorDetails = parsedError;
        }
      } catch (e) {
        // Not a JSON error, use as is
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-slate-700 mb-4">{errorMessage}</p>
            {errorDetails && (
              <div className="bg-slate-100 p-4 rounded-lg text-sm font-mono text-slate-600 overflow-auto">
                <p><strong>Operation:</strong> {errorDetails.operationType}</p>
                <p><strong>Path:</strong> {errorDetails.path}</p>
              </div>
            )}
            <button
              className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
