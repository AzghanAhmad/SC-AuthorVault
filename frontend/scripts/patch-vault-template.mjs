import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let t = readFileSync(path, 'utf-8');

function rep(old, neu, label) {
  if (!t.includes(old)) {
    console.warn('SKIP:', label);
    return;
  }
  t = t.replace(old, neu);
  console.log('OK:', label);
}

rep(
  `            <motion class="form-group full"><span class="form-label">Business Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Mailing Address</span><motion class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></motion>`,
  `            <app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />
            <app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />`,
  'identity addresses'
);

// fix if motion typo not present
rep(
  `            <div class="form-group full"><span class="form-label">Business Address</span><motion class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Mailing Address</span><div class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></div>`,
  `            <app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />
            <app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />`,
  'identity addresses v2'
);

rep(
  `            <div class="form-group full"><span class="form-label">Business Address</span><motion class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Mailing Address</span><div class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></motion>`,
  `            <app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />
            <app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />`,
  'identity addresses v3'
);

rep(
  `            <div class="form-group full"><span class="form-label">Business Address</span><div class="form-value">{{ company().identity.primaryAddress }}</motion></div>
            <div class="form-group full"><span class="form-label">Mailing Address</span><div class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></div>`,
  `            <app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />
            <app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />`,
  'identity addresses plain'
);

writeFileSync(path, t, 'utf-8');
