'use client';

import * as React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class TrendsErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Erro na aba Tendências', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Falha ao carregar Tendências — tente novamente.
        </div>
      );
    }

    return this.props.children;
  }
}

export default TrendsErrorBoundary;

