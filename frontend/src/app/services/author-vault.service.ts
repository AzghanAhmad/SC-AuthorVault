import { Injectable, signal, computed } from '@angular/core';
import { PublishingCompany, Imprint, PenName, Series, Book, LanguageBranch, BookFormat, BreadcrumbItem, VaultLevel } from '../models/author-vault.model';

@Injectable({ providedIn: 'root' })
export class AuthorVaultService {
  private _company = signal<PublishingCompany>(this.buildMock());
  readonly company = this._company.asReadonly();

  // Navigation state
  readonly breadcrumb = signal<BreadcrumbItem[]>([{ level: 'company', id: 'c1', label: 'Vance Publishing LLC' }]);
  readonly currentLevel = computed(() => this.breadcrumb().at(-1)?.level ?? 'company');
  readonly currentId = computed(() => this.breadcrumb().at(-1)?.id ?? 'c1');

  navigateTo(level: VaultLevel, id: string, label: string) {
    const bc = this.breadcrumb();
    const idx = bc.findIndex(b => b.level === level && b.id === id);
    if (idx >= 0) { this.breadcrumb.set(bc.slice(0, idx + 1)); return; }
    const levelOrder: VaultLevel[] = ['company','imprint','penname','series','book','language','format'];
    const currentIdx = levelOrder.indexOf(this.currentLevel());
    const targetIdx = levelOrder.indexOf(level);
    if (targetIdx > currentIdx) { this.breadcrumb.set([...bc, { level, id, label }]); }
    else { this.breadcrumb.set([...bc.filter(b => levelOrder.indexOf(b.level) < targetIdx), { level, id, label }]); }
  }

  navigateUp() {
    const bc = this.breadcrumb();
    if (bc.length > 1) this.breadcrumb.set(bc.slice(0, -1));
  }

  getImprint(id: string): Imprint | undefined { return this._company().imprints.find(i => i.id === id); }
  getPenName(id: string): PenName | undefined { for (const imp of this._company().imprints) { const p = imp.penNames.find(pn => pn.id === id); if (p) return p; } return undefined; }
  getSeries(id: string): Series | undefined { for (const imp of this._company().imprints) for (const pn of imp.penNames) { const s = pn.series.find(sr => sr.id === id); if (s) return s; } return undefined; }
  getBook(id: string): Book | undefined { for (const imp of this._company().imprints) for (const pn of imp.penNames) for (const sr of pn.series) { const b = sr.books.find(bk => bk.id === id); if (b) return b; } return undefined; }
  getLanguageBranch(id: string): LanguageBranch | undefined { for (const imp of this._company().imprints) for (const pn of imp.penNames) for (const sr of pn.series) for (const bk of sr.books) { const lb = bk.languageBranches.find(l => l.id === id); if (lb) return lb; } return undefined; }
  getFormat(id: string): BookFormat | undefined { for (const imp of this._company().imprints) for (const pn of imp.penNames) for (const sr of pn.series) for (const bk of sr.books) for (const lb of bk.languageBranches) { const f = lb.formats.find(fm => fm.id === id); if (f) return f; } return undefined; }

  // Stats
  totalBooks = computed(() => { let c = 0; for (const i of this._company().imprints) for (const p of i.penNames) for (const s of p.series) c += s.books.length; return c; });
  totalImprints = computed(() => this._company().imprints.length);
  totalPenNames = computed(() => { let c = 0; for (const i of this._company().imprints) c += i.penNames.length; return c; });
  totalSeries = computed(() => { let c = 0; for (const i of this._company().imprints) for (const p of i.penNames) c += p.series.length; return c; });

  private buildMock(): PublishingCompany {
    return {
      id: 'c1',
      identity: { legalName: 'Vance Publishing LLC', dbaNames: 'AuthorVault Press', entityType: 'LLC', stateOfIncorporation: 'Delaware', dateOfFormation: '2021-03-15', einTaxId: '82-1234567', registeredAgent: 'RA Services Inc, 123 Corp Ave, Dover DE', fiscalYearEnd: 'December', companyStatus: 'Active', primaryAddress: '1234 Literary Lane, Suite 200, New York, NY 10001', mailingAddress: '', phone: '+1 (212) 555-0147', primaryEmail: 'admin@authorvaultpress.com', website: 'https://authorvaultpress.com' },
      ownership: { owners: [{ name: 'Eleanor Vance', ownershipPercent: 100, role: 'Managing Member' }], operatingAgreementFile: 'operating-agreement-2021.pdf', sCorpElectionFile: '' },
      financial: { bankNames: 'Chase Business', businessChecking: '****4821', businessSavings: '****7733', paymentProcessors: 'PayPal, Stripe', accountingSoftware: 'QuickBooks Online', cpaName: 'Sandra Mitchell, CPA', cpaContact: 'sandra@mitchellcpa.com', payrollProvider: 'N/A', reasonableSalary: '', quarterlyTaxSchedule: 'Apr 15, Jun 15, Sep 15, Jan 15', stateTaxRegistrations: 'DE, NY' },
      contractsLegal: { operatingAgreement: 'operating-agreement-2021.pdf', shareholderAgreement: '', trademarkRegistrations: 'AuthorVault Press™', copyrightAssignments: 'All works assigned to company', insurancePolicies: 'E&O via Hiscox', attorneyName: 'James Chen, Esq.', attorneyContact: 'jchen@publishinglaw.com' },
      imprints: [
        this.mockImprint('imp1', 'AuthorVault Press', 'Romance & Contemporary Fiction', [
          this.mockPenName('pn1', 'Eleanor Vance', 'Contemporary Romance', [
            this.mockSeries('sr1', 'Hearts of Manhattan', 'Main series', 'Romance', [
              this.mockBook('bk1', 'The Midnight Library', 1, 'Published'),
              this.mockBook('bk2', 'Shadow Protocol', 2, 'Published'),
              this.mockBook('bk3', 'Garden of Stars', 3, 'Editing'),
            ]),
            this.mockSeries('sr2', 'Coastal Dreams', 'Main series', 'Romance', [
              this.mockBook('bk4', 'Salt & Starlight', 1, 'Published'),
            ]),
          ]),
          this.mockPenName('pn2', 'V.E. Blackwood', 'Dark Fantasy', [
            this.mockSeries('sr3', 'The Obsidian Crown', 'Main series', 'Fantasy', [
              this.mockBook('bk5', 'Throne of Ashes', 1, 'Published'),
              this.mockBook('bk6', 'Crown of Thorns', 2, 'Pre-order'),
            ]),
          ]),
        ]),
        this.mockImprint('imp2', 'Vance Nonfiction', 'Self-Help & Business', [
          this.mockPenName('pn3', 'Dr. Eleanor V.', 'Self-Help', [
            this.mockSeries('sr4', 'Standalone', 'Standalone', 'Self-Help', [
              this.mockBook('bk7', 'The Quantified Self', 1, 'Published'),
            ]),
          ]),
        ]),
      ]
    };
  }

  private mockImprint(id: string, name: string, focus: string, penNames: PenName[]): Imprint {
    return { id, identity: { name, parentCompanyId: 'c1', purposeGenreFocus: focus, status: 'Active', dateEstablished: '2021-06-01', logo: '', website: `https://${name.toLowerCase().replace(/ /g,'')}.com`, email: `contact@${name.toLowerCase().replace(/ /g,'')}.com` }, legalIsbn: { isbnPrefix: '979-8', isbnBlockPurchased: '979-8-XXX-XXXXX', isbnBlockCount: 100, isbnsAssigned: penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length * 3, 0), 0), isbnsRemaining: 100 - penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length * 3, 0), 0), copyrightPageTemplate: 'Standard template', dbaRegistration: '', trademark: `${name}™` }, penNames };
  }

  private mockPenName(id: string, name: string, genre: string, series: Series[]): PenName {
    return { id, identity: { displayName: name, legalNameLinked: 'Eleanor Vance', parentImprintId: '', genre, subgenre: '', status: 'Active', dateCreated: '2021-06-01', dateRetired: '', reason: genre === 'Dark Fantasy' ? 'Genre separation' : 'Primary identity', publiclyDisclosed: genre !== 'Dark Fantasy', penNameType: 'Sole author', privacyLevel: genre === 'Dark Fantasy' ? 'Partially public' : 'Fully public' },
      coAuthors: [], branding: { authorPhoto: '', bioShort: `${name} writes captivating ${genre.toLowerCase()} stories.`, bioMedium: `${name} is a bestselling ${genre.toLowerCase()} author based in New York City. Her books have sold over 100,000 copies worldwide.`, bioLong: '', bioFirstPerson: '', bioThirdPerson: '', tagline: `Unforgettable ${genre} Stories`, brandColors: '#1c2e4a, #3b82f6', brandFonts: 'Playfair Display, Inter', coverStyleNotes: '', logo: '' },
      platformAccounts: [{ platform: 'Amazon KDP', accountInfo: 'KDP-VANCE-001', url: 'https://kdp.amazon.com' }, { platform: 'Apple Books', accountInfo: 'APPLE-VP-001', url: '' }, { platform: 'Kobo Writing Life', accountInfo: 'KWL-VANCE-001', url: '' }, { platform: 'IngramSpark', accountInfo: 'IS-VP-2024', url: '' }],
      onlinePresence: { authorWebsite: `https://${name.toLowerCase().replace(/ /g,'')}.com`, newsletterPlatform: 'MailerLite', newsletterName: `${name}'s Reader Circle`, subscriberCount: 12400, socialAccounts: [{ platform: 'Instagram', handle: `@${name.toLowerCase().replace(/ /g,'')}`, url: '' }, { platform: 'TikTok', handle: `@${name.toLowerCase().replace(/ /g,'')}books`, url: '' }, { platform: 'Facebook', handle: name, url: '' }] },
      readerCommunity: { primaryDemographic: 'Women 25-45', readerPersona: `Avid ${genre.toLowerCase()} readers who enjoy character-driven stories`, arcTeam: `${name}'s ARC Team (45 members)`, betaReaderPool: '12 trusted beta readers', readerFacebookGroup: '', engagementNotes: '42% open rate, 8% click rate' },
      series };
  }

  private mockSeries(id: string, name: string, type: string, genre: string, books: Book[]): Series {
    return { id, identity: { name, internalId: id, parentPenNameId: '', seriesType: type as any, universeName: '', genre, subgenre: '', targetAudience: 'Adult', status: books.every(b => b.coreWork.bookStatus === 'Published') ? 'Active' : 'Active', startDate: '2022-01-15', endDate: '', plannedTotalBooks: type === 'Standalone' ? 1 : 5, currentTotalBooks: books.length, readingOrderNotes: '', interconnectedSeries: '' },
      world: { settingOverview: `The world of ${name}`, timeline: '', characterBibleFile: '', glossary: '', mapsFiles: '', continuityNotes: '', spoilerSummary: '' },
      branding: { logo: '', brandColors: '', tagline: `A ${genre} series`, oneLineHook: `Welcome to ${name}`, websitePage: '', readerMagnet: '', readThroughAssets: '', salesPage: '', compTitles: '', compAuthors: '' },
      boxSets: [], books };
  }

  private mockBook(id: string, title: string, num: number, status: string): Book {
    const s = status as any;
    return { id,
      coreWork: { internalId: id, masterTitle: title, masterSubtitle: '', parentSeriesId: '', seriesNumber: String(num), penName: '', legalAuthorName: 'Eleanor Vance', companyName: 'Vance Publishing LLC', imprintName: '', copyrightHolder: 'Vance Publishing LLC', originalLanguage: 'English', genre: '', subgenre: '', targetAudience: 'Adult', bookStatus: s, firstPublicationDate: s === 'Published' ? '2023-06-15' : '', originalReleaseDate: '', internalNotes: '' },
      storySummary: { oneLineHook: `A captivating story of ${title}`, elevatorPitch: '', shortSynopsis: '', longSynopsis: '', backCoverDescription: '', salesDescription: '', spoilerSummary: '', tropes: ['Found Family', 'Second Chance'], themes: ['Love', 'Redemption'], triggerWarnings: '', compTitles: '', compAuthors: '', readerPromise: '', heatLevel: 'Moderate', violenceLevel: 'Low', contentIntensity: 'Moderate', endingType: 'HEA' },
      rights: { ebookRights: 'Held', printRights: 'Held', audioRights: 'Held', largePrintRights: 'Held', translationRights: 'Held', territorialRights: 'Worldwide', merchandisingRights: 'Held', filmTvRights: 'Held', bundleRights: 'Held', subscriptionRights: 'Held', serialRights: 'Held', directSalesRights: 'Held', rightsNotes: '', rightsExpirationDates: '', coAuthorSplit: '', ghostwriterTerms: '' },
      contributors: [
        { id: 'ct1', type: 'Editor', legalName: 'Sarah Mitchell', displayName: 'Sarah Mitchell', role: 'Developmental Editor', company: 'Mitchell Editing', email: 'sarah@editing.com', phone: '', website: '', creditLine: '', contractFile: '', contractDate: '2023-01-10', contractType: 'Freelance', paymentTerms: 'Net 30', feeAmount: '$2,500', paymentMethod: 'PayPal', dueDate: '', deliveryDate: '2023-03-15', qaStatus: 'Approved', ndaSigned: true, wouldRehire: 'Yes', totalPaid: '$2,500', notes: '' },
        { id: 'ct2', type: 'Cover Designer', legalName: 'James Okafor', displayName: 'James Okafor', role: 'Cover Designer', company: 'Okafor Design Studio', email: 'james@okafor.design', phone: '', website: 'okafor.design', creditLine: 'Cover by James Okafor', contractFile: '', contractDate: '2023-02-01', contractType: 'Freelance', paymentTerms: 'Net 15', feeAmount: '$800', paymentMethod: 'Bank transfer', dueDate: '', deliveryDate: '2023-04-01', qaStatus: 'Approved', ndaSigned: false, wouldRehire: 'Yes', totalPaid: '$800', notes: 'Excellent work' },
      ],
      identifiers: { internalBookId: id, asin: `B0${id.toUpperCase()}MOCK`, appleBooksId: '', koboId: '', googlePlayId: '', barnesNobleId: '', ingramId: '', d2dId: '', smashwordsId: '', bookFunnelId: '', shopifyProductId: '', wooCommerceId: '' },
      coverAssets: { masterConcept: '', coverDesigner: 'James Okafor', approvalDate: '2023-04-10', licenseTerms: '', stockImageLicenses: '', fontLicenses: '', ebookCover: '', paperbackWrap: '', hardcoverWrap: '', largePrintCover: '', audiobookCover: '', mockup3d: '', adCreatives: '', socialGraphics: '', bannerGraphics: '' },
      marketingCopy: { oneLineHook: `A captivating ${title}`, adCopyShort: '', adCopyMedium: '', adCopyLong: '', newsletterAnnouncement: '', preOrderEmail: '', releaseEmail: '', salePromoCopy: '', retailerDescription: '', directStoreDescription: '', socialCaptions: '', quoteGraphicsText: '', pressReleaseCopy: '', mediaKitCopy: '', podcastPitchCopy: '' },
      arcDistribution: { fileVersion: 'v1.0', fileType: 'EPUB', distributionMethod: 'BookSprout', platformAccount: '', platformCost: '$15/mo', openDate: '2023-05-01', closeDate: '2023-06-15', totalSent: 75, streetTeamRecipients: 45, newReaderRecipients: 30, namedContacts: '', reviewRequestLanguage: '', embargoDate: '', reviewDeadline: '2023-06-20' },
      arcReviews: [{ id: 'ar1', recipientName: 'BookLover22', platforms: 'Goodreads, Amazon', sentDate: '2023-05-02', followUpSent: 'Yes', reviewPosted: true, reviewDate: '2023-06-10', reviewPlatforms: 'Amazon', rating: 5, reviewLink: '', quoteUsable: true, quoteText: 'Absolutely riveting!', notes: 'Reliable reviewer' }],
      launchPlan: { launchType: 'Full', targetReleaseDate: '2023-06-15', preOrderStartDate: '2023-04-15', preOrderDuration: '60 days', launchTeamLead: 'Eleanor Vance', launchBudget: '$3,500', budgetBreakdown: 'Ads: $2,000 / Promos: $1,000 / Design: $500', timeline: [{ milestone: '12 weeks out', target: 'Final manuscript to editor', status: 'Done' }, { milestone: '8 weeks out', target: 'Cover reveal + Pre-order live', status: 'Done' }, { milestone: 'Release day', target: 'All promos launch', status: 'Done' }], checklist: [{ item: 'All platform metadata uploaded', done: true }, { item: 'Cover files uploaded', done: true }, { item: 'Back matter links verified', done: true }, { item: 'Newsletter sequence active', done: true }, { item: 'ARC reviews posted', done: true }], launchNotes: '' },
      promotionalCampaigns: [{ id: 'pc1', campaignId: 'PC-001', bookId: id, campaignType: 'Featured Deal', servicePlatform: 'BookBub', serviceTier: 'Contemporary Romance', submissionDate: '2023-07-01', approvalDate: '2023-07-10', approvalStatus: 'Approved', rejectionReason: '', startDate: '2023-08-01', endDate: '2023-08-01', bookPriceDuringPromo: '$0.99', formatsPromoted: 'Ebook', platformsPromotedOn: 'All', campaignCost: '$450', unitsSold: 2340, revenue: '$2,316', bestRankAchieved: '#42 Kindle Store', roi: '415%', overallRating: 'Excellent', wouldRunAgain: 'Yes', performanceNotes: 'Best single-day sales ever' }],
      newsletterSwaps: [{ id: 'ns1', partnerAuthor: 'Maya Rodriguez', partnerContact: 'maya@romanceauthor.com', partnerListSize: 8500, swapDate: '2023-09-15', genreMatch: true, authorClicks: 342, wouldSwapAgain: 'Yes', notes: 'Great partnership' }],
      awards: [{ id: 'aw1', awardName: 'Indies Today Award', organization: 'Indies Today', category: 'Contemporary Romance', year: '2024', submissionDate: '2024-01-15', submissionFee: '$75', result: 'Won', resultDate: '2024-04-20', announcementUrl: '', sealFile: '', sealAddedToCover: true, awardQuote: 'Winner — 2024 Indies Today Award', revenueImpact: '+18% in 30 days', notes: '' }],
      serialPlatforms: [],
      directSales: { sku: `DS-${id}`, productTitle: title, productDescription: '', storePlatform: 'Shopify', deliveryFile: '', bookFunnelLink: '', taxCategory: 'Digital goods', bundleInclusion: '', upsellMapping: '', couponEligibility: 'Yes', refundTerms: '30-day refund' },
      complianceLegal: { copyrightRegistration: 'TXu 2-XXX-XXX', trademarkNotes: '', quotedMaterialPermissions: '', stockImageLicenses: 'Licensed via Shutterstock', fontLicenses: 'Licensed', coAuthorAgreement: '', ghostwriterContract: '', translationContract: '', narratorContract: '', aiContentDisclosure: 'No AI-generated content', contentWarningNotes: '', blockedTerritories: '' },
      analyticsMapping: { platformMapping: 'ScribeCount connected', adCampaignIds: '', landingPageIds: '', emailCampaignTags: '', utmStructures: '', promoSiteRuns: '', metadataTestPeriods: '', platformUpdateDates: '', awardsImpactPeriods: '' },
      revisionHistory: [{ id: 'rv1', revisionType: 'Metadata update', date: '2024-01-15', performedBy: 'Eleanor Vance', reason: 'Award badge added', affectedPlatforms: 'Amazon, Apple', affectedLanguages: 'English', oldVersion: '', newVersion: '', notes: '' }],
      languageBranches: [
        { id: `${id}-en`, edition: { editionId: `${id}-en`, editionName: 'English First Edition', editionType: 'First', language: 'English', languageCode: 'en', isPrimaryLanguage: true, localeVariant: 'en-US', publicationStatus: s === 'Published' ? 'Published' : 'In Progress', releaseDate: s === 'Published' ? '2023-06-15' : '', wordCount: 78000, pageCount: 312, chapterCount: 28 },
          localizedMetadata: { localizedTitle: title, localizedSubtitle: '', localizedSeriesName: '', localizedHook: '', localizedShortDescription: '', localizedLongDescription: '', localizedAuthorBio: '', localizedContentWarnings: '', translatorCreditLine: '' },
          identifiers: { isbnEbook: '979-8-XXX-00001-0', isbnPaperback: '979-8-XXX-00001-1', isbnHardcover: '', isbnLargePrint: '', isbnAudiobook: '979-8-XXX-00001-3', isbnAssignedDate: '2023-01-10', isbnStatus: 'Active' },
          formats: [
            { id: `${id}-en-eb`, specs: { formatId: `${id}-en-eb`, formatType: 'Ebook', parentLanguageBranchId: `${id}-en`, status: s === 'Published' ? 'Live' : 'Draft', releaseDate: '', versionNumber: '1.0', wordCount: 78000, pageCount: 312, audioRuntime: '', trimSize: '', paperType: '', bindingType: '', printFinish: '', interiorType: '', fileSize: '2.4 MB', drmPreference: 'Off', deliveryMethod: '' }, pricingHistory: [{ regularPrice: '$4.99', launchPrice: '$2.99', preOrderPrice: '$0.99', salePrice: '', startDate: '2023-06-15', endDate: '', currency: 'USD', reason: 'Launch' }], platformVariants: [{ id: `${id}-amz`, platformName: 'Amazon KDP', storeRegion: 'US', uploadStatus: s === 'Published' ? 'Live' : 'Draft', publicationDate: '2023-06-15', lastUpdated: '2024-01-15', platformTitle: title, platformDescription: '', keywords: 'romance, contemporary, NYC', categories: 'Contemporary Romance', bisacCodes: 'FIC027020', platformPrice: '$4.99', platformSalePrice: '', isbn: '', asinOrPlatformId: `B0${id.toUpperCase()}` }], uploadLogs: [{ id: 'ul1', eventType: 'Publish', timestamp: '2023-06-15T08:00:00Z', performedBy: 'Eleanor Vance', oldValue: '', newValue: 'Live', status: 'Success', platformResponse: 'Published successfully', notes: '' }] },
            { id: `${id}-en-pb`, specs: { formatId: `${id}-en-pb`, formatType: 'Paperback', parentLanguageBranchId: `${id}-en`, status: s === 'Published' ? 'Live' : 'Draft', releaseDate: '', versionNumber: '1.0', wordCount: 78000, pageCount: 312, audioRuntime: '', trimSize: '5.5 x 8.5', paperType: 'Cream', bindingType: 'Perfect', printFinish: 'Matte', interiorType: 'Black & White', fileSize: '8.1 MB', drmPreference: 'N/A', deliveryMethod: '' }, pricingHistory: [{ regularPrice: '$14.99', launchPrice: '$14.99', preOrderPrice: '', salePrice: '', startDate: '2023-06-15', endDate: '', currency: 'USD', reason: '' }], platformVariants: [], uploadLogs: [] },
          ] },
        ...(s === 'Published' ? [{ id: `${id}-es`, edition: { editionId: `${id}-es`, editionName: 'Spanish Edition', editionType: 'Translated' as any, language: 'Spanish', languageCode: 'es', isPrimaryLanguage: false, localeVariant: 'es-MX', publicationStatus: 'In Progress' as any, releaseDate: '', wordCount: 82000, pageCount: 328, chapterCount: 28 }, localizedMetadata: { localizedTitle: '', localizedSubtitle: '', localizedSeriesName: '', localizedHook: '', localizedShortDescription: '', localizedLongDescription: '', localizedAuthorBio: '', localizedContentWarnings: '', translatorCreditLine: '' }, identifiers: { isbnEbook: '', isbnPaperback: '', isbnHardcover: '', isbnLargePrint: '', isbnAudiobook: '', isbnAssignedDate: '', isbnStatus: 'Reserved' as any }, formats: [] }] : []),
      ]
    };
  }
}
