import { useEffect } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

/**
 * ConfirmDialog — reusable animated confirmation modal
 *
 * Props:
 *   isOpen       boolean
 *   onConfirm    () => void
 *   onCancel     () => void
 *   title        string  (default: "Are you sure?")
 *   message      string  (default: generic message)
 *   confirmText  string  (default: "Delete")
 *   cancelText   string  (default: "Cancel")
 *   variant      "danger" | "warning"  (default: "danger")
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const accentColor = isDanger ? '#f87171' : '#fb923c';
  const accentBg = isDanger ? 'rgba(248,113,113,0.12)' : 'rgba(251,146,60,0.12)';
  const accentBorder = isDanger ? 'rgba(248,113,113,0.25)' : 'rgba(251,146,60,0.25)';
  const btnHover = isDanger ? '#ef4444' : '#f97316';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.15s ease forwards' }}
      />

      {/* Dialog box */}
      <div
        className="relative w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: '#1A1A25',
          borderColor: '#343448',
          animation: 'popIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        }}
      >
        {/* Top accent line */}
        <div className="h-0.5 w-full" style={{ background: accentColor }} />

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white transition-colors"
          style={{ background: '#252535' }}>
          <X size={14} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
            {isDanger
              ? <Trash2 size={22} style={{ color: accentColor }} />
              : <AlertTriangle size={22} style={{ color: accentColor }} />}
          </div>

          {/* Text */}
          <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ background: '#252535' }} />

        {/* Actions */}
        <div className="flex gap-3 p-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 border transition-colors hover:bg-[#343448]"
            style={{ background: '#252535', borderColor: '#343448' }}>
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: accentColor, color: isDanger ? '#fff' : '#0A0A0F' }}
            onMouseEnter={e => e.currentTarget.style.background = btnHover}
            onMouseLeave={e => e.currentTarget.style.background = accentColor}>
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}