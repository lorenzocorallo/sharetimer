import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useClientId } from "../context/id-context";
import { cn } from "../lib/utils";

export const Route = createRootRoute({
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
