import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createLazyFileRoute("/t/$timerId")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    id: _id,
    duration,
    isOwner,
    isRunning: dbIsRunning,
    lastPause,
    startTime,
    timeInPause,
  } = Route.useLoaderData();
  const [timeLeft, setTimeLeft] = useState<number>(
    startTime === 0 ? duration : calcTimeLeft(),
  );
  const [_isStarted, setIsStarted] = useState<boolean>(startTime > 0);
  const [isRunning, setIsRunning] = useState<boolean>(dbIsRunning);

  const percentage = ((duration - timeLeft) / duration) * 100;

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 0;
        }
        return prevTime - 20;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [isRunning]);

  function calcTimeLeft() {
    if (isRunning) return duration - (Date.now() - startTime) + timeInPause;
    return duration - (lastPause - startTime) + timeInPause;
  }

  function handleStart() {
    if (!isOwner) return;
    setIsStarted(true);
    setIsRunning(true);
  }

  function handlePause() {
    if (!isOwner) return;
    setIsRunning(false);
    setTimeLeft((v) => v - (v % 1000));
  }

  function handleResume() {
    if (!isOwner) return;
    setIsRunning(true);
  }

  return (
    <div className="w-full grid grid-rows-[4rem_1fr_4rem]">
      <div className="border-b border-slate-700 flex items-center gap-4">
        {isOwner && (
          <>
            <button className="cursor-pointer" onClick={handleStart}>
              start
            </button>

            <button
              disabled={isRunning}
              className="cursor-pointer"
              onClick={handleResume}
            >
              resume
            </button>

            <button
              disabled={!isRunning}
              className="cursor-pointer"
              onClick={handlePause}
            >
              pause
            </button>
          </>
        )}
      </div>
      <div className="row-start-2 row-end-3 flex justify-center items-center py-10">
        <div className="relative w-auto h-full max-h-[80vw] xl:max-h-[50rem] aspect-square">
          {/* Background circle */}
          <div className="w-full h-full rounded-full bg-slate-700" />

          {/* Progress circle */}
          <div
            className="absolute top-0 left-0 w-full h-full"
            style={{
              background: `conic-gradient(#4285f4 ${100 - percentage}%, transparent ${100 - percentage}%)`,
              borderRadius: "50%",
            }}
          />

          {/* Inner white circle with time display */}
          <div className="absolute top-2 left-2 right-2 bottom-2 bg-slate-900 rounded-full flex items-center justify-center">
            <span className="text-5xl md:text-8xl font-semibold">
              {formatTime(timeLeft / 1000)}
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-700"></div>
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
