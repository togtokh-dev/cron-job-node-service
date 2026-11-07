import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError, api, type Job, type JobEnv } from "../api";
import JobFormModal from "../components/JobFormModal";
import {
  Button,
  Card,
  EmptyState,
  EnvBadge,
  Input,
  Spinner,
  StatusBadge,
  Toggle,
  fmtDate,
  useToast
} from "../components/ui";

const ENV_TABS: ("all" | JobEnv)[] = ["all", "prod", "staging", "test", "dev"];
const TAB_LABEL: Record<string, string> = {
  all: "Бүгд",
  prod: "Prod",
  staging: "Staging",
  test: "Test",
  dev: "Dev"
};

export default function Jobs() {
  const toast = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [env, setEnv] = useState<"all" | JobEnv>("all");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.jobs.list({
        type_name: env === "all" ? undefined : env,
        q: q.trim() || undefined
      });
      setJobs(r.data);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Ачаалахад алдаа", "error");
    } finally {
      setLoading(false);
    }
  }, [env, q, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      toast.show(okMsg);
      void load();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа гарлаа", "error");
    }
  };

  const remove = (job: Job) => {
    if (!window.confirm(`"${job.id}" ажлыг бүрмөсөн устгах уу?`)) return;
    void act(() => api.jobs.remove(job.id), "Ажил устгагдлаа");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Ажлууд</h1>
          <p className="text-sm text-slate-500">Хуваарьт HTTP ажлуудын жагсаалт</p>
        </div>
        <div className="flex gap-2">
          <Link to="/api-keys">
            <Button variant="ghost">🔑 API key</Button>
          </Link>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Шинэ ажил
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
          {ENV_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setEnv(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                env === t ? "bg-brand-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
        <div className="w-56">
          <Input placeholder="ID-гаар хайх…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <EmptyState title="Ажил алга" hint="«Шинэ ажил» дарж нэмнэ үү." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Орчин</th>
                  <th className="px-4 py-3 font-medium">Хуваарь</th>
                  <th className="px-4 py-3 font-medium">Төлөв</th>
                  <th className="px-4 py-3 text-center font-medium">Log</th>
                  <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/jobs/${encodeURIComponent(job.id)}`}
                        className="font-medium text-slate-100 hover:text-brand-400"
                      >
                        {job.id}
                      </Link>
                      <div className="text-[11px] text-slate-500">{fmtDate(job.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <EnvBadge env={job.type_name} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono text-xs text-slate-300">{job.job_time}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => act(() => (job.status ? api.jobs.stop(job.id) : api.jobs.start(job.id)), job.status ? "Зогсоов" : "Эхлүүллээ")}>
                        <StatusBadge active={job.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Toggle
                          checked={job.log_enabled}
                          onChange={(v) => void act(() => api.jobs.toggleLog(job.id, v), v ? "Log асаалаа" : "Log унтраалаа")}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => navigate(`/jobs/${encodeURIComponent(job.id)}`)}
                        >
                          Дэлгэрэнгүй
                        </Button>
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => {
                            setEditing(job);
                            setModalOpen(true);
                          }}
                        >
                          Засах
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => remove(job)}>
                          Устгах
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <JobFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        initial={editing}
      />
    </div>
  );
}
