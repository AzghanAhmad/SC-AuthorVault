import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { ToastService } from '../../../services/toast.service';
import { Book, BookStatus, FileFormat } from '../../../models/book.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">AuthorVault</h1>
          <p class="page-subtitle">Your centralized book asset management dashboard</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" (click)="showAddModal = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Book
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></div>
          <div class="stat-info"><span class="stat-value">{{ filteredBooks().length }}</span><span class="stat-label">Total Books</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="stat-info"><span class="stat-value">{{ publishedCount() }}</span><span class="stat-label">Published</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
          <div class="stat-info"><span class="stat-value">{{ draftCount() }}</span><span class="stat-label">Drafts</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg></div>
          <div class="stat-info"><span class="stat-value">{{ totalAssets() }}</span><span class="stat-label">Total Assets</span></div>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search books..." [(ngModel)]="searchQuery" (input)="applyFilters()" class="search-input" />
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="filter-select">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="published">Published</option>
          </select>
          <select [(ngModel)]="filterFormat" (change)="applyFilters()" class="filter-select">
            <option value="">All Formats</option>
            <option value="epub">EPUB</option>
            <option value="pdf">PDF</option>
            <option value="audio">Audio</option>
          </select>
          <div class="view-toggle">
            <button [class.active]="viewMode === 'cards'" (click)="viewMode = 'cards'" title="Card View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button [class.active]="viewMode === 'table'" (click)="viewMode = 'table'" title="Table View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div class="book-grid" *ngIf="loading()">
        <div class="skeleton-card" *ngFor="let s of [1,2,3,4]">
          <div class="skeleton" style="height:140px;border-radius:12px 12px 0 0"></div>
          <div style="padding:1.25rem"><div class="skeleton" style="height:20px;width:70%;margin-bottom:.75rem"></div><div class="skeleton" style="height:14px;width:50%;margin-bottom:.5rem"></div><div class="skeleton" style="height:14px;width:40%"></div></div>
        </div>
      </div>

      <!-- Cards View -->
      <div class="book-grid" *ngIf="!loading() && viewMode === 'cards' && filteredBooks().length > 0">
        @for (book of filteredBooks(); track book.id; let i = $index) {
          <a [routerLink]="['/books', book.id]" class="book-card" [style.animation-delay.ms]="i * 60">
            <div class="book-cover" [style.background]="getCoverGradient(i)">
              <div class="cover-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              </div>
              <span class="status-badge" [class]="'badge-' + book.status">{{ book.status }}</span>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <p class="book-author">{{ book.author }}</p>
              <div class="book-formats">
                @for (fmt of book.formats; track fmt) {
                  <span class="format-tag">{{ fmt | uppercase }}</span>
                }
              </div>
              <div class="book-meta">
                <span class="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ book.updatedAt }}
                </span>
                <span class="meta-item">{{ book.files.length }} files</span>
              </div>
            </div>
          </a>
        }
      </div>

      <!-- Table View -->
      <div class="book-table-wrap" *ngIf="!loading() && viewMode === 'table' && filteredBooks().length > 0">
        <table class="book-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Formats</th>
              <th>Files</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            @for (book of filteredBooks(); track book.id) {
              <tr [routerLink]="['/books', book.id]" class="table-row-link">
                <td class="td-title">{{ book.title }}</td>
                <td>{{ book.author }}</td>
                <td><span class="badge" [class]="'badge-' + book.status">{{ book.status }}</span></td>
                <td><span class="format-tag" *ngFor="let fmt of book.formats">{{ fmt | uppercase }}</span></td>
                <td>{{ book.files.length }}</td>
                <td>{{ book.updatedAt }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading() && filteredBooks().length === 0">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
        </div>
        <h3>No books found</h3>
        <p>{{ searchQuery || filterStatus || filterFormat ? 'Try adjusting your filters' : 'Add your first book to get started' }}</p>
        <button class="btn-primary" (click)="showAddModal = true" *ngIf="!searchQuery && !filterStatus && !filterFormat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Your First Book
        </button>
      </div>

      <!-- Add Book Modal -->
      <div class="modal-overlay" *ngIf="showAddModal" (click)="showAddModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add New Book</h2>
            <button class="modal-close" (click)="showAddModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Book Title</label>
              <input type="text" class="form-input" [(ngModel)]="newBookTitle" placeholder="Enter book title" />
            </div>
            <div class="form-group">
              <label class="form-label">Author Name</label>
              <input type="text" class="form-input" [(ngModel)]="newBookAuthor" placeholder="Author name" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showAddModal = false">Cancel</button>
            <button class="btn-primary" (click)="addBook()" [disabled]="!newBookTitle.trim()">Create Book</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width:1200px; width:100%; opacity:1; animation:fadeIn .5s ease-out forwards; }
    .page-header { display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2rem;flex-wrap:wrap;gap:1rem; }
    .page-title { font-size:2rem;font-weight:700;color:var(--text-primary);margin:0 0 .25rem; }
    .page-subtitle { font-size:1rem;color:var(--text-muted);margin:0; }
    .header-actions { display:flex;gap:.75rem; }

    /* Stats */
    .stats-row { display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem; }
    .stat-card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;padding:1.25rem;display:flex;align-items:center;gap:1rem;box-shadow:var(--shadow-sm);transition:all .3s; }
    .stat-card:hover { box-shadow:var(--shadow-md);transform:translateY(-2px); }
    .stat-icon { width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .stat-icon svg { width:22px;height:22px; }
    .stat-icon.blue { background:rgba(59,130,246,.1);color:#3b82f6; }
    .stat-icon.green { background:rgba(16,185,129,.1);color:#10b981; }
    .stat-icon.amber { background:rgba(245,158,11,.1);color:#f59e0b; }
    .stat-icon.purple { background:rgba(139,92,246,.1);color:#8b5cf6; }
    .stat-value { font-size:1.5rem;font-weight:700;color:var(--text-primary);display:block;line-height:1.2; }
    .stat-label { font-size:.8125rem;color:var(--text-muted); }

    /* Filters */
    .filter-bar { display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap; }
    .search-box { position:relative;flex:1;min-width:240px;max-width:400px; }
    .search-box svg { position:absolute;left:1rem;top:50%;transform:translateY(-50%);width:18px;height:18px;color:var(--text-muted); }
    .search-input { width:100%;padding:.75rem 1rem .75rem 2.75rem;border:1.5px solid var(--border-color);border-radius:12px;font-size:.9rem;font-family:inherit;color:var(--text-primary);background:var(--surface);transition:all .2s;outline:none; }
    .search-input:focus { border-color:var(--accent-blue);box-shadow:0 0 0 4px rgba(59,130,246,.1); }
    .filter-group { display:flex;gap:.75rem;align-items:center; }
    .filter-select { padding:.65rem 2.25rem .65rem 1rem;border:1.5px solid var(--border-color);border-radius:10px;font-size:.8125rem;font-family:inherit;color:var(--text-secondary);background:var(--surface);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .75rem center;appearance:none;cursor:pointer;transition:all .2s;outline:none; }
    .filter-select:focus { border-color:var(--accent-blue); }
    .view-toggle { display:flex;border:1.5px solid var(--border-color);border-radius:10px;overflow:hidden; }
    .view-toggle button { padding:.55rem .75rem;background:var(--surface);border:none;cursor:pointer;display:flex;align-items:center;color:var(--text-muted);transition:all .2s; }
    .view-toggle button.active { background:var(--primary);color:white; }
    .view-toggle button:not(.active):hover { background:var(--background); }
    .view-toggle button svg { width:16px;height:16px; }

    /* Book Grid */
    .book-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem; }
    .book-card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;overflow:hidden;text-decoration:none;color:inherit;transition:all .35s cubic-bezier(.4,0,.2,1); box-shadow:var(--shadow-sm); }
    .book-card:hover { box-shadow:var(--shadow-lg);transform:translateY(-4px); }
    .book-cover { height:140px;display:flex;align-items:center;justify-content:center;position:relative; }
    .cover-icon { color:rgba(255,255,255,.6); }
    .cover-icon svg { width:48px;height:48px; }
    .status-badge { position:absolute;top:12px;right:12px;padding:4px 10px;border-radius:100px;font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;backdrop-filter:blur(8px); }
    .badge-draft { background:rgba(245,158,11,.2);color:#f59e0b; }
    .badge-pending { background:rgba(59,130,246,.2);color:#2563eb; }
    .badge-approved { background:rgba(16,185,129,.2);color:#34d399; }
    .badge-published { background:rgba(255,255,255,.2);color:#fff; }
    .book-info { padding:1.25rem; }
    .book-title { font-size:1rem;font-weight:700;color:var(--text-primary);margin:0 0 .25rem;line-height:1.3; }
    .book-author { font-size:.8125rem;color:var(--text-muted);margin:0 0 .75rem; }
    .book-formats { display:flex;gap:.375rem;margin-bottom:.75rem;flex-wrap:wrap; }
    .format-tag { padding:3px 8px;background:var(--primary-light);border:1px solid var(--border-color);border-radius:6px;font-size:.6875rem;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.03em; }
    .book-meta { display:flex;align-items:center;gap:.75rem;font-size:.75rem;color:var(--text-muted); }
    .meta-item { display:flex;align-items:center;gap:.3rem; }

    /* Table */
    .book-table-wrap { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;overflow:hidden;box-shadow:var(--shadow-sm); }
    .book-table { width:100%;border-collapse:collapse; }
    .book-table th { padding:.875rem 1.25rem;text-align:left;font-size:.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);border-bottom:1px solid var(--border-light);background:var(--background); }
    .book-table td { padding:.875rem 1.25rem;font-size:.875rem;border-bottom:1px solid var(--border-light); }
    .table-row-link { cursor:pointer;transition:background .2s; }
    .table-row-link:hover { background:var(--primary-light); }
    .td-title { font-weight:600;color:var(--text-primary); }

    /* Skeleton */
    .skeleton-card { background:var(--surface);border:1px solid var(--border-light);border-radius:16px;overflow:hidden; }

    /* Empty */
    .empty-state { text-align:center;padding:4rem 2rem; }
    .empty-icon { width:80px;height:80px;margin:0 auto 1.5rem;background:var(--primary-light);border-radius:20px;display:flex;align-items:center;justify-content:center;color:var(--accent-blue); }
    .empty-icon svg { width:36px;height:36px; }
    .empty-state h3 { font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0 0 .5rem; }
    .empty-state p { font-size:.9rem;color:var(--text-muted);margin:0 0 1.5rem; }

    /* Modal */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn .2s ease; }
    .modal-card { background:var(--surface);border-radius:18px;width:100%;max-width:480px;box-shadow:var(--shadow-xl);animation:fadeInUp .3s cubic-bezier(.4,0,.2,1); }
    .modal-header { display:flex;justify-content:space-between;align-items:center;padding:1.5rem 1.5rem 0; }
    .modal-header h2 { font-size:1.25rem;font-weight:700;color:var(--text-primary);margin:0; }
    .modal-close { background:none;border:none;font-size:1.5rem;color:var(--text-muted);cursor:pointer;padding:.25rem; }
    .modal-body { padding:1.5rem; }
    .modal-body .form-group { margin-bottom:1rem; }
    .modal-footer { padding:0 1.5rem 1.5rem;display:flex;justify-content:flex-end;gap:.75rem; }

    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    @media(max-width:768px) {
      .stats-row { grid-template-columns:repeat(2,1fr); }
      .filter-bar { flex-direction:column;align-items:stretch; }
      .search-box { max-width:none; }
      .book-grid { grid-template-columns:1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private bookService = inject(BookService);
  private toast = inject(ToastService);
  private router = inject(Router);

  books = signal<Book[]>([]);
  filteredBooks = signal<Book[]>([]);
  loading = signal(true);

  searchQuery = '';
  filterStatus = '';
  filterFormat = '';
  viewMode: 'cards' | 'table' = 'cards';
  showAddModal = false;
  newBookTitle = '';
  newBookAuthor = '';

  publishedCount = signal(0);
  draftCount = signal(0);
  totalAssets = signal(0);

  private coverGradients = [
    'linear-gradient(135deg, #1c2e4a 0%, #2d4b78 100%)',
    'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
    'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
  ];

  ngOnInit() {
    this.bookService.getBooks().subscribe(books => {
      this.books.set(books);
      this.filteredBooks.set(books);
      this.publishedCount.set(books.filter(b => b.status === 'published').length);
      this.draftCount.set(books.filter(b => b.status === 'draft').length);
      this.totalAssets.set(books.reduce((sum, b) => sum + b.files.length + b.marketingAssets.length, 0));
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
    if (this.filterFormat) {
      result = result.filter(b => b.formats.includes(this.filterFormat as FileFormat));
    }
    this.filteredBooks.set(result);
  }

  getCoverGradient(index: number): string {
    return this.coverGradients[index % this.coverGradients.length];
  }

  addBook() {
    if (!this.newBookTitle.trim()) return;
    this.bookService.addBook({ title: this.newBookTitle.trim(), author: this.newBookAuthor.trim() || 'Unknown Author' }).subscribe(book => {
      this.showAddModal = false;
      this.newBookTitle = '';
      this.newBookAuthor = '';
      this.books.set(this.bookService.allBooks());
      this.applyFilters();
      this.toast.show('Book created successfully!', 'success');
      this.router.navigate(['/books', book.id]);
    });
  }
}
