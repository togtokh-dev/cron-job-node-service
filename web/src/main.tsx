import { HeroUIProvider } from "@heroui/react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useHref, useNavigate } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth";
import "./index.css";

function Providers({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <HeroUIProvider navigate={navigate} useHref={useHref}>
      {children}
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Providers>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Providers>
    </BrowserRouter>
  </React.StrictMode>
);
