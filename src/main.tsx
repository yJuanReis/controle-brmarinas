// Final
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Importar o filtro de console para bloquear warnings do Radix UI
import "./lib/consoleFilter";

createRoot(document.getElementById("root")!).render(<App />);
