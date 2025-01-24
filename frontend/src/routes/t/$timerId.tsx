import { createFileRoute, redirect } from "@tanstack/react-router";
import { createApi } from "../../lib/api";

type Timer = {
  id: string;
  isOwner: boolean;
  duration: number;
  lastPause: number;
  timeInPause: number;
  startTime: number;
  isRunning: boolean;
};

export const Route = createFileRoute("/t/$timerId")({
  loader: async ({ params, context }) => {
    const api = createApi(context.clientId);
    const res = await api
      .get(`/timer/${params.timerId.toUpperCase()}`)
      .catch(() => {
        throw redirect({ to: "/t/404" });
      });

    return res.data as Timer;
  },
});
