import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/glory/300.css";
import "@fontsource/glory/400.css";
import "@fontsource/glory/500.css";
import "@fontsource/glory/700.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
