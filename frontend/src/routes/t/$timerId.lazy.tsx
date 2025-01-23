import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/t/$timerId')({
  component: RouteComponent,
})

function RouteComponent() {
  const data = Route.useLoaderData();
  return <div>Hello {data.timerId} {data.ownerId} {data.duration}</div>;
}
