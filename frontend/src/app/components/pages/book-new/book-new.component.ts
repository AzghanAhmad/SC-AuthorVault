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
  templateUrl: './book-new.component.html',
  styleUrls: ['./book-new.component.css'],
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
