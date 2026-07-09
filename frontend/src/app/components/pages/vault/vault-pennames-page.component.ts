import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName, BoxSetRecord } from '../../../models/author-vault.model';
import { ExcelImportService } from '../../../services/excel-import.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { VaultCreateModalComponent, VaultCreateResult } from '../../shared/vault-create-modal/vault-create-modal.component';

@Component({
  selector: 'app-vault-pennames-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent, VaultCreateModalComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-pennames-page.component.css'],
  templateUrl: './vault-pennames-page.component.html',
  })
export class VaultPenNamesPageComponent {
  readonly vs = inject(AuthorVaultService);
  private router = inject(Router);
  private excelImport = inject(ExcelImportService);
  readonly fileUpload = inject(FileUploadService);
  editMode = signal(false);
  cardEditModes: Record<string, boolean> = {};

  allPenNames = computed(() => {
    const pns: PenName[] = [];
    for (const i of this.vs.company().imprints) pns.push(...i.penNames);
    return pns;
  });

  selectedId = signal<string | null>(null);
  /** Always resolve from the live company signal so edits/adds stay in sync. */
  selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.allPenNames().find(p => p.id === id) ?? null;
  });

  tab = signal('identity');

  addingGenre = signal(false);

  // Social handles
  newSocialPlatform = '';
  newSocialHandle = '';
  newSocialUrl = '';

  // Publishing platforms
  newPlatformName = '';
  newPlatformInfo = '';
  newPlatformUrl = '';

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

  selectItem(pn: PenName) { this.selectedId.set(pn.id); this.tab.set('identity'); }
  clearSelection(): void { this.selectedId.set(null); this.tab.set('identity'); }
  goTo(r: string) { this.router.navigate([r]); }

  isCardEditing(cardId: string): boolean {
    return !!(this.cardEditModes[cardId] || this.editMode());
  }

  toggleCardEdit(cardId: string): void {
    this.cardEditModes[cardId] = !this.cardEditModes[cardId];
  }

  showCreatePenName = signal(false);
  showCreateSeries = signal(false);
  createSeriesForPenNameId = '';

  imprintOptions() {
    return this.vs.company().imprints.map(i => ({
      id: i.id,
      label: i.identity.name || 'Untitled imprint',
    }));
  }

  addPenNameToList(): void {
    const imprints = this.vs.company().imprints;
    if (imprints.length === 0) {
      alert('Create an imprint first before adding a pen name.');
      this.goTo('/vault/imprints');
      return;
    }
    this.showCreatePenName.set(true);
  }

  onCreatePenName(result: VaultCreateResult): void {
    this.showCreatePenName.set(false);
    const imprintId = result.parentId || this.vs.company().imprints[0]?.id;
    if (!imprintId) return;
    const created = this.vs.addPenName(imprintId, result.name || 'New Pen Name');
    if (created) {
      this.selectedId.set(created.id);
      this.tab.set('identity');
      this.cardEditModes['identity'] = true;
    }
  }

  addSeriesToSelected(pn: PenName): void {
    if (!this.isCardEditing('series')) {
      this.cardEditModes['series'] = true;
    }
    this.createSeriesForPenNameId = pn.id;
    this.showCreateSeries.set(true);
  }

  onCreateSeriesUnderPenName(result: VaultCreateResult): void {
    this.showCreateSeries.set(false);
    const pnId = this.createSeriesForPenNameId || this.selectedId();
    if (!pnId) return;
    this.vs.addSeries(pnId, result.name || 'New Series');
    this.createSeriesForPenNameId = '';
  }

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
    if (!this.isCardEditing('branding')) return;
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
    if (!this.isCardEditing('identity')) return;
    if (!value.trim()) return;
    const current = this.getAdditionalGenres(pn);
    if (!current.includes(value.trim())) {
      current.push(value.trim());
      const updated = current.join(', ');
      this.vs.updatePenName(pn.id, { additionalGenres: updated });
    }
  }

  removeAdditionalGenre(pn: PenName, value: string): void {
    if (!this.isCardEditing('identity')) return;
    const current = this.getAdditionalGenres(pn);
    const updatedList = current.filter(g => g !== value);
    this.vs.updatePenName(pn.id, { additionalGenres: updatedList.join(', ') });
  }

  // Presence platform helpers
  addSocialAccount(pn: PenName): void {
    if (!this.isCardEditing('presence') && !this.isCardEditing('social')) return;
    const platform = this.newSocialPlatform.trim();
    const handle = this.newSocialHandle.trim();
    if (!platform || !handle) {
      alert('Enter both a platform name and a handle.');
      return;
    }
    const live = this.selected() ?? pn;
    const current = [...(live.onlinePresence?.socialAccounts ?? [])];
    if (current.some(s => s.platform.toLowerCase() === platform.toLowerCase() && s.handle.toLowerCase() === handle.toLowerCase())) {
      alert('That channel is already in the list.');
      return;
    }
    current.push({
      platform,
      handle,
      url: this.newSocialUrl.trim()
    });
    this.vs.updatePenNameFull(live.id, {
      onlinePresence: {
        ...live.onlinePresence,
        socialAccounts: current
      }
    });
    this.newSocialPlatform = '';
    this.newSocialHandle = '';
    this.newSocialUrl = '';
  }

  addPlatformAccount(pn: PenName): void {
    if (!this.isCardEditing('platforms')) return;
    const name = this.newPlatformName.trim();
    if (!name) {
      alert('Enter a platform name.');
      return;
    }
    const live = this.selected() ?? pn;
    const current = [...(live.platformAccounts || [])];
    current.push({
      platform: name,
      accountInfo: this.newPlatformInfo.trim(),
      url: this.newPlatformUrl.trim(),
    });
    this.vs.updatePenNameFull(live.id, { platformAccounts: current });
    this.newPlatformName = '';
    this.newPlatformInfo = '';
    this.newPlatformUrl = '';
  }

  patchPlatformAccount(pn: PenName, index: number, key: 'platform' | 'accountInfo' | 'url', value: string): void {
    if (!this.isCardEditing('platforms')) return;
    const live = this.selected() ?? pn;
    const current = [...(live.platformAccounts || [])];
    if (!current[index]) return;
    current[index] = { ...current[index], [key]: value };
    this.vs.updatePenNameFull(live.id, { platformAccounts: current });
  }

  removePlatformAccount(pn: PenName, index: number): void {
    if (!this.isCardEditing('platforms')) return;
    const live = this.selected() ?? pn;
    const current = (live.platformAccounts || []).filter((_, i) => i !== index);
    this.vs.updatePenNameFull(live.id, { platformAccounts: current });
  }

  removeSocialAccount(pn: PenName, index: number): void {
    if (!this.isCardEditing('presence') && !this.isCardEditing('social')) return;
    const live = this.selected() ?? pn;
    const current = (live.onlinePresence?.socialAccounts ?? []).filter((_, i) => i !== index);
    this.vs.updatePenNameFull(live.id, {
      onlinePresence: {
        ...live.onlinePresence,
        socialAccounts: current
      }
    });
  }

  deleteEmailStoreSection(pn: PenName): void {
    if (!confirm('Clear email & store account fields?')) return;
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        penNameEmail: '',
        directStoreUrl: '',
        goodreadsUrl: '',
        bookbubUrl: '',
      }
    });
  }

  loadEmailStoreDefaults(pn: PenName): void {
    const slug = pn.identity.displayName.toLowerCase().replace(/\s+/g, '');
    const dash = pn.identity.displayName.toLowerCase().replace(/\s+/g, '-');
    const site = (pn.onlinePresence.authorWebsite || '').replace(/\/$/, '');
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        penNameEmail: `${slug}@authorvaultpress.com`,
        directStoreUrl: site ? `${site}/shop` : '',
        goodreadsUrl: `goodreads.com/author/${dash}`,
        bookbubUrl: `bookbub.com/authors/${dash}`,
      }
    });
    this.cardEditModes['email_store'] = true;
  }

  deleteSocialSection(pn: PenName): void {
    if (!confirm('Delete all social media channels?')) return;
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: { ...pn.onlinePresence, socialAccounts: [] }
    });
  }

  emailStoreValue(pn: PenName, field: 'penNameEmail' | 'directStoreUrl' | 'goodreadsUrl' | 'bookbubUrl'): string {
    const op = pn.onlinePresence;
    if (field === 'penNameEmail') {
      return op.penNameEmail || `${pn.identity.displayName.toLowerCase().replace(/\s+/g, '')}@authorvaultpress.com`;
    }
    if (field === 'directStoreUrl') {
      return op.directStoreUrl || (op.authorWebsite ? `${op.authorWebsite.replace(/\/$/, '')}/shop` : '');
    }
    if (field === 'goodreadsUrl') {
      return op.goodreadsUrl || `goodreads.com/author/${pn.identity.displayName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    return op.bookbubUrl || `bookbub.com/authors/${pn.identity.displayName.toLowerCase().replace(/\s+/g, '-')}`;
  }

  updatePresenceField(pn: PenName, field: string, value: string | number): void {
    if (!this.isCardEditing('presence') && !this.isCardEditing('email_store') && !this.isCardEditing('social')) return;
    const live = this.selected() ?? pn;
    const nextValue = field === 'subscriberCount' ? (Number(value) || 0) : value;
    this.vs.updatePenNameFull(live.id, {
      onlinePresence: { ...live.onlinePresence, [field]: nextValue }
    });
  }

  updateCommunityField(pn: PenName, field: string, value: string): void {
    if (!this.isCardEditing('community')) return;
    this.vs.updatePenNameFull(pn.id, {
      readerCommunity: { ...pn.readerCommunity, [field]: value }
    });
  }

  // Press Kit helpers
  isPressKitItemChecked(pn: PenName, item: string): boolean {
    return pn.branding.pressKitChecklist?.includes(item) ?? false;
  }

  togglePressKitItem(pn: PenName, item: string): void {
    if (!this.isCardEditing('branding')) return;
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
    if (!this.isCardEditing('branding')) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileUpload.upload(file, `presskit/${pn.id}`).subscribe({
      next: uploaded => {
        this.vs.updatePenNameFull(pn.id, {
          branding: {
            ...pn.branding,
            pressKitFile: uploaded.fileName
          }
        });
      },
      error: () => alert('Upload failed.')
    });
  }

  removePressKitFile(pn: PenName): void {
    if (!this.isCardEditing('branding')) return;
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitFile: undefined
      }
    });
  }

  // Graphics and Assets uploading helpers
  onAssetUpload(event: Event, pn: PenName, field: keyof PenName['branding']): void {
    if (!this.isCardEditing('branding')) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileUpload.upload(file, `assets/${pn.id}/${field}`).subscribe({
      next: uploaded => {
        this.vs.updatePenNameFull(pn.id, {
          branding: {
            ...pn.branding,
            [field]: uploaded.url
          }
        });
      },
      error: () => alert('Upload failed.')
    });
  }

  removeAssetFile(pn: PenName, field: keyof PenName['branding']): void {
    if (!this.isCardEditing('branding')) return;
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        [field]: ''
      }
    });
  }

  openAttachedFile(url: string | undefined | null): void {
    if (url) {
      window.open(this.fileUpload.resolveFileUrl(url), '_blank', 'noopener,noreferrer');
    }
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
    if (!this.isCardEditing('boxsets')) {
      this.cardEditModes['boxsets'] = true;
    }
    const live = this.selected() ?? pn;
    let seriesId = live.series[0]?.id || '';
    if (!live.series.length) {
      const name = prompt('No series yet. Create a series to assign this box set:', 'New Series');
      if (name === null) return;
      const created = this.vs.addSeries(live.id, name.trim() || 'New Series');
      if (!created) {
        alert('Could not create series.');
        return;
      }
      seriesId = created.id;
    }
    this.editingBoxSet.set(null);
    this.selectedSeriesId = seriesId;
    this.boxSetForm = {
      id: '',
      title: '',
      subtitle: '',
      type: 'Digital Omnibus',
      status: 'Draft',
      dueDate: new Date().toISOString().split('T')[0],
      penName: live.identity.displayName,
      copyrightHolder: this.vs.company().identity.legalName,
      totalWordCount: 220000,
      totalPageCount: 880,
      constituentTitles: [],
      exclusiveContent: false,
      exclusiveDescription: '',
      coverDesigner: '',
      oneLineHook: '',
      shortDescription: '',
      longDescription: '',
      valueProposition: '',
      bundleRightsConfirmed: true,
      kdpSelectConflictCheck: ''
    };

    const selections: Record<string, boolean> = {};
    for (const b of this.getAllPenNameBooks(this.selected() ?? live)) {
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
    const live = this.selected() ?? pn;
    if (!this.boxSetForm.title.trim()) {
      alert('Enter a box set title.');
      return;
    }
    if (!this.boxSetForm.bundleRightsConfirmed) {
      alert('Confirm bundle publishing rights before saving.');
      return;
    }

    let seriesId = this.selectedSeriesId;
    let series = live.series.find(s => s.id === seriesId);
    if (!series) {
      if (!live.series.length) {
        const name = prompt('Create a series to attach this box set to:', 'New Series');
        if (name === null) return;
        const created = this.vs.addSeries(live.id, name.trim() || 'New Series');
        if (!created) {
          alert('Could not create series.');
          return;
        }
        seriesId = created.id;
        series = created;
        this.selectedSeriesId = seriesId;
      } else {
        seriesId = live.series[0].id;
        series = live.series[0];
        this.selectedSeriesId = seriesId;
      }
    }

    const selectedBooks = this.getAllPenNameBooks(live).filter(b => this.constituentBookSelections()[b.id]);
    const constituentTitles = selectedBooks.map((b, i) => ({
      bookId: b.id,
      title: b.coreWork.masterTitle,
      position: i + 1,
      edition: 'First Edition'
    }));

    const currentBoxSets = [...(series.boxSets ?? [])];

    const record: BoxSetRecord = {
      id: this.boxSetForm.id || `bs-${Date.now()}`,
      title: this.boxSetForm.title.trim(),
      subtitle: this.boxSetForm.subtitle.trim(),
      parentSeriesId: seriesId,
      type: this.boxSetForm.type,
      status: this.boxSetForm.status,
      publicationDate: this.boxSetForm.dueDate,
      penName: live.identity.displayName,
      copyrightHolder: this.boxSetForm.copyrightHolder || this.vs.company().identity.legalName || 'Company LLC',
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
      } else {
        currentBoxSets.push(record);
      }
    } else {
      currentBoxSets.push(record);
    }

    this.vs.updateBoxSets(live.id, seriesId, currentBoxSets);
    this.cardEditModes['boxsets'] = true;
    this.closeBoxSetModal();
  }

  deleteBoxSet(pn: PenName, seriesId: string, boxSetId: string): void {
    if (!this.isCardEditing('boxsets')) return;
    const series = pn.series.find(s => s.id === seriesId);
    if (!series) return;
    const updated = (series.boxSets ?? []).filter(b => b.id !== boxSetId);
    this.vs.updateBoxSets(pn.id, seriesId, updated);
  }

  // ── Section delete handlers ──
  deleteIdentitySection(pn: PenName): void {
    if (!confirm('Clear this pen name\'s identity fields?')) return;
    this.vs.updatePenName(pn.id, {
      legalNameLinked: '',
      genre: '',
      subgenre: '',
      additionalGenres: '',
      reason: '',
      notes: '',
      avatarUrl: '',
    });
  }

  deleteBrandingSection(pn: PenName): void {
    if (!confirm('Clear branding & press kit info for this pen name?')) return;
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        authorPhoto: '', bioShort: '', bioMedium: '', bioLong: '', bioFirstPerson: '', bioThirdPerson: '',
        tagline: '', brandColors: '', brandFonts: '', coverStyleNotes: '', logo: '',
        pressKitFile: undefined, pressKitChecklist: [],
      }
    });
  }

  deletePlatformsSection(pn: PenName): void {
    if (!confirm('Remove all publishing platform accounts for this pen name?')) return;
    this.vs.updatePenNameFull(pn.id, { platformAccounts: [] });
  }

  deletePresenceSection(pn: PenName): void {
    if (!confirm('Clear online presence details for this pen name?')) return;
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        authorWebsite: '', newsletterPlatform: '', newsletterName: '', subscriberCount: 0, socialAccounts: [],
      }
    });
  }

  deleteCommunitySection(pn: PenName): void {
    if (!confirm('Clear reader community details for this pen name?')) return;
    this.vs.updatePenNameFull(pn.id, {
      readerCommunity: {
        primaryDemographic: '', readerPersona: '', arcTeam: '', betaReaderPool: '', readerFacebookGroup: '', engagementNotes: '',
      }
    });
  }

  deleteBoxsetsSection(pn: PenName): void {
    if (!confirm('Delete all box sets across every series for this pen name?')) return;
    for (const sr of pn.series) {
      if (sr.boxSets?.length) this.vs.updateBoxSets(pn.id, sr.id, []);
    }
  }

  deleteSeriesSection(pn: PenName): void {
    if (!confirm('Delete all series (and their books) under this pen name?')) return;
    for (const sr of [...pn.series]) {
      this.vs.removeSeries(pn.id, sr.id);
    }
  }

  // ── Load (CSV/xlsx) for Identity section ──
  triggerIdentityLoad(): void {
    const input = document.getElementById('penname-csv-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const pn = this.selected();
    if (!file || !pn) return;

    this.excelImport.parseFile(file).then(rows => {
      let presenceUpdated = false;
      let communityUpdated = false;
      let brandingUpdated = false;
      let identityUpdated = false;

      const currentPresence = { ...pn.onlinePresence };
      const currentCommunity = { ...pn.readerCommunity };
      const currentBranding = { ...pn.branding };
      const identityPatch: any = {};

      rows.forEach((r: any) => {
        const field = String(r.field || '').toLowerCase().trim();
        const value = String(r.value || '');

        // Identity
        if (field.includes('display') && field.includes('name')) { identityPatch.displayName = value; identityUpdated = true; }
        else if (field.includes('legal')) { identityPatch.legalNameLinked = value; identityUpdated = true; }
        else if (field.includes('subgenre')) { identityPatch.subgenre = value; identityUpdated = true; }
        else if (field.includes('genre')) { identityPatch.genre = value; identityUpdated = true; }
        else if (field.includes('date')) { identityPatch.dateCreated = value; identityUpdated = true; }
        else if (field.includes('reason') || field.includes('purpose')) { identityPatch.reason = value; identityUpdated = true; }
        else if (field.includes('notes')) { identityPatch.notes = value; identityUpdated = true; }

        // Branding
        else if (field.includes('tagline')) { currentBranding.tagline = value; brandingUpdated = true; }
        else if (field.includes('bio') && field.includes('short')) { currentBranding.bioShort = value; brandingUpdated = true; }
        else if (field.includes('bio') && field.includes('medium')) { currentBranding.bioMedium = value; brandingUpdated = true; }
        else if (field.includes('bio') && field.includes('long')) { currentBranding.bioLong = value; brandingUpdated = true; }
        else if (field.includes('bio') && field.includes('first')) { currentBranding.bioFirstPerson = value; brandingUpdated = true; }
        else if (field.includes('bio') && field.includes('third')) { currentBranding.bioThirdPerson = value; brandingUpdated = true; }
        else if (field.includes('color')) { currentBranding.brandColors = value; brandingUpdated = true; }
        else if (field.includes('font')) { currentBranding.brandFonts = value; brandingUpdated = true; }

        // Presence
        else if (field.includes('website')) { currentPresence.authorWebsite = value; presenceUpdated = true; }
        else if (field.includes('newsletter') && field.includes('platform')) { currentPresence.newsletterPlatform = value; presenceUpdated = true; }
        else if (field.includes('newsletter') && field.includes('name')) { currentPresence.newsletterName = value; presenceUpdated = true; }
        else if (field.includes('subscribers') || field.includes('subscriber')) { currentPresence.subscriberCount = Number(value) || 0; presenceUpdated = true; }
        else if (field.includes('pen') && field.includes('email')) { currentPresence.penNameEmail = value; presenceUpdated = true; }
        else if (field.includes('direct') && field.includes('store')) { currentPresence.directStoreUrl = value; presenceUpdated = true; }
        else if (field.includes('goodreads')) { currentPresence.goodreadsUrl = value; presenceUpdated = true; }
        else if (field.includes('bookbub')) { currentPresence.bookbubUrl = value; presenceUpdated = true; }

        // Community
        else if (field.includes('demographic')) { currentCommunity.primaryDemographic = value; communityUpdated = true; }
        else if (field.includes('arc') && field.includes('team')) { currentCommunity.arcTeam = value; communityUpdated = true; }
        else if (field.includes('beta') && field.includes('reader')) { currentCommunity.betaReaderPool = value; communityUpdated = true; }
        else if (field.includes('facebook') && field.includes('group')) { currentCommunity.readerFacebookGroup = value; communityUpdated = true; }
        else if (field.includes('reader') && field.includes('persona')) { currentCommunity.readerPersona = value; communityUpdated = true; }
        else if (field.includes('engagement') && field.includes('notes')) { currentCommunity.engagementNotes = value; communityUpdated = true; }
      });

      if (identityUpdated) {
        this.vs.updatePenName(pn.id, identityPatch);
        this.cardEditModes['identity'] = true;
      }
      if (brandingUpdated) {
        this.vs.updatePenNameFull(pn.id, { branding: currentBranding });
        this.cardEditModes['branding'] = true;
      }
      if (presenceUpdated) {
        this.vs.updatePenNameFull(pn.id, { onlinePresence: currentPresence });
        this.cardEditModes['presence'] = true;
      }
      if (communityUpdated) {
        this.vs.updatePenNameFull(pn.id, { readerCommunity: currentCommunity });
        this.cardEditModes['community'] = true;
      }

      alert('Import applied to the matching Pen Name fields.');
    }).catch(err => alert(err.message || 'Import failed.'));
  }

  deleteAllPenNames(): void {
    if (!confirm('Delete all pen names (and their series, books, and box sets)? This cannot be undone.')) return;
    this.vs.clearAllPenNames();
    this.selectedId.set(null);
    this.editMode.set(false);
    this.cardEditModes = {};
  }
}
