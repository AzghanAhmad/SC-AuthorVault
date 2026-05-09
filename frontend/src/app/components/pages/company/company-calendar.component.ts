import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ImportantDate {
  id: string;
  title: string;
  category: 'Tax' | 'Domain' | 'ISBN' | 'Software' | 'Trademark' | 'Contract' | 'Filing';
  dueDate: string;
  notes: string;
  recurring: boolean;
}

@Component({
  selector: 'app-company-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Important Dates</h1>
          <p class="page-subtitle">Tax deadlines, renewals, filings, and contract dates — all in one place</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="filter-bar">
        <select [(ngModel)]="filterCat" class="filter-select">
          <option value="">All Categories</option>
          <option value="Tax">Tax Deadlines</option>
          <option value="Domain">Domain Renewals</option>
          <option value="ISBN">ISBN Purchases</option>
          <option value="Software">Software Renewals</option>
          <option value="Trademark">Trademark Renewals</option>
          <option value="Contract">Contract Renewals</option>
          <option value="Filing">Annual Filings</option>
        </select>
        <div class="legend">
          <span class="legend-dot red"></span><span>Due within 30 days</span>
          <span class="legend-dot amber"></span><span>Due within 90 days</span>
          <span class="legend-dot green"></span><span>90+ days away</span>
        </div>
      </div>

      <!-- Date list -->
      <div class="dates-list">
        <div class="date-card" *ngFor="let d of filtered()" [class]="'urgency-' + getUrgency(d.dueDate)">
          <div class="date-left">
            <div class="date-badge" [class]="'urgency-' + getUrgency(d.dueDate)">
              <span class="date-day">{{ getDay(d.dueDate) }}</span>
              <span class="date-month">{{ getMonth(d.dueDate) }}</span>
            </div>
          </div>
          <div class="date-body">
            <div class="date-title">{{ d.title }}</div>
            <div class="date-meta">
              <span class="cat-tag" [class]="'cat-' + d.category.toLowerCase()">{{ d.category }}</span>
              <span class="days-until" [class]="'urgency-text-' + getUrgency(d.dueDate)">
                {{ getDaysUntil(d.dueDate) === 0 ? 'Today!' : getDaysUntil(d.dueDate) < 0 ? 'Overdue' : getDaysUntil(d.dueDate) + ' days away' }}
              </span>
              <span class="recurring-tag" *ngIf="d.recurring">↻ Recurring</span>
            </div>
            <p class="date-notes" *ngIf="d.notes">{{ d.notes }}</p>
          </div>
          <div class="date-right">
            <span class="full-date">{{ formatDate(d.dueDate) }}</span>
          </div>
        </div>
        <div class="empty-state" *ngIf="filtered().length === 0">
          <p>No dates in this category.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { width: 100%; animation: fadeInUp .4s ease both; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .page-subtitle { font-size: .9rem; color: var(--text-muted); margin: 0; }

    .filter-bar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filter-select { padding: .6rem 2rem .6rem .875rem; border: 1.5px solid var(--border-color); border-radius: 9px; font-size: .8125rem; font-family: inherit; color: var(--text-secondary); background: var(--surface); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right .6rem center; appearance: none; cursor: pointer; outline: none; }
    .legend { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--text-muted); margin-left: auto; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; margin-left: .5rem; }
    .legend-dot.red { background: #ef4444; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-dot.green { background: #10b981; }

    .dates-list { display: flex; flex-direction: column; gap: .75rem; }
    .date-card {
      display: flex; align-items: flex-start; gap: 1.25rem;
      background: var(--surface); border: 1px solid var(--border-light);
      border-left: 4px solid var(--border-color);
      border-radius: 12px; padding: 1.1rem 1.25rem;
      box-shadow: var(--shadow-sm); transition: box-shadow .2s;
    }
    .date-card:hover { box-shadow: var(--shadow-md); }
    .date-card.urgency-red { border-left-color: #ef4444; }
    .date-card.urgency-amber { border-left-color: #f59e0b; }
    .date-card.urgency-green { border-left-color: #10b981; }

    .date-badge {
      width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: var(--background); border: 1px solid var(--border-light);
    }
    .date-badge.urgency-red { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.2); }
    .date-badge.urgency-amber { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.2); }
    .date-badge.urgency-green { background: rgba(16,185,129,.08); border-color: rgba(16,185,129,.2); }
    .date-day { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .date-month { font-size: .625rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }

    .date-body { flex: 1; min-width: 0; }
    .date-title { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin-bottom: .375rem; }
    .date-meta { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; margin-bottom: .25rem; }
    .cat-tag { font-size: .6875rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; letter-spacing: .04em; }
    .cat-tax { background: rgba(239,68,68,.1); color: #dc2626; }
    .cat-domain { background: rgba(59,130,246,.1); color: #2563eb; }
    .cat-isbn { background: rgba(139,92,246,.1); color: #7c3aed; }
    .cat-software { background: rgba(20,184,166,.1); color: #0d9488; }
    .cat-trademark { background: rgba(245,158,11,.1); color: #d97706; }
    .cat-contract { background: rgba(99,102,241,.1); color: #4f46e5; }
    .cat-filing { background: rgba(16,185,129,.1); color: #059669; }
    .days-until { font-size: .8125rem; font-weight: 600; }
    .urgency-text-red { color: #ef4444; }
    .urgency-text-amber { color: #f59e0b; }
    .urgency-text-green { color: #10b981; }
    .recurring-tag { font-size: .75rem; color: var(--text-muted); }
    .date-notes { font-size: .8125rem; color: var(--text-muted); margin: 0; }
    .date-right { flex-shrink: 0; }
    .full-date { font-size: .8125rem; color: var(--text-muted); white-space: nowrap; }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }

    @keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @media (max-width: 600px) { .date-card { flex-wrap: wrap; } .date-right { width: 100%; } }
  `]
})
export class CompanyCalendarComponent {
  filterCat = '';

  // Reference date: May 9, 2026
  dates: ImportantDate[] = [
    { id: '1', title: 'Q2 Estimated Tax Payment', category: 'Tax', dueDate: '2026-06-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true },
    { id: '2', title: 'authorvaultpress.com Domain Renewal', category: 'Domain', dueDate: '2026-05-28', notes: 'Registrar: Namecheap — auto-renew enabled', recurring: true },
    { id: '3', title: 'Delaware Annual Report Filing', category: 'Filing', dueDate: '2026-06-01', notes: 'File via Delaware Division of Corporations', recurring: true },
    { id: '4', title: 'AuthorVault Press™ Trademark Renewal', category: 'Trademark', dueDate: '2026-07-15', notes: 'USPTO Section 8 & 15 Declaration due', recurring: false },
    { id: '5', title: 'ISBN Block Purchase (next 100)', category: 'ISBN', dueDate: '2026-08-01', notes: 'Current block running low — ~15 remaining', recurring: false },
    { id: '6', title: 'QuickBooks Online Subscription', category: 'Software', dueDate: '2026-05-20', notes: '$30/mo — annual renewal option available', recurring: true },
    { id: '7', title: 'Editor Contract Renewal — Sarah Mitchell', category: 'Contract', dueDate: '2026-06-30', notes: 'Review rates and terms before renewal', recurring: false },
    { id: '8', title: 'Q3 Estimated Tax Payment', category: 'Tax', dueDate: '2026-09-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true },
    { id: '9', title: 'eleanorvanc.com SSL Certificate Renewal', category: 'Domain', dueDate: '2026-05-15', notes: 'Let\'s Encrypt — auto-renew via hosting', recurring: true },
    { id: '10', title: 'BookFunnel Subscription Renewal', category: 'Software', dueDate: '2026-07-01', notes: 'Mid-level plan — $20/mo', recurring: true },
    { id: '11', title: 'NY State Business Registration Renewal', category: 'Filing', dueDate: '2026-09-01', notes: 'Biennial statement due', recurring: true },
    { id: '12', title: 'Narrator Contract — Crown of Thorns', category: 'Contract', dueDate: '2026-10-15', notes: 'Royalty share agreement expires', recurring: false },
  ];

  filtered() {
    return this.dates
      .filter(d => !this.filterCat || d.category === this.filterCat)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  getDaysUntil(dateStr: string): number {
    const today = new Date('2026-05-09');
    const due = new Date(dateStr);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getUrgency(dateStr: string): string {
    const days = this.getDaysUntil(dateStr);
    if (days <= 30) return 'red';
    if (days <= 90) return 'amber';
    return 'green';
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  getMonth(dateStr: string): string {
    return new Date(dateStr).toLocaleString('default', { month: 'short' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
