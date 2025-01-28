import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { useClientId } from "../hooks/useClientId";
import { lazy } from "react";

export const Route = createRootRouteWithContext<{ clientId: string }>()({
  component: Root,
});

function Root() {
  const { isGuestMode } = useClientId();

  return (
    <div
      className={cn(
        "bg-stripes flex w-screen h-screen text-white font-outfit transition-all duration-300",
        isGuestMode ? "p-5" : "",
      )}
    >
      <div
        className={cn(
          "flex w-full h-full overflow-y-auto bg-slate-900 text-white font-outfit rounded-xl relative",
          isGuestMode ? "rounded-xl" : "rounded-none",
        )}
      >
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    </div>
  );
}

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      )
