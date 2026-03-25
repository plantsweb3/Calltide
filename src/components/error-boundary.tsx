"use client";

import { Component } from "react";
import { reportError } from "@/lib/error-reporting";
import Button from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo.componentStack);
    reportError("ErrorBoundary caught error", error, {
      extra: { componentStack: errorInfo?.componentStack },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="flex min-h-[300px] items-center justify-center rounded-xl p-8"
          style={{
            background: "var(--db-card)",
            border: "1px solid var(--db-border)",
          }}
        >
          <div className="text-center">
            <p className="text-lg font-medium" style={{ color: "var(--db-text)" }}>
              Something went wrong
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--db-text-muted)" }}>
              An unexpected error occurred
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => this.setState({ hasError: false })}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
