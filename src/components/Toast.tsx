import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-700/60 text-rose-100'
                : 'bg-zinc-900/90 border-zinc-700/60 text-zinc-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm leading-snug">{toast.title}</div>
              {toast.message && (
                <div className="text-xs opacity-80 mt-0.5 leading-relaxed break-words">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
