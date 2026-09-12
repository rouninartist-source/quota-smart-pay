import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  ReceiptText,
  Users,
  Package,
  Palette,
  Wrench,
  Settings,
  MessageCircle,
  MessagesSquare,
  Bot,
  Bell,
  UserRound,
  Plus,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Match child routes as active too. */
  exact?: boolean;
  /** Optional search params (e.g. document type shortcuts). */
  search?: Record<string, string>;
  /** Render as a primary action button in the sidebar. */
  primary?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Geral",
    items: [{ label: "Visão geral", to: "/dashboard", icon: LayoutDashboard, exact: true }],
  },

  {
    label: "Vendas",
    items: [
      { label: "Novo documento", to: "/dashboard/documentos/novo", icon: Plus },
      { label: "Documentos", to: "/dashboard/documentos", icon: FolderOpen, exact: true },
      { label: "Cotações", to: "/dashboard/documentos", icon: FileSpreadsheet, search: { tipo: "cotacao" } },
      { label: "Facturas", to: "/dashboard/documentos", icon: FileText, search: { tipo: "factura" } },
      { label: "Pró-formas", to: "/dashboard/documentos", icon: FileText, search: { tipo: "proforma" } },
      { label: "VD / Facturas-recibo", to: "/dashboard/documentos", icon: ReceiptText, search: { tipo: "vd" } },
      { label: "Recibos", to: "/dashboard/documentos", icon: ReceiptText, search: { tipo: "recibo" } },
      { label: "Clientes", to: "/dashboard/clientes", icon: Users },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Produtos", to: "/dashboard/produtos", icon: Package },
      { label: "Serviços", to: "/dashboard/servicos", icon: Wrench },
    ],
  },
  {
    label: "Espaço de trabalho",
    items: [
      { label: "Design", to: "/dashboard/design", icon: Palette },
      { label: "Quota AI", to: "/dashboard/assistente", icon: Bot },
      { label: "WhatsApp", to: "/dashboard/whatsapp", icon: MessageCircle },
      { label: "Notificações", to: "/dashboard/notificacoes", icon: Bell },
      { label: "Perfil", to: "/dashboard/perfil", icon: UserRound },
      { label: "Definições", to: "/dashboard/definicoes", icon: Settings },
    ],
  },
];

export type QuickCreate = {
  label: string;
  to: string;
  search?: Record<string, string>;
  icon: LucideIcon;
  shortcut?: string;
  description?: string;
};

export const quickCreate: QuickCreate[] = [
  { label: "Nova factura", to: "/dashboard/documentos/novo", search: { tipo: "ft" }, icon: FileText, shortcut: "F", description: "Emitir documento fiscal" },
  { label: "Nova cotação", to: "/dashboard/documentos/novo", search: { tipo: "cot" }, icon: FileSpreadsheet, shortcut: "C", description: "Proposta para cliente" },
  { label: "VD / Factura-recibo", to: "/dashboard/documentos/novo", search: { tipo: "fr" }, icon: ReceiptText, shortcut: "R", description: "Factura paga no acto" },
  { label: "Novo cliente", to: "/dashboard/clientes", icon: Users, shortcut: "N", description: "Adicionar ao CRM" },
];

export const createIcon = Plus;

export const mobileTabs: NavItem[] = [
  { label: "Início", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Documentos", to: "/dashboard/documentos", icon: FolderOpen },
  { label: "Clientes", to: "/dashboard/clientes", icon: Users },
  { label: "Mais", to: "/dashboard/definicoes", icon: Settings },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

/** Sidebar tree: top-level entries, some with expandable children. */
export type NavNode = NavItem & { children?: NavItem[] };

export const menuTree: NavNode[] = [
  { label: "Visão geral", to: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Novo documento", to: "/dashboard/documentos/novo", icon: Plus, primary: true },
  { label: "Documentos", to: "/dashboard/documentos", icon: FolderOpen },
  { label: "Clientes", to: "/dashboard/clientes", icon: Users },
  {
    label: "Catálogo",
    to: "/dashboard/produtos",
    icon: Package,
    children: [
      { label: "Produtos", to: "/dashboard/produtos", icon: Package },
      { label: "Serviços", to: "/dashboard/servicos", icon: Wrench },
    ],
  },
  { label: "Design", to: "/dashboard/design", icon: Palette },
  { label: "Quota AI", to: "/dashboard/assistente", icon: Bot },
  { label: "Chat da equipa", to: "/dashboard/equipa", icon: MessagesSquare },
  { label: "WhatsApp", to: "/dashboard/whatsapp", icon: MessageCircle },
];

export const generalItems: NavItem[] = [
  { label: "Perfil", to: "/dashboard/perfil", icon: UserRound },
  { label: "Definições", to: "/dashboard/definicoes", icon: Settings },
];
