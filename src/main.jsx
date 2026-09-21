import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {publishableKey ? <ClerkProvider publishableKey={publishableKey}><App /></ClerkProvider> : <App authConfigured={false} />}
  </React.StrictMode>
);
