import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className = "" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-2 sm:p-6"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-white/90 dark:bg-slate-900/95 rounded-xl shadow-lg max-w-[95vw] sm:max-w-2xl md:max-w-3xl w-full p-4 sm:p-8 md:p-10 relative overflow-y-auto max-h-[95vh] ${className}`}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-2xl font-bold z-10"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
        {title && <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
