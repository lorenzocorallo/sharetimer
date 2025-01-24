import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const url = "ws://localhost:8080/api/ws";
type TimerState = "created" | "running" | "paused";

function generateId(): string {
  const characters = "abcdefghijklmnopqrstuvwxyz";
  let result = "client_test_";
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function ClientTest() {
  const { readyState, lastMessage, sendMessage } = useWebSocket(url, {
    onOpen: () => {
      sendMessage(`1:cmd:auth:setid:${generateId()}`);
    },
  });
  const open = readyState === ReadyState.OPEN;

  const [msgs, setMsgs] = useState<string[]>([]);
  const [timerId, setTimerId] = useState<string>("TESTER");
  const [timerState, setTimerState] = useState<TimerState | null>();

  function handleJoin(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (open) sendMessage(`1:cmd:timer:join:${timerId}`);
    setTimerState("created"); // temp
  }

  function handleLeave(): void {
    if (open) sendMessage(`1:cmd:timer:leave:${timerId}`);
    setTimerState(null); // temp
  }

  const handleMessage = useCallback(
    (msg: string) => {
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
        <>
          <p>Connected to timer {timerId} as client.</p>
          <button
            onClick={handleLeave}
            className="py-2 px-8 rounded-xl bg-red-700 hover:bg-red-600"
          >
            X
          </button>
        </>
      )}

      <p>Timer State: {timerState}</p>

      {msgs.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}
