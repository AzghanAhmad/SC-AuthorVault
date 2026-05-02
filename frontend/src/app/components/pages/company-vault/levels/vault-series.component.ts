import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Series, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-series',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-header">
      <h1 class="page-title">📖 {{series.identity.name}}</h1>
      <p class="page-subtitle">{{series.identity.seriesType}} · {{series.identity.genre}} · <span class="status" [ngClass]="series.identity.status==='Active'?'status-green':series.identity.status==='Complete'?'status-blue':'status-amber'">{{series.identity.status}}</span></p>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">{{series.books.length}} / {{series.identity.plannedTotalBooks}}</div><div class="stat-label">Books</div></div>
      <div class="stat-card"><div class="stat-value">{{series.boxSets.length}}</div><div class="stat-label">Box Sets</div></div>
      <div class="stat-card"><div class="stat-value">{{series.identity.targetAudience}}</div><div class="stat-label">Audience</div></div>
      <div class="stat-card"><div class="stat-value">{{series.identity.status}}</div><div class="stat-label">Status</div></div>
    </div>
    <div class="vault-layout">
      <nav class="vault-nav">
        @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="activeTab===t.id" (click)="tabChange.emit(t.id)">{{t.label}}</button> }
      </nav>
      <div class="vault-content">
        @if(activeTab==='identity') {
          <div class="card"><h2 class="section-title">Series Identity</h2>
            <div class="form-grid">
              <div class="form-group"><span class="form-label">Series Name</span><div class="form-value">{{series.identity.name}}</div></div>
              <div class="form-group"><span class="form-label">Type</span><div class="form-value">{{series.identity.seriesType}}</div></div>
              <div class="form-group"><span class="form-label">Genre</span><div class="form-value">{{series.identity.genre}}</div></div>
              <div class="form-group"><span class="form-label">Target Audience</span><div class="form-value">{{series.identity.targetAudience}}</div></div>
              <div class="form-group"><span class="form-label">Start Date</span><div class="form-value">{{series.identity.startDate}}</div></div>
              <div class="form-group"><span class="form-label">Planned Books</span><div class="form-value">{{series.identity.plannedTotalBooks}}</div></div>
              <div class="form-group full"><span class="form-label">Reading Order Notes</span><div class="form-value">{{series.identity.readingOrderNotes || '—'}}</div></div>
              <div class="form-group full"><span class="form-label">Universe</span><div class="form-value">{{series.identity.universeName || '—'}}</div></div>
            </div>
          </div>
        }
        @if(activeTab==='world') {
          <div class="card"><h2 class="section-title">World & Continuity</h2>
            <div class="form-grid">
              <div class="form-group full"><span class="form-label">Setting Overview</span><div class="form-value">{{series.world.settingOverview}}</div></div>
              <div class="form-group"><span class="form-label">Character Bible</span><div class="form-value">{{series.world.characterBibleFile || '—'}}</div></div>
              <div class="form-group"><span class="form-label">Glossary</span><div class="form-value">{{series.world.glossary || '—'}}</div></div>
              <div class="form-group"><span class="form-label">Maps</span><div class="form-value">{{series.world.mapsFiles || '—'}}</div></div>
              <div class="form-group full"><span class="form-label">Continuity Notes</span><div class="form-value">{{series.world.continuityNotes || '—'}}</div></div>
            </div>
          </div>
        }
        @if(activeTab==='branding') {
          <div class="card"><h2 class="section-title">Branding & Marketing</h2>
            <div class="form-grid">
              <div class="form-group full"><span class="form-label">Tagline</span><div class="form-value">{{series.branding.tagline}}</div></div>
              <div class="form-group full"><span class="form-label">One-line Hook</span><div class="form-value">{{series.branding.oneLineHook}}</div></div>
              <div class="form-group"><span class="form-label">Reader Magnet</span><div class="form-value">{{series.branding.readerMagnet || '—'}}</div></div>
              <div class="form-group"><span class="form-label">Sales Page</span><div class="form-value">{{series.branding.salesPage || '—'}}</div></div>
              <div class="form-group"><span class="form-label">Comp Titles</span><div class="form-value">{{series.branding.compTitles || '—'}}</div></div>
              <div class="form-group"><span class="form-label">Comp Authors</span><div class="form-value">{{series.branding.compAuthors || '—'}}</div></div>
            </div>
          </div>
        }
        @if(activeTab==='boxsets') {
          <div class="card"><h2 class="section-title">Box Sets & Bundles</h2>
            @if(!series.boxSets.length) { <div class="empty-state"><div class="empty-icon">📦</div><p>No box sets created yet</p></div> }
            @for(bs of series.boxSets; track bs.id) {
              <div class="record-card">
                <div class="record-header"><h3 class="record-title">{{bs.title}}</h3><span class="status" [ngClass]="bs.status==='Published'?'status-green':'status-amber'">{{bs.status}}</span></div>
                <div class="record-grid">
                  <div class="record-field"><span class="label">Type</span><span class="value">{{bs.type}}</span></div>
                  <div class="record-field"><span class="label">Titles</span><span class="value">{{bs.constituentTitles.length}}</span></div>
                  <div class="record-field"><span class="label">Word Count</span><span class="value">{{bs.totalWordCount | number}}</span></div>
                </div>
              </div>
            }
          </div>
        }
        @if(activeTab==='books') {
          <div class="card"><h2 class="section-title">Books in Series</h2>
            <div class="entity-list">
              @for(bk of series.books; track bk.id) {
                <div class="entity-card" (click)="navigateTo.emit({level:'book', id:bk.id, label:bk.coreWork.masterTitle})">
                  <div class="entity-card-header"><h3 class="entity-name">📕 #{{bk.coreWork.seriesNumber}} — {{bk.coreWork.masterTitle}}</h3>
                    <span class="status" [ngClass]="bk.coreWork.bookStatus==='Published'?'status-green':bk.coreWork.bookStatus==='Editing'?'status-amber':'status-blue'">{{bk.coreWork.bookStatus}}</span>
                  </div>
                  <div class="entity-stats">
                    <span class="entity-stat"><strong>{{bk.languageBranches.length}}</strong> Editions</span>
                    <span class="entity-stat"><strong>{{bk.contributors.length}}</strong> Contributors</span>
                    <span class="entity-stat"><strong>{{bk.awards.length}}</strong> Awards</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['../company-vault.component.css']
})
export class VaultSeriesComponent {
  @Input() series!: Series;
  @Input() activeTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id:'identity', label:'Identity' },{ id:'world', label:'World' },{ id:'branding', label:'Branding' },{ id:'boxsets', label:'Box Sets' },{ id:'books', label:'Books' }];
}
