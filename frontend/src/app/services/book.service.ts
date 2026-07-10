import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { AuthorVaultService } from './author-vault.service';
import {
  Book, BookFile, PlatformVersion, MarketingAsset,
  BookStatus, FileFormat
} from '../models/book.model';

function uuid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function defaultPlatforms(): PlatformVersion[] {
  return [
    { platform: 'amazon', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
    { platform: 'kobo', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
    { platform: 'apple', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
    { platform: 'barnes-noble', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
  ];
}

function createBook(partial: Partial<Book>): Book {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: partial.id || 'bk-' + uuid(),
    title: partial.title || 'Untitled Book',
    author: partial.author || 'Unknown Author',
    coverUrl: partial.coverUrl || '',
    status: partial.status || 'draft',
    formats: partial.formats || [],
    metadata: {
      longBlurb: partial.metadata?.longBlurb || '',
      shortBlurb: partial.metadata?.shortBlurb || '',
      oneLineHook: partial.metadata?.oneLineHook || '',
      keywords: partial.metadata?.keywords || [],
      bisacCategories: partial.metadata?.bisacCategories || [],
      authorBio: partial.metadata?.authorBio || '',
      seriesName: partial.metadata?.seriesName || '',
      seriesNumber: partial.metadata?.seriesNumber ?? null,
      isbn: partial.metadata?.isbn || '',
      copyright: partial.metadata?.copyright || '',
      language: partial.metadata?.language || 'en',
      pageCount: partial.metadata?.pageCount ?? null,
      publishDate: partial.metadata?.publishDate || '',
    },
    files: partial.files || [],
    platforms: partial.platforms || defaultPlatforms(),
    marketingAssets: partial.marketingAssets || [],
    versionHistory: partial.versionHistory || [],
    createdAt: partial.createdAt || today,
    updatedAt: partial.updatedAt || today,
  };
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly api = inject(ApiService);
  private readonly vault = inject(AuthorVaultService);
  private readonly books = signal<Book[]>([]);
  private loaded = false;

  readonly allBooks = this.books.asReadonly();
  readonly bookCount = computed(() => this.books().length);

  private syncCatalog(): void {
    this.vault.setCatalogBooks(this.books());
  }

  getBooks(): Observable<Book[]> {
    if (this.loaded) {
      return of(this.books());
    }
    return this.api.get<Book[]>('/books').pipe(
      map(list => (Array.isArray(list) ? list : [])),
      tap(list => {
        this.books.set(list);
        this.loaded = true;
        this.syncCatalog();
      }),
      catchError(() => {
        this.books.set([]);
        this.loaded = true;
        this.syncCatalog();
        return of([]);
      })
    );
  }

  /** Force refresh from API (used by workspace loader). */
  reloadBooks(): Observable<Book[]> {
    this.loaded = false;
    return this.getBooks();
  }

  private persist(): Observable<void> {
    return this.api.put('/books', this.books()).pipe(map(() => void 0));
  }

  getBookById(id: string): Observable<Book | undefined> {
    return this.getBooks().pipe(
      map(list => list.find(b => b.id === id))
    );
  }

  updateBook(book: Book): Observable<Book> {
    const updated = { ...book, updatedAt: new Date().toISOString().split('T')[0] };
    this.books.update(list => list.map(b => b.id === book.id ? updated : b));
    this.syncCatalog();
    return this.persist().pipe(map(() => updated));
  }

  addBook(book: Partial<Book>): Observable<Book> {
    const newBook = createBook(book);
    this.books.update(list => [newBook, ...list]);
    this.syncCatalog();
    return this.persist().pipe(map(() => newBook));
  }

  uploadFile(bookId: string, file: Partial<BookFile>): Observable<BookFile> {
    const newFile: BookFile = {
      id: 'f-' + uuid(),
      name: file.name || 'file',
      type: file.type || 'application/octet-stream',
      format: file.format || 'epub',
      size: file.size || 0,
      status: 'draft',
      language: file.language || 'en',
      tags: file.tags || [],
      uploadedAt: new Date().toISOString().split('T')[0],
      category: file.category || 'ebook-master'
    };
    this.books.update(list =>
      list.map(b => b.id === bookId ? { ...b, files: [...b.files, newFile] } : b)
    );
    this.syncCatalog();
    return this.persist().pipe(map(() => newFile));
  }

  addMarketingAsset(bookId: string, asset: Partial<MarketingAsset>): Observable<MarketingAsset> {
    const newAsset: MarketingAsset = {
      id: 'ma-' + uuid(),
      title: asset.title || 'Untitled Asset',
      type: asset.type || 'ad',
      content: asset.content || '',
      status: 'draft',
      campaign: asset.campaign || '',
      platform: asset.platform || '',
      language: asset.language || 'en',
      tags: asset.tags || [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      fileUrl: asset.fileUrl,
      fileName: asset.fileName,
      fileId: asset.fileId
    };
    this.books.update(list =>
      list.map(b => b.id === bookId ? { ...b, marketingAssets: [...b.marketingAssets, newAsset] } : b)
    );
    return this.persist().pipe(map(() => newAsset));
  }

  deleteBook(id: string): Observable<boolean> {
    this.books.update(list => list.filter(b => b.id !== id));
    this.syncCatalog();
    return this.persist().pipe(map(() => true));
  }
}
