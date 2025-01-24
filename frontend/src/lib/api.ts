import axios, { AxiosInstance } from "axios";

const baseURL = {
  http: "http://localhost:8080/api",
  ws: "ws://localhost:8080/ws",
};

export function createApi(clientId: string): {
  api: AxiosInstance;
  baseURL: typeof baseURL;
} {
  const api = axios.create({
    baseURL: baseURL.http,
    headers: {
      "x-client-id": clientId,
      "Content-Type": "application/json",
    },
  });

  return { api, baseURL };
}

export const WSEvent = {
  Start: "start",
  Resume: "resume",
  Pause: "pause",
  Join: "join",
  Leave: "leave",
} as const;
type TWSEvent = typeof WSEvent[keyof typeof WSEvent] | null;

export function parseWS(timerId: string, msg: string): TWSEvent {
  const [version, type, area, id, event] = msg.split(":");

  if (
    parseInt(version) !== 1 ||
    type !== "event" ||
    area !== "timer" ||
    id !== timerId
  )
    return null;

  if (event === "start") return WSEvent.Start;
  if (event === "resume") return WSEvent.Resume;
  if (event === "pause") return WSEvent.Pause;
  if (event === "join") return WSEvent.Join;
  if (event === "leave") return WSEvent.Leave;
  return null;
}
