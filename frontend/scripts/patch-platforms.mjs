import { readFileSync, writeFileSync } from 'fs';
const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let t = readFileSync(path, 'utf-8');

const old = `                <motion class="record-field"><span class="label">Account Email</span><span class="value"><a [href]="'mailto:'+p.email" style="color:var(--accent-blue)">{{ p.email }}</a></span></div>
                <div class="record-field"><span class="label">Recovery Phone</span><span class="value">{{ p.phone || '—' }}</span></div>
                <div class="record-field"><span class="label">Payout Method</span><span class="value">{{ p.payout }}</span></div>
                <div class="record-field"><span class="label">Tax Profile Name</span><span class="value">{{ p.taxProfile }}</span></div>
                <div class="record-field"><span class="label">Account ID</span><span class="value" style="font-family:monospace;">{{ p.accountId || '—' }}</span></motion>`;

const neu = `                <app-editable-field label="Account Email" type="email" [value]="p.email" (valueChange)="patchPlatform('publishing', i, 'email', $event)" />
                <app-editable-field label="Recovery Phone" type="tel" [value]="p.phone" (valueChange)="patchPlatform('publishing', i, 'phone', $event)" />
                <app-editable-field label="Payout Method" [value]="p.payout" (valueChange)="patchPlatform('publishing', i, 'payout', $event)" />
                <app-editable-field label="Tax Profile Name" [value]="p.taxProfile" (valueChange)="patchPlatform('publishing', i, 'taxProfile', $event)" />
                <app-editable-field label="Account ID" [value]="p.accountId" (valueChange)="patchPlatform('publishing', i, 'accountId', $event)" />`;

if (t.includes(old.replace(/motion/g,'div'))) {
  t = t.replace(old.replace(/motion/g,'div'), neu);
} else if (t.includes(old)) {
  t = t.replace(old, neu);
} else {
  const plain = `                <div class="record-field"><span class="label">Account Email</span><span class="value"><a [href]="'mailto:'+p.email" style="color:var(--accent-blue)">{{ p.email }}</a></span></div>
                <div class="record-field"><span class="label">Recovery Phone</span><span class="value">{{ p.phone || '—' }}</span></div>
                <div class="record-field"><span class="label">Payout Method</span><span class="value">{{ p.payout }}</span></motion>
                <div class="record-field"><span class="label">Tax Profile Name</span><span class="value">{{ p.taxProfile }}</span></div>
                <div class="record-field"><span class="label">Account ID</span><span class="value" style="font-family:monospace;">{{ p.accountId || '—' }}</span></div>`;
  if (t.includes(plain.replace(/motion/g,'div'))) t = t.replace(plain.replace(/motion/g,'motion'), neu);
  else if (t.includes(plain)) t = t.replace(plain, neu);
}

t = t.replace(
  `<div class="record-field" style="margin-top:.35rem;"><span class="label">Notes</span><span class="value">{{ p.notes }}</span></div>`,
  `<app-editable-field label="Notes" [value]="p.notes" (valueChange)="patchPlatform('publishing', i, 'notes', $event)" [full]="true" />`
);

writeFileSync(path, t, 'utf-8');
console.log('platforms patched');
