"use client";
import React from 'react';
import { RefreshCw, AlertTriangle, WifiOff } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  /** Fallback personnalisé — si absent, utilise le fallback par défaut selon la variante */
  fallback?: React.ReactNode;
  /** Zone identifiée dans les logs (ex: "planning/fullcalendar", "booking/tunnel") */
  zone?: string;
  /** Variante visuelle selon le contexte */
  variant?: 'admin' | 'public' | 'widget';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ── Composant principal ───────────────────────────────────────────────────────

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const zone = this.props.zone ?? 'unknown';
    console.error(`[ErrorBoundary:${zone}]`, error.message);
    console.error(info.componentStack);
    // Envoie l'erreur à Sentry si configuré (no-op sinon)
    Sentry.captureException(error, {
      extra: { zone, componentStack: info.componentStack },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    const { variant = 'admin', zone } = this.props;
    const { error } = this.state;

    if (variant === 'public') {
      return <PublicFallback onReset={this.handleReset} />;
    }
    if (variant === 'widget') {
      return <WidgetFallback zone={zone} onReset={this.handleReset} />;
    }
    return <AdminFallback error={error} zone={zone} onReset={this.handleReset} />;
  }
}

// ── Fallback admin (page entière) ─────────────────────────────────────────────

function AdminFallback({ error, zone, onReset }: { error: Error | null; zone?: string; onReset: () => void }) {
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="bg-white rounded-[30px] border-2 border-rose-100 p-8 max-w-lg w-full shadow-sm">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={28} className="text-rose-500" />
        </div>
        <h2 className="text-xl font-black uppercase italic text-slate-900 mb-2">
          Une erreur est survenue
        </h2>
        <p className="text-slate-500 font-medium text-sm mb-1">
          {zone ? `Zone : ${zone}` : 'Erreur inattendue'}
        </p>
        {isDev && error && (
          <pre className="mt-4 text-left text-xs text-rose-600 bg-rose-50 rounded-xl p-4 overflow-auto max-h-40 border border-rose-100">
            {error.message}
          </pre>
        )}
        <button
          onClick={onReset}
          className="mt-6 flex items-center gap-2 mx-auto bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform"
        >
          <RefreshCw size={14} /> Réessayer
        </button>
      </div>
    </div>
  );
}

// ── Fallback public (tunnel de réservation en iframe) ─────────────────────────

function PublicFallback({ onReset }: { onReset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-white">
      <div className="max-w-sm w-full">
        <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={30} className="text-sky-400" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-slate-900 mb-3">
          Oups !
        </h2>
        <p className="text-slate-500 font-medium mb-2 leading-relaxed">
          Une erreur inattendue s'est produite.
        </p>
        <p className="text-slate-400 text-sm font-medium mb-8">
          Rechargez la page ou revenez dans quelques instants.
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-2 mx-auto bg-sky-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-sky-600 transition-colors shadow-md"
        >
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    </div>
  );
}

// ── Fallback widget (zone partielle dans une page admin) ──────────────────────

function WidgetFallback({ zone, onReset }: { zone?: string; onReset: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center p-8 rounded-[20px] border-2 border-dashed border-rose-200 bg-rose-50/50 text-center gap-3">
      <AlertTriangle size={20} className="text-rose-400" />
      <p className="text-sm font-bold text-rose-600">
        {zone ? `Erreur dans "${zone}"` : 'Ce bloc a rencontré une erreur'}
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs font-black uppercase text-rose-500 hover:text-rose-700 transition-colors"
      >
        <RefreshCw size={12} /> Réessayer
      </button>
    </div>
  );
}
