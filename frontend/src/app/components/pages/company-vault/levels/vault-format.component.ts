import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookFormat } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-format',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-format.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultFormatComponent {
  @Input() format!: BookFormat;
  @Input() activeTab = 'specs';
  @Output() tabChange = new EventEmitter<string>();
  tabs = [{ id:'specs', label:'Specs' },{ id:'kdpselect', label:'KDP Select' },{ id:'pricing', label:'Pricing' },{ id:'variants', label:'Platforms' },{ id:'logs', label:'Logs' }];
}
