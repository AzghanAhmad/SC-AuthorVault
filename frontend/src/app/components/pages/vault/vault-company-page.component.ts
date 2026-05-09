import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';

// ─── Mock data interfaces ───────────────────────────────────────────────────
interface Platform { name: string; owner: string; email: string; phone: string; payout: string; taxProfile: string; username: string; password: string; notes: string; showUser: boolean; showPass: boolean; }
interface IsbnRecord { isbn: string; format: string; title: string; imprint: string; pubDate: string; series: string; trimSize: string; edition: string; asin: string; status: 'used'|'unused'|'reserved'; }
interface ContractRecord { name: string; counterparty: string; date: string; type: string; status: string; file: string; }
interface TeamMember { name: string; role: string; company: string; email: string; phone: string; contractDate: string; rate: string; notes: string; }
interface DomainRecord { domain: string; registrar: string; renewal: string; host: string; dns: string; ssl: string; cms: string; contact: string; }
interface SopTemplate { name: string; description: string; updated: string; }
interface Logo { name: string; format: string; dimensions: string; fileType: string; uploaded: string; bg: string; }
interface BankAccount { bank: string; nickname: string; account: string; routing: string; wire: string; swift: string; showAccount: boolean; showRouting: boolean; }
interface TaxDoc { name: string; type: string; year: string; status: string; }
interface OwnerProfile { name: string; role: string; ownershipPct: string; email: string; phone: string; canSign: boolean; canManageFinances: boolean; showNda: boolean; }
interface FinancialRecord { month: string; revenue: string; expenses: string; net: string; }
interface InventoryItem { sku: string; title: string; format: string; stock: number; reorderPoint: number; printer: string; }
interface SecurityEntry { resource: string; owner: string; accessLevel: string; twoFa: string; recoveryEmail: string; notes: string; }

@Component({
  selector: 'app-vault-company-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
<!-- ═══ PIN LOCK OVERLAY ═══ -->
@if (!unlocked) {
  <div style="position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;">
    <div style="background:var(--surface);border:1px solid var(--border-light);border-radius:20px;padding:2.5rem 2rem;width:360px;box-shadow:var(--shadow-xl);text-align:center;position:relative;">

      <!-- ✕ Close button -->
      <button (click)="cancelLock()"
        style="position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;background:var(--background);border:1px solid var(--border-color);color:var(--text-muted);font-size:1rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;"
        title="Cancel and go back">✕</button>

      <div style="font-size:2.5rem;margin-bottom:.75rem;">🔒</div>

      <!-- ── FIRST TIME SETUP ── -->
      @if (isFirstTime && !changingPin) {
        <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0 0 .35rem;">Set Up Your Security PIN</h2>
        <p style="font-size:.8125rem;color:var(--text-muted);margin:0 0 1.5rem;">Choose a 4-digit PIN to protect your company records. You'll need this every time you access this section.</p>

        <p style="font-size:.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:0 0 .6rem;">Choose PIN</p>
        <div style="display:flex;gap:.6rem;justify-content:center;margin-bottom:1.25rem;">
          @for(i of [0,1,2,3]; track i) {
            <input [type]="showPin ? 'text' : 'password'" maxlength="1" inputmode="numeric"
              [value]="pinDigits[i]"
              (input)="onPinInput($event, i)"
              (keydown)="onPinKey($event, i)"
              [id]="'pin-'+i"
              style="width:52px;height:56px;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid;border-radius:10px;background:var(--background);color:var(--text-primary);outline:none;font-family:inherit;"
              [style.border-color]="pinDigits[i] ? 'var(--accent-blue)' : 'var(--border-color)'">
          }
        </div>

        <p style="font-size:.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:0 0 .6rem;">Confirm PIN</p>
        <div style="display:flex;gap:.6rem;justify-content:center;margin-bottom:.75rem;">
          @for(i of [0,1,2,3]; track i) {
            <input [type]="showPin ? 'text' : 'password'" maxlength="1" inputmode="numeric"
              [value]="confirmPinDigits[i]"
              (input)="onConfirmPinInput($event, i)"
              (keydown)="onConfirmPinKey($event, i)"
              [id]="'cpin-'+i"
              style="width:52px;height:56px;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid;border-radius:10px;background:var(--background);color:var(--text-primary);outline:none;font-family:inherit;"
              [style.border-color]="pinMismatch ? '#ef4444' : (confirmPinDigits[i] ? 'var(--accent-blue)' : 'var(--border-color)')">
          }
        </div>
        @if (pinMismatch) { <p style="color:#ef4444;font-size:.8125rem;margin:0 0 .75rem;">PINs don't match. Try again.</p> }
        @if (pinError) { <p style="color:#ef4444;font-size:.8125rem;margin:0 0 .75rem;">Please enter all 4 digits.</p> }

        <div style="display:flex;align-items:center;justify-content:center;gap:.4rem;margin-bottom:1.25rem;cursor:pointer;" (click)="showPin=!showPin">
          <span style="font-size:.75rem;color:var(--text-muted);">{{ showPin ? 'Hide' : 'Show' }} digits</span>
        </div>
        <button (click)="unlock()" style="width:100%;padding:.7rem;background:var(--accent-blue);color:#fff;border:none;border-radius:10px;font-size:.9375rem;font-weight:600;cursor:pointer;font-family:inherit;">Set PIN & Unlock</button>
      }

      <!-- ── RETURNING USER: ENTER PIN ── -->
      @if (!isFirstTime && !changingPin) {
        <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0 0 .35rem;">Company Vault — Secured</h2>
        <p style="font-size:.8125rem;color:var(--text-muted);margin:0 0 1.75rem;">Enter your 4-digit PIN to access company records</p>
        <div style="display:flex;gap:.6rem;justify-content:center;margin-bottom:1rem;">
          @for(i of [0,1,2,3]; track i) {
            <input [type]="showPin ? 'text' : 'password'" maxlength="1" inputmode="numeric"
              [value]="pinDigits[i]"
              (input)="onPinInput($event, i)"
              (keydown)="onPinKey($event, i)"
              [id]="'pin-'+i"
              style="width:52px;height:56px;text-align:center;font-size:1.5rem;font-weight:700;border:2px solid;border-radius:10px;background:var(--background);color:var(--text-primary);outline:none;font-family:inherit;"
              [style.border-color]="pinError ? '#ef4444' : (pinDigits[i] ? 'var(--accent-blue)' : 'var(--border-color)')">
          }
        </div>
        @if (pinError) { <p style="color:#ef4444;font-size:.8125rem;margin:0 0 .75rem;">Incorrect PIN. Try again.</p> }
        <div style="display:flex;align-items:center;justify-content:center;gap:.4rem;margin-bottom:1.25rem;cursor:pointer;" (click)="showPin=!showPin">
          <span style="font-size:.75rem;color:var(--text-muted);">{{ showPin ? 'Hide' : 'Show' }} PIN</span>
        </div>
        <button (click)="unlock()" style="width:100%;padding:.7rem;background:var(--accent-blue);color:#fff;border:none;border-radius:10px;font-size:.9375rem;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:.75rem;">Unlock</button>
        <button (click)="changingPin=true;pinError=false" style="background:none;border:none;color:var(--text-muted);font-size:.8125rem;cursor:pointer;font-family:inherit;text-decoration:underline;">Change PIN</button>
      }

      <!-- ── CHANGE PIN ── -->
      @if (changingPin) {
        <h2 style="font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0 0 1.25rem;">Change PIN</h2>
        <div style="text-align:left;">
          <div style="margin-bottom:.85rem;">
            <label style="font-size:.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:.35rem;">Current PIN</label>
            <input type="password" maxlength="4" [(ngModel)]="currentPinInput" style="width:100%;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-primary);font-size:1rem;font-family:inherit;box-sizing:border-box;">
          </div>
          <div style="margin-bottom:.85rem;">
            <label style="font-size:.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:.35rem;">New PIN (4 digits)</label>
            <input type="password" maxlength="4" [(ngModel)]="newPinInput" style="width:100%;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-primary);font-size:1rem;font-family:inherit;box-sizing:border-box;">
          </div>
          @if (pinChangeError) { <p style="color:#ef4444;font-size:.8125rem;margin:0 0 .75rem;">{{ pinChangeError }}</p> }
          @if (pinChangeSuccess) { <p style="color:#10b981;font-size:.8125rem;margin:0 0 .75rem;">PIN changed successfully!</p> }
          <div style="display:flex;gap:.5rem;">
            <button (click)="changePin()" style="flex:1;padding:.65rem;background:var(--accent-blue);color:#fff;border:none;border-radius:8px;font-size:.875rem;font-weight:600;cursor:pointer;font-family:inherit;">Save PIN</button>
            <button (click)="changingPin=false;pinChangeError='';pinChangeSuccess=false" style="flex:1;padding:.65rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;font-family:inherit;color:var(--text-secondary);">Cancel</button>
          </div>
        </div>
      }

    </div>
  </div>
}

<!-- ═══ MAIN PAGE ═══ -->
<div class="page">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;">
    <div>
      <h1 class="page-title">🏢 {{ company().identity.legalName }}</h1>
      <p class="page-subtitle">{{ company().identity.entityType }} · {{ company().identity.stateOfIncorporation }} · <span class="status status-green">{{ company().identity.companyStatus }}</span></p>
    </div>
    <button (click)="lockVault()" style="display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .85rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:8px;font-size:.8125rem;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;">
      🔒 Lock Vault
    </button>
  </div>

  <div class="stats-row">
    <div class="stat-card"><div class="stat-value">{{ company().imprints.length }}</div><div class="stat-label">Imprints</div></div>
    <div class="stat-card"><div class="stat-value">{{ penNameCount }}</div><div class="stat-label">Pen Names</div></div>
    <div class="stat-card"><div class="stat-value">{{ bookCount }}</div><div class="stat-label">Total Books</div></div>
    <div class="stat-card"><div class="stat-value">{{ company().identity.companyStatus }}</div><div class="stat-label">Status</div></div>
  </div>

  <div class="vault-layout">
    <nav class="vault-nav">
      @for(t of tabs; track t.id) {
        <button class="tab-item" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)">{{ t.icon }} {{ t.label }}</button>
      }
    </nav>

    <div class="vault-content">

      <!-- ── OVERVIEW ── -->
      @if (activeTab() === 'overview') {
        <div class="card">
          <h3 class="section-title">Company Overview</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Legal Name</span><div class="form-value">{{ company().identity.legalName }}</div></div>
            <div class="form-group"><span class="form-label">DBA Names</span><div class="form-value">{{ company().identity.dbaNames }}</div></div>
            <div class="form-group"><span class="form-label">Entity Type</span><div class="form-value">{{ company().identity.entityType }}</div></div>
            <div class="form-group"><span class="form-label">State of Incorporation</span><div class="form-value">{{ company().identity.stateOfIncorporation }}</div></div>
            <div class="form-group"><span class="form-label">Date of Formation</span><div class="form-value">{{ company().identity.dateOfFormation }}</div></div>
            <div class="form-group"><span class="form-label">Fiscal Year End</span><div class="form-value">{{ company().identity.fiscalYearEnd }}</div></div>
            <div class="form-group"><span class="form-label">Status</span><div class="form-value"><span class="status status-green">{{ company().identity.companyStatus }}</span></div></div>
            <div class="form-group"><span class="form-label">Website</span><div class="form-value"><a [href]="company().identity.website" target="_blank" style="color:var(--accent-blue)">{{ company().identity.website }}</a></div></div>
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Quick Stats</h3>
          <div class="stats-row" style="margin-bottom:0">
            <div class="stat-card"><div class="stat-value">{{ company().imprints.length }}</div><div class="stat-label">Imprints</div></div>
            <div class="stat-card"><div class="stat-value">{{ penNameCount }}</div><div class="stat-label">Pen Names</div></div>
            <div class="stat-card"><div class="stat-value">{{ bookCount }}</div><div class="stat-label">Books</div></div>
            <div class="stat-card"><div class="stat-value">{{ isbnUsed }}</div><div class="stat-label">ISBNs Used</div></div>
          </div>
        </div>
      }

      <!-- ── BUSINESS IDENTITY ── -->
      @if (activeTab() === 'identity') {
        <div class="card">
          <h3 class="section-title">Business Identity</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Legal Name</span><div class="form-value">{{ company().identity.legalName }}</div></div>
            <div class="form-group"><span class="form-label">DBA / Trade Names</span><div class="form-value">{{ company().identity.dbaNames }}</div></div>
            <div class="form-group"><span class="form-label">Business Structure</span><div class="form-value">{{ company().identity.entityType }}</div></div>
            <div class="form-group"><span class="form-label">State of Registration</span><div class="form-value">{{ company().identity.stateOfIncorporation }}</div></div>
            <div class="form-group"><span class="form-label">Country</span><div class="form-value">United States</div></div>
            <div class="form-group"><span class="form-label">Date of Formation</span><div class="form-value">{{ company().identity.dateOfFormation }}</div></div>
            <div class="form-group full"><span class="form-label">Business Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Mailing Address</span><div class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></div>
            <div class="form-group"><span class="form-label">Website</span><div class="form-value"><a [href]="company().identity.website" target="_blank" style="color:var(--accent-blue)">{{ company().identity.website }}</a></div></div>
            <div class="form-group"><span class="form-label">Main Business Email</span><div class="form-value">{{ company().identity.primaryEmail }}</div></div>
            <div class="form-group"><span class="form-label">Business Phone</span><div class="form-value">{{ company().identity.phone }}</div></div>
            <div class="form-group"><span class="form-label">Registered Agent</span><div class="form-value">{{ company().identity.registeredAgent }}</div></div>
            <div class="form-group"><span class="form-label">Fiscal Year End</span><div class="form-value">{{ company().identity.fiscalYearEnd }}</div></div>
            <div class="form-group"><span class="form-label">Company Status</span><div class="form-value"><span class="status status-green">{{ company().identity.companyStatus }}</span></div></div>
          </div>
        </div>
      }

      <!-- ── OWNERSHIP & MANAGEMENT ── -->
      @if (activeTab() === 'ownership') {
        <div class="card">
          <h3 class="section-title">Owners & Officers</h3>
          <table class="data-table">
            <thead><tr><th>Name</th><th>Role / Title</th><th>Ownership %</th><th>Can Sign</th><th>Manage Finances</th><th>NDA</th></tr></thead>
            <tbody>
              @for(o of ownerProfiles; track o.name) {
                <tr>
                  <td class="td-primary">{{ o.name }}</td>
                  <td>{{ o.role }}</td>
                  <td>{{ o.ownershipPct }}</td>
                  <td><span [class]="o.canSign ? 'status status-green' : 'status status-default'">{{ o.canSign ? 'Yes' : 'No' }}</span></td>
                  <td><span [class]="o.canManageFinances ? 'status status-green' : 'status status-default'">{{ o.canManageFinances ? 'Yes' : 'No' }}</span></td>
                  <td><span [class]="o.showNda ? 'status status-green' : 'status status-amber'">{{ o.showNda ? 'Signed' : 'Pending' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Documents per Person</h3>
          <p class="section-subtitle">CVs, letterhead, business cards, avatar pics, bio, electronic signature, job description, signed NDA</p>
          @for(o of ownerProfiles; track o.name) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ o.name }} — {{ o.role }}</h4></div>
              <div class="tag-row">
                <span class="tag">📄 CV / Resume</span>
                <span class="tag">🖼 Avatar Photo</span>
                <span class="tag">✍️ Electronic Signature</span>
                <span class="tag">📋 Job Description</span>
                <span class="tag">🤝 Signed NDA</span>
                <span class="tag">📇 Business Card</span>
                <span class="tag">📝 Bio (Short)</span>
                <span class="tag">📝 Bio (Long)</span>
                <span class="tag">🖨 Letterhead Template</span>
              </div>
            </div>
          }
        </div>
        <div class="card">
          <h3 class="section-title">Operating Agreement</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Operating Agreement File</span><div class="form-value">{{ company().ownership.operatingAgreementFile }}</div></div>
            <div class="form-group"><span class="form-label">S-Corp Election File</span><div class="form-value">{{ company().ownership.sCorpElectionFile || '—' }}</div></div>
          </div>
        </div>
      }

      <!-- ── CORPORATE & LEGAL RECORDS ── -->
      @if (activeTab() === 'legal') {
        <div class="card">
          <h3 class="section-title">Tax & Registration</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">EIN / Tax ID</span>
              <div style="display:flex;align-items:center;gap:.5rem;">
                <div class="form-value" style="flex:1">{{ showEin ? company().identity.einTaxId : '**-*******' }}</div>
                <button (click)="showEin=!showEin" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.875rem;">{{ showEin ? '🙈' : '👁' }}</button>
              </div>
            </div>
            <div class="form-group"><span class="form-label">Registered Agent</span><div class="form-value">{{ company().identity.registeredAgent }}</div></div>
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Formation & Corporate Documents</h3>
          <table class="data-table">
            <thead><tr><th>Document</th><th>File / Reference</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td class="td-primary">Operating Agreement</td><td>{{ company().contractsLegal.operatingAgreement }}</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Articles of Incorporation</td><td>articles-of-incorporation.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Bylaws</td><td>company-bylaws.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">State Registration Docs</td><td>de-state-registration.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Annual Report Filing 2024</td><td>annual-report-2024.pdf</td><td><span class="status status-green">Filed</span></td></tr>
              <tr><td class="td-primary">Annual Report Filing 2023</td><td>annual-report-2023.pdf</td><td><span class="status status-green">Filed</span></td></tr>
              <tr><td class="td-primary">Business License</td><td>business-license-ny.pdf</td><td><span class="status status-green">Active</span></td></tr>
              <tr><td class="td-primary">Shareholder Agreement</td><td>{{ company().contractsLegal.shareholderAgreement || 'N/A — Single Member' }}</td><td><span class="status status-default">N/A</span></td></tr>
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Trademarks, Copyrights & Insurance</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Trademark Registrations</span><div class="form-value">{{ company().contractsLegal.trademarkRegistrations }}</div></div>
            <div class="form-group"><span class="form-label">Copyright Assignments</span><div class="form-value">{{ company().contractsLegal.copyrightAssignments }}</div></div>
            <div class="form-group"><span class="form-label">Insurance Policies</span><div class="form-value">{{ company().contractsLegal.insurancePolicies }}</div></div>
            <div class="form-group"><span class="form-label">Attorney Name</span><div class="form-value">{{ company().contractsLegal.attorneyName }}</div></div>
            <div class="form-group"><span class="form-label">Attorney Contact</span><div class="form-value">{{ company().contractsLegal.attorneyContact }}</div></div>
          </div>
          <div style="margin-top:1rem;padding:.75rem;background:var(--primary-light);border-radius:8px;font-size:.8125rem;color:var(--text-secondary);">
            �� Copyright Office: <a href="https://www.copyright.gov" target="_blank" style="color:var(--accent-blue)">https://www.copyright.gov</a>
          </div>
        </div>
      }

      <!-- ── BANKING & PAYMENT ── -->
      @if (activeTab() === 'banking') {
        <div class="card">
          <h3 class="section-title">Bank Accounts</h3>
          <table class="data-table">
            <thead><tr><th>Bank</th><th>Nickname</th><th>Account #</th><th>Routing #</th><th>Wire #</th><th>SWIFT</th></tr></thead>
            <tbody>
              @for(b of bankAccounts; track b.nickname) {
                <tr>
                  <td class="td-primary">{{ b.bank }}</td>
                  <td>{{ b.nickname }}</td>
                  <td>
                    <span style="font-family:monospace">{{ b.showAccount ? b.account : '****' + b.account.slice(-4) }}</span>
                    <button (click)="b.showAccount=!b.showAccount" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">{{ b.showAccount ? '🙈' : '👁' }}</button>
                  </td>
                  <td>
                    <span style="font-family:monospace">{{ b.showRouting ? b.routing : '****' + b.routing.slice(-4) }}</span>
                    <button (click)="b.showRouting=!b.showRouting" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">{{ b.showRouting ? '🙈' : '👁' }}</button>
                  </td>
                  <td style="font-family:monospace">{{ b.wire || '—' }}</td>
                  <td style="font-family:monospace">{{ b.swift || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Payment Processors & Payout Destinations</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Payment Processors</span><div class="form-value">{{ company().financial.paymentProcessors }}</div></div>
            <div class="form-group"><span class="form-label">Accounting Software</span><div class="form-value">{{ company().financial.accountingSoftware }}</div></div>
            <div class="form-group"><span class="form-label">CPA Name</span><div class="form-value">{{ company().financial.cpaName }}</div></div>
            <div class="form-group"><span class="form-label">CPA Contact</span><div class="form-value">{{ company().financial.cpaContact }}</div></div>
            <div class="form-group"><span class="form-label">Tax Schedule</span><div class="form-value">{{ company().financial.quarterlyTaxSchedule }}</div></div>
            <div class="form-group"><span class="form-label">State Tax Registrations</span><div class="form-value">{{ company().financial.stateTaxRegistrations }}</div></div>
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Platform Login Credentials</h3>
          <p class="section-subtitle">Stripe, PayPal, Wise — usernames and passwords are masked</p>
          <table class="data-table">
            <thead><tr><th>Platform</th><th>Username / Email</th><th>Password</th><th>Recovery</th><th>Notes</th></tr></thead>
            <tbody>
              @for(p of paymentPlatforms; track p.name) {
                <tr>
                  <td class="td-primary">{{ p.name }}</td>
                  <td>
                    <span>{{ p.showUser ? p.username : maskValue(p.username) }}</span>
                    <button (click)="p.showUser=!p.showUser" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">{{ p.showUser ? '🙈' : '👁' }}</button>
                  </td>
                  <td>
                    <span style="font-family:monospace">{{ p.showPass ? p.password : '••••••••' }}</span>
                    <button (click)="p.showPass=!p.showPass" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">{{ p.showPass ? '🙈' : '👁' }}</button>
                  </td>
                  <td>{{ p.phone }}</td>
                  <td>{{ p.notes }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── TAX INFORMATION ── -->
      @if (activeTab() === 'tax') {
        <div class="card">
          <h3 class="section-title">Tax Documents</h3>
          <table class="data-table">
            <thead><tr><th>Document</th><th>Type</th><th>Year</th><th>Status</th></tr></thead>
            <tbody>
              @for(d of taxDocs; track d.name) {
                <tr>
                  <td class="td-primary">{{ d.name }}</td>
                  <td>{{ d.type }}</td>
                  <td>{{ d.year }}</td>
                  <td><span [class]="d.status === 'Filed' ? 'status status-green' : d.status === 'Pending' ? 'status status-amber' : 'status status-default'">{{ d.status }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Tax Registrations</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>
            <div class="form-group"><span class="form-label">Accountant</span><div class="form-value">{{ company().financial.cpaName }}</div></div>
            <div class="form-group"><span class="form-label">Accountant Contact</span><div class="form-value">{{ company().financial.cpaContact }}</div></div>
          </div>
          <div style="margin-top:1rem;padding:.75rem;background:var(--primary-light);border-radius:8px;font-size:.8125rem;color:var(--text-secondary);">
            🔗 IRS Forms & Instructions: <a href="https://www.irs.gov/forms-instructions" target="_blank" style="color:var(--accent-blue)">https://www.irs.gov/forms-instructions</a>
          </div>
        </div>
      }

      <!-- ── PUBLISHING PLATFORMS ── -->
      @if (activeTab() === 'platforms') {
        <div class="card">
          <h3 class="section-title">Publishing Platform Accounts</h3>
          <p class="section-subtitle">All platform credentials — usernames and passwords are masked by default</p>
          @for(p of publishingPlatforms; track p.name) {
            <div class="record-card" style="margin-bottom:.75rem;">
              <div class="record-header">
                <h4 class="record-title">{{ p.name }}</h4>
                <span class="status status-green">Active</span>
              </div>
              <div class="record-grid" style="grid-template-columns:1fr 1fr 1fr;gap:.5rem .85rem;">
                <div class="record-field"><span class="label">Account Owner</span><span class="value">{{ p.owner }}</span></div>
                <div class="record-field"><span class="label">Account Email</span><span class="value">{{ p.email }}</span></div>
                <div class="record-field"><span class="label">Recovery Phone</span><span class="value">{{ p.phone || '—' }}</span></div>
                <div class="record-field"><span class="label">Payout Method</span><span class="value">{{ p.payout }}</span></div>
                <div class="record-field"><span class="label">Tax Profile Name</span><span class="value">{{ p.taxProfile }}</span></div>
                <div class="record-field">
                  <span class="label">Username</span>
                  <span class="value" style="display:flex;align-items:center;gap:.35rem;">
                    {{ p.showUser ? p.username : maskValue(p.username) }}
                    <button (click)="p.showUser=!p.showUser" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.75rem;">{{ p.showUser ? '🙈' : '👁' }}</button>
                  </span>
                </div>
                <div class="record-field">
                  <span class="label">Password</span>
                  <span class="value" style="display:flex;align-items:center;gap:.35rem;font-family:monospace;">
                    {{ p.showPass ? p.password : '••••••••' }}
                    <button (click)="p.showPass=!p.showPass" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.75rem;">{{ p.showPass ? '🙈' : '👁' }}</button>
                  </span>
                </div>
                <div class="record-field" style="grid-column:1/-1"><span class="label">Notes</span><span class="value">{{ p.notes }}</span></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── ISBNs ── -->
      @if (activeTab() === 'isbns') {
        <div class="stats-row" style="margin-bottom:1rem;">
          <div class="stat-card"><div class="stat-value">{{ isbnRecords.length }}</div><div class="stat-label">Total ISBNs</div></div>
          <div class="stat-card"><div class="stat-value">{{ isbnUsed }}</div><div class="stat-label">Used</div></div>
          <div class="stat-card"><div class="stat-value">{{ isbnAvailable }}</div><div class="stat-label">Available</div></div>
          <div class="stat-card"><div class="stat-value">{{ isbnReserved }}</div><div class="stat-label">Reserved</div></div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 class="section-title" style="margin:0">ISBN Master List</h3>
            <div style="display:flex;gap:.5rem;">
              <select [(ngModel)]="isbnFilterStatus" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit;">
                <option value="">All Status</option>
                <option value="used">Used</option>
                <option value="unused">Available</option>
                <option value="reserved">Reserved</option>
              </select>
              <select [(ngModel)]="isbnFilterFormat" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit;">
                <option value="">All Formats</option>
                <option value="Ebook">Ebook</option>
                <option value="Paperback 6x9">Paperback 6x9</option>
                <option value="Paperback 5.5x8.5">Paperback 5.5x8.5</option>
                <option value="Hardcover">Hardcover</option>
                <option value="Audiobook">Audiobook</option>
                <option value="Box Set">Box Set</option>
              </select>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>ISBN</th><th>Format</th><th>Book Title</th><th>Imprint</th><th>Series</th><th>Assigned Date</th><th>Status</th></tr></thead>
            <tbody>
              @for(r of filteredIsbns; track r.isbn) {
                <tr>
                  <td class="td-primary" style="font-family:monospace">{{ r.isbn }}</td>
                  <td>{{ r.format }}</td>
                  <td>{{ r.title || '—' }}</td>
                  <td>{{ r.imprint || '—' }}</td>
                  <td>{{ r.series || '—' }}</td>
                  <td>{{ r.pubDate || '—' }}</td>
                  <td><span [class]="r.status === 'used' ? 'status status-blue' : r.status === 'reserved' ? 'status status-amber' : 'status status-green'">{{ r.status === 'used' ? 'Used' : r.status === 'reserved' ? 'Reserved' : 'Available' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">ISBN Block Details</h3>
          @for(imp of company().imprints; track imp.id) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ imp.identity.name }}</h4></div>
              <div class="record-grid">
                <div class="record-field"><span class="label">ISBN Prefix</span><span class="value">{{ imp.legalIsbn.isbnPrefix }}</span></div>
                <div class="record-field"><span class="label">Block Purchased</span><span class="value">{{ imp.legalIsbn.isbnBlockPurchased }}</span></div>
                <div class="record-field"><span class="label">Block Count</span><span class="value">{{ imp.legalIsbn.isbnBlockCount }}</span></div>
                <div class="record-field"><span class="label">Assigned</span><span class="value">{{ imp.legalIsbn.isbnsAssigned }}</span></div>
                <div class="record-field"><span class="label">Remaining</span><span class="value">{{ imp.legalIsbn.isbnsRemaining }}</span></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── CONTRACTS & AGREEMENTS ── -->
      @if (activeTab() === 'contracts') {
        <div class="card">
          <h3 class="section-title">Contracts & Agreements</h3>
          <table class="data-table">
            <thead><tr><th>Contract Name</th><th>Counterparty</th><th>Type</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              @for(c of contractRecords; track c.name) {
                <tr>
                  <td class="td-primary">{{ c.name }}</td>
                  <td>{{ c.counterparty }}</td>
                  <td>{{ c.type }}</td>
                  <td>{{ c.date }}</td>
                  <td><span [class]="c.status === 'Active' ? 'status status-green' : c.status === 'Pending' ? 'status status-amber' : 'status status-default'">{{ c.status }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Contract Categories</h3>
          <div class="tag-row">
            <span class="tag">Author Contracts</span><span class="tag">Ghostwriter Agreements</span><span class="tag">Editor Agreements</span>
            <span class="tag">Cover Designer Agreements</span><span class="tag">Narrator Contracts</span><span class="tag">Formatting Agreements</span>
            <span class="tag">Translation Agreements</span><span class="tag">Affiliate Agreements</span><span class="tag">Advertising Agreements</span>
            <span class="tag">Co-Author Agreements</span><span class="tag">Royalty Split Agreements</span><span class="tag">NDAs</span>
            <span class="tag">DMCA Takedown Templates</span>
          </div>
        </div>
      }

      <!-- ── FINANCIAL RECORDS ── -->
      @if (activeTab() === 'financial') {
        <div class="card">
          <h3 class="section-title">Monthly Income Reports</h3>
          <table class="data-table">
            <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th></tr></thead>
            <tbody>
              @for(r of financialRecords; track r.month) {
                <tr>
                  <td class="td-primary">{{ r.month }}</td>
                  <td style="color:#10b981;font-weight:600">{{ r.revenue }}</td>
                  <td style="color:#ef4444">{{ r.expenses }}</td>
                  <td style="font-weight:700;color:var(--text-primary)">{{ r.net }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Financial Document Categories</h3>
          <div class="tag-row">
            <span class="tag">📊 P&L Reports</span><span class="tag">📋 Chart of Accounts</span><span class="tag">🧾 Receipts</span>
            <span class="tag">📄 Invoices</span><span class="tag">💸 Contractor Payments</span><span class="tag">📦 Subscription Costs</span>
            <span class="tag">📈 Royalty Statements</span><span class="tag">📣 Ad Spend by Platform</span><span class="tag">💰 Expense Logs</span>
          </div>
        </div>
      }

      <!-- ── TEAM & VENDORS ── -->
      @if (activeTab() === 'team') {
        <div class="card">
          <h3 class="section-title">Team & Vendor Directory</h3>
          <table class="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Company</th><th>Email</th><th>Phone</th><th>Contract Date</th><th>Rate</th></tr></thead>
            <tbody>
              @for(m of teamMembers; track m.name) {
                <tr>
                  <td class="td-primary">{{ m.name }}</td>
                  <td>{{ m.role }}</td>
                  <td>{{ m.company }}</td>
                  <td>{{ m.email }}</td>
                  <td>{{ m.phone || '—' }}</td>
                  <td>{{ m.contractDate }}</td>
                  <td>{{ m.rate }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Vendor Categories</h3>
          <div class="tag-row">
            <span class="tag">✏️ Editors</span><span class="tag">🎨 Cover Designers</span><span class="tag">🎙 Narrators</span>
            <span class="tag">🌐 Translators</span><span class="tag">📐 Formatters</span><span class="tag">📣 Marketers</span>
            <span class="tag">🤝 Virtual Assistants</span><span class="tag">�� Web Developers</span><span class="tag">🧮 Accountants</span>
            <span class="tag">⚖️ Legal Counsel</span>
          </div>
        </div>
      }

      <!-- ── WEBSITE & DOMAINS ── -->
      @if (activeTab() === 'domains') {
        <div class="card">
          <h3 class="section-title">Domain & Hosting Records</h3>
          <table class="data-table">
            <thead><tr><th>Domain</th><th>Registrar</th><th>Renewal Date</th><th>Host</th><th>SSL Renewal</th><th>CMS</th><th>Contact</th></tr></thead>
            <tbody>
              @for(d of domainRecords; track d.domain) {
                <tr>
                  <td class="td-primary"><a [href]="'https://'+d.domain" target="_blank" style="color:var(--accent-blue)">{{ d.domain }}</a></td>
                  <td>{{ d.registrar }}</td>
                  <td>{{ d.renewal }}</td>
                  <td>{{ d.host }}</td>
                  <td>{{ d.ssl }}</td>
                  <td>{{ d.cms }}</td>
                  <td>{{ d.contact }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">DNS & Technical Notes</h3>
          @for(d of domainRecords; track d.domain) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ d.domain }}</h4></div>
              <div class="record-field"><span class="label">DNS Notes</span><span class="value">{{ d.dns }}</span></div>
            </div>
          }
        </div>
      }

      <!-- ── COMMUNICATIONS ── -->
      @if (activeTab() === 'comms') {
        <div class="card">
          <h3 class="section-title">Email & Communications Setup</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Sender Domain</span><div class="form-value">authorvaultpress.com</div></div>
            <div class="form-group"><span class="form-label">Email Platform</span><div class="form-value">MailerLite</div></div>
            <div class="form-group"><span class="form-label">SPF Record</span><div class="form-value" style="font-family:monospace;font-size:.75rem;">v=spf1 include:_spf.mlsend.com ~all</div></div>
            <div class="form-group"><span class="form-label">DKIM</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">DMARC</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">Newsletter List Size</span><div class="form-value">12,400 subscribers</div></div>
            <div class="form-group"><span class="form-label">Support Inbox</span><div class="form-value">support@authorvaultpress.com</div></div>
            <div class="form-group"><span class="form-label">Business Phone</span><div class="form-value">{{ company().identity.phone }}</div></div>
            <div class="form-group"><span class="form-label">PO Box</span><div class="form-value">PO Box 1234, New York, NY 10001</div></div>
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Automation & Opt-in Sources</h3>
          <div class="tag-row">
            <span class="tag">📧 Welcome Sequence</span><span class="tag">📚 Reader Magnet Funnel</span><span class="tag">🚀 Launch Sequence</span>
            <span class="tag">🔁 Re-engagement Series</span><span class="tag">📝 Website Opt-in Form</span><span class="tag">🎁 BookFunnel Delivery</span>
            <span class="tag">📣 Facebook Lead Ads</span>
          </div>
        </div>
      }

      <!-- ── INVENTORY & FULFILLMENT ── -->
      @if (activeTab() === 'inventory') {
        <div class="card">
          <h3 class="section-title">Inventory</h3>
          <table class="data-table">
            <thead><tr><th>SKU</th><th>Title</th><th>Format</th><th>Stock</th><th>Reorder Point</th><th>Printer</th></tr></thead>
            <tbody>
              @for(item of inventoryItems; track item.sku) {
                <tr>
                  <td class="td-primary" style="font-family:monospace">{{ item.sku }}</td>
                  <td>{{ item.title }}</td>
                  <td>{{ item.format }}</td>
                  <td><span [class]="item.stock <= item.reorderPoint ? 'status status-red' : 'status status-green'">{{ item.stock }}</span></td>
                  <td>{{ item.reorderPoint }}</td>
                  <td>{{ item.printer }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Fulfillment Details</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">Fulfillment Partner</span><div class="form-value">BookVault / IngramSpark</div></div>
            <div class="form-group"><span class="form-label">Shipping Account</span><div class="form-value">UPS Business Account #****4821</div></div>
            <div class="form-group"><span class="form-label">Packaging Vendor</span><div class="form-value">Uline</div></div>
            <div class="form-group"><span class="form-label">Return Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Delivery Policy</span><div class="form-value">Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.</div></div>
          </div>
        </div>
      }

      <!-- ── SECURITY & RECOVERY ── -->
      @if (activeTab() === 'security') {
        <div class="card">
          <h3 class="section-title">Access & Security Registry</h3>
          <table class="data-table">
            <thead><tr><th>Resource</th><th>Owner</th><th>Access Level</th><th>2FA Device</th><th>Recovery Email</th><th>Notes</th></tr></thead>
            <tbody>
              @for(s of securityEntries; track s.resource) {
                <tr>
                  <td class="td-primary">{{ s.resource }}</td>
                  <td>{{ s.owner }}</td>
                  <td><span class="status status-blue">{{ s.accessLevel }}</span></td>
                  <td>{{ s.twoFa }}</td>
                  <td>{{ s.recoveryEmail }}</td>
                  <td>{{ s.notes }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Emergency Access & Offboarding</h3>
          <div class="form-grid">
            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><div class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</div></div>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</div></div>
          </div>
        </div>
      }

      <!-- ── LOGOS ── -->
      @if (activeTab() === 'logos') {
        <div class="card">
          <h3 class="section-title">Company Logos</h3>
          <p class="section-subtitle">All logo variants — upload files and tag by format</p>
          <div class="entity-list">
            @for(logo of logos; track logo.name) {
              <div class="entity-card">
                <div style="width:100%;height:80px;background:{{ logo.bg }};border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:.75rem;font-size:2rem;">🏢</div>
                <div class="entity-name">{{ logo.name }}</div>
                <div class="entity-meta">{{ logo.format }} · {{ logo.dimensions }} · {{ logo.fileType }}</div>
                <div class="entity-meta" style="margin-top:.25rem;">Uploaded: {{ logo.uploaded }}</div>
                <div class="tag-row" style="margin-top:.5rem;">
                  <span class="tag">{{ logo.format }}</span>
                  <span class="tag">{{ logo.fileType }}</span>
                </div>
              </div>
            }
            <div class="entity-card" style="border-style:dashed;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;cursor:pointer;">
              <div style="font-size:2rem;margin-bottom:.5rem;">➕</div>
              <div style="font-size:.875rem;font-weight:600;color:var(--text-secondary)">Upload Logo</div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem;">PNG, SVG, PDF, EPS</div>
            </div>
          </div>
        </div>
      }

      <!-- ── SOPs ── -->
      @if (activeTab() === 'sops') {
        <div class="card">
          <h3 class="section-title">Standard Operating Procedures</h3>
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>Description</th><th>Last Updated</th><th>Actions</th></tr></thead>
            <tbody>
              @for(s of sopTemplates; track s.name) {
                <tr>
                  <td class="td-primary">{{ s.name }}</td>
                  <td>{{ s.description }}</td>
                  <td>{{ s.updated }}</td>
                  <td>
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit;">View</button>
                    <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.8125rem;font-family:inherit;margin-left:.5rem;">Edit</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div><!-- /vault-content -->
  </div><!-- /vault-layout -->
</div><!-- /page -->
`
})
export class VaultCompanyPageComponent implements OnInit {
  private vaultService = inject(AuthorVaultService);
  readonly company = this.vaultService.company;

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
  showEin = false;

  private readonly PIN_KEY = 'av_company_unlocked';
  private readonly STORED_PIN_KEY = 'av_company_pin';
  private get storedPin(): string { return localStorage.getItem(this.STORED_PIN_KEY) || ''; }

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
  get penNameCount(): number { return this.company().imprints.reduce((a, i) => a + i.penNames.length, 0); }
  get bookCount(): number { return this.company().imprints.reduce((a, i) => i.penNames.reduce((b, p) => p.series.reduce((c, s) => c + s.books.length, b), a), 0); }
  get isbnUsed(): number { return this.isbnRecords.filter(r => r.status === 'used').length; }
  get isbnAvailable(): number { return this.isbnRecords.filter(r => r.status === 'unused').length; }
  get isbnReserved(): number { return this.isbnRecords.filter(r => r.status === 'reserved').length; }

  // ── ISBN filter ──
  isbnFilterStatus = '';
  isbnFilterFormat = '';
  get filteredIsbns(): IsbnRecord[] {
    return this.isbnRecords.filter(r =>
      (!this.isbnFilterStatus || r.status === this.isbnFilterStatus) &&
      (!this.isbnFilterFormat || r.format === this.isbnFilterFormat)
    );
  }

  // ── Mock data ──
  ownerProfiles: OwnerProfile[] = [
    { name: 'Eleanor Vance', role: 'Managing Member / CEO', ownershipPct: '100%', email: 'eleanor@authorvaultpress.com', phone: '+1 (212) 555-0147', canSign: true, canManageFinances: true, showNda: true },
  ];

  bankAccounts: BankAccount[] = [
    { bank: 'Chase Business', nickname: 'Operating Checking', account: '123456784821', routing: '021000021', wire: '021000021', swift: 'CHASUS33', showAccount: false, showRouting: false },
    { bank: 'Chase Business', nickname: 'Savings Reserve', account: '987654327733', routing: '021000021', wire: '', swift: 'CHASUS33', showAccount: false, showRouting: false },
  ];

  paymentPlatforms: Platform[] = [
    { name: 'Stripe', owner: 'Eleanor Vance', email: 'admin@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'admin@authorvaultpress.com', password: 'Str!pe2024#Vault', notes: 'Primary payment processor for direct sales', showUser: false, showPass: false },
    { name: 'PayPal Business', owner: 'Eleanor Vance', email: 'paypal@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'paypal@authorvaultpress.com', password: 'P@yP@l2024!Vault', notes: 'Used for contractor payments', showUser: false, showPass: false },
    { name: 'Wise', owner: 'Eleanor Vance', email: 'wise@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'wise@authorvaultpress.com', password: 'W!se2024#Secure', notes: 'International contractor payments', showUser: false, showPass: false },
  ];

  taxDocs: TaxDoc[] = [
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
  ];

  publishingPlatforms: Platform[] = [
    { name: 'Amazon KDP', owner: 'Eleanor Vance', email: 'kdp@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'kdp@authorvaultpress.com', password: 'KDP!2024#Vault', notes: '7 titles live. KDP Select enrolled for 3 titles.', showUser: false, showPass: false },
    { name: 'Draft2Digital', owner: 'Eleanor Vance', email: 'd2d@authorvaultpress.com', phone: '', payout: 'PayPal', taxProfile: 'Vance Publishing LLC', username: 'd2d@authorvaultpress.com', password: 'D2D!2024#Wide', notes: 'Wide distribution. Apple, Kobo, B&N, libraries.', showUser: false, showPass: false },
    { name: 'IngramSpark', owner: 'Eleanor Vance', email: 'ingram@authorvaultpress.com', phone: '', payout: 'Bank Transfer', taxProfile: 'Vance Publishing LLC', username: 'ingram@authorvaultpress.com', password: 'Ingr@m2024!', notes: 'Print distribution. 60% discount set.', showUser: false, showPass: false },
    { name: 'Kobo Writing Life', owner: 'Eleanor Vance', email: 'kobo@authorvaultpress.com', phone: '', payout: 'PayPal', taxProfile: 'Vance Publishing LLC', username: 'kobo@authorvaultpress.com', password: 'K0bo!2024#WL', notes: 'Direct Kobo uploads for select titles.', showUser: false, showPass: false },
    { name: 'Shopify (Direct Store)', owner: 'Eleanor Vance', email: 'admin@authorvaultpress.com', phone: '', payout: 'Stripe', taxProfile: 'Vance Publishing LLC', username: 'admin@authorvaultpress.com', password: 'Sh0p!fy2024#', notes: 'authorvaultpress.com/shop. BookFunnel delivery.', showUser: false, showPass: false },
    { name: 'BookFunnel', owner: 'Eleanor Vance', email: 'bf@authorvaultpress.com', phone: '', payout: 'N/A', taxProfile: 'N/A', username: 'bf@authorvaultpress.com', password: 'B00kF!2024#', notes: 'ARC delivery + direct sales delivery.', showUser: false, showPass: false },
    { name: 'MailerLite (Email)', owner: 'Eleanor Vance', email: 'ml@authorvaultpress.com', phone: '', payout: 'N/A', taxProfile: 'N/A', username: 'ml@authorvaultpress.com', password: 'M@ilerL2024!', notes: '12,400 subscribers. 42% open rate.', showUser: false, showPass: false },
    { name: 'Amazon Ads', owner: 'Eleanor Vance', email: 'ads@authorvaultpress.com', phone: '', payout: 'N/A', taxProfile: 'Vance Publishing LLC', username: 'ads@authorvaultpress.com', password: 'AmzAds!2024#', notes: 'Linked to KDP account. $800/mo budget.', showUser: false, showPass: false },
    { name: 'Facebook Ads', owner: 'Eleanor Vance', email: 'fb@authorvaultpress.com', phone: '+1 (212) 555-0147', payout: 'N/A', taxProfile: 'Vance Publishing LLC', username: 'fb@authorvaultpress.com', password: 'FbAds!2024#', notes: 'Business Manager ID: 123456789.', showUser: false, showPass: false },
  ];

  isbnRecords: IsbnRecord[] = [
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
  ];

  contractRecords: ContractRecord[] = [
    { name: 'Developmental Editing Agreement', counterparty: 'Sarah Mitchell', type: 'Editor', date: '2023-01-10', status: 'Active', file: 'contract-mitchell-2023.pdf' },
    { name: 'Cover Design Agreement', counterparty: 'James Okafor', type: 'Cover Designer', date: '2023-02-01', status: 'Active', file: 'contract-okafor-2023.pdf' },
    { name: 'Narrator Agreement — The Midnight Library', counterparty: 'Voice Arts Studio', type: 'Narrator', date: '2023-07-15', status: 'Active', file: 'contract-narrator-2023.pdf' },
    { name: 'Ghostwriter NDA', counterparty: 'Confidential', type: 'NDA', date: '2022-11-01', status: 'Active', file: 'nda-ghostwriter-2022.pdf' },
    { name: 'Translation Agreement — Spanish', counterparty: 'Maria Gonzalez Translations', type: 'Translation', date: '2024-01-20', status: 'Active', file: 'contract-translation-es-2024.pdf' },
    { name: 'Affiliate Agreement — BookTok Partner', counterparty: 'ReadWithMe LLC', type: 'Affiliate', date: '2024-03-01', status: 'Active', file: 'affiliate-readwithme-2024.pdf' },
    { name: 'Co-Author Agreement — Box Set', counterparty: 'V.E. Blackwood (pen name)', type: 'Co-Author', date: '2023-12-01', status: 'Active', file: 'coauthor-boxset-2023.pdf' },
    { name: 'DMCA Takedown Template', counterparty: 'N/A', type: 'Template', date: '2023-06-01', status: 'Template', file: 'dmca-template.docx' },
    { name: 'Royalty Split Agreement — Anthology', counterparty: 'Multiple Authors', type: 'Royalty Split', date: '2024-02-15', status: 'Active', file: 'royalty-split-anthology-2024.pdf' },
  ];

  financialRecords: FinancialRecord[] = [
    { month: 'Jan 2024', revenue: '$8,420', expenses: '$2,150', net: '$6,270' },
    { month: 'Feb 2024', revenue: '$9,180', expenses: '$1,980', net: '$7,200' },
    { month: 'Mar 2024', revenue: '$11,340', expenses: '$3,200', net: '$8,140' },
    { month: 'Apr 2024', revenue: '$10,750', expenses: '$2,800', net: '$7,950' },
    { month: 'May 2024', revenue: '$12,600', expenses: '$4,100', net: '$8,500' },
    { month: 'Jun 2024', revenue: '$15,200', expenses: '$5,500', net: '$9,700' },
  ];

  teamMembers: TeamMember[] = [
    { name: 'Sarah Mitchell', role: 'Developmental Editor', company: 'Mitchell Editing', email: 'sarah@mitchellediting.com', phone: '', contractDate: '2023-01-10', rate: '$2,500/book', notes: 'Excellent. Rehire.' },
    { name: 'James Okafor', role: 'Cover Designer', company: 'Okafor Design Studio', email: 'james@okafor.design', phone: '', contractDate: '2023-02-01', rate: '$800/cover', notes: 'Fast turnaround. Highly recommended.' },
    { name: 'Sandra Mitchell, CPA', role: 'Accountant / CPA', company: 'Mitchell CPA', email: 'sandra@mitchellcpa.com', phone: '+1 (212) 555-0200', contractDate: '2021-04-01', rate: '$250/hr', notes: 'Annual tax prep + quarterly estimates.' },
    { name: 'James Chen, Esq.', role: 'Attorney', company: 'Chen Publishing Law', email: 'jchen@publishinglaw.com', phone: '+1 (212) 555-0300', contractDate: '2021-03-15', rate: '$350/hr', notes: 'Contract review + trademark filings.' },
    { name: 'Maria Gonzalez', role: 'Translator (Spanish)', company: 'Gonzalez Translations', email: 'maria@gonzaleztrans.com', phone: '', contractDate: '2024-01-20', rate: '$0.08/word', notes: 'Spanish (MX). Excellent quality.' },
    { name: 'Voice Arts Studio', role: 'Narrator / Audio Production', company: 'Voice Arts Studio', email: 'booking@voicearts.com', phone: '+1 (310) 555-0400', contractDate: '2023-07-15', rate: '$250/finished hour', notes: 'ACX + direct delivery.' },
    { name: 'Alex Rivera', role: 'Virtual Assistant', company: 'Freelance', email: 'alex@vaservices.com', phone: '', contractDate: '2023-09-01', rate: '$25/hr', notes: 'Social media scheduling + inbox management.' },
  ];

  domainRecords: DomainRecord[] = [
    { domain: 'authorvaultpress.com', registrar: 'Namecheap', renewal: '2025-03-15', host: 'Shopify', dns: 'Cloudflare. A record → Shopify. MX → Google Workspace.', ssl: '2025-03-15 (auto-renew)', cms: 'Shopify', contact: 'Eleanor Vance' },
    { domain: 'eleanorvanc.com', registrar: 'Namecheap', renewal: '2025-06-01', host: 'WordPress (WP Engine)', dns: 'Cloudflare. A record → WP Engine.', ssl: '2025-06-01 (auto-renew)', cms: 'WordPress', contact: 'Eleanor Vance' },
    { domain: 'veblackwood.com', registrar: 'GoDaddy', renewal: '2025-09-20', host: 'WordPress (WP Engine)', dns: 'GoDaddy DNS. A record → WP Engine.', ssl: '2025-09-20 (auto-renew)', cms: 'WordPress', contact: 'Eleanor Vance' },
  ];

  inventoryItems: InventoryItem[] = [
    { sku: 'PB-ML-001', title: 'The Midnight Library', format: 'Paperback 5.5x8.5', stock: 45, reorderPoint: 20, printer: 'IngramSpark' },
    { sku: 'PB-SP-001', title: 'Shadow Protocol', format: 'Paperback 5.5x8.5', stock: 12, reorderPoint: 20, printer: 'IngramSpark' },
    { sku: 'HC-TA-001', title: 'Throne of Ashes', format: 'Hardcover 6x9', stock: 30, reorderPoint: 15, printer: 'IngramSpark' },
    { sku: 'PB-SS-001', title: 'Salt & Starlight', format: 'Paperback 6x9', stock: 8, reorderPoint: 20, printer: 'BookVault' },
    { sku: 'SB-HOM-001', title: 'Hearts of Manhattan Signed Box Set', format: 'Signed Box Set', stock: 25, reorderPoint: 10, printer: 'Local Print' },
  ];

  securityEntries: SecurityEntry[] = [
    { resource: 'Amazon KDP', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: 'Backup codes in 1Password' },
    { resource: 'Shopify Store', owner: 'Eleanor Vance', accessLevel: 'Owner', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'MailerLite', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'Email 2FA', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'Stripe', owner: 'Eleanor Vance', accessLevel: 'Admin', twoFa: 'iPhone (Authenticator)', recoveryEmail: 'recovery@authorvaultpress.com', notes: 'Backup codes in fireproof safe' },
    { resource: 'Namecheap (Domains)', owner: 'Eleanor Vance', accessLevel: 'Owner', twoFa: 'TOTP App', recoveryEmail: 'recovery@authorvaultpress.com', notes: '' },
    { resource: 'Chase Business Banking', owner: 'Eleanor Vance', accessLevel: 'Primary', twoFa: 'SMS + Token', recoveryEmail: 'N/A', notes: 'Branch: 123 Main St, NY' },
    { resource: 'Alex Rivera (VA)', owner: 'Eleanor Vance', accessLevel: 'Limited', twoFa: 'N/A', recoveryEmail: 'N/A', notes: 'Access: social media scheduler only. Revoke on offboarding.' },
  ];

  logos: Logo[] = [
    { name: 'Primary Logo — Full Color', format: 'Horizontal', dimensions: '2400x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: 'var(--primary-light)' },
    { name: 'Primary Logo — White', format: 'Horizontal', dimensions: '2400x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: '#1c2e4a' },
    { name: 'Icon Mark — Full Color', format: 'Square', dimensions: '800x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: 'var(--primary-light)' },
    { name: 'Icon Mark — White', format: 'Square', dimensions: '800x800px', fileType: 'PNG', uploaded: '2021-06-01', bg: '#1c2e4a' },
    { name: 'Vector Master File', format: 'All', dimensions: 'Scalable', fileType: 'SVG', uploaded: '2021-06-01', bg: 'var(--background)' },
    { name: 'Print-Ready Logo', format: 'Horizontal', dimensions: 'Vector', fileType: 'EPS', uploaded: '2021-06-01', bg: 'var(--background)' },
  ];

  sopTemplates: SopTemplate[] = [
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
  ];

  // ── PIN methods ──
  ngOnInit(): void {
    const stored = localStorage.getItem(this.PIN_KEY);
    this.unlocked = stored === 'true';
    // First time: no PIN has ever been set
    this.isFirstTime = !localStorage.getItem(this.STORED_PIN_KEY);
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
      // First time: set the PIN (with confirm)
      const confirmed = this.confirmPinDigits.join('');
      if (entered.length < 4) { this.pinError = true; return; }
      if (entered !== confirmed) { this.pinMismatch = true; this.confirmPinDigits = ['', '', '', '']; setTimeout(() => { const el = document.getElementById('cpin-0') as HTMLInputElement; if (el) el.focus(); }, 50); return; }
      localStorage.setItem(this.STORED_PIN_KEY, entered);
      this.isFirstTime = false;
      this.unlocked = true;
      this.pinMismatch = false;
      localStorage.setItem(this.PIN_KEY, 'true');
    } else {
      if (entered === this.storedPin) {
        this.unlocked = true;
        this.pinError = false;
        localStorage.setItem(this.PIN_KEY, 'true');
      } else {
        this.pinError = true;
        this.pinDigits = ['', '', '', ''];
        setTimeout(() => { const el = document.getElementById('pin-0') as HTMLInputElement; if (el) el.focus(); }, 50);
      }
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

  lockVault(): void {
    this.unlocked = false;
    this.pinDigits = ['', '', '', ''];
    this.pinError = false;
    localStorage.removeItem(this.PIN_KEY);
  }

  changePin(): void {
    if (this.currentPinInput !== this.storedPin) { this.pinChangeError = 'Current PIN is incorrect.'; return; }
    if (!/^\d{4}$/.test(this.newPinInput)) { this.pinChangeError = 'New PIN must be exactly 4 digits.'; return; }
    localStorage.setItem(this.STORED_PIN_KEY, this.newPinInput);
    this.pinChangeSuccess = true;
    this.pinChangeError = '';
    this.currentPinInput = '';
    this.newPinInput = '';
    setTimeout(() => { this.changingPin = false; this.pinChangeSuccess = false; }, 2000);
  }

  maskValue(val: string): string {
    if (!val) return '—';
    if (val.includes('@')) return val.split('@')[0].slice(0, 2) + '****@' + val.split('@')[1];
    return val.slice(0, 2) + '****';
  }
}
