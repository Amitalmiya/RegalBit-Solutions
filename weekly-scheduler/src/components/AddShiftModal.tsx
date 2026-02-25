import React, { useEffect, useState } from 'react';
import type { Employee, Shift, ShiftModalPayload } from "../types/scheduler";
import {
    DAYS,
    DAY_NUMBERS,
    DAY_START,
    DAY_END,
    HOUR_SNAP
} from "../types/scheduler";
import {
    formatHour,
    hasConflict,
    generateId,
    formatDuration,
} from "../utils/DateUtils";

const HOUR_OPTIONS: number[] = [];
for (let h = DAY_START; h <= DAY_END; h += HOUR_SNAP) {
    HOUR_OPTIONS.push(h);
}

const LABEL_PRESETS = ["Morning", "Mid", "Afternoon", "Full Day", "Night", "Dawn"] as const;

interface AddShiftModalProps {
    payload: ShiftModalPayload;
    employees: Employee[];
    allShifts: Shift[];
    onSave: (shift: Shift) => Promise<void>;
    onClose: () => void;
    isSaving?: boolean;
}

const AddShiftModal: React.FC<AddShiftModalProps> = ({
    payload,
    employees,
    allShifts,
    onSave,
    onClose,
    isSaving,
}) => {
    const { mode, shift: initial } = payload;

    const [employeeId, setEmployeeId] = useState<string>(initial.employeeId);
    
    const [dayIndex, setDayIndex] = useState<number>(initial.dayIndex);

    const [startHour, setStartHour] = useState<number>(initial.startHour ?? 9);

    const [endHour, setEndHour] = useState<number>(initial.endHour   ?? 17);

    const [label, setLabel] = useState<string>(initial.label     ?? "Morning");

    const [error, setError] = useState("");

    const selectedEmp = employees.find((e) => e.id === employeeId);
    const duration    = endHour > startHour ? endHour - startHour : 0;

    const validate = (): string | null => {
        if (!employeeId)              return "Select an employee.";
        if (endHour <= startHour)     return "End time must be after start time.";
        if (startHour < DAY_START || endHour > DAY_END)
            return `Hours must be between ${formatHour(DAY_START)} and ${formatHour(DAY_END)}.`;
        if (!label.trim())            return "Label is required.";

        const candidate: Shift = {
            id: mode === "edit" ? (initial.id ?? "") : generateId(),
            employeeId,
            dayIndex,
            startHour,
            endHour,
            label,
        };

        const others = mode === "edit"
            ? allShifts.filter((s) => s.id !== initial.id)
            : allShifts;

        if (hasConflict(candidate, others)) return "This shift overlaps an existing shift.";
        return null;
    }; 

    const handleSave = async () => {
        setError("");
        const err = validate();
        if (err) { setError(err); return; }

        const shift: Shift = {
            id: mode === "edit" ? (initial.id ?? generateId()) : generateId(),
            employeeId,
            dayIndex,
            startHour,
            endHour,
            label,
        };
        await onSave(shift);
    };

    useEffect(() => {
        const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(3,5,12,0.88)", backdropFilter: "blur(10px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="max-w-[460px] w-full rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "#0b0f1a",
                    border: "1px solid rgba(255,255,255,0.07)",
                    animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                <div
                    className="h-[3px] w-full"
                    style={{
                        background: selectedEmp
                            ? `linear-gradient(90deg,${selectedEmp.color},${selectedEmp.color}44)`
                            : "linear-gradient(90deg,#6C63FF,#6C63FF44)",
                    }}
                />

                <div className="p-7">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p
                                className="text-[10px] font-black tracking-[0.2em] uppercase mb-1.5"
                                style={{ color: mode === "edit" ? "#fb923c" : "#43D9AD" }}
                            >
                                {mode === "edit" ? "✏ Edit Shift" : "＋ New Shift"}
                            </p>
                            <h2 className="text-xl font-black text-white tracking-tight">
                                {mode === "edit" ? "Update Schedule" : "Add to Schedule"}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500
                                       bg-white/[0.04] border border-white/[0.08]
                                       hover:bg-white/[0.08] hover:text-slate-300 transition-all text-sm"
                        >✕</button>
                    </div>

                    {duration > 0 && selectedEmp && (
                        <div
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border mb-5"
                            style={{ background: `${selectedEmp.color}12`, borderColor: `${selectedEmp.color}30` }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ background: selectedEmp.color }} />
                            <span className="text-[13px] font-bold" style={{ color: selectedEmp.color }}>
                                {formatDuration(duration)} shift
                            </span>
                        </div>
                    )}

                    {/* Employee selector */}
                    <div className="mb-5">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                               style={{ color: "#475569" }}>
                            Employee
                        </label>
                        <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => setEmployeeId(emp.id)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition-all duration-150"
                                    style={
                                        employeeId === emp.id
                                            ? { background: `${emp.color}14`, borderColor: `${emp.color}45` }
                                            : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }
                                    }
                                >
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border"
                                        style={{ background: `${emp.color}18`, borderColor: `${emp.color}35`, color: emp.color }}
                                    >
                                        {emp.avatarInitials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-semibold text-slate-200 truncate leading-none">{emp.name}</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>{emp.role}</p>
                                    </div>
                                    {employeeId === emp.id && (
                                        <span className="ml-auto text-xs" style={{ color: emp.color }}>✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day picker */}
                    <div className="mb-4">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                               style={{ color: "#475569" }}>
                            Day
                        </label>
                        <div className="grid grid-cols-7 gap-1">
                            {DAYS.map((name, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setDayIndex(idx)}
                                    className="flex flex-col items-center py-2 rounded-xl border text-xs font-bold transition-all duration-150"
                                    style={
                                        dayIndex === idx
                                            ? {
                                                background: selectedEmp ? `${selectedEmp.color}22` : "#6C63FF22",
                                                borderColor: selectedEmp ? `${selectedEmp.color}50` : "#6C63FF50",
                                                color: selectedEmp?.color ?? "#6C63FF",
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

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                            { label: "Start Hour", value: startHour, set: setStartHour },
                            { label: "End Hour",   value: endHour,   set: setEndHour   },
                        ].map(({ label: lbl, value, set }) => (
                            <div key={lbl}>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-1.5"
                                       style={{ color: "#475569" }}>
                                    {lbl}
                                </label>
                                <select
                                    value={value}
                                    onChange={(e) => set(Number(e.target.value))}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm text-slate-200 cursor-pointer"
                                    style={{
                                        background: "#121826",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        colorScheme: "dark",
                                    }}
                                >
                                    {HOUR_OPTIONS.map((h) => (
                                        <option key={h} value={h}>{formatHour(h)}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="mb-5">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.18em] mb-2"
                               style={{ color: "#475569" }}>
                            Shift Label
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {LABEL_PRESETS.map((lbl) => (
                                <button
                                    key={lbl}
                                    onClick={() => setLabel(lbl)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150"
                                    style={
                                        label === lbl
                                            ? {
                                                background: selectedEmp ? `${selectedEmp.color}20` : "#6C63FF20",
                                                borderColor: selectedEmp ? `${selectedEmp.color}40` : "#6C63FF40",
                                                color: selectedEmp?.color ?? "#6C63FF",
                                              }
                                            : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)", color: "#64748b" }
                                    }
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Or type a custom label…"
                            value={LABEL_PRESETS.includes(label as any) ? "" : label}
                            onChange={(e) => setLabel(e.target.value || "Morning")}
                            className="w-full px-3 py-2 rounded-xl text-sm text-slate-300 placeholder-slate-700"
                            style={{
                                background: "#121826",
                                border: "1px solid rgba(255,255,255,0.08)",
                                colorScheme: "dark",
                            }}
                        />
                    </div>

                    {error && (
                        <div
                            className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl border mb-4 text-xs"
                            style={{ background: "#1a0808", borderColor: "#7f1d1d80", color: "#fca5a5" }}
                        >
                            <span className="mt-px shrink-0">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex gap-2.5">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 py-3 rounded-xl font-bold text-sm text-white tracking-wide
                                       disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                            style={{ background: "linear-gradient(135deg,#6C63FF,#a78bfa)" }}
                        >
                            {isSaving ? "Saving…" : mode === "edit" ? "Update Shift" : "Save Shift"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-3 rounded-xl font-bold text-sm text-slate-400 active:scale-[0.98] transition-all"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                            Cancel
                        </button>
                    </div>

                    <p className="text-center text-[10px] mt-3" style={{ color: "#1e2d40" }}>
                        Press <kbd className="px-1 py-0.5 rounded text-[9px] font-mono"
                                   style={{ background: "rgba(255,255,255,0.06)" }}>Esc</kbd> to cancel
                    </p>
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

export default AddShiftModal;