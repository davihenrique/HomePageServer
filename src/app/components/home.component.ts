import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinksService } from '../services/links.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Link, LinksData, Service } from '../interfaces/link.interfaces';

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
  public groups$: Observable<{ servidor: Service[]; externos: Service[] }>;
  private baseUrl: string = window.location.hostname;

  constructor(public linksService: LinksService) {
    this.groups$ = this.linksService.getLinks().pipe(
      map((data: LinksData) => ({
        servidor: (data.servidor || []).map((link) => this.toService(link)),
        externos: (data.externos || []).map((link) => this.toService(link)),
      }))
    );
  }

  // Um link externo traz a URL pronta; um servico do servidor so traz a porta,
  // e o host vem de onde a propria homepage esta aberta.
  private toService(link: Link): Service {
    return {
      id: link.id,
      title: link.title,
      link: link.url
        ? link.url
        : `${link.https ? 'https://' : 'http://'}${this.baseUrl}:${link.port}`,
      description: link.description || '',
      icon: this.iconUrl(link.icon),
    };
  }

  // Aceita tanto o nome de um arquivo em /data/icons quanto uma URL completa,
  // para nao travar o links.json nos icones que vieram no repositorio.
  private iconUrl(icon?: string): string {
    if (!icon) return '';
    return icon.startsWith('http') ? icon : `${ICON_BASE}/${icon}.svg`;
  }

  // Um nome errado no links.json nao deve deixar um icone quebrado no card.
  public hideBrokenIcon(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}
