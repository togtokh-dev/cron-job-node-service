import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { ApiError, api, type JobLog } from "../api";
import LogList from "../components/LogList";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Select,
  Spinner,
  useToast
} from "../components/ui";

export default function Logs() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const [env, setEnv] = useState("");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState(searchParams.get("job_id") || "");

  const buildQuery = useCallback(
    () => ({
      type_name: env || undefined,
      status: status || undefined,
      job_id: jobId.trim() || undefined
    }),
    [env, status, jobId]
  );

  const load = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const r = await api.logs.list({ ...buildQuery(), page: p, limit });
        setLogs(r.data);
        setTotal(r.count ?? 0);
        setPage(p);
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      } finally {
        setLoading(false);
      }
    },
    [buildQuery, page, toast]
  );

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [env, status, jobId]);

  const deleteFiltered = () => {
    const scope = jobId || env || status ? "шүүсэн" : "БҮХ";
    if (!window.confirm(`${scope} log-уудыг устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    void (async () => {
      try {
        const r = await api.logs.deleteFiltered(buildQuery());
        toast.show(`${r.data.deleted} log устгагдлаа`);
        void load(1);
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      }
    })();
  };

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Log</h1>
          <p className="text-sm text-slate-500">Ажлуудын гүйцэтгэлийн бичлэг — {total} мөр</p>
        </div>
        <Button variant="danger" onClick={deleteFiltered}>
          🗑 Шүүсэн log устгах
        </Button>
      </div>

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Орчин</Label>
            <Select value={env} onChange={(e) => setEnv(e.target.value)} className="w-full">
              <option value="">Бүгд</option>
              <option value="prod">prod</option>
              <option value="staging">staging</option>
              <option value="test">test</option>
              <option value="dev">dev</option>
            </Select>
          </div>
          <div>
            <Label>Статус</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
              <option value="">Бүгд</option>
              <option value="success">Амжилттай</option>
              <option value="error">Алдаа</option>
            </Select>
          </div>
          <div>
            <Label>Job ID</Label>
            <Input value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="бүх job" />
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState title="Log алга" hint="Шүүлтүүрээ өөрчилж үзнэ үү." />
        ) : (
          <LogList logs={logs} showJob />
        )}
      </Card>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-400">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>
            ← Өмнөх
          </Button>
          <span>
            {page} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => void load(page + 1)}
          >
            Дараах →
          </Button>
        </div>
      )}
    </div>
  );
}
