import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { BookStatus } from '../../../models/book.model';

@Component({
  selector: 'app-book-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <a routerLink="/books" class="back-link">← Back to Library</a>
          <h1 class="page-title">Add New Book</h1>
          <p class="page-subtitle">Enter the details for your new title</p>
        </div>
      </div>

      <form class="book-form card" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <div class="form-group full">
            <label class="form-label">Title *</label>
            <input class="form-input" [(ngModel)]="title" name="title" required placeholder="Book title" />
          </div>
          <div class="form-group">
            <label class="form-label">Author *</label>
            <input class="form-input" [(ngModel)]="author" name="author" required placeholder="Author name" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" [(ngModel)]="status" name="status">
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div class="form-group full">
            <label class="form-label">Cover Image URL</label>
            <input class="form-input" type="url" [(ngModel)]="coverUrl" name="coverUrl" placeholder="https://example.com/cover.jpg" />
            @if (coverUrl.trim()) {
              <img [src]="coverUrl" alt="Cover preview" class="cover-preview" (error)="coverError.set(true)" />
            }
          </div>
          <div class="form-group">
            <label class="form-label">ISBN</label>
            <input class="form-input" [(ngModel)]="isbn" name="isbn" placeholder="978-0-000-00000-0" />
          </div>
          <div class="form-group">
            <label class="form-label">Language</label>
            <input class="form-input" [(ngModel)]="language" name="language" placeholder="en" />
          </div>
          <div class="form-group">
            <label class="form-label">Series Name</label>
            <input class="form-input" [(ngModel)]="seriesName" name="seriesName" placeholder="Optional" />
          </div>
          <div class="form-group">
            <label class="form-label">Series Number</label>
            <input class="form-input" type="number" [(ngModel)]="seriesNumber" name="seriesNumber" placeholder="1" />
          </div>
          <div class="form-group">
            <label class="form-label">Page Count</label>
            <input class="form-input" type="number" [(ngModel)]="pageCount" name="pageCount" placeholder="300" />
          </div>
          <div class="form-group">
            <label class="form-label">Publish Date</label>
            <input class="form-input" type="date" [(ngModel)]="publishDate" name="publishDate" />
          </div>
          <div class="form-group full">
            <label class="form-label">Short Blurb</label>
            <textarea class="form-input" rows="3" [(ngModel)]="shortBlurb" name="shortBlurb" placeholder="Brief description for listings"></textarea>
          </div>
          <div class="form-group full">
            <label class="form-label">Long Blurb</label>
            <textarea class="form-input" rows="5" [(ngModel)]="longBlurb" name="longBlurb" placeholder="Full book description"></textarea>
          </div>
          <div class="form-group full">
            <label class="form-label">One-Line Hook</label>
            <input class="form-input" [(ngModel)]="oneLineHook" name="oneLineHook" placeholder="Tagline or elevator pitch" />
          </div>
        </div>

        @if (error()) {
          <p class="form-error">{{ error() }}</p>
        }

        <div class="form-actions">
          <button type="button" class="btn-secondary" routerLink="/books">Cancel</button>
          <button type="submit" class="btn-primary" [disabled]="saving() || !title.trim() || !author.trim()">
            {{ saving() ? 'Saving…' : 'Create Book' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { padding: 1.5rem 2rem; max-width: 900px; }
    .back-link {
      display: inline-block;
      font-size: 0.8125rem;
      color: var(--accent-blue);
      text-decoration: none;
      margin-bottom: 0.5rem;
    }
    .back-link:hover { text-decoration: underline; }
    .page-title { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .page-subtitle { color: var(--text-muted); margin: 0.25rem 0 1.5rem; }
    .card {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .form-input {
      padding: 0.55rem 0.75rem;
      border: 1.5px solid var(--border-color);
      border-radius: 8px;
      background: var(--background);
      color: var(--text-primary);
      font-size: 0.875rem;
      font-family: inherit;
    }
    .form-input:focus {
      outline: none;
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .cover-preview {
      margin-top: 0.5rem;
      max-width: 120px;
      border-radius: 8px;
      border: 1px solid var(--border-light);
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-light);
    }
    .btn-primary, .btn-secondary {
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      font-family: inherit;
    }
    .btn-primary {
      background: var(--accent-blue, #3b82f6);
      color: white;
    }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary {
      background: transparent;
      border: 1.5px solid var(--border-color);
      color: var(--text-secondary);
    }
    .form-error { color: #ef4444; font-size: 0.8125rem; margin: 0.5rem 0 0; }
    @media (max-width: 640px) {
      .page { padding: 1rem; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BookNewComponent {
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);

  title = '';
  author = '';
  status: BookStatus = 'draft';
  coverUrl = '';
  isbn = '';
  language = 'en';
  seriesName = '';
  seriesNumber: number | null = null;
  pageCount: number | null = null;
  publishDate = '';
  shortBlurb = '';
  longBlurb = '';
  oneLineHook = '';

  saving = signal(false);
  error = signal('');
  coverError = signal(false);

  onSubmit(): void {
    if (!this.title.trim() || !this.author.trim()) return;
    this.saving.set(true);
    this.error.set('');

    this.bookService.addBook({
      title: this.title.trim(),
      author: this.author.trim(),
      coverUrl: this.coverUrl.trim(),
      status: this.status,
      metadata: {
        longBlurb: this.longBlurb.trim(),
        shortBlurb: this.shortBlurb.trim(),
        oneLineHook: this.oneLineHook.trim(),
        keywords: [],
        bisacCategories: [],
        authorBio: '',
        seriesName: this.seriesName.trim(),
        seriesNumber: this.seriesNumber,
        isbn: this.isbn.trim(),
        copyright: '',
        language: this.language.trim() || 'en',
        pageCount: this.pageCount,
        publishDate: this.publishDate,
      },
    }).subscribe({
      next: book => this.router.navigate(['/books', book.id]),
      error: () => {
        this.error.set('Could not save book. Please try again.');
        this.saving.set(false);
      }
    });
  }
}
