import {
  Button as HButton,
  Card as HCard,
  Chip,
  Input as HInput,
  Modal as HModal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Spinner as HSpinner,
  Switch
} from "@heroui/react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type ReactNode,
  type SelectHTMLAttributes
} from "react";

import type { JobEnv } from "../api";

type HeroColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

/* ----------------------------- Button ----------------------------- */
type ButtonProps = Omit<
  ComponentProps<typeof HButton>,
  "color" | "variant" | "size" | "radius" | "isDisabled"
> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md";
  disabled?: boolean;
};
const BTN_MAP: Record<
  NonNullable<ButtonProps["variant"]>,
  { color: HeroColor; variant: "solid" | "flat" | "light" }
> = {
  primary: { color: "primary", variant: "solid" },
  ghost: { color: "default", variant: "flat" },
  subtle: { color: "default", variant: "light" },
  danger: { color: "danger", variant: "solid" }
};
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const m = BTN_MAP[variant];
  return (
    <HButton
      color={m.color}
      variant={m.variant}
      size={size}
      radius="md"
      isDisabled={disabled}
      className={`font-medium ${className}`}
      {...rest}
    >
      {children}
    </HButton>
  );
}

/* ----------------------------- Inputs ----------------------------- */
type InputProps = Omit<
  ComponentProps<typeof HInput>,
  "size" | "color" | "variant" | "radius" | "isDisabled"
> & { disabled?: boolean };
export function Input({ className = "", disabled, ...rest }: InputProps) {
  return (
    <HInput
      variant="bordered"
      radius="md"
      size="md"
      isDisabled={disabled}
      classNames={{
        inputWrapper:
          "bg-content2 border-default-200 data-[hover=true]:border-default-300 group-data-[focus=true]:border-primary",
        input: "text-sm"
      }}
      className={className}
      {...rest}
    />
  );
}

export function Select({
  className = "",
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`rounded-medium border border-default-200 bg-content2 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-xs font-medium text-default-500">{children}</label>;
}

/* ----------------------------- Card ----------------------------- */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <HCard
      shadow="sm"
      radius="lg"
      className={`border border-default-100 bg-content1 ${className}`}
    >
      {children}
    </HCard>
  );
}

/* ----------------------------- Badges ----------------------------- */
const ENV_COLOR: Record<JobEnv, HeroColor> = {
  prod: "success",
  staging: "warning",
  test: "primary",
  dev: "default"
};
export function EnvBadge({ env }: { env: JobEnv }) {
  return (
    <Chip color={ENV_COLOR[env]} variant="flat" size="sm" radius="sm" className="uppercase">
      {env}
    </Chip>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Chip
      color={active ? "success" : "default"}
      variant="flat"
      size="sm"
      radius="sm"
      startContent={
        <span
          className={`mx-0.5 h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-default-400"}`}
        />
      }
    >
      {active ? "Идэвхтэй" : "Зогссон"}
    </Chip>
  );
}

export function LogStatusBadge({ status }: { status: "success" | "error" }) {
  return (
    <Chip color={status === "success" ? "success" : "danger"} variant="flat" size="sm" radius="sm">
      {status === "success" ? "Амжилттай" : "Алдаа"}
    </Chip>
  );
}

/* ----------------------------- Toggle ----------------------------- */
export function Toggle({
  checked,
  onChange,
  disabled
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      isSelected={checked}
      onValueChange={onChange}
      isDisabled={disabled}
      size="sm"
      color="primary"
    />
  );
}

/* ----------------------------- Modal ----------------------------- */
const WIDTH_MAP: Record<string, "md" | "lg" | "xl" | "2xl"> = {
  "max-w-md": "md",
  "max-w-lg": "lg",
  "max-w-xl": "xl",
  "max-w-2xl": "2xl"
};
export function Modal({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg"
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  return (
    <HModal
      isOpen={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      size={WIDTH_MAP[width] ?? "lg"}
      backdrop="blur"
      placement="center"
      scrollBehavior="inside"
      classNames={{ base: "bg-content1 border border-default-100" }}
    >
      <ModalContent>
        <ModalHeader className="text-base font-semibold">{title}</ModalHeader>
        <ModalBody className="pb-5">{children}</ModalBody>
      </ModalContent>
    </HModal>
  );
}

/* ----------------------------- Spinner / Empty ----------------------------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <HSpinner label={label} color="primary" />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="text-sm font-medium text-default-600">{title}</p>
      {hint && <p className="text-xs text-default-400">{hint}</p>}
    </div>
  );
}

/* ----------------------------- Toast ----------------------------- */
type Toast = { id: number; message: string; type: "success" | "error" };
type ToastCtx = { show: (message: string, type?: "success" | "error") => void };
const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[220px] rounded-medium px-4 py-3 text-sm shadow-lg ring-1 ring-inset ${
              t.type === "success"
                ? "bg-success-50 text-success-700 ring-success-200"
                : "bg-danger-50 text-danger-700 ring-danger-200"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ----------------------------- helpers ----------------------------- */
export function fmtDate(d?: string | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
