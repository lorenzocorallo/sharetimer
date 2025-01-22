import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { Plus, UsersRound } from "lucide-react";

export const Route = createLazyFileRoute('/')({
  component: Index,
})

export function Index() {
  return (
    <>
      <Link to="/new" className="flex-1 flex justify-center items-center bg-red-800/30 group">
        <Plus
          size={180}
          className="transition-transform group-hover:scale-[1.2]"
        />
      </Link>
      <Link to="/join" className="flex-1 flex justify-center items-center bg-green-800/30 group">
        <UsersRound
          size={180}
          className="transition-transform group-hover:scale-[1.2]"
        />
      </Link>
    </>
  );
}
