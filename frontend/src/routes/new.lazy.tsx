import { createLazyFileRoute } from '@tanstack/react-router'
import { OwnerTest } from '../components/owner-test'

export const Route = createLazyFileRoute('/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <OwnerTest />
}
