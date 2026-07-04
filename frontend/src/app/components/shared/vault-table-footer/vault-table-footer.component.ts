import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vault-table-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vault-table-footer.component.html',
  styleUrls: ['./vault-table-footer.component.css'],
  })
export class VaultTableFooterComponent {
  @Input() totalItems = 0;
  @Input() page = 1;
  @Input() pageSize = 8;
  @Input() editMode = false;
  @Input() allowAdd = true;

  @Output() pageChange = new EventEmitter<number>();
  @Output() addRow = new EventEmitter<void>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  goPage(p: number): void {
    if (p >= 1 && p <= this.totalPages) this.pageChange.emit(p);
  }
}
