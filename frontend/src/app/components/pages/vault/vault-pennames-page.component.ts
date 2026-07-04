import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName, BoxSetRecord } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

@Component({
  selector: 'app-vault-pennames-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-pennames-page.component.css'],
  templateUrl: './vault-pennames-page.component.html',
  })
export class VaultPenNamesPageComponent {
  readonly vs = inject(AuthorVaultService);
  private router = inject(Router);
  editMode = signal(false);

  allPenNames = computed(() => {
    const pns: PenName[] = [];
    for (const i of this.vs.company().imprints) pns.push(...i.penNames);
    return pns;
  });

  selected = signal<PenName | null>(null);
  tab = signal('identity');

  addingGenre = signal(false);

  // Social handles
  newSocialPlatform = '';
  newSocialHandle = '';
  newSocialUrl = '';

  // Press Kit items
  pressKitItems = ['Author Photo', 'Multi-length Bios', 'Cover Assets', 'Comp Titles', 'Contact Details', 'Book Sheet'];

  // Box Sets state
  showBoxSetModal = signal(false);
  editingBoxSet = signal<BoxSetRecord | null>(null);
  selectedSeriesId = '';
  constituentBookSelections = signal<Record<string, boolean>>({});

  boxSetForm = {
    id: '',
    title: '',
    subtitle: '',
    type: 'Digital Omnibus',
    status: 'Draft' as BoxSetRecord['status'],
    dueDate: '', // Maps to publicationDate
    penName: '',
    copyrightHolder: '',
    totalWordCount: 0,
    totalPageCount: 0,
    constituentTitles: [] as any[],
    exclusiveContent: false,
    exclusiveDescription: '',
    coverDesigner: '',
    oneLineHook: '',
    shortDescription: '',
    longDescription: '',
    valueProposition: '',
    bundleRightsConfirmed: false,
    kdpSelectConflictCheck: ''
  };

  tabs = [
    { id: 'identity',  label: 'Identity' },
    { id: 'branding',  label: 'Branding & Assets' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'presence',  label: 'Online Presence' },
    { id: 'community', label: 'Reader Community' },
    { id: 'boxsets',   label: 'Box Sets' },
    { id: 'series',    label: 'Series' },
  ];

  get totalSeries() { return this.allPenNames().reduce((a, p) => a + p.series.length, 0); }
  get totalBooks() { return this.allPenNames().reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0); }
  get totalSubscribers() { return this.allPenNames().reduce((a, p) => a + p.onlinePresence.subscriberCount, 0); }

  countBooks(pn: PenName): number {
    return pn.series.reduce((a, s) => a + s.books.length, 0);
  }

  initials(name: string): string {
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  selectItem(pn: PenName) { this.selected.set(pn); this.tab.set('identity'); }
  goTo(r: string) { this.router.navigate([r]); }

  // Avatar Upload
  onPenNameAvatarUpload(event: Event, penNameId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.vs.setPenNameAvatar(penNameId, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Branding update
  updateBranding(pn: PenName, field: keyof PenName['branding'], value: string): void {
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        [field]: value
      }
    });
  }

  // Genre chips helpers
  getAdditionalGenres(pn: PenName): string[] {
    if (!pn.identity.additionalGenres) return [];
    return pn.identity.additionalGenres.split(',').map(g => g.trim()).filter(Boolean);
  }

  addAdditionalGenre(pn: PenName, value: string): void {
    if (!value.trim()) return;
    const current = this.getAdditionalGenres(pn);
    if (!current.includes(value.trim())) {
      current.push(value.trim());
      const updated = current.join(', ');
      this.vs.updatePenName(pn.id, { additionalGenres: updated });
    }
  }

  removeAdditionalGenre(pn: PenName, value: string): void {
    const current = this.getAdditionalGenres(pn);
    const updatedList = current.filter(g => g !== value);
    this.vs.updatePenName(pn.id, { additionalGenres: updatedList.join(', ') });
  }

  // Presence platform helpers
  addSocialAccount(pn: PenName): void {
    if (!this.newSocialPlatform.trim() || !this.newSocialHandle.trim()) return;
    const current = [...pn.onlinePresence.socialAccounts];
    current.push({
      platform: this.newSocialPlatform.trim(),
      handle: this.newSocialHandle.trim(),
      url: this.newSocialUrl.trim()
    });
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        socialAccounts: current
      }
    });
    this.newSocialPlatform = '';
    this.newSocialHandle = '';
    this.newSocialUrl = '';
  }

  removeSocialAccount(pn: PenName, platform: string): void {
    const current = pn.onlinePresence.socialAccounts.filter(s => s.platform !== platform);
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        socialAccounts: current
      }
    });
  }

  // Press Kit helpers
  isPressKitItemChecked(pn: PenName, item: string): boolean {
    return pn.branding.pressKitChecklist?.includes(item) ?? false;
  }

  togglePressKitItem(pn: PenName, item: string): void {
    const current = pn.branding.pressKitChecklist ? [...pn.branding.pressKitChecklist] : [];
    const idx = current.indexOf(item);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(item);
    }
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitChecklist: current
      }
    });
  }

  onPressKitUpload(event: Event, pn: PenName): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitFile: file.name
      }
    });
  }

  removePressKitFile(pn: PenName): void {
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitFile: undefined
      }
    });
  }

  composePressKitEmail(pn: PenName): string {
    const subject = encodeURIComponent(`Press Kit Request - ${pn.identity.displayName}`);
    const body = encodeURIComponent(`Hi there,\n\nI have updated the official Press Kit / Branding assets for my pen name, ${pn.identity.displayName}.\n\nYou can access or review them in the attachment or directly request details.\n\nBest regards,\n${pn.identity.displayName}`);
    return `mailto:media@scribecount.com?subject=${subject}&body=${body}`;
  }

  // Box Sets managers
  pnSeriesBoxSetsCount(pn: PenName): number {
    return pn.series.reduce((a, s) => a + (s.boxSets?.length ?? 0), 0);
  }

  getAllPenNameBooks(pn: PenName): any[] {
    const books: any[] = [];
    for (const sr of pn.series) {
      if (sr.books) {
        books.push(...sr.books);
      }
    }
    return books;
  }

  openAddBoxSet(pn: PenName): void {
    this.editingBoxSet.set(null);
    this.selectedSeriesId = pn.series[0]?.id || '';
    this.boxSetForm = {
      id: '',
      title: '',
      subtitle: '',
      type: 'Digital Omnibus',
      status: 'Draft',
      dueDate: new Date().toISOString().split('T')[0],
      penName: pn.identity.displayName,
      copyrightHolder: this.vs.company().identity.legalName,
      totalWordCount: 220000,
      totalPageCount: 880,
      constituentTitles: [],
      exclusiveContent: false,
      exclusiveDescription: '',
      coverDesigner: 'James Okafor',
      oneLineHook: '',
      shortDescription: '',
      longDescription: '',
      valueProposition: '',
      bundleRightsConfirmed: true,
      kdpSelectConflictCheck: ''
    };

    const selections: Record<string, boolean> = {};
    for (const b of this.getAllPenNameBooks(pn)) {
      selections[b.id] = false;
    }
    this.constituentBookSelections.set(selections);
    this.showBoxSetModal.set(true);
  }

  openEditBoxSet(pn: PenName, seriesId: string, bs: BoxSetRecord): void {
    this.editingBoxSet.set(bs);
    this.selectedSeriesId = seriesId;
    this.boxSetForm = {
      id: bs.id,
      title: bs.title,
      subtitle: bs.subtitle,
      type: bs.type,
      status: bs.status,
      dueDate: bs.publicationDate,
      penName: bs.penName,
      copyrightHolder: bs.copyrightHolder,
      totalWordCount: bs.totalWordCount,
      totalPageCount: bs.totalPageCount,
      constituentTitles: [...bs.constituentTitles],
      exclusiveContent: bs.exclusiveContent,
      exclusiveDescription: bs.exclusiveDescription,
      coverDesigner: bs.coverDesigner,
      oneLineHook: bs.oneLineHook,
      shortDescription: bs.shortDescription,
      longDescription: bs.longDescription,
      valueProposition: bs.valueProposition,
      bundleRightsConfirmed: bs.bundleRightsConfirmed,
      kdpSelectConflictCheck: bs.kdpSelectConflictCheck
    };

    const selections: Record<string, boolean> = {};
    const selectedIds = bs.constituentTitles.map(t => t.bookId);
    for (const b of this.getAllPenNameBooks(pn)) {
      selections[b.id] = selectedIds.includes(b.id);
    }
    this.constituentBookSelections.set(selections);
    this.showBoxSetModal.set(true);
  }

  closeBoxSetModal(): void {
    this.showBoxSetModal.set(false);
    this.editingBoxSet.set(null);
  }

  toggleConstituentBook(bookId: string): void {
    this.constituentBookSelections.update(s => ({
      ...s,
      [bookId]: !s[bookId]
    }));
  }

  saveBoxSet(pn: PenName): void {
    if (!this.boxSetForm.title.trim()) return;

    const selectedBooks = this.getAllPenNameBooks(pn).filter(b => this.constituentBookSelections()[b.id]);
    const constituentTitles = selectedBooks.map((b, i) => ({
      bookId: b.id,
      title: b.coreWork.masterTitle,
      position: i + 1,
      edition: 'First Edition'
    }));

    const seriesId = this.selectedSeriesId;
    const series = pn.series.find(s => s.id === seriesId);
    if (!series) return;

    const currentBoxSets = [...(series.boxSets ?? [])];

    const record: BoxSetRecord = {
      id: this.boxSetForm.id || `bs-${Date.now()}`,
      title: this.boxSetForm.title.trim(),
      subtitle: this.boxSetForm.subtitle.trim(),
      parentSeriesId: seriesId,
      type: this.boxSetForm.type,
      status: this.boxSetForm.status,
      publicationDate: this.boxSetForm.dueDate,
      penName: pn.identity.displayName,
      copyrightHolder: this.boxSetForm.copyrightHolder || 'Company LLC',
      totalWordCount: Number(this.boxSetForm.totalWordCount),
      totalPageCount: Number(this.boxSetForm.totalPageCount),
      constituentTitles,
      exclusiveContent: this.boxSetForm.exclusiveContent,
      exclusiveDescription: this.boxSetForm.exclusiveDescription,
      coverDesigner: this.boxSetForm.coverDesigner,
      oneLineHook: this.boxSetForm.oneLineHook,
      shortDescription: this.boxSetForm.shortDescription,
      longDescription: this.boxSetForm.longDescription,
      valueProposition: this.boxSetForm.valueProposition,
      bundleRightsConfirmed: this.boxSetForm.bundleRightsConfirmed,
      kdpSelectConflictCheck: this.boxSetForm.kdpSelectConflictCheck
    };

    if (this.editingBoxSet()) {
      const idx = currentBoxSets.findIndex(b => b.id === record.id);
      if (idx >= 0) {
        currentBoxSets[idx] = record;
      }
    } else {
      currentBoxSets.push(record);
    }

    this.vs.updateBoxSets(pn.id, seriesId, currentBoxSets);
    this.closeBoxSetModal();
  }

  deleteBoxSet(pn: PenName, seriesId: string, boxSetId: string): void {
    if (!this.editMode()) return;
    const series = pn.series.find(s => s.id === seriesId);
    if (!series) return;
    const updated = (series.boxSets ?? []).filter(b => b.id !== boxSetId);
    this.vs.updateBoxSets(pn.id, seriesId, updated);
  }

  deleteAllPenNames(): void {
    if (!confirm('Delete all pen names (and their series, books, and box sets)? This cannot be undone.')) return;
    this.vs.clearAllPenNames();
    this.selected.set(null);
    this.editMode.set(false);
  }
}
