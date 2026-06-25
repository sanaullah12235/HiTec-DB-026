'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
};

const variantIcons: Record<AlertVariant, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '✕',
};

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  onClose?: () => void;
}

export function Alert({ variant = 'info', message, onClose }: AlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm ${variantStyles[variant]}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-xs font-bold">
        {variantIcons[variant]}
      </span>
      <span className="flex-1 leading-5">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 rounded-lg p-0.5 opacity-60 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}

export function AlertList({ alerts }: { alerts: { id: string; variant?: AlertVariant; message: string }[] }) {
  if (alerts.length === 0) return null;
  return (
    <AnimatePresence>
      <div className="flex flex-col gap-2">
        {alerts.map((a) => (
          <Alert key={a.id} variant={a.variant} message={a.message} />
        ))}
      </div>
    </AnimatePresence>
  );
}
