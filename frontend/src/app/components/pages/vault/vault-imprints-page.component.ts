import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { VaultCompanyStoreService } from '../../../services/vault-company-store.service';
import { Imprint } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

@Component({
  selector: 'app-vault-imprints-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-imprints-page.component.css'],
  templateUrl: './vault-imprints-page.component.html',
  })
export class VaultImprintsPageComponent {
  readonly vs = inject(AuthorVaultService);
  private readonly vaultStore = inject(VaultCompanyStoreService);
  private router = inject(Router);
  company = this.vs.company;
  allImprints = computed(() => this.company().imprints);
  selected = signal<Imprint | null>(null);
  activeTab = signal('identity');
  isbnFilter = '';
  editMode = signal(false);

  deleteAllImprints(): void {
    if (!confirm('Delete all imprints and their pen names, series, and books? This cannot be undone.')) return;
    this.vs.clearImprints();
    this.selected.set(null);
    this.editMode.set(false);
  }

  onImprintAvatarUpload(event: Event, imprintId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.vs.setImprintAvatar(imprintId, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  tabs = [
    { id: 'identity', label: 'Identity' },
    { id: 'pennames', label: 'Pen Names' },
    { id: 'isbns',    label: 'ISBNs' },
  ];

  get totalPenNames() { return this.allImprints().reduce((a, i) => a + i.penNames.length, 0); }
  get totalBooks() { return this.allImprints().reduce((a, i) => a + i.penNames.reduce((b, p) => b + p.series.reduce((c, s) => c + s.books.length, 0), 0), 0); }
  get totalISBNsRemaining() { return this.allImprints().reduce((a, i) => a + i.legalIsbn.isbnsRemaining, 0); }

  countBooks(imp: Imprint): number {
    return imp.penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0);
  }
  countPenNameBooks(pn: any): number {
    return pn.series.reduce((a: number, s: any) => a + s.books.length, 0);
  }
  initials(name: string): string {
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }
  selectImprint(imp: Imprint) { this.selected.set(imp); this.activeTab.set('identity'); }
  goTo(r: string) { this.router.navigate([r]); }

  getImprintIsbns(imp: Imprint) {
    return this.vaultStore.isbnRecords().filter(r =>
      r.imprint === imp.identity.name &&
      (!this.isbnFilter || r.status === this.isbnFilter)
    );
  }
}
