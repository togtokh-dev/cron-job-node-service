import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError, api, type Job, type JobLog } from "../api";
import JobFormModal from "../components/JobFormModal";
import LogList from "../components/LogList";
import {
  Button,
  Card,
  EmptyState,
  EnvBadge,
  Spinner,
  StatusBadge,
  Toggle,
  fmtDate,
  useToast
} from "../components/ui";

export default function JobDetail() {
  const { id = "" } = useParams();
  const jobId = decodeURIComponent(id);
  const toast = useToast();
  const navigate = useNavigate();

  const [job, setJob] = useState<(Job & { recent_logs: JobLog[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.jobs.get(jobId);
      setJob(r.data);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Олдсонгүй", "error");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      toast.show(okMsg);
      void load();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
    }
  };

  const clearLogs = () => {
    if (!window.confirm("Энэ ажлын бүх log-ийг цэвэрлэх үү?")) return;
    void act(() => api.jobs.clearLogs(jobId), "Log цэвэрлэгдлээ");
  };

  const remove = () => {
    if (!window.confirm(`"${jobId}" ажлыг бүрмөсөн устгах уу?`)) return;
    void (async () => {
      try {
        await api.jobs.remove(jobId);
        toast.show("Устгагдлаа");
        navigate("/");
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      }
    })();
  };

  if (loading) return <Spinner label="Ачааллаж байна…" />;
  if (!job) return <EmptyState title="Ажил олдсонгүй" />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-slate-200">
            ← Буцах
          </Link>
          <h1 className="text-xl font-semibold text-slate-100">{job.id}</h1>
          <EnvBadge env={job.type_name} />
          <StatusBadge active={job.status} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => void act(() => (job.status ? api.jobs.stop(job.id) : api.jobs.start(job.id)), job.status ? "Зогсоов" : "Эхлүүллээ")}
          >
            {job.status ? "⏸ Зогсоох" : "▶ Эхлүүлэх"}
          </Button>
          <Button variant="ghost" onClick={() => setEditOpen(true)}>
            ✎ Засах
          </Button>
          <Button variant="danger" onClick={remove}>
            Устгах
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Мэдээлэл</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Хуваарь</dt>
              <dd className="mono text-slate-200">{job.job_time}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500">Log бичих</dt>
              <dd>
                <Toggle
                  checked={job.log_enabled}
                  onChange={(v) => void act(() => api.jobs.toggleLog(job.id, v), v ? "Log асаалаа" : "Log унтраалаа")}
                />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Үүссэн</dt>
              <dd className="text-slate-300">{fmtDate(job.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Шинэчилсэн</dt>
              <dd className="text-slate-300">{fmtDate(job.updatedAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Config</h3>
          <pre className="mono max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
            {JSON.stringify(job.config, null, 2)}
          </pre>
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Сүүлийн log-ууд</h3>
          <div className="flex items-center gap-2">
            <Link to={`/logs?job_id=${encodeURIComponent(job.id)}`}>
              <Button variant="subtle" size="sm">
                Бүх log →
              </Button>
            </Link>
            <Button variant="subtle" size="sm" onClick={clearLogs}>
              🧹 Log цэвэрлэх
            </Button>
          </div>
        </div>
        <Card>
          {job.recent_logs.length === 0 ? (
            <EmptyState
              title="Log алга"
              hint={job.log_enabled ? "Ажил ажиллахад log бичигдэнэ." : "Log бичих унтраалттай байна."}
            />
          ) : (
            <LogList logs={job.recent_logs} showJob={false} />
          )}
        </Card>
      </div>

      <JobFormModal open={editOpen} onClose={() => setEditOpen(false)} onSaved={load} initial={job} />
    </div>
  );
}
