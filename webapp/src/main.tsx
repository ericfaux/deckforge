import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";
import "./styles/animations.css";
import "./styles/focus.css";

// Detect keyboard navigation (show focus rings only for keyboard users)
function handleFirstTab(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    document.body.classList.add('user-is-tabbing');
    window.removeEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDownOnce);
  }
}

function handleMouseDownOnce() {
  document.body.classList.remove('user-is-tabbing');
  window.removeEventListener('mousedown', handleMouseDownOnce);
  window.addEventListener('keydown', handleFirstTab);
}

window.addEventListener('keydown', handleFirstTab);

createRoot(document.getElementById("root")!).render(<App />);
