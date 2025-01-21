import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

const url = "ws://localhost:8080/api/ws"

export function WebSocketTest({ i }: { i: number }) {
  const { readyState, lastMessage, sendMessage } = useWebSocket(url)
  const open = readyState === ReadyState.OPEN;

  const [msgs, setMsgs] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (open) sendMessage(input);
    setInput("");
  }

  useEffect(() => {
    if (lastMessage) {
      setMsgs(p => [...p, lastMessage.data])
    }

  }, [lastMessage])

  return (
    <div className="flex-1 flex flex-col justify-start items-center gap-2 p-4">
      <h2>
        WS{i} {open && <span className="text-green-400">Connected</span>}
        {!open && <span className="text-red-400">Disconnected</span>}
      </h2>

      {open && (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent border"
          />
          <button type="submit">Send</button>
        </form>
      )}

      {msgs.map((m) => (
        <p>{m}</p>
      ))}
    </div>
  );
}
