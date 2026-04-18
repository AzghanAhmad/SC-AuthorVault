export type BookStatus = 'draft' | 'pending' | 'approved' | 'published';
export type FileFormat = 'epub' | 'pdf' | 'audio' | 'docx' | 'psd' | 'ai' | 'png' | 'jpg';
export type PlatformName = 'amazon' | 'kobo' | 'apple' | 'barnes-noble';
export type AssetType = 'ad' | 'headline' | 'newsletter' | 'social-post' | 'blog' | 'promo-graphic';

export interface BookFile {
  id: string;
  name: string;
  type: string;
  format: FileFormat;
  size: number;
  status: BookStatus;
  language: string;
  tags: string[];
  uploadedAt: string;
  category: 'ebook-master' | 'paperback-interior' | 'hardcover-interior' | 'audiobook' | 'cover-source';
}

export interface BookMetadata {
  longBlurb: string;
  shortBlurb: string;
  oneLineHook: string;
  keywords: string[];
  bisacCategories: string[];
  authorBio: string;
  seriesName: string;
  seriesNumber: number | null;
  isbn: string;
  copyright: string;
  language: string;
  pageCount: number | null;
  publishDate: string;
}

export interface PlatformRequirement {
  label: string;
  completed: boolean;
}

export interface PlatformVersion {
  platform: PlatformName;
  inheritsBase: boolean;
  customDescription: string;
  subtitle: string;
  platformFields: Record<string, string>;
  requirements: PlatformRequirement[];
}

export interface MarketingAsset {
  id: string;
  title: string;
  type: AssetType;
  content: string;
  status: BookStatus;
  campaign: string;
  platform: string;
  language: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VersionHistoryEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: BookStatus;
  formats: FileFormat[];
  metadata: BookMetadata;
  files: BookFile[];
  platforms: PlatformVersion[];
  marketingAssets: MarketingAsset[];
  versionHistory: VersionHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}
