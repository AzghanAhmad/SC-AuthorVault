import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book.service';
import { ToastService } from '../../../services/toast.service';
import { FileUploadService } from '../../../services/file-upload.service';
import { Book, BookFile, MarketingAsset, PlatformVersion, BookStatus } from '../../../models/book.model';

type TabId = 'overview' | 'files' | 'metadata' | 'platforms' | 'marketing' | 'ai';
type CorePlacementTarget = {
  key: string;
  label: string;
  section: string;
  category: BookFile['category'];
  defaultFormat?: BookFile['format'];
  defaultPlatform?: string;
};

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css'],
  })
export class BookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookService = inject(BookService);
  private toast = inject(ToastService);
  private fileUpload = inject(FileUploadService);
  private router = inject(Router);

  book = signal<Book | null>(null);
  copiedField = '';

  selectedAssetFile: File | null = null;
  assetUploading = false;

  copyField(text: string | number | undefined | null, fieldName: string): void {
    const val = text === undefined || text === null ? '' : String(text);
    navigator.clipboard.writeText(val).then(() => {
      this.copiedField = fieldName;
      setTimeout(() => {
        if (this.copiedField === fieldName) {
          this.copiedField = '';
        }
      }, 2000);
    }).catch(err => {
      console.error('Could not copy field: ', err);
    });
  }

  activeTab = signal<TabId>('overview');
  notFound = false;

  expandedPlatform = '';
  showUploadModal = false;
  showAssetModal = false;
  uploadSlotKey = '';
  uploadSlotLabel = '';

  // Upload form
  uploadFileName = '';
  uploadFormat: BookFile['format'] = 'epub';
  uploadCategory: BookFile['category'] = 'ebook-master';
  selectedUploadFile: File | null = null;
  uploadPlacementPath = '';
  uploadPlatformLabel = 'All Platforms';
  coreTitleFilter = '';
  coreTargetKey = 'fm-title-page';
  coreFormatFilter: BookFile['format'] = 'epub';
  corePlatformFilter = 'all';

  // Asset form
  newAssetTitle = '';
  newAssetType = 'ad';
  newAssetPlatform = '';
  newAssetContent = '';

  // AI
  aiLoading = signal(false);
  aiResult = signal('');

  tabs = [
    { id: 'overview' as TabId, label: 'Overview', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/></svg>' },
    { id: 'files' as TabId, label: 'Core Files', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { id: 'metadata' as TabId, label: 'Metadata', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>' },
    { id: 'platforms' as TabId, label: 'Platforms', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>' },
    { id: 'marketing' as TabId, label: 'Marketing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>' },
    { id: 'ai' as TabId, label: 'AI Tools', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 2.5 2 4 4 6 2-2 4-3.5 4-6a4 4 0 0 0-4-4z"/><circle cx="12" cy="18" r="4"/></svg>' },
  ];

  fileCategories = [
    { key: 'ebook-master', label: 'Ebook Master' },
    { key: 'paperback-interior', label: 'Paperback Interior' },
    { key: 'hardcover-interior', label: 'Hardcover Interior' },
    { key: 'audiobook', label: 'Audiobook Files' },
    { key: 'cover-source', label: 'Cover Source Files' },
  ];

  languageOptions = [
    { code: 'en', label: 'English (Primary)' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
  ];

  formatOptions: { value: BookFile['format']; label: string }[] = [
    { value: 'epub', label: 'EPUB' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'DOCX' },
    { value: 'audio', label: 'Audio' },
    { value: 'psd', label: 'PSD' },
    { value: 'ai', label: 'AI' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
  ];

  platformOptions = [
    { value: 'all', label: 'All Platforms' },
    { value: 'amazon-kdp', label: 'Amazon KDP' },
    { value: 'apple-books', label: 'Apple Books' },
    { value: 'kobo', label: 'Kobo' },
    { value: 'barnes-noble', label: 'Barnes & Noble' },
    { value: 'google-play', label: 'Google Play Books' },
    { value: 'draft2digital', label: 'Draft2Digital' },
    { value: 'ingramspark', label: 'IngramSpark' },
    { value: 'bookfunnel', label: 'BookFunnel' },
    { value: 'direct', label: 'Direct / Shopify' },
    { value: 'audio-retailers', label: 'Audio Retailers' },
  ];

  // ── Language filter for files tab ──
  filesLangFilter = 'en';

  // ── Front Matter slots ──
  frontMatterSlots = [
    { key: 'fm-accolades', label: 'Accolades / Praise', desc: 'Praise quotes and reviews', icon: 'star' },
    { key: 'fm-half-title', label: 'Half Title Page', desc: 'Title only, no author', icon: 'file' },
    { key: 'fm-frontispiece', label: 'Frontispiece', desc: 'Illustration or decorative page facing title', icon: 'image' },
    { key: 'fm-title-page', label: 'Full Title Page', desc: 'Title, author, imprint', icon: 'file' },
    { key: 'fm-copyright', label: 'Copyright Page', desc: 'ISBN, copyright, legal notices', icon: 'copyright' },
    { key: 'fm-dedication', label: 'Dedication', desc: 'Dedication text', icon: 'heart' },
    { key: 'fm-epigraph', label: 'Epigraph', desc: 'Opening quote or poem', icon: 'pen' },
    { key: 'fm-toc', label: 'Table of Contents', desc: 'Chapter list with page numbers', icon: 'list' },
    { key: 'fm-foreword', label: 'Foreword', desc: 'Written by someone other than the author', icon: 'file-text' },
    { key: 'fm-preface', label: 'Preface', desc: 'Author\'s introduction to the book', icon: 'file-text' },
    { key: 'fm-acknowledgments-front', label: 'Acknowledgments (Front)', desc: 'If placed before the story', icon: 'thanks' },
  ];

  // ── Body slots ──
  bodySlots = [
    { key: 'body-prologue', label: 'Prologue', desc: 'Sets the stage before Chapter 1', icon: 'play' },
    { key: 'body-introduction', label: 'Introduction', desc: 'Context for nonfiction or guided reading', icon: 'compass' },
    { key: 'body-manuscript', label: 'Full Manuscript', desc: 'Complete formatted manuscript file', icon: 'book' },
    { key: 'body-chapters', label: 'Chapter Files', desc: 'Individual chapter files (if split)', icon: 'book-open' },
    { key: 'body-parts', label: 'Part Dividers', desc: 'Part I, Part II, etc.', icon: 'list' },
    { key: 'body-illustrations', label: 'Interior Images / Figures', desc: 'Illustrations, tables, maps, charts', icon: 'image' },
    { key: 'body-conclusion', label: 'Conclusion', desc: 'Wrap-up section for nonfiction', icon: 'check' },
    { key: 'body-epilogue', label: 'Epilogue', desc: 'Story content after final chapter', icon: 'play' },
    { key: 'body-interlude', label: 'Interlude / Bonus Scene', desc: 'Bonus content within the story', icon: 'sparkles' },
  ];

  // ── Back Matter slots ──
  backMatterSlots = [
    { key: 'bm-acknowledgments', label: 'Acknowledgments', desc: 'Thank-you section', icon: 'thanks' },
    { key: 'bm-author-bio', label: 'Author Bio', desc: 'About the author page', icon: 'profile' },
    { key: 'bm-author-note', label: 'Author\'s Note', desc: 'Notes on research, inspiration, etc.', icon: 'file-text' },
    { key: 'bm-afterword', label: 'Afterword', desc: 'Reflection after the main text', icon: 'pen' },
    { key: 'bm-postscript', label: 'Postscript', desc: 'Final note or update', icon: 'mail' },
    { key: 'bm-next-book', label: 'Next Book Preview', desc: 'Chapter 1 of the next book', icon: 'eye' },
    { key: 'bm-series-list', label: 'Also By / Series List', desc: 'Other books by this author', icon: 'book' },
    { key: 'bm-bonus-material', label: 'Bonus Material', desc: 'Extras, deleted scenes, preview content', icon: 'gift' },
    { key: 'bm-newsletter-cta', label: 'Newsletter CTA', desc: 'Reader magnet / sign-up link', icon: 'mail' },
    { key: 'bm-glossary', label: 'Glossary', desc: 'Definitions of terms used', icon: 'book-open' },
    { key: 'bm-endnotes', label: 'Endnotes', desc: 'Citations and supplemental notes', icon: 'number' },
    { key: 'bm-bibliography', label: 'Bibliography', desc: 'Sources and references', icon: 'link' },
    { key: 'bm-index', label: 'Index', desc: 'Alphabetical index (non-fiction)', icon: 'list' },
    { key: 'bm-discussion', label: 'Discussion Questions', desc: 'Book club / reader guide', icon: 'message' },
    { key: 'bm-appendix', label: 'Appendix', desc: 'Supplementary material', icon: 'paperclip' },
    { key: 'bm-timeline', label: 'Chronology / Timeline', desc: 'Dates, events, continuity notes', icon: 'calendar' },
    { key: 'bm-permissions', label: 'Permissions / Credits', desc: 'Licensed text, images, lyrics, or art credits', icon: 'receipt' },
    { key: 'bm-colophon', label: 'Colophon', desc: 'Typeface and production notes', icon: 'printer' },
  ];

  metadataSlots = [
    { key: 'meta-master', label: 'Master Metadata Sheet', desc: 'Canonical title, subtitle, author, identifiers, pricing, and territories', icon: 'clipboard' },
    { key: 'meta-keywords', label: 'Keywords & Categories', desc: 'BISAC, retailer categories, search keywords', icon: 'search' },
    { key: 'meta-retailer-copy', label: 'Retailer Description Copy', desc: 'Short and long descriptions by storefront', icon: 'cart' },
    { key: 'meta-backmatter-rules', label: 'Back-Matter Rules', desc: 'Platform-specific links, CTAs, previews, and compliance notes', icon: 'list' },
    { key: 'meta-isbn', label: 'ISBN / Identifier Records', desc: 'ISBN, ASIN, Apple ID, Kobo ID, Google Play ID, direct sales SKU', icon: 'number' },
    { key: 'meta-rights', label: 'Rights & Territory Notes', desc: 'Rights ownership, territories, distributor restrictions', icon: 'scale' },
  ];

  // ── Ebook per-platform slots ──
  ebookPlatformSlots = [
    { platform: 'Amazon KDP', spec: 'EPUB 3 / MOBI', slots: [
      { key: 'eb-kdp-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-kdp-cover', label: 'Cover (2560×1600)', icon: '🖼' },
      { key: 'eb-kdp-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-kdp-backmatter', label: 'KDP Back Matter', icon: '📚' },
    ]},
    { platform: 'Apple Books', spec: 'EPUB 3 required', slots: [
      { key: 'eb-apple-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-apple-cover', label: 'Cover (1400×1873 min)', icon: '🖼' },
      { key: 'eb-apple-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-apple-backmatter', label: 'Apple Back Matter', icon: '📚' },
    ]},
    { platform: 'Kobo', spec: 'EPUB 2 or 3', slots: [
      { key: 'eb-kobo-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-kobo-cover', label: 'Cover (1400×2100)', icon: '🖼' },
      { key: 'eb-kobo-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-kobo-backmatter', label: 'Kobo Back Matter', icon: '📚' },
    ]},
    { platform: 'Barnes & Noble', spec: 'EPUB', slots: [
      { key: 'eb-bn-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-bn-cover', label: 'Cover (1400×2100)', icon: '🖼' },
      { key: 'eb-bn-metadata', label: 'Metadata File', icon: '📋' },
    ]},
    { platform: 'Draft2Digital', spec: 'EPUB / DOCX', slots: [
      { key: 'eb-d2d-epub', label: 'EPUB or DOCX', icon: '📱' },
      { key: 'eb-d2d-cover', label: 'Cover (1600×2400)', icon: '🖼' },
      { key: 'eb-d2d-metadata', label: 'Metadata File', icon: '📋' },
      { key: 'eb-d2d-storelinks', label: 'Universal Link Back Matter', icon: '🔗' },
    ]},
    { platform: 'Direct / Shopify', spec: 'EPUB + PDF', slots: [
      { key: 'eb-direct-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-direct-pdf', label: 'PDF File', icon: '📄' },
      { key: 'eb-direct-cover', label: 'Cover Image', icon: '🖼' },
      { key: 'eb-direct-bonus', label: 'Direct-Sale Bonus File', icon: '🎁' },
    ]},
    { platform: 'Google Play Books', spec: 'EPUB + PDF accepted', slots: [
      { key: 'eb-google-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-google-pdf', label: 'PDF File', icon: '📄' },
      { key: 'eb-google-cover', label: 'Cover (1600×2400)', icon: '🖼' },
      { key: 'eb-google-metadata', label: 'Metadata File', icon: '📋' },
    ]},
    { platform: 'IngramSpark Ebook', spec: 'EPUB + ONIX', slots: [
      { key: 'eb-ingram-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-ingram-cover', label: 'Cover Image', icon: '🖼' },
      { key: 'eb-ingram-onix', label: 'ONIX / Metadata', icon: '📋' },
    ]},
    { platform: 'BookFunnel', spec: 'Reader delivery', slots: [
      { key: 'eb-bookfunnel-epub', label: 'EPUB File', icon: '📱' },
      { key: 'eb-bookfunnel-mobi', label: 'Legacy MOBI', icon: '📱' },
      { key: 'eb-bookfunnel-cover', label: 'Cover Image', icon: '🖼' },
    ]},
  ];

  // ── Paperback trim size slots ──
  paperbackTrimSlots = [
    { size: '4 × 6"', note: 'Pocket / small format', slots: [
      { key: 'pb-4x6-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-4x6-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '4.25 × 7"', note: 'Pocket paperback', slots: [
      { key: 'pb-425x7-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-425x7-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.06 × 7.81"', note: 'B-format paperback', slots: [
      { key: 'pb-bformat-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-bformat-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.25 × 8"', note: 'Digest / novella', slots: [
      { key: 'pb-525x8-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-525x8-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5 × 8"', note: 'Smaller trade paperback', slots: [
      { key: 'pb-5x8-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-5x8-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '5.5 × 8.5"', note: 'Most common trade paperback', slots: [
      { key: 'pb-55x85-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-55x85-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'pb-55x85-spine', label: 'Spine Text File', icon: '📏' },
    ]},
    { size: '6 × 9"', note: 'Standard trade paperback', slots: [
      { key: 'pb-6x9-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-6x9-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'pb-6x9-spine', label: 'Spine Text File', icon: '📏' },
    ]},
    { size: '6.14 × 9.21"', note: 'Royal paperback', slots: [
      { key: 'pb-royal-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-royal-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '4.25 × 6.87"', note: 'Mass market paperback', slots: [
      { key: 'pb-mm-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-mm-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '7 × 10"', note: 'Workbook / nonfiction', slots: [
      { key: 'pb-7x10-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-7x10-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '7.44 × 9.69"', note: 'Crown quarto', slots: [
      { key: 'pb-crownq-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-crownq-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '8 × 10"', note: 'Illustrated / children', slots: [
      { key: 'pb-8x10-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-8x10-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: '8.5 × 11"', note: 'Workbook / large format', slots: [
      { key: 'pb-85x11-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'pb-85x11-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
    { size: 'Hardcover 6 × 9"', note: 'Case laminate hardcover', slots: [
      { key: 'hc-6x9-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'hc-6x9-cover', label: 'Full Cover Wrap', icon: '🖼' },
      { key: 'hc-6x9-dust', label: 'Dust Jacket (optional)', icon: '🎨' },
    ]},
    { size: 'Large Print 6 × 9"', note: '16pt font minimum', slots: [
      { key: 'lp-interior', label: 'Interior PDF', icon: '📄' },
      { key: 'lp-cover', label: 'Full Cover Wrap', icon: '🖼' },
    ]},
  ];

  // ── Cover art per platform ──
  coverArtSlots = [
    { platform: 'Source Files', spec: 'Master files', slots: [
      { key: 'cv-psd', label: 'PSD Master', icon: '🎨' },
      { key: 'cv-ai', label: 'Illustrator (AI)', icon: '🎨' },
      { key: 'cv-indd', label: 'InDesign (INDD)', icon: '🎨' },
      { key: 'cv-fonts', label: 'Font Licenses', icon: '🔤' },
      { key: 'cv-stock', label: 'Stock Licenses', icon: '🧾' },
    ]},
    { platform: 'Ebook Cover', spec: 'Front only', slots: [
      { key: 'cv-ebook-2560', label: '2560×1600 (KDP)', icon: '🖼' },
      { key: 'cv-ebook-1400', label: '1400×2100 (Wide)', icon: '🖼' },
      { key: 'cv-ebook-1600', label: '1600×2400 (D2D/Google)', icon: '🖼' },
      { key: 'cv-ebook-3000', label: '3000×4500 (High Res)', icon: '🖼' },
      { key: 'cv-ebook-3d', label: '3D Mockup', icon: '📦' },
    ]},
    { platform: 'Print Covers', spec: 'Full wrap', slots: [
      { key: 'cv-pb-5x8', label: 'PB 5×8 Wrap', icon: '🖼' },
      { key: 'cv-pb-55x85', label: 'PB 5.5×8.5 Wrap', icon: '🖼' },
      { key: 'cv-pb-6x9', label: 'PB 6×9 Wrap', icon: '🖼' },
      { key: 'cv-pb-7x10', label: 'PB 7×10 Wrap', icon: '🖼' },
      { key: 'cv-pb-85x11', label: 'PB 8.5×11 Wrap', icon: '🖼' },
      { key: 'cv-hc-wrap', label: 'HC Full Wrap', icon: '🖼' },
      { key: 'cv-hc-dust', label: 'Dust Jacket', icon: '🧥' },
    ]},
    { platform: 'Marketing', spec: 'Ad & social', slots: [
      { key: 'cv-fb-ad', label: 'Facebook Ad (1200×628)', icon: '📢' },
      { key: 'cv-ig-square', label: 'Instagram Square', icon: '📸' },
      { key: 'cv-ig-story', label: 'Instagram Story', icon: '📱' },
      { key: 'cv-tiktok', label: 'TikTok / Reels', icon: '🎬' },
      { key: 'cv-bookbub', label: 'BookBub (300×250)', icon: '📢' },
      { key: 'cv-newsletter', label: 'Newsletter Header', icon: '📧' },
      { key: 'cv-amazon-a-plus', label: 'Amazon A+ Graphics', icon: '🛒' },
    ]},
  ];

  // ── Audiobook slots ──
  audiobookSlots = [
    { key: 'audio-master', label: 'Production Master', desc: 'Full uncompressed master file', icon: 'mic' },
    { key: 'audio-acx', label: 'ACX / Audible File', desc: 'MP3 192kbps, per ACX specs', icon: 'headphones' },
    { key: 'audio-findaway', label: 'Findaway Voices', desc: 'For wide audio distribution', icon: 'headphones' },
    { key: 'audio-cover', label: 'Audiobook Cover', desc: '3000×3000px square JPG', icon: 'image' },
    { key: 'audio-retail-sample', label: 'Retail Sample', desc: '5-min sample for store preview', icon: 'play-icon' },
  ];

  corePlacementTargets: CorePlacementTarget[] = [
    ...this.toPlacementTargets('Front Matter', this.frontMatterSlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Body', this.bodySlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Back Matter', this.backMatterSlots, 'ebook-master', 'docx'),
    ...this.toPlacementTargets('Metadata', this.metadataSlots, 'ebook-master', 'docx'),
    ...this.ebookPlatformSlots.flatMap(platform =>
      this.toPlacementTargets(`Ebook · ${platform.platform}`, platform.slots, 'ebook-master', 'epub', this.platformValueForLabel(platform.platform))
    ),
    ...this.paperbackTrimSlots.flatMap(trim =>
      this.toPlacementTargets(`Paperback · ${trim.size}`, trim.slots, trim.size.startsWith('Hardcover') ? 'hardcover-interior' : 'paperback-interior', 'pdf', 'all')
    ),
    ...this.coverArtSlots.flatMap(cover =>
      this.toPlacementTargets(`Cover Art · ${cover.platform}`, cover.slots, 'cover-source', 'png', this.platformValueForLabel(cover.platform))
    ),
    ...this.toPlacementTargets('Audiobook', this.audiobookSlots, 'audiobook', 'audio', 'audio-retailers'),
  ];

  openUploadModal() {
    this.resetUploadForm();
    this.uploadSlotKey = '';
    this.uploadSlotLabel = '';
    this.uploadPlacementPath = `${this.book()?.title || 'Book'} / ${this.getLanguageLabel(this.filesLangFilter)} / Manual Upload`;
    this.uploadPlatformLabel = 'All Platforms';
    this.showUploadModal = true;
  }

  openUploadForSlot(slot: { key: string; label: string; icon?: string; desc?: string }) {
    this.resetUploadForm();
    const target = this.corePlacementTargets.find(item => item.key === slot.key) || {
      key: slot.key,
      label: slot.label,
      section: 'Core Files',
      category: 'ebook-master' as BookFile['category'],
      defaultFormat: this.uploadFormat,
      defaultPlatform: this.corePlatformFilter,
    };
    this.applyUploadPlacement(target, target.defaultFormat, target.defaultPlatform);
    this.showUploadModal = true;
  }

  onDropToSlot(event: DragEvent, slot: { key: string; label: string }) {
    event.preventDefault();
    this.resetUploadForm();
    const target = this.corePlacementTargets.find(item => item.key === slot.key) || {
      key: slot.key,
      label: slot.label,
      section: 'Core Files',
      category: 'ebook-master' as BookFile['category'],
      defaultFormat: this.uploadFormat,
      defaultPlatform: this.corePlatformFilter,
    };
    this.applyUploadPlacement(target, target.defaultFormat, target.defaultPlatform);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.applySelectedUploadFile(file);
    this.showUploadModal = true;
  }

  openUploadFromCoreFlow() {
    const target = this.corePlacementTargets.find(item => item.key === this.coreTargetKey);
    if (!target) return;

    this.resetUploadForm();
    this.applyUploadPlacement(target, this.coreFormatFilter, this.corePlatformFilter);
    this.showUploadModal = true;
  }

  getLanguageLabel(code: string): string {
    return this.languageOptions.find(language => language.code === code)?.label || code.toUpperCase();
  }

  private getFormatLabel(format: BookFile['format']): string {
    return this.formatOptions.find(item => item.value === format)?.label || format.toUpperCase();
  }

  private getPlatformLabelByValue(value: string): string {
    return this.platformOptions.find(platform => platform.value === value)?.label || value;
  }

  private platformValueForLabel(label: string): string {
    const normalized = label.toLowerCase();
    if (normalized.includes('amazon') || normalized.includes('kdp')) return 'amazon-kdp';
    if (normalized.includes('apple')) return 'apple-books';
    if (normalized.includes('kobo')) return 'kobo';
    if (normalized.includes('barnes')) return 'barnes-noble';
    if (normalized.includes('google')) return 'google-play';
    if (normalized.includes('draft2digital')) return 'draft2digital';
    if (normalized.includes('ingram')) return 'ingramspark';
    if (normalized.includes('bookfunnel')) return 'bookfunnel';
    if (normalized.includes('direct') || normalized.includes('shopify')) return 'direct';
    if (normalized.includes('marketing')) return 'all';
    return 'all';
  }

  private toPlacementTargets(
    section: string,
    slots: { key: string; label: string }[],
    category: BookFile['category'],
    defaultFormat: BookFile['format'] = 'epub',
    defaultPlatform = 'all'
  ): CorePlacementTarget[] {
    return slots.map(slot => ({
      key: slot.key,
      label: slot.label,
      section,
      category,
      defaultFormat,
      defaultPlatform,
    }));
  }

  private applyUploadPlacement(target: CorePlacementTarget, format = target.defaultFormat || 'epub', platform = target.defaultPlatform || 'all') {
    const platformLabel = this.getPlatformLabelByValue(platform);
    this.uploadSlotKey = `${this.filesLangFilter}-${target.key}-${platform}-${format}`;
    this.uploadSlotLabel = target.label;
    this.uploadFormat = format;
    this.uploadCategory = target.category;
    this.uploadPlatformLabel = platformLabel;
    this.uploadPlacementPath = [
      this.book()?.title || 'Book',
      this.getLanguageLabel(this.filesLangFilter),
      target.section,
      target.label,
      this.getFormatLabel(format),
      platformLabel,
    ].join(' / ');
  }

  aiActions = [
    { label: 'Generate Amazon Blurb', description: 'Create an optimized blurb for Amazon KDP listing', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>', mock: 'GENERATED AMAZON BLURB:\n\n★★★★★ "Absolutely riveting!" — Featured Amazon Editor\'s Pick\n\nIn this masterfully crafted story, readers will discover a world where every choice creates a new reality. With lyrical prose and unforgettable characters, this is a novel that will stay with you long after the last page.\n\n✦ A journey through infinite possibilities\n✦ Characters that feel like old friends\n✦ A thought-provoking exploration of regret and hope\n\nPerfect for fans of literary fiction that pushes boundaries.\n\n📖 Available in Kindle, Paperback, and Audiobook.\n\n"One of the best novels I\'ve read this year." — BookList\n"A triumph of imagination." — Publishers Weekly' },
    { label: 'Create Facebook Ads', description: 'Generate high-converting ad copy for Facebook campaigns', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h2l2-6 4 12 2-6h6"/></svg>', mock: 'FACEBOOK AD COPY (3 Variations):\n\n--- Ad 1: Curiosity Hook ---\nWhat if you could live every life you never chose?\n\nDiscover the book that 50,000+ readers can\'t stop talking about.\n📚 Available on Amazon, Kobo, Apple Books & more.\n\nCTA: Get Your Copy →\n\n--- Ad 2: Social Proof ---\n★★★★★ 2,500+ 5-star reviews\n"This book changed how I think about my life." — Reader Review\n\nJoin the movement. Read the book everyone is recommending.\n\nCTA: Read Free Sample →\n\n--- Ad 3: Urgency ---\n🔥 LIMITED TIME: 40% off the #1 bestseller in Literary Fiction.\n\nDon\'t miss out on the novel that\'s redefining the genre.\n\nCTA: Grab the Deal →' },
    { label: 'Draft Newsletter', description: 'Create an engaging newsletter for your reader list', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', mock: 'NEWSLETTER DRAFT:\n\nSubject Line: A new chapter begins...\n\nDear [Reader],\n\nI have exciting news to share!\n\nMy latest book is now available, and I couldn\'t be more thrilled to finally put it in your hands. This one has been a labor of love — months of research, countless revisions, and many late nights.\n\nHere\'s what readers are saying:\n"Incredible storytelling..." ★★★★★\n"I couldn\'t put it down!" ★★★★★\n\nAs a valued subscriber, you get an exclusive 20% discount:\nUse code: READER20 at checkout.\n\n📖 Grab your copy: [LINK]\n\nThank you for being part of this journey.\n\nWarmly,\n[Author Name]' },
    { label: 'Pull Approved Assets', description: 'Compile all approved marketing materials into one document', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', mock: 'APPROVED ASSETS COMPILATION:\n\n═══════════════════════════════\n1. Amazon Launch Ad — Facebook\n   Status: ✅ Approved\n   Platform: Facebook\n   Campaign: Launch Q1 2024\n\n   Content:\n   📚 Discover the novel about all the lives you could have lived.\n   Available on Kindle & in print.\n   ⭐⭐⭐⭐⭐ "Life-changing read!"\n\n═══════════════════════════════\n2. Newsletter Announcement\n   Status: ✅ Approved\n   Platform: Email\n   Campaign: Launch Q1 2024\n\n═══════════════════════════════\n3. Instagram Carousel Headlines\n   Status: ✅ Approved\n   Platform: Instagram\n   Campaign: Social Launch\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTotal Approved: 3 assets\nTotal Draft: 2 assets\nCompiled: ' + new Date().toLocaleDateString() },
  ];

  customAiPrompt = '';

  configuredPlatforms = signal(0);
  approvedCount = signal(0);
  statusBreakdown = signal<{ label: string; count: number; percent: number; color: string }[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound = true; return; }

    this.bookService.getBookById(id).subscribe(book => {
      if (!book) { this.notFound = true; return; }
      if (!book.metadata.bisacCategories) {
        book.metadata.bisacCategories = [];
      }
      if (!book.metadata.hashtags) {
        book.metadata.hashtags = [];
      }
      if (!book.metadata.keywords) {
        book.metadata.keywords = [];
      }
      if (!book.marketingAssets) {
        book.marketingAssets = [];
      }
      this.book.set(book);
      this.coreTitleFilter = book.id;
      this.computeStats(book);
    });
  }

  private computeStats(book: Book) {
    this.configuredPlatforms.set(book.platforms.filter(p => !p.inheritsBase || p.requirements.length > 0).length);
    const allItems = [...book.files, ...book.marketingAssets];
    const approved = allItems.filter(i => i.status === 'approved').length;
    const draft = allItems.filter(i => i.status === 'draft').length;
    const pending = allItems.filter(i => i.status === 'pending').length;
    const published = allItems.filter(i => i.status === 'published').length;
    const total = allItems.length || 1;
    this.approvedCount.set(approved);
    this.statusBreakdown.set([
      { label: 'Approved', count: approved, percent: (approved / total) * 100, color: '#10b981' },
      { label: 'Draft', count: draft, percent: (draft / total) * 100, color: '#f59e0b' },
      { label: 'Pending', count: pending, percent: (pending / total) * 100, color: '#3b82f6' },
      { label: 'Published', count: published, percent: (published / total) * 100, color: '#8b5cf6' },
    ]);
  }

  getFilesByCategory(category: string): BookFile[] {
    return this.book()?.files.filter(f => f.category === category) || [];
  }

  visibleFiles(): BookFile[] {
    return this.book()?.files.filter(file => file.language === this.filesLangFilter) || [];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  getPlatformLabel(p: string): string {
    const map: Record<string, string> = { amazon: 'Amazon', kobo: 'Kobo', apple: 'Apple Books', 'barnes-noble': 'Barnes & Noble' };
    return map[p] || p;
  }

  getCompletedReqs(p: PlatformVersion): number {
    return p.requirements.filter(r => r.completed).length;
  }

  togglePlatform(platform: string) {
    this.expandedPlatform = this.expandedPlatform === platform ? '' : platform;
  }

  assetTypeLabel(type: string): string {
    const map: Record<string, string> = { ad: 'Ad', headline: 'Headline', newsletter: 'Newsletter', 'social-post': 'Social Post', blog: 'Blog', 'promo-graphic': 'Promo' };
    return map[type] || type;
  }

  addKeyword(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && this.book()) {
      this.book()!.metadata.keywords.push(value);
      input.value = '';
    }
  }

  removeKeyword(index: number) {
    this.book()!.metadata.keywords.splice(index, 1);
  }

  addBisacCategory(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value && this.book()) {
      if (!this.book()!.metadata.bisacCategories) {
        this.book()!.metadata.bisacCategories = [];
      }
      this.book()!.metadata.bisacCategories.push(value);
      input.value = '';
    }
  }

  removeBisacCategory(index: number) {
    if (this.book() && this.book()!.metadata.bisacCategories) {
      this.book()!.metadata.bisacCategories.splice(index, 1);
    }
  }

  addHashtag(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = input.value.trim();
    if (value && this.book()) {
      if (!value.startsWith('#')) {
        value = '#' + value;
      }
      if (!this.book()!.metadata.hashtags) {
        this.book()!.metadata.hashtags = [];
      }
      this.book()!.metadata.hashtags.push(value);
      input.value = '';
    }
  }

  removeHashtag(index: number) {
    if (this.book() && this.book()!.metadata.hashtags) {
      this.book()!.metadata.hashtags.splice(index, 1);
    }
  }

  saveBook() {
    if (!this.book()) return;
    this.bookService.updateBook(this.book()!).subscribe(() => {
      this.toast.show('Book saved successfully!', 'success');
    });
  }

  publishBook() {
    if (!this.book()) return;
    this.book()!.status = 'published';
    this.saveBook();
  }

  saveDraft() { this.toast.show('Draft saved!', 'success'); }
  publishMetadata() { this.toast.show('Metadata published!', 'success'); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.openUploadModal();
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.resetUploadForm();
  }

  onUploadFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.applySelectedUploadFile(file);
    input.value = '';
  }

  private applySelectedUploadFile(file: File) {
    this.selectedUploadFile = file;
    this.uploadFileName = file.name;
    this.uploadFormat = this.inferUploadFormat(file);
  }

  private inferUploadFormat(file: File): BookFile['format'] {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats: BookFile['format'][] = ['epub', 'pdf', 'docx', 'psd', 'ai', 'png', 'jpg'];
    const audioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'flac'];

    if (extension === 'jpeg') return 'jpg';
    if (extension && supportedFormats.includes(extension as BookFile['format'])) return extension as BookFile['format'];
    if ((extension && audioExtensions.includes(extension)) || file.type.startsWith('audio/')) return 'audio';

    return this.uploadFormat;
  }

  private resetUploadForm() {
    this.uploadFileName = '';
    this.uploadFormat = 'epub';
    this.uploadCategory = 'ebook-master';
    this.selectedUploadFile = null;
    this.uploadPlacementPath = '';
    this.uploadPlatformLabel = 'All Platforms';
  }

  uploadFile() {
    if (!this.book() || !this.uploadFileName.trim()) return;
    this.bookService.uploadFile(this.book()!.id, {
      name: this.uploadFileName,
      type: this.selectedUploadFile?.type || 'application/octet-stream',
      format: this.uploadFormat,
      category: this.uploadCategory,
      size: this.selectedUploadFile?.size ?? Math.floor(Math.random() * 10000000),
      language: this.filesLangFilter,
      tags: [
        this.uploadSlotLabel ? `Slot: ${this.uploadSlotLabel}` : 'Manual upload',
        `Language: ${this.getLanguageLabel(this.filesLangFilter)}`,
        `Platform: ${this.uploadPlatformLabel}`,
        `Path: ${this.uploadPlacementPath || 'Manual upload'}`
      ]
    }).subscribe(() => {
      this.showUploadModal = false;
      this.resetUploadForm();
      this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
      this.toast.show('File uploaded!', 'success');
    });
  }

  onAssetFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedAssetFile = file;
    }
  }

  addAsset() {
    if (!this.book() || !this.newAssetTitle.trim()) return;

    if (this.selectedAssetFile) {
      this.assetUploading = true;
      this.fileUpload.upload(this.selectedAssetFile, 'marketing-asset').subscribe({
        next: uploaded => {
          this.assetUploading = false;
          this.bookService.addMarketingAsset(this.book()!.id, {
            title: this.newAssetTitle,
            type: this.newAssetType as any,
            platform: this.newAssetPlatform,
            content: this.newAssetContent,
            fileUrl: uploaded.url,
            fileName: uploaded.fileName,
            fileId: uploaded.id
          }).subscribe(() => {
            this.showAssetModal = false;
            this.newAssetTitle = ''; this.newAssetContent = ''; this.newAssetPlatform = ''; this.selectedAssetFile = null;
            this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
            this.toast.show('Marketing asset added with attachment!', 'success');
          });
        },
        error: () => {
          this.assetUploading = false;
          alert('Failed to upload file attachment. Asset not saved.');
        }
      });
    } else {
      this.bookService.addMarketingAsset(this.book()!.id, {
        title: this.newAssetTitle, type: this.newAssetType as any, platform: this.newAssetPlatform, content: this.newAssetContent
      }).subscribe(() => {
        this.showAssetModal = false;
        this.newAssetTitle = ''; this.newAssetContent = ''; this.newAssetPlatform = '';
        this.bookService.getBookById(this.book()!.id).subscribe(b => { if (b) { this.book.set(b); this.computeStats(b); } });
        this.toast.show('Marketing asset added!', 'success');
      });
    }
  }

  deleteAsset(assetId: string): void {
    if (confirm('Are you sure you want to delete this marketing asset?')) {
      const asset = this.book()?.marketingAssets.find(a => a.id === assetId);
      const fileId = asset?.fileId;

      const list = (this.book()?.marketingAssets || []).filter(a => a.id !== assetId);
      const updatedBook = { ...this.book()!, marketingAssets: list };
      
      this.bookService.updateBook(updatedBook).subscribe(() => {
        this.book.set(updatedBook);
        this.computeStats(updatedBook);
        this.toast.show('Marketing asset deleted!', 'success');
        if (fileId) {
          this.fileUpload.delete(fileId).subscribe({ error: () => undefined });
        }
      });
    }
  }

  resolveFileUrl(url: string | undefined): string {
    return url ? this.fileUpload.resolveFileUrl(url) : '';
  }

  isImageFile(fileName: string | undefined): boolean {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '');
  }

  isVideoFile(fileName: string | undefined): boolean {
    if (!fileName) return false;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'mov', 'ogg'].includes(ext || '');
  }

  runAiAction(action: { label: string; mock: string }) {
    this.aiLoading.set(true);
    this.aiResult.set('');
    setTimeout(() => {
      this.aiResult.set(action.mock);
      this.aiLoading.set(false);
    }, 1500 + Math.random() * 1000);
  }

  runCustomAiAction() {
    if (!this.customAiPrompt.trim()) return;
    const prompt = this.customAiPrompt.trim();
    this.aiLoading.set(true);
    this.aiResult.set('');
    this.customAiPrompt = '';
    setTimeout(() => {
      this.aiResult.set(`CUSTOM AI RESPONSE FOR PROMPT: "${prompt}"\n\nHere is a draft response tailored to your request:\n\n1. Overview:\n   We analyzed your prompt regarding "${this.book()?.title}" and generated a fresh copy structure.\n\n2. Suggested Copy:\n   "In this brilliant work, "${this.book()?.title}" by ${this.book()?.author}, the narrative pushes the boundaries of imagination to deliver a truly captivating reading experience."\n\n3. Key Hooks:\n   - Modern storytelling with high-stakes tension\n   - Exceptional depth and pacing\n\nFeel free to adjust this generated content or copy it to your clipboard.`);
      this.aiLoading.set(false);
    }, 1500 + Math.random() * 1000);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show('Copied to clipboard!', 'success');
    });
  }
}
