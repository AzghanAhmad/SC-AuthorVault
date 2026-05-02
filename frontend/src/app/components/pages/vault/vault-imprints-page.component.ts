import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { Imprint } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-imprints-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">📚 Imprints</h1>
        <p class="page-subtitle">Publishing brands under {{company().identity.legalName}}</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{allImprints().length}}</div><div class="stat-label">Total Imprints</div></div>
        <div class="stat-card"><div class="stat-value">{{totalPenNames}}</div><div class="stat-label">Pen Names</div></div>
        <div class="stat-card"><div class="stat-value">{{totalBooks}}</div><div class="stat-label">Books</div></div>
        <div class="stat-card"><div class="stat-value">{{totalISBNsRemaining}}</div><div class="stat-label">ISBNs Remaining</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="activeTab()===t.id" (click)="onTabClick(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(activeTab()==='dashboard') {
            <div class="card"><h2 class="section-title">All Imprints</h2>
              <div class="entity-list">
                @for(imp of allImprints(); track imp.id) {
                  <div class="entity-card" (click)="selectImprint(imp)">
                    <div class="entity-card-header"><h3 class="entity-name">📚 {{imp.identity.name}}</h3>
                      <span class="status status-green">{{imp.identity.status}}</span></div>
                    <p class="entity-meta">{{imp.identity.purposeGenreFocus}}</p>
                    <div class="entity-stats">
                      <span class="entity-stat"><strong>{{imp.penNames.length}}</strong> Pen Names</span>
                      <span class="entity-stat"><strong>{{imp.legalIsbn.isbnsRemaining}}</strong> ISBNs left</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if(activeTab()!=='dashboard' && !selectedImprint()) {
            <div class="card"><div class="empty-state"><div class="empty-icon">👆</div><p>Select an imprint from the Dashboard tab first</p></div></div>
          }

          @if(selectedImprint(); as imp) {
            @if(activeTab()!=='dashboard') {
              <button class="back-btn" (click)="activeTab.set('dashboard'); selectedImprint.set(null)">← Back to Dashboard</button>
            }
            @if(activeTab()==='identity') {
              <div class="card"><h2 class="section-title">{{imp.identity.name}} — Identity</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Name</span><div class="form-value">{{imp.identity.name}}</div></div>
                  <div class="form-group"><span class="form-label">Genre Focus</span><div class="form-value">{{imp.identity.purposeGenreFocus}}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{imp.identity.status}}</div></div>
                  <div class="form-group"><span class="form-label">Established</span><div class="form-value">{{imp.identity.dateEstablished}}</div></div>
                  <div class="form-group"><span class="form-label">Website</span><div class="form-value">{{imp.identity.website}}</div></div>
                  <div class="form-group"><span class="form-label">Email</span><div class="form-value">{{imp.identity.email}}</div></div>
                </div>
              </div>
            }
            @if(activeTab()==='isbn') {
              <div class="card"><h2 class="section-title">Legal & ISBN Block</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">ISBN Prefix</span><div class="form-value">{{imp.legalIsbn.isbnPrefix}}</div></div>
                  <div class="form-group"><span class="form-label">Block</span><div class="form-value">{{imp.legalIsbn.isbnBlockPurchased}}</div></div>
                  <div class="form-group"><span class="form-label">Total</span><div class="form-value">{{imp.legalIsbn.isbnBlockCount}}</div></div>
                  <div class="form-group"><span class="form-label">Assigned</span><div class="form-value">{{imp.legalIsbn.isbnsAssigned}}</div></div>
                  <div class="form-group"><span class="form-label">Remaining</span><div class="form-value">{{imp.legalIsbn.isbnsRemaining}}</div></div>
                  <div class="form-group"><span class="form-label">Trademark</span><div class="form-value">{{imp.legalIsbn.trademark}}</div></div>
                  <div class="form-group full"><span class="form-label">Copyright Template</span><div class="form-value">{{imp.legalIsbn.copyrightPageTemplate}}</div></div>
                </div>
              </div>
            }
            @if(activeTab()==='pennames') {
              <div class="card"><h2 class="section-title">Pen Names under {{imp.identity.name}}</h2>
                <div class="entity-list">
                  @for(pn of imp.penNames; track pn.id) {
                    <div class="entity-card" (click)="goTo('/vault/pen-names')">
                      <div class="entity-card-header"><h3 class="entity-name">✍️ {{pn.identity.displayName}}</h3>
                        <span class="status status-green">{{pn.identity.status}}</span></div>
                      <p class="entity-meta">{{pn.identity.genre}} · {{pn.identity.penNameType}}</p>
                      <div class="entity-stats">
                        <span class="entity-stat"><strong>{{pn.series.length}}</strong> Series</span>
                        <span class="entity-stat"><strong>{{pn.onlinePresence.subscriberCount}}</strong> Subscribers</span>
                      </div>
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
export class VaultImprintsPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);
  company = this.vs.company;
  allImprints = computed(() => this.company().imprints);
  selectedImprint = signal<Imprint | null>(null);
  activeTab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'identity',label:'Identity'},{id:'isbn',label:'Legal & ISBN'},{id:'pennames',label:'Pen Names'}];
  get totalPenNames() { return this.allImprints().reduce((a,i)=>a+i.penNames.length,0); }
  get totalBooks() { return this.allImprints().reduce((a,i)=>a+i.penNames.reduce((b,p)=>b+p.series.reduce((c,s)=>c+s.books.length,0),0),0); }
  get totalISBNsRemaining() { return this.allImprints().reduce((a,i)=>a+i.legalIsbn.isbnsRemaining,0); }
  goTo(r: string) { this.router.navigate([r]); }
  selectImprint(imp: Imprint) { this.selectedImprint.set(imp); this.activeTab.set('identity'); }
  onTabClick(id: string) { if (id === 'dashboard') { this.selectedImprint.set(null); } this.activeTab.set(id); }
}
