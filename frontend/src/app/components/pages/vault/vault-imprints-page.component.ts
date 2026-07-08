import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { VaultCompanyStoreService, VaultIsbnRecord } from '../../../services/vault-company-store.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { ExcelImportService } from '../../../services/excel-import.service';
import { Imprint } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { VaultTableFooterComponent } from '../../shared/vault-table-footer/vault-table-footer.component';
import { VaultCreateModalComponent, VaultCreateResult } from '../../shared/vault-create-modal/vault-create-modal.component';

@Component({
  selector: 'app-vault-imprints-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent, VaultTableFooterComponent, VaultCreateModalComponent],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-imprints-page.component.css'],
  templateUrl: './vault-imprints-page.component.html',
})
export class VaultImprintsPageComponent {
  readonly vs = inject(AuthorVaultService);
  private readonly vaultStore = inject(VaultCompanyStoreService);
  private readonly fileUpload = inject(FileUploadService);
  private readonly excelImport = inject(ExcelImportService);
  private router = inject(Router);

  company = this.vs.company;
  allImprints = computed(() => this.company().imprints);
  selectedId = signal<string | null>(null);
  /** Always resolve from live company signal so edits/adds stay in sync. */
  selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.allImprints().find(i => i.id === id) ?? null;
  });

  activeTab = signal('identity');
  isbnFilter = '';
  editMode = signal(false);
  cardEditModes: Record<string, boolean> = {};
  uploadingTemplate = signal<string | null>(null);

  private pendingCsvBox = '';
  readonly TABLE_PAGE_SIZE = 8;
  tablePages: Record<string, number> = {};

  tabs = [
    { id: 'identity', label: 'Identity' },
    { id: 'pennames', label: 'Pen Names' },
    { id: 'isbns', label: 'ISBNs' },
  ];

  isCardEditing(cardId: string): boolean {
    return !!(this.cardEditModes[cardId] || this.editMode());
  }

  toggleCardEdit(cardId: string): void {
    this.cardEditModes[cardId] = !this.cardEditModes[cardId];
  }

  deleteAllImprints(): void {
    if (!confirm('Delete all imprints and their pen names, series, and books? This cannot be undone.')) return;
    this.vs.clearImprints();
    this.selectedId.set(null);
    this.editMode.set(false);
    this.cardEditModes = {};
  }

  onImprintAvatarUpload(event: Event, imprintId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.vs.setImprintAvatar(imprintId, reader.result as string);
      this.vs.updateImprint(imprintId, { logo: file.name });
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  clearImprintLogo(imprintId: string): void {
    if (!this.isCardEditing('identity')) return;
    this.vs.setImprintAvatar(imprintId, '');
    this.vs.updateImprint(imprintId, { logo: '' });
  }

  onTemplateUpload(event: Event, imprintId: string, kind: 'copyright' | 'contract'): void {
    if (!this.isCardEditing('templates')) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingTemplate.set(kind);
    this.fileUpload.upload(file, `imprint-template/${imprintId}/${kind}`).subscribe({
      next: uploaded => {
        if (kind === 'copyright') {
          this.vs.updateImprintLegalIsbn(imprintId, {
            copyrightPageTemplate: uploaded.fileName,
            copyrightPageTemplateUrl: uploaded.url,
            copyrightPageTemplateFileId: uploaded.id,
          });
        } else {
          this.vs.updateImprintLegalIsbn(imprintId, {
            contractTemplateFile: uploaded.fileName,
            contractTemplateUrl: uploaded.url,
            contractTemplateFileId: uploaded.id,
          });
        }
        this.uploadingTemplate.set(null);
        (event.target as HTMLInputElement).value = '';
      },
      error: () => {
        alert('Upload failed. Make sure you are logged in and the API is running.');
        this.uploadingTemplate.set(null);
        (event.target as HTMLInputElement).value = '';
      },
    });
  }

  openTemplateFile(imprintId: string, kind: 'copyright' | 'contract'): void {
    const imp = this.vs.getImprint(imprintId);
    if (!imp) return;
    const url = kind === 'copyright'
      ? imp.legalIsbn.copyrightPageTemplateUrl
      : imp.legalIsbn.contractTemplateUrl;
    const name = kind === 'copyright'
      ? imp.legalIsbn.copyrightPageTemplate
      : imp.legalIsbn.contractTemplateFile;
    if (url) {
      window.open(this.fileUpload.resolveFileUrl(url), '_blank', 'noopener,noreferrer');
      return;
    }
    if (name) alert(`File "${name}" has no download URL. Re-upload to enable open/download.`);
  }

  removeTemplateFile(imprintId: string, kind: 'copyright' | 'contract', force = false): void {
    if (!force && !this.isCardEditing('templates')) return;
    const imp = this.vs.getImprint(imprintId);
    if (!imp) return;
    const fileId = kind === 'copyright'
      ? imp.legalIsbn.copyrightPageTemplateFileId
      : imp.legalIsbn.contractTemplateFileId;
    if (kind === 'copyright') {
      this.vs.updateImprintLegalIsbn(imprintId, {
        copyrightPageTemplate: '',
        copyrightPageTemplateUrl: undefined,
        copyrightPageTemplateFileId: undefined,
      });
    } else {
      this.vs.updateImprintLegalIsbn(imprintId, {
        contractTemplateFile: '',
        contractTemplateUrl: undefined,
        contractTemplateFileId: undefined,
      });
    }
    if (fileId) {
      this.fileUpload.delete(fileId).subscribe({ error: () => undefined });
    }
  }

  deleteIdentitySection(imprintId: string): void {
    if (!confirm('Clear imprint identity fields?')) return;
    this.vs.updateImprint(imprintId, {
      name: '',
      purposeGenreFocus: '',
      dateEstablished: '',
      website: '',
      email: '',
      logo: '',
      avatarUrl: '',
      status: 'Active',
    });
    this.vs.updateImprintLegalIsbn(imprintId, { dbaRegistration: '', trademark: '' });
  }

  deleteTemplatesSection(imprintId: string): void {
    if (!confirm('Remove template files for this imprint?')) return;
    this.removeTemplateFile(imprintId, 'copyright', true);
    this.removeTemplateFile(imprintId, 'contract', true);
  }

  deletePenNamesSection(imprintId: string): void {
    if (!confirm('Delete all pen names under this imprint?')) return;
    const imp = this.vs.getImprint(imprintId);
    if (!imp) return;
    for (const pn of [...imp.penNames]) {
      this.vs.removePenName(imprintId, pn.id);
    }
  }

  deleteIsbnBlockSection(imprintId: string): void {
    if (!confirm('Clear ISBN block details for this imprint?')) return;
    this.vs.updateImprintLegalIsbn(imprintId, {
      isbnPrefix: '',
      isbnBlockPurchased: '',
      isbnBlockCount: 0,
      isbnsAssigned: 0,
      isbnsRemaining: 0,
      trademark: '',
    });
  }

  deleteIsbnMasterSection(imprintId: string): void {
    if (!confirm('Delete all ISBN master-list rows for this imprint?')) return;
    const imp = this.vs.getImprint(imprintId);
    if (!imp) return;
    const name = imp.identity.name;
    this.vaultStore.updateIsbnRecords(
      this.vaultStore.isbnRecords().filter(r => r.imprint !== name)
    );
  }

  triggerCsvImport(boxId: string): void {
    this.pendingCsvBox = boxId;
    const input = document.getElementById('imprint-csv-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onCsvSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    const boxId = this.pendingCsvBox;
    const imp = this.selected();
    if (!file || !boxId || !imp) return;

    if (boxId === 'isbn_master') {
      this.excelImport.parseFileList(file).then(list => {
        const mapped: VaultIsbnRecord[] = list.map((row: any) => {
          const get = (...keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(row).find(rk => rk.toLowerCase().replace(/\s+/g, '') === k.replace(/\s+/g, ''));
              if (found && row[found] != null) return String(row[found]);
            }
            return '';
          };
          const statusRaw = get('status').toLowerCase();
          const status: VaultIsbnRecord['status'] =
            statusRaw === 'used' ? 'used' : statusRaw === 'reserved' ? 'reserved' : 'unused';
          return {
            isbn: get('isbn', 'number'),
            format: get('format'),
            title: get('title', 'assigned to', 'book'),
            imprint: imp.identity.name,
            pubDate: get('pub date', 'assigned date', 'date'),
            series: get('series'),
            trimSize: '',
            edition: '',
            asin: '',
            status,
          };
        }).filter(r => r.isbn);
        this.vaultStore.updateIsbnRecords([
          ...this.vaultStore.isbnRecords().filter(r => r.imprint !== imp.identity.name),
          ...mapped,
        ]);
        alert(`Imported ${mapped.length} ISBN row(s).`);
      }).catch(err => alert(err.message || 'Import failed.'));
      return;
    }

    this.excelImport.parseFile(file).then(rows => {
      rows.forEach((r: any) => {
        const field = String(r.field || r['Field'] || r['Field Name'] || '').toLowerCase().trim();
        const value = String(r.value || r['Value'] || r['Entry'] || '');
        if (boxId === 'identity') {
          if (field.includes('name') && !field.includes('dba') && !field.includes('company')) this.vs.updateImprint(imp.id, { name: value });
          else if (field.includes('genre') || field.includes('focus')) this.vs.updateImprint(imp.id, { purposeGenreFocus: value });
          else if (field.includes('date')) this.vs.updateImprint(imp.id, { dateEstablished: value });
          else if (field.includes('website')) this.vs.updateImprint(imp.id, { website: value });
          else if (field.includes('email')) this.vs.updateImprint(imp.id, { email: value });
          else if (field.includes('dba')) this.vs.updateImprintLegalIsbn(imp.id, { dbaRegistration: value });
          else if (field.includes('trademark')) this.vs.updateImprintLegalIsbn(imp.id, { trademark: value });
        } else if (boxId === 'isbn_block') {
          if (field.includes('prefix')) this.vs.updateImprintLegalIsbn(imp.id, { isbnPrefix: value });
          else if (field.includes('purchased') || field.includes('block purchased')) this.vs.updateImprintLegalIsbn(imp.id, { isbnBlockPurchased: value });
          else if (field.includes('count') || field.includes('size')) this.vs.updateImprintLegalIsbn(imp.id, { isbnBlockCount: Number(value) || 0 });
          else if (field.includes('assigned')) this.vs.updateImprintLegalIsbn(imp.id, { isbnsAssigned: Number(value) || 0 });
          else if (field.includes('remaining')) this.vs.updateImprintLegalIsbn(imp.id, { isbnsRemaining: Number(value) || 0 });
          else if (field.includes('trademark')) this.vs.updateImprintLegalIsbn(imp.id, { trademark: value });
        }
      });
      alert('Import applied.');
    }).catch(err => alert(err.message || 'Import failed.'));
  }

  get totalPenNames() { return this.allImprints().reduce((a, i) => a + i.penNames.length, 0); }
  get totalBooks() { return this.allImprints().reduce((a, i) => a + i.penNames.reduce((b, p) => b + p.series.reduce((c, s) => c + s.books.length, 0), 0), 0); }
  get totalISBNsRemaining() { return this.allImprints().reduce((a, i) => a + i.legalIsbn.isbnsRemaining, 0); }

  countBooks(imp: Imprint): number {
    return imp.penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0);
  }
  countPenNameBooks(pn: { series: { books: unknown[] }[] }): number {
    return pn.series.reduce((a, s) => a + s.books.length, 0);
  }
  initials(name: string): string {
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }
  selectImprint(imp: Imprint): void {
    this.selectedId.set(imp.id);
    this.activeTab.set('identity');
  }
  clearSelection(): void {
    this.selectedId.set(null);
    this.activeTab.set('identity');
  }
  goTo(r: string): void { this.router.navigate([r]); }

  showCreateImprint = signal(false);
  showCreatePenName = signal(false);

  addImprint(): void {
    this.showCreateImprint.set(true);
  }

  onCreateImprint(result: VaultCreateResult): void {
    this.showCreateImprint.set(false);
    const created = this.vs.addImprint(result.name || 'New Imprint');
    this.selectedId.set(created.id);
    this.activeTab.set('identity');
    this.cardEditModes['identity'] = true;
  }

  addPenNameToSelected(): void {
    const imp = this.selected();
    if (!imp || !this.isCardEditing('pennames')) return;
    this.showCreatePenName.set(true);
  }

  onCreatePenName(result: VaultCreateResult): void {
    this.showCreatePenName.set(false);
    const imp = this.selected();
    if (!imp) return;
    this.vs.addPenName(imp.id, result.name || 'New Pen Name');
  }

  removePenNameFromSelected(penNameId: string): void {
    const imp = this.selected();
    if (!imp || !this.isCardEditing('pennames')) return;
    if (!confirm('Remove this pen name?')) return;
    this.vs.removePenName(imp.id, penNameId);
  }

  getImprintIsbns(imp: Imprint): VaultIsbnRecord[] {
    return this.vaultStore.isbnRecords().filter(r =>
      r.imprint === imp.identity.name &&
      (!this.isbnFilter || r.status === this.isbnFilter)
    );
  }

  getImprintIsbnAbsoluteIndex(imp: Imprint, localIndex: number): number {
    const target = this.getImprintIsbns(imp)[localIndex];
    if (!target) return -1;
    return this.vaultStore.isbnRecords().findIndex(r =>
      r.isbn === target.isbn && r.imprint === target.imprint && r.format === target.format
    );
  }

  patchImprintIsbn(imp: Imprint, localIndex: number, key: string, val: string): void {
    if (!this.isCardEditing('isbn_master')) return;
    const abs = this.getImprintIsbnAbsoluteIndex(imp, localIndex);
    if (abs < 0) return;
    const list = [...this.vaultStore.isbnRecords()];
    list[abs] = { ...list[abs], [key]: val, imprint: imp.identity.name };
    this.vaultStore.updateIsbnRecords(list);
  }

  addImprintIsbnRow(imp: Imprint): void {
    if (!this.isCardEditing('isbn_master')) return;
    this.vaultStore.updateIsbnRecords([
      ...this.vaultStore.isbnRecords(),
      {
        isbn: '',
        format: '',
        title: '',
        imprint: imp.identity.name,
        pubDate: '',
        series: '',
        trimSize: '',
        edition: '',
        asin: '',
        status: 'unused',
      },
    ]);
  }

  removeImprintIsbnRow(imp: Imprint, localIndex: number): void {
    if (!this.isCardEditing('isbn_master')) return;
    const abs = this.getImprintIsbnAbsoluteIndex(imp, localIndex);
    if (abs < 0) return;
    this.vaultStore.updateIsbnRecords(this.vaultStore.isbnRecords().filter((_, i) => i !== abs));
  }

  tablePage(key: string): number {
    return this.tablePages[key] ?? 1;
  }

  setTablePage(key: string, page: number): void {
    this.tablePages[key] = page;
  }

  pageSliceIndexed<T>(key: string, items: T[]): { item: T; index: number }[] {
    const page = this.tablePage(key);
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return items.slice(start, start + this.TABLE_PAGE_SIZE).map((item, i) => ({ item, index: start + i }));
  }

  patchLegalNumber(imprintId: string, key: 'isbnBlockCount' | 'isbnsAssigned' | 'isbnsRemaining', val: string): void {
    this.vs.updateImprintLegalIsbn(imprintId, { [key]: Number(val) || 0 });
  }
}
