import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  CheckSquare, Clock, AlertCircle, TrendingUp,
  Plus, ChevronRight, Zap, Users, Target
} from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';

const PriorityDot = ({ priority }) => {
  const colors = { urgent: 'bg-red-400', high: 'bg-orange-400', medium: 'bg-yellow-400', low: 'bg-green-400' };
  return <span className={`w-2 h-2 rounded-full ${colors[priority] || 'bg-gray-400'}`} />;
};

const StatusBadge = ({ status }) => (
  <span className={`status-${status}`}>{status?.replace('_', ' ')}</span>
);

const PriorityBadge = ({ priority }) => (
  <span className={`priority-${priority}`}>{priority}</span>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/tasks/stats'),
          api.get('/tasks?limit=5'),
        ]);
        setStats(statsRes.data.data.stats);
        setRecentTasks(tasksRes.data.data.tasks);

        if (isAdmin) {
          const adminRes = await api.get('/users/stats');
          setAdminStats(adminRes.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 shimmer h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  const completionRate = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-volt-400" />
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, <span className="text-volt-400">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link to="/tasks" className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats?.total || 0, icon: CheckSquare, color: 'text-azure-400', bg: 'bg-azure-400/10' },
          { label: 'In Progress', value: stats?.in_progress || 0, icon: TrendingUp, color: 'text-volt-400', bg: 'bg-volt-400/10' },
          { label: 'Completed', value: stats?.completed || 0, icon: Target, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Overdue', value: stats?.overdue || 0, icon: AlertCircle, color: 'text-coral-400', bg: 'bg-coral-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <div className="text-3xl font-bold text-white font-mono">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress & priority breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Completion rate */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Target size={16} className="text-volt-400" />
            Completion Rate
          </h3>
          <div className="flex items-end gap-4">
            <div className="text-5xl font-bold text-volt-400 font-mono">{completionRate}%</div>
            <div className="text-sm text-gray-500 pb-1">of all tasks completed</div>
          </div>
          <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-volt-400 rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Todo', val: stats?.todo || 0, color: 'text-gray-400' },
              { label: 'Active', val: stats?.in_progress || 0, color: 'text-blue-400' },
              { label: 'Done', val: stats?.completed || 0, color: 'text-volt-400' },
              { label: 'Dropped', val: stats?.cancelled || 0, color: 'text-red-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="card p-2">
                <div className={`font-bold font-mono ${color}`}>{val}</div>
                <div className="text-xs text-gray-600">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority breakdown */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <AlertCircle size={16} className="text-coral-400" />
            Priority Overview
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Urgent', val: stats?.urgent || 0, color: 'bg-red-400', max: stats?.total || 1 },
              { label: 'High', val: stats?.high_priority || 0, color: 'bg-orange-400', max: stats?.total || 1 },
              { label: 'Overdue', val: stats?.overdue || 0, color: 'bg-coral-400', max: stats?.total || 1 },
            ].map(({ label, val, color, max }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-mono">{val}</span>
                </div>
                <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min((val / max) * 100, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {stats?.overdue > 0 && (
            <div className="flex items-center gap-3 p-3 bg-coral-500/10 border border-coral-500/20 rounded-xl">
              <AlertCircle size={16} className="text-coral-400 shrink-0" />
              <p className="text-sm text-coral-400">
                {stats.overdue} task{stats.overdue > 1 ? 's are' : ' is'} past due date
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Admin stats */}
      {isAdmin && adminStats && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Users size={16} className="text-azure-400" />
              System Overview
            </h3>
            <Link to="/users" className="text-xs text-azure-400 hover:text-azure-400/80 flex items-center gap-1">
              Manage users <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: adminStats.userStats?.total_users || 0 },
              { label: 'Active', value: adminStats.userStats?.active_users || 0 },
              { label: 'Admins', value: (parseInt(adminStats.userStats?.total_admins || 0) + parseInt(adminStats.userStats?.total_superadmins || 0)) },
              { label: 'All Tasks', value: adminStats.taskStats?.total_tasks || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-ink-700 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white font-mono">{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            Recent Tasks
          </h3>
          <Link to="/tasks" className="text-xs text-volt-400 hover:text-volt-500 flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CheckSquare size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No tasks yet. Create your first task!</p>
            <Link to="/tasks" className="btn-primary inline-flex items-center gap-2 mt-4">
              <Plus size={16} /> Create Task
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink-700">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-ink-700/50 transition-colors"
              >
                <PriorityDot priority={task.priority} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{task.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {task.due_date ? `Due ${format(parseISO(task.due_date), 'MMM d')}` : 'No due date'}
                    {task.assigned_to_name && ` · ${task.assigned_to_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
                <ChevronRight size={14} className="text-gray-600" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}