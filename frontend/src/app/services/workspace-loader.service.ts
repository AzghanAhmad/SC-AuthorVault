import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthorVaultService } from './author-vault.service';
import { VaultCompanyStoreService } from './vault-company-store.service';
import { SettingsService } from './settings.service';
import { ImportantDatesService } from './important-dates.service';
import { ThemeService } from './theme.service';
import { AppSettings } from './settings.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceLoaderService {
  private readonly vault = inject(AuthorVaultService);
  private readonly vaultExtras = inject(VaultCompanyStoreService);
  private readonly settings = inject(SettingsService);
  private readonly importantDates = inject(ImportantDatesService);
  private readonly theme = inject(ThemeService);

  loadAll(): Observable<void> {
    return forkJoin([
      this.vault.loadFromApi(),
      this.vaultExtras.loadFromApi(),
      this.settings.loadFromApi().pipe(catchError(() => of(this.settings.getSnapshot()))),
      this.importantDates.load()
    ]).pipe(
      tap(([, , settings]) => {
        const s = settings as AppSettings;
        if (s?.theme) {
          this.theme.applyThemeFromSettings(s.theme, s.compactSidebar ?? false);
        }
      }),
      map(() => void 0),
      catchError(err => {
        console.error('Workspace load failed', err);
        return of(void 0);
      })
    );
  }
}
