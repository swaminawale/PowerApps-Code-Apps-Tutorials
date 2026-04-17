import { ListAttachments } from "./components/ListAttachments";
import "./App.css";

function App() {
  return (
    <main className="app-shell">
      <h1>SharePoint Demo</h1>
      {/* <GetItems /> */}
      <ListAttachments />
    </main>
  );
}

export default App;
