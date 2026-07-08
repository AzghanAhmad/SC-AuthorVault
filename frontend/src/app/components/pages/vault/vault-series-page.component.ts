import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName, Series } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { VaultCreateModalComponent, VaultCreateResult } from '../../shared/vault-create-modal/vault-create-modal.component';

@Component({
  selector: 'app-vault-series-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent, VaultCreateModalComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-series-page.component.css'],
  templateUrl: './vault-series-page.component.html',
  })
export class VaultSeriesPageComponent {
  readonly vs = inject(AuthorVaultService);
  private router = inject(Router);
  editMode = signal(false);
  cardEditModes: Record<string, boolean> = {};

  goTo(r: string) { this.router.navigate([r]); }

  allPenNames = computed(() => {
    const pns: PenName[] = [];
    for (const i of this.vs.company().imprints) pns.push(...i.penNames);
    return pns;
  });

  allSeries = computed(() => {
    const s: Series[] = [];
    for (const i of this.vs.company().imprints) for (const p of i.penNames) s.push(...p.series);
    return s;
  });

  selectedId = signal<string | null>(null);
  /** Always resolve from the live company signal so edits/adds stay in sync. */
  selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.allSeries().find(s => s.id === id) ?? null;
  });

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
  selectItem(sr: Series) { this.selectedId.set(sr.id); this.tab.set('identity'); }
  clearSelection(): void { this.selectedId.set(null); this.tab.set('identity'); }

  isCardEditing(cardId: string): boolean {
    return !!(this.cardEditModes[cardId] || this.editMode());
  }

  toggleCardEdit(cardId: string): void {
    this.cardEditModes[cardId] = !this.cardEditModes[cardId];
  }

  /** Resolve the pen name that owns the currently selected series. */
  parentPenNameId(sr: Series): string | undefined {
    return this.vs.findPenNameIdForSeries(sr.id) ?? sr.identity.parentPenNameId;
  }

  private readonly numericIdentityKeys = new Set(['plannedTotalBooks', 'currentTotalBooks']);

  patchIdentity(sr: Series, key: string, val: string | number): void {
    if (!this.isCardEditing('identity')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    const nextVal = this.numericIdentityKeys.has(key) ? (Number(val) || 0) : val;
    this.vs.updateSeries(penNameId, sr.id, { [key]: nextVal } as any);
  }

  patchWorld(sr: Series, key: string, val: string): void {
    if (!this.isCardEditing('world')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateSeriesWorld(penNameId, sr.id, { [key]: val } as any);
  }

  patchBranding(sr: Series, key: string, val: string): void {
    if (!this.isCardEditing('branding')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateSeriesBranding(penNameId, sr.id, { [key]: val } as any);
  }

  showCreateSeries = signal(false);

  penNameOptions() {
    return this.allPenNames().map(p => ({
      id: p.id,
      label: p.identity.displayName || 'Untitled pen name',
    }));
  }

  addSeriesToList(): void {
    const penNames = this.allPenNames();
    if (penNames.length === 0) {
      alert('Create a pen name first before adding a series.');
      this.goTo('/vault/pen-names');
      return;
    }
    this.showCreateSeries.set(true);
  }

  onCreateSeries(result: VaultCreateResult): void {
    this.showCreateSeries.set(false);
    const penNameId = result.parentId || this.allPenNames()[0]?.id;
    if (!penNameId) return;
    const created = this.vs.addSeries(penNameId, result.name || 'New Series');
    if (created) {
      this.selectedId.set(created.id);
      this.tab.set('identity');
      this.cardEditModes['identity'] = true;
    }
  }

  deleteIdentitySection(sr: Series): void {
    if (!confirm('Clear this series\' identity fields?')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateSeries(penNameId, sr.id, {
      universeName: '', subgenre: '', readingOrderNotes: '', interconnectedSeries: '',
    });
  }

  deleteWorldSection(sr: Series): void {
    if (!confirm('Clear world & continuity notes for this series?')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateSeriesWorld(penNameId, sr.id, {
      settingOverview: '', timeline: '', characterBibleFile: '', glossary: '',
      mapsFiles: '', continuityNotes: '', spoilerSummary: '',
    });
  }

  deleteBrandingSection(sr: Series): void {
    if (!confirm('Clear branding & marketing details for this series?')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateSeriesBranding(penNameId, sr.id, {
      logo: '', brandColors: '', tagline: '', oneLineHook: '', websitePage: '',
      readerMagnet: '', readThroughAssets: '', salesPage: '', compTitles: '', compAuthors: '',
    });
  }

  deleteBoxsetsSection(sr: Series): void {
    if (!confirm('Delete all box sets for this series?')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.updateBoxSets(penNameId, sr.id, []);
  }

  deleteBooksSection(sr: Series): void {
    if (!confirm('Delete all books in this series? This cannot be undone.')) return;
    const penNameId = this.parentPenNameId(sr);
    if (!penNameId) return;
    this.vs.clearSeriesBooks(penNameId, sr.id);
  }

  deleteAllSeries(): void {
    if (!confirm('Delete all series (and their books and box sets) across every pen name? This cannot be undone.')) return;
    this.vs.clearAllSeries();
    this.selectedId.set(null);
    this.editMode.set(false);
    this.cardEditModes = {};
  }
}
