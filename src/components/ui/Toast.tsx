import React from "react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = "info", onClose }) => {
  return (
    <div
      className={`fixed top-6 left-1/2 z-50 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg font-semibold text-center transition-all
        ${type === "error" ? "bg-red-600 text-white" : type === "success" ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"}
      `}
      role="alert"
    >
      {message}
      {onClose && (
        <button
          className="ml-4 text-white/80 hover:text-white font-bold"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      )}
    </div>
  );
};
