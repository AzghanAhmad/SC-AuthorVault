import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-pennames-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../company-vault/company-vault.component.css'],
  template: `
    <div class="page">

      <!-- ── PEN NAME LIST ── -->
      @if (!selected()) {
        <div class="page-header">
          <h1 class="page-title">✍️ Pen Names</h1>
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
                <div class="pn-big-avatar">{{ initials(pn.identity.displayName) }}</div>
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
            <div class="pn-big-avatar" style="width:64px;height:64px;font-size:22px;border-radius:16px">{{ initials(pn.identity.displayName) }}</div>
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
              <button class="tab-item" [class.active]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
            }
          </nav>

          <div class="vault-content">

            <!-- Identity -->
            @if (tab() === 'identity') {
              <div class="card">
                <h3 class="section-title">Pen Name Identity</h3>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Display Name</span><div class="form-value">{{ pn.identity.displayName }}</div></div>
                  <div class="form-group"><span class="form-label">Legal Name Linked</span><div class="form-value">{{ pn.identity.legalNameLinked }}</div></div>
                  <div class="form-group"><span class="form-label">Genre</span><div class="form-value">{{ pn.identity.genre }}</div></div>
                  <div class="form-group"><span class="form-label">Subgenre</span><div class="form-value">{{ pn.identity.subgenre || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Pen Name Type</span><div class="form-value">{{ pn.identity.penNameType }}</div></div>
                  <div class="form-group"><span class="form-label">Privacy Level</span><div class="form-value">{{ pn.identity.privacyLevel }}</div></div>
                  <div class="form-group"><span class="form-label">Publicly Disclosed</span><div class="form-value">{{ pn.identity.publiclyDisclosed ? 'Yes' : 'No' }}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value"><span class="status status-green">{{ pn.identity.status }}</span></div></div>
                  <div class="form-group"><span class="form-label">Date Created</span><div class="form-value">{{ pn.identity.dateCreated }}</div></div>
                  <div class="form-group full"><span class="form-label">Reason / Purpose</span><div class="form-value">{{ pn.identity.reason }}</div></div>
                </div>
              </div>
            }

            <!-- Branding -->
            @if (tab() === 'branding') {
              <div class="card">
                <h3 class="section-title">Branding & Visual Identity</h3>
                <p class="section-subtitle">Everything here relates to {{ pn.identity.displayName }} specifically — not the company or imprint</p>
                <div class="form-grid">
                  <div class="form-group full"><span class="form-label">Tagline</span><div class="form-value">{{ pn.branding.tagline }}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — Short</span><div class="form-value">{{ pn.branding.bioShort }}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — Medium</span><div class="form-value">{{ pn.branding.bioMedium }}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — Long</span><div class="form-value">{{ pn.branding.bioLong || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — First Person</span><div class="form-value">{{ pn.branding.bioFirstPerson || '—' }}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — Third Person</span><div class="form-value">{{ pn.branding.bioThirdPerson || '—' }}</div></div>
                  <div class="form-group"><span class="form-label">Brand Colors</span><div class="form-value">{{ pn.branding.brandColors }}</div></div>
                  <div class="form-group"><span class="form-label">Brand Fonts</span><div class="form-value">{{ pn.branding.brandFonts }}</div></div>
                  <div class="form-group full"><span class="form-label">Cover Style Notes</span><div class="form-value">{{ pn.branding.coverStyleNotes || '—' }}</div></div>
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
                  <thead><tr><th>Platform</th><th>Handle</th><th>URL</th></tr></thead>
                  <tbody>
                    @for (s of pn.onlinePresence.socialAccounts; track s.platform) {
                      <tr><td class="td-primary">{{ s.platform }}</td><td>{{ s.handle }}</td><td>{{ s.url || '—' }}</td></tr>
                    }
                  </tbody>
                </table>
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

            <!-- Series -->
            @if (tab() === 'series') {
              <div class="card">
                <h3 class="section-title">Series under {{ pn.identity.displayName }}</h3>
                <div class="entity-list">
                  @for (sr of pn.series; track sr.id) {
                    <div class="entity-card" (click)="goTo('/vault/series')">
                      <div class="entity-card-header">
                        <h3 class="entity-name">📖 {{ sr.identity.name }}</h3>
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
  `]
})
export class VaultPenNamesPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);

  allPenNames = computed(() => {
    const pns: PenName[] = [];
    for (const i of this.vs.company().imprints) pns.push(...i.penNames);
    return pns;
  });

  selected = signal<PenName | null>(null);
  tab = signal('identity');

  tabs = [
    { id: 'identity',  label: '🪪 Identity' },
    { id: 'branding',  label: '🎨 Branding & Assets' },
    { id: 'platforms', label: '📚 Platforms' },
    { id: 'presence',  label: '🌐 Online Presence' },
    { id: 'community', label: '👥 Reader Community' },
    { id: 'series',    label: '📖 Series' },
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
}
