import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const url = "ws://localhost:8080/api/ws";
type TimerState = "created" | "running" | "paused";
const tempUserId = "owner_test";

export function OwnerTest() {
  const { readyState, lastMessage, sendMessage } = useWebSocket(url, {
    onOpen: () => {
      sendMessage(`1:cmd:auth:setid:${tempUserId}`);
    },
  });
  const open = readyState === ReadyState.OPEN;

  const [msgs, setMsgs] = useState<string[]>([]);
  const [timerId, setTimerId] = useState<string>("TESTER");
  const [timerState, setTimerState] = useState<TimerState | null>();
  const [clients, setClients] = useState<number>(0);

  function handleCreate(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (open) sendMessage(`1:cmd:timer:create:${timerId}`);
    setTimerState("created");
  }

  function handleStart(): void {
    if (open) sendMessage(`1:cmd:timer:start:${timerId}`);
    setTimerState("running");
  }

  function handlePause(): void {
    if (open) sendMessage(`1:cmd:timer:pause:${timerId}`);
    setTimerState("paused");
  }

  function handleResume(): void {
    if (open) sendMessage(`1:cmd:timer:resume:${timerId}`);
    setTimerState("running");
  }

  const handleMessage = useCallback(
    (msg: string) => {
      const [version, type, area, id, event] = msg.split(":");

      if (
        parseInt(version) !== 1 ||
        type !== "event" ||
        area !== "timer" ||
        id !== timerId
      )
        return;

      if (event === "join") {
        setClients((v) => v + 1);
      } else if (event === "leave") {
        setClients((v) => Math.max(0, v - 1));
      }
    },
    [timerId],
  );

  useEffect(() => {
    if (lastMessage) {
      setMsgs((p) => [...p, lastMessage.data]);
      handleMessage(lastMessage.data);
    }
  }, [handleMessage, lastMessage]);

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
          <p>{clients} clients connected.</p>
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
