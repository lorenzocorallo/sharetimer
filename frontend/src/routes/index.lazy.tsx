import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { DurationInput } from "../components/duration-input";
import { IdInput } from "../components/id-input";
import { cn } from "../lib/utils";
import { useClientId } from "../hooks/useClientId";
import { createApi } from "../lib/api";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

const triggerEventId = "triggerhomepageidinput";

export function Index() {
  const [createSelected, setCreateSelected] = useState<boolean>(false);
  const [joinSelected, setJoinSelected] = useState<boolean>(false);
  const isDev = process.env.NODE_ENV === "development";

  const [duration, setDuration] = useState(0);
  const [id, setId] = useState<string | null>(null);
  const { clientId, isGuestMode, toggleGuestMode } = useClientId();
  const navigate = useNavigate();
  const { api } = createApi(clientId);

  function handleCreateSelect(): void {
    setCreateSelected((v) => !v);
    setJoinSelected(false);
  }

  function handleJoinSelect(): void {
    setJoinSelected((v) => {
      const newVal = !v;
      if (newVal) document.dispatchEvent(new Event(triggerEventId));
      return newVal;
    });
    setCreateSelected(false);
  }

  async function handleCreate(): Promise<void> {
    const res = await api.post("/timer", { duration });
    if (res.status !== 200) {
      console.log(res.data);
    }

    const { timerId } = res.data as { timerId: string };
    navigate({ to: "/t/$timerId", params: { timerId } });
  }

  async function handleJoin(): Promise<void> {
    if (!id) return;
    try {
      const res = await api.get(`/timer/${id}`);
      if (res.status !== 200) alert("not-found");
      navigate({ to: "/t/$timerId", params: { timerId: id } });
    } catch (_) {
      alert("not-found");
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-green-800/50">
        <button
          onClick={handleCreateSelect}
          className="flex justify-center items-center group transition-all shrink-0 w-full cursor-pointer"
          style={{ height: createSelected ? "25%" : "100%" }}
        >
          <Plus
            size={180}
            className="transition-transform group-hover:scale-[1.2]"
          />
        </button>
        <div className="flex flex-col gap-10 justify-start pt-[15vh] items-center overflow-hidden flex-1 bg-slate-900 rounded-t-3xl">
          <h2 className="text-4xl font-bold">Create a timer</h2>
          <DurationInput onDurationChange={setDuration} />
          <button
            className="py-2 px-12 text-xl rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:hover:bg-gray-700 disabled:cursor-not-allowed cursor-pointer"
            disabled={duration <= 0}
            onClick={handleCreate}
          >
            Create
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden bg-blue-800/30">
        <button
          onClick={handleJoinSelect}
          className="flex justify-center items-center group transition-all shrink-0 w-full cursor-pointer"
          style={{ height: joinSelected ? "25%" : "100%" }}
        >
          <UsersRound
            size={180}
            className="transition-transform group-hover:scale-[1.2]"
          />
        </button>
        <div className="flex flex-col gap-10 justify-start pt-[15vh] items-center overflow-hidden flex-1 bg-slate-900 rounded-t-3xl">
          <h2 className="text-4xl font-bold">Join a timer</h2>
          <IdInput
            onChange={(v) => setId(v)}
            focusTriggerEvent={triggerEventId}
          />
          <button
            className="py-2 px-12 text-xl rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:hover:bg-gray-700 disabled:cursor-not-allowed cursor-pointer"
            disabled={id === null}
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
      </div>

      {isDev && (
        <>
          <button
            className={cn(
              "cursor-pointer bg-purple-600 px-8 py-2 rounded-t-xl absolute bottom-0 left-1/2 -translate-x-1/2 transition-all",
              isGuestMode
                ? "bg-purple-600"
                : "bg-slate-800 hover:bg-slate-700 text-purple-300",
            )}
            onMouseDown={toggleGuestMode}
          >
            guest mode
          </button>
          <p
            className={cn(
              "bg-purple-600 px-8 py-2 rounded-bl-xl absolute right-0 top-0",
              isGuestMode ? "bg-purple-600" : "bg-slate-800 text-purple-300",
            )}
          >
            {clientId}
          </p>
        </>
      )}
    </>
  );
}
