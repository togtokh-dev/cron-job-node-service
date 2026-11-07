import { useEffect, useState } from "react";

import { ApiError, api, type Job, type JobEnv } from "../api";
import { Button, Input, Label, Modal, Select, Toggle, useToast } from "./ui";

const ENVS: JobEnv[] = ["prod", "staging", "test", "dev"];

const DEFAULT_CONFIG = `{
  "method": "get",
  "url": "https://api.example.com/v1/ping",
  "headers": {}
}`;

export default function JobFormModal({
  open,
  onClose,
  onSaved,
  initial
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Job | null;
}) {
  const toast = useToast();
  const isEdit = Boolean(initial);

  const [id, setId] = useState("");
  const [typeName, setTypeName] = useState<JobEnv>("dev");
  const [jobTime, setJobTime] = useState("* * * * *");
  const [configText, setConfigText] = useState(DEFAULT_CONFIG);
  const [status, setStatus] = useState(true);
  const [logEnabled, setLogEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (initial) {
      setId(initial.id);
      setTypeName(initial.type_name);
      setJobTime(initial.job_time);
      setConfigText(JSON.stringify(initial.config ?? {}, null, 2));
      setStatus(initial.status);
      setLogEnabled(initial.log_enabled);
    } else {
      setId("");
      setTypeName("dev");
      setJobTime("* * * * *");
      setConfigText(DEFAULT_CONFIG);
      setStatus(true);
      setLogEnabled(false);
    }
  }, [open, initial]);

  const submit = async () => {
    setErr(null);
    let config: unknown;
    try {
      config = JSON.parse(configText);
    } catch {
      setErr("Config JSON буруу байна");
      return;
    }
    if (!id.trim()) return setErr("id шаардлагатай");
    if (!jobTime.trim()) return setErr("job_time шаардлагатай");

    setSaving(true);
    try {
      if (isEdit && initial) {
        await api.jobs.update(initial.id, {
          config,
          job_time: jobTime,
          status,
          type_name: typeName,
          log_enabled: logEnabled
        });
        toast.show("Ажил шинэчлэгдлээ");
      } else {
        await api.jobs.create({
          id: id.trim(),
          config,
          job_time: jobTime,
          status,
          type_name: typeName,
          log_enabled: logEnabled
        });
        toast.show("Ажил үүслээ");
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Ажил засах" : "Шинэ ажил"} width="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>ID</Label>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={isEdit}
              placeholder="my-job-id"
            />
          </div>
          <div>
            <Label>Орчин</Label>
            <Select
              value={typeName}
              onChange={(e) => setTypeName(e.target.value as JobEnv)}
              className="w-full"
            >
              {ENVS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Хуваарь (cron)</Label>
          <Input
            value={jobTime}
            onChange={(e) => setJobTime(e.target.value)}
            placeholder="* * * * *"
            className="mono"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Ж: <span className="mono">* * * * *</span> = минут тутам
          </p>
        </div>

        <div>
          <Label>Config (axios хүсэлт, JSON)</Label>
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            rows={8}
            className="mono w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Toggle checked={status} onChange={setStatus} />
            Идэвхтэй
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Toggle checked={logEnabled} onChange={setLogEnabled} />
            Log бичих
          </label>
        </div>

        {err && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-inset ring-red-500/30">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Болих
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Хадгалж байна…" : isEdit ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
