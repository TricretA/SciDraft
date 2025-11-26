import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

function setVH() {
  document.documentElement.style.setProperty(
    "--vh",
    `${window.innerHeight * 0.01}px`
  );
}
setVH();
window.addEventListener("resize", setVH);

// Add error handling for production debugging
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element with id 'root' not found in DOM");
}

// Add error boundary for production
try {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log("React app initialized successfully");
} catch (error) {
  console.error("Failed to initialize React app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Application Error</h1>
      <p>Failed to load the application. Please refresh the page.</p>
      <details>
        <summary>Error Details</summary>
        <pre>${error instanceof Error ? error.stack : String(error)}</pre>
      </details>
    </div>
  `;
}
