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
  Sync: "sync",
} as const;
type TWSEvent = (typeof WSEvent)[keyof typeof WSEvent];

export function parseWS(
  timerId: string,
  msg: string,
): null | [TWSEvent, string[]] {
  const [version, type, area, id, event, ...args] = msg.split(":");

  if (
    parseInt(version) !== 1 ||
    type !== "event" ||
    area !== "timer" ||
    id !== timerId
  )
    return null;

  let ev: TWSEvent;
  if (event === "start") ev = WSEvent.Start;
  //else if (event === "sync") ev = WSEvent.Sync;
  else if (event === "resume") ev = WSEvent.Resume;
  else if (event === "pause") ev = WSEvent.Pause;
  else if (event === "join") ev = WSEvent.Join;
  else if (event === "leave") ev = WSEvent.Leave;
  else return null;

  return [ev, args];
}
