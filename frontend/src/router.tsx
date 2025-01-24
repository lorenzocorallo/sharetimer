import { routeTree } from "./routeTree.gen";
import { useClientId } from "./hooks/useClientId";
import { RouterProvider, createRouter } from "@tanstack/react-router";

const router = createRouter({ routeTree, context: { clientId: undefined! } });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function Router() {
  const { clientId } = useClientId();
  return clientId && <RouterProvider router={router} context={{ clientId }} />;
}
