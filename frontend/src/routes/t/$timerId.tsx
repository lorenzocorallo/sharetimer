import { createFileRoute, redirect } from "@tanstack/react-router";
import { createApi } from "../../lib/api";

type Timer = {
  timerId: string;
  isOwner: boolean;
  duration: number;
  lastPause: number;
  timeInPause: number;
  startTime: number;
  isRunning: boolean;
};

export const Route = createFileRoute("/t/$timerId")({
  loader: async ({ params, context }) => {
    const { api, baseURL } = createApi(context.clientId);
    const res = await api
      .get(`/timer/${params.timerId.toUpperCase()}`)
      .catch(() => {
        throw redirect({ to: "/t/404" });
      });

    return {
      timer: res.data as Timer,
      wsUrl: baseURL.ws,
    };
  },
});
