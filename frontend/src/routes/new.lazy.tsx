import { createLazyFileRoute } from "@tanstack/react-router";
//import { OwnerTest } from "../components/owner-test";
import { DurationInput } from "../components/duration-input";
import { useState } from "react";
import axios from "axios";

export const Route = createLazyFileRoute("/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const [duration, setDuration] = useState(0);

  async function handleCreate(): Promise<void> {
    const res = await axios.post("http://localhost:8080/api/timer", {
      duration,
    });
    if (res.status !== 200) {
      console.log(res.data);
    }

    const { timerId } = res.data as { timerId: string };
    console.log(timerId);
  }

  return (
    <div className="justify-center items-center w-full h-full flex flex-col gap-8">
      <DurationInput onDurationChange={setDuration} />
      <button
        className="py-2 px-8 rounded-xl bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:hover:bg-gray-700 disabled:cursor-not-allowed"
        disabled={duration <= 0}
        onClick={handleCreate}
      >
        Create
      </button>
    </div>
  );
  //return <OwnerTest />
}
