import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ApiError, api, type SettingsData } from "../api";
import { useAuth } from "../auth";
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  Spinner,
  Toggle,
  useToast
} from "../components/ui";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}

export default function Settings() {
  const toast = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState(30);
  const [savingRetention, setSavingRetention] = useState(false);

  // manual delete
  const [mEnv, setMEnv] = useState("");
  const [mBefore, setMBefore] = useState("");

  // workspace delete
  const [confirmText, setConfirmText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.settings.get();
      setData(r.data);
      setEnabled(r.data.retention.enabled);
      setDays(r.data.retention.days);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRetention = async () => {
    setSavingRetention(true);
    try {
      await api.settings.updateRetention({ enabled, days });
      toast.show("Хадгалагдлаа");
      void load();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
    } finally {
      setSavingRetention(false);
    }
  };

  const manualDelete = () => {
    if (!window.confirm("Сонгосон log-уудыг устгах уу?")) return;
    void (async () => {
      try {
        const r = await api.logs.deleteFiltered({
          type_name: mEnv || undefined,
          to: mBefore || undefined
        });
        toast.show(`${r.data.deleted} log устгагдлаа`);
        void load();
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      }
    })();
  };

  const deleteWorkspace = () => {
    if (confirmText !== "DELETE") return;
    if (!window.confirm("Бүх ажил, log, API key устах болно. Үнэхээр үргэлжлүүлэх үү?")) return;
    void (async () => {
      try {
        const r = await api.settings.deleteWorkspace();
        toast.show(`Арилгалаа: ${r.data.jobs} ажил, ${r.data.logs} log, ${r.data.api_keys} key`);
        void load();
        setConfirmText("");
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      }
    })();
  };

  if (loading) return <Spinner label="Ачааллаж байна…" />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Тохиргоо</h1>
        <p className="text-sm text-slate-500">Log retention, цэвэрлэгээ, workspace</p>
      </div>

      {data && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Нийт ажил" value={data.stats.jobs} />
          <Stat label="Идэвхтэй" value={data.stats.activeJobs} />
          <Stat label="Log" value={data.stats.logs} />
          <Stat label="API key" value={data.stats.apiKeys} />
        </div>
      )}

      <div className="space-y-6">
        {/* Retention */}
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-200">Log устгах (автомат)</h3>
          <p className="mb-4 text-xs text-slate-500">
            Хугацаа нь хэтэрсэн log-ийг автоматаар устгана.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <Toggle checked={enabled} onChange={setEnabled} />
              Идэвхжүүлэх
            </label>
            <div>
              <Label>Хоногийн дараа устгах</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={String(days)}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-28"
                  disabled={!enabled}
                />
                <span className="text-sm text-slate-400">хоног</span>
              </div>
            </div>
            <Button onClick={saveRetention} disabled={savingRetention}>
              {savingRetention ? "Хадгалж байна…" : "Хадгалах"}
            </Button>
          </div>
        </Card>

        {/* Manual delete */}
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-200">Log устгах (гараар)</h3>
          <p className="mb-4 text-xs text-slate-500">
            Орчин ба огноогоор сонгож устгана. Огноо өгвөл түүнээс өмнөх log-уудыг устгана.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Орчин</Label>
              <Select value={mEnv} onChange={(e) => setMEnv(e.target.value)}>
                <option value="">Бүгд</option>
                <option value="prod">prod</option>
                <option value="staging">staging</option>
                <option value="test">test</option>
                <option value="dev">dev</option>
              </Select>
            </div>
            <div>
              <Label>Огнооноос өмнө</Label>
              <Input type="date" value={mBefore} onChange={(e) => setMBefore(e.target.value)} />
            </div>
            <Button variant="danger" onClick={manualDelete}>
              Устгах
            </Button>
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="border-red-500/30 p-5">
          <h3 className="mb-1 text-sm font-semibold text-red-300">Workspace устгах</h3>
          <p className="mb-4 text-xs text-slate-500">
            Бүх ажил, log, API key бүрмөсөн устана. Буцаах боломжгүй. Баталгаажуулахын тулд{" "}
            <code className="mono text-red-300">DELETE</code> гэж бичнэ үү.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-40"
            />
            <Button variant="danger" disabled={confirmText !== "DELETE"} onClick={deleteWorkspace}>
              Workspace устгах
            </Button>
          </div>
        </Card>

        <div className="pt-2">
          <Button
            variant="subtle"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            ↩ Гарах
          </Button>
        </div>
      </div>
    </div>
  );
}
