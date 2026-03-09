import React, { createContext, useContext, useState } from 'react';
import api from '../services/api';

const TaskContext = createContext(null);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/api/tasks${params ? `?${params}` : ''}`);
      setTasks(response.data.tasks);
      return response.data.tasks;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/tasks', taskData);
      setTasks([...tasks, response.data.task]);
      return response.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId, taskData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/api/tasks/${taskId}`, taskData);
      setTasks(tasks.map(task => task._id === taskId ? response.data.task : task));
      return response.data.task;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = async () => {
    try {
      const response = await api.get('/api/tasks/stats/summary');
      return response.data.stats;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch task statistics');
      throw err;
    }
  };

  const value = {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};