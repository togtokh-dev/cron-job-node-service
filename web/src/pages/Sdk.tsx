import { Button, Card, useToast } from "../components/ui";

function CodeBlock({ code }: { code: string }) {
  const toast = useToast();
  return (
    <div className="relative">
      <pre className="mono overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">
        {code}
      </pre>
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(code);
          toast.show("Хууллаа");
        }}
        className="absolute right-2 top-2 rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
      >
        Хуулах
      </button>
    </div>
  );
}

export default function Sdk() {
  const host = window.location.origin;

  const usage = `import cronJobNode, {
  setHost,
  setApiKey,
  CronJobNodeData
} from "cron-job-node";

const run = async () => {
  setHost("${host}");
  setApiKey("cj_xxxxxxxxxxxxxxxx"); // API Key хуудаснаас үүсгэнэ (заавал биш)

  const list: CronJobNodeData = [
    {
      id: "my-token-refresh",
      config: {
        method: "get",
        maxBodyLength: "Infinity",
        url: "https://api.example.com/v1/get-token",
        headers: {}
      },
      job_time: "* * * * *", // минут тутам
      status: true,
      type_name: "prod",
      log_enabled: true
    }
  ];

  await cronJobNode(list);
};

run();`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-100">SDK заавар</h1>
        <p className="text-sm text-slate-500">
          <code className="mono text-brand-300">cron-job-node</code> ашиглан ажлуудаа кодоос бүртгэнэ
        </p>
      </div>

      <div className="space-y-6">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">1. Суулгах</h3>
          <CodeBlock code={`npm install cron-job-node`} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">2. API key үүсгэх</h3>
          <p className="mb-3 text-sm text-slate-400">
            «API Key» хуудас руу орж шинэ түлхүүр үүсгээд <code className="mono">setApiKey()</code>-д
            дамжуулна. (Хуучин нийтийн API-д key заавал биш.)
          </p>
          <a href="/api-keys">
            <Button variant="ghost" size="sm">
              🔑 API Key хуудас руу
            </Button>
          </a>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">3. Ашиглах</h3>
          <CodeBlock code={usage} />
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Талбарууд</h3>
          <ul className="space-y-1.5 text-sm text-slate-400">
            <li>
              <code className="mono text-slate-200">id</code> — давтагдашгүй нэр (дахин илгээвэл
              шинэчилнэ)
            </li>
            <li>
              <code className="mono text-slate-200">config</code> — axios хүсэлтийн тохиргоо
            </li>
            <li>
              <code className="mono text-slate-200">job_time</code> — cron илэрхийлэл
            </li>
            <li>
              <code className="mono text-slate-200">status</code> — идэвхтэй эсэх
            </li>
            <li>
              <code className="mono text-slate-200">type_name</code> — prod | staging | test | dev
            </li>
            <li>
              <code className="mono text-slate-200">log_enabled</code> — гүйцэтгэлийн log бичих эсэх
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
