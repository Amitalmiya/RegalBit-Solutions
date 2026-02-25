import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: Boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Yes, Delete',
  variant = 'danger',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger  = variant === 'danger';
  const accentCol = isDanger ? '#ef4444' : '#f59e0b';
  const accentBg  = isDanger ? 'rgba(239,68,68,0.1)'  : 'rgba(245,158,11,0.1)';
  const accentBdr = isDanger ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)';
  const btnBg     = isDanger
    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
    : 'linear-gradient(135deg, #d97706, #f59e0b)';
  const btnShadow = isDanger
    ? '0 4px 16px rgba(239,68,68,0.4)'
    : '0 4px 16px rgba(245,158,11,0.4)';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: 'rgba(2,4,12,0.92)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-[400px] rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d1226 0%, #0a0f1e 100%)',
          border: `1px solid ${accentBdr}`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px ${accentCol}15`,
          animation: 'confirmIn 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div
          className="h-[3px] w-full"
          style={{ background: `linear-gradient(90deg, ${accentCol}, ${accentCol}44, transparent)` }}
        />

        <div className="p-8">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: accentBg, border: `1.5px solid ${accentBdr}` }}
            >
              {isDanger ? '🗑️' : '⚠️'}
            </div>
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em] mb-1.5"
                style={{ color: accentCol }}
              >
                {isDanger ? 'Confirm Deletion' : 'Confirm Action'}
              </p>
              <h2 className="text-xl font-black leading-tight" style={{ color: '#f1f5f9' }}>
                Are you sure?
              </h2>
            </div>
          </div>

          <div
            className="rounded-2xl px-5 py-4 mb-7 text-sm font-medium leading-relaxed"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#94a3b8',
            }}
          >
            {message}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] hover:scale-[1.01]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; (e.target as HTMLElement).style.color = '#e2e8f0'; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.target as HTMLElement).style.color = '#94a3b8'; }}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.97] hover:scale-[1.01]"
              style={{ background: btnBg, boxShadow: btnShadow }}
            >
              {confirmLabel}
            </button>
          </div>

          <p className="text-center text-[10px] mt-4" style={{ color: '#2d3748' }}>
            Press{' '}
            <kbd
              className="px-1.5 py-0.5 rounded-md text-[9px] font-mono"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#475569', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Esc
            </kbd>{' '}
            to cancel
          </p>
        </div>
      </div>

      <style>{`
        @keyframes confirmIn {
          from { transform: scale(0.88) translateY(24px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;