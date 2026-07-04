import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PenName, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-penname',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-penname.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultPenNameComponent {
  @Input() penName!: PenName;
  @Input() activeTab = 'identity';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [{ id:'identity', label:'Identity' },{ id:'branding', label:'Branding' },{ id:'platforms', label:'Platforms' },{ id:'presence', label:'Online Presence' },{ id:'community', label:'Community' },{ id:'series', label:'Series & Books' }];
  get bookCount() { return this.penName.series.reduce((a,s) => a + s.books.length, 0); }
}
