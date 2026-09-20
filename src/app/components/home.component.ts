import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinksService } from '../services/links.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Link, Service } from '../interfaces/link.interfaces';

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
  public services$: Observable<Service[]>;
  private baseUrl: string = window.location.hostname;

  constructor(public linksService: LinksService) {
    this.services$ = this.linksService.getLinks().pipe(
      map((links: Link[]) =>
        links.map((link) => ({
          id: link.id,
          title: link.title,
          link: `${link.https ? 'https://' : 'http://'}${this.baseUrl}:${link.port}`,
          description: link.description || '',
          icon: this.iconUrl(link.icon),
        }))
      )
    );
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
