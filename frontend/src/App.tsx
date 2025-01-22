import { ClientTest } from "./components/client-test";
import { OwnerTest } from "./components/owner-test";

function App() {
  return (
    <div className="flex w-full h-screen bg-slate-900 text-white">
      <OwnerTest />
      <ClientTest />
    </div>
  );
}

export default App;
