import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Imprint, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-imprint',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-imprint.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultImprintComponent {
  @Input() imprint!: Imprint;
  @Input() activeTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id: 'identity', label: 'Identity' }, { id: 'isbn', label: 'Legal & ISBN' }, { id: 'pennames', label: 'Pen Names' }];
  get totalBooks() { return this.imprint.penNames.reduce((a, p) => a + p.series.reduce((b, s) => b + s.books.length, 0), 0); }
}
