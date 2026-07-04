import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Series, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-series',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-series.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultSeriesComponent {
  @Input() series!: Series;
  @Input() activeTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id:'identity', label:'Identity' },{ id:'world', label:'World' },{ id:'branding', label:'Branding' },{ id:'boxsets', label:'Box Sets' },{ id:'books', label:'Books' }];
}
