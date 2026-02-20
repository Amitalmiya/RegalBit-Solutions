import React from "react";

const WeeklyScheduler = () => {
  return (
    <div className="font-mono text-slate-200 h-screen flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 bg-[#0a1628] border-b border-slate-800 shrink-0">
        <span className="text-lg font-bold text-violet-500 tracking-widest">
          ⏱ ShiftGrid
        </span>
        <span className="text-xl text-slate-500 tracking-widest hidden sm:block">
          Week of Feb 17 - 23, 2025
        </span>
        <div className="flex gap-2">
          <button
            title="Right-click any shift to copy it"
            className="border border-slate-700 text-slate-400 rounded-md px-3 py-1.5 text-xs font-mono bg-transparent
                       hover:border-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            ℹ Right-click to Copy
          </button>

          <button className="bg-violet-600 hover:bg-violet-500 text-white rounded-md px-4 py-1.5 text-xs font-bold font-mono cursor-pointer transition-colors border-0">
            + Add Shift
          </button>

          <button className="bg-green-600 hover:bg-green-500 text-white rounded-md px-4 py-1.5 text-xs font-bold font-mono cursor-pointer transition-colors border-0">
            + Add Employee
          </button>
        </div>
      </header>

      <div className="flex bg-[#0a1628] border-b border-slate-800 overflow-x-auto shrink-0">
        <div className="flex-1 min-w-[140px] px-3.5 py-2.5 border-r border-slate-800">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" />
            <span className="text-[11px] font-bold text-slate-300 truncate">
              Employee Name
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden mb-1">
            <div className="h-full rounded-full transition-all duration-300" />
          </div>
          <p>Jhon Due</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside  className="shrink-0 border-r border-slate-800 bg-[#0a1628] flex flex-col overflow-y-hidden">
            <div className="flex items-center px-3.5 border-b border-slate-800 shrink-0">
                <span className="text-[10px] font-bold text-slate-600 tracking-widest">STAFF</span>
            </div>

            <div
                className="flex items-center px-2.5 gap-2.5 border-b border-slate-800 shrink-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                >
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-200 truncate"></p>
                  <p className="text-[10px] text-slate-500"></p>
                  <p></p>
                </div>
              </div>
        </aside>
        
        <div className="flex-1 overflow-x-auto overflow-y-auto relative">
            <div className="grid sticky top-0 z-10 bg-[#0a1628] border-b border-slate-800">
                <div className="flex flex-col items-center justify-center border-r border-slate-800 gap-0.5">
                <span className="text-[10px] font-bold text-violet-500 tracking-widest"></span>
                <span className="text-lg font-light text-slate-200"></span>
              </div>
            </div>
        </div>

        <div className="relative">
            <div  className="grid border-b border-slate-800 relative">
                <div  className="border-r border-slate-800 relative cursor-crosshair">
                    <div className="absolute top-0 bottom-0 w-px pointer-events-none">
                        
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduler;
