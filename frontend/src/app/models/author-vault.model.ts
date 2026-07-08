// ═══════════════════════════════════════════════════════════════
// AuthorVAULT Solo Blueprint — Complete Data Model
// 7-Level Hierarchy: Company → Imprint → PenName → Series → Book → Language → Format
// ═══════════════════════════════════════════════════════════════

// ── LEVEL 1: Publishing Company ──
export interface CompanyIdentity {
  legalName: string;
  dbaNames: string;
  entityType: string;
  stateOfIncorporation: string;
  dateOfFormation: string;
  einTaxId: string;
  registeredAgent: string;
  fiscalYearEnd: string;
  companyStatus: 'Active' | 'Inactive' | 'Dissolved';
  primaryAddress: string;
  mailingAddress: string;
  sameMailingAsBusiness?: boolean;
  phone: string;
  primaryEmail: string;
  website: string;
  avatarUrl?: string;
  country?: string;
}

export interface OwnerRecord {
  name: string;
  ownershipPercent: number;
  role: string;
}

export interface CompanyOwnership {
  owners: OwnerRecord[];
  operatingAgreementFile: string;
  sCorpElectionFile: string;
  operatingAgreementFileUrl?: string;
  sCorpElectionFileUrl?: string;
  operatingAgreementFileId?: number;
  sCorpElectionFileId?: number;
}

export interface FinancialTaxRecords {
  bankNames: string;
  businessChecking: string;
  businessSavings: string;
  paymentProcessors: string;
  accountingSoftware: string;
  cpaName: string;
  cpaContact: string;
  payrollProvider: string;
  reasonableSalary: string;
  quarterlyTaxSchedule: string;
  stateTaxRegistrations: string;
}

export interface CompanyContractsLegal {
  operatingAgreement: string;
  shareholderAgreement: string;
  trademarkRegistrations: string;
  copyrightAssignments: string;
  insurancePolicies: string;
  attorneyName: string;
  attorneyContact: string;
  attorneyEmail?: string;
}

export interface PublishingCompany {
  id: string;
  identity: CompanyIdentity;
  ownership: CompanyOwnership;
  financial: FinancialTaxRecords;
  contractsLegal: CompanyContractsLegal;
  imprints: Imprint[];
}

// ── LEVEL 2: Imprint ──
export interface ImprintIdentity {
  name: string;
  parentCompanyId: string;
  purposeGenreFocus: string;
  status: 'Active' | 'Inactive' | 'Retired';
  dateEstablished: string;
  logo: string;
  website: string;
  email: string;
  avatarUrl?: string;
}

export interface ImprintLegalISBN {
  isbnPrefix: string;
  isbnBlockPurchased: string;
  isbnBlockCount: number;
  isbnsAssigned: number;
  isbnsRemaining: number;
  copyrightPageTemplate: string;
  copyrightPageTemplateUrl?: string;
  copyrightPageTemplateFileId?: number;
  contractTemplateFile?: string;
  contractTemplateUrl?: string;
  contractTemplateFileId?: number;
  dbaRegistration: string;
  trademark: string;
}

export interface Imprint {
  id: string;
  identity: ImprintIdentity;
  legalIsbn: ImprintLegalISBN;
  penNames: PenName[];
}

// ── LEVEL 3: Pen Name ──
export interface PenNameIdentity {
  displayName: string;
  legalNameLinked: string;
  parentImprintId: string;
  genre: string;
  subgenre: string;
  status: 'Active' | 'Retired' | 'Paused';
  dateCreated: string;
  dateRetired: string;
  reason: string;
  publiclyDisclosed: boolean;
  penNameType: 'Sole author' | 'Co-authored' | 'Ghostwritten' | 'House name';
  privacyLevel: 'Internal only' | 'Partially public' | 'Fully public';
  additionalGenres?: string;
  notes?: string;
  avatarUrl?: string;
}

export interface CoAuthorPenLevel {
  legalName: string;
  ownershipPercent: number;
  role: string;
  email: string;
  agreementFile: string;
  revenueSplitMethod: string;
  decisionMaking: string;
  dissolutionTerms: string;
  brandContinuityPlan: string;
}

export interface PenNameBranding {
  authorPhoto: string;
  bioShort: string;
  bioMedium: string;
  bioLong: string;
  bioFirstPerson: string;
  bioThirdPerson: string;
  tagline: string;
  brandColors: string;
  brandFonts: string;
  coverStyleNotes: string;
  logo: string;
  pressKitFile?: string;
  pressKitChecklist?: string[];
}

export interface PlatformAccount {
  platform: string;
  accountInfo: string;
  url: string;
}

export interface OnlinePresence {
  authorWebsite: string;
  newsletterPlatform: string;
  newsletterName: string;
  subscriberCount: number;
  socialAccounts: { platform: string; handle: string; url: string }[];
  penNameEmail?: string;
  directStoreUrl?: string;
  goodreadsUrl?: string;
  bookbubUrl?: string;
}

export interface ReaderCommunity {
  primaryDemographic: string;
  readerPersona: string;
  arcTeam: string;
  betaReaderPool: string;
  readerFacebookGroup: string;
  engagementNotes: string;
}

export interface PenName {
  id: string;
  identity: PenNameIdentity;
  coAuthors: CoAuthorPenLevel[];
  branding: PenNameBranding;
  platformAccounts: PlatformAccount[];
  onlinePresence: OnlinePresence;
  readerCommunity: ReaderCommunity;
  series: Series[];
}

// ── LEVEL 4: Series ──
export interface SeriesIdentity {
  name: string;
  internalId: string;
  parentPenNameId: string;
  seriesType: 'Main series' | 'Spinoff' | 'Standalone' | 'Universe' | 'Box set';
  universeName: string;
  genre: string;
  subgenre: string;
  targetAudience: string;
  status: 'Active' | 'Complete' | 'Hiatus' | 'Retired';
  startDate: string;
  endDate: string;
  plannedTotalBooks: number;
  currentTotalBooks: number;
  readingOrderNotes: string;
  interconnectedSeries: string;
}

export interface SeriesWorld {
  settingOverview: string;
  timeline: string;
  characterBibleFile: string;
  glossary: string;
  mapsFiles: string;
  continuityNotes: string;
  spoilerSummary: string;
}

export interface SeriesBranding {
  logo: string;
  brandColors: string;
  tagline: string;
  oneLineHook: string;
  websitePage: string;
  readerMagnet: string;
  readThroughAssets: string;
  salesPage: string;
  compTitles: string;
  compAuthors: string;
}

export interface BoxSetRecord {
  id: string;
  title: string;
  subtitle: string;
  parentSeriesId: string;
  type: string;
  status: 'Draft' | 'Pre-order' | 'Published' | 'Retired';
  publicationDate: string;
  penName: string;
  copyrightHolder: string;
  totalWordCount: number;
  totalPageCount: number;
  constituentTitles: { bookId: string; title: string; position: number; edition: string }[];
  exclusiveContent: boolean;
  exclusiveDescription: string;
  coverDesigner: string;
  oneLineHook: string;
  shortDescription: string;
  longDescription: string;
  valueProposition: string;
  bundleRightsConfirmed: boolean;
  kdpSelectConflictCheck: string;
}

export interface Series {
  id: string;
  identity: SeriesIdentity;
  world: SeriesWorld;
  branding: SeriesBranding;
  boxSets: BoxSetRecord[];
  books: Book[];
}

// ── LEVEL 5: Book ──
export interface CoreWorkIdentity {
  internalId: string;
  masterTitle: string;
  masterSubtitle: string;
  parentSeriesId: string;
  seriesNumber: string;
  penName: string;
  legalAuthorName: string;
  companyName: string;
  imprintName: string;
  copyrightHolder: string;
  originalLanguage: string;
  genre: string;
  subgenre: string;
  targetAudience: string;
  bookStatus: 'Draft' | 'Editing' | 'Pre-order' | 'Published' | 'Unpublished' | 'Retired';
  firstPublicationDate: string;
  originalReleaseDate: string;
  internalNotes: string;
}

export interface StoryContentSummary {
  oneLineHook: string;
  elevatorPitch: string;
  shortSynopsis: string;
  longSynopsis: string;
  backCoverDescription: string;
  salesDescription: string;
  spoilerSummary: string;
  tropes: string[];
  themes: string[];
  triggerWarnings: string;
  compTitles: string;
  compAuthors: string;
  readerPromise: string;
  heatLevel: string;
  violenceLevel: string;
  contentIntensity: string;
  endingType: string;
}

export interface RightsOwnership {
  ebookRights: string;
  printRights: string;
  audioRights: string;
  largePrintRights: string;
  translationRights: string;
  territorialRights: string;
  merchandisingRights: string;
  filmTvRights: string;
  bundleRights: string;
  subscriptionRights: string;
  serialRights: string;
  directSalesRights: string;
  rightsNotes: string;
  rightsExpirationDates: string;
  coAuthorSplit: string;
  ghostwriterTerms: string;
}

export interface ContributorRecord {
  id: string;
  type: 'Co-Author' | 'Ghostwriter' | 'Editor' | 'Proofreader' | 'Sensitivity Reader' | 'Cover Designer' | 'Illustrator' | 'Map Artist' | 'Formatter' | 'Foreword Writer' | 'Beta Reader' | 'Narrator' | 'Translator';
  legalName: string;
  displayName: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  creditLine: string;
  contractFile: string;
  contractDate: string;
  contractType: string;
  paymentTerms: string;
  feeAmount: string;
  paymentMethod: string;
  dueDate: string;
  deliveryDate: string;
  qaStatus: 'Pending' | 'Approved' | 'Rejected';
  ndaSigned: boolean;
  wouldRehire: 'Yes' | 'No' | 'Conditional';
  totalPaid: string;
  notes: string;
}

export interface BookIdentifiers {
  internalBookId: string;
  asin: string;
  appleBooksId: string;
  koboId: string;
  googlePlayId: string;
  barnesNobleId: string;
  ingramId: string;
  d2dId: string;
  smashwordsId: string;
  bookFunnelId: string;
  shopifyProductId: string;
  wooCommerceId: string;
}

export interface CoverVisualAssets {
  masterConcept: string;
  coverDesigner: string;
  approvalDate: string;
  licenseTerms: string;
  stockImageLicenses: string;
  fontLicenses: string;
  ebookCover: string;
  paperbackWrap: string;
  hardcoverWrap: string;
  largePrintCover: string;
  audiobookCover: string;
  mockup3d: string;
  adCreatives: string;
  socialGraphics: string;
  bannerGraphics: string;
}

export interface MarketingCopy {
  oneLineHook: string;
  adCopyShort: string;
  adCopyMedium: string;
  adCopyLong: string;
  newsletterAnnouncement: string;
  preOrderEmail: string;
  releaseEmail: string;
  salePromoCopy: string;
  retailerDescription: string;
  directStoreDescription: string;
  socialCaptions: string;
  quoteGraphicsText: string;
  pressReleaseCopy: string;
  mediaKitCopy: string;
  podcastPitchCopy: string;
}

export interface ARCDistribution {
  fileVersion: string;
  fileType: string;
  distributionMethod: string;
  platformAccount: string;
  platformCost: string;
  openDate: string;
  closeDate: string;
  totalSent: number;
  streetTeamRecipients: number;
  newReaderRecipients: number;
  namedContacts: string;
  reviewRequestLanguage: string;
  embargoDate: string;
  reviewDeadline: string;
}

export interface ARCReviewRecord {
  id: string;
  recipientName: string;
  platforms: string;
  sentDate: string;
  followUpSent: string;
  reviewPosted: boolean;
  reviewDate: string;
  reviewPlatforms: string;
  rating: number;
  reviewLink: string;
  quoteUsable: boolean;
  quoteText: string;
  notes: string;
}

export interface LaunchPlan {
  launchType: string;
  targetReleaseDate: string;
  preOrderStartDate: string;
  preOrderDuration: string;
  launchTeamLead: string;
  launchBudget: string;
  budgetBreakdown: string;
  timeline: { milestone: string; target: string; status: string }[];
  checklist: { item: string; done: boolean }[];
  launchNotes: string;
}

export interface PromotionalCampaign {
  id: string;
  campaignId: string;
  bookId: string;
  campaignType: string;
  servicePlatform: string;
  serviceTier: string;
  submissionDate: string;
  approvalDate: string;
  approvalStatus: 'Approved' | 'Rejected' | 'Pending';
  rejectionReason: string;
  startDate: string;
  endDate: string;
  bookPriceDuringPromo: string;
  formatsPromoted: string;
  platformsPromotedOn: string;
  campaignCost: string;
  unitsSold: number;
  revenue: string;
  bestRankAchieved: string;
  roi: string;
  overallRating: 'Excellent' | 'Good' | 'Break-even' | 'Poor';
  wouldRunAgain: string;
  performanceNotes: string;
}

export interface NewsletterSwap {
  id: string;
  partnerAuthor: string;
  partnerContact: string;
  partnerListSize: number;
  swapDate: string;
  genreMatch: boolean;
  authorClicks: number;
  wouldSwapAgain: string;
  notes: string;
}

export interface AwardRecord {
  id: string;
  awardName: string;
  organization: string;
  category: string;
  year: string;
  submissionDate: string;
  submissionFee: string;
  result: 'Submitted' | 'Longlisted' | 'Shortlisted' | 'Finalist' | 'Runner-up' | 'Won' | 'Did not place';
  resultDate: string;
  announcementUrl: string;
  sealFile: string;
  sealAddedToCover: boolean;
  awardQuote: string;
  revenueImpact: string;
  notes: string;
}

export interface SerialPlatformRecord {
  id: string;
  platform: string;
  accountInfo: string;
  storyTitle: string;
  storyUrl: string;
  relationshipToBook: string;
  contentStatus: 'Draft' | 'Publishing' | 'Complete' | 'Hiatus' | 'Cancelled';
  startDate: string;
  completionDate: string;
  totalEpisodes: number;
  publishingSchedule: string;
  exclusivityRequired: boolean;
  revenueModel: string;
  totalFollowers: number;
  totalReads: number;
  revenueTotal: string;
  revenueMonthly: string;
}

export interface DirectSalesRecord {
  sku: string;
  productTitle: string;
  productDescription: string;
  storePlatform: string;
  deliveryFile: string;
  bookFunnelLink: string;
  taxCategory: string;
  bundleInclusion: string;
  upsellMapping: string;
  couponEligibility: string;
  refundTerms: string;
}

export interface BookComplianceLegal {
  copyrightRegistration: string;
  trademarkNotes: string;
  quotedMaterialPermissions: string;
  stockImageLicenses: string;
  fontLicenses: string;
  coAuthorAgreement: string;
  ghostwriterContract: string;
  translationContract: string;
  narratorContract: string;
  aiContentDisclosure: string;
  contentWarningNotes: string;
  blockedTerritories: string;
}

export interface AnalyticsMapping {
  platformMapping: string;
  adCampaignIds: string;
  landingPageIds: string;
  emailCampaignTags: string;
  utmStructures: string;
  promoSiteRuns: string;
  metadataTestPeriods: string;
  platformUpdateDates: string;
  awardsImpactPeriods: string;
}

export interface RevisionHistoryEntry {
  id: string;
  revisionType: string;
  date: string;
  performedBy: string;
  reason: string;
  affectedPlatforms: string;
  affectedLanguages: string;
  oldVersion: string;
  newVersion: string;
  notes: string;
}

export interface Book {
  id: string;
  coreWork: CoreWorkIdentity;
  storySummary: StoryContentSummary;
  rights: RightsOwnership;
  contributors: ContributorRecord[];
  identifiers: BookIdentifiers;
  coverAssets: CoverVisualAssets;
  marketingCopy: MarketingCopy;
  arcDistribution: ARCDistribution;
  arcReviews: ARCReviewRecord[];
  launchPlan: LaunchPlan;
  promotionalCampaigns: PromotionalCampaign[];
  newsletterSwaps: NewsletterSwap[];
  awards: AwardRecord[];
  serialPlatforms: SerialPlatformRecord[];
  directSales: DirectSalesRecord;
  complianceLegal: BookComplianceLegal;
  analyticsMapping: AnalyticsMapping;
  revisionHistory: RevisionHistoryEntry[];
  languageBranches: LanguageBranch[];
}

// ── LEVEL 6: Language / Edition Branch ──
export interface EditionIdentity {
  editionId: string;
  editionName: string;
  editionType: string;
  language: string;
  languageCode: string;
  isPrimaryLanguage: boolean;
  localeVariant: string;
  publicationStatus: 'Planned' | 'In Progress' | 'Proofing' | 'Ready' | 'Published' | 'Retired';
  releaseDate: string;
  wordCount: number;
  pageCount: number;
  chapterCount: number;
}

export interface LocalizedMetadata {
  localizedTitle: string;
  localizedSubtitle: string;
  localizedSeriesName: string;
  localizedHook: string;
  localizedShortDescription: string;
  localizedLongDescription: string;
  localizedAuthorBio: string;
  localizedContentWarnings: string;
  translatorCreditLine: string;
}

export interface LanguageIdentifiers {
  isbnEbook: string;
  isbnPaperback: string;
  isbnHardcover: string;
  isbnLargePrint: string;
  isbnAudiobook: string;
  isbnAssignedDate: string;
  isbnStatus: 'Active' | 'Retired' | 'Reserved';
}

export interface LanguageBranch {
  id: string;
  edition: EditionIdentity;
  localizedMetadata: LocalizedMetadata;
  identifiers: LanguageIdentifiers;
  formats: BookFormat[];
}

// ── LEVEL 7: Format ──
export interface FormatSpecs {
  formatId: string;
  formatType: 'Ebook' | 'Paperback' | 'Hardcover' | 'Large Print' | 'Audiobook' | 'Direct Ebook' | 'Direct Bundle';
  parentLanguageBranchId: string;
  status: 'Draft' | 'Ready' | 'Live' | 'Retired';
  releaseDate: string;
  versionNumber: string;
  wordCount: number;
  pageCount: number;
  audioRuntime: string;
  trimSize: string;
  paperType: string;
  bindingType: string;
  printFinish: string;
  interiorType: string;
  fileSize: string;
  drmPreference: string;
  deliveryMethod: string;
}

export interface KDPSelectEnrollment {
  enrollmentStatus: 'Enrolled' | 'Not enrolled' | 'Previously enrolled';
  periodStart: string;
  periodEnd: string;
  autoRenew: boolean;
  autoRenewDeadline: string;
  enrollmentPeriodNumber: number;
  wideStrategyFlag: string;
  reasonForEnrollment: string;
  exitPlanDate: string;
  kenpPages: number;
  kenpRate: string;
  kenpReads: number;
  kenpRevenue: string;
  countdownDealUsed: boolean;
  countdownDealDates: string;
  freeDaysUsed: boolean;
  freeDaysDates: string;
  freeDayDownloads: number;
}

export interface PricingHistoryEntry {
  regularPrice: string;
  launchPrice: string;
  preOrderPrice: string;
  salePrice: string;
  startDate: string;
  endDate: string;
  currency: string;
  reason: string;
}

export interface PlatformVariant {
  id: string;
  platformName: string;
  storeRegion: string;
  uploadStatus: 'Planned' | 'Draft' | 'Uploaded' | 'Live' | 'Paused' | 'Unpublished' | 'Retired';
  publicationDate: string;
  lastUpdated: string;
  platformTitle: string;
  platformDescription: string;
  keywords: string;
  categories: string;
  bisacCodes: string;
  platformPrice: string;
  platformSalePrice: string;
  isbn: string;
  asinOrPlatformId: string;
}

export interface UploadLog {
  id: string;
  eventType: string;
  timestamp: string;
  performedBy: string;
  oldValue: string;
  newValue: string;
  status: 'Success' | 'Failed' | 'Pending';
  platformResponse: string;
  notes: string;
}

export interface BookFormat {
  id: string;
  specs: FormatSpecs;
  kdpSelect?: KDPSelectEnrollment;
  pricingHistory: PricingHistoryEntry[];
  platformVariants: PlatformVariant[];
  uploadLogs: UploadLog[];
}

// ── Navigation Types ──
export type VaultLevel = 'company' | 'imprint' | 'penname' | 'series' | 'book' | 'language' | 'format';

export interface BreadcrumbItem {
  level: VaultLevel;
  id: string;
  label: string;
}
