import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Capturer et ignorer les erreurs DOM non critiques de Radix UI
window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || '';

    // Ignorer l'erreur spécifique de removeChild qui vient de Radix UI
    if (errorMessage.includes('removeChild') || errorMessage.includes('NotFoundError')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
});

createRoot(document.getElementById("root")!).render(<App />);
