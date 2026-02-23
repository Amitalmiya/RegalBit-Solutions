import axios from "axios";
import type { Shift, Employee } from "../types/scheduler";

const BASE = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});

// Employees
export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get<Employee[]>("/employees");
  return data;
}

export async function createEmployee(employee: Employee): Promise<Employee> {
  const { data } = await api.post<Employee>("/employees", employee);
  return data;
}

export async function updateEmployee(employee: Employee): Promise<Employee> {
  const { data } = await api.put<Employee>(`/employees/${employee.id}`, employee);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await api.delete(`/employees/${id}`);
}

// Shifts

export async function fetchShifts(): Promise<Shift[]> {
  const { data } = await api.get<Shift[]>("/shifts");
  return data;
}

export async function createShift(shift: Shift): Promise<Shift> {
  const { data } = await api.post<Shift>("/shifts", shift);
  return data;
}

export async function updateShift(shift: Shift): Promise<Shift> {
  const { data } = await api.put<Shift>(`/shifts/${shift.id}`, shift);
  return data;
}

export async function deleteShift(id: string): Promise<void> {
  await api.delete(`/shifts/${id}`);
}

export async function createShiftsBulk(shifts: Shift[]): Promise<Shift[]> {
  return Promise.all(shifts.map((s) => createShift(s)));
}

export async function deleteEmployeeWithShifts(
  employeeId: string,
  allShifts: Shift[]
): Promise<void> {
  const employeeShifts = allShifts.filter((s) => s.employeeId === employeeId);
  await Promise.all([
    deleteEmployee(employeeId),
    ...employeeShifts.map((s) => deleteShift(s.id)),
  ]);
}