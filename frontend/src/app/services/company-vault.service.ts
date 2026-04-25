import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  CompanyVault, VaultOverview, CompanyProfile, Operations, Financials,
  AssetsRecords, SystemSecurity, PublishingPlatform, TeamMember,
  Contract, IsbnRecord, AccessEntry, ImportantDate
} from '../models/company-vault.model';

const MOCK_VAULT: CompanyVault = {
  overview: {
    totalPlatforms: 5,
    activeContracts: 8,
    teamMembers: 12,
    upcomingDeadlines: 4,
    alerts: [
      { id: 'a1', type: 'tax', severity: 'urgent', title: 'Quarterly Tax Filing Due', description: 'Q2 2025 estimated taxes due July 15', dueDate: '2025-07-15' },
      { id: 'a2', type: 'domain', severity: 'warning', title: 'Domain Renewal', description: 'authorvault.com expires in 23 days', dueDate: '2025-06-20' },
      { id: 'a3', type: 'contract', severity: 'warning', title: 'Freelancer Contract Expiring', description: 'Cover designer contract ends June 30', dueDate: '2025-06-30' },
      { id: 'a4', type: 'general', severity: 'info', title: 'ISBN Inventory Low', description: 'Only 3 ISBNs remaining in pool', dueDate: '' },
    ]
  },
  profile: {
    identity: {
      legalName: 'Vance Publishing LLC',
      dba: 'AuthorVault Press',
      ein: '82-1234567',
      stateOfIncorporation: 'Delaware',
      entityType: 'LLC',
      dateIncorporated: '2021-03-15',
      businessAddress: '1234 Literary Lane, Suite 200, New York, NY 10001',
      mailingAddress: '1234 Literary Lane, Suite 200, New York, NY 10001',
      phone: '+1 (212) 555-0147',
      email: 'admin@authorvaultpress.com'
    },
    owners: [
      { id: 'o1', name: 'Eleanor Vance', role: 'Managing Member', ownershipPercent: 60, email: 'eleanor@authorvaultpress.com', phone: '+1 (212) 555-0101' },
      { id: 'o2', name: 'Marcus Webb', role: 'Creative Director', ownershipPercent: 25, email: 'marcus@authorvaultpress.com', phone: '+1 (212) 555-0102' },
      { id: 'o3', name: 'Amara Singh', role: 'Operations Manager', ownershipPercent: 15, email: 'amara@authorvaultpress.com', phone: '+1 (212) 555-0103' }
    ],
    domains: [
      { id: 'd1', domain: 'authorvaultpress.com', registrar: 'Namecheap', expiryDate: '2026-03-15', autoRenew: true, sslStatus: 'active', hostingProvider: 'Vercel' },
      { id: 'd2', domain: 'eleanorvancebooks.com', registrar: 'GoDaddy', expiryDate: '2025-06-20', autoRenew: false, sslStatus: 'expiring', hostingProvider: 'Netlify' },
      { id: 'd3', domain: 'stonefilesthrillers.com', registrar: 'Cloudflare', expiryDate: '2026-09-01', autoRenew: true, sslStatus: 'active', hostingProvider: 'Cloudflare Pages' }
    ],
    logos: [
      { id: 'l1', name: 'Primary Logo', type: 'primary', url: '', uploadedAt: '2024-01-10' },
      { id: 'l2', name: 'Icon Mark', type: 'icon', url: '', uploadedAt: '2024-01-10' },
      { id: 'l3', name: 'Dark Background', type: 'dark', url: '', uploadedAt: '2024-02-05' },
      { id: 'l4', name: 'Monochrome', type: 'monochrome', url: '', uploadedAt: '2024-02-05' }
    ]
  },
  operations: {
    platforms: [
      { id: 'p1', name: 'Amazon KDP', accountId: 'KDP-VANCE-001', status: 'active', booksPublished: 12, monthlyRevenue: '$4,250', lastSync: '2025-05-28' },
      { id: 'p2', name: 'Kobo Writing Life', accountId: 'KWL-VANCE-001', status: 'active', booksPublished: 10, monthlyRevenue: '$890', lastSync: '2025-05-27' },
      { id: 'p3', name: 'Apple Books', accountId: 'APPLE-VP-001', status: 'active', booksPublished: 8, monthlyRevenue: '$620', lastSync: '2025-05-26' },
      { id: 'p4', name: 'Barnes & Noble Press', accountId: 'BNP-VANCE-001', status: 'active', booksPublished: 6, monthlyRevenue: '$340', lastSync: '2025-05-25' },
      { id: 'p5', name: 'IngramSpark', accountId: 'IS-VP-2024', status: 'pending', booksPublished: 2, monthlyRevenue: '$180', lastSync: '2025-05-20' }
    ],
    team: [
      { id: 't1', name: 'Sarah Chen', role: 'Editor-in-Chief', type: 'employee', email: 'sarah@authorvaultpress.com', status: 'active', startDate: '2022-06-01', rate: '$85,000/yr' },
      { id: 't2', name: 'James Okafor', role: 'Cover Designer', type: 'contractor', email: 'james@designstudio.com', status: 'active', startDate: '2023-01-15', rate: '$75/hr' },
      { id: 't3', name: 'Priya Patel', role: 'Marketing Specialist', type: 'employee', email: 'priya@authorvaultpress.com', status: 'active', startDate: '2023-09-01', rate: '$65,000/yr' },
      { id: 't4', name: 'BookBright Studios', role: 'Audiobook Production', type: 'vendor', email: 'hello@bookbright.com', status: 'active', startDate: '2024-02-01', rate: '$200/finished hr' },
      { id: 't5', name: 'Maria Gonzales', role: 'Virtual Assistant', type: 'contractor', email: 'maria@vaservices.com', status: 'active', startDate: '2024-06-01', rate: '$25/hr' },
      { id: 't6', name: 'Tom Richards', role: 'Formatter', type: 'contractor', email: 'tom@bookformat.pro', status: 'inactive', startDate: '2023-03-01', rate: '$45/hr' }
    ],
    inventory: [
      { id: 'inv1', title: 'The Midnight Library (Paperback)', sku: 'TML-PB-001', quantityOnHand: 245, reorderLevel: 100, warehouse: 'Amazon FBA', lastUpdated: '2025-05-15' },
      { id: 'inv2', title: 'The Midnight Library (Hardcover)', sku: 'TML-HC-001', quantityOnHand: 82, reorderLevel: 50, warehouse: 'IngramSpark', lastUpdated: '2025-05-10' },
      { id: 'inv3', title: 'Shadow Protocol (Paperback)', sku: 'SP-PB-001', quantityOnHand: 30, reorderLevel: 100, warehouse: 'Amazon FBA', lastUpdated: '2025-05-20' },
      { id: 'inv4', title: 'Garden of Stars (Paperback)', sku: 'GOS-PB-001', quantityOnHand: 500, reorderLevel: 200, warehouse: 'Author Copies', lastUpdated: '2025-04-28' }
    ],
    emailSystems: [
      { id: 'e1', provider: 'ConvertKit', domain: 'authorvaultpress.com', spfConfigured: true, dkimConfigured: true, dmarcConfigured: true, listSize: 12450, status: 'active' },
      { id: 'e2', provider: 'Mailchimp', domain: 'eleanorvancebooks.com', spfConfigured: true, dkimConfigured: false, dmarcConfigured: false, listSize: 3200, status: 'issues' }
    ]
  },
  financials: {
    bankAccounts: [
      { id: 'b1', bankName: 'Chase Business', accountType: 'checking', lastFour: '4821', isPrimary: true },
      { id: 'b2', bankName: 'Chase Business', accountType: 'savings', lastFour: '7733', isPrimary: false },
      { id: 'b3', bankName: 'Mercury', accountType: 'checking', lastFour: '9012', isPrimary: false }
    ],
    paymentProcessors: [
      { id: 'pp1', name: 'Stripe', accountEmail: 'payments@authorvaultpress.com', status: 'active', monthlyVolume: '$2,400' },
      { id: 'pp2', name: 'PayPal Business', accountEmail: 'paypal@authorvaultpress.com', status: 'active', monthlyVolume: '$850' },
      { id: 'pp3', name: 'Wise', accountEmail: 'intl@authorvaultpress.com', status: 'active', monthlyVolume: '$320' }
    ],
    taxDocuments: [
      { id: 'tx1', name: 'Q1 2025 Estimated Tax', type: 'Other', year: '2025', status: 'filed', dueDate: '2025-04-15' },
      { id: 'tx2', name: 'Q2 2025 Estimated Tax', type: 'Other', year: '2025', status: 'pending', dueDate: '2025-07-15' },
      { id: 'tx3', name: '2024 Federal Return', type: 'Schedule C', year: '2024', status: 'filed', dueDate: '2025-04-15' },
      { id: 'tx4', name: '2024 State Return — DE', type: 'Other', year: '2024', status: 'filed', dueDate: '2025-04-15' },
      { id: 'tx5', name: 'W-9 (Vance Publishing)', type: 'W-9', year: '2024', status: 'filed', dueDate: '' },
      { id: 'tx6', name: '1099-MISC James Okafor', type: '1099', year: '2024', status: 'filed', dueDate: '2025-01-31' }
    ],
    summary: { totalRevenue: '$127,400', totalExpenses: '$48,200', netIncome: '$79,200', period: 'YTD 2025' }
  },
  records: {
    contracts: [
      { id: 'c1', title: 'KDP Publishing Agreement', counterparty: 'Amazon', type: 'publishing', status: 'active', startDate: '2022-01-01', endDate: '2027-01-01', tags: ['amazon', 'ebook', 'print'] },
      { id: 'c2', title: 'Cover Design Services', counterparty: 'James Okafor', type: 'freelance', status: 'active', startDate: '2024-01-15', endDate: '2025-06-30', tags: ['design', 'covers'] },
      { id: 'c3', title: 'Audiobook Production', counterparty: 'BookBright Studios', type: 'freelance', status: 'active', startDate: '2024-02-01', endDate: '2025-12-31', tags: ['audio', 'production'] },
      { id: 'c4', title: 'Distribution Agreement', counterparty: 'IngramSpark', type: 'distribution', status: 'active', startDate: '2023-06-01', endDate: '2026-06-01', tags: ['distribution', 'print'] },
      { id: 'c5', title: 'Translation License — Spanish', counterparty: 'Editorial Planeta', type: 'licensing', status: 'pending-renewal', startDate: '2023-03-01', endDate: '2025-03-01', tags: ['translation', 'spanish'] }
    ],
    legalRecords: [
      { id: 'lr1', title: 'Articles of Organization', category: 'articles', filingDate: '2021-03-15', status: 'current', notes: 'Filed with DE Secretary of State' },
      { id: 'lr2', title: 'Operating Agreement', category: 'operating-agreement', filingDate: '2021-03-20', status: 'current', notes: 'Amended 2023-06-01' },
      { id: 'lr3', title: 'AuthorVault Press — TM', category: 'trademark', filingDate: '2022-08-10', status: 'current', notes: 'US Trademark Registration #12345678' },
      { id: 'lr4', title: 'Business Insurance Policy', category: 'insurance', filingDate: '2025-01-01', status: 'current', notes: 'Hartford Business Owners Policy — renews Jan 2026' },
      { id: 'lr5', title: 'EIN Confirmation Letter', category: 'license', filingDate: '2021-03-18', status: 'current', notes: 'IRS CP 575' }
    ],
    isbns: [
      { id: 'isbn1', isbn: '978-0-525-55947-4', format: 'print', status: 'assigned', assignedTo: 'The Midnight Library (PB)', purchaseDate: '2023-06-01' },
      { id: 'isbn2', isbn: '978-0-525-55948-1', format: 'ebook', status: 'assigned', assignedTo: 'The Midnight Library (EB)', purchaseDate: '2023-06-01' },
      { id: 'isbn3', isbn: '978-0-525-55949-8', format: 'audio', status: 'assigned', assignedTo: 'The Midnight Library (Audio)', purchaseDate: '2023-06-01' },
      { id: 'isbn4', isbn: '978-1-234-56789-0', format: 'print', status: 'assigned', assignedTo: 'Shadow Protocol (PB)', purchaseDate: '2024-01-10' },
      { id: 'isbn5', isbn: '978-1-234-56790-6', format: 'ebook', status: 'assigned', assignedTo: 'Shadow Protocol (EB)', purchaseDate: '2024-01-10' },
      { id: 'isbn6', isbn: '978-0-999-88877-1', format: 'print', status: 'available', assignedTo: '', purchaseDate: '2024-06-15' },
      { id: 'isbn7', isbn: '978-0-999-88878-8', format: 'ebook', status: 'available', assignedTo: '', purchaseDate: '2024-06-15' },
      { id: 'isbn8', isbn: '978-0-999-88879-5', format: 'print', status: 'available', assignedTo: '', purchaseDate: '2024-06-15' }
    ],
    templates: [
      { id: 'sop1', title: 'Book Launch Checklist', category: 'Launch', lastUpdated: '2025-03-01', version: '3.2', status: 'current' },
      { id: 'sop2', title: 'KDP Upload Procedure', category: 'Publishing', lastUpdated: '2025-01-15', version: '2.1', status: 'current' },
      { id: 'sop3', title: 'Cover Brief Template', category: 'Design', lastUpdated: '2024-11-20', version: '1.4', status: 'current' },
      { id: 'sop4', title: 'ARC Distribution Process', category: 'Marketing', lastUpdated: '2025-02-28', version: '2.0', status: 'current' },
      { id: 'sop5', title: 'Royalty Reconciliation', category: 'Finance', lastUpdated: '2024-09-01', version: '1.1', status: 'draft' }
    ]
  },
  system: {
    accessList: [
      { id: 'ac1', user: 'Eleanor Vance', email: 'eleanor@authorvaultpress.com', role: 'admin', twoFactorEnabled: true, lastLogin: '2025-05-28' },
      { id: 'ac2', user: 'Marcus Webb', email: 'marcus@authorvaultpress.com', role: 'admin', twoFactorEnabled: true, lastLogin: '2025-05-27' },
      { id: 'ac3', user: 'Amara Singh', email: 'amara@authorvaultpress.com', role: 'editor', twoFactorEnabled: true, lastLogin: '2025-05-28' },
      { id: 'ac4', user: 'Sarah Chen', email: 'sarah@authorvaultpress.com', role: 'editor', twoFactorEnabled: false, lastLogin: '2025-05-26' },
      { id: 'ac5', user: 'Priya Patel', email: 'priya@authorvaultpress.com', role: 'viewer', twoFactorEnabled: false, lastLogin: '2025-05-25' }
    ],
    recoveryMethods: [
      { id: 'r1', type: 'email', value: 'eleanor@gmail.com', verified: true, lastTested: '2025-04-01' },
      { id: 'r2', type: 'phone', value: '+1 (212) 555-****', verified: true, lastTested: '2025-04-01' },
      { id: 'r3', type: 'authenticator', value: 'Google Authenticator', verified: true, lastTested: '2025-05-15' },
      { id: 'r4', type: 'backup-codes', value: '8 codes remaining', verified: true, lastTested: '2025-03-20' }
    ],
    importantDates: [
      { id: 'dt1', title: 'Q2 Estimated Tax Due', date: '2025-07-15', type: 'tax', recurring: true, notes: 'Federal + DE state' },
      { id: 'dt2', title: 'Domain: eleanorvancebooks.com Renewal', date: '2025-06-20', type: 'renewal', recurring: true, notes: 'GoDaddy — not on auto-renew' },
      { id: 'dt3', title: 'Cover Designer Contract Ends', date: '2025-06-30', type: 'contract', recurring: false, notes: 'Negotiate renewal by June 15' },
      { id: 'dt4', title: 'Garden of Stars Launch', date: '2025-06-01', type: 'launch', recurring: false, notes: 'Pre-order goes live May 15' },
      { id: 'dt5', title: 'Business Insurance Renewal', date: '2026-01-01', type: 'renewal', recurring: true, notes: 'Hartford policy' },
      { id: 'dt6', title: 'Q3 Estimated Tax Due', date: '2025-09-15', type: 'tax', recurring: true, notes: '' },
      { id: 'dt7', title: 'Translation License Renewal', date: '2025-03-01', type: 'contract', recurring: false, notes: 'Editorial Planeta — Spanish rights' }
    ]
  }
};

@Injectable({ providedIn: 'root' })
export class CompanyVaultService {
  private readonly vault = signal<CompanyVault>(MOCK_VAULT);
  readonly companyVault = this.vault.asReadonly();

  getCompanyVault(): Observable<CompanyVault> {
    return of(this.vault()).pipe(delay(400));
  }

  updateCompanyVault(updates: Partial<CompanyVault>): Observable<CompanyVault> {
    this.vault.update(v => ({ ...v, ...updates }));
    return of(this.vault()).pipe(delay(300));
  }

  updateProfile(profile: Partial<CompanyVault['profile']>): Observable<CompanyVault> {
    this.vault.update(v => ({ ...v, profile: { ...v.profile, ...profile } }));
    return of(this.vault()).pipe(delay(300));
  }

  updateOperations(ops: Partial<CompanyVault['operations']>): Observable<CompanyVault> {
    this.vault.update(v => ({ ...v, operations: { ...v.operations, ...ops } }));
    return of(this.vault()).pipe(delay(300));
  }

  updateFinancials(fin: Partial<CompanyVault['financials']>): Observable<CompanyVault> {
    this.vault.update(v => ({ ...v, financials: { ...v.financials, ...fin } }));
    return of(this.vault()).pipe(delay(300));
  }
}
