import React, { useState } from "react";
import { CopyShiftModalPayload, Shift , Employee } from "../types/scheduler";
import { DAYS, DAY_NUMBERS } from "../types/scheduler";
import {
  formatHour,
  formatDuration,
  hasConflict,
  generateId,
  cloneShift,
} from "../utils/DateUtils";

interface CopyShiftModalProps {
  payload: CopyShiftModalPayload;
  employees: Employee[];
  allShifts: Shift[];
  onConfirm: (newShifts: Shift[]) => Promise<void>;
  onClose: () => void;
  isCopying?: boolean;
}

const CopyShiftModal: React.FC<CopyShiftModalProps> = ({
    payload,
    employees,
    allShifts,
    onConfirm,
    onClose,
    isCopying,
}) => {
    const { sourceShift } = payload;
    const sourceEmp = employees.find((e) => e.id === sourceShift.employeeId);

    // target selections
    const [targetEmpId, setTargetEmpId] = useState<string>(sourceShift.employeeId);

    const [targetDayIndex, setTargetDayIndex] = useState<number>(sourceShift.dayIndex);
    
    const [error, setError] = useState("");

    const targetEmp = employees.find((e)=> e.id=== targetEmpId);
    const duration = sourceShift.endHour - sourceShift.startHour;
    const isSameCell = targetEmpId === sourceShift.employeeId && targetDayIndex === sourceShift.dayIndex;

    const handleConfirm = async () => {
        setError("");

        const newShift: Shift = cloneShift(sourceShift, {
            id: generateId(),
            employeeId: targetEmpId,
            dayIndex: targetDayIndex,
        });

        const others = allShifts.filter((s) => s.id !== newShift.id);
        if (hasConflict(newShift, others)) {
            setError("The copy would overlap an existing shift for that employee.");
            return;
        }

        await onConfirm([newShift]);
    };
    return (
        <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(3,5,12,0.88)", backdropFilter: "blur(10px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[460px] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "#0b0f1a",
          border: "1px solid rgba(255,255,255,0.07)",
          animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Accent bar */}
        <div className="h-[3px] w-full"
             style={{ background: "linear-gradient(90deg,#43D9AD,#38BDF8)" }} />

        <div className="p-7">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
                 style={{ color: "#43D9AD" }}>
                ⎘ Copy Shift
              </p>
              <h2 className="text-xl font-black text-white tracking-tight">
                Duplicate to another slot
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500
                         bg-white/[0.04] border border-white/[0.08]
                         hover:bg-white/[0.08] hover:text-slate-300 transition-all text-sm"
            >✕</button>
          </div>

          {/* Source preview */}
          {sourceEmp && (
            <div
              className="rounded-xl border p-4 mb-5"
              style={{
                background: `${sourceEmp.color}0d`,
                borderColor: `${sourceEmp.color}28`,
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2.5"
                 style={{ color: "#334155" }}>
                Copying this shift
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border"
                  style={{
                    background: `${sourceEmp.color}18`,
                    borderColor: `${sourceEmp.color}35`,
                    color: sourceEmp.color,
                  }}
                >
                  {sourceEmp.avatarInitials}
                </div>
                <div>
                  <p className="font-bold text-slate-100 text-sm">{sourceEmp.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>
                    {DAYS[sourceShift.dayIndex]} {DAY_NUMBERS[sourceShift.dayIndex]} ·{" "}
                    {formatHour(sourceShift.startHour)}–{formatHour(sourceShift.endHour)} ·{" "}
                    {sourceShift.label} · {formatDuration(duration)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Arrow */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-base" style={{ color: "#334155" }}>↓</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Target employee */}
          <div className="mb-4">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                   style={{ color: "#475569" }}>
              Target Employee
            </label>
            <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1"
                 style={{ scrollbarWidth: "thin" }}>
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => { setTargetEmpId(emp.id); setError(""); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all duration-150"
                  style={
                    targetEmpId === emp.id
                      ? { background: `${emp.color}14`, borderColor: `${emp.color}40` }
                      : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }
                  }
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: `${emp.color}18`, color: emp.color }}
                  >
                    {emp.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-200 truncate">{emp.name}</p>
                    <p className="text-[10px]" style={{ color: "#475569" }}>{emp.role}</p>
                  </div>
                  {targetEmpId === emp.id && (
                    <span className="ml-auto text-xs" style={{ color: emp.color }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Target day */}
          <div className="mb-5">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                   style={{ color: "#475569" }}>
              Target Day
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => { setTargetDayIndex(idx); setError(""); }}
                  className="flex flex-col items-center py-2 rounded-xl border text-xs font-bold transition-all duration-150"
                  style={
                    targetDayIndex === idx
                      ? {
                          background: targetEmp ? `${targetEmp.color}22` : "#43D9AD22",
                          borderColor: targetEmp ? `${targetEmp.color}45` : "#43D9AD45",
                          color: targetEmp?.color ?? "#43D9AD",
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          borderColor: "rgba(255,255,255,0.07)",
                          color: idx >= 5 ? "#f59e0b80" : "#64748b",
                        }
                  }
                >
                  <span>{name}</span>
                  <span className="text-[9px] mt-0.5 font-normal opacity-60">{DAY_NUMBERS[idx]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Destination preview */}
          {targetEmp && (
            <div
              className="rounded-xl border p-3.5 mb-4"
              style={{
                background: isSameCell ? "rgba(127,29,29,0.12)" : `${targetEmp.color}0a`,
                borderColor: isSameCell ? "rgba(127,29,29,0.5)" : `${targetEmp.color}22`,
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: "#334155" }}>
                Will appear at
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: `${targetEmp.color}18`, color: targetEmp.color }}
                >
                  {targetEmp.avatarInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">{targetEmp.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>
                    {DAYS[targetDayIndex]} {DAY_NUMBERS[targetDayIndex]} ·{" "}
                    {formatHour(sourceShift.startHour)}–{formatHour(sourceShift.endHour)}
                  </p>
                </div>
              </div>
              {isSameCell && (
                <p className="text-[10px] mt-2 font-medium" style={{ color: "#f59e0b" }}>
                  ⚠ Same cell as source — will create a duplicate
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border mb-4 text-xs"
              style={{ background: "#1a0808", borderColor: "#7f1d1d80", color: "#fca5a5" }}
            >
              <span className="mt-px shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={handleConfirm}
              disabled={isCopying}
              className="flex-1 py-3 rounded-xl font-bold text-sm text-white tracking-wide
                         disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg,#43D9AD,#38BDF8)" }}
            >
              {isCopying ? "Copying…" : "⎘ Copy Shift"}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-bold text-sm text-slate-400 active:scale-[0.98] transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: scale(0.87) translateY(20px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);     opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CopyShiftModal;