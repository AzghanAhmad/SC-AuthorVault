import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImportantDatesService, ImportantDate } from '../../../services/important-dates.service';
import { PageActionBarComponent } from '../../shared/page-action-bar/page-action-bar.component';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: ImportantDate[];
}

@Component({
  selector: 'app-company-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, PageActionBarComponent],
  templateUrl: './company-calendar.component.html',
  styleUrls: ['./company-calendar.component.css'],
})
export class CompanyCalendarComponent implements OnInit {
  private readonly datesService = inject(ImportantDatesService);
  editMode = signal(false);

  filterCat = signal('');
  draftStartDate = '';
  draftEndDate = '';
  appliedStartDate = signal('');
  appliedEndDate = signal('');
  rangeFilterError = '';
  viewMode = signal<'list' | 'calendar'>('calendar');
  calView = signal<'month' | 'quarter' | 'year'>('month');
  viewMonth = signal(new Date());
  showAddModal = signal(false);
  editingId = signal<string | null>(null);

  readonly dates = this.datesService.dates;

  form = {
    title: '',
    dueDate: '',
    category: 'Tax' as ImportantDate['category'],
    notes: '',
    recurring: false,
  };

  readonly weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  rangeFilterActive = computed(() => !!(this.appliedStartDate() || this.appliedEndDate()));

  rangeFilterLabel = computed(() => {
    const start = this.appliedStartDate();
    const end = this.appliedEndDate();
    const fmt = (s: string) =>
      new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (start) return `from ${fmt(start)}`;
    if (end) return `through ${fmt(end)}`;
    return '';
  });

  applyDateRange(): void {
    this.rangeFilterError = '';
    if (!this.draftStartDate && !this.draftEndDate) {
      this.rangeFilterError = 'Pick at least a start or end date.';
      return;
    }

    let start = this.draftStartDate;
    let end = this.draftEndDate;
    if (start && end && start > end) {
      [start, end] = [end, start];
      this.draftStartDate = start;
      this.draftEndDate = end;
    }

    this.appliedStartDate.set(start);
    this.appliedEndDate.set(end);

    const jump = start || end;
    if (jump) {
      const d = new Date(jump + 'T00:00:00');
      this.viewMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  clearDateRange(): void {
    this.draftStartDate = '';
    this.draftEndDate = '';
    this.appliedStartDate.set('');
    this.appliedEndDate.set('');
    this.rangeFilterError = '';
  }

  isDayInRange(date: Date): boolean {
    if (!this.rangeFilterActive()) return true;
    const key = this.dateKey(date);
    const start = this.appliedStartDate();
    const end = this.appliedEndDate();
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  }

  filtered = computed(() => {
    const cat = this.filterCat();
    const start = this.appliedStartDate();
    const end = this.appliedEndDate();
    return [...this.dates()]
      .filter(d => !cat || d.category === cat)
      .filter(d => !start || d.dueDate >= start)
      .filter(d => !end || d.dueDate <= end)
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

  quarterMonths = computed(() => {
    const activeDate = this.viewMonth();
    const activeYear = activeDate.getFullYear();
    const currentMonth = activeDate.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;

    return [
      {
        year: activeYear,
        monthIndex: quarterStartMonth,
        name: new Date(activeYear, quarterStartMonth, 1).toLocaleDateString('en-US', { month: 'long' }),
      },
      {
        year: activeYear,
        monthIndex: quarterStartMonth + 1,
        name: new Date(activeYear, quarterStartMonth + 1, 1).toLocaleDateString('en-US', { month: 'long' }),
      },
      {
        year: activeYear,
        monthIndex: quarterStartMonth + 2,
        name: new Date(activeYear, quarterStartMonth + 2, 1).toLocaleDateString('en-US', { month: 'long' }),
      },
    ];
  });

  yearMonthsGrid = computed(() => {
    const year = this.viewMonth().getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      year,
      monthIndex: i,
      name: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'long' }),
    }));
  });

  getMonthDays(year: number, monthIndex: number): CalendarDay[] {
    const first = new Date(year, monthIndex, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(year, monthIndex, 1 - startOffset);
    const today = this.dateKey(new Date());
    const events = this.filtered();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const key = this.dateKey(date);
      days.push({
        date,
        inMonth: date.getMonth() === monthIndex,
        isToday: key === today,
        events: events.filter(e => e.dueDate === key),
      });
    }
    return days;
  }

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
    this.datesService.load().subscribe();
  }

  private persist(list: ImportantDate[]): void {
    this.datesService.save(list).subscribe({
      error: err => console.error('Failed to save dates', err),
    });
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
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      this.persist(this.dates().map(d => (d.id === payload.id ? payload : d)));
    } else {
      this.persist([...this.dates(), payload]);
    }
    this.closeAddModal();
    const due = new Date(payload.dueDate + 'T00:00:00');
    this.viewMonth.set(new Date(due.getFullYear(), due.getMonth(), 1));
  }

  deleteDate(id: string): void {
    if (!this.editMode()) return;
    this.persist(this.dates().filter(d => d.id !== id));
  }

  deleteAllDates(): void {
    if (!confirm('Delete all important dates? This cannot be undone.')) return;
    this.datesService.clearAll().subscribe({
      next: () => this.editMode.set(false),
      error: err => console.error('Failed to clear dates', err),
    });
  }
}
