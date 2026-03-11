import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/glory/300.css";
import "@fontsource/glory/400.css";
import "@fontsource/glory/500.css";
import "@fontsource/glory/700.css";
import "./index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error(
		"Failed to find the root element. Make sure index.html has a <div id='root'></div>",
	);
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
