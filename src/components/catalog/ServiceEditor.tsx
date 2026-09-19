import { useState } from "react";
import { t } from "@/lib/i18n";
import { useNavigate } from "@tanstack/react-router";
import { FileText, FileCheck2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Service } from "@/lib/mock-data";
import { addService, deleteService, nextServiceCode, updateService, type ServiceInput } from "@/lib/catalog-store";
import { Field, Modal, inputClass } from "./Modal";

const num = (v: string) => Number(String(v).replace(",", ".")) || 0;

export function ServiceEditor({ service, onClose }: { service?: Service; onClose: () => void }) {
  const [d, setD] = useState<ServiceInput>({
    code: service?.code ?? nextServiceCode(),
    name: service?.name ?? "",
    category: service?.category ?? "",
    rate: service?.rate ?? 0,
    billing: service?.billing ?? "Hora",
    duration: service?.duration ?? "",
    margin: service?.margin ?? 0,
    active: service ? service.status === "activo" : true,
  });
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const navigate = useNavigate();
  const createDoc = (tipo: "cot" | "ft") => {
    onClose();
    navigate({ to: "/dashboard/documentos/novo", search: { tipo, item: `s:${service!.id}` } });
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return toast.error("Indique o nome do serviço.");
    if (!d.code.trim()) return toast.error("Indique o código.");
    if (d.rate <= 0) return toast.error("Indique a tarifa.");
    setBusy(true);
    const ok = service ? await updateService(service.id, d) : await addService(d);
    setBusy(false);
    if (ok) {
      toast.success(service ? "Serviço guardado" : "Serviço criado", { description: `${d.code} · ${d.name}` });
      onClose();
    }
  }
  async function remove() {
    if (!service) return;
    setBusy(true);
    if (await deleteService(service.id)) {
      toast.success("Serviço removido", { description: service.name });
      onClose();
    }
    setBusy(false);
  }

  return (
    <Modal title={service ? "Editar serviço" : "Novo serviço"} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <Field label="Código"><input className={inputClass} value={d.code} onChange={(e) => set("code", e.target.value)} /></Field>
          <Field label={t("Nome")}><input className={inputClass} value={d.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("Categoria")}><input className={inputClass} value={d.category} onChange={(e) => set("category", e.target.value)} placeholder="Consultoria, Tecnologia…" /></Field>
          <Field label="Duração"><input className={inputClass} value={d.duration} onChange={(e) => set("duration", e.target.value)} placeholder="1h, 3-5 dias, Contínuo" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t("Tarifa (MZN)")}><input className={inputClass} type="number" step="0.01" value={d.rate} onChange={(e) => set("rate", num(e.target.value))} /></Field>
          <Field label="Facturação">
            <select className={inputClass} value={d.billing} onChange={(e) => set("billing", e.target.value as ServiceInput["billing"])}>
              <option>Hora</option><option>Projecto</option><option>Mensal</option>
            </select>
          </Field>
          <Field label="Margem %"><input className={inputClass} type="number" step="1" value={d.margin} onChange={(e) => set("margin", num(e.target.value))} /></Field>
        </div>
        <Field label={t("Estado")}>
          <select className={inputClass} value={d.active ? "1" : "0"} onChange={(e) => set("active", e.target.value === "1")}>
            <option value="1">{t("Activo")}</option><option value="0">{t("Pausado")}</option>
          </select>
        </Field>
        {service && (
          <div className="flex flex-wrap gap-2 rounded-md border border-border/70 bg-surface p-3">
            <span className="w-full text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("Usar este serviço")}</span>
            <button type="button" onClick={() => createDoc("cot")} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted">
              <FileText className="h-3 w-3" />{t("Criar cotação")}</button>
            <button type="button" onClick={() => createDoc("ft")} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[11.5px] font-semibold hover:bg-muted">
              <FileCheck2 className="h-3 w-3" />{t("Criar factura")}</button>
          </div>
        )}
        <div className="mt-1 flex items-center gap-2 border-t border-border/70 pt-3">
          {service && !confirm && (
            <button type="button" onClick={() => setConfirm(true)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive hover:bg-destructive/8">
              <Trash2 className="h-3 w-3" />{t("Remover")}</button>
          )}
          {confirm && (
            <button type="button" onClick={remove} disabled={busy} className="rounded-md bg-destructive px-2.5 py-1.5 text-[11.5px] font-semibold text-destructive-foreground">{t("Confirmar remoção")}</button>
          )}
          <button type="button" onClick={onClose} className="ml-auto rounded-md border border-border px-3 py-2 text-[12px] font-medium hover:bg-muted">{t("Cancelar")}</button>
          <button type="submit" disabled={busy} className="rounded-md bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {busy ? t("A guardar…") : service ? t("Guardar") : t("Criar serviço")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
