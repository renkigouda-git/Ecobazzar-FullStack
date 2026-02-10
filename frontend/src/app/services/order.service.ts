import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private base = `${environment.apiUrl}/api/orders`;

  constructor(private http: HttpClient) {}

  checkout(): Observable<any> {
    return this.http.post(`${this.base}/checkout`, {});
  }
}
