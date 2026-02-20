import { useCallback, useEffect, useState } from "react";
import type { Shift, Employee } from "../types/scheduler";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  fetchShifts,
  createShift,
  updateShift,
  deleteShift,
} from "../services/Api";

interface UseSchedulerReturn {
  shifts: Shift[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
  addEmployee: (employee: Employee) => Promise<void>;
  editEmployee: (employee: Employee) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
  addShift: (shift: Shift) => Promise<void>;
  editShift: (shift: Shift) => Promise<void>;
  removeShift: (id: string) => Promise<void>;
  copyShifts: (shifts: Shift[]) => Promise<void>;
  updateShiftLocal: (shift: Shift) => void;
  persistShift: (shift: Shift) => Promise<void>;
}

export function useScheduler(): UseSchedulerReturn {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [shiftsData, employeesData] = await Promise.all([
          fetchShifts(),
          fetchEmployees(),
        ]);

        setShifts(shiftsData);
        setEmployees(employeesData);
      } catch (err) {
        setError("Failed to load data. Is json-server running on port 3001?");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // Employee CRUD

  const addEmployee = useCallback(async (employee: Employee) => {
    try {
      setError(null);
      const saved = await createEmployee(employee);
      setEmployees((prev) => [...prev, saved]);
    } catch (err) {
      setError("Failed to create employee.");
      console.error(err);
    }
  }, []);

  const editEmployee = useCallback(async (employee: Employee) => {
    try {
      setError(null);
      const saved = await updateEmployee(employee);
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === saved.id ? saved : emp))
      );
    } catch (err) {
      setError("Failed to update employee.");
      console.error(err);
    }
  }, []);

  const removeEmployee = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
    } catch (err) {
      setError("Failed to delete employee.");
      console.error(err);
    }
  }, []);

  // Shift CRUD

  const addShift = useCallback(async (shift: Shift) => {
    try {
      setError(null);
      const saved = await createShift(shift);
      setShifts((prev) => [...prev, saved]);
    } catch (err) {
      setError("Failed to create shift.");
      console.error(err);
    }
  }, []);

  const editShift = useCallback(async (shift: Shift) => {
    try {
      setError(null);
      const saved = await updateShift(shift);
      setShifts((prev) =>
        prev.map((s) => (s.id === saved.id ? saved : s))
      );
    } catch (err) {
      setError("Failed to update shift.");
      console.error(err);
    }
  }, []);

  const removeShift = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError("Failed to delete shift.");
      console.error(err);
    }
  }, []);

  const updateShiftLocal = useCallback((shift: Shift) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === shift.id ? shift : s))
    );
  }, []);

  const persistShift = useCallback(async (shift: Shift) => {
    try {
      setError(null);
      await updateShift(shift);
    } catch (err) {
      setError("Failed to save shift position.");
      console.error(err);
    }
  }, []);

  const copyShifts = useCallback(async (shiftsToCopy: Shift[]) => {
    try {
      setError(null);
      const created = await Promise.all(
        shiftsToCopy.map((shift) => createShift(shift))
      );
      setShifts((prev) => [...prev, ...created]);
    } catch (err) {
      setError("Failed to copy shifts.");
      console.error(err);
    }
  }, []);

  return {
    shifts,
    employees,
    loading,
    error,
    addEmployee,
    editEmployee,
    removeEmployee,
    addShift,
    editShift,
    removeShift,
    updateShiftLocal,
    persistShift,
    copyShifts,
  };
}