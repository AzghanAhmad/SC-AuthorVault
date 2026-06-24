import { Injectable, inject } from '@angular/core';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface ImportantDate {
  id: string;
  title: string;
  category: 'Tax' | 'Domain' | 'ISBN' | 'Software' | 'Trademark' | 'Contract' | 'Filing';
  dueDate: string;
  notes: string;
  recurring: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImportantDatesService {
  private readonly api = inject(ApiService);

  load(): Observable<ImportantDate[]> {
    return this.api.get<ImportantDate[]>('/important-dates');
  }

  save(dates: ImportantDate[]): Observable<void> {
    return this.api.put('/important-dates', dates).pipe(map(() => void 0));
  }

  clearAll(): Observable<void> {
    return this.save([]);
  }

  loadOrSeed(defaults: ImportantDate[]): Observable<ImportantDate[]> {
    return this.load().pipe(
      map(dates => (Array.isArray(dates) && dates.length > 0 ? dates : defaults)),
      tap(dates => {
        if (!dates.length) return;
        this.save(dates).subscribe();
      }),
      catchError(() => {
        this.save(defaults).subscribe();
        return of(defaults);
      })
    );
  }
}
