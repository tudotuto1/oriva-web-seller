"use client";

import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen, title, message, confirmLabel = "Supprimer", onConfirm, onCancel, loading
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-oriva-card border border-oriva-border rounded-xl p-6 max-w-sm w-full shadow-modal animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-oriva-danger/10 rounded-lg">
            <AlertTriangle size={20} className="text-oriva-danger" />
          </div>
          <h3 className="font-display text-xl text-oriva-cream">{title}</h3>
        </div>
        <p className="text-oriva-muted text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="oriva-btn-ghost flex-1" disabled={loading}>
            Annuler
          </button>
          <button onClick={onConfirm} className="oriva-btn-danger flex-1 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
