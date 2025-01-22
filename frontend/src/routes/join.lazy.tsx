import { createLazyFileRoute } from '@tanstack/react-router'
import { ClientTest } from '../components/client-test'

export const Route = createLazyFileRoute('/join')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ClientTest />
}
