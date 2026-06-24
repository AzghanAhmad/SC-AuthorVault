import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName, BoxSetRecord } from '../../../models/author-vault.model';
import { EditableFieldComponent } from '../../shared/editable-field/editable-field.component';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

@Component({
  selector: 'app-vault-pennames-page',
  standalone: true,
  imports: [CommonModule, FormsModule, EditableFieldComponent, PageActionBarComponent],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">
      <app-page-action-bar
        [editing]="editMode()"
        deleteLabel="Delete all pen names"
        (editToggle)="editMode.update(v => !v)"
        (deleteAll)="deleteAllPenNames()" />

      <!-- ── PEN NAME LIST ── -->
      @if (!selected()) {
        <div class="page-header">
          <div class="page-title-wrap">
            <svg class="header-icon-svg" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
            <h1 class="page-title" style="margin:0;">Pen Names</h1>
          </div>
          <p class="page-subtitle">Each pen name is a completely separate author identity</p>
        </div>
        <div class="stats-row">
          <div class="stat-card"><div class="stat-value">{{ allPenNames().length }}</div><div class="stat-label">Pen Names</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalSeries }}</div><div class="stat-label">Series</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalBooks }}</div><div class="stat-label">Books</div></div>
          <div class="stat-card"><div class="stat-value">{{ totalSubscribers | number }}</div><div class="stat-label">Subscribers</div></div>
        </div>

        <div class="pn-grid">
          @for (pn of allPenNames(); track pn.id) {
            <div class="pn-card" (click)="selectItem(pn)">
              <div class="pn-card-top">
                <label class="entity-avatar-upload" title="Upload pen name avatar (Click to change)" (click)="$event.stopPropagation()" style="margin-right:.5rem;">
                  @if (pn.identity.avatarUrl) {
                    <img [src]="pn.identity.avatarUrl" alt="" class="entity-avatar-img" style="width:52px;height:52px;border-radius:14px;" />
                  } @else {
                    <div class="pn-big-avatar" style="width:52px;height:52px;border-radius:14px;margin:0;">
                      {{ initials(pn.identity.displayName) }}
                    </div>
                  }
                  <input type="file" accept="image/*" hidden (change)="onPenNameAvatarUpload($event, pn.id)" />
                </label>
                <div class="pn-card-info">
                  <h2 class="pn-card-name">{{ pn.identity.displayName }}</h2>
                  <p class="pn-card-genre">{{ pn.identity.genre }}{{ pn.identity.subgenre ? ' · ' + pn.identity.subgenre : '' }}</p>
                  <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.35rem">
                    <span class="status status-green">{{ pn.identity.status }}</span>
                    <span class="tag">{{ pn.identity.penNameType }}</span>
                    <span class="tag">{{ pn.identity.privacyLevel }}</span>
                  </div>
                </div>
              </div>
              <div class="pn-card-stats">
                <div class="pnstat"><span class="pnstat-val">{{ pn.series.length }}</span><span class="pnstat-lbl">Series</span></div>
                <div class="pnstat"><span class="pnstat-val">{{ countBooks(pn) }}</span><span class="pnstat-lbl">Books</span></div>
                <div class="pnstat"><span class="pnstat-val">{{ pn.platformAccounts.length }}</span><span class="pnstat-lbl">Platforms</span></div>
                <div class="pnstat"><span class="pnstat-val">{{ pn.onlinePresence.subscriberCount | number }}</span><span class="pnstat-lbl">Subscribers</span></div>
              </div>
            </div>
          }
        </div>
      }

      <!-- ── SELECTED PEN NAME DETAIL ── -->
      @if (selected(); as pn) {
        <!-- Header -->
        <div class="pn-detail-header">
          <button class="back-btn" (click)="selected.set(null); tab.set('identity')">← All Pen Names</button>
          <div class="pn-detail-top">
            <label class="entity-avatar-upload" title="Upload pen name avatar (Click to change)" style="margin-right:.5rem;">
              @if (pn.identity.avatarUrl) {
                <img [src]="pn.identity.avatarUrl" alt="" class="entity-avatar-img" style="width:64px;height:64px;border-radius:16px;" />
              } @else {
                <div class="pn-big-avatar" style="width:64px;height:64px;font-size:22px;border-radius:16px;margin:0;">
                  {{ initials(pn.identity.displayName) }}
                </div>
              }
              <input type="file" accept="image/*" hidden (change)="onPenNameAvatarUpload($event, pn.id)" />
            </label>
            <div>
              <h1 class="page-title" style="margin:0 0 .2rem">{{ pn.identity.displayName }}</h1>
              <p class="page-subtitle" style="margin:0">{{ pn.identity.genre }} · {{ pn.identity.penNameType }} · <span class="status status-green">{{ pn.identity.status }}</span></p>
            </div>
          </div>
          <div class="pn-card-stats" style="margin-top:.75rem">
            <div class="pnstat"><span class="pnstat-val">{{ pn.series.length }}</span><span class="pnstat-lbl">Series</span></div>
            <div class="pnstat"><span class="pnstat-val">{{ countBooks(pn) }}</span><span class="pnstat-lbl">Books</span></div>
            <div class="pnstat"><span class="pnstat-val">{{ pn.platformAccounts.length }}</span><span class="pnstat-lbl">Platforms</span></div>
            <div class="pnstat"><span class="pnstat-val">{{ pn.onlinePresence.subscriberCount | number }}</span><span class="pnstat-lbl">Subscribers</span></div>
          </div>
        </div>

        <div class="vault-layout" style="margin-top:1.25rem">
          <nav class="vault-nav">
            @for (t of tabs; track t.id) {
              <button class="tab-item" [class.active]="tab() === t.id" (click)="tab.set(t.id)">
                @switch (t.id) {
                  @case ('identity') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><line x1="5" y1="16" x2="13" y2="16"/><line x1="17" y1="9" x2="17.01" y2="9"/><line x1="17" y1="13" x2="17.01" y2="13"/></svg>
                  }
                  @case ('branding') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"/><circle cx="7.5" cy="10.5" r="1.5"/><circle cx="11.5" cy="7.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><circle cx="15.5" cy="14.5" r="1.5"/></svg>
                  }
                  @case ('platforms') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
                  }
                  @case ('presence') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  }
                  @case ('community') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  }
                  @case ('boxsets') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  }
                  @case ('series') {
                    <svg class="tab-icon-svg" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  }
                }
                {{ t.label }}
              </button>
            }
          </nav>

          <div class="vault-content">

            <!-- Identity -->
            @if (tab() === 'identity') {
              <div class="card">
                <h3 class="section-title">Pen Name Identity</h3>
                <div class="form-grid">
                  <app-editable-field [readOnly]="!editMode()" label="Display Name" [value]="pn.identity.displayName" (valueChange)="vs.updatePenName(pn.id, { displayName: $event })" />
                  <app-editable-field [readOnly]="!editMode()" label="Legal Name Linked" [value]="pn.identity.legalNameLinked" (valueChange)="vs.updatePenName(pn.id, { legalNameLinked: $event })" />
                  <app-editable-field [readOnly]="!editMode()" label="Primary Genre" [value]="pn.identity.genre" (valueChange)="vs.updatePenName(pn.id, { genre: $event })" />
                  <app-editable-field [readOnly]="!editMode()" label="Subgenre" [value]="pn.identity.subgenre || ''" (valueChange)="vs.updatePenName(pn.id, { subgenre: $event })" />
                  
                  <!-- Genres Tag chips -->
                  <div class="form-group full"><span class="form-label">Genres & Sub-genres</span>
                    <div class="tag-row" style="align-items:center;">
                      <span class="tag">{{ pn.identity.genre }} (Primary)</span>
                      @if (pn.identity.subgenre) {
                        <span class="tag">{{ pn.identity.subgenre }} (Subgenre)</span>
                      }
                      @for (g of getAdditionalGenres(pn); track g) {
                        <span class="tag" style="display:inline-flex;align-items:center;gap:.25rem;">
                          {{ g }}
                          <span style="cursor:pointer;font-weight:700;color:var(--error);" (click)="removeAdditionalGenre(pn, g)" title="Remove genre">✕</span>
                        </span>
                      }
                      @if (addingGenre()) {
                        <div style="display:inline-flex;gap:.25rem;align-items:center;">
                          <input type="text" #newGenreInput (keyup.enter)="addAdditionalGenre(pn, newGenreInput.value); addingGenre.set(false)" style="padding:.2rem .4rem;border:1px solid var(--border-color);border-radius:4px;font-size:.75rem;background:var(--background);color:var(--text-primary);width:120px;" placeholder="Press Enter" />
                          <button (click)="addingGenre.set(false)" style="background:none;border:none;cursor:pointer;color:var(--error);font-size:.75rem;font-weight:600;">Cancel</button>
                        </div>
                      } @else {
                        <span class="tag" style="border-style:dashed;cursor:pointer;color:var(--text-muted);" (click)="addingGenre.set(true)">+ Add Genre</span>
                      }
                    </div>
                  </div>

                  <div class="form-group">
                    <span class="form-label">Pen Name Type</span>
                    <select class="form-input" [ngModel]="pn.identity.penNameType" (ngModelChange)="vs.updatePenName(pn.id, { penNameType: $event })" style="width:100%;height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                      <option value="Sole author">Sole author</option>
                      <option value="Co-authored">Co-authored</option>
                      <option value="Ghostwritten">Ghostwritten</option>
                      <option value="House name">House name</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <span class="form-label">Privacy Level</span>
                    <select class="form-input" [ngModel]="pn.identity.privacyLevel" (ngModelChange)="vs.updatePenName(pn.id, { privacyLevel: $event })" style="width:100%;height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                      <option value="Internal only">Internal only</option>
                      <option value="Partially public">Partially public</option>
                      <option value="Fully public">Fully public</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <span class="form-label">Publicly Disclosed</span>
                    <select class="form-input" [ngModel]="pn.identity.publiclyDisclosed" (ngModelChange)="vs.updatePenName(pn.id, { publiclyDisclosed: $event })" style="width:100%;height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                      <option [ngValue]="true">Yes</option>
                      <option [ngValue]="false">No</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <span class="form-label">Status</span>
                    <select class="form-input" [ngModel]="pn.identity.status" (ngModelChange)="vs.updatePenName(pn.id, { status: $event })" style="width:100%;height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                      <option value="Active">Active</option>
                      <option value="Retired">Retired</option>
                      <option value="Paused">Paused</option>
                    </select>
                  </div>
                  <app-editable-field [readOnly]="!editMode()" label="Date Created" [value]="pn.identity.dateCreated" (valueChange)="vs.updatePenName(pn.id, { dateCreated: $event })" />
                  <app-editable-field [readOnly]="!editMode()" label="Reason / Purpose" [value]="pn.identity.reason" (valueChange)="vs.updatePenName(pn.id, { reason: $event })" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Private Notes" [value]="pn.identity.notes || ''" (valueChange)="vs.updatePenName(pn.id, { notes: $event })" [full]="true" />
                </div>
              </div>
            }

            <!-- Branding -->
            @if (tab() === 'branding') {
              <div class="card">
                <h3 class="section-title">Branding & Visual Identity</h3>
                <p class="section-subtitle">Everything here relates to {{ pn.identity.displayName }} specifically — not the company or imprint</p>
                <div class="form-grid">
                  <app-editable-field [readOnly]="!editMode()" label="Tagline" [value]="pn.branding.tagline" (valueChange)="updateBranding(pn, 'tagline', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Bio — Short" [value]="pn.branding.bioShort" (valueChange)="updateBranding(pn, 'bioShort', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Bio — Medium" [value]="pn.branding.bioMedium" (valueChange)="updateBranding(pn, 'bioMedium', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Bio — Long" [value]="pn.branding.bioLong || ''" (valueChange)="updateBranding(pn, 'bioLong', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Bio — First Person" [value]="pn.branding.bioFirstPerson || ''" (valueChange)="updateBranding(pn, 'bioFirstPerson', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Bio — Third Person" [value]="pn.branding.bioThirdPerson || ''" (valueChange)="updateBranding(pn, 'bioThirdPerson', $event)" [full]="true" />
                  <app-editable-field [readOnly]="!editMode()" label="Brand Colors" [value]="pn.branding.brandColors" (valueChange)="updateBranding(pn, 'brandColors', $event)" />
                  <app-editable-field [readOnly]="!editMode()" label="Brand Fonts" [value]="pn.branding.brandFonts" (valueChange)="updateBranding(pn, 'brandFonts', $event)" />
                  <app-editable-field [readOnly]="!editMode()" label="Cover Style Notes" [value]="pn.branding.coverStyleNotes || ''" (valueChange)="updateBranding(pn, 'coverStyleNotes', $event)" [full]="true" />
                </div>
              </div>

              <!-- Press Kit Section -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1rem;">
                <div class="card" style="margin:0;">
                  <h3 class="section-title">Press Kit & Branding File</h3>
                  <p class="section-subtitle">Upload a compiled PDF or ZIP file containing author assets.</p>
                  
                  @if (pn.branding.pressKitFile) {
                    <div class="doc-upload-slot has-file" style="cursor:default;">
                      <span class="doc-slot-icon">📁</span>
                      <div class="doc-slot-body">
                        <span class="doc-slot-name" style="font-weight:700;">{{ pn.branding.pressKitFile }}</span>
                        <span class="doc-slot-hint">Ready for sharing</span>
                      </div>
                      <a [href]="composePressKitEmail(pn)" target="_blank" class="row-upload-btn" style="text-decoration:none;margin-right:.5rem;padding:.3rem .5rem;" title="Prefill template in email client">
                        ✉️ Compose Email
                      </a>
                      <span class="doc-slot-btn-delete" style="cursor:pointer;" (click)="removePressKitFile(pn)">✕</span>
                    </div>
                  } @else {
                    <label class="doc-upload-slot">
                      <span class="doc-slot-icon">📤</span>
                      <div class="doc-slot-body">
                        <span class="doc-slot-name">Upload Press Kit File</span>
                        <span class="doc-slot-hint">PDF or ZIP (max 15MB)</span>
                      </div>
                      <input type="file" accept=".pdf,.zip" hidden (change)="onPressKitUpload($event, pn)" />
                    </label>
                  }
                </div>

                <div class="card" style="margin:0;">
                  <h3 class="section-title">Press Kit Checklist</h3>
                  <p class="section-subtitle">Items that make up a robust media and branding kit</p>
                  <div class="checklist">
                    @for (item of pressKitItems; track item) {
                      <label class="check-item" [class.done]="isPressKitItemChecked(pn, item)" style="cursor:pointer;user-select:none;">
                        <input type="checkbox" [checked]="isPressKitItemChecked(pn, item)" (change)="togglePressKitItem(pn, item)" style="display:none;" />
                        <span class="check-dot">
                          @if (isPressKitItemChecked(pn, item)) { ✓ }
                        </span>
                        <span>{{ item }}</span>
                      </label>
                    }
                  </div>
                </div>
              </div>

              <div class="card">
                <h3 class="section-title">Pen Name Graphics & Assets</h3>
                <p class="section-subtitle">Author photos, ads, logos, and graphics specific to {{ pn.identity.displayName }}</p>
                <div class="asset-grid">
                  <div class="asset-slot">
                    <div class="asset-icon">🖼</div>
                    <span class="asset-label">Author Photo</span>
                    <span class="asset-sub">JPG, PNG — 1:1 ratio</span>
                  </div>
                  <div class="asset-slot">
                    <div class="asset-icon">🎨</div>
                    <span class="asset-label">Pen Name Logo</span>
                    <span class="asset-sub">SVG, PNG, EPS</span>
                  </div>
                  <div class="asset-slot">
                    <div class="asset-icon">📢</div>
                    <span class="asset-label">Ad Creatives</span>
                    <span class="asset-sub">Facebook, Amazon, BookBub</span>
                  </div>
                  <div class="asset-slot">
                    <div class="asset-icon">📱</div>
                    <span class="asset-label">Social Banners</span>
                    <span class="asset-sub">Twitter, Instagram, Facebook</span>
                  </div>
                  <div class="asset-slot">
                    <div class="asset-icon">📧</div>
                    <span class="asset-label">Newsletter Header</span>
                    <span class="asset-sub">600px wide recommended</span>
                  </div>
                  <div class="asset-slot">
                    <div class="asset-icon">🖨</div>
                    <span class="asset-label">Letterhead</span>
                    <span class="asset-sub">DOCX, PDF</span>
                  </div>
                </div>
              </div>
            }

            <!-- Platforms -->
            @if (tab() === 'platforms') {
              <div class="card">
                <h3 class="section-title">Publishing Platform Accounts</h3>
                <p class="section-subtitle">All accounts belong to {{ pn.identity.displayName }}, not the company</p>
                <table class="data-table">
                  <thead><tr><th>Platform</th><th>Account Info</th><th>URL</th></tr></thead>
                  <tbody>
                    @for (pa of pn.platformAccounts; track pa.platform) {
                      <tr><td class="td-primary">{{ pa.platform }}</td><td>{{ pa.accountInfo }}</td><td>{{ pa.url || '—' }}</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- Online Presence -->
            @if (tab() === 'presence') {
              <div class="card">
                <h3 class="section-title">Online Presence</h3>
                <p class="section-subtitle">All web and social presence for {{ pn.identity.displayName }}</p>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Author Website</span><div class="form-value"><a [href]="pn.onlinePresence.authorWebsite" target="_blank" style="color:var(--accent-blue)">{{ pn.onlinePresence.authorWebsite }}</a></div></div>
                  <div class="form-group"><span class="form-label">Newsletter Platform</span><div class="form-value">{{ pn.onlinePresence.newsletterPlatform }}</div></div>
                  <div class="form-group"><span class="form-label">Newsletter Name</span><div class="form-value">{{ pn.onlinePresence.newsletterName }}</div></div>
                  <div class="form-group"><span class="form-label">Subscribers</span><div class="form-value" style="font-weight:700;color:var(--accent-blue)">{{ pn.onlinePresence.subscriberCount | number }}</div></div>
                </div>
              </div>
              <div class="card">
                <h3 class="section-title">Social Media Accounts</h3>
                <table class="data-table">
                  <thead><tr><th>Platform</th><th>Handle</th><th>URL</th><th style="width:50px;">Action</th></tr></thead>
                  <tbody>
                    @for (s of pn.onlinePresence.socialAccounts; track s.platform) {
                      <tr>
                        <td class="td-primary">{{ s.platform }}</td>
                        <td>{{ s.handle }}</td>
                        <td>{{ s.url || '—' }}</td>
                        <td>
                          <button (click)="removeSocialAccount(pn, s.platform)" style="background:none;border:none;cursor:pointer;color:var(--error);font-size:.875rem;" title="Delete channel">✕</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>

                <!-- Add Custom Channel Form -->
                <div style="margin-top:1.25rem;padding:1rem;background:var(--background);border:1.5px dashed var(--border-color);border-radius:10px;">
                  <h4 style="margin:0 0 .75rem;font-size:.875rem;font-weight:600;color:var(--text-primary);">Add Custom Channel / Social Media</h4>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:.75rem;align-items:flex-end;">
                    <div class="form-group">
                      <span class="form-label" style="font-size:.7rem;">Platform Name</span>
                      <input type="text" [(ngModel)]="newSocialPlatform" placeholder="e.g. YouTube, Discord" class="form-input" style="padding:.4rem .6rem;font-size:.8125rem;" />
                    </div>
                    <div class="form-group">
                      <span class="form-label" style="font-size:.7rem;">Handle</span>
                      <input type="text" [(ngModel)]="newSocialHandle" placeholder="e.g. @veblackwood" class="form-input" style="padding:.4rem .6rem;font-size:.8125rem;" />
                    </div>
                    <div class="form-group">
                      <span class="form-label" style="font-size:.7rem;">URL/Address</span>
                      <input type="text" [(ngModel)]="newSocialUrl" placeholder="e.g. https://..." class="form-input" style="padding:.4rem .6rem;font-size:.8125rem;" />
                    </div>
                    <button class="row-upload-btn" (click)="addSocialAccount(pn)" style="height:36px;padding:0 1rem;font-weight:600;">Add Channel</button>
                  </div>
                </div>
              </div>
              <div class="card">
                <h3 class="section-title">Email & Store Accounts</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Pen Name Email</span><div class="form-value">{{ pn.identity.displayName.toLowerCase().replace(' ','') }}@authorvaultpress.com</div></div>
                  <div class="form-group"><span class="form-label">Direct Store</span><div class="form-value">{{ pn.onlinePresence.authorWebsite }}/shop</div></div>
                  <div class="form-group"><span class="form-label">Goodreads</span><div class="form-value">goodreads.com/author/{{ pn.identity.displayName.toLowerCase().replace(' ','-') }}</div></div>
                  <div class="form-group"><span class="form-label">BookBub</span><div class="form-value">bookbub.com/authors/{{ pn.identity.displayName.toLowerCase().replace(' ','-') }}</div></div>
                </div>
              </div>
            }

            <!-- Reader Community -->
            @if (tab() === 'community') {
              <div class="card">
                <h3 class="section-title">Reader Community</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Primary Demographic</span><div class="form-value">{{ pn.readerCommunity.primaryDemographic }}</div></div>
                  <div class="form-group"><span class="form-label">ARC Team</span><div class="form-value">{{ pn.readerCommunity.arcTeam }}</div></div>
                  <div class="form-group"><span class="form-label">Beta Readers</span><div class="form-value">{{ pn.readerCommunity.betaReaderPool }}</div></div>
                  <div class="form-group"><span class="form-label">Facebook Group</span><div class="form-value">{{ pn.readerCommunity.readerFacebookGroup || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Reader Persona</span><div class="form-value">{{ pn.readerCommunity.readerPersona }}</div></div>
                  <div class="form-group full"><span class="form-label">Engagement Notes</span><div class="form-value">{{ pn.readerCommunity.engagementNotes }}</div></div>
                </div>
              </div>
            }

            <!-- Box Sets Tab -->
            @if (tab() === 'boxsets') {
              <div class="card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                  <h3 class="section-title" style="margin:0">Box Sets / Omnibus Collections</h3>
                  <button class="btn-primary" [disabled]="!editMode()" (click)="openAddBoxSet(pn)">+ Create Box Set</button>
                </div>
                
                @for (sr of pn.series; track sr.id) {
                  @if (sr.boxSets && sr.boxSets.length > 0) {
                    <div style="margin-bottom:1rem;padding:1rem;background:var(--background);border:1px solid var(--border-color);border-radius:12px;">
                      <h4 style="margin:0 0 .5rem;color:var(--accent-blue)">Series: {{ sr.identity.name }}</h4>
                      <div class="entity-list">
                        @for (bs of sr.boxSets; track bs.id) {
                          <div class="entity-card" (click)="openEditBoxSet(pn, sr.id, bs)" style="cursor:pointer;">
                            <div class="entity-card-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
                              <h5 class="boxset-card-title">
                                <svg class="entity-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                                </svg>
                                {{ bs.title }}
                              </h5>
                              <span class="status" [class]="bs.status === 'Published' ? 'status-green' : 'status-amber'">{{ bs.status }}</span>
                            </div>
                            <p style="font-size:.8rem;color:var(--text-muted);margin:.2rem 0;">{{ bs.subtitle || 'No subtitle' }} · {{ bs.type }}</p>
                            <p style="font-size:.75rem;color:var(--text-secondary);margin:.2rem 0;">{{ bs.constituentTitles.length }} Books · {{ bs.totalWordCount | number }} words</p>
                            <div style="display:flex;gap:.5rem;margin-top:.5rem;">
                              <button (click)="$event.stopPropagation(); deleteBoxSet(pn, sr.id, bs.id)" style="background:none;border:none;color:var(--error);font-size:.75rem;cursor:pointer;padding:0;font-weight:600;">Remove</button>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
                
                @if (pnSeriesBoxSetsCount(pn) === 0) {
                  <div class="empty-state">
                    <svg class="empty-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                    <p>No box sets created yet for this pen name.</p>
                  </div>
                }
              </div>
            }

            <!-- Series -->
            @if (tab() === 'series') {
              <div class="card">
                <h3 class="section-title">Series under {{ pn.identity.displayName }}</h3>
                <div class="entity-list">
                  @for (sr of pn.series; track sr.id) {
                    <div class="entity-card" (click)="goTo('/vault/series')">
                      <div class="entity-card-header">
                        <h3 class="entity-name entity-name-with-icon">
                          <svg class="entity-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                          </svg>
                          {{ sr.identity.name }}
                        </h3>
                        <span class="status" [ngClass]="sr.identity.status==='Active'?'status-green':'status-blue'">{{ sr.identity.status }}</span>
                      </div>
                      <p class="entity-meta">{{ sr.identity.seriesType }} · {{ sr.identity.genre }} · {{ sr.identity.targetAudience }}</p>
                      <div class="entity-stats">
                        <span class="entity-stat"><strong>{{ sr.books.length }}</strong> / {{ sr.identity.plannedTotalBooks }} Books</span>
                        <span class="entity-stat"><strong>{{ sr.boxSets.length }}</strong> Box Sets</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

          </div>
        </div>
      }
    </div>

    <!-- ── BOX SET EDIT MODAL ── -->
    @if (showBoxSetModal() && selected(); as pn) {
      <div class="modal-overlay" (click)="closeBoxSetModal()">
        <div class="modal-content" (click)="$event.stopPropagation()" style="width:680px;">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingBoxSet() ? 'Edit Box Set' : 'Create Box Set' }}</h3>
            <button class="modal-close" (click)="closeBoxSetModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              
              <div class="form-group">
                <span class="form-label">Assign to Series</span>
                <select class="form-input" [(ngModel)]="selectedSeriesId" [disabled]="!!editingBoxSet()" style="height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                  @for (sr of pn.series; track sr.id) {
                    <option [value]="sr.id">{{ sr.identity.name }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <span class="form-label">Status</span>
                <select class="form-input" [(ngModel)]="boxSetForm.status" style="width:100%;height:38px;padding:.55rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;background:var(--surface);color:var(--text-primary);font-size:.875rem;font-family:inherit;">
                  <option value="Draft">Draft</option>
                  <option value="Pre-order">Pre-order</option>
                  <option value="Published">Published</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div class="form-group">
                <span class="form-label">Box Set Title</span>
                <input class="form-input" [(ngModel)]="boxSetForm.title" placeholder="e.g. Complete Romance Trilogy" />
              </div>

              <div class="form-group">
                <span class="form-label">Subtitle</span>
                <input class="form-input" [(ngModel)]="boxSetForm.subtitle" placeholder="e.g. Books 1-3 Omnibus" />
              </div>

              <div class="form-group">
                <span class="form-label">Format Type</span>
                <input class="form-input" [(ngModel)]="boxSetForm.type" placeholder="e.g. Digital Omnibus, Print Collection" />
              </div>

              <div class="form-group">
                <span class="form-label">Publication Date</span>
                <input type="date" class="form-input" [(ngModel)]="boxSetForm.dueDate" />
              </div>

              <div class="form-group">
                <span class="form-label">Word Count</span>
                <input type="number" class="form-input" [(ngModel)]="boxSetForm.totalWordCount" />
              </div>

              <div class="form-group">
                <span class="form-label">Page Count</span>
                <input type="number" class="form-input" [(ngModel)]="boxSetForm.totalPageCount" />
              </div>

              <div class="form-group">
                <span class="form-label">Cover Designer</span>
                <input class="form-input" [(ngModel)]="boxSetForm.coverDesigner" />
              </div>

              <div class="form-group">
                <span class="form-label">Value Proposition</span>
                <input class="form-input" [(ngModel)]="boxSetForm.valueProposition" placeholder="e.g. Save 30%" />
              </div>

              <div class="form-group full">
                <span class="form-label">Select Constituent Books (Check all that apply)</span>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;max-height:180px;overflow-y:auto;padding:.5rem;background:var(--background);border:1px solid var(--border-color);border-radius:8px;">
                  @for (book of getAllPenNameBooks(pn); track book.id) {
                    <label style="display:flex;align-items:center;gap:.5rem;font-size:.8125rem;cursor:pointer;color:var(--text-secondary);user-select:none;">
                      <input type="checkbox" [checked]="constituentBookSelections()[book.id]" (change)="toggleConstituentBook(book.id)" style="cursor:pointer;" />
                      <span>Vol. {{ book.coreWork.seriesNumber }}: {{ book.coreWork.masterTitle }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="form-group full">
                <span class="form-label">One-Line Hook</span>
                <input class="form-input" [(ngModel)]="boxSetForm.oneLineHook" placeholder="Brief tagline hook for marketing" />
              </div>

              <div class="form-group full">
                <span class="form-label">Short Blurb / Description</span>
                <textarea class="form-input" rows="2" [(ngModel)]="boxSetForm.shortDescription"></textarea>
              </div>

              <div class="form-group full">
                <span class="form-label">Long Blurb / Description</span>
                <textarea class="form-input" rows="3" [(ngModel)]="boxSetForm.longDescription"></textarea>
              </div>

              <div class="form-group">
                <span class="form-label">KDP Select / Exclusivity Conflict Check</span>
                <input class="form-input" [(ngModel)]="boxSetForm.kdpSelectConflictCheck" placeholder="e.g. Enrolled in KDP Select — wide outlets removed" />
              </div>

              <div class="form-group" style="justify-content:center;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.875rem;color:var(--text-secondary);margin-top:1.25rem;user-select:none;">
                  <input type="checkbox" [(ngModel)]="boxSetForm.exclusiveContent" />
                  <span>Includes Exclusive Content?</span>
                </label>
              </div>

              @if (boxSetForm.exclusiveContent) {
                <div class="form-group full">
                  <span class="form-label">Exclusive Content Description</span>
                  <input class="form-input" [(ngModel)]="boxSetForm.exclusiveDescription" placeholder="e.g. Includes a bonus epilogue chapter" />
                </div>
              }

              <div class="form-group full" style="margin-top:.5rem;">
                <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.875rem;color:var(--text-secondary);user-select:none;">
                  <input type="checkbox" [(ngModel)]="boxSetForm.bundleRightsConfirmed" />
                  <span>I confirm that all bundle publishing rights are confirmed.</span>
                </label>
              </div>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeBoxSetModal()">Cancel</button>
            <button class="btn-primary" (click)="saveBoxSet(pn)" [disabled]="!boxSetForm.title.trim() || !boxSetForm.bundleRightsConfirmed">Save Box Set</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pn-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
    .pn-card {
      background: var(--surface); border: 1px solid var(--border-light); border-radius: 16px;
      padding: 1.5rem; cursor: pointer; transition: all .25s; box-shadow: var(--shadow-sm);
    }
    .pn-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); border-color: rgba(79,70,229,.3); }
    .pn-card-top { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .pn-big-avatar {
      width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 18px;
    }
    .pn-card-name { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .pn-card-genre { font-size: .8125rem; color: var(--text-muted); margin: 0; }
    .pn-card-stats { display: flex; gap: 1.25rem; flex-wrap: wrap; padding-top: .875rem; border-top: 1px solid var(--border-light); }
    .pnstat { display: flex; flex-direction: column; }
    .pnstat-val { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
    .pnstat-lbl { font-size: .6875rem; color: var(--text-muted); }
    .pn-detail-header { background: var(--surface); border: 1px solid var(--border-light); border-radius: 16px; padding: 1.5rem; box-shadow: var(--shadow-sm); }
    .pn-detail-top { display: flex; align-items: center; gap: 1rem; margin-top: .75rem; }
    .asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: .875rem; margin-top: .5rem; }
    .asset-slot {
      border: 2px dashed var(--border-color); border-radius: 10px; padding: 1.25rem .875rem;
      text-align: center; cursor: pointer; transition: border-color .2s;
      display: flex; flex-direction: column; align-items: center; gap: .35rem;
    }
    .asset-slot:hover { border-color: var(--accent-blue); }
    .asset-icon { font-size: 1.5rem; }
    .asset-label { font-size: .8125rem; font-weight: 600; color: var(--text-primary); }
    .asset-sub { font-size: .6875rem; color: var(--text-muted); }
    .empty-icon-svg { width: 40px; height: 40px; color: var(--text-muted); margin-bottom: 0.5rem; }
    .entity-icon-svg { width: 18px; height: 18px; flex-shrink: 0; color: var(--accent-blue, #6366f1); }
    .entity-name-with-icon, .boxset-card-title { display: flex; align-items: center; gap: 0.5rem; margin: 0; font-size: .95rem; font-weight: 700; }
  `]
})
export class VaultPenNamesPageComponent {
  readonly vs = inject(AuthorVaultService);
  private router = inject(Router);
  editMode = signal(false);

  allPenNames = computed(() => {
    const pns: PenName[] = [];
    for (const i of this.vs.company().imprints) pns.push(...i.penNames);
    return pns;
  });

  selected = signal<PenName | null>(null);
  tab = signal('identity');

  addingGenre = signal(false);

  // Social handles
  newSocialPlatform = '';
  newSocialHandle = '';
  newSocialUrl = '';

  // Press Kit items
  pressKitItems = ['Author Photo', 'Multi-length Bios', 'Cover Assets', 'Comp Titles', 'Contact Details', 'Book Sheet'];

  // Box Sets state
  showBoxSetModal = signal(false);
  editingBoxSet = signal<BoxSetRecord | null>(null);
  selectedSeriesId = '';
  constituentBookSelections = signal<Record<string, boolean>>({});

  boxSetForm = {
    id: '',
    title: '',
    subtitle: '',
    type: 'Digital Omnibus',
    status: 'Draft' as BoxSetRecord['status'],
    dueDate: '', // Maps to publicationDate
    penName: '',
    copyrightHolder: '',
    totalWordCount: 0,
    totalPageCount: 0,
    constituentTitles: [] as any[],
    exclusiveContent: false,
    exclusiveDescription: '',
    coverDesigner: '',
    oneLineHook: '',
    shortDescription: '',
    longDescription: '',
    valueProposition: '',
    bundleRightsConfirmed: false,
    kdpSelectConflictCheck: ''
  };

  tabs = [
    { id: 'identity',  label: 'Identity' },
    { id: 'branding',  label: 'Branding & Assets' },
    { id: 'platforms', label: 'Platforms' },
    { id: 'presence',  label: 'Online Presence' },
    { id: 'community', label: 'Reader Community' },
    { id: 'boxsets',   label: 'Box Sets' },
    { id: 'series',    label: 'Series' },
  ];

  get totalSeries() { return this.allPenNames().reduce((a, p) => a + p.series.length, 0); }
  get totalBooks() { return this.allPenNames().reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0); }
  get totalSubscribers() { return this.allPenNames().reduce((a, p) => a + p.onlinePresence.subscriberCount, 0); }

  countBooks(pn: PenName): number {
    return pn.series.reduce((a, s) => a + s.books.length, 0);
  }

  initials(name: string): string {
    const p = name.trim().split(' ');
    return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  selectItem(pn: PenName) { this.selected.set(pn); this.tab.set('identity'); }
  goTo(r: string) { this.router.navigate([r]); }

  // Avatar Upload
  onPenNameAvatarUpload(event: Event, penNameId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.vs.setPenNameAvatar(penNameId, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Branding update
  updateBranding(pn: PenName, field: keyof PenName['branding'], value: string): void {
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        [field]: value
      }
    });
  }

  // Genre chips helpers
  getAdditionalGenres(pn: PenName): string[] {
    if (!pn.identity.additionalGenres) return [];
    return pn.identity.additionalGenres.split(',').map(g => g.trim()).filter(Boolean);
  }

  addAdditionalGenre(pn: PenName, value: string): void {
    if (!value.trim()) return;
    const current = this.getAdditionalGenres(pn);
    if (!current.includes(value.trim())) {
      current.push(value.trim());
      const updated = current.join(', ');
      this.vs.updatePenName(pn.id, { additionalGenres: updated });
    }
  }

  removeAdditionalGenre(pn: PenName, value: string): void {
    const current = this.getAdditionalGenres(pn);
    const updatedList = current.filter(g => g !== value);
    this.vs.updatePenName(pn.id, { additionalGenres: updatedList.join(', ') });
  }

  // Presence platform helpers
  addSocialAccount(pn: PenName): void {
    if (!this.newSocialPlatform.trim() || !this.newSocialHandle.trim()) return;
    const current = [...pn.onlinePresence.socialAccounts];
    current.push({
      platform: this.newSocialPlatform.trim(),
      handle: this.newSocialHandle.trim(),
      url: this.newSocialUrl.trim()
    });
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        socialAccounts: current
      }
    });
    this.newSocialPlatform = '';
    this.newSocialHandle = '';
    this.newSocialUrl = '';
  }

  removeSocialAccount(pn: PenName, platform: string): void {
    const current = pn.onlinePresence.socialAccounts.filter(s => s.platform !== platform);
    this.vs.updatePenNameFull(pn.id, {
      onlinePresence: {
        ...pn.onlinePresence,
        socialAccounts: current
      }
    });
  }

  // Press Kit helpers
  isPressKitItemChecked(pn: PenName, item: string): boolean {
    return pn.branding.pressKitChecklist?.includes(item) ?? false;
  }

  togglePressKitItem(pn: PenName, item: string): void {
    const current = pn.branding.pressKitChecklist ? [...pn.branding.pressKitChecklist] : [];
    const idx = current.indexOf(item);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(item);
    }
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitChecklist: current
      }
    });
  }

  onPressKitUpload(event: Event, pn: PenName): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitFile: file.name
      }
    });
  }

  removePressKitFile(pn: PenName): void {
    this.vs.updatePenNameFull(pn.id, {
      branding: {
        ...pn.branding,
        pressKitFile: undefined
      }
    });
  }

  composePressKitEmail(pn: PenName): string {
    const subject = encodeURIComponent(`Press Kit Request - ${pn.identity.displayName}`);
    const body = encodeURIComponent(`Hi there,\n\nI have updated the official Press Kit / Branding assets for my pen name, ${pn.identity.displayName}.\n\nYou can access or review them in the attachment or directly request details.\n\nBest regards,\n${pn.identity.displayName}`);
    return `mailto:media@scribecount.com?subject=${subject}&body=${body}`;
  }

  // Box Sets managers
  pnSeriesBoxSetsCount(pn: PenName): number {
    return pn.series.reduce((a, s) => a + (s.boxSets?.length ?? 0), 0);
  }

  getAllPenNameBooks(pn: PenName): any[] {
    const books: any[] = [];
    for (const sr of pn.series) {
      if (sr.books) {
        books.push(...sr.books);
      }
    }
    return books;
  }

  openAddBoxSet(pn: PenName): void {
    this.editingBoxSet.set(null);
    this.selectedSeriesId = pn.series[0]?.id || '';
    this.boxSetForm = {
      id: '',
      title: '',
      subtitle: '',
      type: 'Digital Omnibus',
      status: 'Draft',
      dueDate: new Date().toISOString().split('T')[0],
      penName: pn.identity.displayName,
      copyrightHolder: this.vs.company().identity.legalName,
      totalWordCount: 220000,
      totalPageCount: 880,
      constituentTitles: [],
      exclusiveContent: false,
      exclusiveDescription: '',
      coverDesigner: 'James Okafor',
      oneLineHook: '',
      shortDescription: '',
      longDescription: '',
      valueProposition: '',
      bundleRightsConfirmed: true,
      kdpSelectConflictCheck: ''
    };

    const selections: Record<string, boolean> = {};
    for (const b of this.getAllPenNameBooks(pn)) {
      selections[b.id] = false;
    }
    this.constituentBookSelections.set(selections);
    this.showBoxSetModal.set(true);
  }

  openEditBoxSet(pn: PenName, seriesId: string, bs: BoxSetRecord): void {
    this.editingBoxSet.set(bs);
    this.selectedSeriesId = seriesId;
    this.boxSetForm = {
      id: bs.id,
      title: bs.title,
      subtitle: bs.subtitle,
      type: bs.type,
      status: bs.status,
      dueDate: bs.publicationDate,
      penName: bs.penName,
      copyrightHolder: bs.copyrightHolder,
      totalWordCount: bs.totalWordCount,
      totalPageCount: bs.totalPageCount,
      constituentTitles: [...bs.constituentTitles],
      exclusiveContent: bs.exclusiveContent,
      exclusiveDescription: bs.exclusiveDescription,
      coverDesigner: bs.coverDesigner,
      oneLineHook: bs.oneLineHook,
      shortDescription: bs.shortDescription,
      longDescription: bs.longDescription,
      valueProposition: bs.valueProposition,
      bundleRightsConfirmed: bs.bundleRightsConfirmed,
      kdpSelectConflictCheck: bs.kdpSelectConflictCheck
    };

    const selections: Record<string, boolean> = {};
    const selectedIds = bs.constituentTitles.map(t => t.bookId);
    for (const b of this.getAllPenNameBooks(pn)) {
      selections[b.id] = selectedIds.includes(b.id);
    }
    this.constituentBookSelections.set(selections);
    this.showBoxSetModal.set(true);
  }

  closeBoxSetModal(): void {
    this.showBoxSetModal.set(false);
    this.editingBoxSet.set(null);
  }

  toggleConstituentBook(bookId: string): void {
    this.constituentBookSelections.update(s => ({
      ...s,
      [bookId]: !s[bookId]
    }));
  }

  saveBoxSet(pn: PenName): void {
    if (!this.boxSetForm.title.trim()) return;

    const selectedBooks = this.getAllPenNameBooks(pn).filter(b => this.constituentBookSelections()[b.id]);
    const constituentTitles = selectedBooks.map((b, i) => ({
      bookId: b.id,
      title: b.coreWork.masterTitle,
      position: i + 1,
      edition: 'First Edition'
    }));

    const seriesId = this.selectedSeriesId;
    const series = pn.series.find(s => s.id === seriesId);
    if (!series) return;

    const currentBoxSets = [...(series.boxSets ?? [])];

    const record: BoxSetRecord = {
      id: this.boxSetForm.id || `bs-${Date.now()}`,
      title: this.boxSetForm.title.trim(),
      subtitle: this.boxSetForm.subtitle.trim(),
      parentSeriesId: seriesId,
      type: this.boxSetForm.type,
      status: this.boxSetForm.status,
      publicationDate: this.boxSetForm.dueDate,
      penName: pn.identity.displayName,
      copyrightHolder: this.boxSetForm.copyrightHolder || 'Company LLC',
      totalWordCount: Number(this.boxSetForm.totalWordCount),
      totalPageCount: Number(this.boxSetForm.totalPageCount),
      constituentTitles,
      exclusiveContent: this.boxSetForm.exclusiveContent,
      exclusiveDescription: this.boxSetForm.exclusiveDescription,
      coverDesigner: this.boxSetForm.coverDesigner,
      oneLineHook: this.boxSetForm.oneLineHook,
      shortDescription: this.boxSetForm.shortDescription,
      longDescription: this.boxSetForm.longDescription,
      valueProposition: this.boxSetForm.valueProposition,
      bundleRightsConfirmed: this.boxSetForm.bundleRightsConfirmed,
      kdpSelectConflictCheck: this.boxSetForm.kdpSelectConflictCheck
    };

    if (this.editingBoxSet()) {
      const idx = currentBoxSets.findIndex(b => b.id === record.id);
      if (idx >= 0) {
        currentBoxSets[idx] = record;
      }
    } else {
      currentBoxSets.push(record);
    }

    this.vs.updateBoxSets(pn.id, seriesId, currentBoxSets);
    this.closeBoxSetModal();
  }

  deleteBoxSet(pn: PenName, seriesId: string, boxSetId: string): void {
    if (!this.editMode()) return;
    const series = pn.series.find(s => s.id === seriesId);
    if (!series) return;
    const updated = (series.boxSets ?? []).filter(b => b.id !== boxSetId);
    this.vs.updateBoxSets(pn.id, seriesId, updated);
  }

  deleteAllPenNames(): void {
    if (!confirm('Delete all pen names (and their series, books, and box sets)? This cannot be undone.')) return;
    this.vs.clearAllPenNames();
    this.selected.set(null);
    this.editMode.set(false);
  }
}
