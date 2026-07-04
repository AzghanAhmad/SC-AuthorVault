import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageBranch, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-language',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-language.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultLanguageComponent {
  @Input() branch!: LanguageBranch;
  @Input() activeTab = 'edition';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id:'edition', label:'Edition' },{ id:'metadata', label:'Metadata' },{ id:'identifiers', label:'ISBNs' },{ id:'formats', label:'Formats' }];
}
