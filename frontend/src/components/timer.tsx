import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

type Props = {
  duration: number;
  initialTime: number;
  isStarted: boolean;
  isPaused: boolean;
  isEnded: boolean;
  strokeWidth?: number;
  onEnd: () => void;
};

export function Timer({ duration, isStarted, initialTime, isPaused, isEnded, onEnd, strokeWidth = 2}: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);

  const percentage = (timeLeft / duration) * 100;
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = ((100 - percentage) / 100) * circumference;

  useEffect(() => {
    if (!isStarted || isPaused || isEnded) return;
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 100) {
          clearInterval(interval);
          onEnd();
          return 0;
        }
        return prevTime - 20;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isEnded, isPaused, onEnd, isStarted]);

  return (
    <div className="relative w-auto h-full max-h-[80vw] xl:max-h-[50rem] aspect-square">
      <svg
        className="w-full h-full -rotate-90"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background circle */}
        <circle
          className={cn(
            "text-slate-700",
            isPaused ? "text-yellow-900" : "",
            isEnded ? "text-red-900" : "",
          )}
          stroke="currentColor"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx="50"
          cy="50"
        />
        {/* Progress circle */}
        <circle
          className={cn(
            "text-blue-500",
            isPaused ? "text-yellow-300" : "",
            isEnded ? "text-red-900" : "",
          )}
          stroke="currentColor"
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx="50"
          cy="50"
        />
      </svg>
      {/* Timer display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl md:text-8xl font-semibold">
          {formatTime(timeLeft / 1000)}
        </span>
      </div>{" "}
    </div>
  );
}

function formatTime(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);

  const h = hours.toString().padStart(2, "0");
  const m = minutes.toString().padStart(2, "0");
  const s = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    return `${h}:${m}:${s}`;
  }
  if (minutes > 0) {
    return `${m}:${s}`;
  }
  if (seconds > 0) {
    return `00:${s}`;
  }

  return "00:00";
}
