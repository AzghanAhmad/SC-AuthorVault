import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { ToastService } from '../../../services/toast.service';
import { Book, BookFile, MarketingAsset, PlatformVersion, BookStatus } from '../../../models/book.model';

type TabId = 'overview' | 'files' | 'metadata' | 'platforms' | 'marketing' | 'ai';
type CorePlacementTarget = {
  key: string;
  label: string;
  section: string;
  category: BookFile['category'];
  defaultFormat?: BookFile['format'];
  defaultPlatform?: string;
};

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page" *ngIf="book()">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="/dashboard">Dashboard</a>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{{ book()!.title }}</span>
      </div>

      <!-- Page Header -->
      <div class="detail-header">
        <div class="header-left">
          <h1 class="page-title">{{ book()!.title }}</h1>
          <div class="header-meta">
            <span class="badge" [class]="'badge-' + book()!.status">{{ book()!.status }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-text">by {{ book()!.author }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-text">Updated {{ book()!.updatedAt }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary btn-sm" (click)="saveBook()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <button class="btn-primary btn-sm" (click)="publishBook()">Publish</button>
        </div>
      </div>

      <!-- Layout: Sidebar + Content -->
      <div class="detail-layout">
        <!-- Left Tab Nav -->
        <nav class="detail-nav">
          @for (tab of tabs; track tab.id) {
            <button class="tab-item" [class.active]="activeTab() === tab.id" (click)="activeTab.set(tab.id)">
              <span class="tab-icon" [innerHTML]="tab.icon"></span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          }
        </nav>

        <!-- Main Content -->
        <div class="detail-content">

          <!-- ═══ OVERVIEW ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'overview'">
            <div class="summary-cards">
              <div class="summary-card">
                <div class="sc-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div class="sc-value">{{ book()!.files.length }}</div>
                <div class="sc-label">Total Files</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg></div>
                <div class="sc-value">{{ configuredPlatforms() }}</div>
                <div class="sc-label">Platforms</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg></div>
                <div class="sc-value">{{ book()!.marketingAssets.length }}</div>
                <div class="sc-label">Marketing Assets</div>
              </div>
              <div class="summary-card">
                <div class="sc-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
                <div class="sc-value">{{ approvedCount() }}</div>
                <div class="sc-label">Approved</div>
              </div>
            </div>

            <!-- Status Breakdown -->
            <div class="card section-card">
              <h3 class="section-title">Status Breakdown</h3>
              <div class="status-bars">
                @for (st of statusBreakdown(); track st.label) {
                  <div class="status-row">
                    <div class="status-row-label">
                      <span class="status-dot-sm" [style.background]="st.color"></span>
                      {{ st.label }}
                    </div>
                    <div class="status-bar-track">
                      <div class="status-bar-fill" [style.width.%]="st.percent" [style.background]="st.color"></div>
                    </div>
                    <span class="status-count">{{ st.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="card section-card">
              <h3 class="section-title">Version History</h3>
              <div class="history-list" *ngIf="book()!.versionHistory.length > 0">
                @for (entry of book()!.versionHistory; track entry.id) {
                  <div class="history-item">
                    <div class="history-dot"></div>
                    <div class="history-info">
                      <span class="history-field">{{ entry.field }}</span> updated by <strong>{{ entry.changedBy }}</strong>
                      <span class="history-date">{{ entry.changedAt }}</span>
                    </div>
                  </div>
                }
              </div>
              <p class="empty-text" *ngIf="book()!.versionHistory.length === 0">No version history yet.</p>
            </div>
          </div>

          <!-- ═══ CORE FILES ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'files'">
            <div class="section-header">
              <h2 class="section-title">Core Book Files</h2>
              <button class="btn-primary btn-sm" (click)="openUploadModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload File
              </button>
            </div>

            <div class="card core-flow-card">
              <div class="core-flow-copy">
                <h3>Place a file exactly where it belongs</h3>
                <p>Select the book, language, target slot, format, and platform, then open the upload modal with that placement pre-filled.</p>
              </div>
              <div class="core-flow-grid">
                <div class="form-group">
                  <label class="form-label">Select Title</label>
                  <select class="form-input" [(ngModel)]="coreTitleFilter">
                    <option [value]="book()!.id">{{ book()!.title }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Select Language</label>
                  <select class="form-input" [(ngModel)]="filesLangFilter">
                    @for (language of languageOptions; track language.code) {
                      <option [value]="language.code">{{ language.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group wide">
                  <label class="form-label">Select File Slot</label>
                  <select class="form-input" [(ngModel)]="coreTargetKey">
                    @for (target of corePlacementTargets; track target.key) {
                      <option [value]="target.key">{{ target.section }} · {{ target.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Select Format</label>
                  <select class="form-input" [(ngModel)]="coreFormatFilter">
                    @for (format of formatOptions; track format.value) {
                      <option [value]="format.value">{{ format.label }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Select Platform</label>
                  <select class="form-input" [(ngModel)]="corePlatformFilter">
                    @for (platform of platformOptions; track platform.value) {
                      <option [value]="platform.value">{{ platform.label }}</option>
                    }
                  </select>
                </div>
                <button class="btn-primary core-flow-go" (click)="openUploadFromCoreFlow()">Go</button>
              </div>
            </div>

            <p style="font-size:.8125rem;color:var(--text-muted);margin-bottom:1.25rem;padding:.625rem .875rem;background:var(--primary-light);border-radius:8px">
              📌 Showing the complete Core File map for {{ getLanguageLabel(filesLangFilter) }}. Change the language to repeat the same structure for another edition. Drag a file onto a slot, click a slot, or use the placement workflow above.
            </p>

            <!-- ── FRONT MATTER ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  Front Matter
                </h3>
                <span class="file-section-desc">Everything before Chapter 1 — title page, copyright, dedication, TOC, foreword, preface</span>
              </div>
              <div class="file-slots-grid">
                @for (slot of frontMatterSlots; track slot.key) {
                  <div class="file-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                    <div class="slot-icon" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
                      @switch (slot.icon) {
                        @case ('star') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
                        @case ('file') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
                        @case ('file-text') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
                        @case ('image') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
                        @case ('copyright') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/></svg> }
                        @case ('heart') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> }
                        @case ('pen') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> }
                        @case ('list') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
                        @case ('thanks') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> }
                      }
                    </div>
                    <div class="slot-info">
                      <div class="slot-name">{{ slot.label }}</div>
                      <div class="slot-desc">{{ slot.desc }}</div>
                    </div>
                    <div class="slot-status empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── BODY ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  Body
                </h3>
                <span class="file-section-desc">The main manuscript — chapters, parts, epilogue</span>
              </div>
              <div class="file-slots-grid">
                @for (slot of bodySlots; track slot.key) {
                  <div class="file-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                    <div class="slot-icon" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
                      @switch (slot.icon) {
                        @case ('play') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
                        @case ('compass') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> }
                        @case ('book') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> }
                        @case ('book-open') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
                        @case ('list') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
                        @case ('image') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
                        @case ('check') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="20 6 9 17 4 12"/></svg> }
                        @case ('sparkles') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg> }
                      }
                    </div>
                    <div class="slot-info">
                      <div class="slot-name">{{ slot.label }}</div>
                      <div class="slot-desc">{{ slot.desc }}</div>
                    </div>
                    <div class="slot-status empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── BACK MATTER ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M6 6h10M6 10h10M6 14h10"/></svg>
                  Back Matter
                </h3>
                <span class="file-section-desc">Everything after the story — acknowledgments, author bio, bibliography, index, bonus content, next-book preview</span>
              </div>
              <div class="file-slots-grid">
                @for (slot of backMatterSlots; track slot.key) {
                  <div class="file-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                    <div class="slot-icon" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
                      @switch (slot.icon) {
                        @case ('thanks') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> }
                        @case ('profile') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
                        @case ('file-text') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
                        @case ('pen') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> }
                        @case ('mail') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
                        @case ('eye') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
                        @case ('book') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> }
                        @case ('gift') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> }
                        @case ('book-open') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> }
                        @case ('number') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg> }
                        @case ('link') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
                        @case ('message') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
                        @case ('paperclip') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> }
                        @case ('calendar') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
                        @case ('receipt') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg> }
                        @case ('printer') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> }
                      }
                    </div>
                    <div class="slot-info">
                      <div class="slot-name">{{ slot.label }}</div>
                      <div class="slot-desc">{{ slot.desc }}</div>
                    </div>
                    <div class="slot-status empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── METADATA & RETAILER COPY ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Metadata & Retailer Copy
                </h3>
                <span class="file-section-desc">Book metadata, retailer descriptions, keywords, categories, and platform-specific back-matter instructions</span>
              </div>
              <div class="file-slots-grid">
                @for (slot of metadataSlots; track slot.key) {
                  <div class="file-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                    <div class="slot-icon" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
                      @switch (slot.icon) {
                        @case ('clipboard') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> }
                        @case ('search') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
                        @case ('cart') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> }
                        @case ('list') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
                        @case ('number') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg> }
                        @case ('scale') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><line x1="12" y1="2" x2="12" y2="22"/><line x1="5" y1="5" x2="19" y2="5"/><path d="M5 5v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5"/></svg> }
                      }
                    </div>
                    <div class="slot-info">
                      <div class="slot-name">{{ slot.label }}</div>
                      <div class="slot-desc">{{ slot.desc }}</div>
                    </div>
                    <div class="slot-status empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── EBOOK FILES (per platform) ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  Ebook Files — Per Platform
                </h3>
                <span class="file-section-desc">Each platform may require different metadata in the back matter, different cover sizes, or different EPUB specs</span>
              </div>
              <div class="platform-file-grid">
                @for (pf of ebookPlatformSlots; track pf.platform) {
                  <div class="platform-file-card">
                    <div class="pf-header">
                      <span class="pf-platform">{{ pf.platform }}</span>
                      <span class="pf-spec">{{ pf.spec }}</span>
                    </div>
                    <div class="pf-slots">
                      @for (slot of pf.slots; track slot.key) {
                        <div class="pf-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                          <span class="pf-slot-label">{{ slot.label }}</span>
                          <span class="pf-slot-upload">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── PAPERBACK INTERIORS (per trim size) ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Paperback Interiors — Per Trim Size
                </h3>
                <span class="file-section-desc">Each trim size is a separate formatted file. Most authors use one size; some use several.</span>
              </div>
              <div class="platform-file-grid">
                @for (ts of paperbackTrimSlots; track ts.size) {
                  <div class="platform-file-card">
                    <div class="pf-header">
                      <span class="pf-platform">{{ ts.size }}</span>
                      <span class="pf-spec">{{ ts.note }}</span>
                    </div>
                    <div class="pf-slots">
                      @for (slot of ts.slots; track slot.key) {
                        <div class="pf-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                          <span class="pf-slot-label">{{ slot.label }}</span>
                          <span class="pf-slot-upload">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── COVER ART (per platform/format) ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  Cover Art — Per Platform & Format
                </h3>
                <span class="file-section-desc">Each platform and format requires specific cover dimensions. Source files (PSD/AI) go here too.</span>
              </div>
              <div class="platform-file-grid">
                @for (cv of coverArtSlots; track cv.platform) {
                  <div class="platform-file-card">
                    <div class="pf-header">
                      <span class="pf-platform">{{ cv.platform }}</span>
                      <span class="pf-spec">{{ cv.spec }}</span>
                    </div>
                    <div class="pf-slots">
                      @for (slot of cv.slots; track slot.key) {
                        <div class="pf-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                          <span class="pf-slot-label">{{ slot.label }}</span>
                          <span class="pf-slot-upload">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── AUDIOBOOK ── -->
            <div class="file-section">
              <div class="file-section-header">
                <h3 class="file-section-title" style="display:flex;align-items:center;gap:.5rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                  Audiobook Files
                </h3>
                <span class="file-section-desc">Audio is one-size-fits-all across platforms. Upload chapter files or the full production master.</span>
              </div>
              <div class="file-slots-grid">
                @for (slot of audiobookSlots; track slot.key) {
                  <div class="file-slot" (click)="openUploadForSlot(slot)" (dragover)="$event.preventDefault()" (drop)="onDropToSlot($event, slot)">
                    <div class="slot-icon" style="display:flex;align-items:center;justify-content:center;color:var(--text-secondary)">
                      @switch (slot.icon) {
                        @case ('mic') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> }
                        @case ('headphones') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg> }
                        @case ('image') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
                        @case ('play-icon') { <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
                      }
                    </div>
                    <div class="slot-info">
                      <div class="slot-name">{{ slot.label }}</div>
                      <div class="slot-desc">{{ slot.desc }}</div>
                    </div>
                    <div class="slot-status empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- ── EXISTING UPLOADED FILES ── -->
            <div class="file-section" *ngIf="visibleFiles().length > 0">
              <div class="file-section-header">
                <h3 class="file-section-title">📁 Uploaded Files for {{ getLanguageLabel(filesLangFilter) }}</h3>
                <span class="file-section-desc">Files attached to the selected language edition</span>
              </div>
              <div class="file-list">
                @for (file of visibleFiles(); track file.id) {
                  <div class="file-card">
                    <div class="file-icon" [class]="'fi-' + file.format">{{ file.format | uppercase }}</div>
                    <div class="file-info">
                      <div class="file-name">{{ file.name }}</div>
                      <div class="file-meta">{{ formatSize(file.size) }} · {{ file.language | uppercase }} · {{ file.uploadedAt }}</div>
                      <div class="file-tags">
                        @for (tag of file.tags; track tag) { <span class="tag-chip">{{ tag }}</span> }
                      </div>
                    </div>
                    <span class="badge" [class]="'badge-' + file.status">{{ file.status }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- ═══ METADATA ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'metadata'">
            <div class="section-header">
              <h2 class="section-title">Book Metadata</h2>
              <div class="header-actions">
                <button class="btn-secondary btn-sm" (click)="saveDraft()">Save Draft</button>
                <button class="btn-primary btn-sm" (click)="publishMetadata()">Publish</button>
              </div>
            </div>

            <div class="card section-card">
              <div class="form-group">
                <label class="form-label">One-Line Hook</label>
                <input type="text" class="form-input" [(ngModel)]="book()!.metadata.oneLineHook" placeholder="A compelling one-liner..." />
              </div>
              <div class="form-group">
                <label class="form-label">Short Blurb</label>
                <textarea class="form-input" rows="3" [(ngModel)]="book()!.metadata.shortBlurb" placeholder="2-3 sentence blurb..."></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Long Blurb</label>
                <textarea class="form-input" rows="6" [(ngModel)]="book()!.metadata.longBlurb" placeholder="Full book description..."></textarea>
              </div>
            </div>

            <div class="card section-card">
              <h3 class="section-title">Keywords & Categories</h3>
              <div class="form-group">
                <label class="form-label">Keywords</label>
                <div class="tag-input-wrap">
                  <div class="tag-list">
                    @for (kw of book()!.metadata.keywords; track kw; let i = $index) {
                      <span class="tag-chip removable">{{ kw }} <button (click)="removeKeyword(i)">&times;</button></span>
                    }
                  </div>
                  <input type="text" class="form-input" placeholder="Type and press Enter..." (keydown.enter)="addKeyword($event)" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">BISAC Categories</label>
                <div class="tag-list" style="margin-bottom:.5rem">
                  @for (cat of book()!.metadata.bisacCategories; track cat) {
                    <span class="tag-chip">{{ cat }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card section-card">
              <h3 class="section-title">Author & Publishing</h3>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Author Bio</label>
                  <textarea class="form-input" rows="3" [(ngModel)]="book()!.metadata.authorBio" placeholder="About the author..."></textarea>
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Series Name</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.seriesName" placeholder="Series name (if any)" />
                </div>
                <div class="form-group">
                  <label class="form-label">Series Number</label>
                  <input type="number" class="form-input" [(ngModel)]="book()!.metadata.seriesNumber" placeholder="#" />
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">ISBN</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.isbn" placeholder="978-..." />
                </div>
                <div class="form-group">
                  <label class="form-label">Copyright</label>
                  <input type="text" class="form-input" [(ngModel)]="book()!.metadata.copyright" placeholder="© 2024..." />
                </div>
              </div>
              <div class="form-row two-col">
                <div class="form-group">
                  <label class="form-label">Language</label>
                  <select class="form-input" [(ngModel)]="book()!.metadata.language">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Publish Date</label>
                  <input type="date" class="form-input" [(ngModel)]="book()!.metadata.publishDate" />
                </div>
              </div>
            </div>
          </div>

          <!-- ═══ PLATFORM VERSIONS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'platforms'">
            <h2 class="section-title" style="margin-bottom:1.5rem">Platform-Specific Versions</h2>

            @for (platform of book()!.platforms; track platform.platform) {
              <div class="card section-card platform-card">
                <div class="platform-header" (click)="togglePlatform(platform.platform)">
                  <div class="platform-left">
                    <div class="platform-icon" [class]="'pi-' + platform.platform">{{ getPlatformLabel(platform.platform).charAt(0) }}</div>
                    <div>
                      <h3 class="platform-name">{{ getPlatformLabel(platform.platform) }}</h3>
                      <div class="platform-req-summary">
                        {{ getCompletedReqs(platform) }}/{{ platform.requirements.length }} requirements met
                      </div>
                    </div>
                  </div>
                  <svg class="expand-arrow" [class.rotated]="expandedPlatform === platform.platform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                <div class="platform-body" *ngIf="expandedPlatform === platform.platform">
                  <!-- Inherit Toggle -->
                  <div class="inherit-toggle">
                    <div class="setting-info">
                      <span class="setting-label">Inherit from base metadata</span>
                      <span class="setting-desc">When enabled, this platform uses your base book metadata</span>
                    </div>
                    <input type="checkbox" class="toggle" [(ngModel)]="platform.inheritsBase" />
                  </div>

                  <div *ngIf="!platform.inheritsBase" class="platform-fields">
                    <div class="form-group">
                      <label class="form-label">Custom Description</label>
                      <textarea class="form-input" rows="4" [(ngModel)]="platform.customDescription" placeholder="Platform-specific description..."></textarea>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Subtitle</label>
                      <input type="text" class="form-input" [(ngModel)]="platform.subtitle" placeholder="Platform subtitle..." />
                    </div>
                  </div>

                  <!-- Requirements Checklist -->
                  <div class="req-section">
                    <h4 class="req-title">Requirements Checklist</h4>
                    @for (req of platform.requirements; track req.label) {
                      <label class="req-item">
                        <input type="checkbox" [(ngModel)]="req.completed" class="req-check" />
                        <span [class.completed]="req.completed">{{ req.label }}</span>
                      </label>
                    }
                    <p class="empty-text" *ngIf="platform.requirements.length === 0">No requirements for this platform.</p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- ═══ MARKETING ASSETS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'marketing'">
            <div class="section-header">
              <h2 class="section-title">Marketing Assets</h2>
              <button class="btn-primary btn-sm" (click)="showAssetModal = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Asset
              </button>
            </div>

            <div class="asset-grid" *ngIf="book()!.marketingAssets.length > 0">
              @for (asset of book()!.marketingAssets; track asset.id) {
                <div class="asset-card">
                  <div class="asset-header">
                    <span class="asset-type-badge" [class]="'at-' + asset.type">{{ assetTypeLabel(asset.type) }}</span>
                    <span class="badge" [class]="'badge-' + asset.status">{{ asset.status }}</span>
                  </div>
                  <h4 class="asset-title">{{ asset.title }}</h4>
                  <p class="asset-preview">{{ asset.content | slice:0:120 }}{{ asset.content.length > 120 ? '...' : '' }}</p>
                  <div class="asset-footer">
                    <div class="asset-tags">
                      @for (tag of asset.tags; track tag) {
                        <span class="tag-chip sm">{{ tag }}</span>
                      }
                    </div>
                    <span class="asset-meta">{{ asset.platform }} · {{ asset.updatedAt }}</span>
                  </div>
                </div>
              }
            </div>
            <div class="empty-state" *ngIf="book()!.marketingAssets.length === 0">
              <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg></div>
              <h3>No marketing assets</h3>
              <p>Start building your marketing toolkit</p>
            </div>
          </div>

          <!-- ═══ AI TOOLS ═══ -->
          <div class="tab-panel" *ngIf="activeTab() === 'ai'">
            <h2 class="section-title" style="margin-bottom:.5rem">AI Tools</h2>
            <p class="section-subtitle">Generate content using AI-powered tools (simulation)</p>

            <div class="ai-actions">
              @for (action of aiActions; track action.label) {
                <button class="ai-action-btn" (click)="runAiAction(action)" [disabled]="aiLoading()">
                  <span class="ai-icon" [innerHTML]="action.icon"></span>
                  <div>
                    <span class="ai-label">{{ action.label }}</span>
                    <span class="ai-desc">{{ action.description }}</span>
                  </div>
                </button>
              }
            </div>

            <!-- Interactive AI Custom Prompt Box (Question Box) -->
            <div class="card section-card" style="margin-top:1.5rem">
              <h3 class="section-title" style="display:flex;align-items:center;gap:.5rem">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" style="color:var(--accent-blue)"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Ask a Custom Question
              </h3>
              <p class="section-subtitle">Type a prompt below to generate custom blurbs, marketing hooks, or email campaigns for this book.</p>
              
              <div class="ai-prompt-box" style="position:relative;display:flex;align-items:center;background:var(--background);border:1.5px solid var(--border-color);border-radius:12px;padding:.5rem .75rem;transition:border-color .2s">
                <span style="color:var(--text-muted);display:flex;align-items:center;margin-right:.6rem">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <input type="text" [(ngModel)]="customAiPrompt" (keydown.enter)="runCustomAiAction()" placeholder="Ask AI to write copy, draft an email, or compile notes..." style="flex:1;background:transparent;border:none;outline:none;font-family:inherit;font-size:.875rem;color:var(--text-primary);padding:.5rem 0" />
                <button (click)="runCustomAiAction()" [disabled]="aiLoading() || !customAiPrompt.trim()" style="background:var(--accent-blue);color:#fff;border:none;border-radius:8px;padding:.4rem .85rem;font-size:.8125rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.35rem;font-family:inherit;transition:opacity .15s">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send
                </button>
              </div>
            </div>

            <!-- AI Output -->
            <div class="card section-card ai-output" *ngIf="aiResult() || aiLoading()">
              <div class="ai-output-header">
                <h3 class="section-title">AI Output</h3>
                <button class="btn-secondary btn-sm" *ngIf="aiResult()" (click)="copyToClipboard(aiResult())">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy
                </button>
              </div>
              <div class="ai-loading" *ngIf="aiLoading()">
                <div class="ai-spinner"></div>
                <span>Generating content...</span>
              </div>
              <pre class="ai-result" *ngIf="!aiLoading() && aiResult()">{{ aiResult() }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <div class="modal-overlay" *ngIf="showUploadModal" (click)="closeUploadModal()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Upload File</h2>
              <p *ngIf="uploadSlotLabel" style="font-size:.8125rem;color:var(--accent-blue);margin:.2rem 0 0;font-weight:500">→ {{ uploadSlotLabel }}</p>
            </div>
            <button class="modal-close" (click)="closeUploadModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="placement-summary" *ngIf="uploadPlacementPath">
              <span>Placement</span>
              <strong>{{ uploadPlacementPath }}</strong>
            </div>
            <div class="form-group"><label class="form-label">File Name</label><input type="text" class="form-input" [(ngModel)]="uploadFileName" placeholder="your-file.epub" /></div>
            <div class="form-group">
              <label class="form-label">Attach File</label>
              <div class="attach-file-row">
                <input
                  #uploadInput
                  type="file"
                  class="visually-hidden"
                  accept=".epub,.pdf,.docx,.mp3,.wav,.m4a,.aac,.flac,.psd,.ai,.png,.jpg,.jpeg"
                  (change)="onUploadFileSelected($event)"
                />
                <button type="button" class="attach-file-btn" (click)="uploadInput.click()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  {{ selectedUploadFile ? 'Change file' : 'Attach file' }}
                </button>
                <div class="attached-file" *ngIf="selectedUploadFile">
                  <span class="attached-file-name">{{ selectedUploadFile.name }}</span>
                  <span class="attached-file-size">{{ formatSize(selectedUploadFile.size) }}</span>
                </div>
              </div>
              <p class="attach-hint" *ngIf="!selectedUploadFile">Choose a file from your device or enter the file name manually.</p>
            </div>
            <div class="form-row two-col">
              <div class="form-group"><label class="form-label">Format</label><select class="form-input" [(ngModel)]="uploadFormat"><option value="epub">EPUB</option><option value="pdf">PDF</option><option value="audio">Audio</option><option value="docx">DOCX</option><option value="psd">PSD</option><option value="ai">AI</option><option value="png">PNG</option><option value="jpg">JPG</option></select></div>
              <div class="form-group"><label class="form-label">Category</label><select class="form-input" [(ngModel)]="uploadCategory"><option value="ebook-master">Ebook Master</option><option value="paperback-interior">Paperback Interior</option><option value="hardcover-interior">Hardcover Interior</option><option value="audiobook">Audiobook</option><option value="cover-source">Cover Source</option></select></div>
            </div>
          </div>
          <div class="modal-footer"><button class="btn-secondary" (click)="closeUploadModal()">Cancel</button><button class="btn-primary" (click)="uploadFile()">Upload</button></div>
        </div>
      </div>

      <!-- Asset Modal -->
      <div class="modal-overlay" *ngIf="showAssetModal" (click)="showAssetModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header"><h2>Add Marketing Asset</h2><button class="modal-close" (click)="showAssetModal = false">&times;</button></div>
          <div class="modal-body">
            <div class="form-group"><label class="form-label">Title</label><input type="text" class="form-input" [(ngModel)]="newAssetTitle" placeholder="Asset title" /></div>
            <div class="form-row two-col">
              <div class="form-group"><label class="form-label">Type</label><select class="form-input" [(ngModel)]="newAssetType"><option value="ad">Ad</option><option value="headline">Headline</option><option value="newsletter">Newsletter</option><option value="social-post">Social Post</option><option value="blog">Blog</option><option value="promo-graphic">Promo Graphic</option></select></div>
              <div class="form-group"><label class="form-label">Platform</label><input type="text" class="form-input" [(ngModel)]="newAssetPlatform" placeholder="e.g. Facebook" /></div>
            </div>
            <div class="form-group"><label class="form-label">Content</label><textarea class="form-input" rows="4" [(ngModel)]="newAssetContent" placeholder="Asset content..."></textarea></div>
          </div>
          <div class="modal-footer"><button class="btn-secondary" (click)="showAssetModal = false">Cancel</button><button class="btn-primary" (click)="addAsset()">Add Asset</button></div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div class="page" *ngIf="!book() && !notFound">
      <div class="skeleton" style="height:32px;width:200px;margin-bottom:1.5rem"></div>
      <div class="skeleton" style="height:48px;width:60%;margin-bottom:1rem"></div>
      <div class="skeleton" style="height:20px;width:40%;margin-bottom:2rem"></div>
      <div style="display:grid;grid-template-columns:200px 1fr;gap:2rem">
        <div><div class="skeleton" style="height:300px;border-radius:16px"></div></div>
        <div><div class="skeleton" style="height:400px;border-radius:16px"></div></div>
      </div>
    </div>

    <div class="page empty-state" *ngIf="notFound" style="padding-top:4rem">
      <div class="empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
      <h3>Book not found</h3>
      <p>The book you're looking for doesn't exist.</p>
      <a routerLink="/dashboard" class="btn-primary">Back to Dashboard</a>
    </div>
  `,
  styles: [`
    .page { max-width:1200px; width:100%; }

    /* Breadcrumb */
    .breadcrumb { display:flex;align-items:center;gap:.5rem;font-size:.8125rem;color:var(--text-muted);margin-bottom:1.5rem; }
    .breadcrumb a { color:var(--accent-blue);text-decoration:none;font-weight:500; }
    .breadcrumb a:hover { text-decoration:underline; }
    .breadcrumb svg { width:14px;height:14px; }

    /* Header */
    .detail-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem; }
    .page-title { font-size:1.75rem;font-weight:700;color:var(--text-primary);margin:0 0 .5rem; }
    .header-meta { display:flex;align-items:center;gap:.5rem;font-size:.8125rem;flex-wrap:wrap; }
    .meta-sep { color:var(--text-muted); }
    .meta-text { color:var(--text-muted); }
    .header-actions { display:flex;gap:.5rem; }

    /* Layout */
    .detail-layout { display:grid;grid-template-columns:220px 1fr;gap:2rem; }

    /* Tab Nav */
    .detail-nav { display:flex;flex-direction:column;gap:.25rem;position:sticky;top:1rem;align-self:flex-start; }
    .tab-item { display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:transparent;border:none;border-radius:10px;font-size:.875rem;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .2s;text-align:left;font-family:inherit; }
    .tab-item:hover { background:rgba(59,130,246,.05);color:var(--text-primary); }
    .tab-item.active { background:rgba(59,130,246,.08);color:var(--accent-blue);font-weight:600; }
    .tab-icon { width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .tab-icon :first-child { width:18px;height:18px; }

    /* Content Cards */
    .card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:1.5rem;box-shadow:var(--shadow-sm); }
    .section-card { margin-bottom:1.25rem; }
    .section-title { font-size:1.125rem;font-weight:600;color:var(--text-primary);margin:0 0 .5rem; }
    .section-subtitle { font-size:.875rem;color:var(--text-muted);margin:0 0 1.5rem; }
    .section-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;flex-wrap:wrap;gap:.75rem; }

    /* Overview Summary Cards */
    .summary-cards { display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem; }
    .summary-card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:1.25rem;text-align:center;box-shadow:var(--shadow-sm);transition:all .3s; }
    .summary-card:hover { transform:translateY(-2px);box-shadow:var(--shadow-md); }
    .sc-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto .75rem; }
    .sc-icon svg { width:20px;height:20px; }
    .sc-icon.blue { background:rgba(59,130,246,.1);color:#3b82f6; }
    .sc-icon.purple { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .sc-icon.teal { background:rgba(20,184,166,.1);color:#14b8a6; }
    .sc-icon.green { background:rgba(16,185,129,.1);color:#10b981; }
    .sc-value { font-size:1.75rem;font-weight:700;color:var(--text-primary);line-height:1.2; }
    .sc-label { font-size:.75rem;color:var(--text-muted);margin-top:.25rem; }

    /* Status Bars */
    .status-bars { display:flex;flex-direction:column;gap:.75rem;margin-top:1rem; }
    .status-row { display:flex;align-items:center;gap:1rem; }
    .status-row-label { min-width:100px;font-size:.8125rem;font-weight:500;color:var(--text-secondary);display:flex;align-items:center;gap:.5rem; }
    .status-dot-sm { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .status-bar-track { flex:1;height:8px;background:var(--border-light);border-radius:100px;overflow:hidden; }
    .status-bar-fill { height:100%;border-radius:100px;transition:width .5s cubic-bezier(.4,0,.2,1); }
    .status-count { font-size:.8125rem;font-weight:600;color:var(--text-primary);min-width:24px;text-align:right; }

    /* History */
    .history-list { display:flex;flex-direction:column;gap:.75rem;margin-top:.75rem; }
    .history-item { display:flex;align-items:flex-start;gap:.75rem;font-size:.8125rem;color:var(--text-secondary); }
    .history-dot { width:8px;height:8px;border-radius:50%;background:var(--accent-blue);margin-top:5px;flex-shrink:0; }
    .history-field { font-weight:600;color:var(--text-primary); }
    .history-date { color:var(--text-muted);margin-left:.5rem; }

    /* Files */
    .core-flow-card { margin-bottom:1.25rem;padding:1rem; }
    .core-flow-copy { display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:.875rem; }
    .core-flow-copy h3 { font-size:1rem;font-weight:700;color:var(--text-primary);margin:0 0 .2rem; }
    .core-flow-copy p { font-size:.8125rem;color:var(--text-muted);margin:0;max-width:640px; }
    .core-flow-grid { display:grid;grid-template-columns:1.1fr 1fr 1.6fr 1fr 1fr auto;gap:.75rem;align-items:end; }
    .core-flow-grid .form-group { margin-bottom:0; }
    .core-flow-go { align-self:end;height:42px;padding:0 1.125rem; }
    .filter-sel-sm { padding:.4rem 1.75rem .4rem .75rem;border:1.5px solid var(--border-color);border-radius:8px;font-size:.8125rem;font-family:inherit;color:var(--text-primary);background:var(--surface);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .5rem center;appearance:none;outline:none; }
    .file-section { margin-bottom:2rem; }
    .file-section-header { margin-bottom:.875rem; }
    .file-section-title { font-size:1rem;font-weight:700;color:var(--text-primary);margin:0 0 .2rem; }
    .file-section-desc { font-size:.8125rem;color:var(--text-muted); }
    .file-slots-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:.75rem; }
    .file-slot {
      display:flex;align-items:center;gap:.875rem;padding:.875rem 1rem;
      background:var(--surface);border:1.5px dashed var(--border-color);border-radius:12px;
      cursor:pointer;transition:all .2s;
    }
    .file-slot:hover { border-color:var(--accent-blue);background:var(--primary-light); }
    .slot-icon { font-size:1.375rem;flex-shrink:0; }
    .slot-name { font-size:.875rem;font-weight:600;color:var(--text-primary);margin-bottom:.1rem; }
    .slot-desc { font-size:.75rem;color:var(--text-muted); }
    .slot-status { display:flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:500;margin-left:auto;flex-shrink:0;color:var(--text-muted); }
    .slot-status.empty { color:var(--text-muted); }
    .slot-status.filled { color:#10b981; }
    .platform-file-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.875rem; }
    .platform-file-card { background:var(--surface);border:1px solid var(--border-light);border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm); }
    .pf-header { padding:.625rem .875rem;background:var(--background);border-bottom:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center; }
    .pf-platform { font-size:.8125rem;font-weight:700;color:var(--text-primary); }
    .pf-spec { font-size:.6875rem;color:var(--text-muted); }
    .pf-slots { padding:.5rem; }
    .pf-slot { display:flex;align-items:center;justify-content:space-between;padding:.5rem .625rem;border-radius:7px;cursor:pointer;transition:background .15s; }
    .pf-slot:hover { background:var(--primary-light); }
    .pf-slot-label { font-size:.8125rem;color:var(--text-secondary); }
    .pf-slot-upload { color:var(--text-muted);display:flex;align-items:center; }
    .drop-zone { border:2px dashed var(--border-color);border-radius:16px;padding:2.5rem;text-align:center;cursor:pointer;transition:all .3s;margin-bottom:1.5rem; }
    .drop-zone:hover { border-color:var(--accent-blue);background:rgba(59,130,246,.03); }
    .drop-icon { margin:0 auto .75rem;color:var(--text-muted); }
    .drop-icon svg { width:40px;height:40px; }
    .drop-text { font-size:.9rem;color:var(--text-secondary);margin:0 0 .25rem; }
    .drop-cta { color:var(--accent-blue);font-weight:600; }
    .drop-hint { font-size:.75rem;color:var(--text-muted);margin:0; }

    .file-category { margin-bottom:1.5rem; }
    .cat-title { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 .75rem;padding-bottom:.5rem;border-bottom:1px solid var(--border-light); }
    .file-list { display:flex;flex-direction:column;gap:.5rem; }
    .file-card { display:flex;align-items:center;gap:1rem;padding:1rem;background:var(--surface);border:1px solid var(--border-light);border-radius:12px;transition:all .2s; }
    .file-card:hover { box-shadow:var(--shadow-md); }
    .file-icon { width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:.6875rem;font-weight:700;letter-spacing:.03em;flex-shrink:0; }
    .fi-epub { background:rgba(59,130,246,.1);color:#3b82f6; }
    .fi-pdf { background:rgba(239,68,68,.1);color:#ef4444; }
    .fi-audio { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .fi-psd,.fi-ai { background:rgba(20,184,166,.1);color:#14b8a6; }
    .fi-docx { background:rgba(59,130,246,.1);color:#2563eb; }
    .fi-png,.fi-jpg { background:rgba(245,158,11,.1);color:#f59e0b; }
    .file-info { flex:1;min-width:0; }
    .file-name { font-size:.875rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
    .file-meta { font-size:.75rem;color:var(--text-muted);margin-top:.15rem; }
    .file-tags { display:flex;gap:.25rem;margin-top:.375rem;flex-wrap:wrap; }

    /* Tags */
    .tag-chip { display:inline-flex;align-items:center;gap:.25rem;padding:2px 8px;background:var(--primary-light);border:1px solid var(--border-color);border-radius:6px;font-size:.6875rem;font-weight:500;color:var(--text-secondary); }
    .tag-chip.sm { font-size:.625rem;padding:1px 6px; }
    .tag-chip.removable button { background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.875rem;line-height:1;padding:0 0 0 2px; }
    .tag-input-wrap { display:flex;flex-direction:column;gap:.5rem; }
    .tag-list { display:flex;gap:.375rem;flex-wrap:wrap; }

    /* Form Rows */
    .form-group { margin-bottom:1rem; }
    .form-row { margin-bottom:0; }
    .form-row.two-col { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }

    /* Platforms */
    .platform-card { padding:0;overflow:hidden; }
    .platform-header { display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;cursor:pointer;transition:background .2s; }
    .platform-header:hover { background:var(--background); }
    .platform-left { display:flex;align-items:center;gap:1rem; }
    .platform-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.125rem;font-weight:700;color:white;flex-shrink:0; }
    .pi-amazon { background:linear-gradient(135deg,#ff9900,#e47911); }
    .pi-kobo { background:linear-gradient(135deg,#c9232d,#a01b24); }
    .pi-apple { background:linear-gradient(135deg,#555,#333); }
    .pi-barnes-noble { background:linear-gradient(135deg,#2a6d3c,#1e5430); }
    .platform-name { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0; }
    .platform-req-summary { font-size:.75rem;color:var(--text-muted); }
    .expand-arrow { width:20px;height:20px;transition:transform .3s;color:var(--text-muted); }
    .expand-arrow.rotated { transform:rotate(180deg); }

    .platform-body { padding:0 1.5rem 1.5rem;border-top:1px solid var(--border-light); }
    .inherit-toggle { display:flex;align-items:center;justify-content:space-between;padding:1rem;background:var(--background);border-radius:12px;margin:1rem 0; }
    .setting-label { font-size:.875rem;font-weight:600;color:var(--text-primary);display:block; }
    .setting-desc { font-size:.8125rem;color:var(--text-muted); }
    .platform-fields { margin-top:1rem; }

    .req-section { margin-top:1.25rem; }
    .req-title { font-size:.8125rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:0 0 .75rem; }
    .req-item { display:flex;align-items:center;gap:.75rem;padding:.5rem 0;font-size:.875rem;color:var(--text-secondary);cursor:pointer; }
    .req-check { accent-color:var(--accent-blue); }
    .req-item .completed { color:var(--success);text-decoration:line-through; }

    /* Marketing Assets */
    .asset-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem; }
    .asset-card { background:var(--surface);border:1px solid var(--border-light);border-radius:14px;padding:1.25rem;transition:all .3s;box-shadow:var(--shadow-sm); }
    .asset-card:hover { box-shadow:var(--shadow-md);transform:translateY(-2px); }
    .asset-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem; }
    .asset-type-badge { padding:3px 10px;border-radius:8px;font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.03em; }
    .at-ad { background:rgba(59,130,246,.1);color:#3b82f6; }
    .at-headline { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .at-newsletter { background:rgba(20,184,166,.1);color:#14b8a6; }
    .at-social-post { background:rgba(236,72,153,.1);color:#ec4899; }
    .at-blog { background:rgba(245,158,11,.1);color:#f59e0b; }
    .at-promo-graphic { background:rgba(16,185,129,.1);color:#10b981; }
    .asset-title { font-size:.9375rem;font-weight:600;color:var(--text-primary);margin:0 0 .5rem; }
    .asset-preview { font-size:.8125rem;color:var(--text-muted);line-height:1.5;margin:0 0 .75rem;white-space:pre-line; }
    .asset-footer { display:flex;justify-content:space-between;align-items:flex-end; }
    .asset-tags { display:flex;gap:.25rem;flex-wrap:wrap; }
    .asset-meta { font-size:.6875rem;color:var(--text-muted); }

    /* AI Tools */
    .ai-actions { display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-bottom:1.5rem; }
    .ai-action-btn { display:flex;align-items:flex-start;gap:1rem;padding:1.25rem;background:var(--surface);border:1.5px solid var(--border-color);border-radius:14px;cursor:pointer;transition:all .3s;text-align:left;font-family:inherit; }
    .ai-action-btn:hover:not(:disabled) { border-color:var(--accent-indigo);box-shadow:var(--shadow-glow-purple);transform:translateY(-2px); }
    .ai-action-btn:disabled { opacity:.5;cursor:not-allowed; }
    .ai-icon { width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(139,92,246,.1));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--accent-indigo); }
    .ai-icon :first-child { width:20px;height:20px; }
    .ai-label { font-size:.875rem;font-weight:600;color:var(--text-primary);display:block;margin-bottom:.15rem; }
    .ai-desc { font-size:.75rem;color:var(--text-muted); }

    .ai-output-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }
    .ai-loading { display:flex;align-items:center;gap:.75rem;color:var(--accent-indigo);font-size:.875rem;font-weight:500; }
    .ai-spinner { width:20px;height:20px;border:2px solid rgba(99,102,241,.2);border-top-color:var(--accent-indigo);border-radius:50%;animation:spin .8s linear infinite; }
    .ai-result { font-size:.8125rem;line-height:1.7;color:var(--text-secondary);white-space:pre-wrap;font-family:'Inter',sans-serif;margin:0;background:var(--background);padding:1.25rem;border-radius:12px;border:1px solid var(--border-light); }

    .empty-text { font-size:.8125rem;color:var(--text-muted);font-style:italic; }
    .empty-state { text-align:center;padding:3rem 2rem; }
    .empty-icon { width:64px;height:64px;margin:0 auto 1rem;background:var(--primary-light);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--accent-blue); }
    .empty-icon svg { width:28px;height:28px; }
    .empty-state h3 { font-size:1.125rem;font-weight:700;color:var(--text-primary);margin:0 0 .375rem; }
    .empty-state p { font-size:.85rem;color:var(--text-muted);margin:0; }

    /* Modals */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem; }
    .modal-card { background:var(--surface);border-radius:18px;width:100%;max-width:520px;box-shadow:var(--shadow-xl);animation:fadeInUp .3s cubic-bezier(.4,0,.2,1); }
    .modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.5rem 1.5rem 0; }
    .modal-header h2 { font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0; }
    .modal-close { background:none;border:none;font-size:1.5rem;color:var(--text-muted);cursor:pointer; }
    .modal-body { padding:1.5rem; }
    .modal-footer { padding:0 1.5rem 1.5rem;display:flex;justify-content:flex-end;gap:.75rem; }
    .placement-summary { display:flex;flex-direction:column;gap:.2rem;padding:.75rem .875rem;background:var(--primary-light);border:1px solid var(--border-color);border-radius:10px;margin-bottom:1rem; }
    .placement-summary span { font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent-blue); }
    .placement-summary strong { font-size:.8125rem;color:var(--text-primary);line-height:1.35; }
    .visually-hidden { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }
    .attach-file-row { display:flex;align-items:center;gap:.75rem;flex-wrap:wrap; }
    .attach-file-btn {
      display:inline-flex;align-items:center;gap:.5rem;padding:.625rem .875rem;
      border:1.5px dashed var(--accent-blue);border-radius:10px;background:var(--primary-light);
      color:var(--accent-blue);font-size:.875rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;
    }
    .attach-file-btn:hover { background:rgba(59,130,246,.12);transform:translateY(-1px); }
    .attach-file-btn svg { width:16px;height:16px; }
    .attached-file { display:flex;align-items:center;gap:.5rem;min-width:0;flex:1;padding:.625rem .75rem;border:1px solid var(--border-light);border-radius:10px;background:var(--surface); }
    .attached-file-name { min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.875rem;font-weight:600;color:var(--text-primary); }
    .attached-file-size { flex-shrink:0;font-size:.75rem;color:var(--text-muted); }
    .attach-hint { font-size:.75rem;color:var(--text-muted);margin:.5rem 0 0; }

    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }

    @media(max-width:768px) {
      .detail-layout { grid-template-columns:1fr; }
      .detail-nav { flex-direction:row;overflow-x:auto;position:static;gap:.25rem; }
      .tab-label { display:none; }
      .summary-cards { grid-template-columns:repeat(2,1fr); }
      .ai-actions { grid-template-columns:1fr; }
      .form-row.two-col { grid-template-columns:1fr; }
      .core-flow-grid { grid-template-columns:1fr; }
      .core-flow-copy { flex-direction:column; }
    }
  `]
})
export class BookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private toast = inject(ToastService);
  private router = inject(Router);

  book = signal<Book | null>(null);
  activeTab = signal<TabId>('overview');
  notFound = false;

  expandedPlatform = '';
  showUploadModal = false;
  showAssetModal = false;
  uploadSlotKey = '';
  uploadSlotLabel = '';

  // Upload form
  uploadFileName = '';
  uploadFormat: BookFile['format'] = 'epub';
  uploadCategory: BookFile['category'] = 'ebook-master';
  selectedUploadFile: File | null = null;
  uploadPlacementPath = '';
  uploadPlatformLabel = 'All Platforms';
  coreTitleFilter = '';
  coreTargetKey = 'fm-title-page';
  coreFormatFilter: BookFile['format'] = 'epub';
  corePlatformFilter = 'all';

  // Asset form
  newAssetTitle = '';
  newAssetType = 'ad';
  newAssetPlatform = '';
  newAssetContent = '';

  // AI
  aiLoading = signal(false);
  aiResult = signal('');

  tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/></svg>' },
    { id: 'files' as TabId, label: 'Core Files', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { id: 'metadata' as TabId, label: 'Metadata', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>' },
    { id: 'platforms' as TabId, label: 'Platforms', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
    { id: 'marketing' as TabId, label: 'Marketing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>' },
    { id: 'ai' as TabId, label: 'AI Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 6 2-2 4-3.5 4-6a4 4 0 0 0-4-4z"/><circle cx="12" cy="18" r="4"/></svg>' },
  ];

  fileCategories = [
    { key: 'ebook-master', label: 'Ebook Master' },
    { key: 'paperback-interior', label: 'Paperback Interior' },
    { key: 'hardcover-interior', label: 'Hardcover Interior' },
    { key: 'audiobook', label: 'Audiobook Files' },
    { key: 'cover-source', label: 'Cover Source Files' },
  ];

  languageOptions = [
    { code: 'en', label: 'English (Primary)' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
  ];

  formatOptions: { value: BookFile['format']; label: string }[] = [
    { value: 'epub', label: 'EPUB' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'audio', label: 'Audio' },
    { value: 'psd', label: 'PSD' },
    { value: 'ai', label: 'AI' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
  ];

  platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'amazon-kdp', label: 'Amazon KDP' },
    { value: 'apple-books', label: 'Apple Books' },
    { value: 'kobo', label: 'Kobo' },
    { value: 'barnes-noble', label: 'Barnes & Noble' },
    { value: 'google-play', label: 'Google Play Books' },
    { value: 'draft2digital', label: 'Draft2Digital' },
    { value: 'ingramspark', label: 'IngramSpark' },
    { value: 'bookfunnel', label: 'BookFunnel' },
    { value: 'direct', label: 'Direct / Shopify' },
    { value: 'audio-retailers', label: 'Audio Retailers' },
  ];

  // ── Language filter for files tab ──
  filesLangFilter = 'en';

  // ── Front Matter slots ──
  frontMatterSlots = [
    { key: 'fm-accolades', label: 'Accolades / Praise', desc: 'Praise quotes and reviews', icon: 'star' },
    { key: 'fm-half-title', label: 'Half Title Page', desc: 'Title only, no author', icon: 'file' },
    { key: 'fm-frontispiece', label: 'Frontispiece', desc: 'Illustration or decorative page facing title', icon: 'image' },
    { key: 'fm-title-page', label: 'Full Title Page', desc: 'Title, author, imprint', icon: 'file' },
    { key: 'fm-copyright', label: 'Copyright Page', desc: 'ISBN, copyright, legal notices', icon: 'copyright' },
    { key: 'fm-dedication', label: 'Dedication', desc: 'Dedication text', icon: 'heart' },
    { key: 'fm-epigraph', label: 'Epigraph', desc: 'Opening quote or poem', icon: 'pen' },
    { key: 'fm-toc', label: 'Table of Contents', desc: 'Chapter list with page numbers', icon: 'list' },
    { key: 'fm-foreword', label: 'Foreword', desc: 'Written by someone other than the author', icon: 'file-text' },
    { key: 'fm-preface', label: 'Preface', desc: 'Author\'s introduction to the book', icon: 'file-text' },
    { key: 'fm-acknowledgments-front', label: 'Acknowledgments (Front)', desc: 'If placed before the story', icon: 'thanks' },
  ];

  // ── Body slots ──
  bodySlots = [
    { key: 'body-prologue', label: 'Prologue', desc: 'Sets the stage before Chapter 1', icon: 'play' },
    { key: 'body-introduction', label: 'Introduction', desc: 'Context for nonfiction or guided reading', icon: 'compass' },
    { key: 'body-manuscript', label: 'Full Manuscript', desc: 'Complete formatted manuscript file', icon: 'book' },
    { key: 'body-chapters', label: 'Chapter Files', desc: 'Individual chapter files (if split)', icon: 'book-open' },
    { key: 'body-parts', label: 'Part Dividers', desc: 'Part I, Part II, etc.', icon: 'list' },
    { key: 'body-illustrations', label: 'Interior Images / Figures', desc: 'Illustrations, tables, maps, charts', icon: 'image' },
    { key: 'body-conclusion', label: 'Conclusion', desc: 'Wrap-up section for nonfiction', icon: 'check' },
    { key: 'body-epilogue', label: 'Epilogue', desc: 'Story content after final chapter', icon: 'play' },
    { key: 'body-interlude', label: 'Interlude / Bonus Scene', desc: 'Bonus content within the story', icon: 'sparkles' },
  ];

  // ── Back Matter slots ──
  backMatterSlots = [
    { key: 'bm-acknowledgments', label: 'Acknowledgments', desc: 'Thank-you section', icon: 'thanks' },
    { key: 'bm-author-bio', label: 'Author Bio', desc: 'About the author page', icon: 'profile' },
    { key: 'bm-author-note', label: 'Author\'s Note', desc: 'Notes on research, inspiration, etc.', icon: 'file-text' },
    { key: 'bm-afterword', label: 'Afterword', desc: 'Reflection after the main text', icon: 'pen' },
    { key: 'bm-postscript', label: 'Postscript', desc: 'Final note or update', icon: 'mail' },
    { key: 'bm-next-book', label: 'Next Book Preview', desc: 'Chapter 1 of the next book', icon: 'eye' },
    { key: 'bm-series-list', label: 'Also By / Series List', desc: 'Other books by this author', icon: 'book' },
    { key: 'bm-bonus-material', label: 'Bonus Material', desc: 'Extras, deleted scenes, preview content', icon: 'gift' },
    { key: 'bm-newsletter-cta', label: 'Newsletter CTA', desc: 'Reader magnet / sign-up link', icon: 'mail' },
    { key: 'bm-glossary', label: 'Glossary', desc: 'Definitions of terms used', icon: 'book-open' },
    { key: 'bm-endnotes', label: 'Endnotes', desc: 'Citations and supplemental notes', icon: 'number' },
    { key: 'bm-bibliography', label: 'Bibliography', desc: 'Sources and references', icon: 'link' },
    { key: 'bm-index', label: 'Index', desc: 'Alphabetical index (non-fiction)', icon: 'list' },
    { key: 'bm-discussion', label: 'Discussion Questions', desc: 'Book club / reader guide', icon: 'message' },
    { key: 'bm-appendix', label: 'Appendix', desc: 'Supplementary material', icon: 'paperclip' },
    { key: 'bm-timeline', label: 'Chronology / Timeline', desc: 'Dates, events, continuity notes', icon: 'calendar' },
    { key: 'bm-permissions', label: 'Permissions / Credits', desc: 'Licensed text, images, lyrics, or art credits', icon: 'receipt' },
    { key: 'bm-colophon', label: 'Colophon', desc: 'Typeface and production notes', icon: 'printer' },
  ];

  metadataSlots = [
    { key: 'meta-master', label: 'Master Metadata Sheet', desc: 'Canonical title, subtitle, author, identifiers, pricing, and territories', icon: 'clipboard' },
    { key: 'meta-keywords', label: 'Keywords & Categories', desc: 'BISAC, retailer categories, search keywords', icon: 'search' },
    { key: 'meta-retailer-copy', label: 'Retailer Description Copy', desc: 'Short and long descriptions by storefront', icon: 'cart' },
    { key: 'meta-backmatter-rules', label: 'Back-Matter Rules', desc: 'Platform-specific links, CTAs, previews, and compliance notes', icon: 'list' },
    { key: 'meta-isbn', label: 'ISBN / Identifier Records', desc: 'ISBN, ASIN, Apple ID, Kobo ID, Google Play ID, direct sales SKU', icon: 'number' },
    { key: 'meta-rights', label: 'Rights & Territory Notes', desc: 'Rights ownership, territories, distributor restrictions', icon: 'scale' },
  ];

  // ── Ebook per-platform slots ──
  ebookPlatformSlots = [
    { platform: 'Amazon KDP', spec: 'EPUB 3 / MOBI', slots: [
      { key: 'eb-kdp-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-kdp-cover', label: 'Cover (2560×1600)', icon: '🖼' },
      { key: 'eb-kdp-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-kdp-backmatter', label: 'KDP Back Matter', icon: '📚' },
    ]},
    { platform: 'Apple Books', spec: 'EPUB 3 required', slots: [
      { key: 'eb-apple-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-apple-cover', label: 'Cover (1400×1873 min)', icon: '🖼' },
      { key: 'eb-apple-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-apple-backmatter', label: 'Apple Back Matter', icon: '📚' },
    ]},
    { platform: 'Kobo', spec: 'EPUB 2 or 3', slots: [
      { key: 'eb-kobo-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-kobo-cover', label: 'Cover (1400×2100)', icon: '🖼' },
      { key: 'eb-kobo-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-kobo-backmatter', label: 'Kobo Back Matter', icon: '📚' },
    ]},
    { platform: 'Barnes & Noble', spec: 'EPUB', slots: [
      { key: 'eb-bn-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-bn-cover', label: 'Cover (1400×2100)', icon: '🖼' },
      { key: 'eb-bn-metadata', label: 'Metadata File', icon: '📋' },
    ]},
    { platform: 'Draft2Digital', spec: 'EPUB / DOCX', slots: [
      { key: 'eb-d2d-epub', label: 'EPUB or DOCX', icon: '📱' },
      { key: 'eb-d2d-cover', label: 'Cover (1600×2400)', icon: '🖼' },
      { key: 'eb-d2d-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-d2d-storelinks', label: 'Universal Link Back Matter', icon: '🔗' },
    ]},
    { platform: 'Direct / Shopify', spec: 'EPUB + PDF', slots: [
      { key: 'eb-direct-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-direct-pdf', label: 'PDF File', icon: '📄' },
      { key: 'eb-direct-cover', label: 'Cover Image', icon: '🖼' },
      { key: 'eb-direct-bonus', label: 'Direct-Sale Bonus File', icon: '🎁' },
    ]},
    { platform: 'Google Play Books', spec: 'EPUB + PDF accepted', slots: [
      { key: 'eb-google-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-google-pdf', label: 'PDF File', icon: '📄' },
      { key: 'eb-google-cover', label: 'Cover (1600×2400)', icon: '🖼' },
      { key: 'eb-google-metadata', label: 'Metadata File', icon: '📋' },
    ]},
    { platform: 'IngramSpark Ebook', spec: 'EPUB + ONIX', slots: [
      { key: 'eb-ingram-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-ingram-cover', label: 'Cover Image', icon: '🖼' },
      { key: 'eb-ingram-onix', label: 'ONIX / Metadata', icon: '📋' },
    ]},
    { platform: 'BookFunnel', spec: 'Reader delivery', slots: [
      { key: 'eb-bookfunnel-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-bookfunnel-mobi', label: 'Legacy MOBI', icon: '📱' },
      { key: 'eb-bookfunnel-cover', label: 'Cover Image', icon: '🖼' },
    ]},
  ];

  // ── Paperback trim size slots ──
  paperbackTrimSlots = [
    { size: '4 × 6"', note: 'Pocket / small format', slots: [
      { key: 'pb-4x6-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-4x6-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '4.25 × 7"', note: 'Pocket paperback', slots: [
      { key: 'pb-425x7-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-425x7-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.06 × 7.81"', note: 'B-format paperback', slots: [
      { key: 'pb-bformat-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-bformat-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.25 × 8"', note: 'Digest / novella', slots: [
      { key: 'pb-525x8-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-525x8-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5 × 8"', note: 'Smaller trade paperback', slots: [
      { key: 'pb-5x8-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-5x8-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.5 × 8.5"', note: 'Most common trade paperback', slots: [
      { key: 'pb-55x85-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-55x85-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'pb-55x85-spine', label: 'Spine Text File', icon: '📏' },
    ]},
    { size: '6 × 9"', note: 'Standard trade paperback', slots: [
      { key: 'pb-6x9-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-6x9-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'pb-6x9-spine', label: 'Spine Text File', icon: '📏' },
    ]},
    { size: '6.14 × 9.21"', note: 'Royal paperback', slots: [
      { key: 'pb-royal-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-royal-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '4.25 × 6.87"', note: 'Mass market paperback', slots: [
      { key: 'pb-mm-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-mm-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '7 × 10"', note: 'Workbook / nonfiction', slots: [
      { key: 'pb-7x10-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-7x10-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '7.44 × 9.69"', note: 'Crown quarto', slots: [
      { key: 'pb-crownq-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-crownq-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '8 × 10"', note: 'Illustrated / children', slots: [
      { key: 'pb-8x10-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-8x10-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '8.5 × 11"', note: 'Workbook / large format', slots: [
      { key: 'pb-85x11-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-85x11-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: 'Hardcover 6 × 9"', note: 'Case laminate hardcover', slots: [
      { key: 'hc-6x9-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'hc-6x9-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'hc-6x9-dust', label: 'Dust Jacket (optional)', icon: '🎨' },
    ]},
    { size: 'Large Print 6 × 9"', note: '16pt font minimum', slots: [
      { key: 'lp-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'lp-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
  ];

  // ── Cover art per platform ──
  coverArtSlots = [
    { platform: 'Source Files', spec: 'Master files', slots: [
      { key: 'cv-psd', label: 'PSD Master', icon: '🎨' },
      { key: 'cv-ai', label: 'Illustrator (AI)', icon: '🎨' },
      { key: 'cv-indd', label: 'InDesign (INDD)', icon: '🎨' },
      { key: 'cv-fonts', label: 'Font Licenses', icon: '🔤' },
      { key: 'cv-stock', label: 'Stock Licenses', icon: '🧾' },
    ]},
    { platform: 'Ebook Cover', spec: 'Front only', slots: [
      { key: 'cv-ebook-2560', label: '2560×1600 (KDP)', icon: '🖼' },
      { key: 'cv-ebook-1400', label: '1400×2100 (Wide)', icon: '🖼' },
      { key: 'cv-ebook-1600', label: '1600×2400 (D2D/Google)', icon: '🖼' },
      { key: 'cv-ebook-3000', label: '3000×4500 (High Res)', icon: '🖼' },
      { key: 'cv-ebook-3d', label: '3D Mockup', icon: '📦' },
    ]},
    { platform: 'Print Covers', spec: 'Full wrap', slots: [
      { key: 'cv-pb-5x8', label: 'PB 5×8 Wrap', icon: '🖼' },
      { key: 'cv-pb-55x85', label: 'PB 5.5×8.5 Wrap', icon: '🖼' },
      { key: 'cv-pb-6x9', label: 'PB 6×9 Wrap', icon: '🖼' },
      { key: 'cv-pb-7x10', label: 'PB 7×10 Wrap', icon: '🖼' },
      { key: 'cv-pb-85x11', label: 'PB 8.5×11 Wrap', icon: '🖼' },
      { key: 'cv-hc-wrap', label: 'HC Full Wrap', icon: '🖼' },
      { key: 'cv-hc-dust', label: 'Dust Jacket', icon: '🧥' },
    ]},
    { platform: 'Marketing', spec: 'Ad & social', slots: [
      { key: 'cv-fb-ad', label: 'Facebook Ad (1200×628)', icon: '📢' },
      { key: 'cv-ig-square', label: 'Instagram Square', icon: '📸' },
      { key: 'cv-ig-story', label: 'Instagram Story', icon: '📱' },
      { key: 'cv-tiktok', label: 'TikTok / Reels', icon: '🎬' },
      { key: 'cv-bookbub', label: 'BookBub (300×250)', icon: '📢' },
      { key: 'cv-newsletter', label: 'Newsletter Header', icon: '📧' },
      { key: 'cv-amazon-a-plus', label: 'Amazon A+ Graphics', icon: '🛒' },
    ]},
  ];

  // ── Audiobook slots ──
  audiobookSlots = [
    { key: 'audio-master', label: 'Production Master', desc: 'Full uncompressed master file', icon: 'mic' },
    { key: 'audio-acx', label: 'ACX / Audible File', desc: 'MP3 192kbps, per ACX specs', icon: 'headphones' },
    { key: 'audio-findaway', label: 'Findaway Voices', desc: 'For wide audio distribution', icon: 'headphones' },
    { key: 'audio-cover', label: 'Audiobook Cover', desc: '3000×3000px square JPG', icon: 'image' },
    { key: 'audio-retail-sample', label: 'Retail Sample', desc: '5-min sample for store preview', icon: 'play-icon' },
  ];

  corePlacementTargets: CorePlacementTarget[] = [
    ...this.toPlacementTargets('Front Matter', this.frontMatterSlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Body', this.bodySlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Back Matter', this.backMatterSlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Metadata', this.metadataSlots, 'ebook-master', 'docx'),
    ...this.ebookPlatformSlots.flatMap(platform =>
      this.toPlacementTargets(`Ebook · ${platform.platform}`, platform.slots, 'ebook-master', 'epub', this.platformValueForLabel(platform.platform))
    ),
    ...this.paperbackTrimSlots.flatMap(trim =>
      this.toPlacementTargets(`Paperback · ${trim.size}`, trim.slots, trim.size.startsWith('Hardcover') ? 'hardcover-interior' : 'paperback-interior', 'pdf', 'all')
    ),
    ...this.coverArtSlots.flatMap(cover =>
      this.toPlacementTargets(`Cover Art · ${cover.platform}`, cover.slots, 'cover-source', 'png', this.platformValueForLabel(cover.platform))
    ),
    ...this.toPlacementTargets('Audiobook', this.audiobookSlots, 'audiobook', 'audio', 'audio-retailers'),
  ];

  openUploadModal() {
    this.resetUploadForm();
    this.uploadSlotKey = '';
    this.uploadSlotLabel = '';
    this.uploadPlacementPath = `${this.book()?.title || 'Book'} / ${this.getLanguageLabel(this.filesLangFilter)} / Manual Upload`;
    this.uploadPlatformLabel = 'All Platforms';
    this.showUploadModal = true;
  }

  openUploadForSlot(slot: { key: string; label: string; icon?: string; desc?: string }) {
    this.resetUploadForm();
    const target = this.corePlacementTargets.find(item => item.key === slot.key) || {
      key: slot.key,
      label: slot.label,
      section: 'Core Files',
      category: 'ebook-master' as BookFile['category'],
      defaultFormat: this.uploadFormat,
      defaultPlatform: this.corePlatformFilter,
    };
    this.applyUploadPlacement(target, target.defaultFormat, target.defaultPlatform);
    this.showUploadModal = true;
  }

  onDropToSlot(event: DragEvent, slot: { key: string; label: string }) {
    event.preventDefault();
    this.resetUploadForm();
    const target = this.corePlacementTargets.find(item => item.key === slot.key) || {
      key: slot.key,
      label: slot.label,
      section: 'Core Files',
      category: 'ebook-master' as BookFile['category'],
      defaultFormat: this.uploadFormat,
      defaultPlatform: this.corePlatformFilter,
    };
    this.applyUploadPlacement(target, target.defaultFormat, target.defaultPlatform);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.applySelectedUploadFile(file);
    this.showUploadModal = true;
  }

  openUploadFromCoreFlow() {
    const target = this.corePlacementTargets.find(item => item.key === this.coreTargetKey);
    if (!target) return;

    this.resetUploadForm();
    this.applyUploadPlacement(target, this.coreFormatFilter, this.corePlatformFilter);
    this.showUploadModal = true;
  }

  getLanguageLabel(code: string): string {
    return this.languageOptions.find(language => language.code === code)?.label || code.toUpperCase();
  }

  private getFormatLabel(format: BookFile['format']): string {
    return this.formatOptions.find(item => item.value === format)?.label || format.toUpperCase();
  }

  private getPlatformLabelByValue(value: string): string {
    return this.platformOptions.find(platform => platform.value === value)?.label || value;
  }

  private platformValueForLabel(label: string): string {
    const normalized = label.toLowerCase();
    if (normalized.includes('amazon') || normalized.includes('kdp')) return 'amazon-kdp';
    if (normalized.includes('apple')) return 'apple-books';
    if (normalized.includes('kobo')) return 'kobo';
    if (normalized.includes('barnes')) return 'barnes-noble';
    if (normalized.includes('google')) return 'google-play';
    if (normalized.includes('draft2digital')) return 'draft2digital';
    if (normalized.includes('ingram')) return 'ingramspark';
    if (normalized.includes('bookfunnel')) return 'bookfunnel';
    if (normalized.includes('direct') || normalized.includes('shopify')) return 'direct';
    if (normalized.includes('marketing')) return 'all';
    return 'all';
  }

  private toPlacementTargets(
    section: string,
    slots: { key: string; label: string }[],
    category: BookFile['category'],
    defaultFormat: BookFile['format'] = 'epub',
    defaultPlatform = 'all'
  ): CorePlacementTarget[] {
    return slots.map(slot => ({
      key: slot.key,
      label: slot.label,
      section,
      category,
      defaultFormat,
      defaultPlatform,
    }));
  }

  private applyUploadPlacement(target: CorePlacementTarget, format = target.defaultFormat || 'epub', platform = target.defaultPlatform || 'all') {
    const platformLabel = this.getPlatformLabelByValue(platform);
    this.uploadSlotKey = `${this.filesLangFilter}-${target.key}-${platform}-${format}`;
    this.uploadSlotLabel = target.label;
    this.uploadFormat = format;
    this.uploadCategory = target.category;
    this.uploadPlatformLabel = platformLabel;
    this.uploadPlacementPath = [
      this.book()?.title || 'Book',
      this.getLanguageLabel(this.filesLangFilter),
      target.section,
      target.label,
      this.getFormatLabel(format),
      platformLabel,
    ].join(' / ');
  }

  aiActions = [
    { label: 'Generate Amazon Blurb', description: 'Create an optimized blurb for Amazon KDP listing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>', mock: 'GENERATED AMAZON BLURB:\n\n★★★★★ "Absolutely riveting!" — Featured Amazon Editor\'s Pick\n\nIn this masterfully crafted story, readers will discover a world where every choice creates a new reality. With lyrical prose and unforgettable characters, this is a novel that will stay with you long after the last page.\n\n✦ A journey through infinite possibilities\n✦ Characters that feel like old friends\n✦ A thought-provoking exploration of regret and hope\n\nPerfect for fans of literary fiction that pushes boundaries.\n\n📖 Available in Kindle, Paperback, and Audiobook.\n\n"One of the best novels I\'ve read this year." — BookList\n"A triumph of imagination." — Publishers Weekly' },
    { label: 'Create Facebook Ads', description: 'Generate high-converting ad copy for Facebook campaigns', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>', mock: 'FACEBOOK AD COPY (3 Variations):\n\n--- Ad 1: Curiosity Hook ---\nWhat if you could live every life you never chose?\n\nDiscover the book that 50,000+ readers can\'t stop talking about.\n📚 Available on Amazon, Kobo, Apple Books & more.\n\nCTA: Get Your Copy →\n\n--- Ad 2: Social Proof ---\n★★★★★ 2,500+ 5-star reviews\n"This book changed how I think about my life." — Reader Review\n\nJoin the movement. Read the book everyone is recommending.\n\nCTA: Read Free Sample →\n\n--- Ad 3: Urgency ---\n🔥 LIMITED TIME: 40% off the #1 bestseller in Literary Fiction.\n\nDon\'t miss out on the novel that\'s redefining the genre.\n\nCTA: Grab the Deal →' },
    { label: 'Draft Newsletter', description: 'Create an engaging newsletter for your reader list', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', mock: 'NEWSLETTER DRAFT:\n\nSubject Line: A new chapter begins...\n\nDear [Reader],\n\nI have exciting news to share!\n\nMy latest book is now available, and I couldn\'t be more thrilled to finally put it in your hands. This one has been a labor of love — months of research, countless revisions, and many late nights.\n\nHere\'s what readers are saying:\n"Incredible storytelling..." ★★★★★\n"I couldn\'t put it down!" ★★★★★\n\nAs a valued subscriber, you get an exclusive 20% discount:\nUse code: READER20 at checkout.\n\n📖 Grab your copy: [LINK]\n\nThank you for being part of this journey.\n\nWarmly,\n[Author Name]' },
    { label: 'Pull Approved Assets', description: 'Compile all approved marketing materials into one document', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', mock: 'APPROVED ASSETS COMPILATION:\n\n═══════════════════════════════\n1. Amazon Launch Ad — Facebook\n   Status: ✅ Approved\n   Platform: Facebook\n   Campaign: Launch Q1 2024\n\n   Content:\n   📚 Discover the novel about all the lives you could have lived.\n   Available on Kindle & in print.\n   ⭐⭐⭐⭐⭐ "Life-changing read!"\n\n═══════════════════════════════\n2. Newsletter Announcement\n   Status: ✅ Approved\n   Platform: Email\n   Campaign: Launch Q1 2024\n\n═══════════════════════════════\n3. Instagram Carousel Headlines\n   Status: ✅ Approved\n   Platform: Instagram\n   Campaign: Social Launch\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal Approved: 3 assets\nTotal Draft: 2 assets\nCompiled: ' + new Date().toLocaleDateString() },
  ];

  customAiPrompt = '';

  configuredPlatforms = signal(0);
  approvedCount = signal(0);
  statusBreakdown = signal<{ label: string; count: number; percent: number; color: string }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound = true; return; }

    this.bookService.getBookById(id).subscribe(book => {
      if (!book) { this.notFound = true; return; }
      this.book.set(book);
      this.coreTitleFilter = book.id;
      this.computeStats(book);
    });
  }

  private computeStats(book: Book) {
    this.configuredPlatforms.set(book.platforms.filter(p => !p.inheritsBase || p.requirements.length > 0).length);
    const allItems = [...book.files, ...book.marketingAssets];
    const approved = allItems.filter(i => i.status === 'approved').length;
    const draft = allItems.filter(i => i.status === 'draft').length;
    const pending = allItems.filter(i => i.status === 'pending').length;
    const published = allItems.filter(i => i.status === 'published').length;
    const total = allItems.length || 1;
    this.approvedCount.set(approved);
    this.statusBreakdown.set([
      { label: 'Approved', count: approved, percent: (approved / total) * 100, color: '#10b981' },
      { label: 'Draft', count: draft, percent: (draft / total) * 100, color: '#f59e0b' },
      { label: 'Pending', count: pending, percent: (pending / total) * 100, color: '#3b82f6' },
      { label: 'Published', count: published, percent: (published / total) * 100, color: '#8b5cf6' },
    ]);
  }

  getFilesByCategory(category: string): BookFile[] {
    return this.book()?.files.filter(f => f.category === category) || [];
  }

  visibleFiles(): BookFile[] {
    return this.book()?.files.filter(file => file.language === this.filesLangFilter) || [];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  getPlatformLabel(p: string): string {
    const map: Record<string, string> = { amazon: 'Amazon', kobo: 'Kobo', apple: 'Apple Books', 'barnes-noble': 'Barnes & Noble' };
    return map[p] || p;
  }

  getCompletedReqs(p: PlatformVersion): number {
    return p.requirements.filter(r => r.completed).length;
  }

  togglePlatform(platform: string) {
    this.expandedPlatform = this.expandedPlatform === platform ? '' : platform;
  }

  assetTypeLabel(type: string): string {
    const map: Record<string, string> = { ad: 'Ad', headline: 'Headline', newsletter: 'Newsletter', 'social-post': 'Social Post', blog: 'Blog', 'promo-graphic': 'Promo' };
    return map[type] || type;
  }

  addKeyword(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && this.book()) {
      this.book()!.metadata.keywords.push(value);
      input.value = '';
    }
  }

  removeKeyword(index: number) {
    this.book()!.metadata.keywords.splice(index, 1);
  }

  saveBook() {
    if (!this.book()) return;
    this.bookService.updateBook(this.book()!).subscribe(() => {
      this.toast.show('Book saved successfully!', 'success');
    });
  }

  publishBook() {
    if (!this.book()) return;
    this.book()!.status = 'published';
    this.saveBook();
  }

  saveDraft() { this.toast.show('Draft saved!', 'success'); }
  publishMetadata() { this.toast.show('Metadata published!', 'success'); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.openUploadModal();
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.applySelectedUploadFile(file);
    input.value = '';
  }

  private applySelectedUploadFile(file: File) {
    this.selectedUploadFile = file;
    this.uploadFileName = file.name;
    this.uploadFormat = this.inferUploadFormat(file);
  }

  private inferUploadFormat(file: File): BookFile['format'] {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats: BookFile['format'][] = ['epub', 'pdf', 'docx', 'psd', 'ai', 'png', 'jpg'];
    const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'];

    if (extension === 'jpeg') return 'jpg';
    if (extension && supportedFormats.includes(extension as BookFile['format'])) return extension as BookFile['format'];
    if ((extension && audioExtensions.includes(extension)) || file.type.startsWith('audio/')) return 'audio';

    return this.uploadFormat;
  }

  private resetUploadForm() {
    this.uploadFileName = '';
    this.uploadFormat = 'epub';
    this.uploadCategory = 'ebook-master';
    this.selectedUploadFile = null;
    this.uploadPlacementPath = '';
    this.uploadPlatformLabel = 'All Platforms';
  }

  uploadFile() {
    if (!this.book() || !this.uploadFileName.trim()) return;
    this.bookService.uploadFile(this.book()!.id, {
      name: this.uploadFileName,
      type: this.selectedUploadFile?.type || 'application/octet-stream',
      format: this.uploadFormat,
      category: this.uploadCategory,
      size: this.selectedUploadFile?.size ?? Math.floor(Math.random() * 10000000),
      language: this.filesLangFilter,
      tags: [
        this.uploadSlotLabel ? `Slot: ${this.uploadSlotLabel}` : 'Manual upload',
        `Language: ${this.getLanguageLabel(this.filesLangFilter)}`,
        `Platform: ${this.uploadPlatformLabel}`,
        `Path: ${this.uploadPlacementPath || 'Manual upload'}`
      ]
    }).subscribe(() => {
      this.showUploadModal = false;
      this.resetUploadForm();
      this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
      this.toast.show('File uploaded!', 'success');
    });
  }

  addAsset() {
    if (!this.book() || !this.newAssetTitle.trim()) return;
    this.bookService.addMarketingAsset(this.book()!.id, {
      title: this.newAssetTitle, type: this.newAssetType as any, platform: this.newAssetPlatform, content: this.newAssetContent
    }).subscribe(() => {
      this.showAssetModal = false;
      this.newAssetTitle = ''; this.newAssetContent = ''; this.newAssetPlatform = '';
      this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
      this.toast.show('Marketing asset added!', 'success');
    });
  }

  runAiAction(action: { label: string; mock: string }) {
    this.aiLoading.set(true);
    this.aiResult.set('');
    setTimeout(() => {
      this.aiResult.set(action.mock);
      this.aiLoading.set(false);
    }, 1500 + Math.random() * 1000);
  }

  runCustomAiAction() {
    if (!this.customAiPrompt.trim()) return;
    const prompt = this.customAiPrompt.trim();
    this.aiLoading.set(true);
    this.aiResult.set('');
    this.customAiPrompt = '';
    setTimeout(() => {
      this.aiResult.set(`CUSTOM AI RESPONSE FOR PROMPT: "${prompt}"\n\nHere is a draft response tailored to your request:\n\n1. Overview:\n   We analyzed your prompt regarding "${this.book()?.title}" and generated a fresh copy structure.\n\n2. Suggested Copy:\n   "In this brilliant work, "${this.book()?.title}" by ${this.book()?.author}, the narrative pushes the boundaries of imagination to deliver a truly captivating reading experience."\n\n3. Key Hooks:\n   - Modern storytelling with high-stakes tension\n   - Exceptional depth and pacing\n\nFeel free to adjust this generated content or copy it to your clipboard.`);
      this.aiLoading.set(false);
    }, 1500 + Math.random() * 1000);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show('Copied to clipboard!', 'success');
    });
  }
}
