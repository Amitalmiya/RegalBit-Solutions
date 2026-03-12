import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, ChevronRight, Trash2, Edit2,
  CheckSquare, Clock, AlertTriangle, X, Calendar, Tag, User
} from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function TaskModal({ task, onClose, onSave, users }) {
  const { user } = useAuth();
  const isEdit = !!task?.id;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.due_date ? task.due_date.slice(0, 10) : '',
    assignedTo: task?.assigned_to || '',
    category: task?.category || '',
    tags: task?.tags ? (Array.isArray(task.tags) ? task.tags.join(', ') : '') : '',
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
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
          <h2 className="font-bold text-white text-lg">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Title *</label>
            <input className="input" placeholder="What needs to be done?" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px] resize-y" placeholder="Add details..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input type="date" className="input" value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" placeholder="e.g. Development" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
          </div>

          {users.length > 0 && (
            <div>
              <label className="label">Assign To</label>
              <select className="input" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" placeholder="design, frontend, bug" value={form.tags}
              onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [users, setUsers] = useState([]);

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
      api.get('/users?limit=100').then(({ data }) => setUsers(data.data.users)).catch(() => {});
    }
  }, [isAdmin]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
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

  const isOverdue = (task) =>
    task.due_date && task.status !== 'completed' && task.status !== 'cancelled' &&
    isAfter(new Date(), parseISO(task.due_date));

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={16} className="text-volt-400" />
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Tasks</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Task Manager</h1>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
          />
        </div>
        <select className="input py-2 text-sm w-auto" value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="input py-2 text-sm w-auto" value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button onClick={() => setFilters({ status: '', priority: '', search: '', page: 1 })}
            className="btn-ghost text-sm flex items-center gap-1">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Tasks list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card shimmer h-20" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card py-16 text-center">
          <CheckSquare size={48} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 text-lg font-medium">No tasks found</p>
          <p className="text-gray-600 text-sm mt-1">Create your first task to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2 mt-6">
            <Plus size={16} /> Create Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="card-hover p-4 flex items-start gap-4 group">
              {/* Priority indicator */}
              <div className={`w-1 self-stretch rounded-full shrink-0 ${
                task.priority === 'urgent' ? 'bg-red-400' :
                task.priority === 'high' ? 'bg-orange-400' :
                task.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
              }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <Link to={`/tasks/${task.id}`} className="font-medium text-white hover:text-volt-400 transition-colors">
                    {task.title}
                  </Link>
                  {isOverdue(task) && (
                    <span className="badge bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                      <AlertTriangle size={10} /> Overdue
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`status-${task.status}`}>{task.status.replace('_', ' ')}</span>
                  <span className={`priority-${task.priority}`}>{task.priority}</span>

                  {task.due_date && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar size={11} />
                      {format(parseISO(task.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                  {task.category && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Tag size={11} />
                      {task.category}
                    </span>
                  )}
                  {task.assigned_to_name && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <User size={11} />
                      {task.assigned_to_name}
                    </span>
                  )}
                  {task.comment_count > 0 && (
                    <span className="text-xs text-gray-600">{task.comment_count} comment{task.comment_count > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => { setEditTask(task); setShowModal(true); }}
                  className="btn-ghost p-2 text-gray-500 hover:text-white"
                  title="Edit"
                >
                  <Edit2 size={15} />
                </button>
                {(isAdmin || task.owner_id === user?.id) && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="btn-ghost p-2 text-gray-500 hover:text-coral-400"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <Link to={`/tasks/${task.id}`} className="btn-ghost p-2 text-gray-500 hover:text-white">
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={filters.page <= 1}
            onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
            className="btn-secondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-400 text-sm font-mono">
            {filters.page} / {pagination.pages}
          </span>
          <button
            disabled={filters.page >= pagination.pages}
            onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
            className="btn-secondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editTask}
          users={users}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}