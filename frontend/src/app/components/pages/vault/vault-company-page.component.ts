import { Component, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
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
            <label style="font-size:.75rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing: .04em;display:block;margin-bottom:.35rem;">Current PIN</label>
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
      <label class="entity-avatar-upload" title="Upload company avatar (Click to change)" style="margin-right:.5rem;">
        @if (company().identity.avatarUrl) {
          <img [src]="company().identity.avatarUrl" alt="" class="entity-avatar-img" />
        } @else {
          <span class="entity-avatar-fallback">{{ companyInitials }}</span>
        }
        <input type="file" accept="image/*" hidden (change)="onCompanyAvatar($event)" />
      </label>
      <div class="page-title-wrap" style="display:inline-flex; align-items:center; vertical-align:middle;">
        <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2.5 21h19"/>
          <path d="M4.5 21V11.5h3.5V21"/>
          <path d="M6.25 13.5v5"/>
          <path d="M8.5 21V6h7V21"/>
          <path d="M12 6V2.75"/>
          <path d="M9.75 8h4.5"/><path d="M9.75 9.75h4.5"/><path d="M9.75 11.5h4.5"/>
          <path d="M9.75 13.25h4.5"/><path d="M9.75 15h4.5"/><path d="M9.75 16.75h4.5"/>
          <path d="M9.75 18.5h4.5"/>
          <path d="M16 21V11.5h3.5V21"/>
          <path d="M17.75 13.5v5"/>
        </svg>
        <h1 class="page-title" style="margin: 0 0 0 0.5rem; display: inline-block;">{{ company().identity.legalName }}</h1>
      </div>
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
        <button class="tab-item" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)">
          @switch (t.id) {
            @case ('overview') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M21 12H3M12 3v18"/></svg>
            }
            @case ('identity') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            }
            @case ('ownership') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }
            @case ('legal') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V8M5 12H19M19 12a4 4 0 1 1-8 0M5 12a4 4 0 1 1 8 0M2 22h20"/></svg>
            }
            @case ('banking') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            }
            @case ('tax') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            }
            @case ('platforms') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            }
            @case ('isbns') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            }
            @case ('contracts') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            }
            @case ('financial') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            }
            @case ('team') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            }
            @case ('domains') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            }
            @case ('comms') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            }
            @case ('inventory') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            }
            @case ('security') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            }
            @case ('logos') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="11.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
            }
            @case ('sops') {
              <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
            }
          }
          {{ t.label }}
        </button>
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
                  <td>
                    <div style="display:flex;align-items:center;gap:.35rem">
                      <input class="form-input" style="flex:1" [ngModel]="o.email" (ngModelChange)="patchOwner(i, 'email', $event)" />
                      @if (o.email) {
                        <a [href]="scEmailHref(o.email)" target="_blank" rel="noopener noreferrer" title="Compose email in SC Email" style="color:var(--accent-blue);flex-shrink:0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </a>
                      }
                    </div>
                  </td>
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
          <p class="section-subtitle">Upload CVs, letterhead, business cards, avatar photos, bios, electronic signatures, job descriptions, and signed NDAs for each person</p>
          @for(o of ownerProfiles; track o.name; let oi = $index) {
            <div class="record-card" style="margin-bottom:1rem">
              <div class="record-header"><h4 class="record-title">{{ o.name }} — {{ o.role }}</h4></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.625rem;margin-top:.75rem">
                @for(slot of ownerDocSlots; track slot.key) {
                  <div class="doc-upload-slot" [class.has-file]="o.docs?.[slot.key]" [title]="o.docs?.[slot.key] ? 'Click to view ' + slot.label : 'Upload ' + slot.label">
                    <span class="doc-slot-icon">{{ slot.icon }}</span>
                    <div class="doc-slot-body" (click)="o.docs?.[slot.key] ? downloadFile(o.docs?.[slot.key]) : null">
                      <span class="doc-slot-name" [style.text-decoration]="o.docs?.[slot.key] ? 'underline' : 'none'">{{ slot.label }}</span>
                      <span class="doc-slot-hint">{{ o.docs?.[slot.key] ? '✓ ' + o.docs?.[slot.key] : slot.hint }}</span>
                    </div>
                    @if (o.docs?.[slot.key]) {
                      <span class="doc-slot-btn-delete" title="Delete document" (click)="$event.stopPropagation(); removeOwnerDoc(oi, slot.key)">✕</span>
                    } @else {
                      <label style="margin:0;cursor:pointer;" class="doc-slot-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Attach
                        <input type="file" hidden (change)="onOwnerDocUpload($event, oi, slot.key)" />
                      </label>
                    }
                  </div>
                }
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
                <div class="form-value" style="flex:1">{{ isRevealed('legal-ein') ? company().identity.einTaxId : '**-*******' }}</div>
                <button (click)="toggleReveal('legal-ein')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.875rem;">
                  {{ isRevealed('legal-ein') ? '🙈 Hide (' + getTimerValue('legal-ein') + 's)' : '👁 Reveal' }}
                </button>
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
                    <span style="font-family:monospace">{{ isRevealed('bank-account-' + i) ? b.account : '****' + b.account.slice(-4) }}</span>
                    <button (click)="toggleReveal('bank-account-' + i)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">
                      {{ isRevealed('bank-account-' + i) ? '🙈' + ' (' + getTimerValue('bank-account-' + i) + 's)' : '👁' }}
                    </button>
                  </td>
                  <td>
                    <span style="font-family:monospace">{{ isRevealed('bank-routing-' + i) ? b.routing : '****' + b.routing.slice(-4) }}</span>
                    <button (click)="toggleReveal('bank-routing-' + i)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">
                      {{ isRevealed('bank-routing-' + i) ? '🙈' + ' (' + getTimerValue('bank-routing-' + i) + 's)' : '👁' }}
                    </button>
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
          <p class="section-subtitle">Stripe, PayPal, Wise — usernames and passwords are masked by default (60s timer)</p>
          <table class="data-table">
            <thead><tr><th>Platform</th><th>Username / Email</th><th>Password</th><th>Recovery</th><th>Notes</th></tr></thead>
            <tbody>
              @for(p of paymentPlatforms; track p.name) {
                <tr>
                  <td class="td-primary">{{ p.name }}</td>
                  <td>
                    <span>{{ isRevealed('payment-user-' + p.name) ? p.username : maskValue(p.username) }}</span>
                    <button (click)="toggleReveal('payment-user-' + p.name)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">
                      {{ isRevealed('payment-user-' + p.name) ? '🙈 (' + getTimerValue('payment-user-' + p.name) + 's)' : '👁' }}
                    </button>
                  </td>
                  <td>
                    <span style="font-family:monospace">{{ isRevealed('payment-pass-' + p.name) ? p.password : '••••••••' }}</span>
                    <button (click)="toggleReveal('payment-pass-' + p.name)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:.35rem;">
                      {{ isRevealed('payment-pass-' + p.name) ? '🙈 (' + getTimerValue('payment-pass-' + p.name) + 's)' : '👁' }}
                    </button>
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 class="section-title" style="margin:0">Tax Documents</h3>
            <label class="btn-primary btn-sm" style="cursor:pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Tax Doc
              <input type="file" hidden accept=".pdf,.docx,.xlsx,.png,.jpg" (change)="onTaxDocUpload($event)" />
            </label>
          </div>
          <p style="font-size:.8125rem;color:var(--text-muted);margin-bottom:.75rem">
            Click <strong>Upload Tax Doc</strong> to upload a general file, or upload directly to a specific row slot in the table below.
          </p>
          <table class="data-table">
            <thead><tr><th>Document</th><th>Type</th><th>Year</th><th>Status</th><th>File</th></tr></thead>
            <tbody>
              @for(d of taxDocs; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="d.name" (ngModelChange)="patchTaxDoc(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.type" (ngModelChange)="patchTaxDoc(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.year" (ngModelChange)="patchTaxDoc(i, 'year', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.status" (ngModelChange)="patchTaxDoc(i, 'status', $event)" /></td>
                  <td>
                    @if (d.fileName) {
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="color:var(--success);cursor:pointer;font-weight:600;text-decoration:underline" (click)="downloadFile(d.fileName)" title="Click to view file">📄 {{ d.fileName }}</span>
                        <button class="row-upload-btn" style="padding:.2rem .4rem;border-color:var(--text-muted);color:var(--text-secondary)" (click)="removeTaxDocFile(i)" title="Remove file">✕</button>
                      </div>
                    } @else {
                      <label class="row-upload-btn" [title]="'Upload file for: ' + d.name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Upload File
                        <input type="file" hidden accept=".pdf,.docx,.xlsx,.png,.jpg" (change)="onTaxDocRowUpload($event, i)" />
                      </label>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <h3 class="section-title">Tax Registrations & Contacts</h3>
          <div class="form-grid">
            <div class="form-group"><span class="form-label">EIN Confirmation</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1">ein-confirmation-cp575.pdf</div>
                <label class="row-upload-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Replace<input type="file" hidden accept=".pdf" /></label>
              </div>
            </div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1">resale-cert-ny.pdf</div>
                <label class="row-upload-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>Replace<input type="file" hidden accept=".pdf" /></label>
              </div>
            </div>
            <div class="form-group"><span class="form-label">Accountant</span><div class="form-value">{{ company().financial.cpaName }}</div></div>
            <div class="form-group"><span class="form-label">Accountant Email</span>
              <div class="form-value">
                <a [href]="scEmailHref(company().financial.cpaContact)" target="_blank" rel="noopener noreferrer" style="color:var(--accent-blue);text-decoration:none;display:inline-flex;align-items:center;gap:.3rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  {{ company().financial.cpaContact }}
                </a>
              </div>
            </div>
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
          <p class="section-subtitle">All platform credentials — usernames and passwords are masked by default (60s timer)</p>
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
                    {{ isRevealed('platform-user-' + p.name) ? p.username : maskValue(p.username) }}
                    <button (click)="toggleReveal('platform-user-' + p.name)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.75rem;">
                      {{ isRevealed('platform-user-' + p.name) ? '🙈 (' + getTimerValue('platform-user-' + p.name) + 's)' : '👁' }}
                    </button>
                  </span>
                </div>
                <div class="record-field">
                  <span class="label">Password</span>
                  <span class="value" style="display:flex;align-items:center;gap:.35rem;font-family:monospace;">
                    {{ isRevealed('platform-pass-' + p.name) ? p.password : '••••••••' }}
                    <button (click)="toggleReveal('platform-pass-' + p.name)" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.75rem;">
                      {{ isRevealed('platform-pass-' + p.name) ? '🙈 (' + getTimerValue('platform-pass-' + p.name) + 's)' : '👁' }}
                    </button>
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 class="section-title" style="margin:0">Contracts & Agreements</h3>
            <label class="btn-primary btn-sm" style="cursor:pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Contract
              <input type="file" hidden accept=".pdf,.docx" (change)="onContractUpload($event)" />
            </label>
          </div>
          <table class="data-table">
            <thead><tr><th>Contract Name</th><th>Counterparty</th><th>Type</th><th>Date</th><th>Status</th><th>File</th></tr></thead>
            <tbody>
              @for(c of contractRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="c.name" (ngModelChange)="patchContract(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.counterparty" (ngModelChange)="patchContract(i, 'counterparty', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.type" (ngModelChange)="patchContract(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.date" (ngModelChange)="patchContract(i, 'date', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.status" (ngModelChange)="patchContract(i, 'status', $event)" /></td>
                  <td>
                    @if (c.file) {
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="color:var(--accent-blue);cursor:pointer;font-weight:600;text-decoration:underline" (click)="downloadFile(c.file)" title="Click to view file">📄 {{ c.file }}</span>
                        <button class="row-upload-btn" style="padding:.2rem .4rem;border-color:var(--text-muted);color:var(--text-secondary)" (click)="removeContractFile(i)" title="Remove file">✕</button>
                      </div>
                    } @else {
                      <label class="row-upload-btn" [title]="'Attach file to: ' + c.name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Upload Contract
                        <input type="file" hidden accept=".pdf,.docx" (change)="onContractRowUpload($event, i)" />
                      </label>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h3 class="section-title" style="margin:0">Contract Templates</h3>
            <select [(ngModel)]="contractCategoryFilter" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
              <option value="">All Categories</option>
              <option value="Author">Author Contracts</option>
              <option value="Ghostwriter">Ghostwriter Agreements</option>
              <option value="Editor">Editor Agreements</option>
              <option value="Cover Designer">Cover Designer Agreements</option>
              <option value="Narrator">Narrator Contracts</option>
              <option value="Formatting">Formatting Agreements</option>
              <option value="Translation">Translation Agreements</option>
              <option value="Affiliate">Affiliate Agreements</option>
              <option value="Advertising">Advertising Agreements</option>
              <option value="Co-Author">Co-Author Agreements</option>
              <option value="Royalty">Royalty Split Agreements</option>
              <option value="NDA">NDAs</option>
              <option value="DMCA">DMCA Takedown Templates</option>
            </select>
          </div>
          <p style="font-size:.8125rem;color:var(--text-muted);margin-bottom:.75rem">
            Sample templates you can open, edit, and send directly from AuthorVAULT. Click <strong>View</strong> to open the template editor.
          </p>
          <table class="data-table">
            <thead><tr><th>Template Name</th><th>Category</th><th>Last Updated</th><th>Actions</th></tr></thead>
            <tbody>
              @for(t of filteredContractTemplates; track t.name) {
                <tr>
                  <td class="td-primary">{{ t.name }}</td>
                  <td><span class="tag">{{ t.category }}</span></td>
                  <td class="td-muted">{{ t.updated }}</td>
                  <td style="display:flex;gap:.5rem;align-items:center">
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="viewContractTemplate(t)">View & Edit</button>
                    <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="useContractTemplate(t)">Quick Use</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
            <h3 class="section-title" style="margin:0">Financial Reports & Files</h3>
            <div style="display:flex;gap:.5rem;align-items:center">
              <select [(ngModel)]="financialCategoryFilter" style="padding:.4rem .6rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
                <option value="">All Categories</option>
                <option value="📊 P&L Reports">📊 P&L Reports</option>
                <option value="📋 Chart of Accounts">📋 Chart of Accounts</option>
                <option value="🧾 Receipts">🧾 Receipts</option>
                <option value="📄 Invoices">📄 Invoices</option>
                <option value="💸 Contractor Payments">💸 Contractor Payments</option>
                <option value="📦 Subscription Costs">📦 Subscription Costs</option>
                <option value="📈 Royalty Statements">📈 Royalty Statements</option>
                <option value="📣 Ad Spend by Platform">📣 Ad Spend by Platform</option>
                <option value="💰 Expense Logs">💰 Expense Logs</option>
              </select>
              <label class="btn-primary btn-sm" style="cursor:pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Report
                <input type="file" hidden accept=".pdf,.xlsx,.csv,.png" (change)="onFinancialUpload($event)" />
              </label>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>File Name</th><th>Category</th><th>Period</th><th>Size</th><th>Date Uploaded</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for(f of filteredFinancialDocs; track $index) {
                <tr>
                  <td class="td-primary" style="cursor:pointer;color:var(--accent-blue);text-decoration:underline" (click)="downloadFile(f.fileName)">📄 {{ f.fileName }}</td>
                  <td><span class="tag">{{ f.category }}</span></td>
                  <td>{{ f.month }} {{ f.year }}</td>
                  <td style="color:var(--text-muted)">{{ f.fileSize || 'N/A' }}</td>
                  <td style="color:var(--text-muted)">{{ f.uploadedDate || 'N/A' }}</td>
                  <td><span class="status status-green">{{ f.status }}</span></td>
                  <td>
                    <button style="background:none;border:none;color:var(--error);cursor:pointer;font-size:.8125rem" (click)="deleteFinancialDoc(f)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- ── TEAM & VENDORS ── -->
      @if (activeTab() === 'team') {
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h3 class="section-title" style="margin:0">Team & Vendor Directory</h3>
            <select [(ngModel)]="vendorCategoryFilter" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
              <option value="">All Categories</option>
              <option value="Editor">✏️ Editors</option>
              <option value="Cover Designer">🎨 Cover Designers</option>
              <option value="Narrator">🎙 Narrators</option>
              <option value="Translator">🌐 Translators</option>
              <option value="Formatter">📐 Formatters</option>
              <option value="Marketer">📣 Marketers</option>
              <option value="Virtual Assistant">🤝 Virtual Assistants</option>
              <option value="Web Developer">💻 Web Developers</option>
              <option value="Accountant">🧮 Accountants</option>
              <option value="Legal">⚖️ Legal Counsel</option>
            </select>
          </div>
          <table class="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Company</th><th>Email</th><th>Phone</th><th>Contract Date</th><th>Rate</th></tr></thead>
            <tbody>
              @for(m of filteredTeamMembers; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="m.name" (ngModelChange)="patchTeam(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.role" (ngModelChange)="patchTeam(i, 'role', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.company" (ngModelChange)="patchTeam(i, 'company', $event)" /></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:.35rem">
                      <input class="form-input" style="flex:1" [ngModel]="m.email" (ngModelChange)="patchTeam(i, 'email', $event)" />
                      @if (m.email) {
                        <a [href]="scEmailHref(m.email)" target="_blank" rel="noopener noreferrer" title="Compose email" style="color:var(--accent-blue);flex-shrink:0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </a>
                      }
                    </div>
                  </td>
                  <td><input class="form-input" [ngModel]="m.phone" (ngModelChange)="patchTeam(i, 'phone', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.contractDate" (ngModelChange)="patchTeam(i, 'contractDate', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.rate" (ngModelChange)="patchTeam(i, 'rate', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
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

            <!-- SPF — masked with timer -->
            <div class="form-group">
              <span class="form-label">SPF Record</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-spf') ? communications.spfRecord : maskSensitive(communications.spfRecord) }}
                </div>
                <button (click)="toggleReveal('comms-spf')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8125rem;white-space:nowrap">
                  {{ isRevealed('comms-spf') ? '🙈 Hide (' + getTimerValue('comms-spf') + 's)' : '👁 Reveal' }}
                </button>
              </div>
            </div>

            <!-- DKIM — masked with timer -->
            <div class="form-group">
              <span class="form-label">DKIM Key</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-dkim') ? communications.dkimStatus : maskSensitive(communications.dkimStatus) }}
                </div>
                <button (click)="toggleReveal('comms-dkim')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8125rem;white-space:nowrap">
                  {{ isRevealed('comms-dkim') ? '🙈 Hide (' + getTimerValue('comms-dkim') + 's)' : '👁 Reveal' }}
                </button>
              </div>
            </div>

            <!-- API Key — masked with timer -->
            <div class="form-group">
              <span class="form-label">Newsletter API Key</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-api-key') ? communications.apiKey : maskSensitive(communications.apiKey) }}
                </div>
                <button (click)="toggleReveal('comms-api-key')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8125rem;white-space:nowrap">
                  {{ isRevealed('comms-api-key') ? '🙈 Hide (' + getTimerValue('comms-api-key') + 's)' : '👁 Reveal' }}
                </button>
              </div>
            </div>

            <!-- SMTP Password — masked with timer -->
            <div class="form-group">
              <span class="form-label">SMTP Password</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-smtp-pass') ? communications.smtpPassword : '••••••••••••••••' }}
                </div>
                <button (click)="toggleReveal('comms-smtp-pass')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:.8125rem;white-space:nowrap">
                  {{ isRevealed('comms-smtp-pass') ? '🙈 Hide (' + getTimerValue('comms-smtp-pass') + 's)' : '👁 Reveal' }}
                </button>
              </div>
            </div>

            <app-editable-field label="DMARC Policy" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />

            <!-- Support Inbox — clickable email -->
            <div class="form-group">
              <span class="form-label">Support Inbox</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <app-editable-field [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" style="flex:1" />
                @if (communications.supportInbox) {
                  <a [href]="scEmailHref(communications.supportInbox)" target="_blank" rel="noopener noreferrer" title="Compose email" style="color:var(--accent-blue);flex-shrink:0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </a>
                }
              </div>
            </div>
            <app-editable-field label="Business Phone" [value]="company().identity.phone" (valueChange)="vs.patchIdentity({ phone: $event })" type="tel" />
            <app-editable-field label="PO Box" [value]="communications.poBox" (valueChange)="patchComms('poBox', $event)" />
          </div>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h3 class="section-title" style="margin:0">Automations & Opt-in Sources</h3>
            <select [(ngModel)]="commsAutomationFilter" style="padding:.35rem .6rem;border:1px solid var(--border-color);border-radius:6px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
              <option value="">All Types</option>
              <option value="Welcome">Welcome Sequences</option>
              <option value="Funnel">Reader Funnels</option>
              <option value="Launch">Launch Sequences</option>
              <option value="Re-engagement">Re-engagement</option>
              <option value="Opt-in">Opt-in Sources</option>
              <option value="Delivery">Delivery Automations</option>
              <option value="Ads">Ad Opt-ins</option>
            </select>
          </div>
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
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('shippingAccount', $event)" />
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
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 class="section-title" style="margin:0">Company Logos</h3>
            <label class="btn-primary btn-sm" style="cursor:pointer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Logo
              <input type="file" hidden accept=".png,.svg,.pdf,.eps,.ai,.jpg" (change)="onLogoUpload($event)" />
            </label>
          </div>
          <p style="font-size:.8125rem;color:var(--text-muted);margin-bottom:.875rem">Upload your logo in every format — PNG, SVG, EPS, PDF. Click a logo card to replace its file.</p>

          <!-- Logos Search & Filter bar -->
          <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap">
            <input type="text" [(ngModel)]="logoSearch" placeholder="Search logos..." style="padding:.4rem .75rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-primary);font-size:.8125rem;font-family:inherit;width:220px">
            <select [(ngModel)]="logoFormatFilter" style="padding:.4rem .6rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
              <option value="">All Formats</option>
              <option value="Horizontal">Horizontal</option>
              <option value="Square">Square</option>
              <option value="All">All / Vector</option>
            </select>
            <select [(ngModel)]="logoTypeFilter" style="padding:.4rem .6rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
              <option value="">All File Types</option>
              <option value="PNG">PNG</option>
              <option value="SVG">SVG</option>
              <option value="EPS">EPS</option>
            </select>
          </div>

          <div class="entity-list">
            @for(logo of filteredLogos; track $index; let i = $index) {
              <div class="entity-card" style="position:relative">
                <label style="cursor:pointer;display:block" title="Click to replace this logo file">
                  <div style="width:100%;height:80px;background:{{ logo.bg }};border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:.75rem;position:relative;overflow:hidden">
                    @if (logo.dataUrl) {
                      <div [innerHTML]="logo.dataUrl.startsWith('data:image/svg+xml') ? decodeSvg(logo.dataUrl) : ''" *ngIf="logo.dataUrl.startsWith('data:image/svg+xml')" style="width:100%;height:100%"></div>
                      <img [src]="logo.dataUrl" *ngIf="!logo.dataUrl.startsWith('data:image/svg+xml')" style="max-width:100%;max-height:100%;object-fit:contain" alt="{{ logo.name }}" />
                    } @else {
                      <span style="font-size:2rem">🏢</span>
                    }
                    <div style="position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background .2s" class="logo-hover-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="24" height="24" style="opacity:0;transition:opacity .2s"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                  </div>
                  <input type="file" hidden accept=".png,.svg,.pdf,.eps,.ai,.jpg" (change)="onLogoFileReplace($event, i)" />
                </label>
                <input class="form-input" style="margin-bottom:.35rem;font-weight:600" [ngModel]="logo.name" (ngModelChange)="patchLogo(i, 'name', $event)" placeholder="Logo name" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.format" (ngModelChange)="patchLogo(i, 'format', $event)" placeholder="Format (e.g. Horizontal)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.dimensions" (ngModelChange)="patchLogo(i, 'dimensions', $event)" placeholder="Dimensions" />
                <div class="tag-row" style="margin-top:.5rem">
                  <span class="tag">{{ logo.format }}</span>
                  <span class="tag">{{ logo.fileType }}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:.75rem;align-items:center">
                  <button class="row-upload-btn" (click)="downloadLogo(logo)" style="color:var(--accent-blue)">⬇ Download</button>
                  <button style="background:none;border:none;color:var(--error);font-size:.75rem;cursor:pointer" (click)="deleteLogo(i)">Delete</button>
                </div>
              </div>
            }
            <label class="entity-card" style="border-style:dashed;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:160px;cursor:pointer;transition:border-color .2s">
              <div style="font-size:2rem;margin-bottom:.5rem">➕</div>
              <div style="font-size:.875rem;font-weight:600;color:var(--text-secondary)">Upload New Logo</div>
              <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem">PNG, SVG, PDF, EPS, AI</div>
              <input type="file" hidden accept=".png,.svg,.pdf,.eps,.ai,.jpg" (change)="onLogoUpload($event)" />
            </label>
          </div>
        </div>
      }

      <!-- ── SOPs ── -->
      @if (activeTab() === 'sops') {
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
            <h3 class="section-title" style="margin:0">Standard Operating Procedures</h3>
            <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
              <select [(ngModel)]="sopCategoryFilter" style="padding:.4rem .6rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
                <option value="">All Categories</option>
                <option value="Finance">Finance & Billing</option>
                <option value="Publishing">Publishing & Upload</option>
                <option value="Launch">Launch & Marketing</option>
                <option value="Contractor">Contractor Management</option>
                <option value="Direct Sales">Direct Sales</option>
                <option value="Legal">Legal & Compliance</option>
              </select>
              <input type="text" [(ngModel)]="sopFilter" placeholder="Search SOPs..." style="padding:.4rem .75rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-primary);font-size:.8125rem;font-family:inherit;width:200px">
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>Category</th><th>Description</th><th>Last Updated</th><th>Actions</th></tr></thead>
            <tbody>
              @for(s of filteredSops; track $index; let i = $index) {
                <tr>
                  <td class="td-primary">{{ s.name }}</td>
                  <td><span class="tag" style="font-size:.6875rem">{{ s.category || 'General' }}</span></td>
                  <td style="color:var(--text-muted);font-size:.8125rem">{{ s.description }}</td>
                  <td style="color:var(--text-muted);font-size:.8125rem">{{ s.updated }}</td>
                  <td style="white-space:nowrap">
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="viewSop(s)">View</button>
                    <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.8125rem;font-family:inherit;margin-left:.5rem" (click)="editSop(s, i)">Edit</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
            <h3 class="section-title" style="margin:0">AI-Generated Sample Templates</h3>
            <span style="font-size:.75rem;color:var(--text-muted)">Click "Use Template" to add an editable copy to your SOPs</span>
          </div>
          <table class="data-table">
            <thead><tr><th>Template Name</th><th>Category</th><th>Description</th><th>Action</th></tr></thead>
            <tbody>
              @for(t of sopSamples; track t.name) {
                <tr>
                  <td class="td-primary">{{ t.name }}</td>
                  <td><span class="tag" style="font-size:.6875rem">{{ t.category }}</span></td>
                  <td style="color:var(--text-muted);font-size:.8125rem">{{ t.description }}</td>
                  <td>
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="addSopFromSample(t)">Use Template</button>
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

<!-- ═══ CONTRACT EDITOR MODAL ═══ -->
@if (selectedContractTemplate) {
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Contract Template: {{ selectedContractTemplate.name }}</h3>
        <button class="modal-close" (click)="closeContractModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Recipient Email</label>
          <input type="email" class="form-input" [(ngModel)]="contractEmailTo" placeholder="Enter recipient email..." />
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input type="text" class="form-input" [(ngModel)]="contractEmailSubject" />
        </div>
        <div class="form-group">
          <label class="form-label">Contract Template Text</label>
          <textarea class="form-input" style="height:250px;font-family:monospace;font-size:.8rem" [(ngModel)]="contractEditText"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary btn-sm" (click)="closeContractModal()">Cancel</button>
        <button class="btn-primary btn-sm" (click)="saveEditedContract()">Save to Contracts</button>
        <a [href]="scEmailHrefWithPrefill(contractEmailTo, contractEmailSubject, contractEditText)" target="_blank" rel="noopener noreferrer" class="btn-primary btn-sm" style="text-decoration:none">
          📧 Send via SC Email
        </a>
      </div>
    </div>
  </div>
}

<!-- ═══ SOP VIEWER/EDITOR MODAL ═══ -->
@if (selectedSop) {
  <div class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">SOP: {{ selectedSop.name }}</h3>
        <button class="modal-close" (click)="closeSopModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">SOP Name</label>
          <input type="text" class="form-input" [(ngModel)]="sopEditName" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" [(ngModel)]="sopEditCategory">
            <option value="Finance">Finance & Billing</option>
            <option value="Publishing">Publishing & Upload</option>
            <option value="Launch">Launch & Marketing</option>
            <option value="Contractor">Contractor Management</option>
            <option value="Direct Sales">Direct Sales</option>
            <option value="Legal">Legal & Compliance</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input type="text" class="form-input" [(ngModel)]="sopEditDescription" />
        </div>
        <div class="form-group">
          <label class="form-label">Instructions / Content</label>
          <textarea class="form-input" style="height:220px;font-family:inherit" [(ngModel)]="sopEditContent" placeholder="Enter step-by-step instructions..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary btn-sm" (click)="closeSopModal()">Cancel</button>
        <button class="btn-primary btn-sm" (click)="saveSopContent()">Save SOP Changes</button>
      </div>
    </div>
  </div>
}
`
})
export class VaultCompanyPageComponent implements OnInit, OnDestroy {
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
    { key: 'cv', label: 'CV / Resume', hint: 'PDF or DOCX', icon: '📄' },
    { key: 'avatar', label: 'Avatar Photo', hint: 'JPG or PNG, 1:1', icon: '🖼' },
    { key: 'signature', label: 'Electronic Signature', hint: 'PNG transparent', icon: '✍️' },
    { key: 'job-desc', label: 'Job Description', hint: 'PDF or DOCX', icon: '📋' },
    { key: 'nda', label: 'Signed NDA', hint: 'PDF', icon: '🤝' },
    { key: 'business-card', label: 'Business Card', hint: 'PNG or PDF', icon: '📇' },
    { key: 'bio-short', label: 'Bio (Short)', hint: 'DOCX or TXT', icon: '📝' },
    { key: 'bio-long', label: 'Bio (Long)', hint: 'DOCX or TXT', icon: '📝' },
    { key: 'letterhead', label: 'Letterhead Template', hint: 'DOCX or PDF', icon: '🖨' },
  ];

  onOwnerDocUpload(event: Event, ownerIndex: number, slotKey: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const list = [...this.ownerProfiles];
    const docs = { ...(list[ownerIndex].docs || {}) };
    docs[slotKey] = file.name;
    list[ownerIndex] = { ...list[ownerIndex], docs };
    this.companyStore.updateOwners(list);
    (event.target as HTMLInputElement).value = '';
  }

  removeOwnerDoc(ownerIndex: number, slotKey: string): void {
    const list = [...this.ownerProfiles];
    const docs = { ...(list[ownerIndex].docs || {}) };
    delete docs[slotKey];
    list[ownerIndex] = { ...list[ownerIndex], docs };
    this.companyStore.updateOwners(list);
  }

  downloadFile(fileName: string | undefined): void {
    if (!fileName) return;
    alert(`Opening / Downloading file: ${fileName}\n\n(In production: retrieves download stream from secure cloud bucket)`);
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
  get financialDocs() { return this.companyStore.financialDocs(); }
  get filteredFinancialDocs() {
    if (!this.financialCategoryFilter) return this.financialDocs;
    return this.financialDocs.filter(d => d.category === this.financialCategoryFilter);
  }

  onFinancialUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const newDoc = {
      month: new Date().toLocaleString('default', { month: 'short' }),
      year: new Date().getFullYear().toString(),
      category: this.financialCategoryFilter || '📊 P&L Reports',
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

  addSopFromSample(sample: any): void {
    const newSop = { name: sample.name, category: sample.category, description: sample.description, updated: new Date().toISOString().split('T')[0], content: sample.content };
    this.companyStore.updateSops([...this.sopTemplates, newSop]);
    alert(`Template "${sample.name}" copied to your active SOPs directory.`);
  }

  viewSop(s: any): void {
    this.selectedSop = s;
    this.sopSelectedIndex = this.sopTemplates.findIndex(x => x.name === s.name);
    this.sopEditName = s.name;
    this.sopEditCategory = s.category || 'General';
    this.sopEditDescription = s.description || '';
    this.sopEditContent = s.content || '1. Read guidelines.\n2. Complete tasks.\n3. Log reports.';
  }

  editSop(s: any, index: number): void {
    this.viewSop(s);
  }

  closeSopModal(): void {
    this.selectedSop = null;
    this.sopSelectedIndex = -1;
  }

  saveSopContent(): void {
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
    alert('SOP has been saved successfully!');
  }

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
    let list = this.sopTemplates;
    if (this.sopCategoryFilter) list = list.filter((s: any) => s.category === this.sopCategoryFilter);
    if (this.sopFilter.trim()) {
      const q = this.sopFilter.toLowerCase();
      list = list.filter((s: any) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    return list;
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
    this.revealTimers = {};
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
