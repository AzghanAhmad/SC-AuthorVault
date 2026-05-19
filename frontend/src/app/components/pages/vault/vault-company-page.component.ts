import { Component, inject, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { CompanyIdentity } from '../../../models/author-vault.model';
import { ExcelImportService } from '../../../services/excel-import.service';
import { VaultCompanyStoreService } from '../../../services/vault-company-store.service';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';

@Component({
  selector: 'app-vault-company-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EditableFieldComponent],
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
      <label class="entity-avatar-upload" title="Upload company avatar" style="margin-right:.5rem;">
        @if (company().identity.avatarUrl) {
          <img [src]="company().identity.avatarUrl" alt="" class="entity-avatar-img" />
        } @else {
          <span class="entity-avatar-fallback">{{ companyInitials }}</span>
        }
        <input type="file" accept="image/*" hidden (change)="onCompanyAvatar($event)" />
      </label>
      <h1 class="page-title" style="display:inline">{{ company().identity.legalName }}</h1>
      <p class="page-subtitle">{{ company().identity.entityType }} · {{ company().identity.stateOfIncorporation }} · <span class="status status-green">{{ company().identity.companyStatus }}</span></p>
    </div>
    <button (click)="lockVault()" style="display:inline-flex;align-items:center;gap:.4rem;padding:.4rem .85rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:8px;font-size:.8125rem;font-weight:500;color:var(--text-secondary);cursor:pointer;font-family:inherit;">
      🔒 Lock Vault
    </button>
  </div>

  <div class="card excel-import-card" style="margin-bottom:1.25rem;">
    <h3 class="section-title">Import company details from Excel</h3>
    <p class="section-subtitle">Columns: Field (or Field Name) and Value (or Entry).</p>
    <label class="btn-primary" style="cursor:pointer;display:inline-flex;">
      Choose file (.xlsx, .xls, .csv)
      <input type="file" accept=".xlsx,.xls,.csv" hidden (change)="onExcelImport($event)" />
    </label>
    @if (importMessage) { <p [style.color]="importError ? '#ef4444' : '#10b981'" style="margin:.75rem 0 0;font-size:.875rem;">{{ importMessage }}</p> }
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
            <app-editable-field label="Legal Name" [value]="company().identity.legalName" (valueChange)="vs.patchIdentity({ legalName: $event })"  />
            <app-editable-field label="DBA Names" [value]="company().identity.dbaNames" (valueChange)="vs.patchIdentity({ dbaNames: $event })"  />
            <app-editable-field label="Entity Type" [value]="company().identity.entityType" (valueChange)="vs.patchIdentity({ entityType: $event })"  />
            <app-editable-field label="State of Incorporation" [value]="company().identity.stateOfIncorporation" (valueChange)="vs.patchIdentity({ stateOfIncorporation: $event })"  />
            <app-editable-field label="Date of Formation" [value]="company().identity.dateOfFormation" (valueChange)="vs.patchIdentity({ dateOfFormation: $event })"  />
            <app-editable-field label="Fiscal Year End" [value]="company().identity.fiscalYearEnd" (valueChange)="vs.patchIdentity({ fiscalYearEnd: $event })"  />
            <div class="form-group"><span class="form-label">Status</span><div class="form-value"><span class="status status-green">{{ company().identity.companyStatus }}</span></div></div>
            <app-editable-field label="Website" type="url" [value]="company().identity.website" (valueChange)="vs.patchIdentity({ website: $event })" />
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
            <app-editable-field label="Legal Name" [value]="company().identity.legalName" (valueChange)="vs.patchIdentity({ legalName: $event })"  />
            <app-editable-field label="DBA / Trade Names" [value]="company().identity.dbaNames" (valueChange)="vs.patchIdentity({ dbaNames: $event })"  />
            <app-editable-field label="Business Structure" [value]="company().identity.entityType" (valueChange)="vs.patchIdentity({ entityType: $event })"  />
            <app-editable-field label="State of Registration" [value]="company().identity.stateOfIncorporation" (valueChange)="vs.patchIdentity({ stateOfIncorporation: $event })"  />
            <app-editable-field label="Country" [value]="company().identity.country || 'United States'" (valueChange)="vs.patchIdentity({ country: $event })" />
            <app-editable-field label="Date of Formation" [value]="company().identity.dateOfFormation" (valueChange)="vs.patchIdentity({ dateOfFormation: $event })"  />
            <app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />
            <app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />
            <app-editable-field label="Website" type="url" [value]="company().identity.website" (valueChange)="vs.patchIdentity({ website: $event })" />
            <app-editable-field label="Main Business Email" [value]="company().identity.primaryEmail" (valueChange)="vs.patchIdentity({ primaryEmail: $event })" type="email" />
            <app-editable-field label="Business Phone" [value]="company().identity.phone" (valueChange)="vs.patchIdentity({ phone: $event })" type="tel" />
            <app-editable-field label="Registered Agent" [value]="company().identity.registeredAgent" (valueChange)="vs.patchIdentity({ registeredAgent: $event })"  />
            <app-editable-field label="Fiscal Year End" [value]="company().identity.fiscalYearEnd" (valueChange)="vs.patchIdentity({ fiscalYearEnd: $event })"  />
            <app-editable-field label="Company Status" [value]="company().identity.companyStatus" (valueChange)="onCompanyStatus($event)" />
          </div>
        </div>
      }

      <!-- ── OWNERSHIP & MANAGEMENT ── -->
      @if (activeTab() === 'ownership') {
        <div class="card">
          <h3 class="section-title">Owners & Officers</h3>
          <table class="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Ownership %</th><th>Email</th><th>Phone</th><th>Can Sign</th><th>Manage Finances</th></tr></thead>
            <tbody>
              @for(o of ownerProfiles; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="o.name" (ngModelChange)="patchOwner(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="o.role" (ngModelChange)="patchOwner(i, 'role', $event)" /></td>
                  <td><input class="form-input" [ngModel]="o.ownershipPct" (ngModelChange)="patchOwner(i, 'ownershipPct', $event)" /></td>
                  <td><input class="form-input" [ngModel]="o.email" (ngModelChange)="patchOwner(i, 'email', $event)" /></td>
                  <td><input class="form-input" [ngModel]="o.phone" (ngModelChange)="patchOwner(i, 'phone', $event)" /></td>
                  <td>
                    <select class="form-input" [ngModel]="o.canSign" (ngModelChange)="patchOwner(i, 'canSign', $event)">
                      <option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
                    </select>
                  </td>
                  <td>
                    <select class="form-input" [ngModel]="o.canManageFinances" (ngModelChange)="patchOwner(i, 'canManageFinances', $event)">
                      <option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
                    </select>
                  </td>
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
            <app-editable-field label="Operating Agreement File" [value]="company().ownership.operatingAgreementFile" (valueChange)="vs.patchOwnership({ operatingAgreementFile: $event })" />
            <app-editable-field label="S-Corp Election File" [value]="company().ownership.sCorpElectionFile || ''" (valueChange)="vs.patchOwnership({ sCorpElectionFile: $event })" />
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
                <button (click)="revealEin()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.875rem;">{{ showEin ? '🙈 Hide' : '👁 Reveal' }}</button>
                @if(einTimer > 0) { <span style="font-size:.7rem;color:var(--text-muted);">auto-hides in {{einTimer}}s</span> }
              </div>
            </div>
            <app-editable-field label="Registered Agent" [value]="company().identity.registeredAgent" (valueChange)="vs.patchIdentity({ registeredAgent: $event })"  />
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Formation & Corporate Documents</h3>
          <table class="data-table">
            <thead><tr><th>Document</th><th>File / Reference</th><th>Status</th></tr></thead>
            <tbody>
              @for(doc of corporateDocs; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="doc.document" (ngModelChange)="patchCorpDoc(i, 'document', $event)" /></td>
                  <td><input class="form-input" [ngModel]="doc.fileRef" (ngModelChange)="patchCorpDoc(i, 'fileRef', $event)" /></td>
                  <td><input class="form-input" [ngModel]="doc.status" (ngModelChange)="patchCorpDoc(i, 'status', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Trademarks, Copyrights & Insurance</h3>
          <div class="form-grid">
            <app-editable-field label="Trademark Registrations" [value]="company().contractsLegal.trademarkRegistrations" (valueChange)="vs.patchContractsLegal({ trademarkRegistrations: $event })" />
            <app-editable-field label="Copyright Assignments" [value]="company().contractsLegal.copyrightAssignments" (valueChange)="vs.patchContractsLegal({ copyrightAssignments: $event })" />
            <app-editable-field label="Insurance Policies" [value]="company().contractsLegal.insurancePolicies" (valueChange)="vs.patchContractsLegal({ insurancePolicies: $event })" />
            <app-editable-field label="Attorney Name" [value]="company().contractsLegal.attorneyName" (valueChange)="vs.patchContractsLegal({ attorneyName: $event })" />
            <app-editable-field label="Attorney Contact" [value]="company().contractsLegal.attorneyContact" (valueChange)="vs.patchContractsLegal({ attorneyContact: $event })" type="email" />
          </div>
          <div style="margin-top:1rem;padding:.75rem;background:var(--primary-light);border-radius:8px;font-size:.8125rem;color:var(--text-secondary);display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;">
            <span>📄 Copyright Office:</span>
            <select [(ngModel)]="copyrightCountry" style="padding:.3rem .5rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit;">
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IN">India</option>
            </select>
            <a [href]="copyrightLinks[copyrightCountry]" target="_blank" style="color:var(--accent-blue)">{{ copyrightLinks[copyrightCountry] }}</a>
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
              @for(b of bankAccounts; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="b.bank" (ngModelChange)="patchBank(i, 'bank', $event)" /></td>
                  <td><input class="form-input" [ngModel]="b.nickname" (ngModelChange)="patchBank(i, 'nickname', $event)" /></td>
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
            <app-editable-field label="Payment Processors" [value]="company().financial.paymentProcessors" (valueChange)="vs.patchFinancial({ paymentProcessors: $event })" />
            <app-editable-field label="Accounting Software" [value]="company().financial.accountingSoftware" (valueChange)="vs.patchFinancial({ accountingSoftware: $event })" />
            <app-editable-field label="CPA Name" [value]="company().financial.cpaName" (valueChange)="vs.patchFinancial({ cpaName: $event })" />
            <app-editable-field label="CPA Contact" [value]="company().financial.cpaContact" (valueChange)="vs.patchFinancial({ cpaContact: $event })" type="email" />
            <app-editable-field label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />
            <app-editable-field label="State Tax Registrations" [value]="company().financial.stateTaxRegistrations" (valueChange)="vs.patchFinancial({ stateTaxRegistrations: $event })" />
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
              @for(d of taxDocs; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="d.name" (ngModelChange)="patchTaxDoc(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.type" (ngModelChange)="patchTaxDoc(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.year" (ngModelChange)="patchTaxDoc(i, 'year', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.status" (ngModelChange)="patchTaxDoc(i, 'status', $event)" /></td>
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
          @for(p of publishingPlatforms; track $index; let i = $index) {
            <div class="record-card" style="margin-bottom:.75rem;">
              <div class="record-header">
                <h4 class="record-title">{{ p.name }}</h4>
                <span class="status status-green">Active</span>
              </div>
              <div class="record-grid" style="grid-template-columns:1fr 1fr 1fr;gap:.5rem .85rem;">
                <app-editable-field label="Account Owner" [value]="p.owner" (valueChange)="patchPlatform('publishing', i, 'owner', $event)" />
                <app-editable-field label="Account Email" type="email" [value]="p.email" (valueChange)="patchPlatform('publishing', i, 'email', $event)" />
                <app-editable-field label="Recovery Phone" type="tel" [value]="p.phone" (valueChange)="patchPlatform('publishing', i, 'phone', $event)" />
                <app-editable-field label="Payout Method" [value]="p.payout" (valueChange)="patchPlatform('publishing', i, 'payout', $event)" />
                <app-editable-field label="Tax Profile Name" [value]="p.taxProfile" (valueChange)="patchPlatform('publishing', i, 'taxProfile', $event)" />
                <app-editable-field label="Account ID" [value]="p.accountId" (valueChange)="patchPlatform('publishing', i, 'accountId', $event)" />
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
              </div>
              <div style="margin-top:.5rem;padding:.5rem .75rem;background:var(--primary-light);border-radius:6px;">
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:.8125rem;">
                  <div><span style="color:var(--text-muted);">Account Rep:</span> <strong style="color:var(--text-primary);">{{ p.accountRep || 'Customer Service' }}</strong></div>
                  <div><span style="color:var(--text-muted);">Rep Email:</span> @if(p.repEmail) { <a [href]="'mailto:'+p.repEmail" style="color:var(--accent-blue);">{{ p.repEmail }}</a> } @else { <span style="color:var(--text-secondary)">—</span> }</div>
                </div>
              </div>
              <app-editable-field label="Notes" [value]="p.notes" (valueChange)="patchPlatform('publishing', i, 'notes', $event)" [full]="true" />
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
              @for(r of filteredIsbns; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" style="font-family:monospace" [ngModel]="r.isbn" (ngModelChange)="patchIsbn(i, 'isbn', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.format" (ngModelChange)="patchIsbn(i, 'format', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.title" (ngModelChange)="patchIsbn(i, 'title', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.imprint" (ngModelChange)="patchIsbn(i, 'imprint', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.series" (ngModelChange)="patchIsbn(i, 'series', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.pubDate" (ngModelChange)="patchIsbn(i, 'pubDate', $event)" /></td>
                  <td>
                    <select class="form-input" [ngModel]="r.status" (ngModelChange)="patchIsbn(i, 'status', $event)">
                      <option value="used">Used</option><option value="unused">Available</option><option value="reserved">Reserved</option>
                    </select>
                  </td>
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
              @for(c of contractRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="c.name" (ngModelChange)="patchContract(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.counterparty" (ngModelChange)="patchContract(i, 'counterparty', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.type" (ngModelChange)="patchContract(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.date" (ngModelChange)="patchContract(i, 'date', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.status" (ngModelChange)="patchContract(i, 'status', $event)" /></td>
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
              @for(r of financialRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="r.month" (ngModelChange)="patchFinancial(i, 'month', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.revenue" (ngModelChange)="patchFinancial(i, 'revenue', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.expenses" (ngModelChange)="patchFinancial(i, 'expenses', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.net" (ngModelChange)="patchFinancial(i, 'net', $event)" /></td>
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
              @for(m of teamMembers; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="m.name" (ngModelChange)="patchTeam(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.role" (ngModelChange)="patchTeam(i, 'role', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.company" (ngModelChange)="patchTeam(i, 'company', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.email" (ngModelChange)="patchTeam(i, 'email', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.phone" (ngModelChange)="patchTeam(i, 'phone', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.contractDate" (ngModelChange)="patchTeam(i, 'contractDate', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.rate" (ngModelChange)="patchTeam(i, 'rate', $event)" /></td>
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
              @for(d of domainRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="d.domain" (ngModelChange)="patchDomain(i, 'domain', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.registrar" (ngModelChange)="patchDomain(i, 'registrar', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.renewal" (ngModelChange)="patchDomain(i, 'renewal', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.host" (ngModelChange)="patchDomain(i, 'host', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.ssl" (ngModelChange)="patchDomain(i, 'ssl', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.cms" (ngModelChange)="patchDomain(i, 'cms', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.contact" (ngModelChange)="patchDomain(i, 'contact', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">DNS & Technical Notes</h3>
          @for(d of domainRecords; track $index; let i = $index) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ d.domain }}</h4></div>
              <app-editable-field label="DNS Notes" [value]="d.dns" (valueChange)="patchDomain(i, 'dns', $event)" [full]="true" />
            </div>
          }
        </div>
      }

      <!-- ── COMMUNICATIONS ── -->
      @if (activeTab() === 'comms') {
        <div class="card">
          <h3 class="section-title">Email & Communications Setup</h3>
          <div class="form-grid">
            <app-editable-field label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />
            <app-editable-field label="SPF Record" [value]="communications.spfRecord" (valueChange)="patchComms('spfRecord', $event)" />
            <app-editable-field label="DKIM" [value]="communications.dkimStatus" (valueChange)="patchComms('dkimStatus', $event)" />
            <app-editable-field label="DMARC" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />
            <app-editable-field label="Support Inbox" [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" />
            <app-editable-field label="Business Phone" [value]="company().identity.phone" (valueChange)="vs.patchIdentity({ phone: $event })" type="tel" />
            <app-editable-field label="PO Box" [value]="communications.poBox" (valueChange)="patchComms('poBox', $event)" />
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
              @for(item of inventoryItems; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" style="font-family:monospace" [ngModel]="item.sku" (ngModelChange)="patchInventory(i, 'sku', $event)" /></td>
                  <td><input class="form-input" [ngModel]="item.title" (ngModelChange)="patchInventory(i, 'title', $event)" /></td>
                  <td><input class="form-input" [ngModel]="item.format" (ngModelChange)="patchInventory(i, 'format', $event)" /></td>
                  <td><input class="form-input" type="number" [ngModel]="item.stock" (ngModelChange)="patchInventory(i, 'stock', +$event)" /></td>
                  <td><input class="form-input" type="number" [ngModel]="item.reorderPoint" (ngModelChange)="patchInventory(i, 'reorderPoint', +$event)" /></td>
                  <td><input class="form-input" [ngModel]="item.printer" (ngModelChange)="patchInventory(i, 'printer', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Fulfillment Details</h3>
          <div class="form-grid">
            <app-editable-field label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('packagingVendor', $event)" />
            <app-editable-field label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field label="Delivery Policy" type="textarea" [rows]="3" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />
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
              @for(s of securityEntries; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="s.resource" (ngModelChange)="patchSecurity(i, 'resource', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.owner" (ngModelChange)="patchSecurity(i, 'owner', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.accessLevel" (ngModelChange)="patchSecurity(i, 'accessLevel', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.twoFa" (ngModelChange)="patchSecurity(i, 'twoFa', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.recoveryEmail" (ngModelChange)="patchSecurity(i, 'recoveryEmail', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.notes" (ngModelChange)="patchSecurity(i, 'notes', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Emergency Access & Offboarding</h3>
          <div class="form-grid">
            <app-editable-field label="Emergency Access Instructions" type="textarea" [rows]="4" [value]="securityNotes.emergencyAccess" (valueChange)="patchSecurityNotes('emergencyAccess', $event)" [full]="true" />
            <app-editable-field label="Contractor Offboarding Steps" type="textarea" [rows]="4" [value]="securityNotes.offboardingSteps" (valueChange)="patchSecurityNotes('offboardingSteps', $event)" [full]="true" />
          </div>
        </div>
      }

      <!-- ── LOGOS ── -->
      @if (activeTab() === 'logos') {
        <div class="card">
          <h3 class="section-title">Company Logos</h3>
          <p class="section-subtitle">All logo variants — upload files and tag by format</p>
          <div class="entity-list">
            @for(logo of logos; track $index; let i = $index) {
              <div class="entity-card">
                <div style="width:100%;height:80px;background:{{ logo.bg }};border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:.75rem;font-size:2rem;">🏢</div>
                <input class="form-input" style="margin-bottom:.35rem;font-weight:600" [ngModel]="logo.name" (ngModelChange)="patchLogo(i, 'name', $event)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.format" (ngModelChange)="patchLogo(i, 'format', $event)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.dimensions" (ngModelChange)="patchLogo(i, 'dimensions', $event)" />
                <input class="form-input" style="font-size:.75rem" [ngModel]="logo.uploaded" (ngModelChange)="patchLogo(i, 'uploaded', $event)" />
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 class="section-title" style="margin:0">Standard Operating Procedures</h3>
            <input type="text" [(ngModel)]="sopFilter" placeholder="Search SOPs..." style="padding:.4rem .75rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-primary);font-size:.8125rem;font-family:inherit;width:220px;">
          </div>
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>Description</th><th>Last Updated</th><th>Actions</th></tr></thead>
            <tbody>
              @for(s of filteredSops; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="s.name" (ngModelChange)="patchSop(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.description" (ngModelChange)="patchSop(i, 'description', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.updated" (ngModelChange)="patchSop(i, 'updated', $event)" /></td>
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
  readonly vs = inject(AuthorVaultService);
  private excelImport = inject(ExcelImportService);
  private companyStore = inject(VaultCompanyStoreService);
  readonly company = this.vs.company;

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

  patchOwner(i: number, key: string, val: string | boolean): void {
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
    const list = [...this.securityEntries];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateSecurity(list);
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
  showEin = false;
  einTimer = 0;
  private einTimerRef: any;
  copyrightCountry = 'US';
  copyrightLinks: Record<string,string> = {
    US: 'https://www.copyright.gov',
    UK: 'https://www.gov.uk/copyright',
    CA: 'https://ised-isde.canada.ca/site/canadian-intellectual-property-office',
    AU: 'https://www.ipaustralia.gov.au',
    DE: 'https://www.dpma.de/english/',
    FR: 'https://www.inpi.fr/en',
    IN: 'https://copyright.gov.in'
  };
  sopFilter = '';
  private pinTimeoutRef: any;
  private readonly PIN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  private readonly PIN_KEY = 'av_company_unlocked';
  private readonly PIN_ACTIVITY_KEY = 'av_company_pin_activity';
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
  get filteredSops() {
    if (!this.sopFilter.trim()) return this.sopTemplates;
    const q = this.sopFilter.toLowerCase();
    return this.sopTemplates.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
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
    this.isFirstTime = !localStorage.getItem(this.STORED_PIN_KEY);
    this.unlocked = this.isSessionValid();
    if (!this.unlocked) localStorage.removeItem(this.PIN_KEY);
    else this.resetPinTimeout();
  }

  private isSessionValid(): boolean {
    if (localStorage.getItem(this.PIN_KEY) !== 'true') return false;
    const last = Number(localStorage.getItem(this.PIN_ACTIVITY_KEY) || 0);
    if (!last) return false;
    return Date.now() - last < this.PIN_TIMEOUT_MS;
  }

  private touchActivity(): void {
    if (!this.unlocked) return;
    localStorage.setItem(this.PIN_ACTIVITY_KEY, String(Date.now()));
    localStorage.setItem(this.PIN_KEY, 'true');
    this.resetPinTimeout();
  }

  private checkPinExpiry(): void {
    if (this.unlocked && !this.isSessionValid()) this.lockVault();
  }

  /** Reset PIN auto-lock timer (10 minutes) */
  private resetPinTimeout(): void {
    clearTimeout(this.pinTimeoutRef);
    this.pinTimeoutRef = setTimeout(() => this.checkPinExpiry(), this.PIN_TIMEOUT_MS);
  }

  /** Reveal EIN with auto-hide after 60 seconds */
  revealEin(): void {
    if (this.showEin) { this.showEin = false; this.einTimer = 0; clearInterval(this.einTimerRef); return; }
    this.showEin = true;
    this.einTimer = 60;
    clearInterval(this.einTimerRef);
    this.einTimerRef = setInterval(() => {
      this.einTimer--;
      if (this.einTimer <= 0) { this.showEin = false; clearInterval(this.einTimerRef); }
    }, 1000);
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
      this.touchActivity();
    } else {
      if (entered === this.storedPin) {
        this.unlocked = true;
        this.pinError = false;
        this.touchActivity();
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
    this.showEin = false;
    this.einTimer = 0;
    clearInterval(this.einTimerRef);
    clearTimeout(this.pinTimeoutRef);
    localStorage.removeItem(this.PIN_KEY);
    localStorage.removeItem(this.PIN_ACTIVITY_KEY);
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

  scEmailHref(email: string): string {
    return `https://mail.scribecount.com/compose?to=${encodeURIComponent(email)}`;
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

  onCompanyStatus(value: string): void {
    this.vs.patchIdentity({ companyStatus: value as CompanyIdentity['companyStatus'] });
  }

  onCompanyAvatar(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setCompanyAvatar(reader.result as string);
    reader.readAsDataURL(file);
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
