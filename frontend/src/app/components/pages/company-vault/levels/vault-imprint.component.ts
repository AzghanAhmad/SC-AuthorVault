import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Imprint, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-imprint',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-header">
      <h1 class="page-title">📚 {{imprint.identity.name}}</h1>
      <p class="page-subtitle">{{imprint.identity.purposeGenreFocus}} · <span class="status" [ngClass]="imprint.identity.status==='Active'?'status-green':'status-amber'">{{imprint.identity.status}}</span></p>
    </div>

    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">{{imprint.penNames.length}}</div><div class="stat-label">Pen Names</div></div>
      <div class="stat-card"><div class="stat-value">{{totalBooks}}</div><div class="stat-label">Total Books</div></div>
      <div class="stat-card"><div class="stat-value">{{imprint.legalIsbn.isbnBlockCount}}</div><div class="stat-label">ISBN Block</div></div>
      <div class="stat-card"><div class="stat-value">{{imprint.legalIsbn.isbnsRemaining}}</div><div class="stat-label">ISBNs Left</div></div>
    </div>

    <div class="vault-layout">
      <nav class="vault-nav">
        @for(t of tabs; track t.id) {
          <button class="tab-item" [class.active]="activeTab===t.id" (click)="tabChange.emit(t.id)">{{t.label}}</button>
        }
      </nav>
      <div class="vault-content">
        @if(activeTab === 'identity') {
          <div class="card">
            <h2 class="section-title">Imprint Identity</h2>
            <div class="form-grid">
              <div class="form-group"><span class="form-label">Imprint Name</span><div class="form-value">{{imprint.identity.name}}</div></div>
              <div class="form-group"><span class="form-label">Genre Focus</span><div class="form-value">{{imprint.identity.purposeGenreFocus}}</div></div>
              <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{imprint.identity.status}}</div></div>
              <div class="form-group"><span class="form-label">Date Established</span><div class="form-value">{{imprint.identity.dateEstablished}}</div></div>
              <div class="form-group"><span class="form-label">Website</span><div class="form-value">{{imprint.identity.website}}</div></div>
              <div class="form-group"><span class="form-label">Email</span><div class="form-value">{{imprint.identity.email}}</div></div>
            </div>
          </div>
        }
        @if(activeTab === 'isbn') {
          <div class="card">
            <h2 class="section-title">Legal & ISBN Block</h2>
            <div class="form-grid">
              <div class="form-group"><span class="form-label">ISBN Prefix</span><div class="form-value">{{imprint.legalIsbn.isbnPrefix}}</div></div>
              <div class="form-group"><span class="form-label">Block Purchased</span><div class="form-value">{{imprint.legalIsbn.isbnBlockPurchased}}</div></div>
              <div class="form-group"><span class="form-label">Total in Block</span><div class="form-value">{{imprint.legalIsbn.isbnBlockCount}}</div></div>
              <div class="form-group"><span class="form-label">Assigned</span><div class="form-value">{{imprint.legalIsbn.isbnsAssigned}}</div></div>
              <div class="form-group"><span class="form-label">Remaining</span><div class="form-value">{{imprint.legalIsbn.isbnsRemaining}}</div></div>
              <div class="form-group full"><span class="form-label">Copyright Page Template</span><div class="form-value">{{imprint.legalIsbn.copyrightPageTemplate}}</div></div>
              <div class="form-group"><span class="form-label">Trademark</span><div class="form-value">{{imprint.legalIsbn.trademark}}</div></div>
            </div>
          </div>
        }
        @if(activeTab === 'pennames') {
          <div class="card">
            <h2 class="section-title">Pen Names</h2>
            <div class="entity-list">
              @for(pn of imprint.penNames; track pn.id) {
                <div class="entity-card" (click)="navigateTo.emit({level:'penname', id:pn.id, label:pn.identity.displayName})">
                  <div class="entity-card-header">
                    <h3 class="entity-name">✍️ {{pn.identity.displayName}}</h3>
                    <span class="status" [ngClass]="pn.identity.status==='Active'?'status-green':'status-amber'">{{pn.identity.status}}</span>
                  </div>
                  <p class="entity-meta">{{pn.identity.genre}} · {{pn.identity.penNameType}}</p>
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
      </div>
    </div>
  `,
  styleUrls: ['../company-vault.component.css']
})
export class VaultImprintComponent {
  @Input() imprint!: Imprint;
  @Input() activeTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id: 'identity', label: 'Identity' }, { id: 'isbn', label: 'Legal & ISBN' }, { id: 'pennames', label: 'Pen Names' }];
  get totalBooks() { return this.imprint.penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0); }
}
