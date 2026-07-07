import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { Series } from '../../../models/author-vault.model';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

@Component({
  selector: 'app-vault-series-page',
  standalone: true,
  imports: [CommonModule, PageActionBarComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-series-page.component.css'],
  templateUrl: './vault-series-page.component.html',
  })
export class VaultSeriesPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);
  editMode = signal(false);

  goTo(r: string) { this.router.navigate([r]); }
  allSeries = computed(() => {
    const s: Series[] = [];
    for (const i of this.vs.company().imprints) for (const p of i.penNames) s.push(...p.series);
    return s;
  });
  selected = signal<Series | null>(null);
  tab = signal('identity');
  tabs = [
    { id: 'identity', label: 'Series Name' },
    { id: 'books',    label: 'Books' },
    { id: 'world',    label: 'World' },
    { id: 'branding', label: 'Branding' },
    { id: 'boxsets',  label: 'Box Sets' },
  ];
  get totalBooks() { return this.allSeries().reduce((a, s) => a + s.books.length, 0); }
  get activeSeries() { return this.allSeries().filter(s => s.identity.status === 'Active').length; }
  get totalBoxSets() { return this.allSeries().reduce((a, s) => a + s.boxSets.length, 0); }
  countFormats(bk: any): number { return bk.languageBranches.reduce((a: number, lb: any) => a + lb.formats.length, 0); }
  selectItem(sr: Series) { this.selected.set(sr); this.tab.set('identity'); }

  deleteAllSeries(): void {
    if (!confirm('Delete all series (and their books and box sets) across every pen name? This cannot be undone.')) return;
    this.vs.clearAllSeries();
    this.selected.set(null);
    this.editMode.set(false);
  }
}
