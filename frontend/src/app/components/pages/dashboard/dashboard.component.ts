import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { BookService } from '../../../services/book.service';
import { AuthService } from '../../../services/auth.service';

export interface ImportantDate {
  id: string;
  title: string;
  category: 'Tax' | 'Domain' | 'ISBN' | 'Software' | 'Trademark' | 'Contract' | 'Filing';
  dueDate: string;
  notes: string;
  recurring: boolean;
}

const DEFAULT_DATES: ImportantDate[] = [
  { id: '1', title: 'Q2 Estimated Tax Payment', category: 'Tax', dueDate: '2026-06-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true },
  { id: '2', title: 'authorvaultpress.com Domain Renewal', category: 'Domain', dueDate: '2026-05-28', notes: 'Registrar: Namecheap — auto-renew enabled', recurring: true },
  { id: '3', title: 'Delaware Annual Report Filing', category: 'Filing', dueDate: '2026-06-01', notes: 'File via Delaware Division of Corporations', recurring: true },
  { id: '4', title: 'AuthorVault Press™ Trademark Renewal', category: 'Trademark', dueDate: '2026-07-15', notes: 'USPTO Section 8 & 15 Declaration due', recurring: false },
  { id: '5', title: 'ISBN Block Purchase (next 100)', category: 'ISBN', dueDate: '2026-08-01', notes: 'Current block running low', recurring: false },
  { id: '7', title: 'Editor Contract Renewal', category: 'Contract', dueDate: '2026-06-30', notes: 'Review rates and terms before renewal', recurring: false },
  { id: '8', title: 'Q3 Estimated Tax Payment', category: 'Tax', dueDate: '2026-09-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true }
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <!-- ── WELCOME BANNER ── -->
      <div class="welcome-banner glass-card">
        <div class="welcome-content">
          <h1 class="welcome-title">Welcome back, {{ auth.displayName() }}!</h1>
          <p class="welcome-subtitle">Here is a live overview of your publishing vault. Keep track of your imprints, pen names, pipeline progress, and upcoming deadlines.</p>
        </div>
        <div class="welcome-date">
          <span class="date-day">{{ currentDay }}</span>
          <span class="date-month">{{ currentMonth }}</span>
        </div>
      </div>

      <!-- ── TIER STATS ROW ── -->
      <div class="stats-row-redesigned">
        <div class="stat-card-glow blue" routerLink="/vault/series">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m12 2 10 6.5-10 6.5L2 8.5Z"/>
              <path d="m2 15.5 10 6.5 10-6.5"/>
              <path d="m2 12 10 6.5L22 12"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ vs.totalSeries() }}</span>
            <span class="stat-label">Series</span>
          </div>
        </div>

        <div class="stat-card-glow indigo" routerLink="/books">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ vs.totalBooks() }}</span>
            <span class="stat-label">Total Books</span>
          </div>
        </div>

        <div class="stat-card-glow green" routerLink="/books">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ publishedCount() }}</span>
            <span class="stat-label">Published</span>
          </div>
        </div>

        <div class="stat-card-glow amber" routerLink="/books">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ draftCount() }}</span>
            <span class="stat-label">In Draft</span>
          </div>
        </div>

        <div class="stat-card-glow purple" routerLink="/vault/pen-names">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ vs.totalPenNames() }}</span>
            <span class="stat-label">Pen Names</span>
          </div>
        </div>

        <div class="stat-card-glow teal" routerLink="/vault/imprints">
          <div class="stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ vs.totalImprints() }}</span>
            <span class="stat-label">Imprints</span>
          </div>
        </div>
      </div>

      <!-- ── DUAL COLUMN DASHBOARD GRID ── -->
      <div class="dashboard-grid">
        <!-- LEFT MAIN COLUMN -->
        <div class="main-column">
          <!-- 1. PUBLISHING PIPELINE DISTRIBUTION -->
          <div class="visual-card glass-card">
            <div class="card-header-visual">
              <div>
                <h2 class="visual-title">Publishing Pipeline Distribution</h2>
                <p class="visual-subtitle">Current production breakdown across all format titles</p>
              </div>
              <span class="total-books-badge">{{ vs.totalBooks() }} Books</span>
            </div>

            <!-- Pipeline Bar -->
            <div class="pipeline-bar-wrapper">
              <div class="pipeline-bar">
                <div class="pipeline-segment draft" [style.width.%]="stats.draftPct" [class.highlighted]="activeHoverSegment === 'draft'" (mouseenter)="activeHoverSegment = 'draft'" (mouseleave)="activeHoverSegment = null" title="Draft"></div>
                <div class="pipeline-segment editing" [style.width.%]="stats.editingPct" [class.highlighted]="activeHoverSegment === 'editing'" (mouseenter)="activeHoverSegment = 'editing'" (mouseleave)="activeHoverSegment = null" title="Editing"></div>
                <div class="pipeline-segment preorder" [style.width.%]="stats.preorderPct" [class.highlighted]="activeHoverSegment === 'preorder'" (mouseenter)="activeHoverSegment = 'preorder'" (mouseleave)="activeHoverSegment = null" title="Pre-Order"></div>
                <div class="pipeline-segment published" [style.width.%]="stats.publishedPct" [class.highlighted]="activeHoverSegment === 'published'" (mouseenter)="activeHoverSegment = 'published'" (mouseleave)="activeHoverSegment = null" title="Published"></div>
              </div>
            </div>

            <!-- Pipeline Legend -->
            <div class="pipeline-legend">
              <div class="legend-item" [class.dimmed]="activeHoverSegment && activeHoverSegment !== 'draft'" (mouseenter)="activeHoverSegment = 'draft'" (mouseleave)="activeHoverSegment = null">
                <span class="legend-dot draft"></span>
                <div class="legend-details">
                  <span class="legend-name">Draft</span>
                  <span class="legend-values"><strong>{{ stats.draft }}</strong> ({{ stats.draftPct | number:'1.0-1' }}%)</span>
                </div>
              </div>
              <div class="legend-item" [class.dimmed]="activeHoverSegment && activeHoverSegment !== 'editing'" (mouseenter)="activeHoverSegment = 'editing'" (mouseleave)="activeHoverSegment = null">
                <span class="legend-dot editing"></span>
                <div class="legend-details">
                  <span class="legend-name">Editing</span>
                  <span class="legend-values"><strong>{{ stats.editing }}</strong> ({{ stats.editingPct | number:'1.0-1' }}%)</span>
                </div>
              </div>
              <div class="legend-item" [class.dimmed]="activeHoverSegment && activeHoverSegment !== 'preorder'" (mouseenter)="activeHoverSegment = 'preorder'" (mouseleave)="activeHoverSegment = null">
                <span class="legend-dot preorder"></span>
                <div class="legend-details">
                  <span class="legend-name">Pre-Order</span>
                  <span class="legend-values"><strong>{{ stats.preorder }}</strong> ({{ stats.preorderPct | number:'1.0-1' }}%)</span>
                </div>
              </div>
              <div class="legend-item" [class.dimmed]="activeHoverSegment && activeHoverSegment !== 'published'" (mouseenter)="activeHoverSegment = 'published'" (mouseleave)="activeHoverSegment = null">
                <span class="legend-dot published"></span>
                <div class="legend-details">
                  <span class="legend-name">Published</span>
                  <span class="legend-values"><strong>{{ stats.published }}</strong> ({{ stats.publishedPct | number:'1.0-1' }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. AUTHOR VAULT HIERARCHY TREE -->
          <div class="visual-card glass-card">
            <h2 class="visual-title" style="margin-bottom:0.25rem;">Author Vault Hierarchy</h2>
            <p class="visual-subtitle" style="margin-bottom:1.75rem;">Explore the structural relationship map of your assets</p>

            <div class="hierarchy-tree">
              <!-- LEVEL 1: COMPANY -->
              <div class="tree-section level-company">
                <div class="node-badge">Company</div>
                <div class="company-node-card">
                  <label class="entity-avatar-upload company-avatar-lg" title="Upload company avatar (Click to change)">
                    @if (vs.company().identity.avatarUrl) {
                      <img [src]="vs.company().identity.avatarUrl" alt="" class="entity-avatar-img" />
                    } @else {
                      <span class="entity-avatar-fallback">{{ companyInitials }}</span>
                    }
                    <input type="file" accept="image/*" hidden (change)="onCompanyAvatar($event)" />
                  </label>
                  <div class="company-node-info">
                    <h3 class="node-name" routerLink="/vault/company">{{ vs.company().identity.legalName }}</h3>
                    <span class="node-meta-tag">{{ vs.company().identity.entityType }}</span>
                  </div>
                </div>
              </div>

              <!-- CONNECTORS -->
              <div class="tree-connector"><div class="connector-line-tall"></div></div>

              <!-- LEVEL 2: IMPRINTS -->
              <div class="tree-section level-imprints">
                <div class="node-badge">Imprints</div>
                <div class="imprints-node-grid">
                  @for (imp of vs.company().imprints; track imp.id) {
                    <div class="imprint-node-card">
                      <label class="entity-avatar-upload" title="Upload imprint avatar (Click to change)">
                        @if (imp.identity.avatarUrl) {
                          <img [src]="imp.identity.avatarUrl" alt="" class="entity-avatar-img" />
                        } @else {
                          <span class="entity-avatar-fallback">{{ initials(imp.identity.name) }}</span>
                        }
                        <input type="file" accept="image/*" hidden (change)="onImprintAvatar($event, imp.id)" />
                      </label>
                      <div class="node-details">
                        <h4 class="node-subname" routerLink="/vault/imprints">{{ imp.identity.name }}</h4>
                        <span class="node-stat-pill">{{ imp.penNames.length }} Pen Names</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- CONNECTORS -->
              <div class="tree-connector"><div class="connector-line-tall"></div></div>

              <!-- LEVEL 3: PEN NAMES -->
              <div class="tree-section level-pennames">
                <div class="node-badge">Pen Names</div>
                <div class="pennames-node-grid">
                  <ng-container *ngFor="let imp of vs.company().imprints">
                    <div class="penname-node-card" *ngFor="let pn of imp.penNames">
                      <label class="entity-avatar-upload" title="Upload pen name avatar (Click to change)">
                        @if (pn.identity.avatarUrl) {
                          <img [src]="pn.identity.avatarUrl" alt="" class="entity-avatar-img" />
                        } @else {
                          <span class="entity-avatar-fallback" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)">{{ initials(pn.identity.displayName) }}</span>
                        }
                        <input type="file" accept="image/*" hidden (change)="onPenNameAvatar($event, pn.id)" />
                      </label>
                      <div class="node-details">
                        <h4 class="node-subname" routerLink="/vault/pen-names">{{ pn.identity.displayName }}</h4>
                        <span class="node-stat-pill">{{ pn.series.length }} Series · {{ countBooks(pn) }} Books</span>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT SIDEBAR COLUMN -->
        <div class="sidebar-column">
          <!-- 1. UPCOMING DEADLINES WIDGET -->
          <div class="visual-card glass-card">
            <div class="card-header-visual">
              <div>
                <h2 class="visual-title">Upcoming Deadlines</h2>
                <p class="visual-subtitle">Renewals & tax deadlines</p>
              </div>
              <button class="icon-link-btn" routerLink="/company/calendar" title="View Calendar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>

            <div class="deadline-feed">
              @for (date of upcomingDates(); track date.id) {
                <div class="deadline-row-card" [class]="'urgency-' + date.urgency">
                  <div class="deadline-badge">
                    <span class="dl-day">{{ getDayNumber(date.dueDate) }}</span>
                    <span class="dl-month">{{ getMonthAbbr(date.dueDate) }}</span>
                  </div>
                  <div class="deadline-info-panel">
                    <h4 class="deadline-row-title">{{ date.title }}</h4>
                    <div class="deadline-row-meta">
                      <span class="dl-cat-tag" [class]="'cat-' + date.category.toLowerCase()">{{ date.category }}</span>
                      <span class="dl-countdown" [class]="'urgency-text-' + date.urgency">{{ getCountdownLabel(date.daysAway) }}</span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-widget-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36" style="opacity:0.4;margin-bottom:0.5rem;">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p>No upcoming dates scheduled</p>
                  <button class="btn-widget-action" routerLink="/company/calendar">+ Add Date</button>
                </div>
              }
            </div>
          </div>

          <!-- 2. ISBN USAGE STATUS WIDGET -->
          <div class="visual-card glass-card">
            <div class="card-header-visual">
              <div>
                <h2 class="visual-title">ISBN Block Usage</h2>
                <p class="visual-subtitle">Assigned barcodes per imprint</p>
              </div>
              <button class="icon-link-btn" routerLink="/company/isbns" title="ISBN Master List">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <path d="M4 19.5V15h16v4.5M4 10V5h16v5M12 2v20"/>
                </svg>
              </button>
            </div>

            <div class="isbn-widget-list">
              @for (imp of vs.company().imprints; track imp.id) {
                <div class="isbn-widget-row">
                  <div class="isbn-widget-info">
                    <span class="isbn-imprint-name">{{ imp.identity.name }}</span>
                    <span class="isbn-imprint-numbers">{{ imp.legalIsbn.isbnsAssigned }} / {{ imp.legalIsbn.isbnBlockCount || 100 }} codes assigned</span>
                    <span class="isbn-imprint-left">{{ imp.legalIsbn.isbnsRemaining }} remaining</span>
                  </div>
                  <div class="isbn-ring-container">
                    <svg class="isbn-ring" width="44" height="44" viewBox="0 0 36 36">
                      <!-- background path -->
                      <path class="isbn-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3" />
                      <!-- fill path -->
                      <path class="isbn-ring-fg" [attr.stroke-dasharray]="getDashArray(imp.legalIsbn)" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#isbnGrad)" stroke-width="3.5" stroke-linecap="round" />
                      <defs>
                        <linearGradient id="isbnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#3b82f6" />
                          <stop offset="100%" stop-color="#8b5cf6" />
                        </linearGradient>
                      </defs>
                      <text x="18" y="21.5" class="isbn-ring-text" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--text-primary)">
                        {{ getPercentage(imp.legalIsbn) }}%
                      </text>
                    </svg>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Nav Hint -->
      <div class="nav-hint-redesigned glass-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>Use the sidebar to navigate to <strong>Company</strong> or <strong>Library</strong> sections to update records.</span>
      </div>
    </div>
  `,
  styles: [`
    .page {
      width: 100%;
      animation: fadeInUp .5s cubic-bezier(0.4, 0, 0.2, 1) both;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Glassmorphism Core ── */
    .glass-card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 18px;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      padding: 1.5rem;
    }
    .glass-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--border-color);
    }

    /* ── Welcome Banner ── */
    .welcome-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(96, 165, 250, 0.08) 0%, rgba(129, 140, 248, 0.08) 50%, rgba(167, 139, 250, 0.04) 100%);
      border: 1px solid rgba(96, 165, 250, 0.15);
      gap: 1.5rem;
    }
    .welcome-title {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 0.35rem;
      letter-spacing: -0.01em;
    }
    .welcome-subtitle {
      font-size: 0.9375rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
      max-width: 720px;
    }
    .welcome-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .date-day {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--accent-blue, #3b82f6);
      line-height: 1;
    }
    .date-month {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.1em;
      margin-top: 0.2rem;
    }

    /* ── Metric Cards Glow ── */
    .stats-row-redesigned {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem;
      width: 100%;
    }
    .stat-card-glow {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.625rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
    }
    .stat-card-glow::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 16px;
      padding: 1px;
      background: linear-gradient(135deg, transparent, transparent);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .stat-card-glow:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.3);
    }
    .stat-card-glow:hover::before {
      opacity: 1;
    }
    
    .stat-card-glow.blue:hover { border-color: rgba(59, 130, 246, 0.4); }
    .stat-card-glow.blue:hover::before { background: linear-gradient(135deg, #3b82f6, transparent); }
    .stat-card-glow.indigo:hover { border-color: rgba(99, 102, 241, 0.4); }
    .stat-card-glow.indigo:hover::before { background: linear-gradient(135deg, #6366f1, transparent); }
    .stat-card-glow.green:hover { border-color: rgba(16, 185, 129, 0.4); }
    .stat-card-glow.green:hover::before { background: linear-gradient(135deg, #10b981, transparent); }
    .stat-card-glow.amber:hover { border-color: rgba(245, 158, 11, 0.4); }
    .stat-card-glow.amber:hover::before { background: linear-gradient(135deg, #f59e0b, transparent); }
    .stat-card-glow.purple:hover { border-color: rgba(139, 92, 246, 0.4); }
    .stat-card-glow.purple:hover::before { background: linear-gradient(135deg, #8b5cf6, transparent); }
    .stat-card-glow.teal:hover { border-color: rgba(20, 184, 166, 0.4); }
    .stat-card-glow.teal:hover::before { background: linear-gradient(135deg, #14b8a6, transparent); }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    }
    .stat-card-glow:hover .stat-icon {
      transform: scale(1.1);
    }
    .stat-icon svg {
      width: 20px;
      height: 20px;
    }
    
    .blue .stat-icon   { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .indigo .stat-icon { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
    .green .stat-icon  { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .amber .stat-icon  { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .purple .stat-icon { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
    .teal .stat-icon   { background: rgba(20, 184, 166, 0.1); color: #14b8a6; }

    .stat-body {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.1;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* ── Dashboard Grid ── */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.7fr 1fr;
      gap: 1.5rem;
    }
    .main-column, .sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Visual Cards inside Grid ── */
    .visual-card {
      margin-bottom: 0;
    }
    .card-header-visual {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }
    .visual-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.01em;
    }
    .visual-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0.15rem 0 0;
    }
    .total-books-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 8px;
      background: rgba(59, 130, 246, 0.1);
      color: var(--accent-blue, #3b82f6);
    }
    .icon-link-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: inline-flex;
      transition: all 0.2s;
    }
    .icon-link-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    /* ── Publishing Pipeline Visuals ── */
    .pipeline-bar-wrapper {
      padding: 0.5rem 0;
    }
    .pipeline-bar {
      display: flex;
      height: 22px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }
    .pipeline-segment {
      height: 100%;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
    }
    .pipeline-segment.highlighted {
      filter: brightness(1.2) saturate(1.1);
      transform: scaleY(1.05);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
      z-index: 2;
    }
    .pipeline-segment.draft { background: linear-gradient(90deg, #f59e0b, #d97706); }
    .pipeline-segment.editing { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
    .pipeline-segment.preorder { background: linear-gradient(90deg, #06b6d4, #0891b2); }
    .pipeline-segment.published { background: linear-gradient(90deg, #10b981, #059669); }

    .pipeline-legend {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    .legend-item:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--border-light);
    }
    .legend-item.dimmed {
      opacity: 0.4;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-dot.draft { background: #f59e0b; box-shadow: 0 0 8px rgba(245, 158, 11, 0.5); }
    .legend-dot.editing { background: #8b5cf6; box-shadow: 0 0 8px rgba(139, 92, 246, 0.5); }
    .legend-dot.preorder { background: #06b6d4; box-shadow: 0 0 8px rgba(6, 182, 212, 0.5); }
    .legend-dot.published { background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.5); }
    
    .legend-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .legend-name {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 500;
      line-height: 1.2;
    }
    .legend-values {
      font-size: 0.8125rem;
      color: var(--text-primary);
      margin-top: 0.1rem;
    }

    /* ── Hierarchy Tree visual ── */
    .hierarchy-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .tree-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .node-badge {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.04);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border-light);
    }
    .tree-connector {
      display: flex;
      justify-content: center;
      width: 100%;
    }
    .connector-line-tall {
      width: 2px;
      height: 32px;
      background: linear-gradient(180deg, var(--border-color) 0%, rgba(255,255,255,0.02) 100%);
      border-radius: 2px;
    }
    
    /* Company Node */
    .company-node-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255,255,255,0.02);
      border: 1.5px solid var(--border-color);
      border-radius: 14px;
      padding: 0.875rem 1.25rem;
      box-shadow: var(--shadow-sm);
      max-width: 380px;
    }
    .company-avatar-lg .entity-avatar-img, .company-avatar-lg .entity-avatar-fallback {
      width: 48px; height: 48px; border-radius: 12px;
    }
    .node-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      cursor: pointer;
    }
    .node-name:hover {
      color: var(--accent-blue);
      text-decoration: underline;
    }
    .node-meta-tag {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted);
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-light);
      padding: 1px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 0.25rem;
    }

    /* Imprints & PenNames Node Grid */
    .imprints-node-grid, .pennames-node-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
      width: 100%;
    }
    .pennames-node-grid {
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    }
    .imprint-node-card, .penname-node-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-light);
      border-radius: 12px;
      padding: 0.75rem 0.875rem;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s;
    }
    .imprint-node-card:hover, .penname-node-card:hover {
      border-color: var(--accent-blue);
      background: rgba(255,255,255,0.03);
    }
    .node-subname {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      cursor: pointer;
    }
    .node-subname:hover {
      color: var(--accent-blue);
      text-decoration: underline;
    }
    .node-stat-pill {
      font-size: 0.6875rem;
      color: var(--text-muted);
      display: block;
      margin-top: 0.15rem;
    }

    /* Avatars */
    .entity-avatar-upload {
      cursor: pointer; display: inline-flex; flex-shrink: 0; position: relative;
    }
    .entity-avatar-upload::after {
      content: '📷';
      position: absolute;
      inset: 0;
      background: rgba(14, 116, 178, 0.45);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
      border-radius: 10px;
      font-size: 1rem;
    }
    .entity-avatar-upload:hover::after {
      opacity: 1;
    }
    .entity-avatar-upload::before {
      content: '✎';
      position: absolute;
      bottom: -3px;
      right: -3px;
      width: 14px;
      height: 14px;
      background: #3b82f6;
      color: white;
      border-radius: 50%;
      font-size: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--surface, #fff);
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      z-index: 2;
      transition: transform 0.2s;
    }
    .entity-avatar-upload:hover::before {
      transform: scale(1.1);
    }
    .company-avatar-lg::after {
      border-radius: 12px;
      font-size: 1.25rem;
    }
    .entity-avatar-img, .entity-avatar-fallback {
      width: 38px; height: 38px; border-radius: 10px; object-fit: cover;
      border: 1.5px solid #fff; box-shadow: var(--shadow-sm);
    }
    .entity-avatar-fallback {
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, var(--scribe-blue), var(--scribe-blue-dark));
      color: #fff; font-weight: 700; font-size: 0.75rem;
    }

    /* ── Sidebar Column Widgets ── */
    .deadline-feed {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .deadline-row-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-light);
      border-left: 3.5px solid var(--border-color);
      transition: all 0.2s;
    }
    .deadline-row-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--border-color);
    }
    
    .deadline-row-card.urgency-high { border-left-color: #ef4444; }
    .deadline-row-card.urgency-medium { border-left-color: #f59e0b; }
    .deadline-row-card.urgency-low { border-left-color: #10b981; }
    .deadline-row-card.urgency-overdue { border-left-color: #dc2626; background: rgba(220, 38, 38, 0.03); }

    .deadline-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-light);
      border-radius: 8px;
      width: 42px;
      height: 42px;
      flex-shrink: 0;
    }
    .dl-day {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
    }
    .dl-month {
      font-size: 0.5625rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.1rem;
    }

    .deadline-info-panel {
      flex: 1;
      min-width: 0;
    }
    .deadline-row-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .deadline-row-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .dl-cat-tag {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .dl-cat-tag.cat-tax { background: rgba(239,68,68,0.08); color: #ef4444; }
    .dl-cat-tag.cat-domain { background: rgba(59,130,246,0.08); color: #3b82f6; }
    .dl-cat-tag.cat-isbn { background: rgba(139,92,246,0.08); color: #8b5cf6; }
    .dl-cat-tag.cat-software { background: rgba(20,184,166,0.08); color: #14b8a6; }
    .dl-cat-tag.cat-trademark { background: rgba(245,158,11,0.08); color: #f59e0b; }
    .dl-cat-tag.cat-contract { background: rgba(99,102,241,0.08); color: #6366f1; }
    .dl-cat-tag.cat-filing { background: rgba(16,185,129,0.08); color: #10b981; }

    .dl-countdown {
      font-size: 0.75rem;
      font-weight: 500;
    }
    .urgency-text-high { color: #ef4444; font-weight: 600; }
    .urgency-text-medium { color: #f59e0b; }
    .urgency-text-low { color: #10b981; }
    .urgency-text-overdue { color: #dc2626; font-weight: 700; }

    .empty-widget-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 1.75rem 1rem;
      color: var(--text-muted);
      border: 1.5px dashed var(--border-light);
      border-radius: 12px;
      background: rgba(255,255,255,0.01);
    }
    .empty-widget-state p {
      font-size: 0.8125rem;
      margin: 0 0 0.75rem;
    }
    .btn-widget-action {
      background: var(--accent-blue, #3b82f6);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.4rem 0.85rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn-widget-action:hover {
      background: var(--scribe-blue-dark);
      transform: translateY(-1px);
    }

    /* ISBN Widget */
    .isbn-widget-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .isbn-widget-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border-light);
      transition: all 0.2s;
    }
    .isbn-widget-row:hover {
      background: rgba(255,255,255,0.04);
      border-color: var(--border-color);
    }
    .isbn-widget-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .isbn-imprint-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .isbn-imprint-numbers {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }
    .isbn-imprint-left {
      font-size: 0.6875rem;
      color: var(--text-secondary);
      margin-top: 0.1rem;
      font-weight: 500;
    }
    .isbn-ring-container {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .isbn-ring {
      transform: rotate(-90deg);
    }
    .isbn-ring-text {
      transform: rotate(90deg);
      transform-origin: center;
      font-family: inherit;
    }

    /* Redesigned Hint */
    .nav-hint-redesigned {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 1rem 1.25rem;
      background: rgba(59, 130, 246, 0.03);
      border: 1px solid rgba(59, 130, 246, 0.1);
      border-radius: 14px;
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    .nav-hint-redesigned svg {
      color: var(--accent-blue);
      flex-shrink: 0;
    }
    .nav-hint-redesigned strong {
      color: var(--text-primary);
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Responsive Grid Breakpoints ── */
    @media (max-width: 1200px) {
      .stats-row-redesigned { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 992px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .imprints-node-grid { grid-template-columns: repeat(2, 1fr); }
      .pennames-node-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .stats-row-redesigned { grid-template-columns: repeat(2, 1fr); }
      .imprints-node-grid { grid-template-columns: 1fr; }
      .pennames-node-grid { grid-template-columns: 1fr; }
      .welcome-banner { padding: 1.5rem; }
      .welcome-date { display: none; }
      .pipeline-legend { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly vs = inject(AuthorVaultService);
  private bookService = inject(BookService);
  readonly auth = inject(AuthService);

  publishedCount = signal(0);
  draftCount = signal(0);
  editingCount = signal(0);
  preorderCount = signal(0);
  upcomingDates = signal<any[]>([]);

  activeHoverSegment: 'draft' | 'editing' | 'preorder' | 'published' | null = null;

  ngOnInit() {
    this.bookService.getBooks().subscribe(books => {
      this.publishedCount.set(books.filter(b => b.status === 'published').length);
      this.draftCount.set(books.filter(b => b.status === 'draft').length);
      this.editingCount.set(books.filter(b => b.status === 'pending').length);
      this.preorderCount.set(books.filter(b => b.status === 'approved').length);
    });
    this.loadUpcomingDates();
  }

  get currentDay(): string {
    return new Date().getDate().toString();
  }

  get currentMonth(): string {
    return new Date().toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  get stats() {
    const published = this.publishedCount();
    const draft = this.draftCount();
    const editing = this.editingCount();
    const preorder = this.preorderCount();
    const total = published + draft + editing + preorder || 1;
    return {
      published,
      draft,
      editing,
      preorder,
      total,
      publishedPct: (published / total) * 100,
      draftPct: (draft / total) * 100,
      editingPct: (editing / total) * 100,
      preorderPct: (preorder / total) * 100
    };
  }

  loadUpcomingDates() {
    let list: ImportantDate[] = [];
    try {
      const raw = localStorage.getItem('av_important_dates_v1');
      list = raw ? JSON.parse(raw) : [...DEFAULT_DATES];
    } catch {
      list = [...DEFAULT_DATES];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mapped = list
      .map(d => {
        const due = new Date(d.dueDate + 'T00:00:00');
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...d,
          daysAway: diffDays,
          urgency: diffDays < 0 ? 'overdue' : diffDays <= 30 ? 'high' : diffDays <= 90 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);

    this.upcomingDates.set(mapped);
  }

  getDayNumber(dateStr: string): string {
    try {
      return new Date(dateStr + 'T00:00:00').getDate().toString();
    } catch {
      return '';
    }
  }

  getMonthAbbr(dateStr: string): string {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleString('default', { month: 'short' }).toUpperCase();
    } catch {
      return '';
    }
  }

  getCountdownLabel(daysAway: number): string {
    if (daysAway === 0) return 'Today';
    if (daysAway < 0) return 'Overdue';
    if (daysAway === 1) return 'Tomorrow';
    return `${daysAway} days left`;
  }

  initials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  countBooks(pn: any): number {
    return pn.series?.reduce((a: number, s: any) => a + (s.books?.length || 0), 0) || 0;
  }

  get companyInitials(): string {
    return this.initials(this.vs.company()?.identity?.legalName || '');
  }

  getPercentage(legalIsbn: any): number {
    const total = legalIsbn?.isbnBlockCount || 100;
    const assigned = legalIsbn?.isbnsAssigned || 0;
    return Math.min(100, Math.max(0, Math.round((assigned / total) * 100)));
  }

  getDashArray(legalIsbn: any): string {
    const pct = this.getPercentage(legalIsbn);
    return `${pct}, 100`;
  }

  onCompanyAvatar(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setCompanyAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  onImprintAvatar(event: Event, imprintId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setImprintAvatar(imprintId, reader.result as string);
    reader.readAsDataURL(file);
  }

  onPenNameAvatar(event: Event, penNameId: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.vs.setPenNameAvatar(penNameId, reader.result as string);
    reader.readAsDataURL(file);
  }
}
