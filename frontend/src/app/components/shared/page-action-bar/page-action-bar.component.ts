import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-action-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-action-bar.component.html',
  styleUrls: ['./page-action-bar.component.css'],
  })
export class PageActionBarComponent {
  @Input() editing = false;
  @Input() showEdit = true;
  @Input() deleteLabel = 'Delete all';
  @Output() editToggle = new EventEmitter<void>();
  @Output() deleteAll = new EventEmitter<void>();
}
