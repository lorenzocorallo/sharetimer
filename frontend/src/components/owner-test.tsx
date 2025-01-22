import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const url = "ws://localhost:8080/api/ws";
type TimerState = "created" | "running" | "paused";

export function OwnerTest() {
  const { readyState, lastMessage, sendMessage } = useWebSocket(url);
  const open = readyState === ReadyState.OPEN;

  const [msgs, setMsgs] = useState<string[]>([]);
  const [timerId, setTimerId] = useState<string>("TESTER");
  const [timerState, setTimerState] = useState<TimerState | null>();

  function handleCreate(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (open) sendMessage(`1:create:${timerId}`);
    setTimerState("created");
  }

  function handleStart(): void {
    if (open) sendMessage(`1:start:${timerId}`);
    setTimerState("running");
  }

  function handlePause(): void {
    if (open) sendMessage(`1:pause:${timerId}`);
    setTimerState("paused");
  }

  function handleResume(): void {
    if (open) sendMessage(`1:resume:${timerId}`);
    setTimerState("running");
  }

  useEffect(() => {
    if (lastMessage) {
      setMsgs((p) => [...p, lastMessage.data]);
    }
  }, [lastMessage]);

  return (
    <div className="flex-1 flex flex-col justify-start items-center gap-2 p-4">
      <h2>
        Owner {open && <span className="text-green-400">Connected</span>}
        {!open && <span className="text-red-400">Disconnected</span>}
      </h2>

      {open && !timerState ? (
        <form onSubmit={handleCreate}>
          <input
            type="text"
            value={timerId}
            onChange={(e) => setTimerId(e.target.value)}
            className="bg-transparent border"
            disabled
          />
          <button type="submit">Create</button>
        </form>
      ) : (
        <>
          <p>Connected to timer {timerId} as owner.</p>
          {timerState === "created" && (
            <button
              onClick={handleStart}
              className="py-2 px-8 rounded-xl bg-green-700 hover:bg-green-600"
            >
              Start
            </button>
          )}
          {timerState === "running" && (
            <button
              onClick={handlePause}
              className="py-2 px-8 rounded-xl bg-yellow-700 hover:bg-yellow-600"
            >
              Pause
            </button>
          )}
          {timerState === "paused" && (
            <button
              onClick={handleResume}
              className="py-2 px-8 rounded-xl bg-green-700 hover:bg-green-600"
            >
              Resume
            </button>
          )}
        </>
      )}

      <p>Timer State: {timerState}</p>

      {msgs.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}
