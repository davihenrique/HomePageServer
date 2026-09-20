import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinksService } from '../services/links.service';
import { StatusService } from '../services/status.service';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Link, LinksData, MonitorStatus, Service } from '../interfaces/link.interfaces';

// Os icones sao servidos junto com os dados, e nao por um CDN: a homepage
// precisa abrir com o servidor sem acesso a internet.
const ICON_BASE = '/data/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  public groups$: Observable<{
    servidor: Service[];
    administracao: Service[];
    externos: Service[];
  }>;
  private baseUrl: string = window.location.hostname;

  constructor(
    public linksService: LinksService,
    private statusService: StatusService
  ) {
    this.groups$ = combineLatest([
      this.linksService.getLinks(),
      this.statusService.watch(),
    ]).pipe(
      map(([data, status]: [LinksData, Record<string, MonitorStatus>]) => ({
        servidor: (data.servidor || []).map((link) => this.toService(link, status)),
        administracao: (data.administracao || []).map((link) => this.toService(link, status)),
        externos: (data.externos || []).map((link) => this.toService(link, status)),
      }))
    );
  }

  // Um link externo traz a URL pronta; um servico do servidor so traz a porta,
  // e o host vem de onde a propria homepage esta aberta.
  private toService(link: Link, status: Record<string, MonitorStatus>): Service {
    return {
      id: link.id,
      title: link.title,
      link: link.url
        ? link.url
        : `${link.https ? 'https://' : 'http://'}${this.baseUrl}:${link.port}`,
      description: link.description || '',
      icon: this.iconUrl(link.icon),
      monitor: link.monitor ? status[link.monitor] || null : null,
    };
  }

  // Aceita tanto o nome de um arquivo em /data/icons quanto uma URL completa,
  // para nao travar o links.json nos icones que vieram no repositorio.
  private iconUrl(icon?: string): string {
    if (!icon) return '';
    return icon.startsWith('http') ? icon : `${ICON_BASE}/${icon}.svg`;
  }

  public statusClass(monitor: MonitorStatus): string {
    if (monitor.status === 1) return 'no-ar';
    if (monitor.status === 0) return 'caiu';
    if (monitor.status === 2) return 'pendente';
    return 'manutencao';
  }

  public statusLabel(monitor: MonitorStatus): string {
    const estado =
      monitor.status === 1
        ? 'No ar'
        : monitor.status === 0
          ? 'Fora do ar'
          : monitor.status === 2
            ? 'Pendente'
            : 'Em manutencao';
    if (monitor.uptime24 === null) return estado;
    return `${estado} — ${(monitor.uptime24 * 100).toFixed(2)}% nas ultimas 24h`;
  }

  public uptimeCurto(monitor: MonitorStatus): string {
    if (monitor.uptime24 === null) return '';
    return `${(monitor.uptime24 * 100).toFixed(1)}%`;
  }

  // Um nome errado no links.json nao deve deixar um icone quebrado no card.
  public hideBrokenIcon(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
