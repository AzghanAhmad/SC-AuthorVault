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
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css'],
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
