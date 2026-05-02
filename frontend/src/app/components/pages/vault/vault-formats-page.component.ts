import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { BookFormat } from '../../../models/author-vault.model';

@Component({
  selector: 'app-vault-formats-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">📄 Formats</h1>
        <p class="page-subtitle">All book formats across editions</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{allFormats().length}}</div><div class="stat-label">Total Formats</div></div>
        <div class="stat-card"><div class="stat-value">{{liveCount}}</div><div class="stat-label">Live</div></div>
        <div class="stat-card"><div class="stat-value">{{totalVariants}}</div><div class="stat-label">Platform Variants</div></div>
        <div class="stat-card"><div class="stat-value">{{totalLogs}}</div><div class="stat-label">Upload Events</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="tab()===t.id" (click)="onTabClick(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(tab()==='dashboard') {
            <div class="card"><h2 class="section-title">All Formats</h2>
              <table class="data-table"><thead><tr><th>Format</th><th>Status</th><th>Version</th><th>File Size</th><th>Platforms</th><th>Logs</th></tr></thead>
                <tbody>@for(f of allFormats(); track f.id) {
                  <tr class="clickable-row" (click)="selectItem(f)">
                    <td class="td-primary">{{f.specs.formatType}}</td>
                    <td><span class="status" [ngClass]="f.specs.status==='Live'?'status-green':'status-amber'">{{f.specs.status}}</span></td>
                    <td>v{{f.specs.versionNumber}}</td><td>{{f.specs.fileSize || '—'}}</td>
                    <td>{{f.platformVariants.length}}</td><td>{{f.uploadLogs.length}}</td>
                  </tr>
                }</tbody>
              </table>
            </div>
          }
          @if(tab()!=='dashboard' && !selected()) {
            <div class="card"><div class="empty-state"><div class="empty-icon">👆</div><p>Select a format from the Dashboard tab first</p></div></div>
          }
          @if(selected(); as f) {
            @if(tab()!=='dashboard') {
              <button class="back-btn" (click)="tab.set('dashboard'); selected.set(null)">← Back to Dashboard</button>
            }
            @if(tab()==='specs') {
              <div class="card"><h2 class="section-title">{{f.specs.formatType}} Specs</h2>
                <div class="form-grid">
                  <div class="form-group"><span class="form-label">Type</span><div class="form-value">{{f.specs.formatType}}</div></div>
                  <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{f.specs.status}}</div></div>
                  <div class="form-group"><span class="form-label">Version</span><div class="form-value">v{{f.specs.versionNumber}}</div></div>
                  <div class="form-group"><span class="form-label">Words</span><div class="form-value">{{f.specs.wordCount | number}}</div></div>
                  <div class="form-group"><span class="form-label">Pages</span><div class="form-value">{{f.specs.pageCount}}</div></div>
                  <div class="form-group"><span class="form-label">File Size</span><div class="form-value">{{f.specs.fileSize || '—'}}</div></div>
                  <div class="form-group"><span class="form-label">DRM</span><div class="form-value">{{f.specs.drmPreference || '—'}}</div></div>
                  @if(f.specs.trimSize) { <div class="form-group"><span class="form-label">Trim</span><div class="form-value">{{f.specs.trimSize}}</div></div> }
                  @if(f.specs.printFinish) { <div class="form-group"><span class="form-label">Finish</span><div class="form-value">{{f.specs.printFinish}}</div></div> }
                  @if(f.specs.interiorType) { <div class="form-group"><span class="form-label">Interior</span><div class="form-value">{{f.specs.interiorType}}</div></div> }
                </div>
              </div>
            }
            @if(tab()==='kdpselect') {
              <div class="card"><h2 class="section-title">KDP Select</h2>
                @if(f.kdpSelect) {
                  <div class="form-grid">
                    <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{f.kdpSelect.enrollmentStatus}}</div></div>
                    <div class="form-group"><span class="form-label">Auto-Renew</span><div class="form-value">{{f.kdpSelect.autoRenew ? 'On' : 'Off'}}</div></div>
                    <div class="form-group"><span class="form-label">KENP Pages</span><div class="form-value">{{f.kdpSelect.kenpPages | number}}</div></div>
                    <div class="form-group"><span class="form-label">KENP Revenue</span><div class="form-value">{{f.kdpSelect.kenpRevenue}}</div></div>
                  </div>
                } @else { <div class="empty-state"><p>Not enrolled</p></div> }
              </div>
            }
            @if(tab()==='pricing') {
              <div class="card"><h2 class="section-title">Pricing History</h2>
                <table class="data-table"><thead><tr><th>Regular</th><th>Launch</th><th>Sale</th><th>Currency</th><th>Start</th><th>Reason</th></tr></thead>
                  <tbody>@for(p of f.pricingHistory; track p.startDate) {
                    <tr><td class="td-primary">{{p.regularPrice}}</td><td>{{p.launchPrice}}</td><td>{{p.salePrice||'—'}}</td><td>{{p.currency}}</td><td>{{p.startDate}}</td><td>{{p.reason}}</td></tr>
                  }</tbody>
                </table>
              </div>
            }
            @if(tab()==='variants') {
              <div class="card"><h2 class="section-title">Platform Variants</h2>
                @for(pv of f.platformVariants; track pv.id) {
                  <div class="record-card">
                    <div class="record-header"><h3 class="record-title">{{pv.platformName}} ({{pv.storeRegion}})</h3>
                      <span class="status" [ngClass]="pv.uploadStatus==='Live'?'status-green':'status-amber'">{{pv.uploadStatus}}</span></div>
                    <div class="record-grid">
                      <div class="record-field"><span class="label">Price</span><span class="value">{{pv.platformPrice}}</span></div>
                      <div class="record-field"><span class="label">ASIN/ID</span><span class="value">{{pv.asinOrPlatformId}}</span></div>
                      <div class="record-field"><span class="label">Updated</span><span class="value">{{pv.lastUpdated}}</span></div>
                    </div>
                  </div>
                }
                @if(!f.platformVariants.length) { <div class="empty-state"><p>No variants</p></div> }
              </div>
            }
            @if(tab()==='logs') {
              <div class="card"><h2 class="section-title">Upload Logs</h2>
                @if(!f.uploadLogs.length) { <div class="empty-state"><p>No events</p></div> }
                <table class="data-table" *ngIf="f.uploadLogs.length"><thead><tr><th>Event</th><th>Time</th><th>By</th><th>Status</th></tr></thead>
                  <tbody>@for(ul of f.uploadLogs; track ul.id) {
                    <tr><td class="td-primary">{{ul.eventType}}</td><td>{{ul.timestamp}}</td><td>{{ul.performedBy}}</td>
                      <td><span class="status" [ngClass]="ul.status==='Success'?'status-green':'status-red'">{{ul.status}}</span></td></tr>
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
export class VaultFormatsPageComponent {
  private vs = inject(AuthorVaultService);
  allFormats = computed(() => {
    const fs: BookFormat[] = [];
    for (const i of this.vs.company().imprints) for (const p of i.penNames) for (const s of p.series) for (const b of s.books) for (const lb of b.languageBranches) fs.push(...lb.formats);
    return fs;
  });
  selected = signal<BookFormat | null>(null);
  tab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'specs',label:'Specs'},{id:'kdpselect',label:'KDP Select'},{id:'pricing',label:'Pricing'},{id:'variants',label:'Platforms'},{id:'logs',label:'Logs'}];
  get liveCount() { return this.allFormats().filter(f=>f.specs.status==='Live').length; }
  get totalVariants() { return this.allFormats().reduce((a,f)=>a+f.platformVariants.length,0); }
  get totalLogs() { return this.allFormats().reduce((a,f)=>a+f.uploadLogs.length,0); }
  selectItem(f: BookFormat) { this.selected.set(f); this.tab.set('specs'); }
  onTabClick(id: string) { if (id === 'dashboard') { this.selected.set(null); } this.tab.set(id); }
}
