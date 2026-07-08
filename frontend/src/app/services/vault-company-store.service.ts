import { Injectable, signal, inject } from '@angular/core';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { ApiService } from './api.service';

export interface VaultPlatform {
  name: string;
  status?: 'active' | 'pending' | 'suspended' | 'inactive';
  owner: string;
  email: string;
  phone: string;
  payout: string;
  taxProfile: string;
  username: string;
  password: string;
  notes: string;
  showUser: boolean;
  showPass: boolean;
  accountRep: string;
  repEmail: string;
  accountId: string;
  customerServiceUrl?: string;
}

export interface OwnerDocRef {
  fileId: number;
  fileName: string;
  url: string;
}

export interface VaultOwnerProfile {
  name: string;
  role: string;
  ownershipPct: string;
  email: string;
  phone: string;
  canSign: boolean;
  canManageFinances: boolean;
  showNda: boolean;
  docs?: Record<string, OwnerDocRef | string>;
}

export interface VaultTeamMember {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  contractDate: string;
  rate: string;
  notes: string;
}

export interface VaultBankAccount {
  bank: string;
  nickname: string;
  account: string;
  routing: string;
  wire: string;
  swift: string;
  showAccount: boolean;
  showRouting: boolean;
}

export interface VaultTaxDoc {
  name: string;
  type: string;
  year: string;
  status: string;
  fileName?: string;
  fileUrl?: string;
  fileId?: number;
}

export interface VaultIsbnRecord {
  isbn: string;
  format: string;
  title: string;
  imprint: string;
  pubDate: string;
  series: string;
  trimSize: string;
  edition: string;
  asin: string;
  status: 'used' | 'unused' | 'reserved';
}

export interface VaultIsbnBlock {
  imprintName: string;
  isbnPrefix: string;
  isbnBlockPurchased: string;
  isbnBlockCount: string;
  isbnsAssigned: string;
  isbnsRemaining: string;
}

export interface VaultContractRecord {
  name: string;
  counterparty: string;
  date: string;
  type: string;
  status: string;
  file: string;
  fileUrl?: string;
  fileId?: number;
}

export interface VaultFinancialRecord {
  month: string;
  revenue: string;
  expenses: string;
  net: string;
}

export interface VaultDomainRecord {
  domain: string;
  registrar: string;
  renewal: string;
  host: string;
  dns: string;
  technicalNotes?: string;
  ssl: string;
  cms: string;
  contact: string;
}

export interface VaultInventoryItem {
  sku: string;
  title: string;
  format: string;
  stock: number;
  reorderPoint: number;
  printer: string;
}

export interface VaultSecurityEntry {
  resource: string;
  owner: string;
  accessLevel: string;
  twoFa: string;
  recoveryEmail: string;
  notes: string;
}

export interface VaultLogo {
  name: string;
  format: string;
  dimensions: string;
  fileType: string;
  uploaded: string;
  bg: string;
  dataUrl?: string;
  /** Server-stored or remote URL used for display/download when not a data URL. */
  sourceUrl?: string;
  fileId?: number;
}

export interface VaultSopTemplate {
  name: string;
  description: string;
  updated: string;
  category?: string;
  content?: string;
}

export interface VaultCorporateDoc {
  document: string;
  fileRef: string;
  status: string;
  fileUrl?: string;
  fileId?: number;
}

export interface VaultCommunications {
  senderDomain: string;
  emailPlatform: string;
  spfRecord: string;
  dkimStatus: string;
  dmarcStatus: string;
  newsletterListSize: string;
  supportInbox: string;
  poBox: string;
  apiKey: string;
  smtpPassword: string;
}

export interface VaultAutomation {
  name: string;
  type: string;
  platform: string;
  status: string;
  notes: string;
}

export interface VaultInventoryFulfillment {
  fulfillmentPartner: string;
  shippingAccount: string;
  packagingVendor: string;
  deliveryPolicy: string;
}

export interface VaultSecurityNotes {
  emergencyAccess: string;
  offboardingSteps: string;
}

export interface VaultTaxRegistrations {
  einConfirmation: string;
  einConfirmationUrl?: string;
  einConfirmationFileId?: number;
  salesTaxRegistrations: string;
  vatGst: string;
  resaleCertificates: string;
  resaleCertificatesUrl?: string;
  resaleCertificatesFileId?: number;
}

export interface VaultFinancialDoc {
  month: string;
  year: string;
  category: string;
  fileName: string;
  status: string;
  fileSize?: string;
  uploadedDate?: string;
  fileUrl?: string;
  fileId?: number;
}

export interface VaultCopyrightOffice {
  country: string;
  customUrl?: string;
}

const EMPTY_COMMUNICATIONS: VaultCommunications = {
  senderDomain: '', emailPlatform: '', spfRecord: '', dkimStatus: '', dmarcStatus: '',
  newsletterListSize: '', supportInbox: '', poBox: '', apiKey: '', smtpPassword: ''
};

const EMPTY_INVENTORY_FULFILLMENT: VaultInventoryFulfillment = {
  fulfillmentPartner: '', shippingAccount: '', packagingVendor: '', deliveryPolicy: ''
};

const EMPTY_SECURITY_NOTES: VaultSecurityNotes = {
  emergencyAccess: '', offboardingSteps: ''
};

const EMPTY_TAX_REGISTRATIONS: VaultTaxRegistrations = {
  einConfirmation: '', salesTaxRegistrations: '', vatGst: '', resaleCertificates: ''
};

@Injectable({ providedIn: 'root' })
export class VaultCompanyStoreService {
  private readonly api = inject(ApiService);
  readonly ownerProfiles = signal<VaultOwnerProfile[]>([]);
  readonly publishingPlatforms = signal<VaultPlatform[]>([]);
  readonly teamMembers = signal<VaultTeamMember[]>([]);
  readonly bankAccounts = signal<VaultBankAccount[]>([]);
  readonly paymentPlatforms = signal<VaultPlatform[]>([]);
  readonly taxDocs = signal<VaultTaxDoc[]>([]);
  readonly isbnRecords = signal<VaultIsbnRecord[]>([]);
  readonly isbnBlocks = signal<VaultIsbnBlock[]>([]);
  readonly contractRecords = signal<VaultContractRecord[]>([]);
  readonly financialRecords = signal<VaultFinancialRecord[]>([]);
  readonly domainRecords = signal<VaultDomainRecord[]>([]);
  readonly inventoryItems = signal<VaultInventoryItem[]>([]);
  readonly securityEntries = signal<VaultSecurityEntry[]>([]);
  readonly logos = signal<VaultLogo[]>([]);
  readonly sopTemplates = signal<VaultSopTemplate[]>([]);
  readonly corporateDocs = signal<VaultCorporateDoc[]>([]);
  readonly communications = signal<VaultCommunications>({ ...EMPTY_COMMUNICATIONS });
  readonly automations = signal<VaultAutomation[]>([]);
  readonly inventoryFulfillment = signal<VaultInventoryFulfillment>({ ...EMPTY_INVENTORY_FULFILLMENT });
  readonly securityNotes = signal<VaultSecurityNotes>({ ...EMPTY_SECURITY_NOTES });
  readonly taxRegistrations = signal<VaultTaxRegistrations>({ ...EMPTY_TAX_REGISTRATIONS });
  readonly financialDocs = signal<VaultFinancialDoc[]>([]);
  readonly copyrightOffice = signal<VaultCopyrightOffice>({ country: 'US', customUrl: '' });
  private deferPersist = false;
  readonly vendorCategoryFilter = signal('');

  loadFromApi(): Observable<void> {
    return this.api.get<VaultExtrasPayload>('/vault-extras').pipe(
      tap(data => {
        if (data && Object.keys(data).length > 0) {
          this.applyPayload(data);
        }
      }),
      map(() => void 0),
      catchError(err => {
        console.error('Failed to load vault extras', err);
        return of(void 0);
      })
    );
  }

  clearAll(): void {
    this.ownerProfiles.set([]);
    this.publishingPlatforms.set([]);
    this.teamMembers.set([]);
    this.bankAccounts.set([]);
    this.paymentPlatforms.set([]);
    this.taxDocs.set([]);
    this.isbnRecords.set([]);
    this.isbnBlocks.set([]);
    this.contractRecords.set([]);
    this.financialRecords.set([]);
    this.domainRecords.set([]);
    this.inventoryItems.set([]);
    this.securityEntries.set([]);
    this.logos.set([]);
    this.sopTemplates.set([]);
    this.corporateDocs.set([]);
    this.communications.set({ ...EMPTY_COMMUNICATIONS });
    this.automations.set([]);
    this.inventoryFulfillment.set({ ...EMPTY_INVENTORY_FULFILLMENT });
    this.securityNotes.set({ ...EMPTY_SECURITY_NOTES });
    this.taxRegistrations.set({ ...EMPTY_TAX_REGISTRATIONS });
    this.financialDocs.set([]);
    this.copyrightOffice.set({ country: 'US', customUrl: '' });
    this.persist();
  }

  clearIsbnRecords(): void {
    this.isbnRecords.set([]);
    this.persist();
  }

  private applyPayload(data: VaultExtrasPayload): void {
    if (data.ownerProfiles) this.ownerProfiles.set(data.ownerProfiles);
    if (data.publishingPlatforms) this.publishingPlatforms.set(data.publishingPlatforms);
    if (data.teamMembers) this.teamMembers.set(data.teamMembers);
    if (data.bankAccounts) this.bankAccounts.set(data.bankAccounts);
    if (data.paymentPlatforms) this.paymentPlatforms.set(data.paymentPlatforms);
    if (data.taxDocs) this.taxDocs.set(data.taxDocs);
    if (data.isbnRecords) this.isbnRecords.set(data.isbnRecords);
    if (data.isbnBlocks) this.isbnBlocks.set(data.isbnBlocks);
    if (data.contractRecords) this.contractRecords.set(data.contractRecords);
    if (data.financialRecords) this.financialRecords.set(data.financialRecords);
    if (data.domainRecords) this.domainRecords.set(data.domainRecords);
    if (data.inventoryItems) this.inventoryItems.set(data.inventoryItems);
    if (data.securityEntries) this.securityEntries.set(data.securityEntries);
    if (data.logos) this.logos.set(data.logos);
    if (data.sopTemplates) this.sopTemplates.set(data.sopTemplates);
    if (data.corporateDocs) this.corporateDocs.set(data.corporateDocs);
    if (data.communications) this.communications.set(data.communications);
    if (data.automations) this.automations.set(data.automations);
    if (data.inventoryFulfillment) this.inventoryFulfillment.set(data.inventoryFulfillment);
    if (data.securityNotes) this.securityNotes.set(data.securityNotes);
    if (data.taxRegistrations) this.taxRegistrations.set(data.taxRegistrations);
    if (data.financialDocs) this.financialDocs.set(data.financialDocs);
    if (data.copyrightOffice) this.copyrightOffice.set(data.copyrightOffice);
  }

  setDeferPersist(defer: boolean): void {
    this.deferPersist = defer;
  }

  flush(): void {
    this.deferPersist = false;
    this.persist();
  }

  updateCopyrightOffice(v: VaultCopyrightOffice): void {
    this.copyrightOffice.set(v);
    this.persist();
  }

  private persist(): void {
    if (this.deferPersist) return;
    const data: VaultExtrasPayload = {
      ownerProfiles: this.ownerProfiles(),
      publishingPlatforms: this.publishingPlatforms(),
      teamMembers: this.teamMembers(),
      bankAccounts: this.bankAccounts(),
      paymentPlatforms: this.paymentPlatforms(),
      taxDocs: this.taxDocs(),
      isbnRecords: this.isbnRecords(),
      isbnBlocks: this.isbnBlocks(),
      contractRecords: this.contractRecords(),
      financialRecords: this.financialRecords(),
      domainRecords: this.domainRecords(),
      inventoryItems: this.inventoryItems(),
      securityEntries: this.securityEntries(),
      logos: this.logos(),
      sopTemplates: this.sopTemplates(),
      corporateDocs: this.corporateDocs(),
      communications: this.communications(),
      automations: this.automations(),
      inventoryFulfillment: this.inventoryFulfillment(),
      securityNotes: this.securityNotes(),
      taxRegistrations: this.taxRegistrations(),
      financialDocs: this.financialDocs(),
      copyrightOffice: this.copyrightOffice(),
    };
    this.api.put('/vault-extras', data).subscribe({
      error: err => console.error('Failed to save vault extras', err)
    });
  }

  updateOwners(v: VaultOwnerProfile[]): void { this.ownerProfiles.set(v); this.persist(); }
  updatePlatforms(v: VaultPlatform[]): void { this.publishingPlatforms.set(v); this.persist(); }
  updateTeam(v: VaultTeamMember[]): void { this.teamMembers.set(v); this.persist(); }
  updateBankAccounts(v: VaultBankAccount[]): void { this.bankAccounts.set(v); this.persist(); }
  updatePaymentPlatforms(v: VaultPlatform[]): void { this.paymentPlatforms.set(v); this.persist(); }
  updateTaxDocs(v: VaultTaxDoc[]): void { this.taxDocs.set(v); this.persist(); }
  updateIsbnRecords(v: VaultIsbnRecord[]): void { this.isbnRecords.set(v); this.persist(); }
  updateIsbnBlocks(v: VaultIsbnBlock[]): void { this.isbnBlocks.set(v); this.persist(); }
  updateContracts(v: VaultContractRecord[]): void { this.contractRecords.set(v); this.persist(); }
  updateFinancialRecords(v: VaultFinancialRecord[]): void { this.financialRecords.set(v); this.persist(); }
  updateDomains(v: VaultDomainRecord[]): void { this.domainRecords.set(v); this.persist(); }
  updateInventory(v: VaultInventoryItem[]): void { this.inventoryItems.set(v); this.persist(); }
  updateSecurity(v: VaultSecurityEntry[]): void { this.securityEntries.set(v); this.persist(); }
  updateLogos(v: VaultLogo[]): void { this.logos.set(v); this.persist(); }
  updateSops(v: VaultSopTemplate[]): void { this.sopTemplates.set(v); this.persist(); }
  updateCorporateDocs(v: VaultCorporateDoc[]): void { this.corporateDocs.set(v); this.persist(); }
  updateCommunications(v: VaultCommunications): void { this.communications.set(v); this.persist(); }
  updateAutomations(v: VaultAutomation[]): void { this.automations.set(v); this.persist(); }
  updateInventoryFulfillment(v: VaultInventoryFulfillment): void { this.inventoryFulfillment.set(v); this.persist(); }
  updateSecurityNotes(v: VaultSecurityNotes): void { this.securityNotes.set(v); this.persist(); }
  updateTaxRegistrations(v: VaultTaxRegistrations): void { this.taxRegistrations.set(v); this.persist(); }
  updateFinancialDocs(v: VaultFinancialDoc[]): void { this.financialDocs.set(v); this.persist(); }
  updateBoxSets(_penNameId: string, _seriesId: string, _boxSets: unknown[]): void { this.persist(); }
}

interface VaultExtrasPayload {
  ownerProfiles?: VaultOwnerProfile[];
  publishingPlatforms?: VaultPlatform[];
  teamMembers?: VaultTeamMember[];
  bankAccounts?: VaultBankAccount[];
  paymentPlatforms?: VaultPlatform[];
  taxDocs?: VaultTaxDoc[];
  isbnRecords?: VaultIsbnRecord[];
  isbnBlocks?: VaultIsbnBlock[];
  contractRecords?: VaultContractRecord[];
  financialRecords?: VaultFinancialRecord[];
  domainRecords?: VaultDomainRecord[];
  inventoryItems?: VaultInventoryItem[];
  securityEntries?: VaultSecurityEntry[];
  logos?: VaultLogo[];
  sopTemplates?: VaultSopTemplate[];
  corporateDocs?: VaultCorporateDoc[];
  communications?: VaultCommunications;
  automations?: VaultAutomation[];
  inventoryFulfillment?: VaultInventoryFulfillment;
  securityNotes?: VaultSecurityNotes;
  taxRegistrations?: VaultTaxRegistrations;
  financialDocs?: VaultFinancialDoc[];
  copyrightOffice?: VaultCopyrightOffice;
}
