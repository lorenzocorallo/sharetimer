import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/t/404")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden justify-center items-center gap-4">
        <h1 className="text-9xl font-extrabold pb-8">404</h1>
        <h2 className="text-4xl font-bold">Ooops!</h2>
        <h2 className="text-xl font-medium text-center">
          This timer doesn't exists, <br />
          looks like someone's been pranking you!
        </h2>

        <Link to="/" className="mt-8">
          <button className="bg-blue-500 py-2 px-8 rounded-lg cursor-pointer hover:bg-blue-400 transition-all">Go to Homepage</button>
        </Link>
      </div>
    </>
  );
}
