import { Injectable, inject, signal } from '@angular/core';
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
  readonly dates = signal<ImportantDate[]>([]);

  load(): Observable<ImportantDate[]> {
    return this.api.get<ImportantDate[]>('/important-dates').pipe(
      map(list => (Array.isArray(list) ? list : [])),
      tap(list => this.dates.set(list)),
      catchError(() => {
        this.dates.set([]);
        return of([]);
      })
    );
  }

  save(dates: ImportantDate[]): Observable<void> {
    return this.api.put('/important-dates', dates).pipe(
      tap(() => this.dates.set(dates)),
      map(() => void 0)
    );
  }

  clearAll(): Observable<void> {
    return this.save([]);
  }
}
