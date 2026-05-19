import { Injectable, signal } from '@angular/core';

export interface VaultPlatform {
  name: string;
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

export interface VaultOwnerProfile {
  name: string;
  role: string;
  ownershipPct: string;
  email: string;
  phone: string;
  canSign: boolean;
  canManageFinances: boolean;
  showNda: boolean;
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

export interface VaultContractRecord {
  name: string;
  counterparty: string;
  date: string;
  type: string;
  status: string;
  file: string;
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
}

export interface VaultSopTemplate {
  name: string;
  description: string;
  updated: string;
}

export interface VaultCorporateDoc {
  document: string;
  fileRef: string;
  status: string;
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
  salesTaxRegistrations: string;
  vatGst: string;
  resaleCertificates: string;
}

const STORAGE_KEY = 'av_vault_company_extras_v1';

@Injectable({ providedIn: 'root' })
export class VaultCompanyStoreService {
  readonly ownerProfiles = signal<VaultOwnerProfile[]>(this.load('ownerProfiles', [
    { name: 'Eleanor Vance', role: 'Managing Member / CEO', ownershipPct: '100%', email: 'eleanor@authorvaultpress.com', phone: '+1 (212) 555-0147', canSign: true, canManageFinances: true, showNda: true },
  ]));

  readonly publishingPlatforms = signal<VaultPlatform[]>(this.load('publishingPlatforms', [
    { name: 'Amazon KDP', owner: 'Eleanor Vance', email: 'kdp@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'kdp@authorvaultpress.com', password: 'KDP!2024#Vault', notes: '7 titles live. KDP Select enrolled for 3 titles.', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: 'KDP-VANCE-001', customerServiceUrl: 'https://kdp.amazon.com/help' },
    { name: 'Draft2Digital', owner: 'Eleanor Vance', email: 'd2d@authorvaultpress.com', phone: '', payout: 'PayPal', taxProfile: 'Vance Publishing LLC', username: 'd2d@authorvaultpress.com', password: 'D2D!2024#Wide', notes: 'Wide distribution.', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '', customerServiceUrl: 'https://www.draft2digital.com/contact/' },
    { name: 'IngramSpark', owner: 'Eleanor Vance', email: 'ingram@authorvaultpress.com', phone: '', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'ingram@authorvaultpress.com', password: 'Ingr@m2024!', notes: 'Print distribution.', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '', customerServiceUrl: 'https://www.ingramspark.com/contact' },
    { name: 'Kobo Writing Life', owner: 'Eleanor Vance', email: 'kobo@authorvaultpress.com', phone: '', payout: 'PayPal', taxProfile: 'Vance Publishing LLC', username: 'kobo@authorvaultpress.com', password: 'K0bo!2024#WL', notes: 'Direct Kobo uploads.', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '', customerServiceUrl: 'https://www.kobo.com/us/en/help' },
    { name: 'Shopify (Direct Store)', owner: 'Eleanor Vance', email: 'admin@authorvaultpress.com', phone: '', payout: 'Stripe', taxProfile: 'Vance Publishing LLC', username: 'admin@authorvaultpress.com', password: 'Sh0p!fy2024#', notes: 'authorvaultpress.com/shop', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '', customerServiceUrl: 'https://help.shopify.com/' },
  ]));

  readonly teamMembers = signal<VaultTeamMember[]>(this.load('teamMembers', [
    { name: 'Sarah Mitchell', role: 'Developmental Editor', company: 'Mitchell Editing', email: 'sarah@mitchellediting.com', phone: '', contractDate: '2023-01-10', rate: '$2,500/book', notes: 'Excellent. Rehire.' },
    { name: 'James Okafor', role: 'Cover Designer', company: 'Okafor Design Studio', email: 'james@okafor.design', phone: '', contractDate: '2023-02-01', rate: '$800/cover', notes: 'Fast turnaround.' },
    { name: 'Sandra Mitchell, CPA', role: 'Accountant / CPA', company: 'Mitchell CPA', email: 'sandra@mitchellcpa.com', phone: '+1 (212) 555-0200', contractDate: '2021-04-01', rate: '$250/hr', notes: 'Annual tax prep.' },
    { name: 'James Chen, Esq.', role: 'Attorney', company: 'Chen Publishing Law', email: 'jchen@publishinglaw.com', phone: '+1 (212) 555-0300', contractDate: '2021-03-15', rate: '$350/hr', notes: 'Contract review.' },
    { name: 'Alex Rivera', role: 'Virtual Assistant', company: 'Freelance', email: 'alex@vaservices.com', phone: '', contractDate: '2023-09-01', rate: '$25/hr', notes: 'Social media scheduling.' },
  ]));

  readonly bankAccounts = signal<VaultBankAccount[]>(this.load('bankAccounts', [
    { bank: 'Chase Business', nickname: 'Operating Checking', account: '123456784821', routing: '021000021', wire: '021000021', swift: 'CHASUS33', showAccount: false, showRouting: false },
    { bank: 'Chase Business', nickname: 'Savings Reserve', account: '987654327733', routing: '021000021', wire: '', swift: 'CHASUS33', showAccount: false, showRouting: false },
  ]));

  readonly paymentPlatforms = signal<VaultPlatform[]>(this.load('paymentPlatforms', [
    { name: 'Stripe', owner: 'Eleanor Vance', email: 'admin@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'admin@authorvaultpress.com', password: 'Str!pe2024#Vault', notes: 'Primary payment processor for direct sales', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: 'acct_1ABC' },
    { name: 'PayPal Business', owner: 'Eleanor Vance', email: 'paypal@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'paypal@authorvaultpress.com', password: 'P@yP@l2024!Vault', notes: 'Used for contractor payments', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '' },
    { name: 'Wise', owner: 'Eleanor Vance', email: 'wise@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'wise@authorvaultpress.com', password: 'W!se2024#Secure', notes: 'International contractor payments', showUser: false, showPass: false, accountRep: '', repEmail: '', accountId: '' },
  ]));

  readonly taxDocs = signal<VaultTaxDoc[]>(this.load('taxDocs', [
    { name: 'EIN Confirmation (CP575)', type: 'Federal', year: '2021', status: 'Filed' },
    { name: 'Form 1120-S (S-Corp Return)', type: 'Federal', year: '2023', status: 'Filed' },
    { name: 'Form 1120-S (S-Corp Return)', type: 'Federal', year: '2022', status: 'Filed' },
    { name: 'W-9 (Company)', type: 'Federal', year: '2024', status: 'On File' },
    { name: '1099-NEC (Contractors)', type: 'Federal', year: '2023', status: 'Filed' },
    { name: 'Sales Tax Return — NY', type: 'State', year: '2023', status: 'Filed' },
    { name: 'Sales Tax Return — DE', type: 'State', year: '2023', status: 'Filed' },
    { name: 'Amazon KDP Tax Form', type: 'Platform', year: '2023', status: 'On File' },
    { name: 'Draft2Digital Tax Form', type: 'Platform', year: '2023', status: 'On File' },
    { name: 'Q1 2024 Estimated Tax', type: 'Federal', year: '2024', status: 'Filed' },
    { name: 'Q2 2024 Estimated Tax', type: 'Federal', year: '2024', status: 'Filed' },
    { name: 'Q3 2024 Estimated Tax', type: 'Federal', year: '2024', status: 'Pending' },
  ]));

  readonly isbnRecords = signal<VaultIsbnRecord[]>(this.load('isbnRecords', [
    { isbn: '979-8-XXXX-0001-0', format: 'Ebook', title: 'The Midnight Library', imprint: 'AuthorVault Press', pubDate: '2023-06-15', series: 'Hearts of Manhattan', trimSize: '', edition: '1st', asin: 'B0BK1MOCK', status: 'used' },
    { isbn: '979-8-XXXX-0001-1', format: 'Paperback 5.5x8.5', title: 'The Midnight Library', imprint: 'AuthorVault Press', pubDate: '2023-06-15', series: 'Hearts of Manhattan', trimSize: '5.5x8.5', edition: '1st', asin: '', status: 'used' },
    { isbn: '979-8-XXXX-0001-3', format: 'Audiobook', title: 'The Midnight Library', imprint: 'AuthorVault Press', pubDate: '2023-09-01', series: 'Hearts of Manhattan', trimSize: '', edition: '1st', asin: '', status: 'used' },
    { isbn: '979-8-XXXX-0002-0', format: 'Ebook', title: 'Shadow Protocol', imprint: 'AuthorVault Press', pubDate: '2023-11-01', series: 'Hearts of Manhattan', trimSize: '', edition: '1st', asin: 'B0BK2MOCK', status: 'used' },
    { isbn: '979-8-XXXX-0002-1', format: 'Paperback 5.5x8.5', title: 'Shadow Protocol', imprint: 'AuthorVault Press', pubDate: '2023-11-01', series: 'Hearts of Manhattan', trimSize: '5.5x8.5', edition: '1st', asin: '', status: 'used' },
    { isbn: '979-8-XXXX-0003-0', format: 'Ebook', title: 'Salt & Starlight', imprint: 'AuthorVault Press', pubDate: '2024-02-14', series: 'Coastal Dreams', trimSize: '', edition: '1st', asin: 'B0BK4MOCK', status: 'used' },
    { isbn: '979-8-XXXX-0003-1', format: 'Paperback 6x9', title: 'Salt & Starlight', imprint: 'AuthorVault Press', pubDate: '2024-02-14', series: 'Coastal Dreams', trimSize: '6x9', edition: '1st', asin: '', status: 'used' },
    { isbn: '979-8-XXXX-0004-0', format: 'Ebook', title: 'Throne of Ashes', imprint: 'AuthorVault Press', pubDate: '2024-01-10', series: 'The Obsidian Crown', trimSize: '', edition: '1st', asin: 'B0BK5MOCK', status: 'used' },
    { isbn: '979-8-XXXX-0004-1', format: 'Hardcover', title: 'Throne of Ashes', imprint: 'AuthorVault Press', pubDate: '2024-01-10', series: 'The Obsidian Crown', trimSize: '6x9', edition: '1st', asin: '', status: 'used' },
    { isbn: '979-8-XXXX-0005-0', format: 'Ebook', title: 'Garden of Stars', imprint: 'AuthorVault Press', pubDate: '', series: 'Hearts of Manhattan', trimSize: '', edition: '1st', asin: '', status: 'reserved' },
    { isbn: '979-8-XXXX-0005-1', format: 'Paperback 5.5x8.5', title: 'Garden of Stars', imprint: 'AuthorVault Press', pubDate: '', series: 'Hearts of Manhattan', trimSize: '5.5x8.5', edition: '1st', asin: '', status: 'reserved' },
    { isbn: '979-8-XXXX-0006-0', format: 'Box Set', title: 'Hearts of Manhattan Box Set 1-3', imprint: 'AuthorVault Press', pubDate: '', series: 'Hearts of Manhattan', trimSize: '6x9', edition: '1st', asin: '', status: 'reserved' },
    { isbn: '979-8-XXXX-0007-0', format: 'Ebook', title: '', imprint: 'AuthorVault Press', pubDate: '', series: '', trimSize: '', edition: '', asin: '', status: 'unused' },
    { isbn: '979-8-XXXX-0007-1', format: 'Paperback 6x9', title: '', imprint: 'AuthorVault Press', pubDate: '', series: '', trimSize: '6x9', edition: '', asin: '', status: 'unused' },
    { isbn: '979-8-XXXX-0008-0', format: 'Ebook', title: '', imprint: 'Vance Nonfiction', pubDate: '', series: '', trimSize: '', edition: '', asin: '', status: 'unused' },
  ]));

  readonly contractRecords = signal<VaultContractRecord[]>(this.load('contractRecords', [
    { name: 'Developmental Editing Agreement', counterparty: 'Sarah Mitchell', type: 'Editor', date: '2023-01-10', status: 'Active', file: 'contract-mitchell-2023.pdf' },
    { name: 'Cover Design Agreement', counterparty: 'James Okafor', type: 'Cover Designer', date: '2023-02-01', status: 'Active', file: 'contract-okafor-2023.pdf' },
    { name: 'Narrator Agreement — The Midnight Library', counterparty: 'Voice Arts Studio', type: 'Narrator', date: '2023-07-15', status: 'Active', file: 'contract-narrator-2023.pdf' },
    { name: 'Ghostwriter NDA', counterparty: 'Confidential', type: 'NDA', date: '2022-11-01', status: 'Active', file: 'nda-ghostwriter-2022.pdf' },
    { name: 'Translation Agreement — Spanish', counterparty: 'Maria Gonzalez Translations', type: 'Translation', date: '2024-01-20', status: 'Active', file: 'contract-translation-es-2024.pdf' },
    { name: 'Affiliate Agreement — BookTok Partner', counterparty: 'ReadWithMe LLC', type: 'Affiliate', date: '2024-03-01', status: 'Active', file: 'affiliate-readwithme-2024.pdf' },
    { name: 'Co-Author Agreement — Box Set', counterparty: 'V.E. Blackwood (pen name)', type: 'Co-Author', date: '2023-12-01', status: 'Active', file: 'coauthor-boxset-2023.pdf' },
    { name: 'DMCA Takedown Template', counterparty: 'N/A', type: 'Template', date: '2023-06-01', status: 'Template', file: 'dmca-template.docx' },
    { name: 'Royalty Split Agreement — Anthology', counterparty: 'Multiple Authors', type: 'Royalty Split', date: '2024-02-15', status: 'Active', file: 'royalty-split-anthology-2024.pdf' },
  ]));

  readonly financialRecords = signal<VaultFinancialRecord[]>(this.load('financialRecords', [
    { month: 'Jan 2024', revenue: '$8,420', expenses: '$2,150', net: '$6,270' },
    { month: 'Feb 2024', revenue: '$9,180', expenses: '$1,980', net: '$7,200' },
    { month: 'Mar 2024', revenue: '$11,340', expenses: '$3,200', net: '$8,140' },
    { month: 'Apr 2024', revenue: '$10,750', expenses: '$2,800', net: '$7,950' },
    { month: 'May 2024', revenue: '$12,600', expenses: '$4,100', net: '$8,500' },
    { month: 'Jun 2024', revenue: '$15,200', expenses: '$5,500', net: '$9,700' },
  ]));

  readonly domainRecords = signal<VaultDomainRecord[]>(this.load('domainRecords', [
    { domain: 'authorvaultpress.com', registrar: 'Namecheap', renewal: '2025-03-15', host: 'Shopify', dns: 'Cloudflare. A record → Shopify. MX → Google Workspace.', ssl: '2025-03-15 (auto-renew)', cms: 'Shopify', contact: 'Eleanor Vance' },
    { domain: 'eleanorvanc.com', registrar: 'Namecheap', renewal: '2025-06-01', host: 'WordPress (WP Engine)', dns: 'Cloudflare. A record → WP Engine.', ssl: '2025-06-01 (auto-renew)', cms: 'WordPress', contact: 'Eleanor Vance' },
    { domain: 'veblackwood.com', registrar: 'GoDaddy', renewal: '2025-09-20', host: 'WordPress (WP Engine)', dns: 'GoDaddy DNS. A record → WP Engine.', ssl: '2025-09-20 (auto-renew)', cms: 'WordPress', contact: 'Eleanor Vance' },
  ]));

  readonly inventoryItems = signal<VaultInventoryItem[]>(this.load('inventoryItems', [
    { sku: 'PB-ML-001', title: 'The Midnight Library', format: 'Paperback 5.5x8.5', stock: 45, reorderPoint: 20, printer: 'IngramSpark' },
    { sku: 'PB-SP-001', title: 'Shadow Protocol', format: 'Paperback 5.5x8.5', stock: 12, reorderPoint: 20, printer: 'IngramSpark' },
    { sku: 'HC-TA-001', title: 'Throne of Ashes', format: 'Hardcover 6x9', stock: 30, reorderPoint: 15, printer: 'IngramSpark' },
    { sku: 'PB-SS-001', title: 'Salt & Starlight', format: 'Paperback 6x9', stock: 8, reorderPoint: 20, printer: 'BookVault' },
    { sku: 'SB-HOM-001', title: 'Hearts of Manhattan Signed Box Set', format: 'Signed Box Set', stock: 25, reorderPoint: 10, printer: 'Local Print' },
  ]));

  readonly securityEntries = signal<VaultSecurityEntry[]>(this.load('securityEntries', [
    { resource: 'Amazon KDP', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: 'Backup codes in 1Password' },
    { resource: 'Shopify Store', owner: 'Eleanor Vance', accessLevel: 'Owner', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'MailerLite', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'Email 2FA', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'Stripe', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: 'Backup codes in fireproof safe' },
    { resource: 'Namecheap (Domains)', owner: 'Eleanor Vance', accessLevel: 'Owner', twoFa: 'TOTP App', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'Chase Business Banking', owner: 'Eleanor Vance', accessLevel: 'Primary', twoFa: 'SMS + Token', recoveryEmail: 'N/A', notes: 'Branch: 123 Main St, NY' },
    { resource: 'Alex Rivera (VA)', owner: 'Eleanor Vance', accessLevel: 'Limited', twoFa: 'N/A', recoveryEmail: 'N/A', notes: 'Access: social media scheduler only. Revoke on offboarding.' },
  ]));

  readonly logos = signal<VaultLogo[]>(this.load('logos', [
    { name: 'Primary Logo — Full Color', format: 'Horizontal', dimensions: '2400x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: 'var(--primary-light)' },
    { name: 'Primary Logo — White', format: 'Horizontal', dimensions: '2400x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: '#1c2e4a' },
    { name: 'Icon Mark — Full Color', format: 'Square', dimensions: '800x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: 'var(--primary-light)' },
    { name: 'Icon Mark — White', format: 'Square', dimensions: '800x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: '#1c2e4a' },
    { name: 'Vector Master File', format: 'All', dimensions: 'Scalable', fileType: 'SVG', uploaded: '2021-06-01', bg: 'var(--background)' },
    { name: 'Print-Ready Logo', format: 'Horizontal', dimensions: 'Vector', fileType: 'EPS', uploaded: '2021-06-01', bg: 'var(--background)' },
  ]));

  readonly sopTemplates = signal<VaultSopTemplate[]>(this.load('sopTemplates', [
    { name: 'Invoice Template', description: 'Standard invoice for contractor payments and client billing', updated: '2024-01-15' },
    { name: 'Royalty Split Sheet', description: 'Template for calculating and documenting royalty splits', updated: '2024-02-01' },
    { name: 'Book Launch Checklist', description: 'Complete 12-week launch checklist for new releases', updated: '2024-03-10' },
    { name: 'Book Upload Checklist', description: 'Step-by-step checklist for uploading to all platforms', updated: '2024-01-20' },
    { name: 'Direct Sales Checklist', description: 'Shopify product setup and BookFunnel delivery checklist', updated: '2024-02-15' },
    { name: 'Contractor Onboarding SOP', description: 'Steps for onboarding new editors, designers, and VAs', updated: '2023-11-01' },
    { name: 'Contractor Offboarding SOP', description: 'Steps for offboarding contractors and revoking access', updated: '2023-11-01' },
    { name: 'ARC Distribution SOP', description: 'Process for distributing ARCs via BookSprout and BookFunnel', updated: '2024-01-05' },
    { name: 'Monthly Bookkeeping SOP', description: 'Monthly reconciliation and expense categorization process', updated: '2024-03-01' },
    { name: 'DMCA Takedown Process', description: 'Step-by-step guide for filing DMCA takedown notices', updated: '2023-09-15' },
  ]));

  readonly corporateDocs = signal<VaultCorporateDoc[]>(this.load('corporateDocs', [
    { document: 'Operating Agreement', fileRef: 'operating-agreement-2021.pdf', status: 'On File' },
    { document: 'Articles of Incorporation', fileRef: 'articles-of-incorporation.pdf', status: 'On File' },
    { document: 'Bylaws', fileRef: 'company-bylaws.pdf', status: 'On File' },
    { document: 'State Registration Docs', fileRef: 'de-state-registration.pdf', status: 'On File' },
    { document: 'Annual Report Filing 2024', fileRef: 'annual-report-2024.pdf', status: 'Filed' },
    { document: 'Annual Report Filing 2023', fileRef: 'annual-report-2023.pdf', status: 'Filed' },
    { document: 'Business License', fileRef: 'business-license-ny.pdf', status: 'Active' },
    { document: 'Shareholder Agreement', fileRef: 'N/A — Single Member', status: 'N/A' },
  ]));

  readonly communications = signal<VaultCommunications>(this.load('communications', {
    senderDomain: 'authorvaultpress.com',
    emailPlatform: 'MailerLite',
    spfRecord: 'v=spf1 include:_spf.mlsend.com ~all',
    dkimStatus: 'Configured',
    dmarcStatus: 'Configured',
    newsletterListSize: '12,400 subscribers',
    supportInbox: 'support@authorvaultpress.com',
    poBox: 'PO Box 1234, New York, NY 10001',
  }));

  readonly inventoryFulfillment = signal<VaultInventoryFulfillment>(this.load('inventoryFulfillment', {
    fulfillmentPartner: 'BookVault / IngramSpark',
    shippingAccount: 'UPS Business Account #****4821',
    packagingVendor: 'Uline',
    deliveryPolicy: 'Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.',
  }));

  readonly securityNotes = signal<VaultSecurityNotes>(this.load('securityNotes', {
    emergencyAccess: 'In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.',
    offboardingSteps: '1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.',
  }));

  readonly taxRegistrations = signal<VaultTaxRegistrations>(this.load('taxRegistrations', {
    einConfirmation: 'ein-confirmation-cp575.pdf',
    salesTaxRegistrations: 'NY, DE',
    vatGst: 'N/A — US only',
    resaleCertificates: 'resale-cert-ny.pdf',
  }));

  readonly vendorCategoryFilter = signal('');

  private load<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const data = JSON.parse(raw) as Record<string, T>;
      return data[key] ?? fallback;
    } catch {
      return fallback;
    }
  }

  private persist(): void {
    const data = {
      ownerProfiles: this.ownerProfiles(),
      publishingPlatforms: this.publishingPlatforms(),
      teamMembers: this.teamMembers(),
      bankAccounts: this.bankAccounts(),
      paymentPlatforms: this.paymentPlatforms(),
      taxDocs: this.taxDocs(),
      isbnRecords: this.isbnRecords(),
      contractRecords: this.contractRecords(),
      financialRecords: this.financialRecords(),
      domainRecords: this.domainRecords(),
      inventoryItems: this.inventoryItems(),
      securityEntries: this.securityEntries(),
      logos: this.logos(),
      sopTemplates: this.sopTemplates(),
      corporateDocs: this.corporateDocs(),
      communications: this.communications(),
      inventoryFulfillment: this.inventoryFulfillment(),
      securityNotes: this.securityNotes(),
      taxRegistrations: this.taxRegistrations(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  updateOwners(v: VaultOwnerProfile[]): void { this.ownerProfiles.set(v); this.persist(); }
  updatePlatforms(v: VaultPlatform[]): void { this.publishingPlatforms.set(v); this.persist(); }
  updateTeam(v: VaultTeamMember[]): void { this.teamMembers.set(v); this.persist(); }
  updateBankAccounts(v: VaultBankAccount[]): void { this.bankAccounts.set(v); this.persist(); }
  updatePaymentPlatforms(v: VaultPlatform[]): void { this.paymentPlatforms.set(v); this.persist(); }
  updateTaxDocs(v: VaultTaxDoc[]): void { this.taxDocs.set(v); this.persist(); }
  updateIsbnRecords(v: VaultIsbnRecord[]): void { this.isbnRecords.set(v); this.persist(); }
  updateContracts(v: VaultContractRecord[]): void { this.contractRecords.set(v); this.persist(); }
  updateFinancialRecords(v: VaultFinancialRecord[]): void { this.financialRecords.set(v); this.persist(); }
  updateDomains(v: VaultDomainRecord[]): void { this.domainRecords.set(v); this.persist(); }
  updateInventory(v: VaultInventoryItem[]): void { this.inventoryItems.set(v); this.persist(); }
  updateSecurity(v: VaultSecurityEntry[]): void { this.securityEntries.set(v); this.persist(); }
  updateLogos(v: VaultLogo[]): void { this.logos.set(v); this.persist(); }
  updateSops(v: VaultSopTemplate[]): void { this.sopTemplates.set(v); this.persist(); }
  updateCorporateDocs(v: VaultCorporateDoc[]): void { this.corporateDocs.set(v); this.persist(); }
  updateCommunications(v: VaultCommunications): void { this.communications.set(v); this.persist(); }
  updateInventoryFulfillment(v: VaultInventoryFulfillment): void { this.inventoryFulfillment.set(v); this.persist(); }
  updateSecurityNotes(v: VaultSecurityNotes): void { this.securityNotes.set(v); this.persist(); }
  updateTaxRegistrations(v: VaultTaxRegistrations): void { this.taxRegistrations.set(v); this.persist(); }
}
