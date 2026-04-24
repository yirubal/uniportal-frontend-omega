import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./index.css";
import App from "./App.tsx";

// Initialize Telegram WebApp
WebApp.ready();
WebApp.expand();
WebApp.disableVerticalSwipes();
WebApp.enableClosingConfirmation();

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);
