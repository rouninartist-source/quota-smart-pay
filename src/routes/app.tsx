import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import {
  Home,
  FileText,
  Plus,
  MessageCircle,
  User,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  Battery,
  Signal,
  ChevronRight,
  QrCode,
  Send,
  Camera,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Download,
  Share2,
  FileMinus,
  FilePlus,
  Receipt,
  Truck,
  FileCheck2,
  X,
  Shield,
  Briefcase,
  ShoppingBag,
  Eye,
  EyeOff,
  Lock,
  Printer,
  Users,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  TrendingUp,
  Building2,
  UserCircle2,
  Globe,
  ImagePlus,
  Calculator,
  LogIn,
  Trash2,
} from "lucide-react";

type Lang = "pt" | "en";

const dict = {
  pt: {
    welcome: "Bem-vindo de volta",
    loginSub: "Entre na sua conta Quota para continuar.",
    email: "Email ou telefone",
    password: "Palavra-passe",
    login: "Entrar",
    forgot: "Esqueci a palavra-passe",
    or: "ou",
    googleLogin: "Continuar com Google",
    language: "Idioma",
    home: "Início", docs: "Docs", chat: "Chat", profile: "Perfil",
    notifications: "Notificações", markAllRead: "Marcar tudo como lido",
    addCompany: "Adicionar nova empresa", save: "Guardar", cancel: "Cancelar",
    cotacaoDesc: "Cotação visual com imagem do produto",
    productImage: "Foto do produto", uploadImage: "Tocar para adicionar foto",
    invoiceFor: "Nova factura para",
    changePhoto: "Alterar foto",
  },
  en: {
    welcome: "Welcome back",
    loginSub: "Sign in to your Quota account to continue.",
    email: "Email or phone",
    password: "Password",
    login: "Sign in",
    forgot: "Forgot password",
    or: "or",
    googleLogin: "Continue with Google",
    language: "Language",
    home: "Home", docs: "Docs", chat: "Chat", profile: "Profile",
    notifications: "Notifications", markAllRead: "Mark all as read",
    addCompany: "Add new company", save: "Save", cancel: "Cancel",
    cotacaoDesc: "Visual quote with product picture",
    productImage: "Product image", uploadImage: "Tap to add a photo",
    invoiceFor: "New invoice for",
    changePhoto: "Change photo",
  },
} as const;


type DocType = {
  id: string;
  code: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  tone: string;
};

const docTypes: DocType[] = [
  { id: "ft", code: "FT", label: "Factura", desc: "Documento fiscal para venda concluída", icon: <FileText className="h-4 w-4" />, tone: "bg-primary/10 text-primary" },
  { id: "cot", code: "COT", label: "Cotação visual", desc: "Cotação com foto do produto em causa", icon: <ImagePlus className="h-4 w-4" />, tone: "bg-accent text-accent-foreground" },
  { id: "pf", code: "FP", label: "Factura Pro-forma", desc: "Orçamento ou cotação para o cliente", icon: <FileCheck2 className="h-4 w-4" />, tone: "bg-primary/10 text-primary" },
  { id: "nc", code: "NC", label: "Nota de Crédito", desc: "Anular ou corrigir factura emitida", icon: <FileMinus className="h-4 w-4" />, tone: "bg-destructive/10 text-destructive" },
  { id: "nd", code: "ND", label: "Nota de Débito", desc: "Cobrar valor adicional ao cliente", icon: <FilePlus className="h-4 w-4" />, tone: "bg-warning/15 text-warning-foreground" },
  { id: "rc", code: "RC", label: "Recibo", desc: "Comprovativo de pagamento recebido", icon: <Receipt className="h-4 w-4" />, tone: "bg-success/10 text-success" },
  { id: "gr", code: "GR", label: "Guia de Remessa", desc: "Acompanha o transporte de mercadoria", icon: <Truck className="h-4 w-4" />, tone: "bg-muted text-foreground" },
];


export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Quota · App móvel" },
      {
        name: "description",
        content:
          "Experiência móvel da Quota: facturação, cobranças e WhatsApp na palma da sua mão.",
      },
      { name: "theme-color", content: "#0F172A" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
    ],
  }),
  component: MobileApp,
});

type Tab = "home" | "invoices" | "new" | "chat" | "profile";

type Cliente = {
  id: string;
  name: string;
  nuit: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

const initialClients: Cliente[] = [
  { id: "1", name: "João Comercial, Lda", nuit: "400 123 456", phone: "+258 84 500 1234", email: "joao@comercial.mz", address: "Av. 25 de Setembro, 1234", city: "Maputo" },
  { id: "2", name: "Construções Beira", nuit: "400 998 221", phone: "+258 86 200 9876", email: "geral@construcoesbeira.mz", address: "Rua Comércio, 45", city: "Beira" },
  { id: "3", name: "Maputo Logística", nuit: "400 552 110", phone: "+258 87 300 4455", email: "ops@maputolog.mz", address: "Av. Acordos de Lusaka, 789", city: "Maputo" },
  { id: "4", name: "Farmácia Central", nuit: "400 312 887", phone: "+258 82 100 2233", email: "farmacia@central.mz", address: "Av. Julius Nyerere, 56", city: "Maputo" },
  { id: "5", name: "Auto Peças Matola", nuit: "400 221 339", phone: "+258 84 700 8899", email: "vendas@autopecasmatola.mz", address: "Estrada Nacional 4, KM 7", city: "Matola" },
  { id: "6", name: "Café Continental", nuit: "400 778 654", phone: "+258 86 600 1122", email: "hello@cafecontinental.mz", address: "Av. Karl Marx, 200", city: "Maputo" },
];

type Perm = "create" | "delete" | "viewFinance" | "manageTeam" | "send";
type Role = {
  id: string;
  name: string;
  user: string;
  initial: string;
  desc: string;
  perms: Perm[];
  icon: React.ReactNode;
  tone: string;
};

const roles: Role[] = [
  {
    id: "admin",
    name: "Administrador",
    user: "Helena Macuácua",
    initial: "H",
    desc: "Acesso total · facturação, equipa, finanças e configurações",
    perms: ["create", "delete", "viewFinance", "manageTeam", "send"],
    icon: <Shield className="h-4 w-4" />,
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "manager",
    name: "Gestor",
    user: "Carlos Mahanjane",
    initial: "C",
    desc: "Emite e aprova documentos · vê relatórios financeiros",
    perms: ["create", "viewFinance", "send"],
    icon: <Briefcase className="h-4 w-4" />,
    tone: "bg-accent text-accent-foreground",
  },
  {
    id: "seller",
    name: "Vendedor",
    user: "Aida Cossa",
    initial: "A",
    desc: "Cria facturas e recibos · envia por WhatsApp",
    perms: ["create", "send"],
    icon: <ShoppingBag className="h-4 w-4" />,
    tone: "bg-success/10 text-success",
  },
  {
    id: "viewer",
    name: "Visualizador",
    user: "Tomás Sitoe",
    initial: "T",
    desc: "Apenas consulta · sem permissões de criação",
    perms: [],
    icon: <Eye className="h-4 w-4" />,
    tone: "bg-muted text-muted-foreground",
  },
];

/* -------------------------- PLAN / COMPANY -------------------------- */

type Plan = { id: "individual" | "multi"; name: string; desc: string };

const plans: Plan[] = [
  { id: "individual", name: "Plano Individual", desc: "Uma única empresa · ideal para freelancers e PMEs" },
  { id: "multi", name: "Plano Multi-empresas", desc: "Gere várias empresas com um único login" },
];

type Company = { id: string; name: string; nuit: string; sector: string; initial: string };

const companies: Company[] = [
  { id: "c1", name: "Quota Retail, Lda", nuit: "400 998 123", sector: "Comércio a retalho", initial: "Q" },
  { id: "c2", name: "Maputo Construções", nuit: "400 887 442", sector: "Construção civil", initial: "M" },
  { id: "c3", name: "Beira Logistics", nuit: "400 661 904", sector: "Logística e transportes", initial: "B" },
];

const individualCompany: Company = companies[0];

type Notif = { id: string; title: string; body: string; time: string; read: boolean; tone: "info" | "success" | "warning" };

const initialNotifs: Notif[] = [
  { id: "n1", title: "Pagamento recebido", body: "João Comercial pagou FT 2026/00187 via M-Pesa.", time: "agora", read: false, tone: "success" },
  { id: "n2", title: "Factura em atraso", body: "Farmácia Central · 12 200 MZN há 5 dias.", time: "2h", read: false, tone: "warning" },
  { id: "n3", title: "Nova mensagem WhatsApp", body: "Construções Beira pediu uma cotação.", time: "Ontem", read: true, tone: "info" },
];

function MobileApp() {
  const [authed, setAuthed] = useState(false);
  const [lang, setLang] = useState<Lang>("pt");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyList, setCompanyList] = useState<Company[]>(companies);
  const [role, setRole] = useState<Role | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [clientesOpen, setClientesOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [addClienteOpen, setAddClienteOpen] = useState(false);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [clientList, setClientList] = useState<Cliente[]>(initialClients);
  const [initialInvoice, setInitialInvoice] = useState<Invoice | null>(null);
  const [preselectClient, setPreselectClient] = useState<Cliente | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  if (!authed) return <LoginScreen lang={lang} setLang={setLang} onLogin={() => setAuthed(true)} />;

  if (!plan)
    return (
      <PlanSelector
        onPick={(p) => {
          setPlan(p);
          if (p.id === "individual") setCompany(individualCompany);
        }}
      />
    );

  if (plan.id === "multi" && !company)
    return (
      <>
        <CompanySelector
          companies={companyList}
          onPick={setCompany}
          onBack={() => setPlan(null)}
          onAdd={() => setAddCompanyOpen(true)}
        />
        {addCompanyOpen && (
          <AddCompanyModal
            onClose={() => setAddCompanyOpen(false)}
            onSave={(c) => {
              setCompanyList((prev) => [c, ...prev]);
              setAddCompanyOpen(false);
              toast.success("Empresa adicionada ✓", { description: c.name });
            }}
          />
        )}
      </>
    );

  if (!role)
    return (
      <RoleSelector
        company={company!}
        onPick={setRole}
        onBack={() => (plan.id === "multi" ? setCompany(null) : setPlan(null))}
      />
    );

  const openInvoice = (inv: Invoice) => {
    setInitialInvoice(inv);
    setTab("invoices");
    setClientesOpen(false);
    setReportsOpen(false);
  };

  const createInvoiceForClient = (c: Cliente) => {
    if (!role.perms.includes("create")) {
      toast.error("Sem permissão para criar documentos.");
      return;
    }
    setPreselectClient(c);
    setClientesOpen(false);
    setTab("new");
    toast.success(`${dict[lang].invoiceFor} ${c.name}`);
  };

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Toaster position="top-center" toastOptions={{ className: "!rounded-2xl" }} />
      <div className="relative mx-auto flex min-h-screen max-w-[440px] flex-col bg-background shadow-glow md:my-6 md:min-h-[844px] md:rounded-[2.5rem] md:border md:border-border md:overflow-hidden">
        <StatusBar />
        <div className="relative flex-1 overflow-y-auto pb-28">
          {clientesOpen ? (
            <ClientesView
              clients={clientList}
              onBack={() => setClientesOpen(false)}
              onAdd={() => setAddClienteOpen(true)}
              onPick={createInvoiceForClient}
            />
          ) : reportsOpen ? (
            <ReportsView onBack={() => setReportsOpen(false)} company={company!} />
          ) : (
            <>
              {tab === "home" && (
                <HomeView
                  role={role}
                  company={company!}
                  avatar={avatar}
                  unread={unread}
                  onNotifs={() => setNotifOpen(true)}
                  onClientes={() => setClientesOpen(true)}
                  onReports={() => setReportsOpen(true)}
                  onTab={setTab}
                  onOpenInvoice={openInvoice}
                  onCotacao={() => {
                    if (!role.perms.includes("create")) {
                      toast.error("Sem permissão para criar documentos.");
                      return;
                    }
                    setTab("new");
                  }}
                  lang={lang}
                />
              )}
              {tab === "invoices" && (
                <InvoicesView
                  role={role}
                  initial={initialInvoice}
                  onConsumeInitial={() => setInitialInvoice(null)}
                />
              )}
              {tab === "new" && (
                role.perms.includes("create")
                  ? <NewInvoiceView
                      onDone={() => { setTab("invoices"); setPreselectClient(null); }}
                      clients={clientList}
                      preselect={preselectClient}
                      lang={lang}
                    />
                  : <NoAccess role={role} action="emitir documentos" />
              )}
              {tab === "chat" && <ChatView />}
              {tab === "profile" && (
                <ProfileView
                  role={role}
                  company={company!}
                  plan={plan}
                  avatar={avatar}
                  setAvatar={setAvatar}
                  lang={lang}
                  onSwitch={() => { setRole(null); }}
                  onSwitchCompany={() => { setRole(null); setCompany(plan.id === "multi" ? null : individualCompany); }}
                  onSwitchPlan={() => { setRole(null); setCompany(null); setPlan(null); }}
                  onLogout={() => { setRole(null); setCompany(null); setPlan(null); setAuthed(false); }}
                  onReports={() => setReportsOpen(true)}
                />
              )}
            </>
          )}
        </div>
        {!clientesOpen && !reportsOpen && <TabBar tab={tab} setTab={setTab} lang={lang} />}
      </div>

      {addClienteOpen && (
        <AddClienteModal
          onClose={() => setAddClienteOpen(false)}
          onSave={(c) => {
            setClientList((prev) => [c, ...prev]);
            setAddClienteOpen(false);
            toast.success("Cliente criado ✓", { description: `${c.name} foi adicionado.` });
          }}
        />
      )}

      {notifOpen && (
        <NotificationsModal
          notifs={notifs}
          lang={lang}
          onClose={() => setNotifOpen(false)}
          onMarkAll={() => {
            setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
            toast.success("Notificações marcadas como lidas");
          }}
          onTap={(id) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))}
        />
      )}

      <div className="hidden md:block">
        <div className="mx-auto mt-4 max-w-[440px] text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Voltar ao site</Link>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- LOGIN -------------------------- */

function LoginScreen({ lang, setLang, onLogin }: { lang: Lang; setLang: (l: Lang) => void; onLogin: () => void }) {
  const t = dict[lang];
  const [email, setEmail] = useState("helena@quota.mz");
  const [pwd, setPwd] = useState("••••••••");
  const [showPwd, setShowPwd] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col bg-background px-6 pb-10 pt-10 md:my-6 md:min-h-[844px] md:rounded-[2.5rem] md:border md:border-border md:shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <span className="text-sm font-bold text-primary-foreground">Q</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Quota</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-0.5 text-[11px]">
            <button
              onClick={() => setLang("pt")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition ${lang === "pt" ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Globe className="h-3 w-3" /> PT
            </button>
            <button
              onClick={() => setLang("en")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition ${lang === "en" ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Globe className="h-3 w-3" /> EN
            </button>
          </div>
        </div>

        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t.welcome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.loginSub}</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onLogin(); }}
          className="mt-6 space-y-3"
        >
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t.email}</label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t.password}</label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
              <button type="button" onClick={() => setShowPwd((s) => !s)} className="text-muted-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="button" className="text-[11px] text-primary">{t.forgot}</button>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow active:scale-[0.99]"
          >
            <LogIn className="h-4 w-4" /> {t.login}
          </button>

          <div className="flex items-center gap-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" />{t.or}<span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-medium"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-1 2.4-2.1 3.1v2.6h3.3c2-1.8 3-4.5 3-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.5-4.1H3v2.6C4.7 19.9 8.1 22 12 22z"/><path fill="#FBBC05" d="M6.5 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3C2.4 8.9 2 10.4 2 12s.4 3.1 1 4.5l3.5-2.6z"/><path fill="#EA4335" d="M12 6.4c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3.4 14.6 2.5 12 2.5 8.1 2.5 4.7 4.6 3 7.5l3.5 2.6C7.2 7.7 9.4 6.4 12 6.4z"/></svg>
            {t.googleLogin}
          </button>
        </form>

        <div className="mt-auto pt-8 text-center text-[10px] text-muted-foreground">
          Quota · Maputo, Moçambique
        </div>
      </div>
    </div>
  );
}

/* -------------------------- NOTIFICATIONS -------------------------- */

function NotificationsModal({
  notifs, lang, onClose, onMarkAll, onTap,
}: { notifs: Notif[]; lang: Lang; onClose: () => void; onMarkAll: () => void; onTap: (id: string) => void }) {
  const t = dict[lang];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="relative flex max-h-[80vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-glow md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">{t.notifications}</h2>
          <div className="flex items-center gap-2">
            <button onClick={onMarkAll} className="text-[11px] text-primary">{t.markAllRead}</button>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => onTap(n.id)}
              className={`mb-2 flex w-full items-start gap-3 rounded-2xl border border-border p-3 text-left transition active:scale-[0.99] ${n.read ? "bg-card" : "bg-primary/5 border-primary/30"}`}
            >
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                n.tone === "success" ? "bg-success/10 text-success" :
                n.tone === "warning" ? "bg-warning/15 text-warning-foreground" :
                "bg-primary/10 text-primary"
              }`}>
                {n.tone === "success" ? <CheckCircle2 className="h-4 w-4" /> :
                 n.tone === "warning" ? <Clock className="h-4 w-4" /> :
                 <Bell className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>
              </div>
              {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------- ADD COMPANY -------------------------- */

function AddCompanyModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Company) => void }) {
  const [form, setForm] = useState({ name: "", nuit: "", sector: "" });
  const submit = () => {
    if (!form.name.trim() || !form.nuit.trim()) {
      toast.error("Preencha o nome e o NUIT da empresa.");
      return;
    }
    onSave({
      id: Math.random().toString(36).slice(2, 9),
      name: form.name.trim(),
      nuit: form.nuit.trim(),
      sector: form.sector.trim() || "Geral",
      initial: form.name.trim().slice(0, 1).toUpperCase(),
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="relative flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-glow md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">Adicionar empresa</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <InputField label="Nome da empresa" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} icon={<Building2 className="h-4 w-4" />} />
          <InputField label="NUIT" value={form.nuit} onChange={(v) => setForm((s) => ({ ...s, nuit: v }))} icon={<FileText className="h-4 w-4" />} />
          <InputField label="Sector" value={form.sector} onChange={(v) => setForm((s) => ({ ...s, sector: v }))} icon={<Briefcase className="h-4 w-4" />} />
        </div>
        <div className="flex gap-2 border-t border-border bg-background p-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-medium">Cancelar</button>
          <button onClick={submit} className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
            Guardar empresa
          </button>
        </div>
      </div>
    </div>
  );
}



/* -------------------------- PLAN SELECTOR -------------------------- */

function PlanSelector({ onPick }: { onPick: (p: Plan) => void }) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col bg-background px-6 pb-10 pt-12 md:my-6 md:min-h-[844px] md:rounded-[2.5rem] md:border md:border-border md:shadow-glow">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <span className="text-sm font-bold text-primary-foreground">Q</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">Quota</span>
        </div>

        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o tipo de plano para começar a usar a Quota.
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:shadow-elegant active:scale-[0.99]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
                {p.id === "individual" ? <UserCircle2 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8 text-center text-[10px] text-muted-foreground">
          Quota · Maputo, Moçambique
        </div>
      </div>
    </div>
  );
}

/* -------------------------- COMPANY SELECTOR -------------------------- */

function CompanySelector({ companies: list, onPick, onBack, onAdd }: { companies: Company[]; onPick: (c: Company) => void; onBack: () => void; onAdd: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col bg-background px-6 pb-10 pt-12 md:my-6 md:min-h-[844px] md:rounded-[2.5rem] md:border md:border-border md:shadow-glow">
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Escolha a empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tem várias empresas associadas à sua conta. Seleccione com qual quer entrar.
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:shadow-elegant active:scale-[0.99]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">
                {c.initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">NUIT {c.nuit} · {c.sector}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </button>
          ))}
        </div>

        <button onClick={onAdd} className="mt-3 w-full rounded-2xl border border-dashed border-border bg-card/40 py-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
          + Adicionar nova empresa
        </button>


        <div className="mt-auto pt-8 text-center text-[10px] text-muted-foreground">
          Plano Multi-empresas · Quota
        </div>
      </div>
    </div>
  );
}

function RoleSelector({ company, onPick, onBack }: { company: Company; onPick: (r: Role) => void; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-[440px] flex-col bg-background px-6 pb-10 pt-12 md:my-6 md:min-h-[844px] md:rounded-[2.5rem] md:border md:border-border md:shadow-glow">
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <span className="text-sm font-bold text-primary-foreground">{company.initial}</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Empresa</p>
            <span className="text-sm font-semibold tracking-tight">{company.name}</span>
          </div>
        </div>


        <div className="mt-10">
          <h1 className="text-2xl font-semibold tracking-tight">Entrar como</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o perfil de acesso. Cada nível tem permissões diferentes.
          </p>
        </div>

        <div className="mt-6 space-y-2.5">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:shadow-elegant active:scale-[0.99]"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-glow">
                {r.initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{r.user}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${r.tone}`}>
                    {r.icon}
                    {r.name}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{r.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8 text-center text-[10px] text-muted-foreground">
          Quota · Maputo, Moçambique
        </div>
      </div>
    </div>
  );
}

function NoAccess({ role, action }: { role: Role; action: string }) {
  return (
    <div className="animate-fade-up px-5 pt-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted">
        <Lock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Sem permissão</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        O perfil <span className="font-medium text-foreground">{role.name}</span> não pode {action}.
        Peça ao administrador para actualizar o seu acesso.
      </p>
    </div>
  );
}


function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-foreground">
      <span>09:41</span>
      <div className="flex items-center gap-1.5">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

/* -------------------------- HOME -------------------------- */

function HomeView({
  role, company, avatar, unread, onClientes, onReports, onTab, onOpenInvoice, onCotacao, onNotifs, lang,
}: {
  role: Role;
  company: Company;
  avatar: string | null;
  unread: number;
  onClientes: () => void;
  onReports: () => void;
  onTab: (t: Tab) => void;
  onOpenInvoice: (inv: Invoice) => void;
  onCotacao: () => void;
  onNotifs: () => void;
  lang: Lang;
}) {
  const handleCreate = () => {
    if (!role.perms.includes("create")) {
      toast.error("Sem permissão para criar documentos.", { description: `Perfil ${role.name} não pode emitir.` });
      return;
    }
    onTab("new");
  };
  const handleEnviar = () => {
    if (!role.perms.includes("send")) {
      toast.error("Sem permissão para enviar.", { description: `Perfil ${role.name} é apenas de consulta.` });
      return;
    }
    onTab("chat");
  };

  const findInvoice = (note: string) => {
    const m = note.match(/(FT|FP|NC|ND|RC|GR)\s?\d+/i);
    if (!m) return undefined;
    const code = m[0].replace(/\s/g, "");
    return invoices.find((i) => i.n.replace(/\s|\//g, "").toUpperCase().includes(code.toUpperCase()));
  };

  return (
    <div className="animate-fade-up space-y-5 px-5 pt-3">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover shadow-glow" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">
              {role.initial}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Bom dia · {company.name}</p>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold">{role.user}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${role.tone}`}>
                {role.icon}
                {role.name}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onNotifs} className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card" aria-label={dict[lang].notifications}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </button>
      </header>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-glow/30 blur-2xl" />
        <p className="text-[11px] uppercase tracking-wider opacity-80">Receita do mês</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">3.41M <span className="text-base font-normal opacity-80">MZN</span></p>
        <div className="mt-3 flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
            <ArrowUpRight className="h-3 w-3" /> +8.2%
          </span>
          <span className="opacity-80">vs. mês passado</span>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          <ActionChip icon={<Plus className="h-4 w-4" />} label="Factura" onClick={handleCreate} />
          <ActionChip icon={<ImagePlus className="h-4 w-4" />} label="Cotação" onClick={onCotacao} />
          <ActionChip icon={<Send className="h-4 w-4" />} label="Enviar" onClick={handleEnviar} />
          <ActionChip icon={<Users className="h-4 w-4" />} label="Clientes" onClick={onClientes} />
        </div>
      </div>


      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Vendas hoje" value="184 200" delta="+12%" tone="success" />
        <MiniStat label="Pendentes" value="612 400" delta="14 fact." tone="warning" />
      </div>

      {/* Reports card */}
      <button
        onClick={onReports}
        className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.99] hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Relatórios mensais</p>
            <p className="text-[11px] text-muted-foreground">Receita, IVA e top clientes por mês</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* AI suggestion */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Assistente Quota</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              3 clientes estão com facturas em atraso. Quer enviar um lembrete por WhatsApp agora?
            </p>
            <button
              onClick={handleEnviar}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Enviar lembretes <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Actividade recente</h2>
          <button onClick={() => onTab("invoices")} className="text-xs text-primary">Ver tudo</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {recent.map((r, i) => {
            const inv = findInvoice(r.note) ?? invoices.find((iv) => iv.client === r.client);
            return (
              <button
                key={r.id}
                onClick={() => inv ? onOpenInvoice(inv) : onTab("invoices")}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-muted/40 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-full ${toneBg[r.tone]}`}>
                  {r.tone === "success" ? <CheckCircle2 className="h-4 w-4 text-success" /> :
                   r.tone === "warning" ? <Clock className="h-4 w-4 text-warning-foreground" /> :
                   <AlertCircle className="h-4 w-4 text-destructive" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.client}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.note}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{r.amount}</p>
                  <p className="text-[10px] text-muted-foreground">MZN</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ActionChip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 backdrop-blur transition active:scale-95 hover:bg-white/25">
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

function MiniStat({
  label, value, delta, tone,
}: { label: string; value: string; delta: string; tone: "success" | "warning" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value} <span className="text-[10px] font-normal text-muted-foreground">MZN</span></p>
      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        tone === "success" ? "bg-success/10 text-success" : "bg-warning/15 text-warning-foreground"
      }`}>
        {tone === "success" ? <ArrowUpRight className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {delta}
      </span>
    </div>
  );
}

const toneBg: Record<string, string> = {
  success: "bg-success/10",
  warning: "bg-warning/15",
  destructive: "bg-destructive/10",
};

const recent = [
  { id: 1, client: "João Comercial, Lda", note: "Pagamento M-Pesa · FT 00187", amount: "84 500", tone: "success" as const },
  { id: 2, client: "Construções Beira", note: "Factura enviada por WhatsApp", amount: "246 000", tone: "warning" as const },
  { id: 3, client: "Farmácia Central", note: "Em atraso há 5 dias", amount: "12 200", tone: "destructive" as const },
  { id: 4, client: "Maputo Logística", note: "Recibo gerado · e-Mola", amount: "39 750", tone: "success" as const },
];

/* -------------------------- INVOICES -------------------------- */

type Invoice = typeof invoices[number];

function InvoicesView({
  role, initial, onConsumeInitial,
}: { role: Role; initial: Invoice | null; onConsumeInitial: () => void }) {
  const [filter, setFilter] = useState<"todas" | "pagas" | "pendentes" | "atraso">("todas");
  const [selected, setSelected] = useState<Invoice | null>(initial);

  // open initial invoice once when arriving from Home
  if (initial && selected !== initial) {
    setSelected(initial);
    onConsumeInitial();
  }

  if (selected) return <InvoiceDetailView invoice={selected} role={role} onBack={() => setSelected(null)} />;


  const matchesStatus = (status: string) =>
    filter === "todas" ? true :
    filter === "pagas" ? status === "Pago" :
    filter === "pendentes" ? status === "Pendente" :
    status === "Em atraso";

  const [q, setQ] = useState("");
  const list = invoices.filter((i) =>
    matchesStatus(i.status) &&
    (q.trim() === "" ||
      i.client.toLowerCase().includes(q.toLowerCase()) ||
      i.n.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="animate-fade-up px-5 pt-3">
      <h1 className="text-2xl font-semibold tracking-tight">Documentos</h1>
      <p className="text-xs text-muted-foreground">{list.length} de {invoices.length} documentos</p>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar cliente ou nº documento"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {(["todas", "pagas", "pendentes", "atraso"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-gradient-primary text-primary-foreground shadow-elegant"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {list.map((i) => (
          <button
            key={i.n}
            onClick={() => setSelected(i)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary/10 text-xs font-semibold text-primary">
              {i.client.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{i.client}</p>
              <p className="text-[11px] text-muted-foreground">{i.n} · {i.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{i.amount}</p>
              <span className={`text-[10px] font-medium ${
                i.status === "Pago" ? "text-success" :
                i.status === "Pendente" ? "text-warning-foreground" : "text-destructive"
              }`}>{i.status}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {list.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Sem documentos para este filtro.</p>
        )}

      </div>
    </div>
  );
}

const invoices = [
  { n: "FT 2026/00187", client: "João Comercial, Lda", amount: "84 500", status: "Pago", date: "Hoje, 09:12", nuit: "400 123 456" },
  { n: "FT 2026/00186", client: "Construções Beira", amount: "246 000", status: "Pendente", date: "Hoje, 08:30", nuit: "400 998 221" },
  { n: "FP 2026/00042", client: "Maputo Logística", amount: "39 750", status: "Pago", date: "Ontem", nuit: "400 552 110" },
  { n: "NC 2026/00007", client: "Farmácia Central", amount: "12 200", status: "Em atraso", date: "20 Mai", nuit: "400 312 887" },
  { n: "RC 2026/00091", client: "Café Continental", amount: "5 800", status: "Pago", date: "19 Mai", nuit: "400 778 654" },
  { n: "FT 2026/00182", client: "Auto Peças Matola", amount: "98 400", status: "Pendente", date: "18 Mai", nuit: "400 221 339" },
];

/* -------------------------- INVOICE DETAIL -------------------------- */

function InvoiceDetailView({ invoice, role, onBack }: { invoice: Invoice; role: Role; onBack: () => void }) {
  const [pdfOpen, setPdfOpen] = useState(false);
  const docCode = invoice.n.slice(0, 2);
  const docLabel =
    docCode === "FT" ? "Factura" :
    docCode === "FP" ? "Factura Pro-forma" :
    docCode === "NC" ? "Nota de Crédito" :
    docCode === "ND" ? "Nota de Débito" :
    docCode === "RC" ? "Recibo" : "Documento";

  const canSend = role.perms.includes("send");

  const sendWhatsApp = () => {
    if (!canSend) {
      toast.error("Sem permissão para enviar.", { description: `Perfil ${role.name} é apenas de consulta.` });
      return;
    }
    const t = toast.loading("A preparar mensagem WhatsApp…");
    setTimeout(() => {
      toast.success("Enviado por WhatsApp ✓", {
        id: t,
        description: `${docLabel} ${invoice.n} → ${invoice.client}`,
      });
    }, 900);
  };

  return (
    <div className="animate-fade-up px-5 pt-3 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setPdfOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
            aria-label="Pré-visualizar PDF"
          >
            <FileText className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPdfOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
            aria-label="Baixar PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={sendWhatsApp}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
            aria-label="Partilhar"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <div className="relative bg-gradient-brand p-5 text-primary-foreground">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-glow/30 blur-2xl" />
          <p className="text-[10px] uppercase tracking-wider opacity-80">{docLabel}</p>
          <p className="mt-0.5 text-lg font-semibold tracking-tight">{invoice.n}</p>
          <p className="mt-0.5 text-[11px] opacity-80">Emitida {invoice.date}</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
            <CheckCircle2 className="h-3 w-3" /> {invoice.status}
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
            <p className="mt-0.5 text-sm font-medium">{invoice.client}</p>
            <p className="text-[11px] text-muted-foreground">NUIT {invoice.nuit}</p>
          </div>

          <div className="rounded-xl border border-border">
            {items.map((it, i) => (
              <div key={it.name} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <div>
                  <p className="text-sm">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">{it.qty} × {it.price} MZN</p>
                </div>
                <p className="text-sm font-semibold tabular-nums">{it.total} MZN</p>
              </div>
            ))}
          </div>

          <div className="text-sm">
            <Row label="Subtotal" value="208 475 MZN" />
            <Row label="IVA (17%)" value="35 440 MZN" />
            <div className="my-2 h-px bg-border" />
            <Row label="Total" value={`${invoice.amount} MZN`} strong />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-foreground text-background">
              <QrCode className="h-7 w-7" />
            </div>
            <div className="text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">Verificação pública</p>
              verify.quota.co.mz/{invoice.n.replace(/[ /]/g, "").toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setPdfOpen(true)}
          className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm font-medium"
        >
          Ver PDF
        </button>
        <button
          onClick={sendWhatsApp}
          disabled={!canSend}
          className="flex-[1.4] rounded-2xl bg-gradient-primary py-3 text-sm font-medium text-primary-foreground shadow-glow transition disabled:opacity-50"
        >
          Reenviar por WhatsApp
        </button>
      </div>

      {pdfOpen && (
        <PdfPreviewModal
          invoice={invoice}
          docLabel={docLabel}
          onClose={() => setPdfOpen(false)}
        />
      )}
    </div>
  );
}

/* -------------------------- PDF PREVIEW -------------------------- */

function PdfPreviewModal({
  invoice, docLabel, onClose,
}: { invoice: Invoice; docLabel: string; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) {
      toast.error("Permita pop-ups para baixar o PDF.");
      return;
    }
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${invoice.n} · Quota</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#0F172A;background:#fff;-webkit-font-smoothing:antialiased}
  .page{padding:48px 56px;max-width:794px;margin:0 auto}
  @media print{.page{padding:24px 28px}}
  @page{size:A4;margin:0}
</style></head><body><div class="page">${node.innerHTML}</div>
<script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),400)}</script>
</body></html>`);
    w.document.close();
    toast.success("Diálogo de impressão aberto — escolha 'Guardar como PDF'.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-glow md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-primary text-primary-foreground">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pré-visualização</p>
              <p className="text-sm font-semibold leading-none">{invoice.n}.pdf</p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/40 p-4">
          <div ref={printRef} className="mx-auto rounded-xl bg-white text-[#0F172A] shadow-elegant">
            <PdfDocument invoice={invoice} docLabel={docLabel} />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border bg-background p-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-medium"
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}

function PdfDocument({ invoice, docLabel }: { invoice: Invoice; docLabel: string }) {
  // Clean A4-style invoice layout (Quota identity)
  return (
    <div className="p-6 text-[11px] leading-relaxed" style={{ aspectRatio: "1 / 1.414" }}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-gradient-primary text-[11px] font-bold text-primary-foreground">
            Q
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">Quota Retail, Lda</p>
            <p className="text-[9px] text-slate-500">NUIT 400 998 123 · Av. 24 de Julho 1234, Maputo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-slate-500">{docLabel}</p>
          <p className="text-sm font-semibold text-slate-900">{invoice.n}</p>
          <p className="text-[9px] text-slate-500">{invoice.date}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-wider text-slate-400">Cliente</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-900">{invoice.client}</p>
          <p className="text-[10px] text-slate-500">NUIT {invoice.nuit}</p>
          <p className="text-[10px] text-slate-500">Maputo, Moçambique</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-wider text-slate-400">Estado</p>
          <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700">
            {invoice.status}
          </span>
          <p className="mt-1 text-[10px] text-slate-500">Forma: M-Pesa</p>
        </div>
      </div>

      {/* Items table */}
      <div className="mt-5 overflow-hidden rounded-md border border-slate-200">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-slate-50 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
          <span>Descrição</span>
          <span className="text-right">Qtd</span>
          <span className="text-right">Preço</span>
          <span className="text-right">Total</span>
        </div>
        {items.map((it, i) => (
          <div
            key={it.name}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2 text-[10px] text-slate-700 ${i > 0 ? "border-t border-slate-100" : ""}`}
          >
            <span className="text-slate-900">{it.name}</span>
            <span className="text-right tabular-nums">{it.qty}</span>
            <span className="text-right tabular-nums">{it.price}</span>
            <span className="text-right font-medium tabular-nums">{it.total}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-3 flex justify-end">
        <div className="w-1/2 space-y-1 text-[10px]">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="tabular-nums">208 475 MZN</span></div>
          <div className="flex justify-between text-slate-500"><span>IVA (17%)</span><span className="tabular-nums">35 440 MZN</span></div>
          <div className="my-1 h-px bg-slate-200" />
          <div className="flex justify-between text-[12px] font-semibold text-slate-900"><span>Total</span><span className="tabular-nums">{invoice.amount} MZN</span></div>
        </div>
      </div>

      {/* Footer / verification */}
      <div className="mt-6 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-sm bg-slate-900 text-white">
            <QrCode className="h-6 w-6" />
          </div>
          <div className="text-[9px] text-slate-500">
            <p className="font-medium text-slate-900">Verificação pública</p>
            verify.quota.co.mz/{invoice.n.replace(/[ /]/g, "").toLowerCase()}
          </div>
        </div>
        <p className="text-[9px] text-slate-400">Processado por Quota · AT-MZ</p>
      </div>

      <p className="mt-4 text-center text-[8px] text-slate-400">
        Este documento é válido sem assinatura nem carimbo, conforme Decreto nº 8/2017.
      </p>
    </div>
  );
}

/* -------------------------- NEW INVOICE -------------------------- */

type ItemRow = { id: string; name: string; qty: number; price: string; total: string; image?: string | null };

function NewInvoiceView({ onDone, clients, preselect, lang }: { onDone: () => void; clients: Cliente[]; preselect: Cliente | null; lang: Lang }) {
  const t = dict[lang];
  const [doc, setDoc] = useState<DocType | null>(preselect ? docTypes[0] : null);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(preselect ?? clients[0] ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rows, setRows] = useState<ItemRow[]>(() =>
    items.map((it, i) => ({ id: `r${i}`, name: it.name, qty: it.qty, price: it.price, total: it.total, image: null })),
  );
  const imageRef = useRef<HTMLInputElement>(null);
  const rowImgRef = useRef<HTMLInputElement>(null);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setProductImage(r.result as string);
    r.readAsDataURL(file);
  };

  const handleRowImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = pickingFor;
    e.target.value = "";
    if (!file || !id) return;
    const r = new FileReader();
    r.onload = () => {
      const url = r.result as string;
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, image: url } : row)));
    };
    r.readAsDataURL(file);
  };

  const addRow = () => {
    const id = `r${Date.now()}`;
    setRows((prev) => [...prev, { id, name: "Novo artigo", qty: 1, price: "0", total: "0", image: null }]);
    toast.success("Artigo adicionado");
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  if (!doc) {
    return (
      <div className="animate-fade-up px-5 pt-3">
        <h1 className="text-2xl font-semibold tracking-tight">Novo documento</h1>
        <p className="text-xs text-muted-foreground">Escolha o tipo de documento a emitir</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {docTypes.map((d) => (
            <button
              key={d.id}
              onClick={() => setDoc(d)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.98] hover:border-primary/40"
            >
              <div className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[10px] font-semibold ${d.tone}`}>
                {d.icon}
                {d.code}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{d.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{d.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-start gap-2 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5 mt-0.5" />
            <span>Conversão automática: transforma uma Pro-forma em Factura num toque.</span>
          </div>
        </div>
      </div>
    );
  }

  const isCot = doc.id === "cot";

  return (
    <div className="animate-fade-up px-5 pt-3">
      <div className="flex items-center justify-between">
        <button onClick={() => setDoc(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Tipo
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-medium"
          >
            <Eye className="h-3.5 w-3.5" /> Pré-visualizar
          </button>
          <button
            onClick={() => isCot ? imageRef.current?.click() : toast.info("OCR: tire foto da factura para preencher automaticamente.")}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card"
            aria-label="Câmara"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${doc.tone}`}>
          {doc.icon}
          {doc.code}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{doc.label}</h1>
      </div>
      <p className="text-xs text-muted-foreground">{doc.desc}</p>

      <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center gap-2 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI sugere produtos com base no cliente
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left transition active:scale-[0.99] hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
            <span className="text-[10px] font-medium text-primary">Alterar</span>
          </div>
          {selectedClient ? (
            <>
              <p className="mt-0.5 text-sm font-medium">{selectedClient.name}</p>
              <p className="text-[11px] text-muted-foreground">NUIT {selectedClient.nuit}</p>
            </>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">Seleccionar cliente</p>
          )}
        </button>

        {isCot && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.productImage} (capa)</p>
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            {productImage ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-border">
                <img src={productImage} alt="Produto" className="h-44 w-full object-cover" />
                <div className="flex gap-2 p-2">
                  <button onClick={() => imageRef.current?.click()} className="flex-1 rounded-lg border border-border bg-card py-2 text-xs font-medium">Trocar</button>
                  <button onClick={() => setProductImage(null)} className="flex-1 rounded-lg border border-destructive/20 bg-destructive/5 py-2 text-xs font-medium text-destructive">Remover</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => imageRef.current?.click()}
                className="mt-2 flex h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <ImagePlus className="h-7 w-7" />
                {t.uploadImage}
              </button>
            )}
          </div>
        )}

        {doc.id === "nc" || doc.id === "nd" ? (
          <Field label="Documento de origem" value="FT 2026/00186" hint="Emitida em 27 Mai 2026" />
        ) : null}
        <Field label="Data" value="27 Maio 2026" />
        {(doc.id === "pf" || doc.id === "cot") && <Field label="Validade" value="30 dias" />}
        {doc.id !== "gr" && doc.id !== "cot" && <Field label="Forma de pagamento" value="M-Pesa · 84 ••• 321" />}
        {doc.id === "gr" && <Field label="Veículo / Motorista" value="ABC 123 MC · Júlio M." />}


        <div className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-medium">Artigos</p>
            <button onClick={addRow} className="text-xs font-medium text-primary">+ Adicionar</button>
          </div>
          <input ref={rowImgRef} type="file" accept="image/*" className="hidden" onChange={handleRowImagePick} />
          {rows.map((it, i) => (
            <div key={it.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              {isCot && (
                <button
                  onClick={() => { setPickingFor(it.id); rowImgRef.current?.click(); }}
                  className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition hover:border-primary/40"
                  aria-label="Foto do artigo"
                >
                  {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4" />}
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{it.name}</p>
                <p className="text-[11px] text-muted-foreground">{it.qty} × {it.price} MZN</p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{it.total} MZN</p>
              <button onClick={() => removeRow(it.id)} className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remover">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <Row label="Subtotal" value="208 475 MZN" />
          <Row label="IVA (17%)" value="35 440 MZN" />
          <div className="my-2 h-px bg-border" />
          <Row label="Total" value="243 915 MZN" strong />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => toast.success("Rascunho guardado ✓", { description: `${doc.label} para ${selectedClient?.name ?? "cliente"}` })}
            className="flex-1 rounded-2xl border border-border bg-card py-3 text-sm font-medium"
          >
            Guardar rascunho
          </button>
          <button
            onClick={onDone}
            className="flex-[1.4] rounded-2xl bg-gradient-primary py-3 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Emitir e enviar
          </button>
        </div>
      </div>

      {pickerOpen && (
        <ClientPickerModal
          clients={clients}
          onClose={() => setPickerOpen(false)}
          onPick={(c) => {
            setSelectedClient(c);
            setPickerOpen(false);
          }}
        />
      )}

      {previewOpen && (
        <CotacaoPreviewModal
          doc={doc}
          client={selectedClient}
          rows={rows}
          cover={productImage}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
}

function CotacaoPreviewModal({
  doc, client, rows, cover, onClose,
}: { doc: DocType; client: Cliente | null; rows: ItemRow[]; cover: string | null; onClose: () => void }) {
  const isCot = doc.id === "cot";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/50 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-fade-up max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-3xl bg-background shadow-elegant md:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Pré-visualização</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="max-h-[calc(90vh-52px)] overflow-y-auto bg-muted/30 p-4">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elegant">
            <div className="relative bg-gradient-brand p-5 text-primary-foreground">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-glow/30 blur-2xl" />
              <p className="text-[10px] uppercase tracking-wider opacity-80">{doc.label}</p>
              <p className="mt-0.5 text-lg font-semibold tracking-tight">{doc.code} — pré-visualização</p>
              <p className="mt-0.5 text-[11px] opacity-80">27 Maio 2026 · válida 30 dias</p>
            </div>
            {isCot && cover && (
              <img src={cover} alt="Capa" className="h-40 w-full object-cover" />
            )}
            <div className="space-y-4 p-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cliente</p>
                <p className="mt-0.5 text-sm font-medium">{client?.name ?? "—"}</p>
                {client && <p className="text-[11px] text-muted-foreground">NUIT {client.nuit}</p>}
              </div>
              <div className="overflow-hidden rounded-xl border border-border">
                {rows.map((it, i) => (
                  <div key={it.id} className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                    {isCot && (
                      <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted/40 text-muted-foreground">
                        {it.image ? <img src={it.image} alt={it.name} className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="text-[11px] text-muted-foreground">{it.qty} × {it.price} MZN</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{it.total} MZN</p>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <Row label="Subtotal" value="208 475 MZN" />
                <Row label="IVA (17%)" value="35 440 MZN" />
                <div className="my-2 h-px bg-border" />
                <Row label="Total" value="243 915 MZN" strong />
              </div>
              <p className="rounded-lg bg-muted/40 p-2 text-center text-[10px] text-muted-foreground">
                Pré-visualização · ainda não emitido
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientPickerModal({
  clients,
  onClose,
  onPick,
}: {
  clients: Cliente[];
  onClose: () => void;
  onPick: (c: Cliente) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.nuit.includes(q),
  );
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <div className="animate-fade-up w-full max-w-md rounded-t-3xl bg-card p-4 shadow-elegant sm:rounded-3xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Seleccionar cliente</h2>
          <button onClick={onClose} className="text-xs text-muted-foreground">Fechar</button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar por nome ou NUIT"
          className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 max-h-[55vh] space-y-1.5 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onPick(c)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-left transition active:scale-[0.99] hover:border-primary/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="text-[11px] text-muted-foreground">NUIT {c.nuit} · {c.city}</p>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">Nenhum cliente encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const items = [
  { name: "Cimento 50kg", qty: 25, price: "850", total: "21 250" },
  { name: "Tijolo cerâmico", qty: 1500, price: "18", total: "27 000" },
  { name: "Mão de obra", qty: 1, price: "160 225", total: "160 225" },
];

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? "text-base font-semibold" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

/* -------------------------- CHAT -------------------------- */

function ChatView() {
  return (
    <div className="animate-fade-up px-5 pt-3">
      <h1 className="text-2xl font-semibold tracking-tight">Conversas</h1>
      <p className="text-xs text-muted-foreground">WhatsApp Business conectado</p>

      <div className="mt-4 space-y-2">
        {chats.map((c) => (
          <div key={c.name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <div className="relative">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-whatsapp/15 text-sm font-semibold text-whatsapp">
                {c.name.slice(0, 1)}
              </div>
              {c.online && <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.preview}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-muted-foreground">{c.time}</span>
              {c.unread > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-gradient-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {c.unread}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const chats = [
  { name: "João Comercial", preview: "✓ Pagamento confirmado · Recibo enviado", time: "09:12", unread: 0, online: true },
  { name: "Construções Beira", preview: "Bom dia, podem enviar a factura?", time: "08:45", unread: 2, online: true },
  { name: "Farmácia Central", preview: "Lembrete: factura vence amanhã", time: "Ontem", unread: 0, online: false },
  { name: "Auto Peças Matola", preview: "Obrigado pelo orçamento 🙏", time: "Ontem", unread: 1, online: false },
];

/* -------------------------- PROFILE -------------------------- */

function ProfileView({
  role, company, plan, avatar, setAvatar, lang, onSwitch, onSwitchCompany, onSwitchPlan, onLogout, onReports,
}: {
  role: Role;
  company: Company;
  plan: Plan;
  avatar: string | null;
  setAvatar: (a: string | null) => void;
  lang: Lang;
  onSwitch: () => void;
  onSwitchCompany: () => void;
  onSwitchPlan: () => void;
  onLogout: () => void;
  onReports: () => void;
}) {
  const t = dict[lang];
  const avatarRef = useRef<HTMLInputElement>(null);
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setAvatar(r.result as string); toast.success("Foto actualizada ✓"); };
    r.readAsDataURL(f);
  };
  const permLabels: Record<Perm, string> = {
    create: "Criar documentos",
    delete: "Anular / eliminar",
    viewFinance: "Ver finanças",
    manageTeam: "Gerir equipa",
    send: "Enviar por WhatsApp",
  };
  const allPerms: Perm[] = ["create", "send", "viewFinance", "delete", "manageTeam"];

  return (
    <div className="animate-fade-up px-5 pt-3">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-glow" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-brand text-xl font-bold text-primary-foreground shadow-glow">
              {role.initial}
            </div>
          )}
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <button
            onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-gradient-primary text-primary-foreground shadow-glow"
            aria-label={t.changePhoto}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold">{role.user}</h1>
          <p className="text-xs text-muted-foreground">{company.name} · {plan.name}</p>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${role.tone}`}>
            {role.icon} {role.name}
          </span>
          {avatar && (
            <button onClick={() => setAvatar(null)} className="ml-2 mt-1 inline-flex items-center gap-1 text-[10px] text-destructive">
              <Trash2 className="h-3 w-3" /> Remover foto
            </button>
          )}
        </div>
      </div>


      <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3 text-center">
        <Kpi label="Facturas" value="142" />
        <Kpi label="Clientes" value="38" />
        <Kpi label="Mês" value="3.4M" />
      </div>

      <button
        onClick={onReports}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.99] hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Relatórios mensais</p>
            <p className="text-[11px] text-muted-foreground">Receita, IVA, top clientes</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Permissões deste perfil</p>
          <span className="text-[10px] text-muted-foreground">{role.perms.length}/{allPerms.length}</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {allPerms.map((p) => {
            const has = role.perms.includes(p);
            return (
              <li key={p} className="flex items-center gap-2 text-xs">
                {has ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={has ? "text-foreground" : "text-muted-foreground line-through"}>
                  {permLabels[p]}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <nav className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        {menu.map((m, i) => (
          <button key={m.label} className={`flex w-full items-center justify-between px-4 py-3.5 text-left ${i > 0 ? "border-t border-border" : ""}`}>
            <span className="text-sm">{m.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </nav>

      <button
        onClick={onSwitch}
        className="mt-5 w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium"
      >
        Mudar de utilizador
      </button>
      {plan.id === "multi" && (
        <button
          onClick={onSwitchCompany}
          className="mt-2 w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium"
        >
          Mudar de empresa
        </button>
      )}
      <button
        onClick={onSwitchPlan}
        className="mt-2 w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium"
      >
        Mudar de plano
      </button>
      <button
        onClick={onLogout}
        className="mt-2 w-full rounded-2xl border border-destructive/20 bg-destructive/5 py-3 text-sm font-medium text-destructive"
      >
        Terminar sessão
      </button>


      <p className="mt-4 text-center text-[10px] text-muted-foreground">Quota v1.0.0 · Maputo, Moçambique</p>
    </div>
  );
}

/* -------------------------- REPORTS -------------------------- */

const monthlyReports = [
  { month: "Mai 2026", revenue: "3 410 000", iva: "495 200", invoices: 142, growth: "+8.2%", positive: true },
  { month: "Abr 2026", revenue: "3 152 000", iva: "457 800", invoices: 128, growth: "+4.6%", positive: true },
  { month: "Mar 2026", revenue: "3 014 500", iva: "437 600", invoices: 121, growth: "-2.1%", positive: false },
  { month: "Fev 2026", revenue: "3 080 200", iva: "447 100", invoices: 119, growth: "+1.9%", positive: true },
  { month: "Jan 2026", revenue: "3 022 100", iva: "438 700", invoices: 117, growth: "+3.3%", positive: true },
  { month: "Dez 2025", revenue: "2 926 400", iva: "424 800", invoices: 110, growth: "+12.4%", positive: true },
];

function ReportsView({ company, onBack }: { company: Company; onBack: () => void }) {
  const bars = [62, 71, 58, 64, 80, 90];
  return (
    <div className="animate-fade-up px-5 pt-3 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">Relatórios</h1>
        <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card" aria-label="Exportar">
          <Download className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{company.name}</p>

      {/* Hero chart */}
      <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
        <p className="text-[10px] uppercase tracking-wider opacity-80">Receita acumulada · 6 meses</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">18.6M <span className="text-sm font-normal opacity-80">MZN</span></p>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
            <TrendingUp className="h-3 w-3" /> +14.8%
          </span>
          <span className="opacity-80">vs. semestre anterior</span>
        </div>
        <div className="mt-5 flex h-24 items-end justify-between gap-2">
          {bars.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-full rounded-md bg-white/80" style={{ height: `${h}%` }} />
              <span className="text-[9px] opacity-80">{["Dez","Jan","Fev","Mar","Abr","Mai"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ReportKpi label="IVA do mês" value="495 200" hint="17%" />
        <ReportKpi label="Docs emitidos" value="142" hint="+11%" />
        <ReportKpi label="Em atraso" value="82 100" hint="3 clientes" tone="destructive" />
      </div>

      {/* Top clientes */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-sm font-semibold">Top clientes · Maio</p>
          <span className="text-[10px] text-muted-foreground">por receita</span>
        </div>
        {[
          { name: "Construções Beira", val: "812 400", pct: 92 },
          { name: "João Comercial, Lda", val: "654 200", pct: 74 },
          { name: "Maputo Logística", val: "498 100", pct: 56 },
          { name: "Auto Peças Matola", val: "311 800", pct: 35 },
        ].map((c, i) => (
          <div key={c.name} className={`px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="tabular-nums text-muted-foreground">{c.val} MZN</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-gradient-primary" style={{ width: `${c.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Mês a mês */}
      <h2 className="mt-5 mb-2 text-sm font-semibold">Mês a mês</h2>
      <div className="space-y-2">
        {monthlyReports.map((m) => (
          <div key={m.month} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium">{m.month}</p>
              <p className="text-[11px] text-muted-foreground">{m.invoices} documentos · IVA {m.iva} MZN</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold tabular-nums">{m.revenue}</p>
              <span className={`text-[10px] font-medium ${m.positive ? "text-success" : "text-destructive"}`}>
                {m.growth}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportKpi({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "destructive" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
      <span className={`mt-1 inline-block text-[10px] font-medium ${tone === "destructive" ? "text-destructive" : "text-success"}`}>
        {hint}
      </span>
    </div>
  );
}


function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

const menu = [
  { label: "Dados da empresa" },
  { label: "Métodos de pagamento" },
  { label: "Equipa e permissões" },
  { label: "Sincronização offline" },
  { label: "Idioma · Português" },
  { label: "Ajuda e suporte" },
];

/* -------------------------- TAB BAR -------------------------- */

function TabBar({ tab, setTab, lang }: { tab: Tab; setTab: (t: Tab) => void; lang: Lang }) {
  const t = dict[lang];
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: t.home, icon: <Home className="h-5 w-5" /> },
    { id: "invoices", label: t.docs, icon: <FileText className="h-5 w-5" /> },
    { id: "new", label: "", icon: <Plus className="h-6 w-6" /> },
    { id: "chat", label: t.chat, icon: <MessageCircle className="h-5 w-5" /> },
    { id: "profile", label: t.profile, icon: <User className="h-5 w-5" /> },
  ];


  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[440px] border-t border-border bg-background/95 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2 backdrop-blur-xl md:absolute md:bottom-0 md:mx-0 md:w-auto md:left-0 md:right-0 md:pb-4">
      <div className="mx-auto flex max-w-[440px] items-end justify-between">
        {items.map((it) => {
          const isCenter = it.id === "new";
          const active = tab === it.id;
          if (isCenter) {
            return (
              <button
                key={it.id}
                onClick={() => setTab(it.id)}
                className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition active:scale-95"
                aria-label="Nova factura"
              >
                {it.icon}
              </button>
            );
          }
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[10px] font-medium transition ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* -------------------------- CLIENTES -------------------------- */

function ClientesView({
  clients,
  onBack,
  onAdd,
  onPick,
}: {
  clients: Cliente[];
  onBack: () => void;
  onAdd: () => void;
  onPick: (c: Cliente) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nuit.includes(search)
  );

  return (
    <div className="animate-fade-up px-5 pt-3">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight">Clientes</h1>
        <button
          onClick={onAdd}
          className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">{clients.length} registados · toque para emitir factura</p>

      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar por nome ou NUIT"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99] hover:border-primary/40"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-primary/10 text-xs font-semibold text-primary">
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-[11px] text-muted-foreground">NUIT {c.nuit}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <FilePlus className="h-3 w-3" /> Factura
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
}


/* -------------------------- ADD CLIENTE MODAL -------------------------- */

function AddClienteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: Cliente) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    nuit: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const handleSave = () => {
    if (!form.name.trim() || !form.nuit.trim()) {
      toast.error("Preencha o nome e o NUIT do cliente.");
      return;
    }
    onSave({
      id: Math.random().toString(36).slice(2, 9),
      name: form.name.trim(),
      nuit: form.nuit.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: form.city.trim() || "Maputo",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-background shadow-glow md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">Novo cliente</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <InputField label="Nome completo / Empresa" value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} icon={<User className="h-4 w-4" />} />
          <InputField label="NUIT" value={form.nuit} onChange={(v) => setForm((s) => ({ ...s, nuit: v }))} icon={<FileText className="h-4 w-4" />} />
          <InputField label="Telefone" value={form.phone} onChange={(v) => setForm((s) => ({ ...s, phone: v }))} icon={<Phone className="h-4 w-4" />} />
          <InputField label="Email" value={form.email} onChange={(v) => setForm((s) => ({ ...s, email: v }))} icon={<Mail className="h-4 w-4" />} />
          <InputField label="Endereço" value={form.address} onChange={(v) => setForm((s) => ({ ...s, address: v }))} icon={<MapPin className="h-4 w-4" />} />
          <InputField label="Cidade" value={form.city} onChange={(v) => setForm((s) => ({ ...s, city: v }))} icon={<MapPin className="h-4 w-4" />} />
        </div>

        <div className="flex gap-2 border-t border-border bg-background p-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-medium">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Guardar cliente
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
        <span className="text-muted-foreground">{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
