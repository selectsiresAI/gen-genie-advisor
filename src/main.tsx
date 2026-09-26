import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./utils/importTechnicians";
import { initErrorTracking } from "./lib/errorTracking";

initErrorTracking();

createRoot(document.getElementById("root")!).render(<App />);
