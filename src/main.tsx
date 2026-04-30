import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./index.css";
import App from "./App.tsx";

// Initialize Telegram WebApp
WebApp.ready();
WebApp.expand();
const supportsModernChrome = WebApp.isVersionAtLeast?.("6.1") ?? false;
if (supportsModernChrome) {
    WebApp.disableVerticalSwipes();
    WebApp.enableClosingConfirmation();
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
