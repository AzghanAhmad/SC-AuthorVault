import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book, VaultLevel } from '../../../../models/author-vault.model';

@Component({
  selector: 'app-vault-book',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-book.component.html',
  styleUrls: ['../company-vault.component.css']
})
export class VaultBookComponent {
  @Input() book!: Book;
  @Input() activeTab = 'core';
  @Output() tabChange = new EventEmitter<string>();
  @Output() navigateTo = new EventEmitter<{level: VaultLevel; id: string; label: string}>();
  tabs = [
    {id:'core',label:'Core Work'},{id:'story',label:'Story'},{id:'rights',label:'Rights'},{id:'contributors',label:'Contributors'},
    {id:'identifiers',label:'IDs'},{id:'covers',label:'Covers'},{id:'marketing',label:'Marketing'},{id:'arc',label:'ARC'},
    {id:'launch',label:'Launch'},{id:'promos',label:'Promos'},{id:'awards',label:'Awards'},{id:'serial',label:'Serial'},
    {id:'directsales',label:'Direct Sales'},{id:'compliance',label:'Legal'},{id:'analytics',label:'Analytics'},
    {id:'revisions',label:'Revisions'},{id:'languages',label:'Editions'}
  ];
  getStatusClass(s: string): string {
    const v = s.toLowerCase();
    if (['active','published','live','approved','won','excellent','success'].includes(v)) return 'status-green';
    if (['draft','planned','pending','in progress','good','break-even'].includes(v)) return 'status-amber';
    if (['retired','rejected','failed','poor'].includes(v)) return 'status-red';
    return 'status-blue';
  }
}
