import { useCallback, useEffect, useState } from "react";

import { ApiError, api, type ApiKey } from "../api";
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  Modal,
  Spinner,
  fmtDate,
  useToast
} from "../components/ui";

export default function ApiKeys() {
  const toast = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.apiKeys.list();
      setKeys(r.data);
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await api.apiKeys.create(name.trim());
      setNewKey(r.data.key);
      setName("");
      void load();
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
    } finally {
      setSaving(false);
    }
  };

  const revoke = (k: ApiKey) => {
    if (!window.confirm(`"${k.name}" түлхүүрийг устгах уу? Үүнийг ашиглаж буй клиентүүд ажиллахаа болино.`)) return;
    void (async () => {
      try {
        await api.apiKeys.revoke(k._id);
        toast.show("Устгагдлаа");
        void load();
      } catch (e) {
        toast.show(e instanceof ApiError ? e.message : "Алдаа", "error");
      }
    })();
  };

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text);
    toast.show("Хууллаа");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">API Key</h1>
          <p className="text-sm text-slate-500">SDK / программаас ажил бүртгэх түлхүүр</p>
        </div>
        <Button
          onClick={() => {
            setNewKey(null);
            setName("");
            setCreateOpen(true);
          }}
        >
          + Шинэ key
        </Button>
      </div>

      <Card>
        {loading ? (
          <Spinner />
        ) : keys.length === 0 ? (
          <EmptyState title="Key алга" hint="«Шинэ key» дарж үүсгэнэ үү." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-medium">Нэр</th>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Сүүлд ашигласан</th>
                  <th className="px-4 py-3 font-medium">Үүссэн</th>
                  <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k._id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-slate-100">{k.name}</td>
                    <td className="px-4 py-3 mono text-xs text-slate-400">{k.display}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(k.last_used_at)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{fmtDate(k.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" size="sm" onClick={() => revoke(k)}>
                        Устгах
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="API key үүсгэх">
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300 ring-1 ring-inset ring-amber-500/30">
              Энэ түлхүүр зөвхөн одоо харагдана. Хуулж аваад найдвартай хадгална уу.
            </div>
            <div className="flex items-center gap-2">
              <code className="mono flex-1 break-all rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-brand-300">
                {newKey}
              </code>
              <Button size="sm" onClick={() => copy(newKey)}>
                Хуулах
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Хаах
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Нэр</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ж: production-server"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Болих
              </Button>
              <Button onClick={create} disabled={saving || !name.trim()}>
                {saving ? "Үүсгэж байна…" : "Үүсгэх"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
