import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-reveal-toggle',
  standalone: true,
  templateUrl: './reveal-toggle.component.html',
  styleUrls: ['./reveal-toggle.component.css'],
  })
export class RevealToggleComponent {
  @Input() revealed = false;
  @Input() timer = 0;
  @Input() label = '';
  @Output() toggle = new EventEmitter<void>();
}
