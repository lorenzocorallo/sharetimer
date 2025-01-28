import { createContext, ReactNode, useState, useEffect } from "react";
import { clientIdKey } from "../constants.ts";
import { generateRandomClientId } from "../lib/utils.ts";

// Define the context type
type IdContextType = {
  clientId: string;
  isGuestMode: boolean;
  toggleGuestMode: () => void;
};

// Create context with a default value
export const IdContext = createContext<IdContextType>({
  clientId: "",
  isGuestMode: false,
  toggleGuestMode: () => {},
});

export function IdProvider({ children }: { children: ReactNode }) {
  const isDev = process.env.NODE_ENV === "development";
  const [id, setId] = useState<string>("");
  const [localId, setLocalId] = useState<string>("");
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    let local = localStorage.getItem(clientIdKey);
    const sesh = sessionStorage.getItem(clientIdKey);

    if (!local) {
      local = generateRandomClientId();
      localStorage.setItem(clientIdKey, local);
    }
    setLocalId(local);

    if (sesh && isDev) {
      setIsGuestMode(true);
      setId(sesh);
    } else {
      setIsGuestMode(false);
      setId(local);
    }
  }, [isDev]);

  function toggleGuestMode() {
    if (!isDev) return;
    if (isGuestMode) {
      // remove guest mode
      setId(localId);
      setIsGuestMode(false);
      sessionStorage.removeItem(clientIdKey);
    } else {
      const tempId = generateRandomClientId();
      setId(tempId);
      setIsGuestMode(true);
      sessionStorage.setItem(clientIdKey, tempId);
    }
  }

  return (
    <IdContext.Provider value={{ clientId: id, isGuestMode, toggleGuestMode }}>
      {children}
    </IdContext.Provider>
  );
}
