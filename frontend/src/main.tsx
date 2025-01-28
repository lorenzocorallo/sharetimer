import { scan as reactScan } from "react-scan";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IdProvider } from "./context/id-context";
import "./index.css";
import { Router } from "./router";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  reactScan({
    enabled: true,
  });
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <IdProvider>
        <Router />
      </IdProvider>
    </StrictMode>,
  );
}
