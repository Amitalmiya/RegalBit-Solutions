import {
  Shift,
  DAY_START,
  DAY_END,
  TOTAL_HOURS,
  HOUR_SNAP,
  OVERTIME_LIMIT,
} from "../types/scheduler";



export function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}


export function parseTimeInput(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h + m / 60;
}


export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}


export function snapHour(h: number): number {
  return Math.round(h / HOUR_SNAP) * HOUR_SNAP;
}


export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}


export function clampHour(h: number): number {
  return clamp(h, DAY_START, DAY_END);
}


export function xToHourInColumn(relativeX: number, colWidth: number): number {
  return DAY_START + (relativeX / colWidth) * TOTAL_HOURS;
}


export function xToDayIndex(relativeX: number, colWidth: number): number {
  return clamp(Math.floor(relativeX / colWidth), 0, 6);
}


export function shiftToGridPosition(
  shift: Shift,
  totalDays: number
): { leftPct: number; widthPct: number } {
  const colPct = 100 / totalDays;
  const leftPct =
    shift.dayIndex * colPct +
    ((shift.startHour - DAY_START) / TOTAL_HOURS) * colPct;
  const widthPct = ((shift.endHour - shift.startHour) / TOTAL_HOURS) * colPct;
  return { leftPct, widthPct };
}


export function shiftsOverlap(a: Shift, b: Shift): boolean {
  if (a.id === b.id) return false;
  if (a.employeeId !== b.employeeId) return false;
  if (a.dayIndex !== b.dayIndex) return false;
  return a.startHour < b.endHour && a.endHour > b.startHour;
}


export function hasConflict(candidate: Shift, existing: Shift[]): boolean {
  return existing.some((s) => shiftsOverlap(candidate, s));
}


export function calcWeeklyHours(shifts: Shift[], employeeId: string): number {
  return shifts
    .filter((s) => s.employeeId === employeeId)
    .reduce((acc, s) => acc + (s.endHour - s.startHour), 0);
}


export function isOvertime(shifts: Shift[], employeeId: string): boolean {
  return calcWeeklyHours(shifts, employeeId) > OVERTIME_LIMIT;
}


export function calcOvertimeHours(shifts: Shift[], employeeId: string): number {
  return Math.max(0, calcWeeklyHours(shifts, employeeId) - OVERTIME_LIMIT);
}


export function calcDraggedShift(
  originalShift: Shift,
  gridRelativeX: number,
  offsetHour: number,
  colWidth: number
): Pick<Shift, "dayIndex" | "startHour" | "endHour"> {
  const duration = originalShift.endHour - originalShift.startHour;
  const newDay = xToDayIndex(gridRelativeX, colWidth);

  const dayRelativeX = gridRelativeX - newDay * colWidth;
  const rawStart = xToHourInColumn(dayRelativeX, colWidth) - offsetHour;
  const snapped = snapHour(rawStart);
  const newStart = clamp(snapped, DAY_START, DAY_END - duration);

  return {
    dayIndex: newDay,
    startHour: newStart,
    endHour: newStart + duration,
  };
}


export function calcResizedShift(
  originalShift: Shift,
  gridRelativeX: number,
  edge: "start" | "end",
  colWidth: number
): Pick<Shift, "startHour" | "endHour"> {
  const dayRelativeX = gridRelativeX - originalShift.dayIndex * colWidth;
  const rawHour = xToHourInColumn(dayRelativeX, colWidth);
  const snapped = snapHour(rawHour);

  if (edge === "start") {
    return {
      startHour: clamp(snapped, DAY_START, originalShift.endHour - HOUR_SNAP),
      endHour: originalShift.endHour,
    };
  } else {
    return {
      startHour: originalShift.startHour,
      endHour: clamp(snapped, originalShift.startHour + HOUR_SNAP, DAY_END),
    };
  }
}


export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}


export function cloneShift(shift: Shift, overrides: Partial<Shift> = {}): Shift {
  return { ...shift, ...overrides };
}