import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LinksData } from '../interfaces/link.interfaces';

@Injectable({ providedIn: 'root' })
export class LinksService {
  private readonly linksUrl = '/data/links.json';

  constructor(private http: HttpClient) {}

  getLinks(): Observable<LinksData> {
    return this.http.get<LinksData>(this.linksUrl, { headers: { 'Cache-Control': 'no-store' } });
  }
}
