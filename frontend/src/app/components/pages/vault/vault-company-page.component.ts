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
  <app-page-action-bar
    [editing]="editMode()"
    deleteLabel="Delete all company file data"
    (editToggle)="onEditToggle()"
    (deleteAll)="deleteAllVaultData()" />

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
      <p class="page-subtitle">{{ company().identity.entityType }} · {{ company().identity.stateOfIncorporation }} · <span class="status" [ngClass]="companyStatusClass">{{ company().identity.companyStatus }}</span></p>
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

  <div class="vault-hero-panel">
    <div class="vault-hero-copy">
      <h2 class="vault-hero-title">Company at a glance</h2>
      <p class="section-hint">Your publishing structure, catalog size, and operating status in one view.</p>
      <div class="vault-metric-grid">
        <div class="vault-metric-card teal">
          <div class="vault-metric-icon" aria-hidden="true">
            <svg class="vault-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div class="vault-metric-body">
            <span class="vault-metric-value">{{ company().imprints.length }}</span>
            <span class="vault-metric-label">Imprints</span>
          </div>
        </div>
        <div class="vault-metric-card purple">
          <div class="vault-metric-icon" aria-hidden="true">
            <svg class="vault-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </div>
          <div class="vault-metric-body">
            <span class="vault-metric-value">{{ penNameCount }}</span>
            <span class="vault-metric-label">Pen Names</span>
          </div>
        </div>
        <div class="vault-metric-card indigo">
          <div class="vault-metric-icon" aria-hidden="true">
            <svg class="vault-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </div>
          <div class="vault-metric-body">
            <span class="vault-metric-value">{{ bookCount }}</span>
            <span class="vault-metric-label">Total Books</span>
          </div>
        </div>
        <div class="vault-metric-card status-metric" [class.is-active]="company().identity.companyStatus === 'Active'">
          <div class="vault-metric-icon" aria-hidden="true">
            <svg class="vault-metric-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="vault-metric-body">
            <app-status-select kind="company" [readOnly]="!editMode()" [value]="company().identity.companyStatus" (valueChange)="onCompanyStatus($event)" />
            <span class="vault-metric-label">Company Status</span>
          </div>
        </div>
      </div>
    </div>
    <div class="vault-hero-chart card">
      <h3 class="vault-chart-title">Catalog composition</h3>
      <div class="vault-chart-wrap">
        <svg viewBox="0 0 120 120" class="vault-donut" aria-hidden="true">
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--border-light)" stroke-width="14" />
          @if (catalogChartTotal > 0) {
            <circle cx="60" cy="60" r="46" fill="none" stroke="#14b8a6" stroke-width="14"
              [attr.stroke-dasharray]="catalogSegment(company().imprints.length)"
              stroke-dashoffset="0" transform="rotate(-90 60 60)" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#8b5cf6" stroke-width="14"
              [attr.stroke-dasharray]="catalogSegment(penNameCount)"
              [attr.stroke-dashoffset]="-catalogOffset(company().imprints.length)"
              transform="rotate(-90 60 60)" />
            <circle cx="60" cy="60" r="46" fill="none" stroke="#6366f1" stroke-width="14"
              [attr.stroke-dasharray]="catalogSegment(bookCount)"
              [attr.stroke-dashoffset]="-catalogOffset(company().imprints.length + penNameCount)"
              transform="rotate(-90 60 60)" />
          }
          <text x="60" y="56" text-anchor="middle" class="vault-donut-total">{{ catalogChartTotal }}</text>
          <text x="60" y="72" text-anchor="middle" class="vault-donut-sub">items</text>
        </svg>
        <div class="vault-chart-legend">
          <div class="vault-legend-row"><span class="vault-legend-dot teal"></span> Imprints <strong>{{ company().imprints.length }}</strong></div>
          <div class="vault-legend-row"><span class="vault-legend-dot purple"></span> Pen Names <strong>{{ penNameCount }}</strong></div>
          <div class="vault-legend-row"><span class="vault-legend-dot indigo"></span> Books <strong>{{ bookCount }}</strong></div>
        </div>
      </div>
      <div class="vault-bar-chart">
        <div class="vault-bar-row">
          <span class="vault-bar-label">Imprints</span>
          <div class="vault-bar-track"><div class="vault-bar-fill teal" [style.width.%]="catalogBarPct(company().imprints.length)"></div></div>
        </div>
        <div class="vault-bar-row">
          <span class="vault-bar-label">Pen Names</span>
          <div class="vault-bar-track"><div class="vault-bar-fill purple" [style.width.%]="catalogBarPct(penNameCount)"></div></div>
        </div>
        <div class="vault-bar-row">
          <span class="vault-bar-label">Books</span>
          <div class="vault-bar-track"><div class="vault-bar-fill indigo" [style.width.%]="catalogBarPct(bookCount)"></div></div>
        </div>
      </div>
    </div>
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
            <app-editable-field [readOnly]="!editMode()" label="Legal Name" [value]="company().identity.legalName" (valueChange)="vs.patchIdentity({ legalName: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="DBA Names" [value]="company().identity.dbaNames" (valueChange)="vs.patchIdentity({ dbaNames: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Entity Type" [value]="company().identity.entityType" (valueChange)="vs.patchIdentity({ entityType: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="State of Incorporation" [value]="company().identity.stateOfIncorporation" (valueChange)="vs.patchIdentity({ stateOfIncorporation: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Date of Formation" type="date" [value]="company().identity.dateOfFormation" (valueChange)="vs.patchIdentity({ dateOfFormation: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Fiscal Year End" type="select" [options]="fiscalYearEndOptions" [value]="company().identity.fiscalYearEnd" (valueChange)="vs.patchIdentity({ fiscalYearEnd: $event })"  />
            <div class="form-group">
              <span class="form-label">Status</span>
              <app-status-select kind="company" [readOnly]="!editMode()" [value]="company().identity.companyStatus" (valueChange)="onCompanyStatus($event)" />
            </div>
            <app-editable-field [readOnly]="!editMode()" label="Website" type="url" [value]="company().identity.website" (valueChange)="vs.patchIdentity({ website: $event })" />
          </div>
        </div>
        <div class="card vault-overview-visual">
          <h3 class="section-title">Publishing footprint</h3>
          <div class="vault-overview-grid">
            <div class="vault-overview-stat">
              <span class="vault-overview-num">{{ company().imprints.length }}</span>
              <span class="vault-overview-lbl">Imprints</span>
            </div>
            <div class="vault-overview-stat">
              <span class="vault-overview-num">{{ penNameCount }}</span>
              <span class="vault-overview-lbl">Pen Names</span>
            </div>
            <div class="vault-overview-stat">
              <span class="vault-overview-num">{{ bookCount }}</span>
              <span class="vault-overview-lbl">Books in catalog</span>
            </div>
            <div class="vault-overview-stat">
              <span class="vault-overview-num">{{ isbnUsed }}</span>
              <span class="vault-overview-lbl">ISBNs assigned</span>
            </div>
            <div class="vault-overview-stat">
              <span class="vault-overview-num">{{ activeContractCount }}</span>
              <span class="vault-overview-lbl">Active contracts</span>
            </div>
            <div class="vault-overview-stat vault-overview-status">
              <app-status-select kind="company" [readOnly]="!editMode()" [value]="company().identity.companyStatus" (valueChange)="onCompanyStatus($event)" />
              <span class="vault-overview-lbl">Company status</span>
            </div>
          </div>
        </div>
      }

      <!-- ── BUSINESS IDENTITY ── -->
      @if (activeTab() === 'identity') {
        <div class="card">
          <h3 class="section-title">Business Identity</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Legal Name" [value]="company().identity.legalName" (valueChange)="vs.patchIdentity({ legalName: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="DBA / Trade Names" [value]="company().identity.dbaNames" (valueChange)="vs.patchIdentity({ dbaNames: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Business Structure" [value]="company().identity.entityType" (valueChange)="vs.patchIdentity({ entityType: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="State of Registration" [value]="company().identity.stateOfIncorporation" (valueChange)="vs.patchIdentity({ stateOfIncorporation: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Country" [value]="company().identity.country ?? ''" placeholder="e.g. United States" (valueChange)="vs.patchIdentity({ country: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Date of Formation" type="date" [value]="company().identity.dateOfFormation" (valueChange)="vs.patchIdentity({ dateOfFormation: $event })"  />
            @if (editMode()) {
              <label class="address-same-row">
                <input type="checkbox" [ngModel]="sameMailingAddress()" (ngModelChange)="onSameMailingChange($event)" />
                Mailing address is the same as business address
              </label>
            }
            <app-editable-field [readOnly]="!editMode()" label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="onPrimaryAddressChange($event)" [full]="true" />
            @if (!sameMailingAddress()) {
              <app-editable-field [readOnly]="!editMode()" label="Mailing Address" [value]="company().identity.mailingAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event, sameMailingAsBusiness: false })" [full]="true" />
            } @else if (!editMode()) {
              <div class="form-group full">
                <span class="form-label">Mailing Address</span>
                <div class="form-value">Same as business address</div>
              </div>
            }
            <app-editable-field [readOnly]="!editMode()" label="Website" type="url" [value]="company().identity.website" (valueChange)="vs.patchIdentity({ website: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Main Business Email" [value]="company().identity.primaryEmail" (valueChange)="vs.patchIdentity({ primaryEmail: $event })" type="email" />
            <app-editable-field [readOnly]="!editMode()" label="Business Phone" [value]="company().identity.phone" (valueChange)="vs.patchIdentity({ phone: $event })" type="tel" placeholder="+1 555 123 4567" />
            <app-editable-field [readOnly]="!editMode()" label="Registered Agent" [value]="company().identity.registeredAgent" (valueChange)="vs.patchIdentity({ registeredAgent: $event })"  />
            <app-editable-field [readOnly]="!editMode()" label="Fiscal Year End" type="select" [options]="fiscalYearEndOptions" [value]="company().identity.fiscalYearEnd" (valueChange)="vs.patchIdentity({ fiscalYearEnd: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Company Status" type="select" [options]="companyStatusOptions" [value]="company().identity.companyStatus" (valueChange)="onCompanyStatus($event)" />
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
              @for(row of pageSliceIndexed('owners', ownerProfiles); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.name)" [ngModel]="row.item.name" (ngModelChange)="patchOwner(row.index, 'name', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.role)" [ngModel]="row.item.role" (ngModelChange)="patchOwner(row.index, 'role', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.ownershipPct)" [ngModel]="row.item.ownershipPct" (ngModelChange)="patchOwner(row.index, 'ownershipPct', $event)" /></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:.35rem">
                      <input class="form-input table-cell-field" style="flex:1" [disabled]="!editMode()" [title]="cellTitle(row.item.email)" [ngModel]="row.item.email" (ngModelChange)="patchOwner(row.index, 'email', $event)" />
                      @if (row.item.email) {
                        <a [href]="scEmailHref(row.item.email)" target="_blank" rel="noopener noreferrer" title="Open in SC Email" style="color:var(--accent-blue);flex-shrink:0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </a>
                      }
                    </div>
                  </td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.phone)" [ngModel]="row.item.phone" (ngModelChange)="patchOwner(row.index, 'phone', $event)" /></td>
                  <td>
                    <select class="form-input table-cell-field" [disabled]="!editMode()" [ngModel]="row.item.canSign" (ngModelChange)="patchOwner(row.index, 'canSign', $event)">
                      <option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
                    </select>
                  </td>
                  <td>
                    <select class="form-input table-cell-field" [disabled]="!editMode()" [ngModel]="row.item.canManageFinances" (ngModelChange)="patchOwner(row.index, 'canManageFinances', $event)">
                      <option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="ownerProfiles.length"
            [page]="tablePage('owners')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('owners', $event)"
            (addRow)="addOwnerRow()" />
        </div>
        <div class="card">
          <h3 class="section-title">Documents per Person</h3>
          <p class="section-subtitle">Upload CVs, letterhead, business cards, avatar photos, bios, electronic signatures, job descriptions, and signed NDAs for each person</p>
          @for(o of ownerProfiles; track o.name; let oi = $index) {
            <div class="record-card" style="margin-bottom:1rem">
              <div class="record-header"><h4 class="record-title">{{ o.name }} — {{ o.role }}</h4></div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.625rem;margin-top:.75rem">
                @for(slot of ownerDocSlots; track slot.key) {
                  <div class="doc-upload-slot" [class.has-file]="hasOwnerDoc(o, slot.key)" [class.is-uploading]="uploadingOwnerDoc() === oi + ':' + slot.key"
                    [title]="hasOwnerDoc(o, slot.key) ? 'Click to view ' + slot.label : 'Upload ' + slot.label">
                    <span class="doc-slot-icon">
                      @switch (slot.key) {
                        @case ('cv') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        }
                        @case ('avatar') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6"/></svg>
                        }
                        @case ('signature') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c3-2 5-6 8-6s5 4 8 6"/><path d="M12 3v4"/><path d="M8 7l8-2"/></svg>
                        }
                        @case ('job-desc') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/></svg>
                        }
                        @case ('nda') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c1.5-1.5 3.5-2 5-2s3.5.5 5 2"/><path d="M4 16c1.5 1.5 3.5 2 5 2s3.5-.5 5-2"/><path d="M8 10V8a2 2 0 0 1 2-2h1"/><path d="M16 10V8a2 2 0 0 0-2-2h-1"/></svg>
                        }
                        @case ('business-card') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="10" x2="14" y2="10"/><line x1="6" y1="14" x2="11" y2="14"/><circle cx="17" cy="12" r="2"/></svg>
                        }
                        @case ('bio-short') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>
                        }
                        @case ('bio-long') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="16" y2="15"/><line x1="8" y1="19" x2="14" y2="19"/></svg>
                        }
                        @case ('letterhead') {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        }
                      }
                    </span>
                    <div class="doc-slot-body" (click)="hasOwnerDoc(o, slot.key) ? downloadOwnerDoc(o, slot.key) : null">
                      <span class="doc-slot-name" [style.text-decoration]="hasOwnerDoc(o, slot.key) ? 'underline' : 'none'">{{ slot.label }}</span>
                      <span class="doc-slot-hint">{{ getOwnerDocHint(o, slot.key, slot.hint) }}</span>
                    </div>
                    @if (hasOwnerDoc(o, slot.key)) {
                      <span class="doc-slot-btn-delete" title="Delete document" (click)="$event.stopPropagation(); removeOwnerDoc(oi, slot.key)">✕</span>
                    } @else if (uploadingOwnerDoc() === oi + ':' + slot.key) {
                      <span class="doc-slot-btn" style="opacity:.6;cursor:wait;">Uploading…</span>
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
            <div class="ownership-file-slot">
              <span class="ownership-file-label">Operating Agreement File</span>
              @if (company().ownership.operatingAgreementFile) {
                <div class="doc-upload-slot has-file">
                  <span class="doc-slot-body" (click)="openOwnershipFile('operating')" style="cursor:pointer">
                    <span class="doc-slot-name">{{ company().ownership.operatingAgreementFile }}</span>
                    <span class="doc-slot-hint">Click to view</span>
                  </span>
                  @if (editMode()) {
                    <button type="button" class="doc-slot-btn-delete" (click)="removeOwnershipFile('operating')">✕</button>
                  }
                </div>
              } @else if (editMode()) {
                <label class="doc-upload-slot" [class.is-uploading]="uploadingOwnershipFile() === 'operating'">
                  <span class="doc-slot-body">
                    <span class="doc-slot-name">Upload operating agreement</span>
                    <span class="doc-slot-hint">PDF or DOCX</span>
                  </span>
                  <span class="doc-slot-btn">{{ uploadingOwnershipFile() === 'operating' ? 'Uploading…' : 'Attach' }}</span>
                  <input type="file" hidden accept=".pdf,.doc,.docx" (change)="onOwnershipFileUpload($event, 'operating')" />
                </label>
              } @else {
                <div class="form-value">—</div>
              }
            </div>
            <div class="ownership-file-slot">
              <span class="ownership-file-label">S-Corp Election File</span>
              @if (company().ownership.sCorpElectionFile) {
                <div class="doc-upload-slot has-file">
                  <span class="doc-slot-body" (click)="openOwnershipFile('scorp')" style="cursor:pointer">
                    <span class="doc-slot-name">{{ company().ownership.sCorpElectionFile }}</span>
                    <span class="doc-slot-hint">Click to view</span>
                  </span>
                  @if (editMode()) {
                    <button type="button" class="doc-slot-btn-delete" (click)="removeOwnershipFile('scorp')">✕</button>
                  }
                </div>
              } @else if (editMode()) {
                <label class="doc-upload-slot" [class.is-uploading]="uploadingOwnershipFile() === 'scorp'">
                  <span class="doc-slot-body">
                    <span class="doc-slot-name">Upload S-Corp election</span>
                    <span class="doc-slot-hint">PDF or DOCX</span>
                  </span>
                  <span class="doc-slot-btn">{{ uploadingOwnershipFile() === 'scorp' ? 'Uploading…' : 'Attach' }}</span>
                  <input type="file" hidden accept=".pdf,.doc,.docx" (change)="onOwnershipFileUpload($event, 'scorp')" />
                </label>
              } @else {
                <div class="form-value">—</div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── CORPORATE & LEGAL RECORDS ── -->
      @if (activeTab() === 'legal') {
        <div class="card">
          <h3 class="section-title">Tax & Registration</h3>
          <div class="form-grid">
            @if (editMode()) {
              <app-editable-field [readOnly]="false" label="EIN / Tax ID" [value]="company().identity.einTaxId" (valueChange)="vs.patchIdentity({ einTaxId: $event })" />
            } @else {
              <div class="form-group"><span class="form-label">EIN / Tax ID</span>
                <div style="display:flex;align-items:center;gap:.5rem;">
                  <div class="form-value" style="flex:1">{{ isRevealed('legal-ein') ? (company().identity.einTaxId || '—') : (company().identity.einTaxId ? '**-*******' : '—') }}</div>
                  @if (company().identity.einTaxId) {
                    <app-reveal-toggle [revealed]="isRevealed('legal-ein')" [timer]="getTimerValue('legal-ein')" label="Reveal" (toggle)="toggleReveal('legal-ein')" />
                  }
                </div>
              </div>
            }
            <app-editable-field [readOnly]="!editMode()" label="Registered Agent" [value]="company().identity.registeredAgent" (valueChange)="vs.patchIdentity({ registeredAgent: $event })"  />
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Formation & Corporate Documents</h3>
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>File / Reference</th><th>Status</th></tr></thead>
            <tbody>
              @for(row of pageSliceIndexed('corporateDocs', corporateDocs); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.document)" [ngModel]="row.item.document" (ngModelChange)="patchCorpDoc(row.index, 'document', $event)" /></td>
                  <td>
                    @if (row.item.fileRef) {
                      <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap">
                        <span class="file-link" (click)="openCorpDocFile(row.index)" [title]="row.item.fileRef">{{ row.item.fileRef }}</span>
                        @if (editMode()) {
                          <button type="button" class="row-upload-btn" style="padding:.2rem .4rem" (click)="removeCorpDocFile(row.index)">✕</button>
                        }
                      </div>
                    } @else if (editMode()) {
                      <label class="row-upload-btn" [title]="'Attach file for: ' + row.item.document">
                        Upload File
                        <input type="file" hidden accept=".pdf,.doc,.docx,.png,.jpg" (change)="onCorpDocFileUpload($event, row.index)" />
                      </label>
                    } @else {
                      <span class="table-cell-text">—</span>
                    }
                  </td>
                  <td><app-status-select kind="corporateDoc" [readOnly]="!editMode()" [value]="row.item.status" (valueChange)="patchCorpDoc(row.index, 'status', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="corporateDocs.length"
            [page]="tablePage('corporateDocs')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('corporateDocs', $event)"
            (addRow)="addCorpDocRow()" />
        </div>
        <div class="card">
          <h3 class="section-title">Trademarks, Copyrights & Insurance</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Trademark Registrations" [value]="company().contractsLegal.trademarkRegistrations" (valueChange)="vs.patchContractsLegal({ trademarkRegistrations: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Copyright Assignments" [value]="company().contractsLegal.copyrightAssignments" (valueChange)="vs.patchContractsLegal({ copyrightAssignments: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Insurance Policies" [value]="company().contractsLegal.insurancePolicies" (valueChange)="vs.patchContractsLegal({ insurancePolicies: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Attorney Name" [value]="company().contractsLegal.attorneyName" (valueChange)="vs.patchContractsLegal({ attorneyName: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Attorney Phone" type="tel" [value]="company().contractsLegal.attorneyContact" (valueChange)="vs.patchContractsLegal({ attorneyContact: $event })" placeholder="+1 555 123 4567" />
            <app-editable-field [readOnly]="!editMode()" label="Attorney Email" type="email" [value]="company().contractsLegal.attorneyEmail || ''" (valueChange)="vs.patchContractsLegal({ attorneyEmail: $event })" />
          </div>
          <div class="copyright-office-panel">
            <span class="copyright-office-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 21h18"/><path d="M6 21V9l6-3.5L18 9v12"/><path d="M9 13h6"/><path d="M9 17h6"/>
                <circle cx="12" cy="7" r="2.5"/><path d="M10.5 7h3"/>
              </svg>
              Copyright Office:
            </span>
            <select
              class="form-input copyright-office-select"
              [ngModel]="copyrightOffice().country"
              (ngModelChange)="patchCopyrightCountry($event)"
              [disabled]="!editMode()">
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IN">India</option>
              <option value="OTHER">Other</option>
            </select>
            @if (copyrightOffice().country === 'OTHER') {
              <input
                type="url"
                class="form-input copyright-office-custom"
                placeholder="https://your-copyright-office.gov"
                [disabled]="!editMode()"
                [ngModel]="copyrightOffice().customUrl || ''"
                (ngModelChange)="patchCopyrightCustomUrl($event)" />
            } @else if (copyrightOfficeUrl) {
              <a [href]="copyrightOfficeUrl" target="_blank" rel="noopener noreferrer" class="copyright-office-link">{{ copyrightOfficeUrl }}</a>
            }
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
              @for(row of pageSliceIndexed('banks', bankAccounts); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.bank)" [ngModel]="row.item.bank" (ngModelChange)="patchBank(row.index, 'bank', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.nickname)" [ngModel]="row.item.nickname" (ngModelChange)="patchBank(row.index, 'nickname', $event)" /></td>
                  <td>
                    <span style="font-family:monospace" [title]="cellTitle(row.item.account)">{{ isRevealed('bank-account-' + row.index) ? row.item.account : '****' + row.item.account.slice(-4) }}</span>
                    <app-reveal-toggle [revealed]="isRevealed('bank-account-' + row.index)" [timer]="getTimerValue('bank-account-' + row.index)" (toggle)="toggleReveal('bank-account-' + row.index)" />
                  </td>
                  <td>
                    <span style="font-family:monospace" [title]="cellTitle(row.item.routing)">{{ isRevealed('bank-routing-' + row.index) ? row.item.routing : '****' + row.item.routing.slice(-4) }}</span>
                    <app-reveal-toggle [revealed]="isRevealed('bank-routing-' + row.index)" [timer]="getTimerValue('bank-routing-' + row.index)" (toggle)="toggleReveal('bank-routing-' + row.index)" />
                  </td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.wire)" [ngModel]="row.item.wire" (ngModelChange)="patchBank(row.index, 'wire', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.swift)" [ngModel]="row.item.swift" (ngModelChange)="patchBank(row.index, 'swift', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="bankAccounts.length"
            [page]="tablePage('banks')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('banks', $event)"
            (addRow)="addBankRow()" />
        </div>
        <div class="card">
          <h3 class="section-title">Payment Processors & Payout Destinations</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Payment Processors" [value]="company().financial.paymentProcessors" (valueChange)="vs.patchFinancial({ paymentProcessors: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Accounting Software" [value]="company().financial.accountingSoftware" (valueChange)="vs.patchFinancial({ accountingSoftware: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="CPA Name" [value]="company().financial.cpaName" (valueChange)="vs.patchFinancial({ cpaName: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="CPA Contact" [value]="company().financial.cpaContact" (valueChange)="vs.patchFinancial({ cpaContact: $event })" type="email" />
            <app-editable-field [readOnly]="!editMode()" label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="State Tax Registrations" [value]="company().financial.stateTaxRegistrations" (valueChange)="vs.patchFinancial({ stateTaxRegistrations: $event })" />
          </div>
        </div>
        <div class="card">
          <h3 class="section-title">Platform Login Credentials</h3>
          <p class="section-subtitle">Stripe, PayPal, Wise — usernames and passwords are masked by default (60s timer)</p>
          <table class="data-table">
            <thead><tr><th>Platform</th><th>Username / Email</th><th>Password</th><th>Recovery</th><th>Notes</th></tr></thead>
            <tbody>
              @for(row of pageSliceIndexed('paymentPlatforms', paymentPlatforms); track row.index) {
                <tr>
                  <td class="td-primary" [title]="cellTitle(row.item.name)">{{ row.item.name }}</td>
                  <td>
                    <span [title]="cellTitle(row.item.username)">{{ isRevealed('payment-user-' + row.item.name) ? row.item.username : maskValue(row.item.username) }}</span>
                    <app-reveal-toggle [revealed]="isRevealed('payment-user-' + row.item.name)" [timer]="getTimerValue('payment-user-' + row.item.name)" (toggle)="toggleReveal('payment-user-' + row.item.name)" />
                  </td>
                  <td>
                    <span style="font-family:monospace" [title]="cellTitle(row.item.password)">{{ isRevealed('payment-pass-' + row.item.name) ? row.item.password : '••••••••' }}</span>
                    <app-reveal-toggle [revealed]="isRevealed('payment-pass-' + row.item.name)" [timer]="getTimerValue('payment-pass-' + row.item.name)" (toggle)="toggleReveal('payment-pass-' + row.item.name)" />
                  </td>
                  <td><span class="table-cell-text" [title]="cellTitle(row.item.phone)">{{ row.item.phone || '—' }}</span></td>
                  <td><span class="table-cell-text" [title]="cellTitle(row.item.notes)">{{ row.item.notes || '—' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="paymentPlatforms.length"
            [page]="tablePage('paymentPlatforms')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            [allowAdd]="false"
            (pageChange)="setTablePage('paymentPlatforms', $event)" />
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
              @for(row of pageSliceIndexed('taxDocs', taxDocs); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.name)" [ngModel]="row.item.name" (ngModelChange)="patchTaxDoc(row.index, 'name', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.type)" [ngModel]="row.item.type" (ngModelChange)="patchTaxDoc(row.index, 'type', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.year)" [ngModel]="row.item.year" (ngModelChange)="patchTaxDoc(row.index, 'year', $event)" /></td>
                  <td><app-status-select kind="taxDoc" [readOnly]="!editMode()" [value]="row.item.status" (valueChange)="patchTaxDoc(row.index, 'status', $event)" /></td>
                  <td>
                    @if (row.item.fileName) {
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <span style="color:var(--success);cursor:pointer;font-weight:600;text-decoration:underline" [title]="row.item.fileName" (click)="downloadFile(row.item.fileName)">📄 {{ row.item.fileName }}</span>
                        @if (editMode()) {
                          <button class="row-upload-btn" style="padding:.2rem .4rem;border-color:var(--text-muted);color:var(--text-secondary)" (click)="removeTaxDocFile(row.index)" title="Remove file">✕</button>
                        }
                      </div>
                    } @else if (editMode()) {
                      <label class="row-upload-btn" [title]="'Upload file for: ' + row.item.name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Upload File
                        <input type="file" hidden accept=".pdf,.docx,.xlsx,.png,.jpg" (change)="onTaxDocRowUpload($event, row.index)" />
                      </label>
                    } @else {
                      <span class="table-cell-text">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="taxDocs.length"
            [page]="tablePage('taxDocs')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('taxDocs', $event)"
            (addRow)="addTaxDocRow()" />
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
                <app-status-select kind="platform" [readOnly]="!editMode()" [value]="platformStatus(p)" (valueChange)="patchPlatform('publishing', i, 'status', $event)" />
              </div>
              <div class="record-grid" style="grid-template-columns:1fr 1fr 1fr;gap:.5rem .85rem;">
                <app-editable-field [readOnly]="!editMode()" label="Account Owner" [value]="p.owner" (valueChange)="patchPlatform('publishing', i, 'owner', $event)" />
                <app-editable-field [readOnly]="!editMode()" label="Account Email" type="email" [value]="p.email" (valueChange)="patchPlatform('publishing', i, 'email', $event)" />
                <app-editable-field [readOnly]="!editMode()" label="Recovery Phone" type="tel" [value]="p.phone" (valueChange)="patchPlatform('publishing', i, 'phone', $event)" />
                <app-editable-field [readOnly]="!editMode()" label="Payout Method" [value]="p.payout" (valueChange)="patchPlatform('publishing', i, 'payout', $event)" />
                <app-editable-field [readOnly]="!editMode()" label="Tax Profile Name" [value]="p.taxProfile" (valueChange)="patchPlatform('publishing', i, 'taxProfile', $event)" />
                <app-editable-field [readOnly]="!editMode()" label="Account ID" [value]="p.accountId" (valueChange)="patchPlatform('publishing', i, 'accountId', $event)" />
                <div class="record-field">
                  <span class="label">Username</span>
                  <span class="value" style="display:flex;align-items:center;gap:.35rem;">
                    {{ isRevealed('platform-user-' + p.name) ? p.username : maskValue(p.username) }}
                    <app-reveal-toggle [revealed]="isRevealed('platform-user-' + p.name)" [timer]="getTimerValue('platform-user-' + p.name)" (toggle)="toggleReveal('platform-user-' + p.name)" />
                  </span>
                </div>
                <div class="record-field">
                  <span class="label">Password</span>
                  <span class="value" style="display:flex;align-items:center;gap:.35rem;font-family:monospace;">
                    {{ isRevealed('platform-pass-' + p.name) ? p.password : '••••••••' }}
                    <app-reveal-toggle [revealed]="isRevealed('platform-pass-' + p.name)" [timer]="getTimerValue('platform-pass-' + p.name)" (toggle)="toggleReveal('platform-pass-' + p.name)" />
                  </span>
                </div>
              </div>
              <div style="margin-top:.5rem;padding:.5rem .75rem;background:var(--primary-light);border-radius:6px;">
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap;font-size:.8125rem;">
                  <div><span style="color:var(--text-muted);">Account Rep:</span> <strong style="color:var(--text-primary);">{{ p.accountRep || 'Customer Service' }}</strong></div>
                  <div><span style="color:var(--text-muted);">Rep Email:</span> @if(p.repEmail) { <a [href]="'mailto:'+p.repEmail" style="color:var(--accent-blue);">{{ p.repEmail }}</a> } @else { <span style="color:var(--text-secondary)">—</span> }</div>
                </div>
              </div>
              <app-editable-field [readOnly]="!editMode()" label="Notes" [value]="p.notes" (valueChange)="patchPlatform('publishing', i, 'notes', $event)" [full]="true" />
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
              @for(row of pageSliceFilteredIndexed('isbns', filteredIsbns, isbnRecords); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" style="font-family:monospace" [disabled]="!editMode()" [title]="cellTitle(row.item.isbn)" [ngModel]="row.item.isbn" (ngModelChange)="patchIsbn(row.index, 'isbn', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.format)" [ngModel]="row.item.format" (ngModelChange)="patchIsbn(row.index, 'format', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.title)" [ngModel]="row.item.title" (ngModelChange)="patchIsbn(row.index, 'title', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.imprint)" [ngModel]="row.item.imprint" (ngModelChange)="patchIsbn(row.index, 'imprint', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.series)" [ngModel]="row.item.series" (ngModelChange)="patchIsbn(row.index, 'series', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.pubDate)" [ngModel]="row.item.pubDate" (ngModelChange)="patchIsbn(row.index, 'pubDate', $event)" /></td>
                  <td>
                    <app-status-select kind="isbn" [readOnly]="!editMode()" [value]="row.item.status" (valueChange)="onIsbnStatusChange(row.item, $event)" />
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredIsbns.length"
            [page]="tablePage('isbns')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('isbns', $event)"
            (addRow)="addIsbnRow()" />
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
              @for(row of pageSliceIndexed('contracts', contractRecords); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.name)" [ngModel]="row.item.name" (ngModelChange)="patchContract(row.index, 'name', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.counterparty)" [ngModel]="row.item.counterparty" (ngModelChange)="patchContract(row.index, 'counterparty', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.type)" [ngModel]="row.item.type" (ngModelChange)="patchContract(row.index, 'type', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.date)" [ngModel]="row.item.date" (ngModelChange)="patchContract(row.index, 'date', $event)" /></td>
                  <td><app-status-select kind="contract" [readOnly]="!editMode()" [value]="row.item.status" (valueChange)="onContractStatusChange(row.index, $event)" /></td>
                  <td>
                    @if (row.item.file) {
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <span class="file-link" (click)="downloadFile(row.item.file)" [title]="row.item.file">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          {{ row.item.file }}
                        </span>
                        @if (editMode()) {
                          <button class="row-upload-btn" style="padding:.2rem .4rem;border-color:var(--text-muted);color:var(--text-secondary)" (click)="removeContractFile(row.index)" title="Remove file">✕</button>
                        }
                      </div>
                    } @else if (editMode()) {
                      <label class="row-upload-btn" [title]="'Attach file to: ' + row.item.name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        Upload Contract
                        <input type="file" hidden accept=".pdf,.docx" (change)="onContractRowUpload($event, row.index)" />
                      </label>
                    } @else {
                      <span class="table-cell-text">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="contractRecords.length"
            [page]="tablePage('contracts')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('contracts', $event)"
            (addRow)="addContractRow()" />
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
              @for(t of pageSlice('contractTemplates', filteredContractTemplates); track t.name) {
                <tr>
                  <td class="td-primary" [title]="cellTitle(t.name)">{{ t.name }}</td>
                  <td><span class="tag" [title]="cellTitle(t.category)">{{ t.category }}</span></td>
                  <td class="td-muted table-cell-text" [title]="cellTitle(t.updated)">{{ t.updated }}</td>
                  <td style="display:flex;gap:.5rem;align-items:center">
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="viewContractTemplate(t)">View & Edit</button>
                    <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="useContractTemplate(t)">Quick Use</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredContractTemplates.length"
            [page]="tablePage('contractTemplates')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            [allowAdd]="false"
            (pageChange)="setTablePage('contractTemplates', $event)" />
        </div>
      }

      <!-- ── FINANCIAL RECORDS ── -->
      @if (activeTab() === 'financial') {
        <div class="card">
          <h3 class="section-title">Monthly Income Reports</h3>
          <table class="data-table">
            <thead><tr><th>Month</th><th>Revenue</th><th>Expenses</th><th>Net</th></tr></thead>
            <tbody>
              @for(row of pageSliceIndexed('financial', financialRecords); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.month)" [ngModel]="row.item.month" (ngModelChange)="patchFinancial(row.index, 'month', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.revenue)" [ngModel]="row.item.revenue" (ngModelChange)="patchFinancial(row.index, 'revenue', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.expenses)" [ngModel]="row.item.expenses" (ngModelChange)="patchFinancial(row.index, 'expenses', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.net)" [ngModel]="row.item.net" (ngModelChange)="patchFinancial(row.index, 'net', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="financialRecords.length"
            [page]="tablePage('financial')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('financial', $event)"
            (addRow)="addFinancialRow()" />
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
            <h3 class="section-title" style="margin:0">Financial Reports & Files</h3>
            <div style="display:flex;gap:.5rem;align-items:center">
              <select [(ngModel)]="financialCategoryFilter" style="padding:.4rem .6rem;border:1px solid var(--border-color);border-radius:8px;background:var(--background);color:var(--text-secondary);font-size:.8125rem;font-family:inherit">
                <option value="">All Categories</option>
                @for (cat of financialCategories; track cat.id) {
                  <option [value]="cat.id">{{ cat.label }}</option>
                }
              </select>
              <label class="btn-primary btn-sm" [class.disabled-upload]="!editMode()" style="cursor:pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Report
                <input type="file" hidden accept=".pdf,.xlsx,.csv,.png" [disabled]="!editMode()" (change)="onFinancialUpload($event)" />
              </label>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>File Name</th><th>Category</th><th>Period</th><th>Size</th><th>Date Uploaded</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              @for(row of pageSliceFilteredIndexed('financialDocs', filteredFinancialDocs, financialDocs); track row.index) {
                <tr>
                  <td class="td-primary file-name-cell" [class.clickable]="editMode()" [title]="cellTitle(row.item.fileName)" (click)="editMode() && downloadFile(row.item.fileName)">
                    <svg class="inline-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                    {{ row.item.fileName }}
                  </td>
                  <td>
                    <span class="tag financial-cat-tag" [title]="cellTitle(row.item.category)">
                      @switch (normalizeFinancialCategory(row.item.category)) {
                        @case ('P&L Reports') {
                          <svg class="inline-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        }
                        @case ('Receipts') {
                          <svg class="inline-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        }
                        @case ('Invoices') {
                          <svg class="inline-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
                        }
                        @default {
                          <svg class="inline-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        }
                      }
                      {{ normalizeFinancialCategory(row.item.category) }}
                    </span>
                  </td>
                  <td [title]="cellTitle(row.item.month + ' ' + row.item.year)">{{ row.item.month }} {{ row.item.year }}</td>
                  <td style="color:var(--text-muted)" [title]="cellTitle(row.item.fileSize)">{{ row.item.fileSize || 'N/A' }}</td>
                  <td style="color:var(--text-muted)" [title]="cellTitle(row.item.uploadedDate)">{{ row.item.uploadedDate || 'N/A' }}</td>
                  <td><app-status-select kind="financialDoc" [readOnly]="!editMode()" [value]="row.item.status" (valueChange)="patchFinancialDocStatus(row.item.fileName, $event)" /></td>
                  <td>
                    @if (editMode()) {
                      <button style="background:none;border:none;color:var(--error);cursor:pointer;font-size:.8125rem" (click)="deleteFinancialDoc(row.item)">Delete</button>
                    } @else {
                      <span style="color:var(--text-muted);font-size:.75rem">—</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredFinancialDocs.length"
            [page]="tablePage('financialDocs')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('financialDocs', $event)"
            (addRow)="addFinancialDocRow()" />
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
              @for(row of pageSliceFilteredIndexed('team', filteredTeamMembers, teamMembers); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.name)" [ngModel]="row.item.name" (ngModelChange)="patchTeam(row.index, 'name', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.role)" [ngModel]="row.item.role" (ngModelChange)="patchTeam(row.index, 'role', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.company)" [ngModel]="row.item.company" (ngModelChange)="patchTeam(row.index, 'company', $event)" /></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:.35rem">
                      <input class="form-input table-cell-field" style="flex:1" [disabled]="!editMode()" [title]="cellTitle(row.item.email)" [ngModel]="row.item.email" (ngModelChange)="patchTeam(row.index, 'email', $event)" />
                      @if (row.item.email) {
                        <a [href]="scEmailHref(row.item.email)" target="_blank" rel="noopener noreferrer" title="Open in SC Email" style="color:var(--accent-blue);flex-shrink:0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        </a>
                      }
                    </div>
                  </td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.phone)" [ngModel]="row.item.phone" (ngModelChange)="patchTeam(row.index, 'phone', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.contractDate)" [ngModel]="row.item.contractDate" (ngModelChange)="patchTeam(row.index, 'contractDate', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.rate)" [ngModel]="row.item.rate" (ngModelChange)="patchTeam(row.index, 'rate', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredTeamMembers.length"
            [page]="tablePage('team')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('team', $event)"
            (addRow)="addTeamRow()" />
        </div>
      }

      <!-- ── WEBSITE & DOMAINS ── -->
      @if (activeTab() === 'domains') {
        <div class="card">
          <h3 class="section-title">Domain & Hosting Records</h3>
          <table class="data-table">
            <thead><tr><th>Domain</th><th>Registrar</th><th>Renewal Date</th><th>Host</th><th>SSL Renewal</th><th>CMS</th><th>Contact</th></tr></thead>
            <tbody>
              @for(row of pageSliceIndexed('domains', domainRecords); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.domain)" [ngModel]="row.item.domain" (ngModelChange)="patchDomain(row.index, 'domain', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.registrar)" [ngModel]="row.item.registrar" (ngModelChange)="patchDomain(row.index, 'registrar', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.renewal)" [ngModel]="row.item.renewal" (ngModelChange)="patchDomain(row.index, 'renewal', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.host)" [ngModel]="row.item.host" (ngModelChange)="patchDomain(row.index, 'host', $event)" /></td>
                  <td><app-status-select kind="ssl" [readOnly]="!editMode()" [value]="row.item.ssl || 'not configured'" (valueChange)="patchDomain(row.index, 'ssl', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.cms)" [ngModel]="row.item.cms" (ngModelChange)="patchDomain(row.index, 'cms', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.contact)" [ngModel]="row.item.contact" (ngModelChange)="patchDomain(row.index, 'contact', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="domainRecords.length"
            [page]="tablePage('domains')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('domains', $event)"
            (addRow)="addDomainRow()" />
        </div>
        <div class="card">
          <h3 class="section-title">DNS & Technical Notes</h3>
          @for(d of domainRecords; track $index; let i = $index) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ d.domain }}</h4></div>
              <app-editable-field [readOnly]="!editMode()" label="DNS Notes" [value]="d.dns" (valueChange)="patchDomain(i, 'dns', $event)" [full]="true" />
            </div>
          }
        </div>
      }

      <!-- ── COMMUNICATIONS ── -->
      @if (activeTab() === 'comms') {
        <div class="card">
          <h3 class="section-title">Email & Communications Setup</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field [readOnly]="!editMode()" label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />

            <!-- SPF — masked with timer -->
            <div class="form-group">
              <span class="form-label">SPF Record</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-spf') ? communications.spfRecord : maskSensitive(communications.spfRecord) }}
                </div>
                <app-reveal-toggle [revealed]="isRevealed('comms-spf')" [timer]="getTimerValue('comms-spf')" label="Reveal" (toggle)="toggleReveal('comms-spf')" />
              </div>
            </div>

            <!-- DKIM — masked with timer -->
            <div class="form-group">
              <span class="form-label">DKIM Key</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-dkim') ? communications.dkimStatus : maskSensitive(communications.dkimStatus) }}
                </div>
                <app-reveal-toggle [revealed]="isRevealed('comms-dkim')" [timer]="getTimerValue('comms-dkim')" label="Reveal" (toggle)="toggleReveal('comms-dkim')" />
              </div>
            </div>

            <!-- API Key — masked with timer -->
            <div class="form-group">
              <span class="form-label">Newsletter API Key</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-api-key') ? communications.apiKey : maskSensitive(communications.apiKey) }}
                </div>
                <app-reveal-toggle [revealed]="isRevealed('comms-api-key')" [timer]="getTimerValue('comms-api-key')" label="Reveal" (toggle)="toggleReveal('comms-api-key')" />
              </div>
            </div>

            <!-- SMTP Password — masked with timer -->
            <div class="form-group">
              <span class="form-label">SMTP Password</span>
              <div style="display:flex;align-items:center;gap:.5rem">
                <div class="form-value" style="flex:1;font-family:monospace;font-size:.8125rem">
                  {{ isRevealed('comms-smtp-pass') ? communications.smtpPassword : '••••••••••••••••' }}
                </div>
                <app-reveal-toggle [revealed]="isRevealed('comms-smtp-pass')" [timer]="getTimerValue('comms-smtp-pass')" label="Reveal" (toggle)="toggleReveal('comms-smtp-pass')" />
              </div>
            </div>

            <app-editable-field [readOnly]="!editMode()" label="DMARC Policy" type="select" [options]="dmarcStatusOptions" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field [readOnly]="!editMode()" label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />

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
            <app-editable-field [readOnly]="!editMode()" label="Business Phone" [value]="company().identity.phone" (valueChange)="vs.patchIdentity({ phone: $event })" type="tel" placeholder="+1 555 123 4567" />
            <app-editable-field [readOnly]="!editMode()" label="PO Box" [value]="communications.poBox" (valueChange)="patchComms('poBox', $event)" />
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
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Welcome Sequence
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Reader Magnet Funnel
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
              Launch Sequence
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Re-engagement Series
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Website Opt-in Form
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              BookFunnel Delivery
            </span>
            <span class="tag tag-with-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Facebook Lead Ads
            </span>
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
              @for(row of pageSliceIndexed('inventory', inventoryItems); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" style="font-family:monospace" [disabled]="!editMode()" [title]="cellTitle(row.item.sku)" [ngModel]="row.item.sku" (ngModelChange)="patchInventory(row.index, 'sku', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.title)" [ngModel]="row.item.title" (ngModelChange)="patchInventory(row.index, 'title', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.format)" [ngModel]="row.item.format" (ngModelChange)="patchInventory(row.index, 'format', $event)" /></td>
                  <td><input class="form-input table-cell-field" type="number" [disabled]="!editMode()" [title]="cellTitle(row.item.stock)" [ngModel]="row.item.stock" (ngModelChange)="patchInventory(row.index, 'stock', +$event)" /></td>
                  <td><input class="form-input table-cell-field" type="number" [disabled]="!editMode()" [title]="cellTitle(row.item.reorderPoint)" [ngModel]="row.item.reorderPoint" (ngModelChange)="patchInventory(row.index, 'reorderPoint', +$event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.printer)" [ngModel]="row.item.printer" (ngModelChange)="patchInventory(row.index, 'printer', $event)" /></td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="inventoryItems.length"
            [page]="tablePage('inventory')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('inventory', $event)"
            (addRow)="addInventoryRow()" />
        </div>
        <div class="card">
          <h3 class="section-title">Fulfillment Details</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field [readOnly]="!editMode()" label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field [readOnly]="!editMode()" label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field [readOnly]="!editMode()" label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field [readOnly]="!editMode()" label="Delivery Policy" type="textarea" [rows]="3" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />
          </div>
        </div>
      }

      <!-- ── SECURITY & RECOVERY ── -->
      @if (activeTab() === 'security') {
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
            <div>
              <h3 class="section-title" style="margin:0 0 .35rem">Access & Security Registry</h3>
              <p class="section-hint">Click <strong>Edit</strong> at the top of the page to add rows, update credentials, or write notes. Notes appear in the last column — hover or expand the field to read longer text.</p>
            </div>
            @if (editMode()) {
              <button type="button" class="btn-primary btn-sm" (click)="addSecurityEntry()">+ Add entry</button>
            }
          </div>
          <table class="data-table security-registry-table">
            <thead><tr><th>Resource</th><th>Owner</th><th>Access Level</th><th>2FA Device</th><th>Recovery Email</th><th style="min-width:220px">Notes</th>@if (editMode()) {<th></th>}</tr></thead>
            <tbody>
              @for(row of pageSliceIndexed('security', securityEntries); track row.index) {
                <tr>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.resource)" [ngModel]="row.item.resource" (ngModelChange)="patchSecurity(row.index, 'resource', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.owner)" [ngModel]="row.item.owner" (ngModelChange)="patchSecurity(row.index, 'owner', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.accessLevel)" [ngModel]="row.item.accessLevel" (ngModelChange)="patchSecurity(row.index, 'accessLevel', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.twoFa)" [ngModel]="row.item.twoFa" (ngModelChange)="patchSecurity(row.index, 'twoFa', $event)" /></td>
                  <td><input class="form-input table-cell-field" [disabled]="!editMode()" [title]="cellTitle(row.item.recoveryEmail)" [ngModel]="row.item.recoveryEmail" (ngModelChange)="patchSecurity(row.index, 'recoveryEmail', $event)" /></td>
                  <td>
                    @if (editMode()) {
                      <textarea class="form-input security-notes-input table-cell-field" rows="4" [title]="cellTitle(row.item.notes)" [ngModel]="row.item.notes" (ngModelChange)="patchSecurity(row.index, 'notes', $event)" placeholder="Login details, backup codes, access notes…"></textarea>
                    } @else {
                      <div class="security-notes-read table-cell-text" [title]="cellTitle(row.item.notes)">{{ row.item.notes || '—' }}</div>
                    }
                  </td>
                  @if (editMode()) {
                    <td><button type="button" class="row-remove-btn" (click)="removeSecurityEntry(row.index)">Remove</button></td>
                  }
                </tr>
              } @empty {
                <tr><td [attr.colspan]="editMode() ? 7 : 6" class="empty-table-hint">No security entries yet. Click <strong>Edit</strong>, then <strong>+ Add entry</strong>.</td></tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="securityEntries.length"
            [page]="tablePage('security')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            (pageChange)="setTablePage('security', $event)"
            (addRow)="addSecurityEntry()" />
        </div>
        <div class="card">
          <h3 class="section-title">Emergency Access & Offboarding</h3>
          <div class="form-grid">
            <app-editable-field [readOnly]="!editMode()" label="Emergency Access Instructions" type="textarea" [rows]="8" [value]="securityNotes.emergencyAccess" (valueChange)="patchSecurityNotes('emergencyAccess', $event)" [full]="true" />
            <app-editable-field [readOnly]="!editMode()" label="Contractor Offboarding Steps" type="textarea" [rows]="8" [value]="securityNotes.offboardingSteps" (valueChange)="patchSecurityNotes('offboardingSteps', $event)" [full]="true" />
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
        @if (sopFeedback()) {
          <div class="inline-feedback">{{ sopFeedback() }}</div>
        }
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.75rem">
            <div>
              <h3 class="section-title" style="margin:0 0 .25rem">Your Standard Operating Procedures</h3>
              <p class="section-hint">These are your saved SOPs. Click <strong>Edit</strong> at the top to add, view, or change procedures.</p>
            </div>
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
              @if (editMode()) {
                <button type="button" class="btn-primary btn-sm" (click)="createBlankSop()">+ New SOP</button>
              }
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>Document Name</th><th>Category</th><th>Description</th><th>Last Updated</th><th>Actions</th></tr></thead>
            <tbody>
              @for(row of pageSliceFilteredIndexed('sops', filteredSops, sopTemplates); track row.index) {
                <tr>
                  <td class="td-primary table-cell-text" [title]="cellTitle(row.item.name)">{{ row.item.name }}</td>
                  <td><span class="tag" style="font-size:.6875rem" [title]="cellTitle(row.item.category)">{{ row.item.category || 'General' }}</span></td>
                  <td class="table-cell-text" style="color:var(--text-muted);font-size:.8125rem" [title]="cellTitle(row.item.description)">{{ row.item.description }}</td>
                  <td style="color:var(--text-muted);font-size:.8125rem" [title]="cellTitle(row.item.updated)">{{ row.item.updated }}</td>
                  <td style="white-space:nowrap">
                    <button style="background:none;border:none;color:var(--accent-blue);cursor:pointer;font-size:.8125rem;font-family:inherit" (click)="viewSop(row.item)">View</button>
                    @if (editMode()) {
                      <button style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.8125rem;font-family:inherit;margin-left:.5rem" (click)="editSop(row.item, row.index)">Edit</button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-table-hint">No SOPs saved yet. Use a starter template below or click <strong>Edit</strong> then <strong>+ New SOP</strong>.</td></tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredSops.length"
            [page]="tablePage('sops')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            [allowAdd]="false"
            (pageChange)="setTablePage('sops', $event)" />
        </div>
        <div class="card">
          <div style="margin-bottom:.75rem">
            <h3 class="section-title" style="margin:0 0 .35rem">Starter Templates</h3>
            <p class="section-hint">Pre-written procedure templates you can copy into <strong>Your Standard Operating Procedures</strong> above. Click <strong>Edit</strong> at the top, then <strong>Add to my SOPs</strong> — the template opens immediately so you can review and save it.</p>
          </div>
          <table class="data-table">
            <thead><tr><th>Template Name</th><th>Category</th><th>Description</th><th>Action</th></tr></thead>
            <tbody>
              @for(t of pageSlice('sopStarter', filteredSopStarterTemplates); track t.name) {
                <tr>
                  <td class="td-primary table-cell-text" [title]="cellTitle(t.name)">{{ t.name }}</td>
                  <td><span class="tag" style="font-size:.6875rem" [title]="cellTitle(t.category)">{{ t.category }}</span></td>
                  <td class="table-cell-text" style="color:var(--text-muted);font-size:.8125rem" [title]="cellTitle(t.description)">{{ t.description }}</td>
                  <td>
                    <button class="template-use-btn" [disabled]="!editMode()" (click)="addSopFromSample(t)">Add to my SOPs</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-vault-table-footer
            [totalItems]="filteredSopStarterTemplates.length"
            [page]="tablePage('sopStarter')"
            [pageSize]="TABLE_PAGE_SIZE"
            [editMode]="editMode()"
            [allowAdd]="false"
            (pageChange)="setTablePage('sopStarter', $event)" />
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
          <input type="text" class="form-input" [(ngModel)]="sopEditName" [readonly]="!editMode()" />
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" [(ngModel)]="sopEditCategory" [disabled]="!editMode()">
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
          <input type="text" class="form-input" [(ngModel)]="sopEditDescription" [readonly]="!editMode()" />
        </div>
        <div class="form-group">
          <label class="form-label">Instructions / Content</label>
          <textarea class="form-input sop-content-input" [(ngModel)]="sopEditContent" [readonly]="!editMode()" placeholder="Enter step-by-step instructions..."></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary btn-sm" (click)="closeSopModal()">{{ editMode() ? 'Cancel' : 'Close' }}</button>
        @if (editMode()) {
          <button class="btn-primary btn-sm" (click)="saveSopContent()">Save SOP Changes</button>
        }
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
      this.showSopFeedback('Click Edit at the top of the page first, then add templates.');
      return;
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
