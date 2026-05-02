import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookFormat } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-format',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-header">
      <h1 class="page-title">📄 {{format.specs.formatType}}</h1>
      <p class="page-subtitle">v{{format.specs.versionNumber}} · <span class="status" [ngClass]="format.specs.status==='Live'?'status-green':'status-amber'">{{format.specs.status}}</span></p>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="stat-value">{{format.platformVariants.length}}</div><div class="stat-label">Platform Variants</div></div>
      <div class="stat-card"><div class="stat-value">{{format.pricingHistory.length}}</div><div class="stat-label">Price Changes</div></div>
      <div class="stat-card"><div class="stat-value">{{format.uploadLogs.length}}</div><div class="stat-label">Upload Events</div></div>
      <div class="stat-card"><div class="stat-value">{{format.specs.fileSize || '—'}}</div><div class="stat-label">File Size</div></div>
    </div>
    <div class="vault-layout">
      <nav class="vault-nav">
        @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="activeTab===t.id" (click)="tabChange.emit(t.id)">{{t.label}}</button> }
      </nav>
      <div class="vault-content">
        @if(activeTab==='specs') {
          <div class="card"><h2 class="section-title">Format Specs</h2>
            <div class="form-grid">
              <div class="form-group"><span class="form-label">Format Type</span><div class="form-value">{{format.specs.formatType}}</div></div>
              <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{format.specs.status}}</div></div>
              <div class="form-group"><span class="form-label">Version</span><div class="form-value">{{format.specs.versionNumber}}</div></div>
              <div class="form-group"><span class="form-label">Word Count</span><div class="form-value">{{format.specs.wordCount | number}}</div></div>
              <div class="form-group"><span class="form-label">Page Count</span><div class="form-value">{{format.specs.pageCount}}</div></div>
              <div class="form-group"><span class="form-label">File Size</span><div class="form-value">{{format.specs.fileSize || '—'}}</div></div>
              <div class="form-group"><span class="form-label">DRM</span><div class="form-value">{{format.specs.drmPreference || '—'}}</div></div>
              @if(format.specs.trimSize) { <div class="form-group"><span class="form-label">Trim Size</span><div class="form-value">{{format.specs.trimSize}}</div></div> }
              @if(format.specs.paperType) { <div class="form-group"><span class="form-label">Paper Type</span><div class="form-value">{{format.specs.paperType}}</div></div> }
              @if(format.specs.printFinish) { <div class="form-group"><span class="form-label">Finish</span><div class="form-value">{{format.specs.printFinish}}</div></div> }
              @if(format.specs.interiorType) { <div class="form-group"><span class="form-label">Interior</span><div class="form-value">{{format.specs.interiorType}}</div></div> }
              @if(format.specs.audioRuntime) { <div class="form-group"><span class="form-label">Runtime</span><div class="form-value">{{format.specs.audioRuntime}}</div></div> }
            </div>
          </div>
        }
        @if(activeTab==='kdpselect') {
          <div class="card"><h2 class="section-title">KDP Select Enrollment</h2>
            @if(format.kdpSelect) {
              <div class="form-grid">
                <div class="form-group"><span class="form-label">Status</span><div class="form-value">{{format.kdpSelect.enrollmentStatus}}</div></div>
                <div class="form-group"><span class="form-label">Period Start</span><div class="form-value">{{format.kdpSelect.periodStart || '—'}}</div></div>
                <div class="form-group"><span class="form-label">Period End</span><div class="form-value">{{format.kdpSelect.periodEnd || '—'}}</div></div>
                <div class="form-group"><span class="form-label">Auto-Renew</span><div class="form-value">{{format.kdpSelect.autoRenew ? 'On' : 'Off'}}</div></div>
                <div class="form-group"><span class="form-label">KENP Pages</span><div class="form-value">{{format.kdpSelect.kenpPages | number}}</div></div>
                <div class="form-group"><span class="form-label">KENP Reads</span><div class="form-value">{{format.kdpSelect.kenpReads | number}}</div></div>
                <div class="form-group"><span class="form-label">KENP Revenue</span><div class="form-value">{{format.kdpSelect.kenpRevenue}}</div></div>
                <div class="form-group"><span class="form-label">Strategy</span><div class="form-value">{{format.kdpSelect.wideStrategyFlag || '—'}}</div></div>
              </div>
            } @else {
              <div class="empty-state"><div class="empty-icon">📋</div><p>Not enrolled in KDP Select</p></div>
            }
          </div>
        }
        @if(activeTab==='pricing') {
          <div class="card"><h2 class="section-title">Pricing History</h2>
            <table class="data-table"><thead><tr><th>Regular</th><th>Launch</th><th>Pre-order</th><th>Sale</th><th>Currency</th><th>Start</th><th>Reason</th></tr></thead>
              <tbody>@for(p of format.pricingHistory; track p.startDate) {
                <tr><td class="td-primary">{{p.regularPrice}}</td><td>{{p.launchPrice}}</td><td>{{p.preOrderPrice || '—'}}</td><td>{{p.salePrice || '—'}}</td><td>{{p.currency}}</td><td>{{p.startDate}}</td><td>{{p.reason}}</td></tr>
              }</tbody>
            </table>
          </div>
        }
        @if(activeTab==='variants') {
          <div class="card"><h2 class="section-title">Platform Variants</h2>
            @if(!format.platformVariants.length) { <div class="empty-state"><div class="empty-icon">🌍</div><p>No platform variants</p></div> }
            @for(pv of format.platformVariants; track pv.id) {
              <div class="record-card">
                <div class="record-header"><h3 class="record-title">{{pv.platformName}} ({{pv.storeRegion}})</h3>
                  <span class="status" [ngClass]="pv.uploadStatus==='Live'?'status-green':'status-amber'">{{pv.uploadStatus}}</span></div>
                <div class="record-grid">
                  <div class="record-field"><span class="label">Title</span><span class="value">{{pv.platformTitle}}</span></div>
                  <div class="record-field"><span class="label">Price</span><span class="value">{{pv.platformPrice}}</span></div>
                  <div class="record-field"><span class="label">ASIN/ID</span><span class="value">{{pv.asinOrPlatformId}}</span></div>
                  <div class="record-field"><span class="label">Keywords</span><span class="value">{{pv.keywords || '—'}}</span></div>
                  <div class="record-field"><span class="label">Categories</span><span class="value">{{pv.categories || '—'}}</span></div>
                  <div class="record-field"><span class="label">Last Updated</span><span class="value">{{pv.lastUpdated}}</span></div>
                </div>
              </div>
            }
          </div>
        }
        @if(activeTab==='logs') {
          <div class="card"><h2 class="section-title">Upload Logs</h2>
            @if(!format.uploadLogs.length) { <div class="empty-state"><div class="empty-icon">📝</div><p>No upload events logged</p></div> }
            <table class="data-table" *ngIf="format.uploadLogs.length"><thead><tr><th>Event</th><th>Timestamp</th><th>By</th><th>Status</th><th>Response</th></tr></thead>
              <tbody>@for(ul of format.uploadLogs; track ul.id) {
                <tr><td class="td-primary">{{ul.eventType}}</td><td>{{ul.timestamp}}</td><td>{{ul.performedBy}}</td>
                  <td><span class="status" [ngClass]="ul.status==='Success'?'status-green':ul.status==='Failed'?'status-red':'status-amber'">{{ul.status}}</span></td>
                  <td>{{ul.platformResponse}}</td></tr>
              }</tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['../company-vault.component.css']
})
export class VaultFormatComponent {
  @Input() format!: BookFormat;
  @Input() activeTab = 'specs';
  @Output() tabChange = new EventEmitter<string>();
  tabs = [{ id:'specs', label:'Specs' },{ id:'kdpselect', label:'KDP Select' },{ id:'pricing', label:'Pricing' },{ id:'variants', label:'Platforms' },{ id:'logs', label:'Logs' }];
}
