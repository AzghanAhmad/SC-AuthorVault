import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { CompanyIdentity } from '../../../models/author-vault.model';
import { ExcelImportService } from '../../../services/excel-import.service';
import { VaultCompanyStoreService, VaultOwnerProfile, OwnerDocRef } from '../../../services/vault-company-store.service';
import { CompanyPinService } from '../../../services/company-pin.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { RevealToggleComponent } from '../../shared/reveal-toggle/reveal-toggle.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';
import { StatusSelectComponent } from '../../shared/status-select/status-select.component';
import { VaultTableFooterComponent } from '../../shared/vault-table-footer/vault-table-footer.component';
import { vaultStatusClass, vaultStatusOptions } from '../../../utils/vault-status.util';

@Component({
  selector: 'app-vault-company-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent, RevealToggleComponent, PageActionBarComponent, StatusSelectComponent, VaultTableFooterComponent],
  styleUrls: ['../company-vault/company-vault.component.css'],
  templateUrl: './vault-company-page.component.html',
  })
export class VaultCompanyPageComponent implements OnInit, OnDestroy {
  readonly vs = inject(AuthorVaultService);
  private excelImport = inject(ExcelImportService);
  private companyStore = inject(VaultCompanyStoreService);
  private pinService = inject(CompanyPinService);
  private fileUpload = inject(FileUploadService);
  readonly company = this.vs.company;
  readonly uploadingOwnerDoc = signal<string | null>(null);
  readonly uploadingOwnershipFile = signal<string | null>(null);
  editMode = signal(false);
  tablePages: Record<string, number> = {};
  readonly TABLE_PAGE_SIZE = 8;

  importMessage = '';
  importError = false;

  get companyInitials(): string {
    const n = this.company().identity.legalName || 'AV';
    return n.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  get ownerProfiles() { return this.companyStore.ownerProfiles(); }
  get publishingPlatforms() { return this.companyStore.publishingPlatforms(); }
  get teamMembers() { return this.companyStore.teamMembers(); }
  get bankAccounts() { return this.companyStore.bankAccounts(); }
  get paymentPlatforms() { return this.companyStore.paymentPlatforms(); }
  get taxDocs() { return this.companyStore.taxDocs(); }
  get isbnRecords() { return this.companyStore.isbnRecords(); }
  get contractRecords() { return this.companyStore.contractRecords(); }
  get financialRecords() { return this.companyStore.financialRecords(); }
  get domainRecords() { return this.companyStore.domainRecords(); }
  get inventoryItems() { return this.companyStore.inventoryItems(); }
  get securityEntries() { return this.companyStore.securityEntries(); }
  get logos() { return this.companyStore.logos(); }
  get sopTemplates() { return this.companyStore.sopTemplates(); }
  get corporateDocs() { return this.companyStore.corporateDocs(); }
  get communications() { return this.companyStore.communications(); }
  get inventoryFulfillment() { return this.companyStore.inventoryFulfillment(); }
  get securityNotes() { return this.companyStore.securityNotes(); }
  get taxRegistrations() { return this.companyStore.taxRegistrations(); }

  patchOwner(i: number, key: string, val: any): void {
    const list = [...this.ownerProfiles];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateOwners(list);
  }
  patchTeam(i: number, key: string, val: string): void {
    const list = [...this.teamMembers];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateTeam(list);
  }
  patchBank(i: number, key: string, val: string): void {
    const list = [...this.bankAccounts];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateBankAccounts(list);
  }
  patchTaxDoc(i: number, key: string, val: string): void {
    const list = [...this.taxDocs];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateTaxDocs(list);
  }
  patchIsbn(i: number, key: string, val: string): void {
    const list = [...this.isbnRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateIsbnRecords(list);
  }
  patchContract(i: number, key: string, val: string): void {
    const list = [...this.contractRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateContracts(list);
  }
  patchFinancial(i: number, key: string, val: string): void {
    const list = [...this.financialRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateFinancialRecords(list);
  }
  patchDomain(i: number, key: string, val: string): void {
    const list = [...this.domainRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateDomains(list);
  }
  patchInventory(i: number, key: string, val: string | number): void {
    const list = [...this.inventoryItems];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateInventory(list);
  }
  patchSecurity(i: number, key: string, val: string): void {
    if (!this.editMode()) return;
    const list = [...this.securityEntries];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateSecurity(list);
  }

  addSecurityEntry(): void {
    if (!this.editMode()) return;
    this.companyStore.updateSecurity([
      ...this.securityEntries,
      { resource: '', owner: '', accessLevel: '', twoFa: '', recoveryEmail: '', notes: '' }
    ]);
  }

  removeSecurityEntry(index: number): void {
    if (!this.editMode()) return;
    this.companyStore.updateSecurity(this.securityEntries.filter((_, i) => i !== index));
  }
  patchLogo(i: number, key: string, val: string): void {
    const list = [...this.logos];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateLogos(list);
  }
  patchSop(i: number, key: string, val: string): void {
    const list = [...this.sopTemplates];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateSops(list);
  }
  patchCorpDoc(i: number, key: string, val: string): void {
    const list = [...this.corporateDocs];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateCorporateDocs(list);
  }

  tablePage(key: string): number {
    return this.tablePages[key] ?? 1;
  }

  setTablePage(key: string, page: number): void {
    this.tablePages = { ...this.tablePages, [key]: page };
  }

  pageSliceIndexed<T>(key: string, rows: T[]): { item: T; index: number }[] {
    const page = this.tablePage(key);
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return rows.slice(start, start + this.TABLE_PAGE_SIZE).map((item, i) => ({ item, index: start + i }));
  }

  pageSlice<T>(key: string, rows: T[]): T[] {
    const page = this.tablePage(key);
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return rows.slice(start, start + this.TABLE_PAGE_SIZE);
  }

  pageSliceFilteredIndexed<T>(key: string, filtered: T[], all: T[]): { item: T; index: number }[] {
    const page = this.tablePage(key);
    const start = (page - 1) * this.TABLE_PAGE_SIZE;
    return filtered.slice(start, start + this.TABLE_PAGE_SIZE).map(item => ({
      item,
      index: all.indexOf(item),
    }));
  }

  cellTitle(val: unknown): string {
    if (val == null) return '';
    return String(val);
  }

  sameMailingAddress(): boolean {
    const id = this.company().identity;
    if (id.sameMailingAsBusiness === false) return false;
    if (id.sameMailingAsBusiness === true) return true;
    const mail = (id.mailingAddress || '').trim();
    const primary = (id.primaryAddress || '').trim();
    return !mail || mail === primary;
  }

  onSameMailingChange(same: boolean): void {
    const id = this.company().identity;
    if (same) {
      this.vs.patchIdentity({ sameMailingAsBusiness: true, mailingAddress: id.primaryAddress });
    } else {
      this.vs.patchIdentity({ sameMailingAsBusiness: false });
    }
  }

  onPrimaryAddressChange(val: string): void {
    const patch: Partial<CompanyIdentity> = { primaryAddress: val };
    if (this.sameMailingAddress()) {
      patch.mailingAddress = val;
      patch.sameMailingAsBusiness = true;
    }
    this.vs.patchIdentity(patch);
  }

  addOwnerRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateOwners([
      ...this.ownerProfiles,
      { name: '', role: '', ownershipPct: '', email: '', phone: '', canSign: true, canManageFinances: false, showNda: false },
    ]);
  }

  addCorpDocRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateCorporateDocs([
      ...this.corporateDocs,
      { document: '', fileRef: '', status: 'Pending' },
    ]);
  }

  addBankRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateBankAccounts([
      ...this.bankAccounts,
      { bank: '', nickname: '', account: '', routing: '', wire: '', swift: '', showAccount: false, showRouting: false },
    ]);
  }

  addTaxDocRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateTaxDocs([
      ...this.taxDocs,
      { name: '', type: '', year: new Date().getFullYear().toString(), status: 'Pending' },
    ]);
  }

  addContractRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateContracts([
      ...this.contractRecords,
      { name: '', counterparty: '', type: '', date: new Date().toISOString().split('T')[0], status: 'Draft', file: '' },
    ]);
  }

  addFinancialRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateFinancialRecords([
      ...this.financialRecords,
      { month: '', revenue: '', expenses: '', net: '' },
    ]);
  }

  addFinancialDocRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateFinancialDocs([
      ...this.financialDocs,
      { month: '', year: new Date().getFullYear().toString(), category: '', fileName: '', status: 'Pending' },
    ]);
  }

  addTeamRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateTeam([
      ...this.teamMembers,
      { name: '', role: '', company: '', email: '', phone: '', contractDate: '', rate: '', notes: '' },
    ]);
  }

  addDomainRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateDomains([
      ...this.domainRecords,
      { domain: '', registrar: '', renewal: '', host: '', dns: '', ssl: '', cms: '', contact: '' },
    ]);
  }

  addInventoryRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateInventory([
      ...this.inventoryItems,
      { sku: '', title: '', format: '', stock: 0, reorderPoint: 0, printer: '' },
    ]);
  }

  addIsbnRow(): void {
    if (!this.editMode()) return;
    this.companyStore.updateIsbnRecords([
      ...this.isbnRecords,
      { isbn: '', format: '', title: '', imprint: '', pubDate: '', series: '', trimSize: '', edition: '', asin: '', status: 'unused' },
    ]);
  }

  onOwnershipFileUpload(event: Event, kind: 'operating' | 'scorp'): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadingOwnershipFile.set(kind);
    this.fileUpload.upload(file, `ownership/${kind}`).subscribe({
      next: uploaded => {
        if (kind === 'operating') {
          this.vs.patchOwnership({
            operatingAgreementFile: uploaded.fileName,
            operatingAgreementFileUrl: uploaded.url,
            operatingAgreementFileId: uploaded.id,
          });
        } else {
          this.vs.patchOwnership({
            sCorpElectionFile: uploaded.fileName,
            sCorpElectionFileUrl: uploaded.url,
            sCorpElectionFileId: uploaded.id,
          });
        }
        this.uploadingOwnershipFile.set(null);
        (event.target as HTMLInputElement).value = '';
      },
      error: () => {
        alert('Upload failed. Make sure you are logged in and the API is running.');
        this.uploadingOwnershipFile.set(null);
        (event.target as HTMLInputElement).value = '';
      },
    });
  }

  openOwnershipFile(kind: 'operating' | 'scorp'): void {
    const o = this.company().ownership;
    const url = kind === 'operating' ? o.operatingAgreementFileUrl : o.sCorpElectionFileUrl;
    if (url) {
      window.open(this.fileUpload.resolveFileUrl(url), '_blank');
      return;
    }
    const name = kind === 'operating' ? o.operatingAgreementFile : o.sCorpElectionFile;
    if (name) alert(`File: ${name}`);
  }

  removeOwnershipFile(kind: 'operating' | 'scorp'): void {
    if (!this.editMode()) return;
    const o = this.company().ownership;
    const fileId = kind === 'operating' ? o.operatingAgreementFileId : o.sCorpElectionFileId;
    if (kind === 'operating') {
      this.vs.patchOwnership({ operatingAgreementFile: '', operatingAgreementFileUrl: '', operatingAgreementFileId: undefined });
    } else {
      this.vs.patchOwnership({ sCorpElectionFile: '', sCorpElectionFileUrl: '', sCorpElectionFileId: undefined });
    }
    if (fileId) {
      this.fileUpload.delete(fileId).subscribe({ error: () => undefined });
    }
  }

  onCorpDocFileUpload(event: Event, rowIndex: number): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileUpload.upload(file, `corporate-doc/${rowIndex}`).subscribe({
      next: uploaded => {
        const list = [...this.corporateDocs];
        list[rowIndex] = {
          ...list[rowIndex],
          fileRef: uploaded.fileName,
          fileUrl: uploaded.url,
          fileId: uploaded.id,
        };
        this.companyStore.updateCorporateDocs(list);
        (event.target as HTMLInputElement).value = '';
      },
      error: () => alert('Upload failed.'),
    });
  }

  openCorpDocFile(rowIndex: number): void {
    const doc = this.corporateDocs[rowIndex];
    if (doc?.fileUrl) {
      window.open(this.fileUpload.resolveFileUrl(doc.fileUrl), '_blank');
    } else if (doc?.fileRef) {
      alert(`File: ${doc.fileRef}`);
    }
  }

  removeCorpDocFile(rowIndex: number): void {
    if (!this.editMode()) return;
    const doc = this.corporateDocs[rowIndex];
    const list = [...this.corporateDocs];
    list[rowIndex] = { ...list[rowIndex], fileRef: '', fileUrl: undefined, fileId: undefined };
    this.companyStore.updateCorporateDocs(list);
    if (doc?.fileId) {
      this.fileUpload.delete(doc.fileId).subscribe({ error: () => undefined });
    }
  }

  patchPlatform(listKey: 'publishing' | 'payment', i: number, key: string, val: string): void {
    const list = listKey === 'publishing' ? [...this.publishingPlatforms] : [...this.paymentPlatforms];
    list[i] = { ...list[i], [key]: val };
    if (listKey === 'publishing') this.companyStore.updatePlatforms(list);
    else this.companyStore.updatePaymentPlatforms(list);
  }
  patchComms(key: string, val: string): void {
    this.companyStore.updateCommunications({ ...this.communications, [key]: val });
  }
  patchFulfillment(key: string, val: string): void {
    this.companyStore.updateInventoryFulfillment({ ...this.inventoryFulfillment, [key]: val });
  }
  patchSecurityNotes(key: string, val: string): void {
    if (!this.editMode()) return;
    this.companyStore.updateSecurityNotes({ ...this.securityNotes, [key]: val });
  }
  patchTaxReg(key: string, val: string): void {
    this.companyStore.updateTaxRegistrations({ ...this.taxRegistrations, [key]: val });
  }

  // ── Lock state ──
  unlocked = false;
  pinDigits: string[] = ['', '', '', ''];
  confirmPinDigits: string[] = ['', '', '', ''];
  showPin = false;
  pinError = false;
  pinMismatch = false;
  isFirstTime = false;
  changingPin = false;
  currentPinInput = '';
  newPinInput = '';
  pinChangeError = '';
  pinChangeSuccess = false;
  copyrightLinks: Record<string, string> = {
    US: 'https://www.copyright.gov',
    UK: 'https://www.gov.uk/copyright',
    CA: 'https://ised-isde.canada.ca/site/canadian-intellectual-property-office',
    AU: 'https://www.ipaustralia.gov.au',
    DE: 'https://www.dpma.de/english/',
    FR: 'https://www.inpi.fr/en',
    IN: 'https://copyright.gov.in'
  };
  sopFilter = '';
  sopCategoryFilter = '';
  vendorCategoryFilter = '';
  contractCategoryFilter = '';
  commsAutomationFilter = '';

  // 60-second general timers map
  revealTimers: Record<string, number> = {};
  private timerIntervalRef: any;

  toggleReveal(key: string, duration = 60): void {
    if (this.isRevealed(key)) {
      delete this.revealTimers[key];
    } else {
      this.revealTimers[key] = duration;
    }
  }

  isRevealed(key: string): boolean {
    return (this.revealTimers[key] ?? 0) > 0;
  }

  getTimerValue(key: string): number {
    return this.revealTimers[key] ?? 0;
  }

  maskSensitive(val: string): string {
    if (!val || val.length < 6) return '••••••••';
    return val.slice(0, 3) + '••••••••' + val.slice(-3);
  }

  // Owner document slots
  ownerDocSlots = [
    { key: 'cv', label: 'CV / Resume', hint: 'PDF or DOCX' },
    { key: 'avatar', label: 'Avatar Photo', hint: 'JPG or PNG, 1:1' },
    { key: 'signature', label: 'Electronic Signature', hint: 'PNG transparent' },
    { key: 'job-desc', label: 'Job Description', hint: 'PDF or DOCX' },
    { key: 'nda', label: 'Signed NDA', hint: 'PDF' },
    { key: 'business-card', label: 'Business Card', hint: 'PNG or PDF' },
    { key: 'bio-short', label: 'Bio (Short)', hint: 'DOCX or TXT' },
    { key: 'bio-long', label: 'Bio (Long)', hint: 'DOCX or TXT' },
    { key: 'letterhead', label: 'Letterhead Template', hint: 'DOCX or PDF' },
  ];

  getOwnerDocRef(owner: VaultOwnerProfile, slotKey: string): OwnerDocRef | null {
    const v = owner.docs?.[slotKey];
    if (!v) return null;
    if (typeof v === 'string') return v ? { fileId: 0, fileName: v, url: '' } : null;
    return v;
  }

  hasOwnerDoc(owner: VaultOwnerProfile, slotKey: string): boolean {
    return !!this.getOwnerDocRef(owner, slotKey);
  }

  getOwnerDocHint(owner: VaultOwnerProfile, slotKey: string, fallback: string): string {
    const ref = this.getOwnerDocRef(owner, slotKey);
    return ref ? `✓ ${ref.fileName}` : fallback;
  }

  onOwnerDocUpload(event: Event, ownerIndex: number, slotKey: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const uploadKey = `${ownerIndex}:${slotKey}`;
    this.uploadingOwnerDoc.set(uploadKey);
    const category = `owner-doc/${ownerIndex}/${slotKey}`;

    this.fileUpload.upload(file, category).subscribe({
      next: uploaded => {
        const list = [...this.ownerProfiles];
        const docs = { ...(list[ownerIndex].docs || {}) };
        docs[slotKey] = { fileId: uploaded.id, fileName: uploaded.fileName, url: uploaded.url };
        list[ownerIndex] = { ...list[ownerIndex], docs };
        this.companyStore.updateOwners(list);
        this.uploadingOwnerDoc.set(null);
        input.value = '';
      },
      error: () => {
        alert('Upload failed. Make sure you are logged in and the API is running.');
        this.uploadingOwnerDoc.set(null);
        input.value = '';
      }
    });
  }

  removeOwnerDoc(ownerIndex: number, slotKey: string): void {
    const list = [...this.ownerProfiles];
    const existing = this.getOwnerDocRef(list[ownerIndex], slotKey);
    const docs = { ...(list[ownerIndex].docs || {}) };
    delete docs[slotKey];
    list[ownerIndex] = { ...list[ownerIndex], docs };
    this.companyStore.updateOwners(list);

    if (existing?.fileId) {
      this.fileUpload.delete(existing.fileId).subscribe({ error: () => { /* metadata already cleared */ } });
    }
  }

  downloadOwnerDoc(owner: VaultOwnerProfile, slotKey: string): void {
    const ref = this.getOwnerDocRef(owner, slotKey);
    if (!ref) return;
    if (ref.url) {
      window.open(this.fileUpload.resolveFileUrl(ref.url), '_blank');
      return;
    }
    alert(`File: ${ref.fileName}\n(Re-upload to get a download link from the server)`);
  }

  downloadFile(fileName: string | undefined): void {
    if (!fileName) return;
    alert(`Opening / Downloading file: ${fileName}`);
  }

  // Tax doc uploads
  onTaxDocUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const newDoc = { name: file.name.replace(/\.[^.]+$/, ''), type: 'Other', year: new Date().getFullYear().toString(), status: 'Pending', fileName: file.name };
    this.companyStore.updateTaxDocs([...this.taxDocs, newDoc]);
    (event.target as HTMLInputElement).value = '';
  }

  onTaxDocRowUpload(event: Event, rowIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const list = [...this.taxDocs];
    list[rowIndex] = { ...list[rowIndex], fileName: file.name };
    this.companyStore.updateTaxDocs(list);
    (event.target as HTMLInputElement).value = '';
  }

  removeTaxDocFile(rowIndex: number): void {
    const list = [...this.taxDocs];
    list[rowIndex] = { ...list[rowIndex], fileName: '' };
    this.companyStore.updateTaxDocs(list);
  }

  // Contract uploads
  onContractUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const newContract = { name: file.name.replace(/\.[^.]+$/, ''), counterparty: 'External Party', type: 'General', date: new Date().toISOString().split('T')[0], status: 'Draft', file: file.name };
    this.companyStore.updateContracts([...this.contractRecords, newContract]);
    (event.target as HTMLInputElement).value = '';
  }

  onContractRowUpload(event: Event, rowIndex: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const list = [...this.contractRecords];
    list[rowIndex] = { ...list[rowIndex], file: file.name };
    this.companyStore.updateContracts(list);
    (event.target as HTMLInputElement).value = '';
  }

  removeContractFile(rowIndex: number): void {
    const list = [...this.contractRecords];
    list[rowIndex] = { ...list[rowIndex], file: '' };
    this.companyStore.updateContracts(list);
  }

  // Logo uploads
  onLogoUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newLogo = { name: file.name.replace(/\.[^.]+$/, ''), format: 'General', dimensions: '—', fileType: file.name.split('.').pop()?.toUpperCase() || 'PNG', uploaded: new Date().toISOString().split('T')[0], bg: 'var(--primary-light)', dataUrl: reader.result as string };
      this.companyStore.updateLogos([...this.logos, newLogo]);
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  onLogoFileReplace(event: Event, index: number): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const list = [...this.logos];
      list[index] = { ...list[index], dataUrl: reader.result as string, fileType: file.name.split('.').pop()?.toUpperCase() || list[index].fileType };
      this.companyStore.updateLogos(list);
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  decodeSvg(dataUrl: string): string {
    try {
      if (dataUrl.startsWith('data:image/svg+xml;utf8,')) {
        return dataUrl.substring('data:image/svg+xml;utf8,'.length);
      }
      return '';
    } catch {
      return '';
    }
  }

  // Logos search & filters
  logoSearch = '';
  logoFormatFilter = '';
  logoTypeFilter = '';

  get filteredLogos() {
    return this.logos.filter(l => {
      const matchSearch = !this.logoSearch || l.name.toLowerCase().includes(this.logoSearch.toLowerCase());
      const matchFormat = !this.logoFormatFilter || l.format === this.logoFormatFilter;
      const matchType = !this.logoTypeFilter || l.fileType === this.logoTypeFilter;
      return matchSearch && matchFormat && matchType;
    });
  }

  downloadLogo(logo: any): void {
    alert(`Downloading logo: ${logo.name} (${logo.fileType})\n\n(In production: initiates download package)`);
  }

  deleteLogo(index: number): void {
    if (confirm('Are you sure you want to delete this logo?')) {
      this.companyStore.updateLogos(this.logos.filter((_, idx) => idx !== index));
    }
  }

  // Financial Documents Vault
  financialCategoryFilter = '';
  readonly financialCategories = [
    { id: 'P&L Reports', label: 'P&L Reports' },
    { id: 'Chart of Accounts', label: 'Chart of Accounts' },
    { id: 'Receipts', label: 'Receipts' },
    { id: 'Invoices', label: 'Invoices' },
    { id: 'Contractor Payments', label: 'Contractor Payments' },
    { id: 'Subscription Costs', label: 'Subscription Costs' },
    { id: 'Royalty Statements', label: 'Royalty Statements' },
    { id: 'Ad Spend by Platform', label: 'Ad Spend by Platform' },
    { id: 'Expense Logs', label: 'Expense Logs' },
  ];

  normalizeFinancialCategory(category: string): string {
    if (!category) return 'Other';
    const found = this.financialCategories.find(c => c.id === category);
    if (found) return found.id;
    return category.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF]\s*/u, '').trim() || category;
  }

  get financialDocs() { return this.companyStore.financialDocs(); }
  get filteredFinancialDocs() {
    if (!this.financialCategoryFilter) return this.financialDocs;
    return this.financialDocs.filter(d =>
      this.normalizeFinancialCategory(d.category) === this.financialCategoryFilter ||
      d.category === this.financialCategoryFilter
    );
  }

  onFinancialUpload(event: Event): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const newDoc = {
      month: new Date().toLocaleString('default', { month: 'short' }),
      year: new Date().getFullYear().toString(),
      category: this.financialCategoryFilter || 'P&L Reports',
      fileName: file.name,
      status: 'Approved',
      fileSize: (file.size / 1024).toFixed(0) + ' KB',
      uploadedDate: new Date().toISOString().split('T')[0]
    };
    this.companyStore.updateFinancialDocs([...this.financialDocs, newDoc]);
    (event.target as HTMLInputElement).value = '';
  }

  deleteFinancialDoc(doc: any): void {
    if (confirm('Are you sure you want to delete this financial report?')) {
      this.companyStore.updateFinancialDocs(this.financialDocs.filter(d => d.fileName !== doc.fileName));
    }
  }

  // Contract templates & editor modal
  selectedContractTemplate: any = null;
  contractEditText = '';
  contractEmailTo = '';
  contractEmailSubject = '';

  contractTemplates = [
    { name: 'Author-Publisher Agreement', category: 'Author', updated: '2024-01-01', content: '' },
    { name: 'Ghostwriter Work-for-Hire', category: 'Ghostwriter', updated: '2024-01-01', content: '' },
    { name: 'Developmental Editor Agreement', category: 'Editor', updated: '2024-01-01', content: '' },
    { name: 'Copy Editor Agreement', category: 'Editor', updated: '2024-01-01', content: '' },
    { name: 'Cover Designer Agreement', category: 'Cover Designer', updated: '2024-01-01', content: '' },
    { name: 'Narrator Royalty Share Agreement', category: 'Narrator', updated: '2024-01-01', content: '' },
    { name: 'Narrator Work-for-Hire Agreement', category: 'Narrator', updated: '2024-01-01', content: '' },
    { name: 'Book Formatter Agreement', category: 'Formatting', updated: '2024-01-01', content: '' },
    { name: 'Translation Agreement', category: 'Translation', updated: '2024-01-01', content: '' },
    { name: 'Affiliate Program Agreement', category: 'Affiliate', updated: '2024-01-01', content: '' },
    { name: 'Advertising Services Agreement', category: 'Advertising', updated: '2024-01-01', content: '' },
    { name: 'Co-Author Agreement', category: 'Co-Author', updated: '2024-01-01', content: '' },
    { name: 'Royalty Split Agreement', category: 'Royalty', updated: '2024-01-01', content: '' },
    { name: 'Non-Disclosure Agreement (NDA)', category: 'NDA', updated: '2024-01-01', content: '' },
    { name: 'DMCA Takedown Notice Template', category: 'DMCA', updated: '2024-01-01', content: '' },
  ];

  get filteredContractTemplates() {
    if (!this.contractCategoryFilter) return this.contractTemplates;
    return this.contractTemplates.filter(t => t.category === this.contractCategoryFilter);
  }

  viewContractTemplate(t: any): void {
    this.selectedContractTemplate = t;
    this.contractEmailTo = '';
    this.contractEmailSubject = `Contract Proposal: ${t.name}`;
    this.contractEditText = `AGREEMENT made this ${new Date().getDate()} day of ${new Date().toLocaleString('default', { month: 'long' })}, ${new Date().getFullYear()}, by and between Vance Publishing LLC (hereinafter "Publisher") and ______________________ (hereinafter "Contractor").

WHEREAS, Contractor agrees to provide services for: ${t.name}.

1. Services: Contractor shall perform services in a professional manner...
2. Compensation: Publisher shall pay Contractor the sum of $____ upon completion...
3. Rights: All work product is work-for-hire and assigned to Publisher.

IN WITNESS WHEREOF, the parties hereto have signed this Agreement.

Publisher: Vance Publishing LLC / Eleanor Vance
Contractor: ____________________________`;
  }

  closeContractModal(): void {
    this.selectedContractTemplate = null;
  }

  saveEditedContract(): void {
    const newContract = { name: this.selectedContractTemplate.name + ' (Customized)', counterparty: this.contractEmailTo || 'Custom Contractor', type: this.selectedContractTemplate.category, date: new Date().toISOString().split('T')[0], status: 'Draft', file: 'custom-contract.pdf' };
    this.companyStore.updateContracts([...this.contractRecords, newContract]);
    this.closeContractModal();
    alert('Contract customized copy has been saved to your active contracts list!');
  }

  useContractTemplate(t: any): void {
    const newContract = { name: t.name, counterparty: '', type: t.category, date: new Date().toISOString().split('T')[0], status: 'Template', file: '' };
    this.companyStore.updateContracts([...this.contractRecords, newContract]);
    alert(`Template "${t.name}" added to contracts directory.`);
  }

  // Vendor filter
  get filteredTeamMembers() {
    if (!this.vendorCategoryFilter) return this.teamMembers;
    return this.teamMembers.filter(m => m.role?.toLowerCase().includes(this.vendorCategoryFilter.toLowerCase()));
  }

  // SOP samples & interactive SOP editor modal
  selectedSop: any = null;
  sopSelectedIndex = -1;
  sopEditName = '';
  sopEditCategory = '';
  sopEditDescription = '';
  sopEditContent = '';

  sopFeedback = signal('');

  sopSamples = [
    { name: 'Monthly Bookkeeping SOP', category: 'Finance', description: 'Month-end reconciliation, expense categorization, and reporting process', content: `1. Reconcile monthly bills from editors, designers, and web developers.\n2. Confirm tasks are completed and approved.\n3. Open QuickBooks Online / Billing module.\n4. Create invoice matching the contractor rates ($250/hr for CPA, $800/cover for designer).\n5. Send draft invoice to CEO Eleanor Vance for approval.\n6. Issue payment via Chase Checking or PayPal.` },
    { name: 'Quarterly Tax Prep SOP', category: 'Finance', description: 'Steps for preparing and filing quarterly estimated tax payments', content: `1. Gather income statements and contractor 1099 records.\n2. Calculate estimated federal tax using standard tax schedules.\n3. Submit tax filing on IRS EFTPS platform.\n4. Log estimated payments under company financial logs.` },
    { name: 'Invoice Template & Process', category: 'Finance', description: 'Standard invoice creation, sending, and follow-up workflow', content: `1. Open standard Invoice layout.\n2. Prefill client details, billing period, and hours/deliverables.\n3. Verify rate compliance.\n4. Email generated invoice to target inbox.` },
    { name: 'Book Upload Checklist — KDP', category: 'Publishing', description: 'Step-by-step checklist for uploading and publishing on Amazon KDP', content: `1. Prepare final formatted EPUB and high-res cover JPG.\n2. Gather metadata (Title, Subtitle, Description, 7 Keywords, Bisac Categories).\n3. Log in to Amazon KDP.\n4. Upload files and enter metadata details.\n5. Set pricing ($4.99 Ebook, $14.99 Paperback).\n6. Check previewer to verify formatting.` },
    { name: 'Book Upload Checklist — Draft2Digital', category: 'Publishing', description: 'Complete upload and metadata checklist for Draft2Digital', content: `1. Access Draft2Digital author dashboard.\n2. Create a new book entry.\n3. Provide metadata consistent with Amazon upload.\n4. Choose wide distribution channels.\n5. Confirm royalty split arrangements if applicable.` },
    { name: 'Metadata Review SOP', category: 'Publishing', description: 'Standard process for reviewing and updating book metadata across platforms', content: `1. Quarterly review of active titles.\n2. Audit cover files, book descriptions, and keyword metrics.\n3. Adjust metadata to reflect current SEO trends.` },
    { name: '12-Week Book Launch SOP', category: 'Launch', description: 'Complete launch timeline from cover reveal to release day and beyond', content: `1. 12 Weeks Out: Send final manuscript to developmental editor.\n2. 8 Weeks Out: Cover reveal and set up pre-order on KDP.\n3. 4 Weeks Out: Send ARC copies via BookSprout / BookFunnel.\n4. 2 Weeks Out: Schedule newsletter announcement swaps.\n5. Launch Day: Send release email, launch ads (Facebook / BookBub).\n6. Post-Launch: Monitor sales rank and review acquisitions.` },
    { name: 'ARC Distribution SOP', category: 'Launch', description: 'Process for setting up, distributing, and tracking ARC readers', content: `1. Upload advance reader copy (ARC) EPUB to BookFunnel.\n2. Create secure landing page with review deadline rules.\n3. Submit ARC campaign to BookSprout list (limit 75 reviewers).\n4. Send download link to street team (45 members).\n5. Send follow-up email 1 week before release requesting reviews.\n6. Track posted reviews on Goodreads and Amazon.` },
    { name: 'BookBub Ad Submission SOP', category: 'Launch', description: 'Submission process, pricing strategy, and post-promo analysis', content: `1. Draft ad graphics (300x250).\n2. Choose comp author targets and bids.\n3. Submit for BookBub Featured Deal or launch self-serve ads.` },
    { name: 'Contractor Onboarding SOP', category: 'Contractor', description: 'Steps for onboarding new editors, designers, narrators, and VAs', content: `1. Conduct interview and confirm rates / timeline.\n2. Send standard Non-Disclosure Agreement (NDA) via DocuSign.\n3. Collect signed NDA and store in Owner Documents.\n4. Add contractor details to Team Directory.\n5. Create limited-access account in MailerLite or WordPress if needed.\n6. Set up communication channels (Slack / Email).` },
    { name: 'Contractor Offboarding SOP', category: 'Contractor', description: 'Checklist for offboarding contractors and revoking system access', content: `1. Notify contractor of contract completion.\n2. Revoke platform accounts and shared system passwords.\n3. Remove from communication channels.\n4. Verify all work deliverables are archived.\n5. Request final invoice and process payment.\n6. Send formal offboarding email reminding them of ongoing NDA.` },
    { name: 'Royalty Split Sheet Template', category: 'Contractor', description: 'Template for documenting and calculating royalty splits', content: `1. Log in to dashboard and export monthly sales statements.\n2. Compute royalties based on custom contract formulas.\n3. Prefill split sheet report.\n4. Email statements and process payouts.` },
    { name: 'Shopify Direct Sales SOP', category: 'Direct Sales', description: 'Setup, delivery, and customer service process for direct book sales', content: `1. Create a new digital product with cover, description, and pricing.\n2. Link the product to BookFunnel Shopify Integration.\n3. Upload EPUB/PDF to BookFunnel delivery folder.\n4. Test buying process using Stripe test mode.\n5. Confirm delivery email from BookFunnel is received within 5 minutes.` },
    { name: 'BookFunnel Delivery SOP', category: 'Direct Sales', description: 'Process for setting up and managing BookFunnel delivery workflows', content: `1. Integrate BookFunnel account with WooCommerce/Shopify.\n2. Map book SKUs to BookFunnel delivery items.\n3. Audit email templates for delivery links.` },
    { name: 'DMCA Takedown SOP', category: 'Legal', description: 'Step-by-step guide for filing DMCA takedown notices for pirated content', content: `1. Identify infringing website URL hosting pirated books.\n2. Use the DMCA Takedown Notice Template under Contract Templates.\n3. Fill in the book title, ASIN, and infringing link details.\n4. Find the hosting provider or domain registrar's abuse email using WHOIS.\n5. Send the completed DMCA notice to the abuse email address.\n6. Monitor URL for removal within 48-72 hours.` },
    { name: 'Copyright Registration SOP', category: 'Legal', description: 'Process for registering copyright with the U.S. Copyright Office', content: `1. Navigate to USCO portal.\n2. Fill out Literary Work registration form.\n3. Pay registration fee.\n4. Upload digital copy of manuscript.` }
  ];

  addSopFromSample(sample: { name: string; category: string; description: string; content: string }): void {
    if (!this.editMode()) {
      this.onEditToggle();
    }
    const existing = this.sopTemplates.find(s => s.name === sample.name);
    if (existing) {
      this.showSopFeedback(`"${sample.name}" is already in your SOPs — opening it for editing.`);
      this.editSop(existing, this.sopTemplates.indexOf(existing));
      return;
    }
    const newSop = {
      name: sample.name,
      category: sample.category,
      description: sample.description,
      updated: new Date().toISOString().split('T')[0],
      content: sample.content
    };
    const nextList = [...this.sopTemplates, newSop];
    this.companyStore.updateSops(nextList);
    this.showSopFeedback(`"${sample.name}" was added to your SOPs. Review and save below.`);
    this.editSop(newSop, nextList.length - 1);
  }

  createBlankSop(): void {
    if (!this.editMode()) return;
    const blank = {
      name: 'New SOP',
      category: 'General',
      description: '',
      updated: new Date().toISOString().split('T')[0],
      content: '1. \n2. \n3. '
    };
    const nextList = [...this.sopTemplates, blank];
    this.companyStore.updateSops(nextList);
    this.editSop(blank, nextList.length - 1);
  }

  private showSopFeedback(message: string): void {
    this.sopFeedback.set(message);
    setTimeout(() => this.sopFeedback.set(''), 5000);
  }

  viewSop(s: any): void {
    this.selectedSop = s;
    this.sopSelectedIndex = this.sopTemplates.findIndex(x => x.name === s.name);
    this.sopEditName = s.name;
    this.sopEditCategory = s.category || 'General';
    this.sopEditDescription = s.description || '';
    this.sopEditContent = s.content || '1. Read guidelines.\n2. Complete tasks.\n3. Log reports.';
  }

  editSop(s: any, _index?: number): void {
    this.viewSop(s);
  }

  closeSopModal(): void {
    this.selectedSop = null;
    this.sopSelectedIndex = -1;
  }

  saveSopContent(): void {
    if (!this.editMode()) return;
    const list = [...this.sopTemplates];
    const updatedSop = {
      name: this.sopEditName,
      category: this.sopEditCategory,
      description: this.sopEditDescription,
      updated: new Date().toISOString().split('T')[0],
      content: this.sopEditContent
    };

    if (this.sopSelectedIndex >= 0) {
      list[this.sopSelectedIndex] = updatedSop;
    } else {
      list.push(updatedSop);
    }
    this.companyStore.updateSops(list);
    this.closeSopModal();
    this.showSopFeedback(`"${updatedSop.name}" saved.`);
  }

  private readonly PIN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  // ── Tabs ──
  readonly activeTab = signal('overview');
  readonly tabs = [
    { id: 'overview',   icon: '📊', label: 'Overview' },
    { id: 'identity',   icon: '🏢', label: 'Business Identity' },
    { id: 'ownership',  icon: '👥', label: 'Ownership & Mgmt' },
    { id: 'legal',      icon: '⚖️', label: 'Corporate & Legal' },
    { id: 'banking',    icon: '🏦', label: 'Banking & Payment' },
    { id: 'tax',        icon: '🧾', label: 'Tax Information' },
    { id: 'platforms',  icon: '📚', label: 'Publishing Platforms' },
    { id: 'isbns',      icon: '🔢', label: 'ISBNs' },
    { id: 'contracts',  icon: '📝', label: 'Contracts' },
    { id: 'financial',  icon: '💰', label: 'Financial Records' },
    { id: 'team',       icon: '🤝', label: 'Team & Vendors' },
    { id: 'domains',    icon: '🌐', label: 'Website & Domains' },
    { id: 'comms',      icon: '📧', label: 'Communications' },
    { id: 'inventory',  icon: '📦', label: 'Inventory' },
    { id: 'security',   icon: '🔐', label: 'Security & Recovery' },
    { id: 'logos',      icon: '🎨', label: 'Logos' },
    { id: 'sops',       icon: '📋', label: 'SOPs' },
  ];

  // ── Computed stats ──
  readonly companyStatusOptions = vaultStatusOptions('company');
  readonly dmarcStatusOptions = vaultStatusOptions('dmarc');
  readonly fiscalYearEndOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  get companyStatusClass(): string {
    return vaultStatusClass(this.company().identity.companyStatus);
  }

  get catalogChartTotal(): number {
    return this.company().imprints.length + this.penNameCount + this.bookCount;
  }

  get activeContractCount(): number {
    return this.contractRecords.filter(c => c.status === 'Active').length;
  }

  catalogBarPct(value: number): number {
    const max = Math.max(this.company().imprints.length, this.penNameCount, this.bookCount, 1);
    return Math.round((value / max) * 100);
  }

  isbnBarPct(value: number): number {
    const total = Math.max(this.isbnRecords.length, 1);
    return Math.round((value / total) * 100);
  }

  contractBarPct(value: number): number {
    const total = Math.max(this.contractRecords.length, 1);
    return Math.round((value / total) * 100);
  }

  private readonly catalogCircumference = 2 * Math.PI * 46;

  catalogSegment(value: number): string {
    if (this.catalogChartTotal <= 0) return '0 289';
    const pct = value / this.catalogChartTotal;
    const len = pct * this.catalogCircumference;
    return `${len} ${this.catalogCircumference - len}`;
  }

  catalogOffset(priorTotal: number): number {
    if (this.catalogChartTotal <= 0) return 0;
    return (priorTotal / this.catalogChartTotal) * this.catalogCircumference;
  }

  platformStatus(p: { status?: string }): string {
    return p.status || 'active';
  }

  onIsbnStatusChange(record: { isbn: string; status: string; title?: string; imprint?: string; series?: string; pubDate?: string; asin?: string }, status: string): void {
    if (!this.editMode()) return;
    const idx = this.isbnRecords.findIndex(r => r.isbn === record.isbn);
    if (idx < 0) return;
    const list = [...this.isbnRecords];
    const updated = { ...list[idx], status: status as typeof list[number]['status'] };
    if (status === 'unused') {
      updated.title = '';
      updated.imprint = '';
      updated.series = '';
      updated.pubDate = '';
      updated.asin = '';
    }
    list[idx] = updated;
    this.companyStore.updateIsbnRecords(list);
  }

  onContractStatusChange(i: number, status: string): void {
    if (!this.editMode()) return;
    const list = [...this.contractRecords];
    const updated = { ...list[i], status };
    if (status === 'Active' && !updated.date) {
      updated.date = new Date().toISOString().split('T')[0];
    }
    list[i] = updated;
    this.companyStore.updateContracts(list);
  }

  patchFinancialDocStatus(fileName: string, status: string): void {
    if (!this.editMode()) return;
    this.companyStore.updateFinancialDocs(
      this.financialDocs.map(d => d.fileName === fileName ? { ...d, status } : d)
    );
  }

  get penNameCount(): number { return this.company().imprints.reduce((a, i) => a + i.penNames.length, 0); }
  get bookCount(): number { return this.company().imprints.reduce((a, i) => i.penNames.reduce((b, p) => p.series.reduce((c, s) => c + s.books.length, b), a), 0); }
  get isbnUsed(): number { return this.isbnRecords.filter(r => r.status === 'used').length; }
  get isbnAvailable(): number { return this.isbnRecords.filter(r => r.status === 'unused').length; }
  get isbnReserved(): number { return this.isbnRecords.filter(r => r.status === 'reserved').length; }
  get filteredSops() {
    let list = this.sopTemplates;
    if (this.sopCategoryFilter) list = list.filter((s: any) => s.category === this.sopCategoryFilter);
    if (this.sopFilter.trim()) {
      const q = this.sopFilter.toLowerCase();
      list = list.filter((s: any) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    return list;
  }

  get filteredSopStarterTemplates() {
    if (!this.sopCategoryFilter) return this.sopSamples;
    return this.sopSamples.filter(s => s.category === this.sopCategoryFilter);
  }

  // ── ISBN filter ──
  isbnFilterStatus = '';
  isbnFilterFormat = '';
  get filteredIsbns() {
    return this.isbnRecords.filter(r =>
      (!this.isbnFilterStatus || r.status === this.isbnFilterStatus) &&
      (!this.isbnFilterFormat || r.format === this.isbnFilterFormat)
    );
  }

  // ── PIN methods ──
  ngOnInit(): void {
    this.pinService.getStatus().subscribe({
      next: status => {
        this.isFirstTime = !status.hasPin;
        this.unlocked = status.isUnlocked;
        if (this.unlocked) this.resetPinTimeout();
      },
      error: () => { this.isFirstTime = true; this.unlocked = false; }
    });

    // Start reveal timer ticks
    this.timerIntervalRef = setInterval(() => {
      for (const key of Object.keys(this.revealTimers)) {
        if (this.revealTimers[key] > 0) {
          this.revealTimers[key]--;
        } else {
          delete this.revealTimers[key];
        }
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timerIntervalRef);
    clearTimeout(this.pinTimeoutRef);
  }

  private isSessionValid(): boolean {
    return this.unlocked;
  }

  private touchActivity(): void {
    if (!this.unlocked) return;
    this.pinService.touch().subscribe();
    this.resetPinTimeout();
  }

  private checkPinExpiry(): void {
    if (!this.unlocked) return;
    this.pinService.getStatus().subscribe({
      next: status => {
        if (!status.isUnlocked) this.lockVault(false);
      }
    });
  }

  private pinTimeoutRef: any;
  /** Reset PIN auto-lock timer (10 minutes) */
  private resetPinTimeout(): void {
    clearTimeout(this.pinTimeoutRef);
    this.pinTimeoutRef = setTimeout(() => this.checkPinExpiry(), this.PIN_TIMEOUT_MS);
  }

  onPinInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.pinDigits[index] = val;
    this.pinError = false;
    if (val && index < 3) {
      const next = document.getElementById('pin-' + (index + 1)) as HTMLInputElement;
      if (next) next.focus();
    }
  }

  onPinKey(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.pinDigits[index] && index > 0) {
      const prev = document.getElementById('pin-' + (index - 1)) as HTMLInputElement;
      if (prev) { prev.focus(); this.pinDigits[index - 1] = ''; }
    }
    if (event.key === 'Enter') this.unlock();
  }

  unlock(): void {
    const entered = this.pinDigits.join('');
    if (this.isFirstTime) {
      const confirmed = this.confirmPinDigits.join('');
      if (entered.length < 4) { this.pinError = true; return; }
      if (entered !== confirmed) {
        this.pinMismatch = true;
        this.confirmPinDigits = ['', '', '', ''];
        setTimeout(() => { const el = document.getElementById('cpin-0') as HTMLInputElement; if (el) el.focus(); }, 50);
        return;
      }
      this.pinService.setup(entered).subscribe({
        next: () => {
          this.isFirstTime = false;
          this.unlocked = true;
          this.pinMismatch = false;
          this.touchActivity();
        },
        error: () => { this.pinError = true; }
      });
    } else {
      this.pinService.verify(entered).subscribe({
        next: () => {
          this.unlocked = true;
          this.pinError = false;
          this.touchActivity();
        },
        error: () => {
          this.pinError = true;
          this.pinDigits = ['', '', '', ''];
          setTimeout(() => { const el = document.getElementById('pin-0') as HTMLInputElement; if (el) el.focus(); }, 50);
        }
      });
    }
  }

  cancelLock(): void {
    // Navigate back — just unlock without PIN (cancel = go back to previous page)
    window.history.back();
  }

  onConfirmPinInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.confirmPinDigits[index] = val;
    this.pinMismatch = false;
    if (val && index < 3) {
      const next = document.getElementById('cpin-' + (index + 1)) as HTMLInputElement;
      if (next) next.focus();
    }
  }

  onConfirmPinKey(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.confirmPinDigits[index] && index > 0) {
      const prev = document.getElementById('cpin-' + (index - 1)) as HTMLInputElement;
      if (prev) { prev.focus(); this.confirmPinDigits[index - 1] = ''; }
    }
    if (event.key === 'Enter') this.unlock();
  }

  lockVault(callApi = true): void {
    this.unlocked = false;
    this.pinDigits = ['', '', '', ''];
    this.pinError = false;
    this.revealTimers = {};
    clearTimeout(this.pinTimeoutRef);
    if (callApi) this.pinService.lock().subscribe();
  }

  changePin(): void {
    this.pinService.verify(this.currentPinInput).subscribe({
      next: () => {
        if (!/^\d{4}$/.test(this.newPinInput)) {
          this.pinChangeError = 'New PIN must be exactly 4 digits.';
          return;
        }
        this.pinService.change(this.newPinInput).subscribe({
          next: () => {
            this.pinChangeSuccess = true;
            this.pinChangeError = '';
            this.currentPinInput = '';
            this.newPinInput = '';
            setTimeout(() => { this.changingPin = false; this.pinChangeSuccess = false; }, 2000);
          },
          error: () => { this.pinChangeError = 'Failed to update PIN.'; }
        });
      },
      error: () => { this.pinChangeError = 'Current PIN is incorrect.'; }
    });
  }

  maskValue(val: string): string {
    if (!val) return '—';
    if (val.includes('@')) return val.split('@')[0].slice(0, 2) + '****@' + val.split('@')[1];
    return val.slice(0, 2) + '****';
  }

  scEmailHref(email: string): string {
    return `https://mail.scribecount.com/compose?to=${encodeURIComponent(email)}`;
  }

  scEmailHrefWithPrefill(to: string, subject: string, body: string): string {
    return `https://mail.scribecount.com/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async onExcelImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importMessage = '';
    this.importError = false;
    try {
      const rows = await this.excelImport.parseFile(file);
      const result = this.vs.importFieldRows(rows);
      this.importMessage = `Imported ${result.applied} field(s).` +
        (result.skipped.length ? ` Skipped unknown: ${result.skipped.slice(0, 5).join(', ')}${result.skipped.length > 5 ? '…' : ''}` : '');
      this.importError = result.applied === 0;
    } catch (e: unknown) {
      this.importMessage = e instanceof Error ? e.message : 'Import failed';
      this.importError = true;
    }
    input.value = '';
  }

  get copyrightOffice() { return this.companyStore.copyrightOffice; }

  get copyrightOfficeUrl(): string {
    const office = this.companyStore.copyrightOffice();
    if (office.country === 'OTHER') return office.customUrl?.trim() || '';
    return this.copyrightLinks[office.country] || '';
  }

  patchCopyrightCountry(country: string): void {
    if (!this.editMode()) return;
    const current = this.companyStore.copyrightOffice();
    this.companyStore.updateCopyrightOffice({
      country,
      customUrl: country === 'OTHER' ? (current.customUrl || '') : ''
    });
  }

  patchCopyrightCustomUrl(url: string): void {
    if (!this.editMode()) return;
    const current = this.companyStore.copyrightOffice();
    this.companyStore.updateCopyrightOffice({ ...current, customUrl: url });
  }

  onEditToggle(): void {
    if (this.editMode()) {
      this.vs.flush();
      this.companyStore.flush();
      this.editMode.set(false);
    } else {
      this.vs.setDeferPersist(true);
      this.companyStore.setDeferPersist(true);
      this.editMode.set(true);
    }
  }

  onCompanyStatus(value: string): void {
    if (!this.editMode()) return;
    this.vs.patchIdentity({ companyStatus: value as CompanyIdentity['companyStatus'] });
  }

  onCompanyAvatar(event: Event): void {
    if (!this.editMode()) return;
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setCompanyAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  deleteAllVaultData(): void {
    if (!confirm('Delete all company file data (owners, platforms, ISBNs, contracts, etc.)? This cannot be undone.')) return;
    this.vs.setDeferPersist(false);
    this.companyStore.setDeferPersist(false);
    this.companyStore.clearAll();
    this.editMode.set(false);
  }

  @HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:mousemove')
  @HostListener('document:scroll')
  onUserActivity(): void {
    if (this.unlocked) this.touchActivity();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'visible') this.checkPinExpiry();
  }
}
