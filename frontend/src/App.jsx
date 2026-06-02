import Home from "./pages/Home";
import CodeEditor from "./components/Editor";

function App() {
  const roomId = localStorage.getItem("roomId");

  if (!roomId) {
    return <Home />;
  }

  return <CodeEditor />;
}

export default App;