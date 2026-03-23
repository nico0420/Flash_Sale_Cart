import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, isOver } = useCountdown(targetDate);

  if (isOver) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-100 text-red-800 rounded-lg shadow-sm border border-red-200">
        <span className="font-bold text-lg">Flash Sale Ended!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-6 h-6 animate-pulse" />
        <h2 className="text-2xl font-bold tracking-tight">Flash Sale Ends In</h2>
      </div>
      <div className="flex gap-4">
        <TimeUnit value={days} label="Days" />
        <TimeUnit value={hours} label="Hours" />
        <TimeUnit value={minutes} label="Minutes" />
        <TimeUnit value={seconds} label="Seconds" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg w-16 h-16 flex items-center justify-center shadow-inner border border-white/10">
        <span className="text-3xl font-mono font-bold">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-xs uppercase tracking-wider mt-2 font-medium opacity-80">
        {label}
      </span>
    </div>
  );
}
