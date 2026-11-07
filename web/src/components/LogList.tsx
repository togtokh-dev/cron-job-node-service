import { useState } from "react";

import type { JobLog } from "../api";
import { EnvBadge, LogStatusBadge, fmtDate } from "./ui";

function Json({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <pre className="mono max-h-56 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
        {text}
      </pre>
    </div>
  );
}

function Row({ log, showJob }: { log: JobLog; showJob: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        className="cursor-pointer border-b border-slate-800/60 hover:bg-slate-800/30"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-2.5 text-slate-500">{open ? "▾" : "▸"}</td>
        <td className="px-4 py-2.5 text-xs text-slate-400">{fmtDate(log.createdAt)}</td>
        {showJob && (
          <td className="px-4 py-2.5">
            <span className="font-medium text-slate-200">{log.job_id}</span>
          </td>
        )}
        <td className="px-4 py-2.5">
          <EnvBadge env={log.type_name} />
        </td>
        <td className="px-4 py-2.5">
          <LogStatusBadge status={log.status} />
        </td>
        <td className="px-4 py-2.5 mono text-xs text-slate-300">{log.http_code ?? "—"}</td>
        <td className="px-4 py-2.5 mono text-xs text-slate-400">{log.duration_ms} ms</td>
      </tr>
      {open && (
        <tr className="border-b border-slate-800/60 bg-slate-950/40">
          <td colSpan={showJob ? 7 : 6} className="px-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Json label="Request config" value={log.request_config} />
              <Json label="Response body" value={log.response_body} />
            </div>
            {log.error_message && (
              <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 ring-1 ring-inset ring-red-500/30">
                <span className="font-medium">Алдаа: </span>
                {log.error_message}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export default function LogList({
  logs,
  showJob = true
}: {
  logs: JobLog[];
  showJob?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="w-8 px-4 py-3"></th>
            <th className="px-4 py-3 font-medium">Огноо</th>
            {showJob && <th className="px-4 py-3 font-medium">Job</th>}
            <th className="px-4 py-3 font-medium">Орчин</th>
            <th className="px-4 py-3 font-medium">Статус</th>
            <th className="px-4 py-3 font-medium">HTTP</th>
            <th className="px-4 py-3 font-medium">Хугацаа</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <Row key={l._id} log={l} showJob={showJob} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
