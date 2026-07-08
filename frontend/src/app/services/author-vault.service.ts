import { Injectable, signal, computed, inject } from '@angular/core';
import { PublishingCompany, Imprint, PenName, Series, Book, LanguageBranch, BookFormat, BreadcrumbItem, VaultLevel, CompanyIdentity, FinancialTaxRecords, CompanyContractsLegal, CompanyOwnership, BoxSetRecord, EditionIdentity, LocalizedMetadata, LanguageIdentifiers, FormatSpecs, KDPSelectEnrollment, PricingHistoryEntry, PlatformVariant, UploadLog } from '../models/author-vault.model';
import { COMPANY_FIELD_MAP } from './excel-import.service';
import { ApiService } from './api.service';
import { Observable, tap, catchError, of } from 'rxjs';

/** Minimal catalog book shape from the Books module (avoids circular import with book.service). */
export interface CatalogBookInput {
  id: string;
  title?: string;
  author?: string;
  coverUrl?: string;
  status?: string;
  formats?: string[];
  platforms?: { platform: string }[];
  metadata?: {
    seriesName?: string;
    seriesNumber?: number | null;
    language?: string;
    pageCount?: number | null;
    publishDate?: string;
    isbn?: string;
    copyright?: string;
    oneLineHook?: string;
    shortBlurb?: string;
    longBlurb?: string;
    authorBio?: string;
    keywords?: string[];
    bisacCategories?: string[];
  };
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthorVaultService {
  private readonly api = inject(ApiService);
  private _company = signal<PublishingCompany>(this.createEmptyCompany());
  readonly company = this._company.asReadonly();
  readonly isLoaded = signal(false);

  // Navigation state
  readonly breadcrumb = signal<BreadcrumbItem[]>([{ level: 'company', id: '', label: 'Company' }]);
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
  totalImprints = computed(() => this._company().imprints.length);
  totalPenNames = computed(() => { let c = 0; for (const i of this._company().imprints) c += i.penNames.length; return c; });

  /** Catalog books from /api/books (Books module) — merged into public totals + vault tree for Languages/Formats. */
  private readonly catalogBooks = signal<CatalogBookInput[]>([]);

  setCatalogBooks(books: CatalogBookInput[]): void {
    const list = Array.isArray(books) ? books : [];
    this.catalogBooks.set(list);
    this.mirrorCatalogIntoVaultTree(list);
  }

  /**
   * Mirror Books-module titles into Company → Imprint → Pen Name → Series → Book
   * so Languages / Formats pages (which read the vault tree) show real catalog data.
   */
  private mirrorCatalogIntoVaultTree(catalog: CatalogBookInput[]): void {
    if (!this.isLoaded()) return;

    const company = this._company();
    let imprints = company.imprints.map(imp => ({
      ...imp,
      penNames: imp.penNames.map(pn => ({
        ...pn,
        series: pn.series.map(sr => ({
          ...sr,
          books: sr.books.filter(bk => !String(bk.id).startsWith('cat-')),
        })),
      })),
    }));

    if (!catalog.length) {
      this._company.set({ ...company, imprints });
      this.persist();
      return;
    }

    // Ensure there is at least one imprint + pen name to attach catalog books under.
    if (!imprints.length) {
      const impId = 'imp-catalog';
      imprints = [{
        id: impId,
        identity: {
          name: company.identity.legalName || 'Main Imprint',
          parentCompanyId: company.id || '',
          purposeGenreFocus: '',
          status: 'Active',
          dateEstablished: new Date().toISOString().split('T')[0],
          logo: '',
          website: '',
          email: '',
        },
        legalIsbn: {
          isbnPrefix: '', isbnBlockPurchased: '', isbnBlockCount: 0,
          isbnsAssigned: 0, isbnsRemaining: 0, copyrightPageTemplate: '',
          dbaRegistration: '', trademark: '',
        },
        penNames: [],
      }];
    }

    for (const cat of catalog) {
      const author = (cat.author || 'Unknown Author').trim() || 'Unknown Author';
      const seriesName = (cat.metadata?.seriesName || '').trim() || 'Standalone Titles';
      const title = (cat.title || 'Untitled Book').trim() || 'Untitled Book';
      const vaultBookId = `cat-${cat.id}`;

      // Find or create pen name by author display name (prefer existing).
      let imprintIdx = imprints.findIndex(imp =>
        imp.penNames.some(pn => pn.identity.displayName.toLowerCase() === author.toLowerCase())
      );
      if (imprintIdx < 0) imprintIdx = 0;

      let pnIdx = imprints[imprintIdx].penNames.findIndex(
        pn => pn.identity.displayName.toLowerCase() === author.toLowerCase()
      );
      if (pnIdx < 0) {
        const created = this.buildEmptyPenName(imprints[imprintIdx].id, author);
        imprints[imprintIdx] = {
          ...imprints[imprintIdx],
          penNames: [...imprints[imprintIdx].penNames, created],
        };
        pnIdx = imprints[imprintIdx].penNames.length - 1;
      }

      let srIdx = imprints[imprintIdx].penNames[pnIdx].series.findIndex(
        sr => sr.identity.name.toLowerCase() === seriesName.toLowerCase()
      );
      if (srIdx < 0) {
        const series = this.buildEmptySeries(
          imprints[imprintIdx].penNames[pnIdx].id,
          seriesName
        );
        const pn = imprints[imprintIdx].penNames[pnIdx];
        imprints[imprintIdx].penNames[pnIdx] = {
          ...pn,
          series: [...pn.series, series],
        };
        srIdx = imprints[imprintIdx].penNames[pnIdx].series.length - 1;
      }

      const vaultBook = this.catalogBookToVaultBook(cat, vaultBookId, {
        penName: author,
        seriesId: imprints[imprintIdx].penNames[pnIdx].series[srIdx].id,
        companyName: company.identity.legalName || '',
        imprintName: imprints[imprintIdx].identity.name || '',
      });

      const series = imprints[imprintIdx].penNames[pnIdx].series[srIdx];
      const existingIdx = series.books.findIndex(b => b.id === vaultBookId || b.coreWork.masterTitle === title);
      const nextBooks = [...series.books];
      if (existingIdx >= 0) nextBooks[existingIdx] = vaultBook;
      else nextBooks.push(vaultBook);

      imprints[imprintIdx].penNames[pnIdx].series[srIdx] = {
        ...series,
        books: nextBooks,
        identity: {
          ...series.identity,
          currentTotalBooks: nextBooks.length,
        },
      };
    }

    this._company.set({ ...company, imprints });
    this.persist();
  }

  private buildEmptyPenName(imprintId: string, displayName: string): PenName {
    const id = 'pn-' + Math.random().toString(36).slice(2, 10);
    return {
      id,
      identity: {
        displayName,
        legalNameLinked: '',
        parentImprintId: imprintId,
        genre: '',
        subgenre: '',
        status: 'Active',
        dateCreated: new Date().toISOString().split('T')[0],
        dateRetired: '',
        reason: 'Synced from Books catalog',
        publiclyDisclosed: true,
        penNameType: 'Sole author',
        privacyLevel: 'Fully public',
      },
      coAuthors: [],
      branding: {
        authorPhoto: '', bioShort: '', bioMedium: '', bioLong: '', bioFirstPerson: '', bioThirdPerson: '',
        tagline: '', brandColors: '', brandFonts: '', coverStyleNotes: '', logo: '',
      },
      platformAccounts: [],
      onlinePresence: {
        authorWebsite: '', newsletterPlatform: '', newsletterName: '', subscriberCount: 0, socialAccounts: [],
      },
      readerCommunity: {
        primaryDemographic: '', readerPersona: '', arcTeam: '', betaReaderPool: '', readerFacebookGroup: '', engagementNotes: '',
      },
      series: [],
    };
  }

  private buildEmptySeries(penNameId: string, name: string): Series {
    const id = 'sr-' + Math.random().toString(36).slice(2, 10);
    return {
      id,
      identity: {
        name,
        internalId: id,
        parentPenNameId: penNameId,
        seriesType: name === 'Standalone Titles' ? 'Standalone' : 'Main series',
        universeName: '',
        genre: '',
        subgenre: '',
        targetAudience: 'Adult',
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        plannedTotalBooks: 1,
        currentTotalBooks: 0,
        readingOrderNotes: '',
        interconnectedSeries: '',
      },
      world: {
        settingOverview: '', timeline: '', characterBibleFile: '', glossary: '',
        mapsFiles: '', continuityNotes: '', spoilerSummary: '',
      },
      branding: {
        logo: '', brandColors: '', tagline: '', oneLineHook: '', websitePage: '',
        readerMagnet: '', readThroughAssets: '', salesPage: '', compTitles: '', compAuthors: '',
      },
      boxSets: [],
      books: [],
    };
  }

  private catalogBookToVaultBook(
    cat: CatalogBookInput,
    vaultBookId: string,
    ctx: { penName: string; seriesId: string; companyName: string; imprintName: string }
  ): Book {
    const langCode = (cat.metadata?.language || 'en').toLowerCase();
    const languageName = this.languageNameFromCode(langCode);
    const isPublished = (cat.status || '').toLowerCase() === 'published';
    const bookStatus = isPublished ? 'Published' : (cat.status || '').toLowerCase() === 'pending' || (cat.status || '').toLowerCase() === 'approved' ? 'Editing' : 'Draft';
    const branchId = `${vaultBookId}-${langCode}`;
    const title = cat.title || 'Untitled Book';
    const pageCount = cat.metadata?.pageCount || 0;
    const publishDate = cat.metadata?.publishDate || '';
    const formats = this.catalogFormatsToVault(cat, branchId, isPublished);

    return {
      id: vaultBookId,
      coreWork: {
        internalId: vaultBookId,
        masterTitle: title,
        masterSubtitle: '',
        parentSeriesId: ctx.seriesId,
        seriesNumber: String(cat.metadata?.seriesNumber ?? ''),
        penName: ctx.penName,
        legalAuthorName: ctx.penName,
        companyName: ctx.companyName,
        imprintName: ctx.imprintName,
        copyrightHolder: ctx.companyName || ctx.penName,
        originalLanguage: languageName,
        genre: '',
        subgenre: '',
        targetAudience: 'Adult',
        bookStatus: bookStatus as Book['coreWork']['bookStatus'],
        firstPublicationDate: publishDate,
        originalReleaseDate: publishDate,
        internalNotes: 'Synced from Books catalog',
      },
      storySummary: {
        oneLineHook: cat.metadata?.oneLineHook || '',
        elevatorPitch: '',
        shortSynopsis: cat.metadata?.shortBlurb || '',
        longSynopsis: cat.metadata?.longBlurb || '',
        backCoverDescription: '',
        salesDescription: cat.metadata?.shortBlurb || '',
        spoilerSummary: '',
        tropes: [],
        themes: [],
        triggerWarnings: '',
        compTitles: '',
        compAuthors: '',
        readerPromise: '',
        heatLevel: '',
        violenceLevel: '',
        contentIntensity: '',
        endingType: '',
      },
      rights: {
        ebookRights: 'Held', printRights: 'Held', audioRights: 'Held', largePrintRights: 'Held',
        translationRights: 'Held', territorialRights: 'Worldwide', merchandisingRights: 'Held',
        filmTvRights: 'Held', bundleRights: 'Held', subscriptionRights: 'Held', serialRights: 'Held',
        directSalesRights: 'Held', rightsNotes: '', rightsExpirationDates: '', coAuthorSplit: '', ghostwriterTerms: '',
      },
      contributors: [],
      identifiers: {
        internalBookId: vaultBookId, asin: '', appleBooksId: '', koboId: '', googlePlayId: '',
        barnesNobleId: '', ingramId: '', d2dId: '', smashwordsId: '', bookFunnelId: '',
        shopifyProductId: '', wooCommerceId: '',
      },
      coverAssets: {
        masterConcept: '', coverDesigner: '', approvalDate: '', licenseTerms: '', stockImageLicenses: '',
        fontLicenses: '', ebookCover: cat.coverUrl || '', paperbackWrap: '', hardcoverWrap: '',
        largePrintCover: '', audiobookCover: '', mockup3d: '', adCreatives: '', socialGraphics: '', bannerGraphics: '',
      },
      marketingCopy: {
        oneLineHook: cat.metadata?.oneLineHook || '', adCopyShort: '', adCopyMedium: '', adCopyLong: '',
        newsletterAnnouncement: '', preOrderEmail: '', releaseEmail: '', salePromoCopy: '',
        retailerDescription: cat.metadata?.shortBlurb || '', directStoreDescription: '', socialCaptions: '',
        quoteGraphicsText: '', pressReleaseCopy: '', mediaKitCopy: '', podcastPitchCopy: '',
      },
      arcDistribution: {
        fileVersion: '', fileType: '', distributionMethod: '', platformAccount: '', platformCost: '',
        openDate: '', closeDate: '', totalSent: 0, streetTeamRecipients: 0, newReaderRecipients: 0,
        namedContacts: '', reviewRequestLanguage: '', embargoDate: '', reviewDeadline: '',
      },
      arcReviews: [],
      launchPlan: {
        launchType: '', targetReleaseDate: publishDate, preOrderStartDate: '', preOrderDuration: '',
        launchTeamLead: '', launchBudget: '', budgetBreakdown: '', timeline: [], checklist: [], launchNotes: '',
      },
      promotionalCampaigns: [],
      newsletterSwaps: [],
      awards: [],
      serialPlatforms: [],
      directSales: {
        sku: '', productTitle: title, productDescription: '', storePlatform: '', deliveryFile: '',
        bookFunnelLink: '', taxCategory: '', bundleInclusion: '', upsellMapping: '', couponEligibility: '', refundTerms: '',
      },
      complianceLegal: {
        copyrightRegistration: cat.metadata?.copyright || '', trademarkNotes: '', quotedMaterialPermissions: '',
        stockImageLicenses: '', fontLicenses: '', coAuthorAgreement: '', ghostwriterContract: '', translationContract: '',
        narratorContract: '', aiContentDisclosure: '', contentWarningNotes: '', blockedTerritories: '',
      },
      analyticsMapping: {
        platformMapping: '', adCampaignIds: '', landingPageIds: '', emailCampaignTags: '',
        utmStructures: '', promoSiteRuns: '', metadataTestPeriods: '', platformUpdateDates: '', awardsImpactPeriods: '',
      },
      revisionHistory: [],
      languageBranches: [{
        id: branchId,
        edition: {
          editionId: branchId,
          editionName: `${languageName} Edition`,
          editionType: 'First',
          language: languageName,
          languageCode: langCode,
          isPrimaryLanguage: true,
          localeVariant: langCode,
          publicationStatus: isPublished ? 'Published' : 'In Progress',
          releaseDate: publishDate,
          wordCount: 0,
          pageCount,
          chapterCount: 0,
        },
        localizedMetadata: {
          localizedTitle: title,
          localizedSubtitle: '',
          localizedSeriesName: cat.metadata?.seriesName || '',
          localizedHook: cat.metadata?.oneLineHook || '',
          localizedShortDescription: cat.metadata?.shortBlurb || '',
          localizedLongDescription: cat.metadata?.longBlurb || '',
          localizedAuthorBio: cat.metadata?.authorBio || '',
          localizedContentWarnings: '',
          translatorCreditLine: '',
        },
        identifiers: {
          isbnEbook: cat.metadata?.isbn || '',
          isbnPaperback: '',
          isbnHardcover: '',
          isbnLargePrint: '',
          isbnAudiobook: '',
          isbnAssignedDate: '',
          isbnStatus: cat.metadata?.isbn ? 'Active' : 'Reserved',
        },
        formats,
      }],
    };
  }

  private catalogFormatsToVault(cat: CatalogBookInput, branchId: string, isPublished: boolean): BookFormat[] {
    const formatTypes = (cat.formats?.length ? cat.formats : ['epub']) as string[];
    const mapType = (f: string): BookFormat['specs']['formatType'] => {
      const x = f.toLowerCase();
      if (x === 'pdf' || x.includes('paper')) return 'Paperback';
      if (x.includes('audio')) return 'Audiobook';
      if (x.includes('hard')) return 'Hardcover';
      return 'Ebook';
    };
    const status = isPublished ? 'Live' : 'Draft';
    return formatTypes.map((f, idx) => {
      const formatType = mapType(f);
      const formatId = `${branchId}-f${idx}`;
      return {
        id: formatId,
        specs: {
          formatId,
          formatType,
          parentLanguageBranchId: branchId,
          status: status as BookFormat['specs']['status'],
          releaseDate: cat.metadata?.publishDate || '',
          versionNumber: '1.0',
          wordCount: 0,
          pageCount: cat.metadata?.pageCount || 0,
          audioRuntime: '',
          trimSize: formatType === 'Paperback' ? '5.5 x 8.5' : '',
          paperType: '',
          bindingType: '',
          printFinish: '',
          interiorType: '',
          fileSize: '',
          drmPreference: formatType === 'Ebook' ? 'Off' : 'N/A',
          deliveryMethod: '',
        },
        pricingHistory: [],
        platformVariants: (cat.platforms || []).map((p, pi) => ({
          id: `${formatId}-p${pi}`,
          platformName: this.platformLabel(p.platform),
          storeRegion: 'US',
          uploadStatus: status as any,
          publicationDate: cat.metadata?.publishDate || '',
          lastUpdated: cat.updatedAt || '',
          platformTitle: cat.title || '',
          platformDescription: '',
          keywords: (cat.metadata?.keywords || []).join(', '),
          categories: (cat.metadata?.bisacCategories || []).join(', '),
          bisacCodes: '',
          platformPrice: '',
          platformSalePrice: '',
          isbn: cat.metadata?.isbn || '',
          asinOrPlatformId: '',
        })),
        uploadLogs: [],
        kdpSelect: undefined,
      } as BookFormat;
    });
  }

  private platformLabel(platform: string): string {
    const map: Record<string, string> = {
      amazon: 'Amazon KDP', kobo: 'Kobo', apple: 'Apple Books', 'barnes-noble': 'Barnes & Noble',
    };
    return map[platform] || platform;
  }

  private languageNameFromCode(code: string): string {
    const map: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
      pt: 'Portuguese (Brazil)', nl: 'Dutch', ja: 'Japanese', zh: 'Chinese (Simplified)',
      ko: 'Korean', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
    };
    const short = code.split('-')[0].toLowerCase();
    return map[short] || (code.length > 2 ? code : 'English');
  }

  /** Prefer catalog module books when present; otherwise fall back to imprint-tree books. */
  totalBooks = computed(() => {
    const catalog = this.catalogBooks().length;
    if (catalog > 0) return catalog;
    let c = 0;
    for (const i of this._company().imprints)
      for (const p of i.penNames)
        for (const s of p.series) c += s.books.length;
    return c;
  });

  totalSeries = computed(() => {
    const fromCatalog = new Set(
      this.catalogBooks()
        .map(b => (b.metadata?.seriesName || '').trim())
        .filter(Boolean)
    );
    let tree = 0;
    for (const i of this._company().imprints)
      for (const p of i.penNames) tree += p.series.length;
    return Math.max(fromCatalog.size, tree);
  });

  pipelineStats = computed(() => {
    let draft = 0, editing = 0, preorder = 0, published = 0;
    const catalog = this.catalogBooks();
    if (catalog.length > 0) {
      for (const b of catalog) {
        const s = (b.status || '').toLowerCase();
        if (s === 'published') published++;
        else if (s === 'pending' || s === 'approved') editing++;
        else draft++;
      }
    } else {
      for (const imp of this._company().imprints) {
        for (const pn of imp.penNames) {
          for (const s of pn.series) {
            for (const b of s.books) {
              switch (b.coreWork.bookStatus) {
                case 'Draft': draft++; break;
                case 'Editing': editing++; break;
                case 'Pre-order': preorder++; break;
                case 'Published': published++; break;
              }
            }
          }
        }
      }
    }
    const total = published + draft + editing + preorder || 1;
    return {
      draft, editing, preorder, published, total,
      draftPct: (draft / total) * 100,
      editingPct: (editing / total) * 100,
      preorderPct: (preorder / total) * 100,
      publishedPct: (published / total) * 100,
    };
  });

  addImprint(name = 'New Imprint', focus = ''): Imprint {
    const id = 'imp-' + Math.random().toString(36).slice(2, 10);
    const imprint: Imprint = {
      id,
      identity: {
        name: name.trim() || 'New Imprint',
        parentCompanyId: this._company().id || '',
        purposeGenreFocus: focus,
        status: 'Active',
        dateEstablished: new Date().toISOString().split('T')[0],
        logo: '',
        website: '',
        email: '',
      },
      legalIsbn: {
        isbnPrefix: '',
        isbnBlockPurchased: '',
        isbnBlockCount: 0,
        isbnsAssigned: 0,
        isbnsRemaining: 0,
        copyrightPageTemplate: '',
        dbaRegistration: '',
        trademark: '',
      },
      penNames: [],
    };
    this._company.update(c => ({ ...c, imprints: [...c.imprints, imprint] }));
    this.persist();
    return imprint;
  }

  private createEmptyCompany(): PublishingCompany {
    return {
      id: '',
      identity: {
        legalName: '', dbaNames: '', entityType: '', stateOfIncorporation: '', dateOfFormation: '',
        einTaxId: '', registeredAgent: '', fiscalYearEnd: '', companyStatus: 'Active',
        primaryAddress: '', mailingAddress: '', phone: '', primaryEmail: '', website: ''
      },
      ownership: { owners: [], operatingAgreementFile: '', sCorpElectionFile: '' },
      financial: {
        bankNames: '', businessChecking: '', businessSavings: '', paymentProcessors: '',
        accountingSoftware: '', cpaName: '', cpaContact: '', payrollProvider: '',
        reasonableSalary: '', quarterlyTaxSchedule: '', stateTaxRegistrations: ''
      },
      contractsLegal: {
        operatingAgreement: '', shareholderAgreement: '', trademarkRegistrations: '',
        copyrightAssignments: '', insurancePolicies: '', attorneyName: '', attorneyContact: ''
      },
      imprints: []
    };
  }

  private syncBreadcrumb(company: PublishingCompany): void {
    const label = company.identity?.legalName || company.identity?.dbaNames || 'Company';
    this.breadcrumb.set([{ level: 'company', id: company.id || 'company', label }]);
  }

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
    const boxSets = id === 'sr1' ? [
      {
        id: 'bs1',
        title: 'Hearts of Manhattan: The Complete Collection',
        subtitle: 'Books 1-3 Box Set',
        parentSeriesId: 'sr1',
        type: 'Digital Omnibus',
        status: 'Published' as const,
        publicationDate: '2024-05-01',
        penName: 'Eleanor Vance',
        copyrightHolder: 'Vance Publishing LLC',
        totalWordCount: 230000,
        totalPageCount: 920,
        constituentTitles: [
          { bookId: 'bk1', title: 'The Midnight Library', position: 1, edition: 'First Edition' },
          { bookId: 'bk2', title: 'Shadow Protocol', position: 2, edition: 'First Edition' },
          { bookId: 'bk3', title: 'Garden of Stars', position: 3, edition: 'First Edition' }
        ],
        exclusiveContent: true,
        exclusiveDescription: 'Includes a bonus epilogue chapter not available anywhere else.',
        coverDesigner: 'James Okafor',
        oneLineHook: 'All three bestselling Hearts of Manhattan contemporary romance novels in one exclusive volume.',
        shortDescription: 'Get the complete Hearts of Manhattan trilogy in a single volume, plus an exclusive epilogue!',
        longDescription: 'Escape into the glamorous, emotional, and captivating world of Eleanor Vance\'s Hearts of Manhattan trilogy. Includes all three books.',
        valueProposition: 'Save 40% compared to buying individual books',
        bundleRightsConfirmed: true,
        kdpSelectConflictCheck: 'Enrolled in KDP Select — wide outlets removed'
      }
    ] : [];

    return { id, identity: { name, internalId: id, parentPenNameId: '', seriesType: type as any, universeName: '', genre, subgenre: '', targetAudience: 'Adult', status: books.every(b => b.coreWork.bookStatus === 'Published') ? 'Active' : 'Active', startDate: '2022-01-15', endDate: '', plannedTotalBooks: type === 'Standalone' ? 1 : 5, currentTotalBooks: books.length, readingOrderNotes: '', interconnectedSeries: '' },
      world: { settingOverview: `The world of ${name}`, timeline: '', characterBibleFile: '', glossary: '', mapsFiles: '', continuityNotes: '', spoilerSummary: '' },
      branding: { logo: '', brandColors: '', tagline: `A ${genre} series`, oneLineHook: `Welcome to ${name}`, websitePage: '', readerMagnet: '', readThroughAssets: '', salesPage: '', compTitles: '', compAuthors: '' },
      boxSets, books };
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

  loadFromApi(): Observable<PublishingCompany> {
    return this.api.get<PublishingCompany>('/company').pipe(
      tap(company => {
        const data = company?.identity ? company : this.createEmptyCompany();
        this._company.set(data);
        this.syncBreadcrumb(data);
        this.isLoaded.set(true);
        // Re-apply catalog mirror now that the company tree is ready.
        if (this.catalogBooks().length) {
          this.mirrorCatalogIntoVaultTree(this.catalogBooks());
        }
      }),
      catchError(err => {
        console.error('Failed to load company', err);
        const empty = this.createEmptyCompany();
        this._company.set(empty);
        this.syncBreadcrumb(empty);
        this.isLoaded.set(true);
        if (this.catalogBooks().length) {
          this.mirrorCatalogIntoVaultTree(this.catalogBooks());
        }
        return of(empty);
      })
    );
  }

  private deferPersist = false;

  setDeferPersist(defer: boolean): void {
    this.deferPersist = defer;
  }

  flush(): void {
    this.deferPersist = false;
    this.persist();
  }

  private persist(): void {
    if (this.deferPersist) return;
    this.api.put('/company', this._company()).subscribe({
      error: err => console.error('Failed to save company', err)
    });
  }

  resetCompany(): void {
    const empty = this.createEmptyCompany();
    this._company.set(empty);
    this.syncBreadcrumb(empty);
    this.persist();
  }

  clearImprints(): void {
    this._company.update(c => ({ ...c, imprints: [] }));
    this.syncBreadcrumb(this._company());
    this.persist();
  }

  clearAllSeries(): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn => ({ ...pn, series: [] }))
      }))
    }));
    this.persist();
  }

  clearAllBoxSets(): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn => ({
          ...pn,
          series: pn.series.map(sr => ({ ...sr, boxSets: [] }))
        }))
      }))
    }));
    this.persist();
  }

  clearAllPenNames(): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({ ...imp, penNames: [] }))
    }));
    this.persist();
  }

  patchIdentity(partial: Partial<CompanyIdentity>): void {
    this._company.update(c => ({ ...c, identity: { ...c.identity, ...partial } }));
    this.persist();
  }

  patchFinancial(partial: Partial<FinancialTaxRecords>): void {
    this._company.update(c => ({ ...c, financial: { ...c.financial, ...partial } }));
    this.persist();
  }

  patchContractsLegal(partial: Partial<CompanyContractsLegal>): void {
    this._company.update(c => ({ ...c, contractsLegal: { ...c.contractsLegal, ...partial } }));
    this.persist();
  }

  patchOwnership(partial: Partial<CompanyOwnership>): void {
    this._company.update(c => ({ ...c, ownership: { ...c.ownership, ...partial } }));
    this.persist();
  }

  setByPath(path: string, value: string): void {
    const parts = path.split('.');
    if (parts.length !== 2) return;
    const [section, field] = parts;
    if (section === 'identity') this.patchIdentity({ [field]: value } as Partial<CompanyIdentity>);
    else if (section === 'financial') this.patchFinancial({ [field]: value } as Partial<FinancialTaxRecords>);
    else if (section === 'contractsLegal') this.patchContractsLegal({ [field]: value } as Partial<CompanyContractsLegal>);
    else if (section === 'ownership') this.patchOwnership({ [field]: value } as Partial<CompanyOwnership>);
  }

  importFieldRows(rows: { field: string; value: string }[]): { applied: number; skipped: string[] } {
    const skipped: string[] = [];
    let applied = 0;
    for (const row of rows) {
      const path = COMPANY_FIELD_MAP[row.field.trim().toLowerCase()];
      if (path) {
        this.setByPath(path, row.value);
        applied++;
      } else {
        skipped.push(row.field);
      }
    }
    return { applied, skipped };
  }

  addPenName(imprintId: string, displayName = 'New Pen Name'): PenName | undefined {
    const imprint = this.getImprint(imprintId);
    if (!imprint) return undefined;
    const id = 'pn-' + Math.random().toString(36).slice(2, 10);
    const penName: PenName = {
      id,
      identity: {
        displayName: displayName.trim() || 'New Pen Name',
        legalNameLinked: '',
        parentImprintId: imprintId,
        genre: '',
        subgenre: '',
        status: 'Active',
        dateCreated: new Date().toISOString().split('T')[0],
        dateRetired: '',
        reason: '',
        publiclyDisclosed: true,
        penNameType: 'Sole author',
        privacyLevel: 'Fully public',
      },
      coAuthors: [],
      branding: {
        authorPhoto: '', bioShort: '', bioMedium: '', bioLong: '', bioFirstPerson: '', bioThirdPerson: '',
        tagline: '', brandColors: '', brandFonts: '', coverStyleNotes: '', logo: '',
      },
      platformAccounts: [],
      onlinePresence: {
        authorWebsite: '', newsletterPlatform: '', newsletterName: '', subscriberCount: 0, socialAccounts: [],
      },
      readerCommunity: {
        primaryDemographic: '', readerPersona: '', arcTeam: '', betaReaderPool: '', readerFacebookGroup: '', engagementNotes: '',
      },
      series: [],
    };
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp =>
        imp.id === imprintId ? { ...imp, penNames: [...imp.penNames, penName] } : imp
      ),
    }));
    this.persist();
    return penName;
  }

  removePenName(imprintId: string, penNameId: string): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp =>
        imp.id === imprintId
          ? { ...imp, penNames: imp.penNames.filter(pn => pn.id !== penNameId) }
          : imp
      ),
    }));
    this.persist();
  }

  addSeries(penNameId: string, name = 'New Series'): Series | undefined {
    let created: Series | undefined;
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn => {
          if (pn.id !== penNameId) return pn;
          const id = 'sr-' + Math.random().toString(36).slice(2, 10);
          const series: Series = {
            id,
            identity: {
              name: name.trim() || 'New Series',
              internalId: id,
              parentPenNameId: penNameId,
              seriesType: 'Main series' as any,
              universeName: '',
              genre: pn.identity.genre || '',
              subgenre: '',
              targetAudience: 'Adult',
              status: 'Active',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              plannedTotalBooks: 1,
              currentTotalBooks: 0,
              readingOrderNotes: '',
              interconnectedSeries: '',
            },
            world: {
              settingOverview: '', timeline: '', characterBibleFile: '', glossary: '',
              mapsFiles: '', continuityNotes: '', spoilerSummary: '',
            },
            branding: {
              logo: '', brandColors: '', tagline: '', oneLineHook: '', websitePage: '',
              readerMagnet: '', readThroughAssets: '', salesPage: '', compTitles: '', compAuthors: '',
            },
            boxSets: [],
            books: [],
          };
          created = series;
          return { ...pn, series: [...pn.series, series] };
        }),
      })),
    }));
    if (created) this.persist();
    return created;
  }

  removeSeries(penNameId: string, seriesId: string): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id === penNameId
            ? { ...pn, series: pn.series.filter(s => s.id !== seriesId) }
            : pn
        ),
      })),
    }));
    this.persist();
  }

  updatePenName(penNameId: string, partial: Partial<PenName['identity']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id === penNameId ? { ...pn, identity: { ...pn.identity, ...partial } } : pn
        )
      }))
    }));
    this.persist();
  }

  updatePenNameFull(penNameId: string, partial: Partial<PenName>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id === penNameId ? { ...pn, ...partial } : pn
        )
      }))
    }));
    this.persist();
  }

  updateImprint(imprintId: string, partial: Partial<Imprint['identity']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp =>
        imp.id === imprintId ? { ...imp, identity: { ...imp.identity, ...partial } } : imp
      )
    }));
    this.persist();
  }

  updateImprintLegalIsbn(imprintId: string, partial: Partial<Imprint['legalIsbn']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp =>
        imp.id === imprintId ? { ...imp, legalIsbn: { ...imp.legalIsbn, ...partial } } : imp
      )
    }));
    this.persist();
  }

  updateSeries(penNameId: string, seriesId: string, partial: Partial<Series['identity']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id !== penNameId ? pn : {
            ...pn,
            series: pn.series.map(sr =>
              sr.id === seriesId ? { ...sr, identity: { ...sr.identity, ...partial } } : sr
            )
          }
        )
      }))
    }));
    this.persist();
  }

  updateSeriesWorld(penNameId: string, seriesId: string, partial: Partial<Series['world']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id !== penNameId ? pn : {
            ...pn,
            series: pn.series.map(sr =>
              sr.id === seriesId ? { ...sr, world: { ...sr.world, ...partial } } : sr
            )
          }
        )
      }))
    }));
    this.persist();
  }

  updateSeriesBranding(penNameId: string, seriesId: string, partial: Partial<Series['branding']>): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id !== penNameId ? pn : {
            ...pn,
            series: pn.series.map(sr =>
              sr.id === seriesId ? { ...sr, branding: { ...sr.branding, ...partial } } : sr
            )
          }
        )
      }))
    }));
    this.persist();
  }

  clearSeriesBooks(penNameId: string, seriesId: string): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id !== penNameId ? pn : {
            ...pn,
            series: pn.series.map(sr =>
              sr.id === seriesId ? { ...sr, books: [] } : sr
            )
          }
        )
      }))
    }));
    this.persist();
  }

  /** Find the pen name that owns a given series id (needed since Series doesn't carry its parent id at the top level). */
  findPenNameIdForSeries(seriesId: string): string | undefined {
    for (const imp of this._company().imprints) {
      for (const pn of imp.penNames) {
        if (pn.series.some(s => s.id === seriesId)) return pn.id;
      }
    }
    return undefined;
  }

  updateBoxSets(penNameId: string, seriesId: string, boxSets: BoxSetRecord[]): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn =>
          pn.id !== penNameId ? pn : {
            ...pn,
            series: pn.series.map(sr =>
              sr.id === seriesId ? { ...sr, boxSets } : sr
            )
          }
        )
      }))
    }));
    this.persist();
  }

  private mapLanguageBranch(branchId: string, fn: (lb: LanguageBranch) => LanguageBranch): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn => ({
          ...pn,
          series: pn.series.map(sr => ({
            ...sr,
            books: sr.books.map(bk => ({
              ...bk,
              languageBranches: bk.languageBranches.map(lb => lb.id === branchId ? fn(lb) : lb),
            })),
          })),
        })),
      })),
    }));
    this.persist();
  }

  private mapFormat(formatId: string, fn: (f: BookFormat) => BookFormat): void {
    this._company.update(c => ({
      ...c,
      imprints: c.imprints.map(imp => ({
        ...imp,
        penNames: imp.penNames.map(pn => ({
          ...pn,
          series: pn.series.map(sr => ({
            ...sr,
            books: sr.books.map(bk => ({
              ...bk,
              languageBranches: bk.languageBranches.map(lb => ({
                ...lb,
                formats: lb.formats.map(f => f.id === formatId ? fn(f) : f),
              })),
            })),
          })),
        })),
      })),
    }));
    this.persist();
  }

  updateLanguageBranchEdition(branchId: string, partial: Partial<EditionIdentity>): void {
    this.mapLanguageBranch(branchId, lb => ({ ...lb, edition: { ...lb.edition, ...partial } }));
  }

  updateLanguageBranchMetadata(branchId: string, partial: Partial<LocalizedMetadata>): void {
    this.mapLanguageBranch(branchId, lb => ({ ...lb, localizedMetadata: { ...lb.localizedMetadata, ...partial } }));
  }

  updateLanguageBranchIdentifiers(branchId: string, partial: Partial<LanguageIdentifiers>): void {
    this.mapLanguageBranch(branchId, lb => ({ ...lb, identifiers: { ...lb.identifiers, ...partial } }));
  }

  updateFormatSpecs(formatId: string, partial: Partial<FormatSpecs>): void {
    this.mapFormat(formatId, f => ({ ...f, specs: { ...f.specs, ...partial } }));
  }

  updateFormatKdpSelect(formatId: string, partial: Partial<KDPSelectEnrollment> | null): void {
    this.mapFormat(formatId, f => ({
      ...f,
      kdpSelect: partial === null
        ? undefined
        : {
            enrollmentStatus: 'Not enrolled',
            periodStart: '',
            periodEnd: '',
            autoRenew: false,
            autoRenewDeadline: '',
            enrollmentPeriodNumber: 0,
            wideStrategyFlag: '',
            reasonForEnrollment: '',
            exitPlanDate: '',
            kenpPages: 0,
            kenpRate: '',
            kenpReads: 0,
            kenpRevenue: '',
            countdownDealUsed: false,
            countdownDealDates: '',
            freeDaysUsed: false,
            freeDaysDates: '',
            freeDayDownloads: 0,
            ...f.kdpSelect,
            ...partial,
          },
    }));
  }

  updateFormatPricing(formatId: string, pricingHistory: PricingHistoryEntry[]): void {
    this.mapFormat(formatId, f => ({ ...f, pricingHistory: [...pricingHistory] }));
  }

  updateFormatPlatformVariants(formatId: string, platformVariants: PlatformVariant[]): void {
    this.mapFormat(formatId, f => ({ ...f, platformVariants: [...platformVariants] }));
  }

  updateFormatUploadLogs(formatId: string, uploadLogs: UploadLog[]): void {
    this.mapFormat(formatId, f => ({ ...f, uploadLogs: [...uploadLogs] }));
  }

  setCompanyAvatar(dataUrl: string): void {
    this.patchIdentity({ avatarUrl: dataUrl });
  }

  setImprintAvatar(imprintId: string, dataUrl: string): void {
    this.updateImprint(imprintId, { avatarUrl: dataUrl });
  }

  setPenNameAvatar(penNameId: string, dataUrl: string): void {
    this.updatePenName(penNameId, { avatarUrl: dataUrl });
  }
}
