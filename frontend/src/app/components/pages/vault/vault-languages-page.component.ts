import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { LanguageBranch } from '../../../models/author-vault.model';

const ALL_LANGUAGES = [
  'Afrikaans','Albanian','Arabic','Armenian','Azerbaijani','Basque','Belarusian','Bengali',
  'Bosnian','Bulgarian','Catalan','Chinese (Simplified)','Chinese (Traditional)','Croatian',
  'Czech','Danish','Dutch','English','Estonian','Finnish','French','Galician','Georgian',
  'German','Greek','Gujarati','Hebrew','Hindi','Hungarian','Icelandic','Indonesian','Irish',
  'Italian','Japanese','Kannada','Kazakh','Korean','Latvian','Lithuanian','Macedonian','Malay',
  'Maltese','Marathi','Mongolian','Nepali','Norwegian','Persian','Polish','Portuguese (Brazil)',
  'Portuguese (Portugal)','Punjabi','Romanian','Russian','Serbian','Slovak','Slovenian',
  'Spanish','Swahili','Swedish','Tamil','Telugu','Thai','Turkish','Ukrainian','Urdu',
  'Uzbek','Vietnamese','Welsh','Yoruba','Zulu'
];

interface BookEdition {
  bookTitle: string;
  seriesName: string;
  penName: string;
  branch: LanguageBranch;
}

@Component({
  selector: 'app-vault-languages-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../company-vault/company-vault.component.css', './vault-languages-page.component.css'],
  templateUrl: './vault-languages-page.component.html',
  })
export class VaultLanguagesPageComponent {
  private vs = inject(AuthorVaultService);
  readonly ALL_LANGUAGES = ALL_LANGUAGES;

  allEditions = computed((): BookEdition[] => {
    const result: BookEdition[] = [];
    for (const i of this.vs.company().imprints)
      for (const p of i.penNames)
        for (const s of p.series)
          for (const bk of s.books)
            for (const lb of bk.languageBranches)
              result.push({
                bookTitle: bk.coreWork.masterTitle,
                seriesName: s.identity.name,
                penName: p.identity.displayName,
                branch: lb
              });
    return result;
  });

  selectedLanguage = 'English'; // default English
  selectedEdition: BookEdition | null = null;
  detailTab = signal('edition');
  showAddLang = false;
  newLanguage = '';

  detailTabs = [
    { id: 'edition',     label: 'Edition' },
    { id: 'metadata',    label: 'Metadata' },
    { id: 'identifiers', label: 'ISBNs' },
    { id: 'formats',     label: 'Formats' },
  ];

  get availableLanguages(): string[] {
    const langs = new Set(this.allEditions().map(e => e.branch.edition.language));
    return Array.from(langs).sort();
  }

  titlesForLanguage(): BookEdition[] {
    if (!this.selectedLanguage) return this.allEditions();
    return this.allEditions().filter(e => e.branch.edition.language === this.selectedLanguage);
  }

  countByLanguage(lang: string): number {
    return this.allEditions().filter(e => e.branch.edition.language === lang).length;
  }

  publishedInLanguage(): number {
    return this.titlesForLanguage().filter(e => e.branch.edition.publicationStatus === 'Published').length;
  }
  inProgressInLanguage(): number {
    return this.titlesForLanguage().filter(e => e.branch.edition.publicationStatus === 'In Progress').length;
  }
  formatsInLanguage(): number {
    return this.titlesForLanguage().reduce((a, e) => a + e.branch.formats.length, 0);
  }

  get primaryCount() { return this.allEditions().filter(e => e.branch.edition.isPrimaryLanguage).length; }
  get translationCount() { return this.allEditions().filter(e => !e.branch.edition.isPrimaryLanguage).length; }
  get totalFormats() { return this.allEditions().reduce((a, e) => a + e.branch.formats.length, 0); }

  onLanguageChange() { this.selectedEdition = null; this.detailTab.set('edition'); }
  selectEdition(be: BookEdition) { this.selectedEdition = be; this.detailTab.set('edition'); }

  addLanguage() {
    if (this.newLanguage) {
      this.selectedLanguage = this.newLanguage;
      this.newLanguage = '';
      this.showAddLang = false;
      this.selectedEdition = null;
    }
  }
}
