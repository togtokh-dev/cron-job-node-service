import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { Button } from "./ui";

const NAV = [
  { to: "/", label: "Ажлууд", icon: "🗂", end: true },
  { to: "/logs", label: "Log", icon: "📜", end: false },
  { to: "/api-keys", label: "API Key", icon: "🔑", end: false },
  { to: "/sdk", label: "SDK заавар", icon: "📦", end: false },
  { to: "/settings", label: "Тохиргоо", icon: "⚙️", end: false }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-default-100 bg-content1 px-3 py-5 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-medium bg-primary text-lg font-bold text-primary-foreground shadow-sm">
            ⏱
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Cron Job</p>
            <p className="text-[11px] text-default-500">Хуваарьт ажлын удирдлага</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-medium px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 font-medium text-primary"
                    : "text-default-500 hover:bg-default-100 hover:text-foreground"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-default-100 pt-4">
          <p className="px-2 text-xs text-default-500">Нэвтэрсэн</p>
          <p className="truncate px-2 text-sm font-medium text-foreground">{user?.username}</p>
          <Button
            variant="subtle"
            size="sm"
            className="mt-2 w-full justify-start"
            onClick={doLogout}
          >
            ↩ Гарах
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-default-100 bg-content1/80 px-4 py-3 backdrop-blur sm:hidden">
          <span className="font-semibold text-foreground">⏱ Cron Job</span>
          <Button variant="subtle" size="sm" onClick={doLogout}>
            Гарах
          </Button>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-default-100 px-2 py-2 sm:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-medium px-3 py-1.5 text-xs ${
                  isActive ? "bg-primary/15 text-primary" : "text-default-500"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
