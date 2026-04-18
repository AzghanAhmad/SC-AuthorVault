import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import {
  Book, BookFile, BookMetadata, PlatformVersion, MarketingAsset,
  BookStatus, FileFormat, PlatformName
} from '../models/book.model';

function uuid(): string {
  return Math.random().toString(36).substring(2, 10);
}

const MOCK_BOOKS: Book[] = [
  {
    id: 'bk-001',
    title: 'The Midnight Library',
    author: 'Eleanor Vance',
    coverUrl: '',
    status: 'published',
    formats: ['epub', 'pdf', 'audio'],
    metadata: {
      longBlurb: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices... Would you have done anything different, if you had the chance to undo your regrets?',
      shortBlurb: 'A dazzling novel about all the choices that go into a life well lived.',
      oneLineHook: 'What if you could live every life you never chose?',
      keywords: ['fiction', 'literary', 'philosophical', 'parallel-lives', 'regret', 'hope'],
      bisacCategories: ['FIC045000 — Literary', 'FIC028000 — Science Fiction'],
      authorBio: 'Eleanor Vance is a bestselling author of literary fiction. Her novels explore the human condition through innovative narrative structures.',
      seriesName: '',
      seriesNumber: null,
      isbn: '978-0-525-55947-4',
      copyright: '© 2024 Eleanor Vance',
      language: 'en',
      pageCount: 304,
      publishDate: '2024-03-15'
    },
    files: [
      { id: 'f1', name: 'midnight-library-master.epub', type: 'application/epub+zip', format: 'epub', size: 2456000, status: 'approved', language: 'en', tags: ['master', 'final'], uploadedAt: '2024-03-01', category: 'ebook-master' },
      { id: 'f2', name: 'midnight-library-pb-interior.pdf', type: 'application/pdf', format: 'pdf', size: 8900000, status: 'approved', language: 'en', tags: ['print-ready'], uploadedAt: '2024-03-02', category: 'paperback-interior' },
      { id: 'f3', name: 'midnight-library-hc-interior.pdf', type: 'application/pdf', format: 'pdf', size: 9200000, status: 'draft', language: 'en', tags: ['hardcover'], uploadedAt: '2024-03-03', category: 'hardcover-interior' },
      { id: 'f4', name: 'midnight-library-audio-ch1-10.mp3', type: 'audio/mpeg', format: 'audio', size: 125000000, status: 'approved', language: 'en', tags: ['narrator-a'], uploadedAt: '2024-03-05', category: 'audiobook' },
      { id: 'f5', name: 'midnight-library-cover.psd', type: 'image/vnd.adobe.photoshop', format: 'psd', size: 45000000, status: 'approved', language: 'en', tags: ['cover', 'source'], uploadedAt: '2024-02-20', category: 'cover-source' },
    ],
    platforms: [
      {
        platform: 'amazon',
        inheritsBase: false,
        customDescription: 'A beautifully written novel that will redefine how you think about choices. ★★★★★ "Mind-bending and heartwarming." — Amazon Editor\'s Pick',
        subtitle: 'A Novel of Infinite Possibilities',
        platformFields: { asin: 'B08LKGQHV3', kindleUnlimited: 'true' },
        requirements: [
          { label: 'Cover meets 2560×1600 minimum', completed: true },
          { label: 'Description under 4000 bytes', completed: true },
          { label: 'Keywords set (7 max)', completed: true },
          { label: 'Categories selected', completed: true }
        ]
      },
      {
        platform: 'kobo',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: { koboId: 'kobo-ml-001' },
        requirements: [
          { label: 'ePub validated', completed: true },
          { label: 'Cover 1400×1873 minimum', completed: true },
          { label: 'Pricing configured', completed: false }
        ]
      },
      {
        platform: 'apple',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: { appleId: 'apple-ml-001' },
        requirements: [
          { label: 'ePub3 validated', completed: true },
          { label: 'Sample generated', completed: false },
          { label: 'Pre-order configured', completed: false }
        ]
      },
      {
        platform: 'barnes-noble',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: { nookId: 'bn-ml-001' },
        requirements: [
          { label: 'Nook Press formatting', completed: true },
          { label: 'Cover uploaded', completed: true }
        ]
      }
    ],
    marketingAssets: [
      {
        id: 'ma1',
        title: 'Amazon Launch Ad',
        type: 'ad',
        content: 'Discover The Midnight Library. What if every choice led to a different world? Available on Kindle and in print.',
        status: 'approved',
        campaign: 'Launch Q1 2024',
        platform: 'Facebook',
        language: 'en',
        tags: ['launch', 'facebook'],
        createdAt: '2024-02-15',
        updatedAt: '2024-03-01'
      },
      {
        id: 'ma2',
        title: 'Newsletter Announcement',
        type: 'newsletter',
        content: 'Dear Reader, I am thrilled to share that my new novel, The Midnight Library, is now available! Grab your copy today.',
        status: 'approved',
        campaign: 'Launch Q1 2024',
        platform: 'Email',
        language: 'en',
        tags: ['newsletter', 'launch'],
        createdAt: '2024-02-20',
        updatedAt: '2024-03-01'
      },
      { id: 'ma3', title: 'Twitter/X Post Series', type: 'social-post', content: '🧵 What if there was a library between life and death where you could try every life you never lived?\n\nThat\'s the premise of my new novel THE MIDNIGHT LIBRARY.\n\nHere\'s a thread on what inspired this story... 👇', status: 'draft', campaign: 'Social Launch', platform: 'Twitter/X', language: 'en', tags: ['social', 'thread'], createdAt: '2024-02-25', updatedAt: '2024-02-25' },
      { id: 'ma4', title: 'Blog Post: Behind the Story', type: 'blog', content: '# Behind The Midnight Library\n\nThe idea for this novel came to me during a particularly difficult winter. I was sitting in a café, watching snowflakes drift past the window, when I started wondering about all the paths I hadn\'t taken...', status: 'draft', campaign: 'Content Marketing', platform: 'Blog', language: 'en', tags: ['blog', 'behind-scenes'], createdAt: '2024-03-01', updatedAt: '2024-03-01' },
      { id: 'ma5', title: 'Instagram Carousel Headlines', type: 'headline', content: 'Slide 1: "What if you could live every life you never chose?"\nSlide 2: "The Midnight Library by Eleanor Vance"\nSlide 3: "Out now on all platforms"\nSlide 4: "★★★★★ mind-bending and heartwarming"', status: 'approved', campaign: 'Social Launch', platform: 'Instagram', language: 'en', tags: ['instagram', 'carousel'], createdAt: '2024-02-28', updatedAt: '2024-03-01' },
    ],
    versionHistory: [
      { id: 'vh1', field: 'shortBlurb', oldValue: 'A novel about choices.', newValue: 'A dazzling novel about all the choices that go into a life well lived.', changedBy: 'Eleanor Vance', changedAt: '2024-02-20' },
      { id: 'vh2', field: 'status', oldValue: 'draft', newValue: 'published', changedBy: 'Eleanor Vance', changedAt: '2024-03-15' },
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-03-15'
  },
  {
    id: 'bk-002',
    title: 'Shadow Protocol',
    author: 'Marcus Webb',
    coverUrl: '',
    status: 'draft',
    formats: ['epub', 'pdf'],
    metadata: {
      longBlurb: 'When ex-CIA operative Jack Stone discovers a classified dossier that could topple governments, he becomes the target of every intelligence agency on the planet. With nowhere to hide, he must use his lethal skills to survive — and expose the truth before it\'s buried forever.',
      shortBlurb: 'A pulse-pounding thriller about a rogue operative fighting against the world\'s most powerful agencies.',
      oneLineHook: 'One man. One secret. Every government wants him dead.',
      keywords: ['thriller', 'espionage', 'CIA', 'action', 'conspiracy'],
      bisacCategories: ['FIC030000 — Thriller', 'FIC006000 — Espionage'],
      authorBio: 'Marcus Webb is a former intelligence analyst turned thriller writer. His novels draw on real-world geopolitics and covert operations.',
      seriesName: 'Stone Files',
      seriesNumber: 1,
      isbn: '978-1-234-56789-0',
      copyright: '© 2024 Marcus Webb',
      language: 'en',
      pageCount: 412,
      publishDate: ''
    },
    files: [
      { id: 'f6', name: 'shadow-protocol-master.epub', type: 'application/epub+zip', format: 'epub', size: 1850000, status: 'draft', language: 'en', tags: ['v2-draft'], uploadedAt: '2024-04-10', category: 'ebook-master' },
      { id: 'f7', name: 'shadow-protocol-pb.pdf', type: 'application/pdf', format: 'pdf', size: 12000000, status: 'draft', language: 'en', tags: ['print'], uploadedAt: '2024-04-12', category: 'paperback-interior' },
    ],
    platforms: [
      {
        platform: 'amazon',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: {},
        requirements: [
          { label: 'Cover meets 2560×1600 minimum', completed: false },
          { label: 'Description under 4000 bytes', completed: true },
          { label: 'Keywords set (7 max)', completed: false },
          { label: 'Categories selected', completed: false }
        ]
      },
      {
        platform: 'kobo',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: {},
        requirements: [
          { label: 'ePub validated', completed: false },
          { label: 'Cover 1400×1873 minimum', completed: false }
        ]
      },
      {
        platform: 'apple',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: {},
        requirements: []
      },
      {
        platform: 'barnes-noble',
        inheritsBase: true,
        customDescription: '',
        subtitle: '',
        platformFields: {},
        requirements: []
      }
    ],
    marketingAssets: [
      {
        id: 'ma6',
        title: 'Pre-launch Teaser',
        type: 'social-post',
        content: 'Something big is coming. A secret that could topple governments. SHADOW PROTOCOL Coming Soon.',
        status: 'draft',
        campaign: 'Pre-launch',
        platform: 'All',
        language: 'en',
        tags: ['teaser'],
        createdAt: '2024-04-15',
        updatedAt: '2024-04-15'
      },
    ],
    versionHistory: [],
    createdAt: '2024-04-01',
    updatedAt: '2024-04-15'
  },
  {
    id: 'bk-003',
    title: 'Garden of Stars',
    author: 'Amara Singh',
    coverUrl: '',
    status: 'pending',
    formats: ['epub', 'audio'],
    metadata: {
      longBlurb: 'In a small village in Rajasthan, twelve-year-old Priya discovers a forgotten telescope that reveals not just stars, but glimpses of the future. As she shares her visions with the people around her, she must navigate the burden of knowing what lies ahead — and the courage it takes to change it.',
      shortBlurb: 'A magical coming-of-age story about a girl who sees the future in the stars.',
      oneLineHook: 'She looked through a telescope and saw tomorrow.',
      keywords: ['young-adult', 'magical-realism', 'India', 'coming-of-age', 'astronomy'],
      bisacCategories: ['JUV037000 — Science Fiction', 'JUV013000 — Family'],
      authorBio: 'Amara Singh writes stories rooted in Indian culture and folklore. Her novels blend magical realism with heartfelt family dynamics.',
      seriesName: 'Stars & Dust',
      seriesNumber: 1,
      isbn: '978-0-987-65432-1',
      copyright: '© 2025 Amara Singh',
      language: 'en',
      pageCount: 256,
      publishDate: '2025-06-01'
    },
    files: [
      { id: 'f8', name: 'garden-of-stars-master.epub', type: 'application/epub+zip', format: 'epub', size: 1200000, status: 'approved', language: 'en', tags: ['final'], uploadedAt: '2025-04-05', category: 'ebook-master' },
      { id: 'f9', name: 'garden-stars-audio-full.m4a', type: 'audio/m4a', format: 'audio', size: 200000000, status: 'pending', language: 'en', tags: ['narrator-b', 'full'], uploadedAt: '2025-04-10', category: 'audiobook' },
      { id: 'f10', name: 'garden-of-stars-cover.ai', type: 'application/illustrator', format: 'ai', size: 35000000, status: 'approved', language: 'en', tags: ['cover', 'illustrator'], uploadedAt: '2025-03-20', category: 'cover-source' },
    ],
    platforms: [
      {
        platform: 'amazon',
        inheritsBase: true, customDescription: '', subtitle: '', platformFields: {},
        requirements: [
          { label: 'Cover meets 2560×1600 minimum', completed: true },
          { label: 'Description under 4000 bytes', completed: true },
          { label: 'Keywords set (7 max)', completed: true },
          { label: 'Categories selected', completed: false }
        ]
      },
      { platform: 'kobo', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [{ label: 'ePub validated', completed: true }] },
      { platform: 'apple', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
      { platform: 'barnes-noble', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
    ],
    marketingAssets: [
      { id: 'ma7', title: 'BookTok Promo Script', type: 'social-post', content: '📖 POV: You find a telescope that shows you the future...\n\nGARDEN OF STARS by Amara Singh\n\nThis book WRECKED me 😭✨\n\n#BookTok #YABooks #MagicalRealism', status: 'approved', campaign: 'BookTok Q2', platform: 'TikTok', language: 'en', tags: ['booktok'], createdAt: '2025-04-01', updatedAt: '2025-04-08' },
      { id: 'ma8', title: 'Goodreads Giveaway Copy', type: 'headline', content: 'Enter to win a signed copy of GARDEN OF STARS — a magical coming-of-age story about a girl who discovers a telescope that reveals the future.', status: 'approved', campaign: 'Pre-launch Giveaway', platform: 'Goodreads', language: 'en', tags: ['giveaway'], createdAt: '2025-04-02', updatedAt: '2025-04-02' },
    ],
    versionHistory: [],
    createdAt: '2025-03-10',
    updatedAt: '2025-04-10'
  },
  {
    id: 'bk-004',
    title: 'The Quantified Self',
    author: 'Dr. Helena Park',
    coverUrl: '',
    status: 'approved',
    formats: ['epub', 'pdf', 'audio'],
    metadata: {
      longBlurb: 'We track our steps, our sleep, our calories, and our heart rates. But what happens when we start quantifying our emotions, our relationships, and our inner lives? Dr. Helena Park explores the fascinating — and sometimes frightening — world of self-tracking technology and its impact on human identity.',
      shortBlurb: 'A thought-provoking exploration of how data is reshaping our sense of self.',
      oneLineHook: 'What happens when you measure everything that makes you human?',
      keywords: ['non-fiction', 'technology', 'psychology', 'data', 'self-help', 'identity'],
      bisacCategories: ['SOC057000 — Popular Culture', 'PSY031000 — Social Psychology'],
      authorBio: 'Dr. Helena Park is a behavioral psychologist and technology researcher at Stanford.',
      seriesName: '',
      seriesNumber: null,
      isbn: '978-0-111-22333-4',
      copyright: '© 2025 Helena Park',
      language: 'en',
      pageCount: 328,
      publishDate: '2025-05-01'
    },
    files: [
      { id: 'f11', name: 'quantified-self-master.epub', type: 'application/epub+zip', format: 'epub', size: 3200000, status: 'approved', language: 'en', tags: ['final', 'indexed'], uploadedAt: '2025-03-20', category: 'ebook-master' },
      { id: 'f12', name: 'quantified-self-pb.pdf', type: 'application/pdf', format: 'pdf', size: 15000000, status: 'approved', language: 'en', tags: ['print-ready'], uploadedAt: '2025-03-22', category: 'paperback-interior' },
      { id: 'f13', name: 'quantified-self-audio.mp3', type: 'audio/mpeg', format: 'audio', size: 180000000, status: 'approved', language: 'en', tags: ['author-narrated'], uploadedAt: '2025-03-28', category: 'audiobook' },
      { id: 'f14', name: 'quantified-self-cover.psd', type: 'image/vnd.adobe.photoshop', format: 'psd', size: 52000000, status: 'approved', language: 'en', tags: ['cover', 'source'], uploadedAt: '2025-03-10', category: 'cover-source' },
    ],
    platforms: [
      {
        platform: 'amazon',
        inheritsBase: false,
        customDescription: 'From a leading Stanford researcher: a groundbreaking look at how self-tracking is changing what it means to be human.',
        subtitle: 'How Data Is Reshaping Human Identity',
        platformFields: { asin: 'B0EXAMPLE2', kindleUnlimited: 'false' },
        requirements: [
          { label: 'Cover meets 2560×1600 minimum', completed: true },
          { label: 'Description under 4000 bytes', completed: true },
          { label: 'Keywords set (7 max)', completed: true },
          { label: 'Categories selected', completed: true }
        ]
      },
      { platform: 'kobo', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [{ label: 'ePub validated', completed: true }, { label: 'Cover uploaded', completed: true }] },
      { platform: 'apple', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [{ label: 'ePub3 validated', completed: true }] },
      { platform: 'barnes-noble', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [{ label: 'Nook Press formatting', completed: true }] },
    ],
    marketingAssets: [
      { id: 'ma9', title: 'LinkedIn Article Headline', type: 'headline', content: 'Are You Measuring Too Much? The Surprising Psychology Behind Self-Tracking', status: 'approved', campaign: 'Thought Leadership', platform: 'LinkedIn', language: 'en', tags: ['linkedin', 'thought-leadership'], createdAt: '2025-03-25', updatedAt: '2025-04-01' },
      { id: 'ma10', title: 'Podcast Interview Talking Points', type: 'newsletter', content: '• The origin story of The Quantified Self\n• Surprising research findings about mood tracking\n• The "data paradox" in relationships\n• Practical advice for healthier tech habits', status: 'approved', campaign: 'Podcast Tour', platform: 'Podcast', language: 'en', tags: ['podcast', 'talking-points'], createdAt: '2025-04-01', updatedAt: '2025-04-05' },
      { id: 'ma11', title: 'BookBub Featured Deal Copy', type: 'ad', content: 'What happens when we start quantifying everything that makes us human? This thought-provoking exploration of self-tracking tech will change how you think about data — and yourself.', status: 'draft', campaign: 'BookBub May', platform: 'BookBub', language: 'en', tags: ['bookbub', 'deal'], createdAt: '2025-04-08', updatedAt: '2025-04-08' },
    ],
    versionHistory: [
      { id: 'vh3', field: 'isbn', oldValue: '', newValue: '978-0-111-22333-4', changedBy: 'Helena Park', changedAt: '2025-03-15' },
    ],
    createdAt: '2025-02-01',
    updatedAt: '2025-04-10'
  }
];

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly books = signal<Book[]>(MOCK_BOOKS);
  readonly allBooks = this.books.asReadonly();
  readonly bookCount = computed(() => this.books().length);

  getBooks(): Observable<Book[]> {
    return of(this.books()).pipe(delay(400));
  }

  getBookById(id: string): Observable<Book | undefined> {
    return of(this.books().find(b => b.id === id)).pipe(delay(300));
  }

  updateBook(book: Book): Observable<Book> {
    this.books.update(list => list.map(b => b.id === book.id ? { ...book, updatedAt: new Date().toISOString().split('T')[0] } : b));
    return of(book).pipe(delay(400));
  }

  addBook(book: Partial<Book>): Observable<Book> {
    const newBook: Book = {
      id: 'bk-' + uuid(),
      title: book.title || 'Untitled Book',
      author: book.author || 'Unknown Author',
      coverUrl: '',
      status: 'draft',
      formats: [],
      metadata: {
        longBlurb: '', shortBlurb: '', oneLineHook: '',
        keywords: [], bisacCategories: [], authorBio: '',
        seriesName: '', seriesNumber: null,
        isbn: '', copyright: '', language: 'en',
        pageCount: null, publishDate: ''
      },
      files: [],
      platforms: [
        { platform: 'amazon', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
        { platform: 'kobo', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
        { platform: 'apple', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
        { platform: 'barnes-noble', inheritsBase: true, customDescription: '', subtitle: '', platformFields: {}, requirements: [] },
      ],
      marketingAssets: [],
      versionHistory: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.books.update(list => [newBook, ...list]);
    return of(newBook).pipe(delay(500));
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
    return of(newFile).pipe(delay(600));
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
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.books.update(list =>
      list.map(b => b.id === bookId ? { ...b, marketingAssets: [...b.marketingAssets, newAsset] } : b)
    );
    return of(newAsset).pipe(delay(400));
  }

  deleteBook(id: string): Observable<boolean> {
    this.books.update(list => list.filter(b => b.id !== id));
    return of(true).pipe(delay(300));
  }
}
