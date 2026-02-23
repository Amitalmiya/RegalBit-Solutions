import React, { useRef } from "react";
import type { Shift, Employee, DragState, ResizeState } from "../types/scheduler";
import { formatHour, formatDuration, isOvertime } from "../utils/DateUtils";

const LABEL_ACCENT: Record<string, string> = {
  Morning:    "#facc15",
  Mid:        "#a78bfa",
  Afternoon:  "#fb923c",
  Night:      "#818cf8",
  Dawn:       "#38BDF8",
  "Full Day": "#43D9AD",
};

interface ShiftCardProps {
  shift: Shift;
  employee: Employee;
  allShifts: Shift[];
  leftPx: number;
  widthPx: number;
  rowHeight: number;
  isDragging: boolean;
  isReadOnly: boolean;
  onDragStart: (e: React.MouseEvent, shift: Shift) => void;
  onResizeStart: (e: React.MouseEvent, shiftId: string, edge: "start" | "end") => void;
  onEdit: (shift: Shift) => void;
  onCopy: (shift: Shift) => void;
  onDelete: (id: string) => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  employee,
  allShifts,
  leftPx,
  widthPx,
  rowHeight,
  isDragging,
  isReadOnly,
  onDragStart,
  onResizeStart,
  onEdit,
  onCopy,
  onDelete,
}) => {
  const hours   = shift.endHour - shift.startHour;
  const ot      = isOvertime(allShifts, shift.employeeId);
  const accent  = LABEL_ACCENT[shift.label] ?? employee.color;
  const narrow  = widthPx < 80;

  return (
    <div
      className={[
        "absolute top-1 select-none group/card transition-shadow duration-150",
        isDragging ? "opacity-60 shadow-2xl z-50 scale-[0.97]" : "z-10",
        isReadOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing",
      ].join(" ")}
      style={{
        left:   leftPx + 2,
        width:  Math.max(widthPx - 4, 20),
        height: rowHeight - 8,
        borderRadius: 10,
        background: ot
          ? "linear-gradient(145deg,#1a0505,#2a0a0a)"
          : `linear-gradient(145deg,${employee.color}14,${employee.color}22)`,
        border: `1.5px solid ${ot ? "#7f1d1d" : employee.color + "45"}`,
        borderLeft: `3px solid ${ot ? "#ef4444" : employee.color}`,
      }}
      onMouseDown={isReadOnly ? undefined : (e) => {
        if ((e.target as HTMLElement).closest("[data-resize],[data-action]")) return;
        e.stopPropagation();
        onDragStart(e, shift);
      }}
    >
      <div className="flex flex-col h-full px-2 py-1.5 overflow-hidden">
        <div className="flex items-center gap-1 mb-0.5">
          <span
            className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md leading-none shrink-0"
            style={{ background: `${accent}20`, color: accent }}
          >
            {shift.label}
          </span>
          {ot && (
            <span className="text-[8px] font-black bg-red-900/80 text-red-300 px-1 py-0.5 rounded-md leading-none border border-red-800/50">
              OT
            </span>
          )}
        </div>

        {!narrow && (
          <p className={`text-[11px] font-bold leading-none ${ot ? "text-red-300" : "text-slate-100"}`}>
            {formatHour(shift.startHour)}–{formatHour(shift.endHour)}
          </p>
        )}

        {!narrow && (
          <p className="text-[10px] font-semibold mt-0.5" style={{ color: ot ? "#ef4444" : employee.color }}>
            {formatDuration(hours)}
          </p>
        )}
      </div>

      {!isReadOnly && (
        <div
          data-action
          className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            title="Edit shift"
            onClick={(e) => { e.stopPropagation(); onEdit(shift); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px]
                       bg-black/40 text-slate-300 hover:bg-white/20 hover:text-white transition-all"
          >✏</button>
          <button
            title="Copy shift"
            onClick={(e) => { e.stopPropagation(); onCopy(shift); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px]
                       bg-black/40 text-slate-300 hover:bg-white/20 hover:text-white transition-all"
          >⎘</button>
          <button
            title="Delete shift"
            onClick={(e) => { e.stopPropagation(); onDelete(shift.id); }}
            className="w-5 h-5 flex items-center justify-center rounded text-[9px]
                       bg-black/40 text-red-400 hover:bg-red-900/60 hover:text-red-200 transition-all"
          >✕</button>
        </div>
      )}

      {!isReadOnly && (
        <>
          <div
            data-resize
            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize rounded-l-[10px]
                       opacity-0 group-hover/card:opacity-100 transition-opacity
                       hover:bg-white/20"
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, shift.id, "start"); }}
          />
          <div
            data-resize
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-[10px]
                       opacity-0 group-hover/card:opacity-100 transition-opacity
                       hover:bg-white/20"
            onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, shift.id, "end"); }}
          />
        </>
      )}
    </div>
  );
};

export default ShiftCard;