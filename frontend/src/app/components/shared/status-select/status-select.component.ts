import { Component, Input, Output, EventEmitter } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {

  VaultStatusKind,

  mergeStatusOptions,

  vaultStatusLabel,

} from '../../../utils/vault-status.util';



@Component({

  selector: 'app-status-select',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './status-select.component.html',
  styleUrls: ['./status-select.component.css'],
  })

export class StatusSelectComponent {

  @Input() kind: VaultStatusKind = 'company';

  @Input() value = '';

  @Input() readOnly = false;

  @Input() disabled = false;

  @Input() options: string[] | null = null;



  @Output() valueChange = new EventEmitter<string>();



  get resolvedOptions(): string[] {

    return this.options ?? mergeStatusOptions(this.kind, this.value);

  }



  labelFor(status: string): string {

    return vaultStatusLabel(status);

  }



  onChange(v: string): void {

    this.valueChange.emit(v);

  }

}


