import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkConfigured = typeof publishableKey === "string"
  && publishableKey.startsWith("pk_")
  && !publishableKey.includes("_key_here");

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <main style={{ padding: "2rem", fontFamily: "sans-serif" }}><h1>TenantAI could not load</h1><p>{this.state.error.message}</p></main>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      {clerkConfigured ? <ClerkProvider publishableKey={publishableKey}><App /></ClerkProvider> : <App authConfigured={false} />}
    </AppErrorBoundary>
  </React.StrictMode>
);
