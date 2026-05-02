import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { LanguageBranch } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-languages-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">🌐 Language Editions</h1>
        <p class="page-subtitle">All language / edition branches across books</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{allBranches().length}}</div><div class="stat-label">Total Editions</div></div>
        <div class="stat-card"><div class="stat-value">{{primaryCount}}</div><div class="stat-label">Primary</div></div>
        <div class="stat-card"><div class="stat-value">{{translationCount}}</div><div class="stat-label">Translations</div></div>
        <div class="stat-card"><div class="stat-value">{{totalFormats}}</div><div class="stat-label">Total Formats</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="tab()===t.id" (click)="onTabClick(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(tab()==='dashboard') {
            <div class="card"><h2 class="section-title">All Editions</h2>
              <table class="data-table"><thead><tr><th>Edition</th><th>Language</th><th>Type</th><th>Status</th><th>Formats</th><th>Words</th></tr></thead>
                <tbody>@for(lb of allBranches(); track lb.id) {
                  <tr class="clickable-row" (click)="selectItem(lb)">
                    <td class="td-primary">{{lb.edition.editionName}}</td>
                    <td>{{lb.edition.language}} ({{lb.edition.languageCode}})</td>
                    <td>{{lb.edition.editionType}} @if(lb.edition.isPrimaryLanguage) { <span class="tag">Primary</span> }</td>
                    <td><span class="status" [ngClass]="lb.edition.publicationStatus==='Published'?'status-green':'status-amber'">{{lb.edition.publicationStatus}}</span></td>
                    <td>{{lb.formats.length}}</td>
                    <td>{{lb.edition.wordCount | number}}</td>
                  </tr>
                }</tbody>
              </table>
            </div>
          }
          @if(tab()!=='dashboard' && !selected()) {
            <div class="card"><div class="empty-state"><div class="empty-icon">👆</div><p>Select an edition from the Dashboard tab first</p></div></div>
          }
          @if(selected(); as lb) {
            @if(tab()!=='dashboard') {
              <button class="back-btn" (click)="tab.set('dashboard'); selected.set(null)">← Back to Dashboard</button>
            }
            @if(tab()==='edition') {
              <div class="card"><h2 class="section-title">{{lb.edition.editionName}}</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Name</span><div class="form-value">{{lb.edition.editionName}}</div></div>
                  <div class="form-group"><span class="form-label">Type</span><div class="form-value">{{lb.edition.editionType}}</div></div>
                  <div class="form-group"><span class="form-label">Language</span><div class="form-value">{{lb.edition.language}}</div></div>
                  <div class="form-group"><span class="form-label">Code</span><div class="form-value">{{lb.edition.languageCode}}</div></div>
                  <div class="form-group"><span class="form-label">Primary?</span><div class="form-value">{{lb.edition.isPrimaryLanguage ? 'Yes' : 'No'}}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{lb.edition.publicationStatus}}</div></div>
                  <div class="form-group"><span class="form-label">Words</span><div class="form-value">{{lb.edition.wordCount | number}}</div></div>
                  <div class="form-group"><span class="form-label">Pages</span><div class="form-value">{{lb.edition.pageCount}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='metadata') {
              <div class="card"><h2 class="section-title">Localized Metadata</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Title</span><div class="form-value">{{lb.localizedMetadata.localizedTitle || '—'}}</div></div>
                  <div class="form-group full"><span class="form-label">Short Desc</span><div class="form-value">{{lb.localizedMetadata.localizedShortDescription || '—'}}</div></div>
                  <div class="form-group full"><span class="form-label">Translator</span><div class="form-value">{{lb.localizedMetadata.translatorCreditLine || '—'}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='identifiers') {
              <div class="card"><h2 class="section-title">ISBNs</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Ebook</span><div class="form-value">{{lb.identifiers.isbnEbook || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Paperback</span><div class="form-value">{{lb.identifiers.isbnPaperback || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Hardcover</span><div class="form-value">{{lb.identifiers.isbnHardcover || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Audiobook</span><div class="form-value">{{lb.identifiers.isbnAudiobook || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{lb.identifiers.isbnStatus}}</div></div>
                </div>
              </div>
            }
            @if(tab()==='formats') {
              <div class="card"><h2 class="section-title">Formats</h2>
                <div class="entity-list">
                  @for(f of lb.formats; track f.id) {
                    <div class="entity-card">
                      <div class="entity-card-header"><h3 class="entity-name">📄 {{f.specs.formatType}}</h3>
                        <span class="status" [ngClass]="f.specs.status==='Live'?'status-green':'status-amber'">{{f.specs.status}}</span></div>
                      <div class="entity-stats">
                        <span class="entity-stat"><strong>v{{f.specs.versionNumber}}</strong></span>
                        <span class="entity-stat">{{f.specs.fileSize}}</span>
                        <span class="entity-stat"><strong>{{f.platformVariants.length}}</strong> Platforms</span>
                      </div>
                    </div>
                  }
                  @if(!lb.formats.length) { <div class="empty-state"><p>No formats</p></div> }
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
export class VaultLanguagesPageComponent {
  private vs = inject(AuthorVaultService);
  allBranches = computed(() => {
    const bs: LanguageBranch[] = [];
    for (const i of this.vs.company().imprints) for (const p of i.penNames) for (const s of p.series) for (const bk of s.books) bs.push(...bk.languageBranches);
    return bs;
  });
  selected = signal<LanguageBranch | null>(null);
  tab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'edition',label:'Edition'},{id:'metadata',label:'Metadata'},{id:'identifiers',label:'ISBNs'},{id:'formats',label:'Formats'}];
  get primaryCount() { return this.allBranches().filter(b=>b.edition.isPrimaryLanguage).length; }
  get translationCount() { return this.allBranches().filter(b=>!b.edition.isPrimaryLanguage).length; }
  get totalFormats() { return this.allBranches().reduce((a,b)=>a+b.formats.length,0); }
  selectItem(lb: LanguageBranch) { this.selected.set(lb); this.tab.set('edition'); }
  onTabClick(id: string) { if (id === 'dashboard') { this.selected.set(null); } this.tab.set(id); }
}
