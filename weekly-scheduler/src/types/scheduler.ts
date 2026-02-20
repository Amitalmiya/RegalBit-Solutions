export interface Employee {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarInitials: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  dayIndex: number; 
  startHour: number; 
  endHour: number;
  label: string;
}


export interface DragState {
  shiftId: string;
  offsetHour: number; 
}

export interface ResizeState {
  shiftId: string;
  edge: "start" | "end";
}

export interface TooltipState {
  x: number;
  y: number;
  text: string;
}


export type ModalMode = "create" | "edit";

export interface ShiftModalPayload {
  mode: ModalMode;
  shift: Partial<Shift> & Pick<Shift, "employeeId" | "dayIndex">;
}

export interface CopyShiftModalPayload {
  sourceShift: Shift;
}


export const DAYS: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_NUMBERS: number[] = [17, 18, 19, 20, 21, 22, 23];

export const DAY_START = 6;  
export const DAY_END = 22;    
export const TOTAL_HOURS = DAY_END - DAY_START;

export const ROW_HEIGHT = 72;
export const HEADER_HEIGHT = 48;    
export const SIDEBAR_WIDTH = 170;   
export const MIN_COL_WIDTH = 110; 

export const OVERTIME_LIMIT = 40; 

export const HOUR_SNAP = 0.5;


export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Alex Rivera",   role: "Barista",  color: "#6C63FF", avatarInitials: "AR" },
  { id: "e2", name: "Sam Chen",      role: "Cashier",  color: "#FF6584", avatarInitials: "SC" },
  { id: "e3", name: "Jordan Lee",    role: "Manager",  color: "#43D9AD", avatarInitials: "JL" },
  { id: "e4", name: "Taylor Mwangi", role: "Barback",  color: "#F5A623", avatarInitials: "TM" },
  { id: "e5", name: "Morgan Blake",  role: "Barista",  color: "#38BDF8", avatarInitials: "MB" },
];

export const DEFAULT_SHIFTS: Shift[] = [
  { id: "s1", employeeId: "e1", dayIndex: 0, startHour: 8,  endHour: 14, label: "Morning" },
  { id: "s2", employeeId: "e1", dayIndex: 1, startHour: 8,  endHour: 14, label: "Morning" },
  { id: "s3", employeeId: "e1", dayIndex: 2, startHour: 9,  endHour: 17, label: "Mid" },
  { id: "s4", employeeId: "e1", dayIndex: 4, startHour: 8,  endHour: 16, label: "Morning" },
  { id: "s5", employeeId: "e2", dayIndex: 1, startHour: 10, endHour: 18, label: "Afternoon" },
  { id: "s6", employeeId: "e3", dayIndex: 0, startHour: 9,  endHour: 17, label: "Full Day" },
  { id: "s7", employeeId: "e3", dayIndex: 3, startHour: 9,  endHour: 17, label: "Full Day" },
  { id: "s8", employeeId: "e4", dayIndex: 4, startHour: 14, endHour: 22, label: "Night" },
  { id: "s9", employeeId: "e5", dayIndex: 2, startHour: 7,  endHour: 15, label: "Dawn" },
];