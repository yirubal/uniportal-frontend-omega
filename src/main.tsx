import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import WebApp from "@twa-dev/sdk";
import "./index.css";
import App from "./App.tsx";

// Initialize Telegram WebApp
WebApp.ready();
WebApp.expand();
WebApp.setHeaderColor("#0A1628");
WebApp.setBackgroundColor("#F5F7FA");

// Disable vertical swipes so the app feels native
WebApp.disableVerticalSwipes();

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>
);