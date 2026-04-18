import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';

type ViewMode = 'list' | 'grid' | 'table';

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Books</h1>
          <p class="page-subtitle">Browse and manage your entire catalog</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search books or authors..." [(ngModel)]="searchQuery" (input)="applyFilters()" class="search-input" />
          </div>
          <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>
          <!-- View Toggle -->
          <div class="view-toggle">
            <button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'" title="List view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="9" y1="6" x2="20" y2="6"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/>
                <line x1="9" y1="12" x2="20" y2="12"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                <line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </button>
            <button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'" title="Grid view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
                <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
              </svg>
            </button>
            <button [class.active]="viewMode === 'table'" (click)="viewMode = 'table'" title="Table view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="8" height="5" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/>
                <rect x="3" y="10" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="5" rx="1"/>
                <rect x="3" y="17" width="8" height="4" rx="1"/><rect x="13" y="17" width="8" height="4" rx="1"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <ng-container *ngIf="loading()">
        <div class="book-card skeleton-card" *ngFor="let s of [1,2,3]">
          <div class="skeleton cover-skeleton"></div>
          <div class="card-body">
            <div class="skeleton" style="height:20px;width:55%;margin-bottom:.5rem"></div>
            <div class="skeleton" style="height:14px;width:35%;margin-bottom:1rem"></div>
            <div class="skeleton" style="height:14px;width:45%;margin-bottom:.5rem"></div>
            <div class="skeleton" style="height:14px;width:60%"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!loading()">

        <!-- ── LIST VIEW ── -->
        <ng-container *ngIf="viewMode === 'list'">
          <div class="book-card animate-fade-in" *ngFor="let book of filteredBooks(); let i = index" [style.animation-delay.ms]="i * 60">
            <div class="book-cover" [style.background]="getCoverGradient(i)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="cover-icon">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
              <span class="status-pill" [class]="'badge-' + book.status">{{ book.status }}</span>
            </div>
            <div class="card-body">
              <h2 class="book-title">{{ book.title }}</h2>
              <p class="book-author">{{ book.author }}</p>
              <div class="rating-row">
                <span class="stars">
                  <svg *ngFor="let s of getStars(book)" viewBox="0 0 24 24" [class.filled]="s === 'full'" [class.half]="s === 'half'">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </span>
                <span class="rating-count">{{ getRatingCount(book) }} ratings</span>
              </div>
              <p class="series-info" *ngIf="book.metadata.seriesName">
                Series: {{ book.metadata.seriesName }}<span *ngIf="book.metadata.seriesNumber"> #{{ book.metadata.seriesNumber }}</span>
              </p>
              <div class="platforms-row" *ngIf="book.platforms.length">
                <span class="platforms-label">AVAILABLE IN:</span>
                <span class="platform-tag" *ngFor="let p of book.platforms">{{ getPlatformLabel(p.platform) }}</span>
              </div>
              <div class="formats-row" *ngIf="book.formats.length">
                <span class="format-chip" *ngFor="let f of book.formats">{{ f | uppercase }}</span>
              </div>
            </div>
            <div class="card-action">
              <a [routerLink]="['/books', book.id]" class="view-details-btn">View Details</a>
            </div>
          </div>
        </ng-container>

        <!-- ── GRID VIEW ── -->
        <div class="grid-view" *ngIf="viewMode === 'grid'">
          <a [routerLink]="['/books', book.id]" class="grid-card animate-fade-in"
             *ngFor="let book of filteredBooks(); let i = index"
             [style.animation-delay.ms]="i * 50">
            <div class="grid-cover" [style.background]="getCoverGradient(i)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="cover-icon">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
              <span class="status-pill" [class]="'badge-' + book.status">{{ book.status }}</span>
            </div>
            <div class="grid-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
              <div class="rating-row">
                <span class="stars">
                  <svg *ngFor="let s of getStars(book)" viewBox="0 0 24 24" [class.filled]="s === 'full'" [class.half]="s === 'half'">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </span>
                <span class="rating-count">{{ getRatingCount(book) }}</span>
              </div>
              <div class="formats-row" *ngIf="book.formats.length">
                <span class="format-chip" *ngFor="let f of book.formats">{{ f | uppercase }}</span>
              </div>
            </div>
          </a>
        </div>

        <!-- ── TABLE VIEW ── -->
        <div class="table-wrap" *ngIf="viewMode === 'table'">
          <table class="books-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Series</th>
                <th>Formats</th>
                <th>Platforms</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let book of filteredBooks(); let i = index" class="table-row animate-fade-in" [style.animation-delay.ms]="i * 40">
                <td class="td-title">
                  <div class="td-cover-wrap">
                    <div class="td-cover" [style.background]="getCoverGradient(i)"></div>
                    {{ book.title }}
                  </div>
                </td>
                <td>{{ book.author }}</td>
                <td><span class="badge" [class]="'badge-' + book.status">{{ book.status }}</span></td>
                <td>
                  <div class="rating-row">
                    <span class="stars">
                      <svg *ngFor="let s of getStars(book)" viewBox="0 0 24 24" [class.filled]="s === 'full'" [class.half]="s === 'half'">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </span>
                  </div>
                </td>
                <td class="td-muted">{{ book.metadata.seriesName || '—' }}</td>
                <td>
                  <div class="formats-row">
                    <span class="format-chip" *ngFor="let f of book.formats">{{ f | uppercase }}</span>
                  </div>
                </td>
                <td>
                  <div class="platforms-row">
                    <span class="platform-tag" *ngFor="let p of book.platforms">{{ getPlatformLabel(p.platform) }}</span>
                  </div>
                </td>
                <td><a [routerLink]="['/books', book.id]" class="view-details-btn">View Details</a></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty -->
        <div class="empty-state" *ngIf="filteredBooks().length === 0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <p>No books found. Try adjusting your search.</p>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page { width: 100%; min-width: 0; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;
    }
    .page-title { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .page-subtitle { font-size: .9rem; color: var(--text-muted); margin: 0; }

    .header-actions { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }

    .search-box { position: relative; }
    .search-box svg { position: absolute; left: .875rem; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted); }
    .search-input {
      padding: .65rem 1rem .65rem 2.5rem; border: 1.5px solid var(--border-color);
      border-radius: 10px; font-size: .875rem; font-family: inherit;
      color: var(--text-primary); background: var(--surface); outline: none;
      transition: border-color .2s; width: 240px;
    }
    .search-input:focus { border-color: var(--accent-blue); }

    .filter-select {
      padding: .65rem 2.25rem .65rem 1rem; border: 1.5px solid var(--border-color);
      border-radius: 10px; font-size: .8125rem; font-family: inherit;
      color: var(--text-secondary); background: var(--surface);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right .75rem center;
      appearance: none; cursor: pointer; outline: none;
    }
    .filter-select:focus { border-color: var(--accent-blue); }

    /* View Toggle */
    .view-toggle { display: flex; gap: .375rem; }
    .view-toggle button {
      width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid var(--border-color);
      background: var(--surface); color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all .2s;
    }
    .view-toggle button svg { width: 17px; height: 17px; }
    .view-toggle button:hover { border-color: var(--accent-blue); color: var(--accent-blue); }
    .view-toggle button.active {
      background: var(--primary); border-color: var(--primary); color: #fff;
    }

    /* Grid View */
    .grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem; }
    .grid-card {
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 16px; overflow: hidden; text-decoration: none; color: inherit;
      box-shadow: var(--shadow-sm); transition: box-shadow .25s, transform .25s;
    }
    .grid-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
    .grid-cover {
      height: 160px; display: flex; align-items: center; justify-content: center; position: relative;
    }
    .grid-info { padding: 1rem; }

    /* Table View */
    .table-wrap {
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm);
    }
    .books-table { width: 100%; border-collapse: collapse; }
    .books-table th {
      padding: .75rem 1rem; text-align: left; font-size: .6875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted);
      border-bottom: 1px solid var(--border-light); background: var(--background);
    }
    .books-table td { padding: .75rem 1rem; font-size: .875rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .table-row { cursor: pointer; transition: background .15s; }
    .table-row:hover { background: var(--primary-light); }
    .table-row:last-child td { border-bottom: none; }
    .td-title { font-weight: 600; color: var(--text-primary); }
    .td-cover-wrap { display: flex; align-items: center; gap: .75rem; }
    .td-cover { width: 32px; height: 44px; border-radius: 5px; flex-shrink: 0; }
    .td-muted { color: var(--text-muted); font-style: italic; }
    .book-card {
      display: flex; align-items: flex-start; gap: 1.5rem;
      background: var(--surface); border: 1px solid var(--border-light);
      border-radius: 16px; padding: 1.25rem; margin-bottom: 1rem;
      box-shadow: var(--shadow-sm); transition: box-shadow .25s, transform .25s;
    }
    .book-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

    /* Cover */
    .book-cover {
      width: 90px; min-width: 90px; height: 130px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      position: relative; flex-shrink: 0;
    }
    .cover-icon { width: 36px; height: 36px; color: rgba(255,255,255,.55); }
    .status-pill {
      position: absolute; top: 6px; right: 6px;
      padding: 2px 7px; border-radius: 100px;
      font-size: .6rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
      backdrop-filter: blur(6px);
    }

    /* Body */
    .card-body { flex: 1; min-width: 0; }
    .book-title { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .2rem; }
    .book-author { font-size: .8125rem; color: var(--text-muted); margin: 0 0 .6rem; }

    /* Stars */
    .rating-row { display: flex; align-items: center; gap: .5rem; margin-bottom: .5rem; }
    .stars { display: flex; gap: 2px; }
    .stars svg {
      width: 16px; height: 16px; fill: #e2e8f0; stroke: #cbd5e1; stroke-width: 1.5;
      transition: fill .15s;
    }
    .stars svg.filled { fill: #f59e0b; stroke: #f59e0b; }
    .stars svg.half { fill: #fcd34d; stroke: #f59e0b; }
    .rating-count { font-size: .8rem; color: var(--text-muted); }

    /* Series */
    .series-info { font-size: .8125rem; color: var(--text-secondary); margin: 0 0 .6rem; font-style: italic; }

    /* Platforms */
    .platforms-row { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; margin-bottom: .5rem; }
    .platforms-label { font-size: .6875rem; font-weight: 700; letter-spacing: .06em; color: var(--text-muted); }
    .platform-tag {
      font-size: .6875rem; font-weight: 700; color: var(--accent-blue);
      background: var(--primary-light); border-radius: 5px; padding: 2px 7px;
      letter-spacing: .03em;
    }

    /* Formats */
    .formats-row { display: flex; gap: .375rem; flex-wrap: wrap; }
    .format-chip {
      font-size: .6875rem; font-weight: 600; color: var(--text-secondary);
      background: var(--background); border: 1px solid var(--border-color);
      border-radius: 6px; padding: 2px 8px;
    }

    /* Action */
    .card-action { display: flex; align-items: flex-end; padding-bottom: .25rem; flex-shrink: 0; }
    .view-details-btn {
      font-size: .8125rem; font-weight: 700; color: var(--accent-blue);
      text-decoration: none; letter-spacing: .02em;
      padding: .5rem 1rem; border: 1.5px solid var(--accent-blue);
      border-radius: 9px; transition: all .2s; white-space: nowrap;
    }
    .view-details-btn:hover { background: var(--accent-blue); color: #fff; }

    /* Skeleton */
    .skeleton-card { pointer-events: none; }
    .cover-skeleton { width: 90px; min-width: 90px; height: 130px; border-radius: 10px; }

    /* Empty */
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
    .empty-state svg { width: 48px; height: 48px; margin: 0 auto .75rem; display: block; }
    .empty-state p { font-size: .9375rem; }

    @media (max-width: 600px) {
      .book-card { flex-wrap: wrap; }
      .card-action { width: 100%; justify-content: flex-end; }
      .search-input { width: 100%; }
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .grid-view { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
      .books-table th:nth-child(5),
      .books-table td:nth-child(5) { display: none; }
    }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .header-actions { flex-wrap: wrap; }
      .search-input { width: 100%; }
      .search-box { flex: 1; min-width: 0; }
      .grid-view { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .875rem; }
      .books-table th:nth-child(6),
      .books-table td:nth-child(6),
      .books-table th:nth-child(7),
      .books-table td:nth-child(7) { display: none; }
      .table-wrap { overflow-x: auto; }
    }

    @media (max-width: 480px) {
      .book-card { flex-wrap: wrap; gap: 1rem; }
      .card-action { width: 100%; justify-content: flex-end; }
      .grid-view { grid-template-columns: repeat(2, 1fr); }
      .books-table th:nth-child(4),
      .books-table td:nth-child(4) { display: none; }
    }
  `]
})
export class BooksComponent implements OnInit {
  private bookService = inject(BookService);

  books = signal<Book[]>([]);
  filteredBooks = signal<Book[]>([]);
  loading = signal(true);
  searchQuery = '';
  filterStatus = '';
  viewMode: ViewMode = 'grid';

  private coverGradients = [
    'linear-gradient(135deg, #1c2e4a 0%, #2d4b78 100%)',
    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
    'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  ];

  // Deterministic fake rating based on book id
  private getRating(book: Book): number {
    const hash = book.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    if (book.status === 'draft') return 0;
    if (book.status === 'pending') return 2.5 + (hash % 10) * 0.2;
    return 3.5 + (hash % 10) * 0.15;
  }

  getRatingCount(book: Book): number {
    if (book.status === 'draft') return 0;
    const hash = book.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return book.status === 'published' ? (hash * 173) % 50000 : (hash * 7) % 500;
  }

  getStars(book: Book): string[] {
    const rating = this.getRating(book);
    return Array.from({ length: 5 }, (_, i) => {
      if (rating >= i + 1) return 'full';
      if (rating >= i + 0.5) return 'half';
      return 'empty';
    });
  }

  getPlatformLabel(platform: string): string {
    const map: Record<string, string> = {
      amazon: 'KDP', kobo: 'Kobo', apple: 'Apple', 'barnes-noble': 'BN'
    };
    return map[platform] ?? platform;
  }

  getCoverGradient(index: number): string {
    return this.coverGradients[index % this.coverGradients.length];
  }

  ngOnInit() {
    this.bookService.getBooks().subscribe(books => {
      this.books.set(books);
      this.filteredBooks.set(books);
      this.loading.set(false);
    });
  }

  applyFilters() {
    let result = this.books();
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
    }
    if (this.filterStatus) {
      result = result.filter(b => b.status === this.filterStatus);
    }
    this.filteredBooks.set(result);
  }
}
