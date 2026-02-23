import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DAY_START, DAY_END, Employee, MIN_COL_WIDTH, SIDEBAR_WIDTH, ShiftModalPayload, OVERTIME_LIMIT, DragState, TOTAL_HOURS, Shift, ResizeState, CopyShiftModalPayload, ROW_HEIGHT, DAYS, DAY_NUMBERS, HEADER_HEIGHT, } from '../types/scheduler';
import { useScheduler } from '../hooks/Usescheduler';
import { calcDraggedShift, calcOvertimeHours, calcResizedShift, calcWeeklyHours, clamp, cloneShift, generateId, hasConflict, isOvertime, shiftToGridPosition, snapHour } from '../utils/DateUtils';
import ShiftCard from './ShiftCard';

const RULER_HOURS: number[] = [];
for (let h = DAY_START; h <= DAY_END; h += 2) RULER_HOURS.push(h);

interface Toast { message: string; type: "success" | "error" | "info" }


interface EmployeeModalState{
  open: boolean;
  mode: "add" | "edit";
  employee: Partial<Employee>
}

const ROLE_OPTIONS = ["Barista", "Cashier", "Manager", "Barback", "Chef", "Host"];
const COLOR_OPTIONS = [
  "#6C63FF","#FF6584","#43D9AD","#F5A623","#38BDF8",
  "#f472b6","#fb923c","#4ade80","#e879f9","#fbbf24",
]

// WeeklyScherduler
const WeeklyScheduler: React.FC = () => {
  const {
    shifts, employees, loading, error, addShift, editShift, removeShift, copyShifts,
    updateShiftLocal, persistShift,
    addEmployee, editEmployee, removeEmployee,
    isSavingEmployee,
  } = useScheduler();

  // grid ref & dimensions

  const gridRef = useRef<HTMLDivElement>(null);

  const [colWidth, setColWidth] = useState<number>(MIN_COL_WIDTH)

  useEffect(() => {
    const measure = () => {
      if(!gridRef.current) return;
      const w = (gridRef.current.clientWidth - SIDEBAR_WIDTH) / 7;
      setColWidth(Math.max(w, MIN_COL_WIDTH));
    };
      measure();
      const ro = new ResizeObserver(measure);
      if(gridRef.current) ro.observe(gridRef.current);
      return () => ro.disconnect();
  }, []);

  const [isPublished, setIsPublished] = useState(false);

  // Toast

  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Modals

  const [shiftModal, setShiftModal] = useState<ShiftModalPayload | null>(null);
  const [copyModal, setCopyModal] = useState<CopyShiftModalPayload| null>(null);
  const [employeeModal, setEmployeeModal]     = useState<EmployeeModalState | null>(null);
  const [isSavingShift, setIsSavingShift]     = useState(false);
  const [isCopyingShift, setIsCopyingShift]    = useState(false);

  // Drag state

  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [dragPreview, setDragPreview] = useState<Shift | null>(null);

  // Derived State

  const stats = useMemo(() => ({
    total: shifts.length,
    hours: shifts.reduce((s, sh) => s + (sh.endHour - sh.startHour), 0),
    ot:    employees.filter((e) => calcWeeklyHours(shifts, e.id) > OVERTIME_LIMIT).length,
  }), [shifts, employees]);

  // Mouse event helpers

  const getGridRelativeX = useCallback((clientX: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return clientX - rect.left - SIDEBAR_WIDTH;
  }, []);


// start drag
  const handleDragStart = useCallback((e: React.MouseEvent, shift: Shift) => {
    if (isPublished) return;
    e.preventDefault();
    const relX = getGridRelativeX(e.clientX);
    const dayRelX = relX - shift.dayIndex * colWidth;
    const offsetHour = (dayRelX / colWidth) * TOTAL_HOURS - (shift.startHour - DAY_START);

    dragRef.current = { shiftId: shift.id, offsetHour };
    setDragPreview(shift);
  }, [isPublished, getGridRelativeX, colWidth]);

  // start resize
  const handleResizeStart = useCallback((e: React.MouseEvent, shiftId: string, edge: "start" | "end") => {
    if (isPublished) return;
    e.preventDefault();
    resizeRef.current = { shiftId, edge };
  }, [isPublished]);

  // Mouse move

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPublished) return;
    const relX = getGridRelativeX(e.clientX);

    if (dragRef.current) {
      const original = shifts.find((s) => s.id === dragRef.current!.shiftId);
      if (!original) return;
      const next = calcDraggedShift(original, relX, dragRef.current.offsetHour, colWidth);
      const preview = cloneShift(original, next);
      setDragPreview(preview);
      updateShiftLocal(preview);
    }

    if (resizeRef.current) {
      const original = shifts.find((s) => s.id === resizeRef.current!.shiftId);
      if (!original) return;
      const next = calcResizedShift(original, relX, resizeRef.current.edge, colWidth);
      updateShiftLocal(cloneShift(original, next));
    }
  }, [isPublished, shifts, colWidth, getGridRelativeX, updateShiftLocal]);

  // Mouse up 

   const handleMouseUp = useCallback(async () => {
    if (dragRef.current || resizeRef.current) {
      const id = dragRef.current?.shiftId ?? resizeRef.current?.shiftId;
      dragRef.current   = null;
      resizeRef.current = null;
      setDragPreview(null);

      if (id) {
        const latest = shifts.find((s) => s.id === id);
        if (latest) {
          const conflict = hasConflict(latest, shifts.filter((s) => s.id !== id));
          if (conflict) {
            showToast("Shift overlaps — reverted", "error");
          } else {
            try {
              await persistShift(latest);
              showToast("Shift saved ✓");
            } catch {
              showToast("Failed to save shift", "error");
            }
          }
        }
      }
    }
  }, [shifts, persistShift, showToast]);
  useEffect(() => {
    const fn = () => handleMouseUp();
    window.addEventListener("mouseup", fn);
    return () => window.removeEventListener("mouseup", fn);
  }, [handleMouseUp]);

// click on empty cell -> open add model
  const handleCellClick = useCallback((empId: string, dayIndex: number, e: React.MouseEvent) => {
    if (isPublished) return;
    if (dragRef.current || resizeRef.current) return;
    const relX = getGridRelativeX(e.clientX);
    const dayRelX = relX - dayIndex * colWidth;
    const rawHour = DAY_START + (dayRelX / colWidth) * TOTAL_HOURS;
    const snapped = clamp(snapHour(rawHour), DAY_START, DAY_END - 1);
    setShiftModal({
      mode: "create",
      shift: { employeeId: empId, dayIndex, startHour: snapped, endHour: snapped + 4, label: "Morning" },
    });
  }, [isPublished, getGridRelativeX, colWidth]);

  // Shift actions

  const handleSaveShift = async (shift: Shift) => {
    setIsSavingShift(true);
    try {
      if (shiftModal?.mode === "edit") {
        await editShift(shift);
        showToast("Shift updated ✓");
      } else {
        await addShift(shift);
        showToast("Shift added ✓");
      }
      setShiftModal(null);
    } catch {
      showToast("Failed to save shift", "error");
    } finally {
      setIsSavingShift(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm("Delete this shift?")) return;
    try {
      await removeShift(id);
      showToast("Shift deleted", "info");
    } catch {
      showToast("Failed to delete shift", "error");
    }
  };

  const handleCopyConfirm = async (newShifts: Shift[]) => {
    setIsCopyingShift(true);
    try {
      await copyShifts(newShifts);
      setCopyModal(null);
      showToast(`Shift copied ✓`);
    } catch {
      showToast("Failed to copy shift", "error");
    } finally {
      setIsCopyingShift(false);
    }
  };

  // Employee actions

  const handleSaveEmployee = async () => {
    if (!employeeModal) return;
    const { mode, employee: emp } = employeeModal;
    if (!emp.name?.trim()) return;
    const full: Employee = {
      id:             emp.id ?? generateId(),
      name:           emp.name.trim(),
      role:           emp.role ?? "Barista",
      color:          emp.color ?? "#6C63FF",
      avatarInitials: emp.name.trim().split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    };
    try {
      if (mode === "edit") {
        await editEmployee(full);
        showToast("Employee updated ✓");
      } else {
        await addEmployee(full);
        showToast("Employee added ✓");
      }
      setEmployeeModal(null);
    } catch {
      showToast("Failed to save employee", "error");
    }
  };

  const handleDeleteEmployee = async (empId: string) => {
    if (!window.confirm("Delete this employee and all their shifts?")) return;
    try {
      await removeEmployee(empId);
      showToast("Employee removed", "info");
    } catch {
      showToast("Failed to remove employee", "error");
    }
  };
  // render helpers
   const renderRow = (emp: Employee) => {
    const empShifts = shifts.filter((s) => s.employeeId === emp.id);
    const wkHours   = calcWeeklyHours(shifts, emp.id);
    const ot        = isOvertime(shifts, emp.id);
    const otHours   = calcOvertimeHours(shifts, emp.id);
    const pct       = Math.min((wkHours / OVERTIME_LIMIT) * 100, 100);
    const barColor  = ot ? "#ef4444" : wkHours / OVERTIME_LIMIT > 0.8 ? "#f59e0b" : emp.color;
  return (
    <div key={emp.id} className="flex" style={{ height: ROW_HEIGHT }}>
      <div className="shrink-0 flex flex-col justify-center px-3 gap-1 5 border -b border-r"
       style={{
            width: SIDEBAR_WIDTH,
            borderColor: "rgba(255,255,255,0.05)",
            borderLeft: `3px solid ${emp.color}70`,
            background: "#0c1018",
          }}>
            <div className="flex item-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border"
                style={{ background: `${emp.color}18`, borderColor: `${emp.color}30`, color: emp.color }}
              >
                {emp.avatarInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-slate-100 truncate leading-tight">{emp.name}</p>
                <p className="text-[9px] truncate"
                  style={{ color: "#475569" }}
                >{emp.role}</p>
              </div>
              {!isPublished && (
                <button 
                onClick={() => setEmployeeModal({open: true, mode: "edit", employee: { ...emp } })}
                className="w-5 h-5 flex items-center justify-center rounded text-[9px] shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}
                >✏</button>
              )}
            </div>

            {/* Hours bar */}
            <div>
              <div className="flex justify-between mb-0 5">
                <span className="text-[9px] uppercase tracking-wider"
                  style={{ color: "#334155" }}
                >hrs</span>
                <span className="text-[9px] font-bold"
                style={{ color: ot ? "#ef4444" : "#475569" }}>{wkHours}h{ot ? ` +${otHours}OT` : ""}</span>
              </div>
              <div className="h-1 rounded-full overflow-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
            </div>
      </div>
      {/* // Day columns */}
      <div className="relative flex-1 border-b group/row"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
        onMouseDown={(e) => {
          if (!(e.target as HTMLElement).closest("[data-shift")) {
            handleCellClick(emp.id, Math.floor(getGridRelativeX(e.clientX) / colWidth), e);
          }
        }}
      >
        {empShifts.map((shift) => {
            const { leftPct, widthPct } = shiftToGridPosition(shift, 7);
            const totalW = colWidth * 7;
            return (
              <div key={shift.id} data-shift>
                <ShiftCard
                  shift={shift}
                  employee={emp}
                  allShifts={shifts}
                  leftPx={(leftPct / 100) * totalW}
                  widthPx={(widthPct / 100) * totalW}
                  rowHeight={ROW_HEIGHT}
                  isDragging={dragPreview?.id === shift.id}
                  isReadOnly={isPublished}
                  onDragStart={handleDragStart}
                  onResizeStart={handleResizeStart}
                  onEdit={(s) => setShiftModal({ mode: "edit", shift: { ...s } })}
                  onCopy={(s) => setCopyModal({ sourceShift: s })}
                  onDelete ={handleDeleteShift}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
   };

  // Main render

    return (
    <div
      className="min-h-screen flex flex-col text-slate-200"
      style={{ background: "#3068c2", fontFamily: "'Outfit', sans-serif" }}
      onMouseMove={handleMouseMove}
    >
      {/* ── TOP BAR */}
      <header
        className="sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0"
        style={{
          background: "rgba(8,11,18,0.94)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ background: "linear-gradient(135deg,#6C63FF,#a78bfa)", boxShadow: "0 4px 18px #6C63FF40" }}
          >⚡</div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">WorkForce</h1>
            <p className="text-[8px] uppercase tracking-[0.25em] mt-0.5" style={{ color: "#334155" }}>Scheduler</p>
          </div>
        </div>

        {/* Week label */}
        <div
          className="px-4 py-2 rounded-xl text-center"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-xs font-bold text-slate-300">Feb 17 – 23, 2026</p>
          <p className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: "#334155" }}>Week 8</p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Stats chips */}
          {[
            { icon: "📋", val: stats.total, lbl: "Shifts",   col: "#38BDF8" },
            { icon: "⏱",  val: `${stats.hours}h`, lbl: "Hours", col: "#a78bfa" },
            { icon: "⚠",  val: stats.ot,    lbl: "OT",       col: stats.ot > 0 ? "#ef4444" : "#43D9AD" },
          ].map((s) => (
            <div key={s.lbl} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                 style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-xs">{s.icon}</span>
              <span className="text-sm font-black" style={{ color: s.col }}>{s.val}</span>
              <span className="text-[9px] uppercase tracking-wider" style={{ color: "#334155" }}>{s.lbl}</span>
            </div>
          ))}

          {/* Add employee */}
          {!isPublished && (
            <button
              onClick={() => setEmployeeModal({ open: true, mode: "add", employee: { color: "#6C63FF", role: "Barista" } })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg,#6C63FF,#a78bfa)" }}
            >
              <span>＋</span> Employee
            </button>
          )}

          {/* Draft / Published toggle */}
          <div
            className="flex p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {([false, true] as boolean[]).map((pub) => (
              <button
                key={String(pub)}
                onClick={() => setIsPublished(pub)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
                style={
                  isPublished === pub
                    ? {
                        background: pub ? "#15803d" : "#4338ca",
                        color: "#fff",
                        boxShadow: pub ? "0 2px 10px #15803d40" : "0 2px 10px #4338ca40",
                      }
                    : { color: "#475569" }
                }
              >
                {pub ? "✓ Published" : "✏ Draft"}
              </button>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
};


export default WeeklyScheduler;