import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface PinStatus {
  hasPin: boolean;
  isUnlocked: boolean;
}

@Injectable({ providedIn: 'root' })
export class CompanyPinService {
  private readonly api = inject(ApiService);

  getStatus(): Observable<PinStatus> {
    return this.api.get<PinStatus>('/company/pin/status');
  }

  setup(pin: string): Observable<{ success: boolean }> {
    return this.api.post('/company/pin/setup', { pin });
  }

  verify(pin: string): Observable<{ success: boolean; unlocked: boolean }> {
    return this.api.post('/company/pin/verify', { pin });
  }

  touch(): Observable<{ success: boolean }> {
    return this.api.post<{ success: boolean }>('/company/pin/touch').pipe(
      catchError(() => of({ success: false }))
    );
  }

  lock(): Observable<{ success: boolean }> {
    return this.api.post('/company/pin/lock');
  }

  change(pin: string): Observable<{ success: boolean }> {
    return this.api.post('/company/pin/change', { pin });
  }
}
