import { createFileRoute, redirect } from "@tanstack/react-router";
import axios from "axios";

type Timer = {
  timerId: string;
  ownerId: string;
  duration: number;
  lastPause: number;
  timeInPause: number;
  startTime: number;
  isRunning: boolean;
};

export const Route = createFileRoute("/t/$timerId")({
  loader: async ({ params }) => {
    const res = await axios
      .get(`http://localhost:8080/api/timer/${params.timerId}`)
      .catch(() => {
        throw redirect({ to: "/t/404" });
      });

    return res.data as Timer;
  },
});
