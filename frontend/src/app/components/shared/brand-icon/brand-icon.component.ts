import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-icon',
  standalone: true,
  templateUrl: './brand-icon.component.html',
  styleUrls: ['./brand-icon.component.css'],
  })
export class BrandIconComponent {
  size = input<'sm' | 'md'>('md');
}
