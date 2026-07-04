import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublishingCompany, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-company',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-company.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultCompanyComponent {
  @Input() company!: PublishingCompany;
  @Input() companyTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();

  tabs = [
    { id: 'identity', label: 'Identity & Legal' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'financial', label: 'Financial & Tax' },
    { id: 'contracts', label: 'Contracts & Legal' },
    { id: 'imprints', label: 'Imprints' },
  ];

  get penNameCount() { return this.company.imprints.reduce((a, i) => a + i.penNames.length, 0); }
  get bookCount() { return this.company.imprints.reduce((a, i) => a + i.penNames.reduce((b, p) => b + p.series.reduce((c, s) => c + s.books.length, 0), 0), 0); }
}
