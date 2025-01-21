import { WebSocketTest } from "./components/ws-test";

function App() {
  return (
    <div className="flex w-full h-screen bg-slate-900 text-white">
      <WebSocketTest i={1} />
      <WebSocketTest i={2} />
    </div>
  );
}

export default App;
