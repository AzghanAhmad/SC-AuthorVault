import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthorVaultService } from '../../../services/author-vault.service';
import { VaultLevel } from '../../../models/author-vault.model';
import { VaultCompanyComponent } from './levels/vault-company.component';
import { VaultImprintComponent } from './levels/vault-imprint.component';
import { VaultPenNameComponent } from './levels/vault-penname.component';
import { VaultSeriesComponent } from './levels/vault-series.component';
import { VaultBookComponent } from './levels/vault-book.component';
import { VaultLanguageComponent } from './levels/vault-language.component';
import { VaultFormatComponent } from './levels/vault-format.component';

@Component({
  selector: 'app-company-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, VaultCompanyComponent, VaultImprintComponent, VaultPenNameComponent, VaultSeriesComponent, VaultBookComponent, VaultLanguageComponent, VaultFormatComponent],
  templateUrl: './company-vault.component.html',
  styleUrls: ['./company-vault.component.css']
})
export class CompanyVaultComponent {
  vs = inject(AuthorVaultService);
  level = this.vs.currentLevel;
  currentId = this.vs.currentId;
  breadcrumb = this.vs.breadcrumb;
  company = this.vs.company;

  currentImprint = computed(() => this.level() === 'imprint' ? this.vs.getImprint(this.currentId()) : undefined);
  currentPenName = computed(() => this.level() === 'penname' ? this.vs.getPenName(this.currentId()) : undefined);
  currentSeries = computed(() => this.level() === 'series' ? this.vs.getSeries(this.currentId()) : undefined);
  currentBook = computed(() => this.level() === 'book' ? this.vs.getBook(this.currentId()) : undefined);
  currentLanguage = computed(() => this.level() === 'language' ? this.vs.getLanguageBranch(this.currentId()) : undefined);
  currentFormat = computed(() => this.level() === 'format' ? this.vs.getFormat(this.currentId()) : undefined);

  companyTab = signal<string>('identity');
  imprintTab = signal<string>('identity');
  penNameTab = signal<string>('identity');
  seriesTab = signal<string>('identity');
  bookTab = signal<string>('core');
  languageTab = signal<string>('edition');
  formatTab = signal<string>('specs');

  nav(level: VaultLevel, id: string, label: string) { this.vs.navigateTo(level, id, label); }
  goUp() { this.vs.navigateUp(); }
  goToBreadcrumb(idx: number) {
    const bc = this.breadcrumb();
    if (idx < bc.length - 1) this.vs.breadcrumb.set(bc.slice(0, idx + 1));
  }
  getLevelLabel(level: VaultLevel): string {
    const m: Record<string, string> = { company:'Company', imprint:'Imprint', penname:'Pen Name', series:'Series', book:'Book', language:'Edition', format:'Format' };
    return m[level] || level;
  }
}
