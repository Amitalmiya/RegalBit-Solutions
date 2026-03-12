import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Plus, Search, ChevronRight, Trash2, Edit2,
  CheckSquare, AlertTriangle, X, Calendar, Tag,
  User, Clock, Filter, LayoutGrid, List,
  CheckCircle2, Circle, Timer, XCircle, ArrowUp,
  ArrowDown, Minus
} from 'lucide-react';
import { format, parseISO, isAfter, isPast } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const STATUS_CONFIG = {
  todo: { label: 'To Do', icon: Circle, color: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.25)' },
  in_progress: { label: 'In Progress', icon: Timer, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
  completed: { label: 'Completed', icon: CheckCircle2, color: '#C8FF00', bg: 'rgba(200,255,0,0.12)', border: 'rgba(200,255,0,0.25)' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
};

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', icon: ArrowUp, color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', bar: '#f87171' },
  high: { label: 'High', icon: ArrowUp, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.25)', bar: '#fb923c' },
  medium: { label: 'Medium', icon: Minus, color: '#facc15', bg: 'rgba(250,204,21,0.12)', border: 'rgba(250,204,21,0.25)', bar: '#facc15' },
  low: { label: 'Low', icon: ArrowDown, color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.25)', bar: '#4ade80' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const Icon = cfg.icon;
  return (
    <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold">
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const Icon = cfg.icon;
  return (
    <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold">
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

function TaskModal({ task, onClose, onSave, users }) {
  const isEdit = !!task?.id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.due_date ? task.due_date.slice(0, 10) : '',
    assignedTo: task?.assigned_to || '',
    category: task?.category || '',
    tags: task?.tags ? (typeof task.tags === 'string' ? JSON.parse(task.tags || '[]').join(', ') : task.tags.join(', ')) : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null,
        category: form.category || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      let res;
      if (isEdit) {
        res = await api.put(`/tasks/${task.id}`, payload);
      } else {
        res = await api.post('/tasks', payload);
      }
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onSave(res.data.data.task);
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to save task';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#1A1A25] border border-[#343448] rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252535]">
          <div>
            <h2 className="font-bold text-white text-lg">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'Update task details' : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#252535] hover:bg-[#343448] text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Task Title *
            </label>
            <input
              className="w-full bg-[#111118] border border-[#343448] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Description
            </label>
            <textarea
              className="w-full bg-[#111118] border border-[#343448] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] focus:ring-1 focus:ring-[#C8FF00]/20 transition-colors resize-none"
              placeholder="Add more details about this task..."
              rows={3}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</label>
              <select
                className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Priority</label>
              <select
                className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                value={form.priority}
                onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label || p}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
              <input
                type="date"
                className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Category</label>
              <input
                className="w-full bg-[#111118] border border-[#343448] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                placeholder="e.g. Development"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              />
            </div>
          </div>

          {/* Assign To */}
          {users.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Assign To</label>
              <select
                className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                value={form.assignedTo}
                onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              Tags <span className="text-gray-600 normal-case font-normal">(comma separated)</span>
            </label>
            <input
              className="w-full bg-[#111118] border border-[#343448] text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
              placeholder="design, frontend, bug"
              value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#252535] text-gray-300 font-medium px-5 py-3 rounded-xl border border-[#343448] hover:bg-[#343448] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-[#C8FF00] text-[#0A0A0F] font-semibold px-5 py-3 rounded-xl hover:bg-[#AEDE00] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? 'Update Task' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, taskId: null, taskTitle: '' });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/tasks', { params });
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  useEffect(() => {
    if (isAdmin) {
      api.get('/users?limit=100').then(({ data }) => setUsers(data.data.users)).catch(() => { });
    }
  }, [isAdmin]);

  const openDeleteConfirm = (task, e) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({ open: true, taskId: task.id, taskTitle: task.title });
  };

  const handleDeleteConfirmed = async () => {
    const id = confirmDialog.taskId;
    setConfirmDialog({ open: false, taskId: null, taskTitle: '' });
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleSave = (saved) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === saved.id);
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
    });
    setShowModal(false);
    setEditTask(null);
  };

  const openEdit = (task, e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditTask(task);
    setShowModal(true);
  };

  const isOverdue = (task) =>
    task.due_date &&
    task.status !== 'completed' &&
    task.status !== 'cancelled' &&
    isPast(parseISO(task.due_date));

  const activeFilters = [filters.status, filters.priority, filters.search].filter(Boolean).length;

  const parseTags = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    try { return JSON.parse(tags); } catch { return []; }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0F' }}>
      <div className="p-6 lg:p-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-[#C8FF00] rounded flex items-center justify-center">
                <CheckSquare size={11} className="text-[#0A0A0F]" />
              </div>
              <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Tasks</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Task Manager</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {pagination.total || 0} tasks total
              {activeFilters > 0 && <span className="text-[#C8FF00] ml-2">· {activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="hidden sm:flex bg-[#1A1A25] border border-[#252535] rounded-xl p-1 gap-1">
              <button onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#C8FF00] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}>
                <List size={15} />
              </button>
              <button onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#C8FF00] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}>
                <LayoutGrid size={15} />
              </button>
            </div>

            <button
              onClick={() => { setEditTask(null); setShowModal(true); }}
              className="bg-[#C8FF00] text-[#0A0A0F] font-semibold px-4 py-2.5 rounded-xl hover:bg-[#AEDE00] active:scale-95 transition-all flex items-center gap-2 text-sm">
              <Plus size={16} />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl p-4">
          <div className="flex gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="w-full bg-[#111118] border border-[#343448] text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors"
                placeholder="Search tasks..."
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
              />
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFilters > 0
                  ? 'bg-[#C8FF00]/10 border-[#C8FF00]/30 text-[#C8FF00]'
                  : 'bg-[#111118] border-[#343448] text-gray-400 hover:text-white hover:border-[#4A4A6A]'
                }`}>
              <Filter size={14} />
              Filters
              {activeFilters > 0 && (
                <span className="w-5 h-5 bg-[#C8FF00] text-[#0A0A0F] rounded-full text-xs font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Clear */}
            {activeFilters > 0 && (
              <button
                onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-gray-500 hover:text-white text-sm transition-colors">
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="flex gap-3 mt-3 pt-3 border-t border-[#252535] flex-wrap">
              <div className="flex-1 min-w-36">
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">Status</label>
                <select
                  className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                  value={filters.status}
                  onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
                  <option value="">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-36">
                <label className="block text-xs text-gray-500 mb-1.5 font-mono">Priority</label>
                <select
                  className="w-full bg-[#111118] border border-[#343448] text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C8FF00] transition-colors cursor-pointer"
                  value={filters.priority}
                  onChange={e => setFilters(p => ({ ...p, priority: e.target.value, page: 1 }))}>
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-[#1A1A25] border border-[#252535] rounded-2xl p-5 h-20"
                style={{ background: 'linear-gradient(90deg,#1A1A25 25%,#252535 50%,#1A1A25 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl py-20 text-center">
            <div className="w-16 h-16 bg-[#252535] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckSquare size={28} className="text-gray-600" />
            </div>
            <p className="text-white font-semibold text-lg">No tasks found</p>
            <p className="text-gray-500 text-sm mt-1 mb-6">
              {activeFilters > 0 ? 'Try adjusting your filters' : 'Create your first task to get started'}
            </p>
            {activeFilters > 0 ? (
              <button onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })}
                className="bg-[#252535] text-white px-5 py-2.5 rounded-xl border border-[#343448] hover:bg-[#343448] transition-colors text-sm">
                Clear Filters
              </button>
            ) : (
              <button onClick={() => setShowModal(true)}
                className="bg-[#C8FF00] text-[#0A0A0F] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#AEDE00] transition-colors text-sm inline-flex items-center gap-2">
                <Plus size={15} /> Create Task
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task, i) => {
              const overdue = isOverdue(task);
              const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const tags = parseTags(task.tags);
              return (
                <Link key={task.id} to={`/tasks/${task.id}`}
                  className="group bg-[#1A1A25] border border-[#252535] rounded-2xl p-5 hover:border-[#343448] hover:bg-[#1E1E2C] transition-all block"
                  style={{ animationDelay: `${i * 50}ms`, animation: 'fadeIn 0.4s ease forwards' }}>

                  {/* Priority bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-24 h-1 bg-[#252535] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ background: pCfg.bar, width: task.priority === 'urgent' ? '100%' : task.priority === 'high' ? '75%' : task.priority === 'medium' ? '50%' : '25%' }} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => openEdit(task, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252535] hover:bg-[#343448] text-gray-400 hover:text-white transition-colors">
                        <Edit2 size={12} />
                      </button>
                      {(isAdmin || task.owner_id === user?.id) && (
                        <button onClick={(e) => openDeleteConfirm(task, e)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252535] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-1.5 line-clamp-2 group-hover:text-[#C8FF00] transition-colors">{task.title}</h3>

                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <StatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {overdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        <AlertTriangle size={10} /> Overdue
                      </span>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-[#C8FF00]/10 text-[#C8FF00]/70 border border-[#C8FF00]/15">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#252535] text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={11} />
                      {task.assigned_to_name || task.owner_name || 'Unassigned'}
                    </span>
                    {task.due_date && (
                      <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : ''}`}>
                        <Calendar size={11} />
                        {format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-[#1A1A25] border border-[#252535] rounded-2xl overflow-hidden">
            {tasks.map((task, i) => {
              const overdue = isOverdue(task);
              const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
              const tags = parseTags(task.tags);
              return (
                <Link key={task.id} to={`/tasks/${task.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#1E1E2C] transition-colors border-b border-[#252535] last:border-0 group"
                  style={{ animationDelay: `${i * 30}ms`, animation: 'fadeIn 0.3s ease forwards' }}>

                  {/* Priority stripe */}
                  <div className="w-1 h-12 rounded-full shrink-0" style={{ background: pCfg.bar }} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white text-sm group-hover:text-[#C8FF00] transition-colors truncate max-w-xs">
                        {task.title}
                      </span>
                      {overdue && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <AlertTriangle size={10} /> Overdue
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {task.category && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Tag size={10} /> {task.category}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-400' : 'text-gray-500'}`}>
                          <Calendar size={10} />
                          {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                      {task.assigned_to_name && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <User size={10} /> {task.assigned_to_name}
                        </span>
                      )}
                      {task.comment_count > 0 && (
                        <span className="text-xs text-gray-600 font-mono">
                          {task.comment_count} comment{task.comment_count > 1 ? 's' : ''}
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="text-xs px-1.5 py-0.5 rounded-md bg-[#C8FF00]/10 text-[#C8FF00]/70 border border-[#C8FF00]/15">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={(e) => openEdit(task, e)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252535] hover:bg-[#343448] text-gray-400 hover:text-white transition-colors">
                      <Edit2 size={13} />
                    </button>
                    {(isAdmin || task.owner_id === user?.id) && (
                      <button onClick={(e) => openDeleteConfirm(task, e)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#252535] hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                    <ChevronRight size={14} className="text-gray-600 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              className="bg-[#1A1A25] border border-[#343448] text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-[#252535] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ← Previous
            </button>
            <span className="text-gray-500 text-sm font-mono">
              Page {filters.page} of {pagination.pages}
            </span>
            <button
              disabled={filters.page >= pagination.pages}
              onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              className="bg-[#1A1A25] border border-[#343448] text-gray-300 px-4 py-2 rounded-xl text-sm hover:bg-[#252535] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          users={users}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Delete Task"
        message={`Are you sure you want to delete "${confirmDialog.taskTitle}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Keep It"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDialog({ open: false, taskId: null, taskTitle: '' })}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
      `}</style>
    </div>
  );
}