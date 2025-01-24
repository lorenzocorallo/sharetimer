import { useContext } from "react";
import { IdContext } from "../context/id-context";

export function useClientId() {
  const context = useContext(IdContext);
  return context;
}
