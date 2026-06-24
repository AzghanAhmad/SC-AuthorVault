import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthorVaultService } from './author-vault.service';
import { VaultCompanyStoreService } from './vault-company-store.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceLoaderService {
  private readonly vault = inject(AuthorVaultService);
  private readonly vaultExtras = inject(VaultCompanyStoreService);
  private readonly settings = inject(SettingsService);

  loadAll(): Observable<void> {
    return forkJoin([
      this.vault.loadFromApi(),
      this.vaultExtras.loadFromApi(),
      this.settings.loadFromApi()
    ]).pipe(
      map(() => void 0),
      catchError(err => {
        console.error('Workspace load failed', err);
        return of(void 0);
      })
    );
  }
}
