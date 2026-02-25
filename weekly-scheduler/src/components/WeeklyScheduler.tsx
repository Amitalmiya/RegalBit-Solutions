import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DAY_START, DAY_END, Employee, MIN_COL_WIDTH, SIDEBAR_WIDTH,
  ShiftModalPayload, OVERTIME_LIMIT, DragState, TOTAL_HOURS, Shift,
  ResizeState, CopyShiftModalPayload, ROW_HEIGHT, DAYS, DAY_NUMBERS, HEADER_HEIGHT,
} from '../types/scheduler';
import { useScheduler } from '../hooks/Usescheduler';
import {
  calcDraggedShift, calcOvertimeHours, calcResizedShift, calcWeeklyHours,
  clamp, cloneShift, generateId, hasConflict, isOvertime,
  shiftToGridPosition, snapHour,
} from '../utils/DateUtils';
import ShiftCard from './ShiftCard';
import AddShiftModal from './AddShiftModal';
import CopyShiftModal from './CopyShiftModal';
import ConfirmDialog from './ConfirmDialog';

const RULER_HOURS: number[] = [];
for (let h = DAY_START; h <= DAY_END; h += 2) RULER_HOURS.push(h);

interface Toast { message: string; type: 'success' | 'error' | 'info' }

interface EmployeeModalState {
  open: boolean;
  mode: 'add' | 'edit';
  employee: Partial<Employee>;
}

const ROLE_OPTIONS  = ['Barista', 'Cashier', 'Manager', 'Barback', 'Chef', 'Host'];
const COLOR_OPTIONS = [
  '#6C63FF','#FF6584','#43D9AD','#F5A623','#38BDF8',
  '#f472b6','#fb923c','#4ade80','#e879f9','#fbbf24',
];

const WeeklyScheduler: React.FC = () => {
  const {
    shifts, employees, loading, error,
    addShift, editShift, removeShift, copyShifts,
    updateShiftLocal, persistShift,
    addEmployee, editEmployee, removeEmployee,
    isSavingEmployee,
  } = useScheduler();

  const gridRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState<number>(MIN_COL_WIDTH);

  useEffect(() => {
    const measure = () => {
      if (!gridRef.current) return;
      const w = (gridRef.current.clientWidth - SIDEBAR_WIDTH) / 7;
      setColWidth(Math.max(w, MIN_COL_WIDTH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (gridRef.current) ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, []);

  const [isPublished, setIsPublished] = useState(false);
  const [toast, setToast]             = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [shiftModal,     setShiftModal]     = useState<ShiftModalPayload | null>(null);
  const [copyModal,      setCopyModal]      = useState<CopyShiftModalPayload | null>(null);
  const [employeeModal,  setEmployeeModal]  = useState<EmployeeModalState | null>(null);
  const [isSavingShift,  setIsSavingShift]  = useState(false);
  const [isCopyingShift, setIsCopyingShift] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, message: '', onConfirm: () => {} });

  const openConfirm = (message: string, onConfirm: () => void) =>
    setConfirmDialog({ isOpen: true, message, onConfirm });

  const closeConfirm = () =>
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

  const dragRef   = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [dragPreview, setDragPreview] = useState<Shift | null>(null);

  const stats = useMemo(() => ({
    total: shifts.length,
    hours: shifts.reduce((s, sh) => s + (sh.endHour - sh.startHour), 0),
    ot:    employees.filter((e) => calcWeeklyHours(shifts, e.id) > OVERTIME_LIMIT).length,
  }), [shifts, employees]);

  const getGridRelativeX = useCallback((clientX: number): number => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    return clientX - rect.left - SIDEBAR_WIDTH;
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent, shift: Shift) => {
    if (isPublished) return;
    e.preventDefault();
    const relX       = getGridRelativeX(e.clientX);
    const dayRelX    = relX - shift.dayIndex * colWidth;
    const offsetHour = (dayRelX / colWidth) * TOTAL_HOURS - (shift.startHour - DAY_START);
    dragRef.current  = { shiftId: shift.id, offsetHour };
    setDragPreview(shift);
  }, [isPublished, getGridRelativeX, colWidth]);

  const handleResizeStart = useCallback((e: React.MouseEvent, shiftId: string, edge: 'start' | 'end') => {
    if (isPublished) return;
    e.preventDefault();
    resizeRef.current = { shiftId, edge };
  }, [isPublished]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPublished) return;
    const relX = getGridRelativeX(e.clientX);
    if (dragRef.current) {
      const original = shifts.find((s) => s.id === dragRef.current!.shiftId);
      if (!original) return;
      const next    = calcDraggedShift(original, relX, dragRef.current.offsetHour, colWidth);
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

  const handleMouseUp = useCallback(async () => {
    if (dragRef.current || resizeRef.current) {
      const id          = dragRef.current?.shiftId ?? resizeRef.current?.shiftId;
      dragRef.current   = null;
      resizeRef.current = null;
      setDragPreview(null);
      if (id) {
        const latest = shifts.find((s) => s.id === id);
        if (latest) {
          const conflict = hasConflict(latest, shifts.filter((s) => s.id !== id));
          if (conflict) {
            showToast('Shift overlaps — reverted', 'error');
          } else {
            try { await persistShift(latest); showToast('Shift saved ✓'); }
            catch { showToast('Failed to save shift', 'error'); }
          }
        }
      }
    }
  }, [shifts, persistShift, showToast]);

  useEffect(() => {
    const fn = () => handleMouseUp();
    window.addEventListener('mouseup', fn);
    return () => window.removeEventListener('mouseup', fn);
  }, [handleMouseUp]);

  const handleCellClick = useCallback((empId: string, dayIndex: number, e: React.MouseEvent) => {
    if (isPublished) return;
    if (dragRef.current || resizeRef.current) return;
    const relX    = getGridRelativeX(e.clientX);
    const dayRelX = relX - dayIndex * colWidth;
    const rawHour = DAY_START + (dayRelX / colWidth) * TOTAL_HOURS;
    const snapped = clamp(snapHour(rawHour), DAY_START, DAY_END - 1);
    setShiftModal({
      mode: 'create',
      shift: { employeeId: empId, dayIndex, startHour: snapped, endHour: snapped + 4, label: 'Morning' },
    });
  }, [isPublished, getGridRelativeX, colWidth]);

  const handleSaveShift = async (shift: Shift) => {
    setIsSavingShift(true);
    try {
      if (shiftModal?.mode === 'edit') { await editShift(shift); showToast('Shift updated ✓'); }
      else                             { await addShift(shift);  showToast('Shift added ✓');   }
      setShiftModal(null);
    } catch { showToast('Failed to save shift', 'error'); }
    finally  { setIsSavingShift(false); }
  };

  const handleDeleteShift = (id: string) =>
    openConfirm(`Are you sure you want to delete this shift?`, async () => {
      closeConfirm();
      try { await removeShift(id); showToast('Shift deleted', 'info'); }
      catch { showToast('Failed to delete shift', 'error'); }
    });

  const handleCopyConfirm = async (newShifts: Shift[]) => {
    setIsCopyingShift(true);
    try { await copyShifts(newShifts); setCopyModal(null); showToast('Shift copied ✓'); }
    catch { showToast('Failed to copy shift', 'error'); }
    finally { setIsCopyingShift(false); }
  };

  const handleSaveEmployee = async () => {
    if (!employeeModal) return;
    const { mode, employee: emp } = employeeModal;
    if (!emp.name?.trim()) return;
    const full: Employee = {
      id:             emp.id ?? generateId(),
      name:           emp.name.trim(),
      role:           emp.role ?? 'Barista',
      color:          emp.color ?? '#6C63FF',
      avatarInitials: emp.name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    };
    try {
      if (mode === 'edit') { await editEmployee(full); showToast('Employee updated ✓'); }
      else                 { await addEmployee(full);  showToast('Employee added ✓');   }
      setEmployeeModal(null);
    } catch { showToast('Failed to save employee', 'error'); }
  };

  const handleDeleteEmployee = (empId: string) =>
    openConfirm('Delete this employee and all their shifts? This cannot be undone.', async () => {
      closeConfirm();
      try { await removeEmployee(empId); showToast('Employee removed', 'info'); }
      catch { showToast('Failed to remove employee', 'error'); }
    });

  // Row renderer 
  const renderRow = (emp: Employee) => {
    const empShifts = shifts.filter((s) => s.employeeId === emp.id);
    const wkHours   = calcWeeklyHours(shifts, emp.id);
    const ot        = isOvertime(shifts, emp.id);
    const otHours   = calcOvertimeHours(shifts, emp.id);
    const pct       = Math.min((wkHours / OVERTIME_LIMIT) * 100, 100);
    const barColor  = ot ? '#ef4444' : wkHours / OVERTIME_LIMIT > 0.8 ? '#f59e0b' : emp.color;

    return (
      <div key={emp.id} className="flex group/row" style={{ height: ROW_HEIGHT }}>

        {/* Sidebar */}
  
        <div
          className="shrink-0 flex flex-col justify-center px-3 gap-1.5 border-b border-r"
          style={{
            width: SIDEBAR_WIDTH,
            borderColor: 'rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${emp.color}`,
            background: '#111827',    
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0"
              style={{
                background: `${emp.color}22`,
                border: `1.5px solid ${emp.color}55`,
                color: emp.color,
              }}
            >
              {emp.avatarInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold truncate leading-tight" style={{ color: '#f1f5f9' }}>
                {emp.name}
              </p>
              <p className="text-[10px] font-medium truncate" style={{ color: '#94a3b8' }}>
                {emp.role}
              </p>
            </div>

            {!isPublished && (
              <button
                onClick={() => setEmployeeModal({ open: true, mode: 'edit', employee: { ...emp } })}
                title="Edit employee"
                className="w-6 h-6 flex items-center justify-center rounded-lg text-[10px] shrink-0
                           opacity-0 group-hover/row:opacity-100 transition-all duration-200"
                style={{ background: `${emp.color}20`, border: `1px solid ${emp.color}40`, color: emp.color }}
              >✏
              </button>
            )}
          </div>

          {/* Hours bar */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
                hrs
              </span>
              <span className="text-[10px] font-bold" style={{ color: ot ? '#ef4444' : '#94a3b8' }}>
                {wkHours}h{ot ? ` +${otHours}OT` : ''}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
          </div>
        </div>

        {/* ── Day */}
        <div
          className="relative flex-1 border-b"
          style={{
            borderColor: 'rgba(255,255,255,0.06)',
            background: '#0f172a',        
          }}
          onMouseDown={(e) => {
            if (!(e.target as HTMLElement).closest('[data-shift]')) {
              handleCellClick(emp.id, Math.floor(getGridRelativeX(e.clientX) / colWidth), e);
            }
          }}
        >
          {/* Column dividers */}
          {DAYS.map((_, di) => (
            <div
              key={di}
              className="absolute top-0 h-full border-r pointer-events-none"
              style={{
                left: di * colWidth,
                width: colWidth,
                borderColor: 'rgba(255,255,255,0.05)',
                background: di >= 5 ? 'rgba(251,191,36,0.04)' : 'transparent',
              }}
            />
          ))}

          {/* Shift cards */}
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
                  onEdit={(s) => setShiftModal({ mode: 'edit', shift: { ...s } })}
                  onCopy={(s) => setCopyModal({ sourceShift: s })}
                  onDelete={handleDeleteShift}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // MAIN RETURN 
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: '#080b12',           
        fontFamily: "'Outfit', sans-serif",
        color: '#e2e8f0',
      }}
      onMouseMove={handleMouseMove}
    >
      {/* TOP BAR  */}
      <header
        className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between gap-4 shrink-0"
        style={{
          background: 'rgba(15,23,42,0.97)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(199,102,241,0.2)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
              color: '#fff',
            }}
          >⚡
          </div>
          <div>
            <h1 className="text-[17px] font-black leading-none tracking-tight uppercase" style={{ color: '#f8fafc' }}>
              Weekly<span style={{ color: '#818cf8' }}></span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.25em] mt-0.5 font-semibold " style={{ color: '#d3dded' }}>
              Scheduler
            </p>
          </div>
        </div>

        {/* Week badge */}
        <div
          className="px-5 py-2.5 rounded-xl text-center"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <p className="text-xs font-bold" style={{ color: '#c7d2fe' }}>Feb 17 – 23, 2026</p>
          <p className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: '#4c5880' }}>Week 8</p>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          {/* Stats chips */}
          {[
            { icon: '📋', val: stats.total,       lbl: 'Shifts',   col: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  bd: 'rgba(56,189,248,0.2)'  },
            { icon: '⏱',  val: `${stats.hours}h`, lbl: 'Hours',    col: '#a78bfa', bg: 'rgba(167,139,250,0.1)', bd: 'rgba(167,139,250,0.2)' },
            {
              icon: '⚠',
              val: stats.ot,
              lbl: 'OT',
              col: stats.ot > 0 ? '#f87171' : '#34d399',
              bg:  stats.ot > 0 ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
              bd:  stats.ot > 0 ? 'rgba(248,113,113,0.25)' : 'rgba(52,211,153,0.2)',
            },
          ].map((s) => (
            <div
              key={s.lbl}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style={{ background: s.bg, border: `1px solid ${s.bd}` }}
            >
              <span className="text-sm">{s.icon}</span>
              <div>
                <p className="text-sm font-black leading-none" style={{ color: s.col }}>{s.val}</p>
                <p className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: '#64748b' }}>{s.lbl}</p>
              </div>
            </div>
          ))}

          {/* Add employee */}
          {!isPublished && (
            <button
              onClick={() => setEmployeeModal({ open: true, mode: 'add', employee: { color: '#6366f1', role: 'Barista' } })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 2px 14px rgba(99,102,241,0.4)',
              }}
            >
              <span className="text-base leading-none">＋</span> Employee
            </button>
          )}

          {/* Draft / Published toggle */}
          <div
            className="flex p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {([false, true] as boolean[]).map((pub) => (
              <button
                key={String(pub)}
                onClick={() => setIsPublished(pub)}
                className="px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200"
                style={
                  isPublished === pub
                    ? {
                        background: pub
                          ? 'linear-gradient(135deg,#15803d,#16a34a)'
                          : 'linear-gradient(135deg,#4338ca,#6366f1)',
                        color: '#fff',
                        boxShadow: pub ? '0 2px 10px rgba(22,163,74,0.4)' : '0 2px 10px rgba(99,102,241,0.4)',
                      }
                    : { color: '#64748b' }
                }
              >
                {pub ? '✓ Published' : '✏ Draft'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Published banner */}
      {isPublished && (
        <div
          className="px-6 py-3 flex items-center gap-3 text-sm font-semibold shrink-0"
          style={{
            background: 'rgba(20,83,45,0.25)',
            borderBottom: '1px solid rgba(34,197,94,0.2)',
            color: '#86efac',
          }}
        >
          🔒 Schedule published — switch to <strong>Draft</strong> to edit.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="px-6 py-3 flex items-center gap-3 text-sm font-semibold shrink-0"
          style={{
            background: 'rgba(127,29,29,0.35)',
            borderBottom: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* ── GRID */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: '#6366f1', borderTopColor: 'transparent' }}
          />
          <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: '#475569' }}>
            Connecting to json-server…
          </p>
          <code
            className="text-[11px] px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            npx json-server --watch src/db/db.json --port 5000
          </code>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-5">
          <div
            ref={gridRef}
            className="rounded-2xl overflow-hidden select-none"
            style={{
              border: '1px solid rgba(99,102,241,0.18)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              minWidth: SIDEBAR_WIDTH + MIN_COL_WIDTH * 7,
            }}
          >
            {/* Column header */}
            <div
              className="flex sticky top-0 z-10"
              style={{
                height: HEADER_HEIGHT,
                background: '#1e293b',    
                borderBottom: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              {/* Corner */}
              <div
                className="shrink-0 flex items-end px-4 pb-2.5"
                style={{ width: SIDEBAR_WIDTH, borderRight: '1px solid rgba(99,102,241,0.15)' }}
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: '#64748b' }}>
                  Employee
                </span>
              </div>

              {/* Day headers */}
              {DAYS.map((day, di) => (
                <div
                  key={di}
                  className="flex flex-col items-center justify-center gap-0.5 border-r"
                  style={{
                    width: colWidth,
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: di >= 5 ? 'rgba(245,158,11,0.07)' : 'transparent',
                  }}
                >
                  <span
                    className="text-[9px] font-black uppercase tracking-[0.2em]"
                    style={{ color: di >= 5 ? '#f59e0b' : '#818cf8' }}
                  >
                    {day}
                  </span>
                  <span
                    className="text-[22px] font-black leading-none"
                    style={{ color: di >= 5 ? '#fbbf24' : '#f1f5f9' }}
                  >
                    {DAY_NUMBERS[di]}
                  </span>
                  <span className="text-[8px] font-medium" style={{ color: '#334155' }}>Feb</span>
                </div>
              ))}
            </div>

            {/* Employee rows */}
            <div style={{ background: '#0f172a' }}>
              {employees.map((emp) => renderRow(emp))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex gap-4 flex-wrap px-1">
            {!isPublished ? (
              [
                ['🖱 Click empty area', 'add a shift at that hour'],
                ['↔ Drag shift',        'move across days'],
                ['⇔ Edge handles',      'resize start or end'],
                ['✏ Hover shift',       'edit / copy / delete'],
                ['🔴 OT badge',          'weekly overtime exceeded'],
              ].map(([k, v]) => (
                <span key={k} className="text-[11px]">
                  <strong style={{ color: '#475569' }}>{k}</strong>
                  <span style={{ color: '#334155' }}> — {v}</span>
                </span>
              ))
            ) : (
              <span className="text-[11px] font-semibold" style={{ color: '#16a34a' }}>
                🔒 Published — switch to Draft to edit
              </span>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className="fixed bottom-7 right-7 z-50 px-5 py-3.5 rounded-2xl text-sm font-semibold shadow-2xl flex items-center gap-3 max-w-sm"
          style={{
            animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            background:
              toast.type === 'error'   ? '#1a0a0a'
            : toast.type === 'success' ? '#0a1a0f'
                                       : '#111827',
            border: `1px solid ${
              toast.type === 'error'   ? 'rgba(239,68,68,0.4)'
            : toast.type === 'success' ? 'rgba(34,197,94,0.35)'
                                       : 'rgba(99,102,241,0.35)'
            }`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            color:
              toast.type === 'error'   ? '#fca5a5'
            : toast.type === 'success' ? '#86efac'
                                       : '#c7d2fe',
          }}
        >
          <span className="text-base font-black">
            {toast.type === 'error' ? '✕' : toast.type === 'success' ? '✓' : 'ℹ'}
          </span>
          {toast.message}
        </div>
      )}

      {/* SHIFT MODAL*/}
      {shiftModal && (
        <AddShiftModal
          payload={shiftModal}
          employees={employees}
          allShifts={shifts}
          onSave={handleSaveShift}
          onClose={() => setShiftModal(null)}
          isSaving={isSavingShift}
        />
      )}

      {/* COPY MODAL */}
      {copyModal && (
        <CopyShiftModal
          payload={copyModal}
          employees={employees}
          allShifts={shifts}
          onConfirm={handleCopyConfirm}
          onClose={() => setCopyModal(null)}
          isCopying={isCopyingShift}
        />
      )}

      {/* ── EMPLOYEE MODAL */}
      {employeeModal?.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(14px)' }}
          onClick={(e) => e.target === e.currentTarget && setEmployeeModal(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: '#1e293b',      
              border: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
              animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {/* Accent bar */}
            <div
              className="h-[3px] w-full"
              style={{
                background: employeeModal.employee.color
                  ? `linear-gradient(90deg, ${employeeModal.employee.color}, ${employeeModal.employee.color}44, transparent)`
                  : 'linear-gradient(90deg, #6366f1, #a78bfa44, transparent)',
              }}
            />

            <div className="p-7">
              {/* Header */}
              <div className="flex justify-between items-start mb-7">
                <div>
                  <p
                    className="text-[10px] font-black tracking-[0.22em] uppercase mb-2"
                    style={{ color: employeeModal.mode === 'edit' ? '#fb923c' : '#34d399' }}
                  >
                    {employeeModal.mode === 'edit' ? '✏ Edit Employee' : '＋ New Employee'}
                  </p>
                  <h2 className="text-2xl font-black tracking-tight" style={{ color: '#f8fafc' }}>
                    {employeeModal.mode === 'edit' ? 'Update Profile' : 'Add Team Member'}
                  </h2>
                </div>
                <button
                  onClick={() => setEmployeeModal(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-all hover:scale-110"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#94a3b8',
                  }}
                >✕</button>
              </div>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#94a3b8' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={employeeModal.employee.name ?? ''}
                  onChange={(e) => setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, name: e.target.value } } : p)}
                  placeholder="Alex Rivera"
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#e2e8f0',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(99,102,241,0.6)')}
                  onBlur={(e)  => (e.target.style.borderColor = 'rgba(99,102,241,0.2)')}
                />
              </div>

              {/* Role */}
              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: '#94a3b8' }}>
                  Role
                </label>
                <select
                  value={employeeModal.employee.role ?? 'Barista'}
                  onChange={(e) => setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, role: e.target.value } } : p)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium cursor-pointer"
                  style={{
                    background: '#0f172a',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#e2e8f0',
                    outline: 'none',
                    colorScheme: 'dark',
                  }}
                >
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Colour */}
              <div className="mb-7">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: '#94a3b8' }}>
                  Colour
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEmployeeModal((p) => p ? { ...p, employee: { ...p.employee, color: c } } : p)}
                      className="w-9 h-9 rounded-xl transition-all hover:scale-110 active:scale-95"
                      style={{
                        background: c,
                        border: employeeModal.employee.color === c ? '3px solid #fff' : '3px solid transparent',
                        boxShadow: employeeModal.employee.color === c ? `0 0 0 3px ${c}50, 0 4px 12px ${c}60` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveEmployee}
                  disabled={isSavingEmployee}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                >
                  {isSavingEmployee ? 'Saving…' : employeeModal.mode === 'edit' ? 'Update Employee' : 'Add Employee'}
                </button>
                {employeeModal.mode === 'edit' && employeeModal.employee.id && (
                  <button
                    onClick={() => handleDeleteEmployee(employeeModal.employee.id!)}
                    className="px-5 py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.88) translateY(20px); opacity: 0; }
          to   { transform: scale(1)    translateY(0);    opacity: 1; }
        }
        @keyframes toastIn {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 0.9s linear infinite; }
      `}</style>
    </div>
  );
};

export default WeeklyScheduler;