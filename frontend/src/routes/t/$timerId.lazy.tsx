import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Play, Pause } from "lucide-react";
import { cn } from "../../lib/utils";
import { parseWS, WSEvent } from "../../lib/api";
import { useClientId } from "../../hooks/useClientId";

export const Route = createLazyFileRoute("/t/$timerId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { clientId } = useClientId();
  const { timer, wsUrl } = Route.useLoaderData();
  const { readyState, lastMessage, sendMessage } = useWebSocket(wsUrl, {
    onOpen: () => {
      sendMessage(`1:cmd:auth:setid:${clientId}`);
    },
  });
  const {
    timerId,
    duration,
    isOwner,
    isRunning: dbIsRunning,
    lastPause,
    startTime,
    timeInPause,
  } = timer;

  const [timeLeft, setTimeLeft] = useState<number>(
    startTime === 0
      ? duration
      : dbIsRunning
        ? duration - (Date.now() - startTime) + timeInPause
        : duration - (lastPause - startTime) + timeInPause,
  );

  const [isStarted, setIsStarted] = useState<boolean>(startTime > 0);
  const [isRunning, setIsRunning] = useState<boolean>(dbIsRunning);

  const isWsOpen = readyState === ReadyState.OPEN;

  const [_msgs, setMsgs] = useState<string[]>([]);
  const [clients, setClients] = useState<number>(0);

  const percentage = ((duration - timeLeft) / duration) * 100;

  useEffect(() => {
    if (isWsOpen) {
      if (isOwner) {
        sendMessage(`1:cmd:timer:create:${timerId}`);
      } else {
        sendMessage(`1:cmd:timer:join:${timerId}`);
      }
    }
  }, [isOwner, isWsOpen, sendMessage, timerId]);

  function handleStart() {
    if (!isOwner || !isWsOpen || timeLeft === 0) return;
    sendMessage(`1:cmd:timer:start:${timerId}`);
    setIsStarted(true);
    setIsRunning(true);
  }

  function handlePause() {
    if (!isOwner || !isWsOpen || timeLeft === 0) return;
    sendMessage(`1:cmd:timer:pause:${timerId}`);
    //sendMessage(`1:cmd:timer:sync:${timerId}:${timeLeft}`);
    setIsRunning(false);
  }

  function handleResume() {
    if (!isOwner || !isWsOpen || timeLeft === 0) return;
    setIsRunning(true);
    sendMessage(`1:cmd:timer:resume:${timerId}`);
  }

  const handleMessage = useCallback(
    (msg: string) => {
      const parsed = parseWS(timerId, msg);
      console.log(parsed)
      if (parsed === null) return;
      const [event, _args] = parsed;

      if (isOwner) {
        if (event === WSEvent.Join) setClients((v) => v + 1);
        if (event === WSEvent.Leave) setClients((v) => Math.max(v - 1, 0));
      } else {
        if (event === WSEvent.Start) {
          setIsStarted(true);
          setIsRunning(true);
        }
        if (event === WSEvent.Pause) {
          setIsRunning(false);
        }
        if (event === WSEvent.Resume) setIsRunning(true);
        //if (event === WSEvent.Sync && args[0]) setTimeLeft(parseInt(args[0]));
      }
    },
    [isOwner, timerId],
  );

  useEffect(() => {
    if (lastMessage) {
      setMsgs((p) => [...p, lastMessage.data]);
      handleMessage(lastMessage.data);
    }
  }, [handleMessage, lastMessage]);

  useEffect(() => {
    if (!isRunning || !isStarted) return;
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
  }, [isRunning, isStarted]);

  return (
    <div className="w-full grid grid-rows-[4rem_1fr_4rem]">
      <div className="border-b border-slate-700 flex items-center justify-between gap-4 px-4">
        <div className="flex-[0.5] flex justify-start items-center gap-4"></div>
        {isOwner && isWsOpen && (
          <div className="flex-1 flex justify-center items-center gap-4">
            <button
              onClick={isStarted ? handleResume : handleStart}
              className={cn(
                "p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-all duration-200 focus:outline-none cursor-pointer",
                isStarted ? "px-2" : "px-12 hover:px-16",
              )}
              aria-label={isStarted ? "resume timer" : "start timer"}
            >
              <Play size={20} />
            </button>

            {isStarted && (
              <button
                onClick={handlePause}
                disabled={!isRunning}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors duration-200 focus:outline-none cursor-pointer"
                aria-label={isStarted ? "resume timer" : "start timer"}
              >
                <Pause />
              </button>
            )}
          </div>
        )}
        <div className="flex-[0.5] flex justify-end items-center gap-4">
          {isOwner && (
            <p className="text-slate-200">
              Clients connected:{" "}
              <span className="text-white font-bold">{clients}</span>
            </p>
          )}
        </div>
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
