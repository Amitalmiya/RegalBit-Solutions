import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DAY_START, DAY_END, Employee, MIN_COL_WIDTH, SIDEBAR_WIDTH, ShiftModalPayload, OVERTIME_LIMIT, DragState, TOTAL_HOURS, Shift, ResizeState, CopyShiftModalPayload, ROW_HEIGHT, DAYS, DAY_NUMBERS, HEADER_HEIGHT, } from '../types/scheduler';
import { useScheduler } from '../hooks/Usescheduler';
import { calcDraggedShift, calcOvertimeHours, calcResizedShift, calcWeeklyHours, clamp, cloneShift, generateId, hasConflict, isOvertime, shiftToGridPosition, snapHour } from '../utils/DateUtils';
import ShiftCard from './ShiftCard';
import AddShiftModal from './AddShiftModal';
import CopyShiftModal from './CopyShiftModal';
import ConfirmDialog from './ConfirmDialog';

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

  // Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: Boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const openConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

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

 const handleDeleteShift = (id: string) => {
    openConfirm('Are you sure you want to delete this shift?', async () => {
      closeConfirm();
      try {
        await removeShift(id);
        showToast('Shift deleted', 'info');
      } catch {
        showToast('Failed to delete shift', 'error');
      }
    });
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

 const handleDeleteEmployee = (empId: string) => {
    openConfirm('Delete this employee and all their shifts? This cannot be undone.', async () => {
      closeConfirm();
      try {
        await removeEmployee(empId);
        showToast('Employee removed', 'info');
      } catch {
        showToast('Failed to remove employee', 'error');
      }
    });
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
                  style={{ color: "#fff" }}
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
      style={{ background: "#080b12", fontFamily: "'Outfit', sans-serif" }}
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

      {isPublished && (
        <div className="px-6 py-2.5 flex items-center gap-2 text-sm font-semibold shrink-0"
             style={{ background: 'rgba(20,83,45,0.2)', borderBottom: '1px solid rgba(22,101,52,0.35)', color: '#4ade80' }}>
          🔒 Schedule published — switch to <strong>Draft</strong> to edit.
        </div>
      )}

      {error && (
         <div className="px-6 py-2.5 flex items-center gap-2 text-sm font-semibold shrink-0"
             style={{ background: 'rgba(127,29,29,0.3)', borderBottom: '1px solid rgba(127,29,29,0.5)', color: '#fca5a5' }}>
          ⚠ {error}
        </div>
      )}

      {/* grid */}
      {loading ? (
         <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
               style={{ borderColor: '#6C63FF', borderTopColor: 'transparent' }} />
          <p className="text-xs uppercase tracking-widest" style={{ color: '#334155' }}>
            Connecting to json-server…
          </p>
          <p className="text-[10px] font-mono" style={{ color: '#1e2d40' }}>
            npx json-server --watch src/db/db.json --port 5000
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div 
            ref={gridRef}
            className="rounded-2xl overflow-hidden shadow-2xl select-none"
            style={{ border: '1px solid rgba(255,255,255,0.06)', minWidth: SIDEBAR_WIDTH + MIN_COL_WIDTH * 7 }}
          >
            {/* Column header */}
            <div className="flex sticky top-0 z-10"
              style={{
                height: HEADER_HEIGHT,
                background: '#080b12',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="shrink-0 flex items-end px-3 pb-2"
                style={{ width: SIDEBAR_WIDTH, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-[8px] uppercase tracking-[0.22em]"
                    style={{
                      // color: '#1e2d40'
                    }}
                  >Employee</span>
                </div>
              {DAYS.map((day, di) => (
                <div
                  key={di}
                  className="flex flex-col items-center justify-center border-r"
                  style={{
                    width: colWidth,
                    borderColor: 'rgba(255,255,255,0.05)',
                    background: di >= 5 ? '#0a0d14' : 'transparent',
                  }}
                >
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${di >= 5 ? 'text-amber-500/70' : 'text-[#6C63FF]/70'}`}>
                    {day}
                  </span>
                  <span className={`text-xl font-black leading-tight ${di >= 5 ? 'text-amber-400/80' : 'text-slate-100'}`}>
                    {DAY_NUMBERS[di]}
                  </span>
                </div>
              ))}
            </div>

            {/* Employee rows */}
            <div>
              {employees.map((emp) => renderRow(emp))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-5 flex-wrap">
            {!isPublished ? (
              [
                ['🖱 Click empty area', 'add a shift'],
                ['↔ Drag shift',        'move across days'],
                ['⇔ Resize handles',    'adjust start or end'],
                ['✏ Hover shift',       'edit / copy / delete'],
                ['🔴 OT badge',          'weekly limit exceeded'],
              ].map(([k, v]) => (
                <span key={k} className="text-[11px]" style={{ color: '#334155' }}>
                  <strong style={{ color: '#475569' }}>{k}</strong> — {v}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: '#166534' }}>
                🔒 Published — switch to Draft to edit
              </span>
            )}
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div
          className="fixed bottom-7 right-7 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl max-w-xs"
          style={{
            animation: 'toastIn 0.25s ease',
            background:
              toast.type === 'error'   ? 'rgba(127,29,29,0.95)'
            : toast.type === 'success' ? 'rgba(20,83,45,0.95)'
                                       : 'rgba(30,40,60,0.95)',
            border: `1px solid ${
              toast.type === 'error'   ? 'rgba(220,38,38,0.4)'
            : toast.type === 'success' ? 'rgba(22,163,74,0.4)'
                                       : 'rgba(255,255,255,0.08)'
            }`,
            color:
              toast.type === 'error'   ? '#fca5a5'
            : toast.type === 'success' ? '#86efac'
                                       : '#94a3b8',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* shiftModal */}
      {shiftModal && (
        <AddShiftModal />
      )}

      {/* CopyModal */}
      {copyModal && (
        <CopyShiftModal />
      )}

      {employeeModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(3,5,12,0.88)', backdropFilter: 'blur(10px)' }}
            onClick={(e) => e.target === e.currentTarget && setEmployeeModal(null)}
          >
            <div className="w-full max-w-[400px] rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: '#0b0f1a',
                border: '1px solid rgba(255,255,255,0.07)',
                animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              <div
              className="h-[3px]"
              style={{
                background: employeeModal.employee.color
                  ? `linear-gradient(90deg,${employeeModal.employee.color},${employeeModal.employee.color}44)`
                  : 'linear-gradient(90deg,#6C63FF,#6C63FF44)',
              }}
            />
            <div className="p-7">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p 
                  className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
                  style={{ color: employeeModal.mode === 'edit' ? '#fb923c' : '#43D9AD' }}
                  >
                    {employeeModal.mode === 'edit' ? '✏ Edit Employee' : '＋ New Employee'}
                  </p>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {employeeModal.mode === 'edit' ? 'Update Profile' : 'Add Team Member'}
                  </h2>
                </div>
                <button onClick={() => setEmployeeModal(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-slate-300 transition-all text-sm">✕</button>
              </div>
              {/* Name */}
              <div className="mb-4">
                <label htmlFor="" 
                  className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                  style={{ color: '#475569' }}
                  >
                    Full Name
                  </label>

                  <input 
                    type="text" 
                    value={employeeModal.employee.name ?? ''}
                    onChange={(e) =>
                      setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, name: e.target.value } } : p)
                    }
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 placeholder-slate-700"
                    style={{ background: '#121826', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}
                  />
              </div>

              {/* Role */}
              <div className="mb-4">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                       style={{ color: '#475569' }}>Role</label>
                <select
                  value={employeeModal.employee.role ?? 'Barista'}
                  onChange={(e) =>
                    setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, role: e.target.value } } : p)
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer"
                  style={{ background: '#121826', border: '1px solid rgba(255,255,255,0.08)', colorScheme: 'dark' }}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {/* Color */}
                  <div className="mb-6">
                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                       style={{ color: '#475569' }}>Colour</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() =>
                        setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, color: c } } : p)
                      }
                      className="w-8 h-8 rounded-lg border-2 transition-all"
                      style={{
                        background: c,
                        borderColor: employeeModal.employee.color === c ? '#fff' : 'transparent',
                        boxShadow:   employeeModal.employee.color === c ? `0 0 0 2px ${c}60` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  onClick={handleSaveEmployee}
                  disabled={isSavingEmployee}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white tracking-wide
                             disabled:opacity-50 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg,#6C63FF,#a78bfa)' }}
                >
                  {isSavingEmployee ? 'Saving…' : employeeModal.mode === 'edit' ? 'Update' : 'Add Employee'}
                </button>
                {employeeModal.mode === 'edit' && employeeModal.employee.id && (
                  <button
                    onClick={() => handleDeleteEmployee(employeeModal.employee.id!)}
                    className="px-4 py-3 rounded-xl font-bold text-sm text-red-400 active:scale-[0.98] transition-all"
                    style={{ background: 'rgba(127,29,29,0.25)', border: '1px solid rgba(127,29,29,0.4)' }}
                  >Remove</button>
                )}
              </div>
            </div>
            </div>
        </div>
      )}   
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

    </div>
  );
};

export default WeeklyScheduler;