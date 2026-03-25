'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#faf8ff]">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-[#ba1a1a]/10 text-center space-y-6">
            <div className="w-16 h-16 bg-[#ffdad6] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-[#ba1a1a]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#131b2e]">Ops! Algo deu errado</h2>
              <p className="text-[#45464d] text-sm">
                Ocorreu um erro inesperado. Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 bg-slate-50 rounded-lg text-left overflow-auto max-h-40">
                <code className="text-xs text-[#ba1a1a]">{this.state.error.message}</code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-[#00174b] transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
