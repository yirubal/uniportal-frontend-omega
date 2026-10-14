import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./index.css";
import App from "./App.tsx";

// Initialize Telegram WebApp
WebApp.ready();
WebApp.expand();
// Each call is gated on the Bot API version that introduced it; older clients throw/warn otherwise.
if (WebApp.isVersionAtLeast?.("6.2")) {
    WebApp.enableClosingConfirmation();
}
if (WebApp.isVersionAtLeast?.("7.7")) {
    WebApp.disableVerticalSwipes();
}

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
