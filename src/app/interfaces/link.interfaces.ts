export interface Link {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  // Podmans e administracao: a URL e montada a partir da porta.
  port?: string;
  https?: boolean;
  // VMs e links externos: a URL vem pronta e ignora porta e https.
  url?: string;
  // Id do monitor correspondente no Uptime Kuma, quando existir.
  monitor?: string;
}

export interface LinksData {
  podmans: Link[];
  vms: Link[];
  administracao: Link[];
  externos: Link[];
}

// Codigos do Uptime Kuma: 0 caiu, 1 no ar, 2 pendente, 3 em manutencao.
export interface MonitorStatus {
  status: number;
  uptime24: number | null;
}

export interface Service {
  id: string;
  title: string;
  link: string;
  description: string;
  icon: string;
  monitor: MonitorStatus | null;
}
