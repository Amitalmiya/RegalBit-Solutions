import { Zap } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-ink-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 bg-volt-400/10 rounded-2xl flex items-center justify-center animate-pulse-slow">
            <Zap size={28} className="text-volt-400" fill="currentColor" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border border-volt-400/20 animate-ping" />
        </div>
        <div className="text-gray-500 text-sm font-mono">Loading TaskFlow...</div>
      </div>
    </div>
  );
}