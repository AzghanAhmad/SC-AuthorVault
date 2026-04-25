/* ═══════════════════════════════════════════
   Company Vault — Data Models
   ═══════════════════════════════════════════ */

// ──── Overview ────
export interface VaultAlert {
  id: string;
  type: 'tax' | 'domain' | 'contract' | 'general';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  dueDate: string;
}

export interface VaultOverview {
  totalPlatforms: number;
  activeContracts: number;
  teamMembers: number;
  upcomingDeadlines: number;
  alerts: VaultAlert[];
}

// ──── Company Profile ────
export interface BusinessIdentity {
  legalName: string;
  dba: string;
  ein: string;
  stateOfIncorporation: string;
  entityType: 'LLC' | 'S-Corp' | 'C-Corp' | 'Sole Proprietor' | 'Partnership';
  dateIncorporated: string;
  businessAddress: string;
  mailingAddress: string;
  phone: string;
  email: string;
}

export interface Owner {
  id: string;
  name: string;
  role: string;
  ownershipPercent: number;
  email: string;
  phone: string;
}

export interface WebDomain {
  id: string;
  domain: string;
  registrar: string;
  expiryDate: string;
  autoRenew: boolean;
  sslStatus: 'active' | 'expiring' | 'expired';
  hostingProvider: string;
}

export interface BrandLogo {
  id: string;
  name: string;
  type: 'primary' | 'icon' | 'monochrome' | 'dark' | 'light';
  url: string;
  uploadedAt: string;
}

export interface CompanyProfile {
  identity: BusinessIdentity;
  owners: Owner[];
  domains: WebDomain[];
  logos: BrandLogo[];
}

// ──── Operations ────
export interface PublishingPlatform {
  id: string;
  name: string;
  accountId: string;
  status: 'active' | 'pending' | 'suspended';
  booksPublished: number;
  monthlyRevenue: string;
  lastSync: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  type: 'employee' | 'contractor' | 'vendor';
  email: string;
  status: 'active' | 'inactive';
  startDate: string;
  rate: string;
}

export interface InventoryItem {
  id: string;
  title: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
  warehouse: string;
  lastUpdated: string;
}

export interface EmailSystem {
  id: string;
  provider: string;
  domain: string;
  spfConfigured: boolean;
  dkimConfigured: boolean;
  dmarcConfigured: boolean;
  listSize: number;
  status: 'active' | 'issues';
}

export interface Operations {
  platforms: PublishingPlatform[];
  team: TeamMember[];
  inventory: InventoryItem[];
  emailSystems: EmailSystem[];
}

// ──── Financials ────
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'business';
  lastFour: string;
  isPrimary: boolean;
}

export interface PaymentProcessor {
  id: string;
  name: string;
  accountEmail: string;
  status: 'active' | 'inactive';
  monthlyVolume: string;
}

export interface TaxDocument {
  id: string;
  name: string;
  type: 'W-9' | '1099' | 'K-1' | 'Schedule C' | 'Sales Tax' | 'Other';
  year: string;
  status: 'filed' | 'pending' | 'overdue';
  dueDate: string;
}

export interface FinancialSummary {
  totalRevenue: string;
  totalExpenses: string;
  netIncome: string;
  period: string;
}

export interface Financials {
  bankAccounts: BankAccount[];
  paymentProcessors: PaymentProcessor[];
  taxDocuments: TaxDocument[];
  summary: FinancialSummary;
}

// ──── Assets & Records ────
export interface Contract {
  id: string;
  title: string;
  counterparty: string;
  type: 'publishing' | 'distribution' | 'freelance' | 'licensing' | 'other';
  status: 'active' | 'expired' | 'pending-renewal';
  startDate: string;
  endDate: string;
  tags: string[];
}

export interface LegalRecord {
  id: string;
  title: string;
  category: 'articles' | 'operating-agreement' | 'trademark' | 'copyright' | 'license' | 'insurance';
  filingDate: string;
  status: 'current' | 'needs-renewal' | 'expired';
  notes: string;
}

export interface IsbnRecord {
  id: string;
  isbn: string;
  format: 'print' | 'ebook' | 'audio';
  status: 'available' | 'assigned';
  assignedTo: string;
  purchaseDate: string;
}

export interface SopTemplate {
  id: string;
  title: string;
  category: string;
  lastUpdated: string;
  version: string;
  status: 'current' | 'draft' | 'archived';
}

export interface AssetsRecords {
  contracts: Contract[];
  legalRecords: LegalRecord[];
  isbns: IsbnRecord[];
  templates: SopTemplate[];
}

// ──── System & Security ────
export interface AccessEntry {
  id: string;
  user: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface RecoveryMethod {
  id: string;
  type: 'email' | 'phone' | 'backup-codes' | 'authenticator';
  value: string;
  verified: boolean;
  lastTested: string;
}

export interface ImportantDate {
  id: string;
  title: string;
  date: string;
  type: 'tax' | 'renewal' | 'launch' | 'contract' | 'other';
  recurring: boolean;
  notes: string;
}

export interface SystemSecurity {
  accessList: AccessEntry[];
  recoveryMethods: RecoveryMethod[];
  importantDates: ImportantDate[];
}

// ──── Root Model ────
export interface CompanyVault {
  overview: VaultOverview;
  profile: CompanyProfile;
  operations: Operations;
  financials: Financials;
  records: AssetsRecords;
  system: SystemSecurity;
}
