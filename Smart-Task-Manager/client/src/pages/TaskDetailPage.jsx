import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Calendar, User, Tag, MessageCircle,
  Send, Trash2, Edit2, CheckCircle2, Clock,
  AlertTriangle, Circle, Timer, XCircle,
  ArrowUp, ArrowDown, Minus, MoreHorizontal,
  Hash, Flag, Zap
} from 'lucide-react';
import { format, parseISO, isPast, formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.25)' },
  in_progress: { label: 'In Progress', icon: Timer, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  completed: { label: 'Completed', icon: CheckCircle2, color: '#C8FF00', bg: 'rgba(200,255,0,0.12)', border: 'rgba(200,255,0,0.25)' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', icon: ArrowUp, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', stripe: '#f87171' },
  high: { label: 'High', icon: ArrowUp, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', stripe: '#fb923c' },
  medium: { label: 'Medium', icon: Minus, color: '#facc15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.25)', stripe: '#facc15' },
  low: { label: 'Low', icon: ArrowDown, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)', stripe: '#4ade80' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const Icon = cfg.icon;
  return (
    <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold">
      <Icon size={13} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold">
      <Icon size={13} />
      {cfg.label}
    </span>
  );
};

const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/tasks/${id}`);
        setTask(data.data.task);
      } catch {
        toast.error('Task not found');
        navigate('/tasks');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleStatusChange = async (status) => {
    if (status === task.status) return;
    setUpdatingStatus(true);
    try {
      const { data } = await api.put(`/tasks/${id}`, { status });
      setTask(prev => ({ ...prev, ...data.data.task }));
      toast.success(`Status updated to ${STATUS_CONFIG[status]?.label}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tasks/${id}/comments`, { content: comment });
      setTask(prev => ({ ...prev, comments: [...(prev.comments || []), data.data.comment] }));
      setComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 lg:p-8" style={{ background: '#0A0A0F' }}>
        <div className="max-w-4xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl h-32 border border-[#252535]"
              style={{ background: 'linear-gradient(90deg,#1A1A25 25%,#252535 50%,#1A1A25 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          ))}
        </div>
        <style>{`@keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }`}</style>
      </div>
    );
  }

  if (!task) return null;

  const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const sCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const tags = parseTags(task.tags);
  const canEdit = isAdmin || task.owner_id === user?.id;
  const isOverdue = task.due_date &&
    task.status !== 'completed' &&
    task.status !== 'cancelled' &&
    isPast(parseISO(task.due_date));

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6"
        style={{ animation: 'fadeIn 0.4s ease forwards' }}>

        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link to="/tasks"
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Tasks
          </Link>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Main task card */}
        <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl overflow-hidden">
          {/* Priority color bar */}
          <div className="h-1" style={{ background: pCfg.stripe }} />

          <div className="p-6 lg:p-8">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle size={13} /> Overdue
                </span>
              )}
              {task.category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-[#252535] text-gray-300 border border-[#343448]">
                  <Tag size={13} /> {task.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight">
              {task.title}
            </h1>

            {/* Description */}
            {task.description ? (
              <p className="text-gray-400 leading-relaxed whitespace-pre-wrap mb-6">
                {task.description}
              </p>
            ) : (
              <p className="text-gray-600 italic mb-6 text-sm">No description provided.</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#C8FF00]/10 text-[#C8FF00]/80 border border-[#C8FF00]/20">
                    <Hash size={10} /> {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-[#252535]">
              {[
                {
                  label: 'Created by',
                  value: task.owner_name || 'Unknown',
                  icon: User,
                  color: '#9ca3af'
                },
                {
                  label: 'Assigned to',
                  value: task.assigned_to_name || 'Unassigned',
                  icon: User,
                  color: task.assigned_to_name ? '#60a5fa' : '#6b7280'
                },
                {
                  label: 'Due date',
                  value: task.due_date ? format(parseISO(task.due_date), 'MMM d, yyyy') : 'Not set',
                  icon: Calendar,
                  color: isOverdue ? '#f87171' : '#9ca3af'
                },
                {
                  label: 'Created',
                  value: task.created_at ? format(parseISO(task.created_at), 'MMM d, yyyy') : '—',
                  icon: Clock,
                  color: '#9ca3af'
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#111118] rounded-xl p-3 border border-[#252535]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={12} style={{ color }} />
                    <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="text-sm font-medium text-white truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status changer */}
        {canEdit && (
          <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flag size={15} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Update Status</h3>
              {updatingStatus && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUSES.map(s => {
                const cfg = STATUS_CONFIG[s];
                const Icon = cfg.icon;
                const isActive = task.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updatingStatus}
                    style={isActive ? {
                      background: cfg.bg,
                      borderColor: cfg.border,
                      color: cfg.color,
                    } : {}}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-50 ${isActive
                        ? 'shadow-sm'
                        : 'bg-[#111118] border-[#343448] text-gray-400 hover:border-[#4A4A6A] hover:text-white'
                      }`}>
                    <Icon size={14} />
                    <span>{cfg.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline / Activity */}
        {task.completed_at && (
          <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} className="text-[#C8FF00]" />
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Activity</h3>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-7 h-7 rounded-lg bg-[#C8FF00]/15 flex items-center justify-center">
                <CheckCircle2 size={14} className="text-[#C8FF00]" />
              </div>
              <div>
                <span className="text-white font-medium">Task completed</span>
                <span className="text-gray-500 ml-2 text-xs">
                  {format(parseISO(task.completed_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535]">
            <div className="flex items-center gap-2">
              <MessageCircle size={16} className="text-gray-400" />
              <h3 className="font-semibold text-white">
                Comments
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#252535] text-gray-400 text-xs font-mono">
                {task.comments?.length || 0}
              </span>
            </div>
          </div>

          {/* Comments list */}
          <div className="divide-y divide-[#252535]">
            {!task.comments || task.comments.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="w-12 h-12 bg-[#252535] rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageCircle size={20} className="text-gray-600" />
                </div>
                <p className="text-gray-500 text-sm">No comments yet</p>
                <p className="text-gray-600 text-xs mt-1">Be the first to add a comment</p>
              </div>
            ) : (
              task.comments.map((c, i) => (
                <div key={c.id} className="px-6 py-4 flex gap-4 hover:bg-[#1E1E2C] transition-colors"
                  style={{ animationDelay: `${i * 50}ms`, animation: 'fadeIn 0.3s ease forwards' }}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `hsl(${(c.user_name?.charCodeAt(0) || 65) * 137 % 360}, 40%, 20%)`,
                      color: `hsl(${(c.user_name?.charCodeAt(0) || 65) * 137 % 360}, 70%, 65%)`,
                      border: `1px solid hsl(${(c.user_name?.charCodeAt(0) || 65) * 137 % 360}, 40%, 30%)`
                    }}>
                    {c.user_name?.[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-white">{c.user_name}</span>
                      <span className="text-xs text-gray-500 font-mono">
                        {c.created_at ? formatDistanceToNow(parseISO(c.created_at), { addSuffix: true }) : ''}
                      </span>
                      {c.created_at && (
                        <span className="text-xs text-gray-600 hidden sm:inline">
                          · {format(parseISO(c.created_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          <div className="px-6 py-4 border-t border-[#252535] bg-[#111118]">
            <form onSubmit={handleComment} className="flex gap-3">
              {/* Current user avatar */}
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold bg-[#C8FF00]/15 text-[#C8FF00] border border-[#C8FF00]/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>

              <div className="flex-1 flex gap-2">
                <input
                  className="flex-1 bg-[#1A1A25] border border-[#343448] text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/10 transition-colors"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                      e.preventDefault();
                      handleComment(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#C8FF00] text-[#0A0A0F] hover:bg-[#AEDE00] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-600 mt-2 ml-11">Press Enter to submit</p>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This will also remove all comments. This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Keep It"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}