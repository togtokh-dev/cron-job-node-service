import { Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./auth";
import Layout from "./components/Layout";
import { Spinner, ToastProvider } from "./components/ui";
import ApiKeys from "./pages/ApiKeys";
import JobDetail from "./pages/JobDetail";
import Jobs from "./pages/Jobs";
import Login from "./pages/Login";
import Logs from "./pages/Logs";
import Sdk from "./pages/Sdk";
import Settings from "./pages/Settings";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Ачааллаж байна…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <Protected>
              <Jobs />
            </Protected>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <Protected>
              <JobDetail />
            </Protected>
          }
        />
        <Route
          path="/logs"
          element={
            <Protected>
              <Logs />
            </Protected>
          }
        />
        <Route
          path="/api-keys"
          element={
            <Protected>
              <ApiKeys />
            </Protected>
          }
        />
        <Route
          path="/sdk"
          element={
            <Protected>
              <Sdk />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
