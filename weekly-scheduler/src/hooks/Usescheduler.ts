import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchShifts,
  fetchEmployees,
  createShift,
  updateShift,
  deleteShift,
  createShiftsBulk,
  createEmployee,
  updateEmployee,
  deleteEmployeeWithShifts,
} from "../services/Api";
import { queryKeys } from "../lib/Querykeys";
import { Shift, Employee } from "../types/scheduler";

export function useScheduler() {
    const queryClient = useQueryClient();

    const {
        data: employees = [],
        isLoading: employeesLoading,
        isError: employeesError,
    } = useQuery<Employee[]>({
        queryKey: queryKeys.employees,
        queryFn: fetchEmployees,
    });

    const {
        data: shifts = [],
        isLoading: shiftsLoading,
        isError: shiftsError,
    } = useQuery<Shift[]>({
        queryKey: queryKeys.shifts,
        queryFn: fetchShifts,
    });

    const loading = employeesLoading || shiftsLoading;
    const error = 
        employeesError || shiftsError ? "Failed to load data. Is json-server running on port:5000" : null;

    // Shift

    const addShiftMutation = useMutation({
        mutationFn: (shift: Shift) => createShift(shift),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
        },
        onError: (error) => console.error("Failed to create shift: ", error)
    });

    const editShiftMutation = useMutation({
        mutationFn: (shift: Shift) => updateShift(shift),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
        },
        onError: (error) => console.error("Failed to update shift: ", error)
    });

    const deleteShiftMutation = useMutation({
        mutationFn: (id: string) => deleteShift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
        },
        onError: (error) => console.error("Failed to delete shift ", error)
    });

    const copyShiftsMutation = useMutation({
        mutationFn: (newShifts: Shift[]) => createShiftsBulk(newShifts),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
        },
        onError: (err) => console.error("Failed to copy shifts:", err),
    });

    const persistShiftMutation = useMutation({
        mutationFn: (shift: Shift) => updateShift(shift),
        onError: (err) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
            console.error("Failed to persist shift position:", err);  // ← inside {}
    },
    });

    const updateShiftLocal = useCallback(
        (updatedShift: Shift) => {
            queryClient.setQueryData<Shift[]>(queryKeys.shifts, (prev = []) =>
            prev.map((s) => (s.id === updatedShift.id ? updatedShift : s))
        );
        },
        [queryClient]
    );

    // Employee

    const addEmployeeMutation = useMutation({
        mutationFn: (employee: Employee) => createEmployee(employee),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees });
        },
        onError: (error) => console.error("Failed to add employee: ", error),
    });

    const editEmployeeMutation = useMutation({
        mutationFn: (employee: Employee) => updateEmployee(employee),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees });
        },
        onError: (error) => console.error("Failed to update employee: ", error),
    });

    const removeEmployeeMutation = useMutation({
        mutationFn: (employeeId: string) => deleteEmployeeWithShifts(employeeId, shifts),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.employees });
            queryClient.invalidateQueries({ queryKey: queryKeys.shifts });
        },
        onError: (error) => console.error("Failed to remove employee:", error)
    })

    // Shifts
    const addShift = useCallback(
        (shift: Shift) => addShiftMutation.mutateAsync(shift),
        [addShiftMutation]
    );

    const editShift = useCallback(
        (shift: Shift) => editShiftMutation.mutateAsync(shift),
        [editShiftMutation]
    );

    const removeShift = useCallback(
        (id: string) => deleteShiftMutation.mutateAsync(id),
        [deleteShiftMutation]
    );

    const copyShifts = useCallback(
        (newShifts: Shift[]) => copyShiftsMutation.mutateAsync(newShifts),
        [copyShiftsMutation]
    );

    const persistShift = useCallback(
        (shift: Shift) => persistShiftMutation.mutateAsync(shift),
        [persistShiftMutation]
    );

    // Employees

    const addEmployee = useCallback(
        (employee: Employee) => addEmployeeMutation.mutateAsync(employee),
        [addEmployeeMutation]
    );

    const editEmployee = useCallback(
        (employee: Employee) => editEmployeeMutation.mutateAsync(employee),
        [editEmployeeMutation]
    );

    const removeEmployee = useCallback(
        (employeeId: string) => removeEmployeeMutation.mutateAsync(employeeId),
        [removeEmployeeMutation]
    );

    const isSavingEmployee = 
        addEmployeeMutation.isPending ||
        editEmployeeMutation.isPending ||
        removeEmployeeMutation.isPending;

    return {
        shifts,
        employees,
        loading,
        error,
        // shift operations
        addShift,
        editShift,
        removeShift,
        copyShifts,
        updateShiftLocal,
        persistShift,
        // employee operations
        addEmployee,
        editEmployee,
        removeEmployee,
        isSavingEmployee,
    }
}