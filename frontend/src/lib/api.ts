import axios, { AxiosInstance } from "axios";

export function createApi(clientId: string): AxiosInstance {
  return axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
      "x-client-id": clientId,
      "Content-Type": "application/json",
    },
  });
}
