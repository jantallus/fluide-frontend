'use client';
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

interface ToastContextValue {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: 'bg-emerald-500 border-emerald-600', icon: '✅' },
  error:   { bg: 'bg-rose-500 border-rose-600',       icon: '❌' },
  info:    { bg: 'bg-sky-500 border-sky-600',         icon: 'ℹ️' },
  warning: { bg: 'bg-amber-500 border-amber-600',     icon: '⚠️' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error:   (msg: string) => addToast(msg, 'error'),
    info:    (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  const confirm = useCallback((message: string): Promise<boolean> =>
    new Promise(resolve => setConfirmState({ message, resolve }))
  , []);

  const handleConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-6 right-4 md:right-6 z-[999] flex flex-col gap-3 max-w-sm w-[calc(100%-2rem)] md:w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`${STYLES[t.type].bg} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm pointer-events-auto border animate-in slide-in-from-right-4 fade-in`}
          >
            <span className="shrink-0">{STYLES[t.type].icon}</span>
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="shrink-0 opacity-70 hover:opacity-100 font-black text-xl leading-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] p-8 max-w-sm w-full shadow-2xl">
            <p className="font-bold text-slate-800 text-sm leading-relaxed mb-8 text-center whitespace-pre-wrap">
              {confirmState.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="flex-1 bg-rose-500 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-colors shadow-sm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
