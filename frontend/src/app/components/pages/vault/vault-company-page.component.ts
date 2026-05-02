import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthorVaultService } from '../../../services/author-vault.service';

@Component({
  selector: 'app-vault-company-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1 class="page-title">🏢 {{company().identity.legalName}}</h1>
        <p class="page-subtitle">{{company().identity.entityType}} · {{company().identity.stateOfIncorporation}} · <span class="status status-green">{{company().identity.companyStatus}}</span></p>
      </div>

      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{company().imprints.length}}</div><div class="stat-label">Imprints</div></div>
        <div class="stat-card"><div class="stat-value">{{penNameCount}}</div><div class="stat-label">Pen Names</div></div>
        <div class="stat-card"><div class="stat-value">{{bookCount}}</div><div class="stat-label">Total Books</div></div>
        <div class="stat-card"><div class="stat-value">{{company().identity.companyStatus}}</div><div class="stat-label">Status</div></div>
      </div>

      <div class="vault-layout">
        <nav class="vault-nav">
          @for(t of tabs; track t.id) { <button class="tab-item" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)">{{t.label}}</button> }
        </nav>
        <div class="vault-content">
          @if(activeTab()==='dashboard') {
            <div class="card"><h2 class="section-title">Company Overview</h2>
              <div class="entity-list">
                @for(imp of company().imprints; track imp.id) {
                  <div class="entity-card" (click)="goTo('/vault/imprints')">
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
          @if(activeTab()==='identity') {
            <div class="card"><h2 class="section-title">Company Identity</h2>
              <div class="form-grid">
                <div class="form-group"><span class="form-label">Legal Name</span><div class="form-value">{{company().identity.legalName}}</div></div>
                <div class="form-group"><span class="form-label">DBA Name(s)</span><div class="form-value">{{company().identity.dbaNames}}</div></div>
                <div class="form-group"><span class="form-label">Entity Type</span><div class="form-value">{{company().identity.entityType}}</div></div>
                <div class="form-group"><span class="form-label">State</span><div class="form-value">{{company().identity.stateOfIncorporation}}</div></div>
                <div class="form-group"><span class="form-label">Formed</span><div class="form-value">{{company().identity.dateOfFormation}}</div></div>
                <div class="form-group"><span class="form-label">EIN</span><div class="form-value">{{company().identity.einTaxId}}</div></div>
                <div class="form-group"><span class="form-label">Registered Agent</span><div class="form-value">{{company().identity.registeredAgent}}</div></div>
                <div class="form-group"><span class="form-label">Fiscal Year End</span><div class="form-value">{{company().identity.fiscalYearEnd}}</div></div>
                <div class="form-group"><span class="form-label">Phone</span><div class="form-value">{{company().identity.phone}}</div></div>
                <div class="form-group"><span class="form-label">Email</span><div class="form-value">{{company().identity.primaryEmail}}</div></div>
                <div class="form-group full"><span class="form-label">Address</span><div class="form-value">{{company().identity.primaryAddress}}</div></div>
                <div class="form-group"><span class="form-label">Website</span><div class="form-value">{{company().identity.website}}</div></div>
              </div>
            </div>
          }
          @if(activeTab()==='ownership') {
            <div class="card"><h2 class="section-title">Ownership & Partners</h2>
              <table class="data-table"><thead><tr><th>Name</th><th>Ownership %</th><th>Role</th></tr></thead>
                <tbody>@for(o of company().ownership.owners; track o.name) {
                  <tr><td class="td-primary">{{o.name}}</td><td>{{o.ownershipPercent}}%</td><td>{{o.role}}</td></tr>
                }</tbody>
              </table>
            </div>
            <div class="card"><h2 class="section-title">Documents</h2>
              <div class="form-grid">
                <div class="form-group"><span class="form-label">Operating Agreement</span><div class="form-value">{{company().ownership.operatingAgreementFile || '—'}}</div></div>
                <div class="form-group"><span class="form-label">S-Corp Election</span><div class="form-value">{{company().ownership.sCorpElectionFile || '—'}}</div></div>
              </div>
            </div>
          }
          @if(activeTab()==='financial') {
            <div class="card"><h2 class="section-title">Financial & Tax Records</h2>
              <div class="form-grid">
                <div class="form-group"><span class="form-label">Bank(s)</span><div class="form-value">{{company().financial.bankNames}}</div></div>
                <div class="form-group"><span class="form-label">Checking</span><div class="form-value">{{company().financial.businessChecking}}</div></div>
                <div class="form-group"><span class="form-label">Savings</span><div class="form-value">{{company().financial.businessSavings}}</div></div>
                <div class="form-group"><span class="form-label">Processors</span><div class="form-value">{{company().financial.paymentProcessors}}</div></div>
                <div class="form-group"><span class="form-label">Software</span><div class="form-value">{{company().financial.accountingSoftware}}</div></div>
                <div class="form-group"><span class="form-label">CPA</span><div class="form-value">{{company().financial.cpaName}}</div></div>
                <div class="form-group full"><span class="form-label">Tax Schedule</span><div class="form-value">{{company().financial.quarterlyTaxSchedule}}</div></div>
                <div class="form-group full"><span class="form-label">State Registrations</span><div class="form-value">{{company().financial.stateTaxRegistrations}}</div></div>
              </div>
            </div>
          }
          @if(activeTab()==='contracts') {
            <div class="card"><h2 class="section-title">Contracts & Legal</h2>
              <div class="form-grid">
                <div class="form-group"><span class="form-label">Trademarks</span><div class="form-value">{{company().contractsLegal.trademarkRegistrations}}</div></div>
                <div class="form-group"><span class="form-label">Copyrights</span><div class="form-value">{{company().contractsLegal.copyrightAssignments}}</div></div>
                <div class="form-group"><span class="form-label">Insurance</span><div class="form-value">{{company().contractsLegal.insurancePolicies}}</div></div>
                <div class="form-group"><span class="form-label">Attorney</span><div class="form-value">{{company().contractsLegal.attorneyName}}</div></div>
                <div class="form-group"><span class="form-label">Attorney Contact</span><div class="form-value">{{company().contractsLegal.attorneyContact}}</div></div>
              </div>
            </div>
          }
          @if(activeTab()==='imprints') {
            <div class="card"><h2 class="section-title">Imprints</h2>
              <div class="entity-list">
                @for(imp of company().imprints; track imp.id) {
                  <div class="entity-card" (click)="goTo('/vault/imprints')">
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
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../company-vault/company-vault.component.css']
})
export class VaultCompanyPageComponent {
  private vs = inject(AuthorVaultService);
  private router = inject(Router);
  company = this.vs.company;
  activeTab = signal('dashboard');
  tabs = [{id:'dashboard',label:'Dashboard'},{id:'identity',label:'Identity & Legal'},{id:'ownership',label:'Ownership'},{id:'financial',label:'Financial & Tax'},{id:'contracts',label:'Contracts & Legal'},{id:'imprints',label:'Imprints'}];
  get penNameCount() { return this.company().imprints.reduce((a,i)=>a+i.penNames.length,0); }
  get bookCount() { return this.company().imprints.reduce((a,i)=>a+i.penNames.reduce((b,p)=>b+p.series.reduce((c,s)=>c+s.books.length,0),0),0); }
  goTo(route: string) { this.router.navigate([route]); }
}
