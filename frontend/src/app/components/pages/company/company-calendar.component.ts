import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ImportantDate {
  id: string;
  title: string;
  category: 'Tax' | 'Domain' | 'ISBN' | 'Software' | 'Trademark' | 'Contract' | 'Filing';
  dueDate: string;
  notes: string;
  recurring: boolean;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: ImportantDate[];
}

const STORAGE_KEY = 'av_important_dates_v1';

const DEFAULT_DATES: ImportantDate[] = [
  { id: '1', title: 'Q2 Estimated Tax Payment', category: 'Tax', dueDate: '2026-06-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true },
  { id: '2', title: 'authorvaultpress.com Domain Renewal', category: 'Domain', dueDate: '2026-05-28', notes: 'Registrar: Namecheap — auto-renew enabled', recurring: true },
  { id: '3', title: 'Delaware Annual Report Filing', category: 'Filing', dueDate: '2026-06-01', notes: 'File via Delaware Division of Corporations', recurring: true },
  { id: '4', title: 'AuthorVault Press™ Trademark Renewal', category: 'Trademark', dueDate: '2026-07-15', notes: 'USPTO Section 8 & 15 Declaration due', recurring: false },
  { id: '5', title: 'ISBN Block Purchase (next 100)', category: 'ISBN', dueDate: '2026-08-01', notes: 'Current block running low', recurring: false },
  { id: '6', title: 'QuickBooks Online Subscription', category: 'Software', dueDate: '2026-05-20', notes: '$30/mo — annual renewal option available', recurring: true },
  { id: '7', title: 'Editor Contract Renewal', category: 'Contract', dueDate: '2026-06-30', notes: 'Review rates and terms before renewal', recurring: false },
  { id: '8', title: 'Q3 Estimated Tax Payment', category: 'Tax', dueDate: '2026-09-15', notes: 'Federal estimated tax — Form 1040-ES', recurring: true },
  { id: '9', title: 'eleanorvanc.com SSL Renewal', category: 'Domain', dueDate: '2026-05-15', notes: "Let's Encrypt — auto-renew via hosting", recurring: true },
  { id: '10', title: 'BookFunnel Subscription Renewal', category: 'Software', dueDate: '2026-07-01', notes: 'Mid-level plan — $20/mo', recurring: true },
  { id: '11', title: 'NY State Business Registration', category: 'Filing', dueDate: '2026-09-01', notes: 'Biennial statement due', recurring: true },
  { id: '12', title: 'Narrator Contract — Crown of Thorns', category: 'Contract', dueDate: '2026-10-15', notes: 'Royalty share agreement expires', recurring: false },
];

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
        <div class="header-actions">
          <button type="button" class="btn-secondary" (click)="openAddModal()">+ Add date</button>
          <button type="button" class="btn-primary" [class.active]="viewMode() === 'calendar'" (click)="viewMode.set('calendar')">
            Calendar
          </button>
          <button type="button" class="btn-secondary" [class.active]="viewMode() === 'list'" (click)="viewMode.set('list')">
            List
          </button>
        </div>
      </div>

      <div class="toolbar">
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
        @if (viewMode() === 'list') {
          <div class="legend">
            <span class="legend-dot red"></span><span>Due within 30 days</span>
            <span class="legend-dot amber"></span><span>Due within 90 days</span>
            <span class="legend-dot green"></span><span>90+ days away</span>
          </div>
        }
      </div>

      @if (viewMode() === 'calendar') {
        <div class="cal-card">
          <div class="cal-header">
            <h2 class="cal-month-title">{{ monthTitle() }}</h2>
            <div class="cal-controls">
              <button type="button" class="cal-today-btn" (click)="goToday()">Today</button>
              <div class="cal-nav">
                <button type="button" class="cal-arrow" (click)="prevMonth()" aria-label="Previous month">&lsaquo;</button>
                <button type="button" class="cal-arrow" (click)="nextMonth()" aria-label="Next month">&rsaquo;</button>
              </div>
              <div class="view-segment">
                <button type="button" [class.active]="calView() === 'month'" (click)="calView.set('month')">Monthly</button>
                <button type="button" [class.active]="calView() === 'year'" (click)="calView.set('year')">Yearly</button>
              </div>
            </div>
          </div>

          @if (calView() === 'month') {
            <div class="cal-grid-body">
              <div class="cal-weekdays">
                @for (wd of weekDays; track wd) {
                  <span>{{ wd }}</span>
                }
              </div>
              <div class="cal-grid">
                @for (day of calendarDays(); track day.date.getTime()) {
                  <div class="cal-cell" [class.other-month]="!day.inMonth" [class.today]="day.isToday">
                    <span class="cal-day-num">{{ day.date.getDate() }}</span>
                    <div class="cal-events">
                      @for (ev of day.events; track ev.id) {
                        <button
                          type="button"
                          class="cal-event"
                          [class]="'cat-stripe-' + ev.category.toLowerCase()"
                          [title]="ev.title + ' (' + ev.category + ')'"
                          (click)="selectEvent(ev)">
                          <span class="cal-event-title">{{ ev.title }}</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="year-grid">
              @for (m of yearMonths(); track m.index) {
                <button type="button" class="year-month-card" (click)="jumpToMonth(m.index)">
                  <span class="year-month-name">{{ m.label }}</span>
                  <span class="year-month-count">{{ m.count }} date{{ m.count === 1 ? '' : 's' }}</span>
                </button>
              }
            </div>
          }
        </div>
      }

      @if (viewMode() === 'list') {
        <div class="dates-list">
          @for (d of filtered(); track d.id) {
            <div class="date-card" [class]="'urgency-' + getUrgency(d.dueDate)">
              <div class="date-left">
                <div class="date-badge" [class]="'urgency-' + getUrgency(d.dueDate)">
                  <span class="date-day">{{ getDay(d.dueDate) }}</span>
                  <span class="date-month">{{ getMonthShort(d.dueDate) }}</span>
                </div>
              </div>
              <div class="date-body">
                <div class="date-title">{{ d.title }}</div>
                <div class="date-meta">
                  <span class="cat-tag" [class]="'cat-' + d.category.toLowerCase()">{{ d.category }}</span>
                  <span class="days-until" [class]="'urgency-text-' + getUrgency(d.dueDate)">
                    {{ daysUntilLabel(d.dueDate) }}
                  </span>
                  @if (d.recurring) { <span class="recurring-tag">&#8635; Recurring</span> }
                </div>
                @if (d.notes) { <p class="date-notes">{{ d.notes }}</p> }
              </div>
              <div class="date-right">
                <span class="full-date">{{ formatDate(d.dueDate) }}</span>
                <button type="button" class="link-btn" (click)="deleteDate(d.id)">Remove</button>
              </div>
            </div>
          }
          @if (filtered().length === 0) {
            <div class="empty-state"><p>No dates in this category. Add one or switch filters.</p></div>
          }
        </div>
      }

    </div>


    @if (showAddModal()) {
      <div class="modal-backdrop" (click)="closeAddModal()">
        <div class="modal-panel" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h3>{{ editingId() ? 'Edit date' : 'Add important date' }}</h3>
          <div class="form-group">
            <label class="form-label">Title</label>
            <input class="form-input" [(ngModel)]="form.title" placeholder="e.g. Domain renewal" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Due date</label>
              <input type="date" class="form-input" [(ngModel)]="form.dueDate" />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" [(ngModel)]="form.category">
                <option value="Tax">Tax</option>
                <option value="Domain">Domain</option>
                <option value="ISBN">ISBN</option>
                <option value="Software">Software</option>
                <option value="Trademark">Trademark</option>
                <option value="Contract">Contract</option>
                <option value="Filing">Filing</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes (optional)</label>
            <textarea class="form-input" rows="3" [(ngModel)]="form.notes"></textarea>
          </div>
          <label class="check-row">
            <input type="checkbox" [(ngModel)]="form.recurring" />
            <span>Recurring annually</span>
          </label>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="closeAddModal()">Cancel</button>
            <button type="button" class="btn-primary" (click)="saveDate()" [disabled]="!form.title.trim() || !form.dueDate">
              {{ editingId() ? 'Save' : 'Add date' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page { width: 100%; animation: fadeInUp .4s ease both; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .page-subtitle { font-size: .9rem; color: var(--text-muted); margin: 0; }
    .header-actions { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
    .btn-primary, .btn-secondary {
      padding: .55rem 1rem; border-radius: 9px; font-size: .875rem; font-weight: 600;
      font-family: inherit; cursor: pointer; border: 1.5px solid transparent; transition: all .2s;
    }
    .btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-primary.active { box-shadow: 0 0 0 3px rgba(56, 189, 248, .25); }
    .btn-secondary { background: var(--surface); color: var(--text-secondary); border-color: var(--border-color); }
    .btn-secondary:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
    .btn-secondary.active { background: var(--primary-light); border-color: var(--accent-blue); color: var(--primary); }

    .toolbar { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
    .filter-select {
      padding: .6rem 2rem .6rem .875rem; border: 1.5px solid var(--border-color); border-radius: 9px;
      font-size: .8125rem; font-family: inherit; color: var(--text-secondary); background: var(--surface);
      appearance: none; cursor: pointer;
    }
    .legend { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; color: var(--text-muted); margin-left: auto; flex-wrap: wrap; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; margin-left: .5rem; }
    .legend-dot.red { background: #ef4444; }
    .legend-dot.amber { background: #f59e0b; }
    .legend-dot.green { background: #10b981; }

    /* Calendar card */
    .cal-card {
      background: var(--surface); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 1.25rem 0 0; overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .cal-header {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      margin-bottom: 1.25rem; padding: 0 1.5rem;
    }
    .cal-grid-body {
      border-top: 1px solid var(--border-color);
      width: 100%;
      overflow: hidden;
    }
    .cal-month-title { font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin: 0; text-transform: capitalize; }
    .cal-controls { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
    .cal-today-btn {
      padding: .45rem .85rem; border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--surface); font-size: .8125rem; font-weight: 600; font-family: inherit; cursor: pointer; color: var(--text-secondary);
    }
    .cal-today-btn:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
    .cal-nav { display: flex; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
    .cal-arrow {
      width: 36px; height: 34px; border: none; background: var(--background); cursor: pointer;
      font-size: 1.25rem; color: var(--text-secondary); font-family: inherit;
    }
    .cal-arrow:hover { background: var(--primary-light); color: var(--primary); }
    .cal-arrow + .cal-arrow { border-left: 1px solid var(--border-color); }
    .view-segment {
      display: flex; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
    }
    .view-segment button {
      padding: .45rem .75rem; border: none; background: var(--background); font-size: .75rem; font-weight: 600;
      font-family: inherit; cursor: pointer; color: var(--text-muted);
    }
    .view-segment button.active { background: rgb(22, 38, 62); color: #fff; }
    .view-segment button + button { border-left: 1px solid var(--border-color); }

    .cal-weekdays {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 0;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 0;
    }
    .cal-weekdays span {
      min-width: 0;
      text-align: center; font-size: .7rem; font-weight: 700; letter-spacing: .06em;
      color: var(--text-muted); padding: .5rem 0; text-transform: uppercase;
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      grid-auto-rows: 6.5rem;
      width: 100%;
      border-left: 1px solid var(--border-color);
    }
    .cal-cell {
      min-width: 0;
      max-width: 100%;
      height: 6.5rem;
      min-height: 6.5rem;
      max-height: 6.5rem;
      overflow: hidden;
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
      padding: .35rem .35rem .4rem;
      background: var(--surface);
      position: relative;
      box-sizing: border-box;
    }
    .cal-cell.other-month { background: var(--background-subtle); opacity: .7; }
    .cal-cell.today { background: rgba(56, 189, 248, .06); }
    .cal-cell.today .cal-day-num { color: var(--accent-blue); font-weight: 700; }
    .cal-day-num {
      position: absolute; top: .35rem; right: .45rem; font-size: .75rem; color: var(--text-muted); font-weight: 500;
    }
    .cal-events {
      display: flex;
      flex-direction: column;
      gap: .2rem;
      margin-top: 1.35rem;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .cal-event {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      text-align: left;
      height: 1.5rem;
      min-height: 1.5rem;
      max-height: 1.5rem;
      box-sizing: border-box;
      padding: 0 .4rem 0 .5rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      background: rgb(22, 38, 62);
      color: #fff;
      font-family: inherit;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
    }
    .cal-event::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    }
    .cat-stripe-tax::before { background: #ef4444; }
    .cat-stripe-domain::before { background: #3b82f6; }
    .cat-stripe-isbn::before { background: #8b5cf6; }
    .cat-stripe-software::before { background: #14b8a6; }
    .cat-stripe-trademark::before { background: #f59e0b; }
    .cat-stripe-contract::before { background: #6366f1; }
    .cat-stripe-filing::before { background: #10b981; }
    .cal-event-title {
      display: block;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      font-size: .65rem;
      font-weight: 600;
      line-height: 1.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .year-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .75rem;
      align-items: stretch; padding: 0 1.5rem 1.5rem;
    }
    .year-month-card {
      display: flex; flex-direction: column; justify-content: center;
      min-height: 5.5rem; height: 100%; padding: 1rem;
      border: 1px solid var(--border-color); border-radius: 10px; background: var(--background);
      text-align: left; cursor: pointer; font-family: inherit; transition: all .2s;
    }
    .year-month-card:hover { border-color: var(--accent-blue); background: var(--primary-light); }
    .year-month-name { display: block; font-weight: 700; font-size: .9rem; color: var(--text-primary); }
    .year-month-count { display: block; font-size: .75rem; color: var(--text-muted); margin-top: .25rem; }

    /* List */
    .dates-list { display: flex; flex-direction: column; gap: .75rem; }
    .date-card {
      display: flex; align-items: flex-start; gap: 1.25rem; background: var(--surface);
      border: 1px solid var(--border-light); border-left: 4px solid var(--border-color);
      border-radius: 12px; padding: 1.1rem 1.25rem; box-shadow: var(--shadow-sm);
    }
    .date-card.urgency-red { border-left-color: #ef4444; }
    .date-card.urgency-amber { border-left-color: #f59e0b; }
    .date-card.urgency-green { border-left-color: #10b981; }
    .date-badge {
      width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: var(--background); border: 1px solid var(--border-light);
    }
    .date-day { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .date-month { font-size: .625rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
    .date-body { flex: 1; min-width: 0; }
    .date-title { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin-bottom: .375rem; }
    .date-meta { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; }
    .cat-tag { font-size: .6875rem; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; }
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
    .recurring-tag, .date-notes { font-size: .75rem; color: var(--text-muted); }
    .date-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: .35rem; }
    .full-date { font-size: .8125rem; color: var(--text-muted); }
    .link-btn { background: none; border: none; color: #ef4444; font-size: .75rem; cursor: pointer; font-family: inherit; }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }

    :host { display: block; position: relative; }
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15, 23, 42, .45); z-index: 10000;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .modal-panel {
      width: 100%; max-width: 440px; background: var(--surface); border-radius: 14px;
      padding: 1.5rem; box-shadow: var(--shadow-xl);
    }
    .modal-panel h3 { margin: 0 0 1rem; font-size: 1.15rem; color: var(--text-primary); }
    .form-group { margin-bottom: .85rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
    .form-label { display: block; font-size: .75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: .35rem; text-transform: uppercase; letter-spacing: .04em; }
    .form-input {
      width: 100%; padding: .55rem .75rem; border: 1.5px solid var(--border-color); border-radius: 8px;
      font-size: .875rem; font-family: inherit; background: var(--surface); color: var(--text-primary);
    }
    .check-row { display: flex; align-items: center; gap: .5rem; font-size: .875rem; color: var(--text-secondary); margin-bottom: 1rem; }
    .modal-actions { display: flex; justify-content: flex-end; gap: .5rem; }

    @keyframes fadeInUp { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 768px) {
      .cal-grid { grid-auto-rows: 5.5rem; }
      .cal-cell { height: 5.5rem; min-height: 5.5rem; max-height: 5.5rem; }
      .cal-event-title { font-size: .6rem; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class CompanyCalendarComponent implements OnInit {
  filterCat = '';
  viewMode = signal<'list' | 'calendar'>('calendar');
  calView = signal<'month' | 'year'>('month');
  viewMonth = signal(new Date());
  showAddModal = signal(false);
  editingId = signal<string | null>(null);

  dates = signal<ImportantDate[]>([]);

  form = {
    title: '',
    dueDate: '',
    category: 'Tax' as ImportantDate['category'],
    notes: '',
    recurring: false,
  };

  readonly weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  filtered = computed(() => {
    const cat = this.filterCat;
    return [...this.dates()]
      .filter(d => !cat || d.category === cat)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  });

  monthTitle = computed(() => {
    return this.viewMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed((): CalendarDay[] => {
    const view = this.viewMonth();
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    const today = this.todayKey();
    const events = this.filtered();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = this.dateKey(date);
      days.push({
        date,
        inMonth: date.getMonth() === month,
        isToday: key === today,
        events: events.filter(e => e.dueDate === key),
      });
    }
    return days;
  });

  yearMonths = computed(() => {
    const year = this.viewMonth().getFullYear();
    const events = this.filtered().filter(e => new Date(e.dueDate).getFullYear() === year);
    return Array.from({ length: 12 }, (_, i) => {
      const count = events.filter(e => new Date(e.dueDate).getMonth() === i).length;
      return {
        index: i,
        label: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'long' }),
        count,
      };
    });
  });

  ngOnInit(): void {
    this.loadDates();
    if (!this.form.dueDate) {
      this.form.dueDate = this.dateKey(new Date());
    }
  }

  private loadDates(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.dates.set(raw ? JSON.parse(raw) : [...DEFAULT_DATES]);
    } catch {
      this.dates.set([...DEFAULT_DATES]);
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.dates()));
  }

  private todayKey(): string {
    return this.dateKey(new Date());
  }

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDaysUntil(dateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getUrgency(dateStr: string): string {
    const days = this.getDaysUntil(dateStr);
    if (days < 0) return 'red';
    if (days <= 30) return 'red';
    if (days <= 90) return 'amber';
    return 'green';
  }

  daysUntilLabel(dateStr: string): string {
    const d = this.getDaysUntil(dateStr);
    if (d === 0) return 'Today!';
    if (d < 0) return 'Overdue';
    return `${d} days away`;
  }

  getDay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').getDate().toString();
  }

  getMonthShort(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleString('default', { month: 'short' });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  prevMonth(): void {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() - 1);
    this.viewMonth.set(d);
  }

  nextMonth(): void {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() + 1);
    this.viewMonth.set(d);
  }

  goToday(): void {
    this.viewMonth.set(new Date());
  }

  jumpToMonth(monthIndex: number): void {
    const d = new Date(this.viewMonth());
    d.setMonth(monthIndex);
    this.viewMonth.set(d);
    this.calView.set('month');
  }

  openAddModal(prefillDate?: string): void {
    this.editingId.set(null);
    this.form = {
      title: '',
      dueDate: prefillDate || this.dateKey(new Date()),
      category: 'Tax',
      notes: '',
      recurring: false,
    };
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
    this.editingId.set(null);
  }

  selectEvent(ev: ImportantDate): void {
    this.editingId.set(ev.id);
    this.form = {
      title: ev.title,
      dueDate: ev.dueDate,
      category: ev.category,
      notes: ev.notes,
      recurring: ev.recurring,
    };
    this.showAddModal.set(true);
  }

  saveDate(): void {
    if (!this.form.title.trim() || !this.form.dueDate) return;
    const payload: ImportantDate = {
      id: this.editingId() || `d-${Date.now()}`,
      title: this.form.title.trim(),
      dueDate: this.form.dueDate,
      category: this.form.category,
      notes: this.form.notes.trim(),
      recurring: this.form.recurring,
    };
    if (this.editingId()) {
      this.dates.update(list => list.map(d => (d.id === payload.id ? payload : d)));
    } else {
      this.dates.update(list => [...list, payload]);
    }
    this.persist();
    this.closeAddModal();
    const due = new Date(payload.dueDate + 'T00:00:00');
    this.viewMonth.set(new Date(due.getFullYear(), due.getMonth(), 1));
  }

  deleteDate(id: string): void {
    this.dates.update(list => list.filter(d => d.id !== id));
    this.persist();
  }
}
