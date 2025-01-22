import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex w-screen h-screen bg-slate-900 text-white">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
});
