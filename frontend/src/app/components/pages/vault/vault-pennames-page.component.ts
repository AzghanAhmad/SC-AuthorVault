import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { PenName } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-pennames-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">✍️ Pen Names</h1>
        <p class="page-subtitle">Author identities across all imprints</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{allPenNames().length}}</div><div class="stat-label">Pen Names</div></div>
        <div class="stat-card"><div class="stat-value">{{totalSeries}}</div><div class="stat-label">Total Series</div></div>
        <div class="stat-card"><div class="stat-value">{{totalBooks}}</div><div class="stat-label">Total Books</div></div>
        <div class="stat-card"><div class="stat-value">{{totalSubscribers | number}}</div><div class="stat-label">Subscribers</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="tab()===t.id" (click)="onTabClick(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(tab()==='dashboard') {
            <div class="card"><h2 class="section-title">All Pen Names</h2>
              <div class="entity-list">
                @for(pn of allPenNames(); track pn.id) {
                  <div class="entity-card" (click)="selectItem(pn)">
                    <div class="entity-card-header"><h3 class="entity-name">✍️ {{pn.identity.displayName}}</h3>
                      <span class="status status-green">{{pn.identity.status}}</span></div>
                    <p class="entity-meta">{{pn.identity.genre}} · {{pn.identity.penNameType}} · {{pn.identity.privacyLevel}}</p>
                    <div class="entity-stats">
                      <span class="entity-stat"><strong>{{pn.series.length}}</strong> Series</span>
                      <span class="entity-stat"><strong>{{pn.platformAccounts.length}}</strong> Platforms</span>
                      <span class="entity-stat"><strong>{{pn.onlinePresence.subscriberCount | number}}</strong> Subscribers</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @if(tab()!=='dashboard' && !selected()) {
            <div class="card"><div class="empty-state"><div class="empty-icon">👆</div><p>Select a pen name from the Dashboard tab first</p></div></div>
          }
          @if(selected(); as pn) {
            @if(tab()!=='dashboard') {
              <button class="back-btn" (click)="tab.set('dashboard'); selected.set(null)">← Back to Dashboard</button>
            }
            @if(tab()==='identity') {
              <div class="card"><h2 class="section-title">{{pn.identity.displayName}} — Identity</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Display Name</span><div class="form-value">{{pn.identity.displayName}}</div></div>
                  <div class="form-group"><span class="form-label">Legal Name</span><div class="form-value">{{pn.identity.legalNameLinked}}</div></div>
                  <div class="form-group"><span class="form-label">Genre</span><div class="form-value">{{pn.identity.genre}}</div></div>
                  <div class="form-group"><span class="form-label">Type</span><div class="form-value">{{pn.identity.penNameType}}</div></div>
                  <div class="form-group"><span class="form-label">Privacy</span><div class="form-value">{{pn.identity.privacyLevel}}</div></div>
                  <div class="form-group"><span class="form-label">Disclosed</span><div class="form-value">{{pn.identity.publiclyDisclosed ? 'Yes' : 'No'}}</div></div>
                  <div class="form-group"><span class="form-label">Created</span><div class="form-value">{{pn.identity.dateCreated}}</div></div>
                  <div class="form-group full"><span class="form-label">Reason</span><div class="form-value">{{pn.identity.reason}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='branding') {
              <div class="card"><h2 class="section-title">Branding & Visual Identity</h2>
                <div class="form-grid">
                  <div class="form-group full"><span class="form-label">Bio — Short</span><div class="form-value">{{pn.branding.bioShort}}</div></div>
                  <div class="form-group full"><span class="form-label">Bio — Medium</span><div class="form-value">{{pn.branding.bioMedium}}</div></div>
                  <div class="form-group full"><span class="form-label">Tagline</span><div class="form-value">{{pn.branding.tagline}}</div></div>
                  <div class="form-group"><span class="form-label">Brand Colors</span><div class="form-value">{{pn.branding.brandColors}}</div></div>
                  <div class="form-group"><span class="form-label">Brand Fonts</span><div class="form-value">{{pn.branding.brandFonts}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='platforms') {
              <div class="card"><h2 class="section-title">Platform Accounts</h2>
                <table class="data-table"><thead><tr><th>Platform</th><th>Account</th><th>URL</th></tr></thead>
                  <tbody>@for(pa of pn.platformAccounts; track pa.platform) { <tr><td class="td-primary">{{pa.platform}}</td><td>{{pa.accountInfo}}</td><td>{{pa.url || '—'}}</td></tr> }</tbody>
                </table>
              </div>
            }
            @if(tab()==='presence') {
              <div class="card"><h2 class="section-title">Online Presence</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Website</span><div class="form-value">{{pn.onlinePresence.authorWebsite}}</div></div>
                  <div class="form-group"><span class="form-label">Newsletter</span><div class="form-value">{{pn.onlinePresence.newsletterName}}</div></div>
                  <div class="form-group"><span class="form-label">Subscribers</span><div class="form-value">{{pn.onlinePresence.subscriberCount | number}}</div></div>
                  <div class="form-group"><span class="form-label">Platform</span><div class="form-value">{{pn.onlinePresence.newsletterPlatform}}</div></div>
                </div>
                <h3 class="section-title" style="margin-top:1rem">Social</h3>
                <table class="data-table"><thead><tr><th>Platform</th><th>Handle</th></tr></thead>
                  <tbody>@for(s of pn.onlinePresence.socialAccounts; track s.platform) { <tr><td class="td-primary">{{s.platform}}</td><td>{{s.handle}}</td></tr> }</tbody>
                </table>
              </div>
            }
            @if(tab()==='community') {
              <div class="card"><h2 class="section-title">Reader Community</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Demographics</span><div class="form-value">{{pn.readerCommunity.primaryDemographic}}</div></div>
                  <div class="form-group"><span class="form-label">ARC Team</span><div class="form-value">{{pn.readerCommunity.arcTeam}}</div></div>
                  <div class="form-group"><span class="form-label">Beta Readers</span><div class="form-value">{{pn.readerCommunity.betaReaderPool}}</div></div>
                  <div class="form-group full"><span class="form-label">Persona</span><div class="form-value">{{pn.readerCommunity.readerPersona}}</div></div>
                  <div class="form-group full"><span class="form-label">Engagement</span><div class="form-value">{{pn.readerCommunity.engagementNotes}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='series') {
              <div class="card"><h2 class="section-title">Series</h2>
                <div class="entity-list">
                  @for(sr of pn.series; track sr.id) {
                    <div class="entity-card">
                      <div class="entity-card-header"><h3 class="entity-name">📖 {{sr.identity.name}}</h3>
                        <span class="status" [ngClass]="sr.identity.status==='Active'?'status-green':'status-blue'">{{sr.identity.status}}</span></div>
                      <p class="entity-meta">{{sr.identity.seriesType}} · {{sr.identity.genre}}</p>
                      <div class="entity-stats"><span class="entity-stat"><strong>{{sr.books.length}}</strong> / {{sr.identity.plannedTotalBooks}} Books</span></div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../company-vault/company-vault.component.css']
})
export class VaultPenNamesPageComponent {
  private vs = inject(AuthorVaultService);
  allPenNames = computed(() => { const pns: PenName[] = []; for (const i of this.vs.company().imprints) pns.push(...i.penNames); return pns; });
  selected = signal<PenName | null>(null);
  tab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'identity',label:'Identity'},{id:'branding',label:'Branding'},{id:'platforms',label:'Platforms'},{id:'presence',label:'Online Presence'},{id:'community',label:'Community'},{id:'series',label:'Series'}];
  get totalSeries() { return this.allPenNames().reduce((a,p)=>a+p.series.length,0); }
  get totalBooks() { return this.allPenNames().reduce((a,p)=>a+p.series.reduce((b,s)=>b+s.books.length,0),0); }
  get totalSubscribers() { return this.allPenNames().reduce((a,p)=>a+p.onlinePresence.subscriberCount,0); }
  selectItem(pn: PenName) { this.selected.set(pn); this.tab.set('identity'); }
  onTabClick(id: string) { if (id === 'dashboard') { this.selected.set(null); } this.tab.set(id); }
}
