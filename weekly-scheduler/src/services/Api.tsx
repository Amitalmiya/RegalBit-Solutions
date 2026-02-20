import axios from "axios";
import type { Shift, Employee } from "../types/scheduler";

const BASE = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
});


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
