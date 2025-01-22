import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const url = "ws://localhost:8080/api/ws";
type TimerState = "created" | "running" | "paused";

export function ClientTest() {
  const { readyState, lastMessage, sendMessage } = useWebSocket(url);
  const open = readyState === ReadyState.OPEN;

  const [msgs, setMsgs] = useState<string[]>([]);
  const [timerId, setTimerId] = useState<string>("TESTER");
  const [timerState, setTimerState] = useState<TimerState | null>();

  function handleJoin(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (open) sendMessage(`1:join:${timerId}`);
    setTimerState("created"); // temp
  }

  const handleMessage = useCallback(
    (msg: string) => {
      const [version, event, msgTimerId] = msg.split(":");
      if (!version || parseInt(version) !== 1)
        return console.error("version mismatch");
      if (!event || !["resumed", "paused", "started"].includes(event))
        return console.error("unknown cmd");
      if (!event || msgTimerId !== timerId)
        return console.error("event refers to another timer");

      if (event === "resumed" || event === "started") {
        setTimerState("running");
      } else if (event === "paused") {
        setTimerState("paused");
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
        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={timerId}
            onChange={(e) => setTimerId(e.target.value)}
            className="bg-transparent border"
            disabled
          />
          <button type="submit">Join</button>
        </form>
      ) : (
        <p>Connected to timer {timerId} as client.</p>
      )}

      <p>Timer State: {timerState}</p>

      {msgs.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}
