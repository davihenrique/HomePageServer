export interface Link {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  // Servicos do proprio servidor: a URL e montada a partir da porta.
  port?: string;
  https?: boolean;
  // Links externos: a URL vem pronta e ignora porta e https.
  url?: string;
}

export interface LinksData {
  servidor: Link[];
  externos: Link[];
}

export interface Service {
  id: string;
  title: string;
  link: string;
  description: string;
  icon: string;
}
