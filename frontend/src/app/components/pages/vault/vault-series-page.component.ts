import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { Series } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-series-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">📖 Series</h1>
        <p class="page-subtitle">All series across pen names</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{allSeries().length}}</div><div class="stat-label">Total Series</div></div>
        <div class="stat-card"><div class="stat-value">{{totalBooks}}</div><div class="stat-label">Total Books</div></div>
        <div class="stat-card"><div class="stat-value">{{activeSeries}}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><div class="stat-value">{{totalBoxSets}}</div><div class="stat-label">Box Sets</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="tab()===t.id" (click)="onTabClick(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(tab()==='dashboard') {
            <div class="card"><h2 class="section-title">All Series</h2>
              <div class="entity-list">
                @for(sr of allSeries(); track sr.id) {
                  <div class="entity-card" (click)="selectItem(sr)">
                    <div class="entity-card-header"><h3 class="entity-name">📖 {{sr.identity.name}}</h3>
                      <span class="status" [ngClass]="sr.identity.status==='Active'?'status-green':sr.identity.status==='Complete'?'status-blue':'status-amber'">{{sr.identity.status}}</span></div>
                    <p class="entity-meta">{{sr.identity.seriesType}} · {{sr.identity.genre}} · {{sr.identity.targetAudience}}</p>
                    <div class="entity-stats">
                      <span class="entity-stat"><strong>{{sr.books.length}}</strong> / {{sr.identity.plannedTotalBooks}} Books</span>
                      <span class="entity-stat"><strong>{{sr.boxSets.length}}</strong> Box Sets</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
          @if(tab()!=='dashboard' && !selected()) {
            <div class="card"><div class="empty-state"><div class="empty-icon">👆</div><p>Select a series from the Dashboard tab first</p></div></div>
          }
          @if(selected(); as sr) {
            @if(tab()!=='dashboard') {
              <button class="back-btn" (click)="tab.set('dashboard'); selected.set(null)">← Back to Dashboard</button>
            }
            @if(tab()==='identity') {
              <div class="card"><h2 class="section-title">{{sr.identity.name}}</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Name</span><div class="form-value">{{sr.identity.name}}</div></div>
                  <div class="form-group"><span class="form-label">Type</span><div class="form-value">{{sr.identity.seriesType}}</div></div>
                  <div class="form-group"><span class="form-label">Genre</span><div class="form-value">{{sr.identity.genre}}</div></div>
                  <div class="form-group"><span class="form-label">Audience</span><div class="form-value">{{sr.identity.targetAudience}}</div></div>
                  <div class="form-group"><span class="form-label">Start Date</span><div class="form-value">{{sr.identity.startDate}}</div></div>
                  <div class="form-group"><span class="form-label">Planned Books</span><div class="form-value">{{sr.identity.plannedTotalBooks}}</div></div>
                  <div class="form-group full"><span class="form-label">Universe</span><div class="form-value">{{sr.identity.universeName || '—'}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='world') {
              <div class="card"><h2 class="section-title">World & Continuity</h2>
                <div class="form-grid">
                  <div class="form-group full"><span class="form-label">Setting</span><div class="form-value">{{sr.world.settingOverview}}</div></div>
                  <div class="form-group"><span class="form-label">Character Bible</span><div class="form-value">{{sr.world.characterBibleFile || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Glossary</span><div class="form-value">{{sr.world.glossary || '—'}}</div></div>
                  <div class="form-group full"><span class="form-label">Notes</span><div class="form-value">{{sr.world.continuityNotes || '—'}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='branding') {
              <div class="card"><h2 class="section-title">Branding & Marketing</h2>
                <div class="form-grid">
                  <div class="form-group full"><span class="form-label">Tagline</span><div class="form-value">{{sr.branding.tagline}}</div></div>
                  <div class="form-group full"><span class="form-label">Hook</span><div class="form-value">{{sr.branding.oneLineHook}}</div></div>
                  <div class="form-group"><span class="form-label">Reader Magnet</span><div class="form-value">{{sr.branding.readerMagnet || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Comp Titles</span><div class="form-value">{{sr.branding.compTitles || '—'}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='boxsets') {
              <div class="card"><h2 class="section-title">Box Sets</h2>
                @if(!sr.boxSets.length) { <div class="empty-state"><div class="empty-icon">📦</div><p>No box sets</p></div> }
                @for(bs of sr.boxSets; track bs.id) {
                  <div class="record-card">
                    <div class="record-header"><h3 class="record-title">{{bs.title}}</h3><span class="status status-amber">{{bs.status}}</span></div>
                    <div class="record-grid">
                      <div class="record-field"><span class="label">Type</span><span class="value">{{bs.type}}</span></div>
                      <div class="record-field"><span class="label">Titles</span><span class="value">{{bs.constituentTitles.length}}</span></div>
                    </div>
                  </div>
                }
              </div>
            }
            @if(tab()==='books') {
              <div class="card"><h2 class="section-title">Books</h2>
                <table class="data-table"><thead><tr><th>#</th><th>Title</th><th>Status</th><th>Editions</th><th>Awards</th></tr></thead>
                  <tbody>@for(bk of sr.books; track bk.id) {
                    <tr><td>{{bk.coreWork.seriesNumber}}</td><td class="td-primary">{{bk.coreWork.masterTitle}}</td>
                      <td><span class="status" [ngClass]="bk.coreWork.bookStatus==='Published'?'status-green':'status-amber'">{{bk.coreWork.bookStatus}}</span></td>
                      <td>{{bk.languageBranches.length}}</td><td>{{bk.awards.length}}</td></tr>
                  }</tbody>
                </table>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../company-vault/company-vault.component.css']
})
export class VaultSeriesPageComponent {
  private vs = inject(AuthorVaultService);
  allSeries = computed(() => { const s: Series[] = []; for (const i of this.vs.company().imprints) for (const p of i.penNames) s.push(...p.series); return s; });
  selected = signal<Series | null>(null);
  tab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'identity',label:'Identity'},{id:'world',label:'World'},{id:'branding',label:'Branding'},{id:'boxsets',label:'Box Sets'},{id:'books',label:'Books'}];
  get totalBooks() { return this.allSeries().reduce((a,s)=>a+s.books.length,0); }
  get activeSeries() { return this.allSeries().filter(s=>s.identity.status==='Active').length; }
  get totalBoxSets() { return this.allSeries().reduce((a,s)=>a+s.boxSets.length,0); }
  selectItem(sr: Series) { this.selected.set(sr); this.tab.set('identity'); }
  onTabClick(id: string) { if (id === 'dashboard') { this.selected.set(null); } this.tab.set(id); }
}
