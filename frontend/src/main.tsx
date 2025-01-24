import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { IdProvider } from "./context/id-context";
import "./index.css";
import { Router } from "./router";

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
