import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

// Define the context type
type IdContextType = {
  clientId: string;
  isGuestMode: boolean;
  toggleGuestMode: () => void;
};

// Create context with a default value
const IdContext = createContext<IdContextType>({
  clientId: "",
  isGuestMode: false,
  toggleGuestMode: () => {},
});

const storageKey = "sharetimer:id";
export function IdProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string>("");
  const [localId, setLocalId] = useState<string>("");
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    let local = localStorage.getItem(storageKey);
    const sesh = sessionStorage.getItem(storageKey);

    if (!local) {
      local = generateRandomId();
      localStorage.setItem(storageKey, local);
      setLocalId(local);
    }

    if (sesh) {
      setIsGuestMode(true);
      setId(sesh);
    } else {
      setIsGuestMode(false);
      setId(local);
    }
  }, []);

  function toggleGuestMode() {
    if (isGuestMode) {
      // remove guest mode
      setId(localId);
      setIsGuestMode(false);
      sessionStorage.removeItem(storageKey);
    } else {
      const tempId = generateRandomId();
      setId(tempId);
      setIsGuestMode(true);
      sessionStorage.setItem(storageKey, tempId);
    }
  }

  return (
    <IdContext.Provider value={{ clientId: id, isGuestMode, toggleGuestMode }}>
      {children}
    </IdContext.Provider>
  );
}

export function useClientId() {
  const context = useContext(IdContext);
  if (context === undefined) {
    throw new Error("useId must be used within an IdProvider");
  }
  return context;
}

function generateRandomId(length: number = 21): string {
  // probability to get two identical is <0.0000004% => 1 / 250mln
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((x) => charset[x % charset.length])
    .join("");
}
