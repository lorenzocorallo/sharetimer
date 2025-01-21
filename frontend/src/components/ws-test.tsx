import { useEffect, useRef, useState } from "react";

export function WebSocketTest({ i }: { i: number }) {
  const ws = useRef<WebSocket | null>();
  const [open, setOpen] = useState<boolean>(false);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");

  function handleConnect(): void {
    const w = new WebSocket("ws://localhost:8080/api/ws");
    w.addEventListener("open", () => {
      setOpen(true);
      console.log("connected", i);
    });
    w.addEventListener("close", () => {
      setOpen(false);
    });
    w.addEventListener("error", (ev) => {
      console.error(ev);
    });
    w.addEventListener("message", (ev) => {
      const s = ev.data;
      if (typeof s === "string") {
        setMsgs((v) => [...v, s]);
      }
    });

    ws.current = w;
  }

  useEffect(() => {
    return () => {
      if (ws.current) {
        ws.current.close();
        console.log("disconnecting...", i);
      }
    };
  }, [i]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (ws.current && open) ws.current.send(input);
    setInput("");
  }

  return (
    <div className="flex-1 flex flex-col justify-start items-center gap-2 p-4">
      <h2>
        WS{i} {open && <span className="text-green-400">Connected</span>}
        {!open && <span className="text-red-400">Disconnected</span>}
      </h2>

      {!open && <button onClick={handleConnect} className="outline-none bg-green-400 p-2 rounded-xl">CONNECT</button>}

      {open && <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-transparent border"
        />
        <button type="submit">Send</button>
      </form>
      }

      {msgs.map((m) => (
        <p>{m}</p>
      ))}
    </div>
  );
}
