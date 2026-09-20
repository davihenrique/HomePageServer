import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MonitorStatus } from '../interfaces/link.interfaces';

// O nginx encaminha /api/uptime/ para a status page do Uptime Kuma; sem esse
// proxy a chamada seria cross-origin e o navegador a bloquearia.
const HEARTBEAT_URL = '/api/uptime/heartbeat/home';
const REFRESH_MS = 60000;

@Injectable({ providedIn: 'root' })
export class StatusService {
  constructor(private http: HttpClient) {}

  watch(): Observable<Record<string, MonitorStatus>> {
    return timer(0, REFRESH_MS).pipe(
      switchMap(() =>
        this.http
          .get<any>(HEARTBEAT_URL, { headers: { 'Cache-Control': 'no-store' } })
          // O Kuma fora do ar nao pode derrubar a pagina: os cards apenas
          // ficam sem indicador.
          .pipe(catchError(() => of(null)))
      ),
      map((body) => this.parse(body))
    );
  }

  private parse(body: any): Record<string, MonitorStatus> {
    const porMonitor: Record<string, MonitorStatus> = {};
    if (!body) return porMonitor;

    const batimentos = body.heartbeatList || {};
    const uptimes = body.uptimeList || {};

    for (const id of Object.keys(batimentos)) {
      const lista = batimentos[id] || [];
      const ultimo = lista[lista.length - 1];
      if (!ultimo) continue;
      const uptime = uptimes[`${id}_24`];
      porMonitor[id] = {
        status: ultimo.status,
        uptime24: typeof uptime === 'number' ? uptime : null,
      };
    }
    return porMonitor;
  }
}
