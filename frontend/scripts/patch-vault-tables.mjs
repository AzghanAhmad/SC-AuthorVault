import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let t = readFileSync(path, 'utf-8');

function rep(old, neu, label) {
  if (!t.includes(old)) { console.warn('SKIP', label); return; }
  t = t.replace(old, neu);
  console.log('OK', label);
}

// bank accounts
rep(
`              @for(b of bankAccounts; track b.nickname) {
                <tr>
                  <td class="td-primary">{{ b.bank }}</td>
                  <td>{{ b.nickname }}</td>`,
`              @for(b of bankAccounts; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="b.bank" (ngModelChange)="patchBank(i, 'bank', $event)" /></td>
                  <td><input class="form-input" [ngModel]="b.nickname" (ngModelChange)="patchBank(i, 'nickname', $event)" /></td>`,
'bank start');

// tax docs - may already be done
if (t.includes('@for(d of taxDocs; track d.name)')) {
  rep(
`              @for(d of taxDocs; track d.name) {
                <tr>
                  <td class="td-primary">{{ d.name }}</td>
                  <td>{{ d.type }}</td>
                  <td>{{ d.year }}</td>
                  <td><span [class]="d.status === 'Filed' ? 'status status-green' : d.status === 'Pending' ? 'status status-amber' : 'status status-default'">{{ d.status }}</span></td>
                </tr>
              }`,
`              @for(d of taxDocs; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="d.name" (ngModelChange)="patchTaxDoc(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.type" (ngModelChange)="patchTaxDoc(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.year" (ngModelChange)="patchTaxDoc(i, 'year', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.status" (ngModelChange)="patchTaxDoc(i, 'status', $event)" /></td>
                </tr>
              }`,
'tax docs');
}

// isbn
rep(
`              @for(r of filteredIsbns; track r.isbn) {
                <tr>
                  <td class="td-primary" style="font-family:monospace">{{ r.isbn }}</td>
                  <td>{{ r.format }}</td>
                  <td>{{ r.title || '—' }}</td>
                  <td>{{ r.imprint || '—' }}</td>
                  <td>{{ r.series || '—' }}</td>
                  <td>{{ r.pubDate || '—' }}</td>
                  <td><span [class]="r.status === 'used' ? 'status status-blue' : r.status === 'reserved' ? 'status status-amber' : 'status status-green'">{{ r.status === 'used' ? 'Used' : r.status === 'reserved' ? 'Reserved' : 'Available' }}</span></td>
                </tr>
              }`,
`              @for(r of filteredIsbns; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" style="font-family:monospace" [ngModel]="r.isbn" (ngModelChange)="patchIsbn(i, 'isbn', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.format" (ngModelChange)="patchIsbn(i, 'format', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.title" (ngModelChange)="patchIsbn(i, 'title', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.imprint" (ngModelChange)="patchIsbn(i, 'imprint', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.series" (ngModelChange)="patchIsbn(i, 'series', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.pubDate" (ngModelChange)="patchIsbn(i, 'pubDate', $event)" /></td>
                  <td>
                    <select class="form-input" [ngModel]="r.status" (ngModelChange)="patchIsbn(i, 'status', $event)">
                      <option value="used">Used</option><option value="unused">Available</option><option value="reserved">Reserved</option>
                    </select>
                  </td>
                </tr>
              }`,
'isbn');

// contracts
rep(
`              @for(c of contractRecords; track c.name) {
                <tr>
                  <td class="td-primary">{{ c.name }}</td>
                  <td>{{ c.counterparty }}</td>
                  <td>{{ c.type }}</td>
                  <td>{{ c.date }}</td>
                  <td><span [class]="c.status === 'Active' ? 'status status-green' : c.status === 'Pending' ? 'status status-amber' : 'status status-default'">{{ c.status }}</span></td>
                </tr>
              }`,
`              @for(c of contractRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="c.name" (ngModelChange)="patchContract(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.counterparty" (ngModelChange)="patchContract(i, 'counterparty', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.type" (ngModelChange)="patchContract(i, 'type', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.date" (ngModelChange)="patchContract(i, 'date', $event)" /></td>
                  <td><input class="form-input" [ngModel]="c.status" (ngModelChange)="patchContract(i, 'status', $event)" /></td>
                </tr>
              }`,
'contracts');

// financial
rep(
`              @for(r of financialRecords; track r.month) {
                <tr>
                  <td class="td-primary">{{ r.month }}</td>
                  <td style="color:#10b981;font-weight:600">{{ r.revenue }}</td>
                  <td style="color:#ef4444">{{ r.expenses }}</td>
                  <td style="font-weight:700;color:var(--text-primary)">{{ r.net }}</td>
                </tr>
              }`,
`              @for(r of financialRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="r.month" (ngModelChange)="patchFinancial(i, 'month', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.revenue" (ngModelChange)="patchFinancial(i, 'revenue', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.expenses" (ngModelChange)="patchFinancial(i, 'expenses', $event)" /></td>
                  <td><input class="form-input" [ngModel]="r.net" (ngModelChange)="patchFinancial(i, 'net', $event)" /></td>
                </tr>
              }`,
'financial');

// team
rep(
`              @for(m of teamMembers; track m.name) {
                <tr>
                  <td class="td-primary">{{ m.name }}</td>
                  <td>{{ m.role }}</td>
                  <td>{{ m.company }}</td>
                  <td>{{ m.email }}</td>
                  <td>{{ m.phone || '—' }}</td>
                  <td>{{ m.contractDate }}</td>
                  <td>{{ m.rate }}</td>
                </tr>
              }`,
`              @for(m of teamMembers; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="m.name" (ngModelChange)="patchTeam(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.role" (ngModelChange)="patchTeam(i, 'role', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.company" (ngModelChange)="patchTeam(i, 'company', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.email" (ngModelChange)="patchTeam(i, 'email', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.phone" (ngModelChange)="patchTeam(i, 'phone', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.contractDate" (ngModelChange)="patchTeam(i, 'contractDate', $event)" /></td>
                  <td><input class="form-input" [ngModel]="m.rate" (ngModelChange)="patchTeam(i, 'rate', $event)" /></td>
                </tr>
              }`,
'team');

// domains table
rep(
`              @for(d of domainRecords; track d.domain) {
                <tr>
                  <td class="td-primary"><a [href]="'https://'+d.domain" target="_blank" style="color:var(--accent-blue)">{{ d.domain }}</a></td>
                  <td>{{ d.registrar }}</td>
                  <td>{{ d.renewal }}</td>
                  <td>{{ d.host }}</td>
                  <td>{{ d.ssl }}</td>
                  <td>{{ d.cms }}</td>
                  <td>{{ d.contact }}</td>
                </tr>
              }`,
`              @for(d of domainRecords; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="d.domain" (ngModelChange)="patchDomain(i, 'domain', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.registrar" (ngModelChange)="patchDomain(i, 'registrar', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.renewal" (ngModelChange)="patchDomain(i, 'renewal', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.host" (ngModelChange)="patchDomain(i, 'host', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.ssl" (ngModelChange)="patchDomain(i, 'ssl', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.cms" (ngModelChange)="patchDomain(i, 'cms', $event)" /></td>
                  <td><input class="form-input" [ngModel]="d.contact" (ngModelChange)="patchDomain(i, 'contact', $event)" /></td>
                </tr>
              }`,
'domains');

// dns notes
rep(
`              <div class="record-field"><span class="label">DNS Notes</span><span class="value">{{ d.dns }}</span></motion>`,
`              <app-editable-field label="DNS Notes" [value]="d.dns" (valueChange)="patchDomain(i, 'dns', $event)" [full]="true" />`,
'dns');

rep(
`              <motion class="record-field"><span class="label">DNS Notes</span><span class="value">{{ d.dns }}</span></motion>`,
`              <app-editable-field label="DNS Notes" [value]="d.dns" (valueChange)="patchDomain(i, 'dns', $event)" [full]="true" />`,
'dns2');

rep(
`          @for(d of domainRecords; track d.domain) {
            <div class="record-card">
              <div class="record-header"><h4 class="record-title">{{ d.domain }}</h4></div>
              <div class="record-field"><span class="label">DNS Notes</span><span class="value">{{ d.dns }}</span></div>
            </div>
          }`,
`          @for(d of domainRecords; track $index; let i = $index) {
            <div class="record-card">
              <motion class="record-header"><h4 class="record-title">{{ d.domain }}</h4></div>
              <app-editable-field label="DNS Notes" [value]="d.dns" (valueChange)="patchDomain(i, 'dns', $event)" [full]="true" />
            </div>
          }`,
'dns block');

// fix motion typos in dns block
t = t.replace('<motion class="record-header">', '<div class="record-header">').replace('</motion>', '</motion>');

// comms
rep(
`            <div class="form-group"><span class="form-label">Sender Domain</span><div class="form-value">authorvaultpress.com</div></div>
            <div class="form-group"><span class="form-label">Email Platform</span><div class="form-value">MailerLite</div></div>
            <div class="form-group"><span class="form-label">SPF Record</span><motion class="form-value" style="font-family:monospace;font-size:.75rem;">v=spf1 include:_spf.mlsend.com ~all</motion></motion>
            <div class="form-group"><span class="form-label">DKIM</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">DMARC</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">Newsletter List Size</span><div class="form-value">12,400 subscribers</div></div>
            <div class="form-group"><span class="form-label">Support Inbox</span><div class="form-value">support@authorvaultpress.com</div></div>`,
`            <app-editable-field label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />
            <app-editable-field label="SPF Record" [value]="communications.spfRecord" (valueChange)="patchComms('spfRecord', $event)" />
            <app-editable-field label="DKIM" [value]="communications.dkimStatus" (valueChange)="patchComms('dkimStatus', $event)" />
            <app-editable-field label="DMARC" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />
            <app-editable-field label="Support Inbox" [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" />`,
'comms partial');

rep(
`            <motion class="form-group"><span class="form-label">Sender Domain</span><motion class="form-value">authorvaultpress.com</div></div>
            <div class="form-group"><span class="form-label">Email Platform</span><div class="form-value">MailerLite</div></div>
            <div class="form-group"><span class="form-label">SPF Record</span><div class="form-value" style="font-family:monospace;font-size:.75rem;">v=spf1 include:_spf.mlsend.com ~all</div></div>
            <div class="form-group"><span class="form-label">DKIM</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">DMARC</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">Newsletter List Size</span><div class="form-value">12,400 subscribers</div></div>
            <div class="form-group"><span class="form-label">Support Inbox</span><div class="form-value">support@authorvaultpress.com</div></div>`,
`            <app-editable-field label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />
            <app-editable-field label="SPF Record" [value]="communications.spfRecord" (valueChange)="patchComms('spfRecord', $event)" />
            <app-editable-field label="DKIM" [value]="communications.dkimStatus" (valueChange)="patchComms('dkimStatus', $event)" />
            <app-editable-field label="DMARC" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />
            <app-editable-field label="Support Inbox" [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" />`,
'comms');

rep(
`            <div class="form-group"><span class="form-label">PO Box</span><div class="form-value">PO Box 1234, New York, NY 10001</motion></motion>`,
`            <app-editable-field label="PO Box" [value]="communications.poBox" (valueChange)="patchComms('poBox', $event)" />`,
'po box');

rep(
`            <div class="form-group"><span class="form-label">PO Box</span><div class="form-value">PO Box 1234, New York, NY 10001</div></div>`,
`            <app-editable-field label="PO Box" [value]="communications.poBox" (valueChange)="patchComms('poBox', $event)" />`,
'po box2');

// inventory
rep(
`              @for(item of inventoryItems; track item.sku) {
                <tr>
                  <td class="td-primary" style="font-family:monospace">{{ item.sku }}</td>
                  <td>{{ item.title }}</td>
                  <td>{{ item.format }}</td>
                  <td><span [class]="item.stock <= item.reorderPoint ? 'status status-red' : 'status status-green'">{{ item.stock }}</span></td>
                  <td>{{ item.reorderPoint }}</td>
                  <td>{{ item.printer }}</td>
                </tr>
              }`,
`              @for(item of inventoryItems; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" style="font-family:monospace" [ngModel]="item.sku" (ngModelChange)="patchInventory(i, 'sku', $event)" /></td>
                  <td><input class="form-input" [ngModel]="item.title" (ngModelChange)="patchInventory(i, 'title', $event)" /></td>
                  <td><input class="form-input" [ngModel]="item.format" (ngModelChange)="patchInventory(i, 'format', $event)" /></td>
                  <td><input class="form-input" type="number" [ngModel]="item.stock" (ngModelChange)="patchInventory(i, 'stock', +$event)" /></td>
                  <td><input class="form-input" type="number" [ngModel]="item.reorderPoint" (ngModelChange)="patchInventory(i, 'reorderPoint', +$event)" /></td>
                  <td><input class="form-input" [ngModel]="item.printer" (ngModelChange)="patchInventory(i, 'printer', $event)" /></td>
                </tr>
              }`,
'inventory');

rep(
`            <div class="form-group"><span class="form-label">Fulfillment Partner</span><motion class="form-value">BookVault / IngramSpark</motion></motion>
            <div class="form-group"><span class="form-label">Shipping Account</span><div class="form-value">UPS Business Account #****4821</div></div>
            <div class="form-group"><span class="form-label">Packaging Vendor</span><div class="form-value">Uline</div></div>
            <div class="form-group"><span class="form-label">Return Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Delivery Policy</span><motion class="form-value">Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.</div></div>`,
`            <app-editable-field label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('packagingVendor', $event)" />
            <app-editable-field label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field label="Delivery Policy" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />`,
'fulfillment');

rep(
`            <div class="form-group"><span class="form-label">Fulfillment Partner</span><motion class="form-value">BookVault / IngramSpark</div></div>
            <div class="form-group"><span class="form-label">Shipping Account</span><div class="form-value">UPS Business Account #****4821</div></div>
            <div class="form-group"><span class="form-label">Packaging Vendor</span><div class="form-value">Uline</div></div>
            <div class="form-group"><span class="form-label">Return Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Delivery Policy</span><div class="form-value">Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.</div></motion>`,
`            <app-editable-field label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('packagingVendor', $event)" />
            <app-editable-field label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field label="Delivery Policy" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />`,
'fulfillment2');

// security table
rep(
`              @for(s of securityEntries; track s.resource) {
                <tr>
                  <td class="td-primary">{{ s.resource }}</td>
                  <td>{{ s.owner }}</td>
                  <td><span class="status status-blue">{{ s.accessLevel }}</span></td>
                  <td>{{ s.twoFa }}</td>
                  <td>{{ s.recoveryEmail }}</td>
                  <td>{{ s.notes }}</td>
                </tr>
              }`,
`              @for(s of securityEntries; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="s.resource" (ngModelChange)="patchSecurity(i, 'resource', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.owner" (ngModelChange)="patchSecurity(i, 'owner', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.accessLevel" (ngModelChange)="patchSecurity(i, 'accessLevel', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.twoFa" (ngModelChange)="patchSecurity(i, 'twoFa', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.recoveryEmail" (ngModelChange)="patchSecurity(i, 'recoveryEmail', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.notes" (ngModelChange)="patchSecurity(i, 'notes', $event)" /></td>
                </tr>
              }`,
'security');

rep(
`            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><div class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</motion></motion>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</div></div>`,
`            <app-editable-field label="Emergency Access Instructions" type="textarea" [rows]="4" [value]="securityNotes.emergencyAccess" (valueChange)="patchSecurityNotes('emergencyAccess', $event)" [full]="true" />
            <app-editable-field label="Contractor Offboarding Steps" type="textarea" [rows]="4" [value]="securityNotes.offboardingSteps" (valueChange)="patchSecurityNotes('offboardingSteps', $event)" [full]="true" />`,
'security notes');

// logos
rep(
`                <motion class="entity-name">{{ logo.name }}</motion>
                <div class="entity-meta">{{ logo.format }} · {{ logo.dimensions }} · {{ logo.fileType }}</div>
                <div class="entity-meta" style="margin-top:.25rem;">Uploaded: {{ logo.uploaded }}</div>`,
`                <input class="form-input" style="margin-bottom:.35rem;font-weight:600" [ngModel]="logo.name" (ngModelChange)="patchLogo(i, 'name', $event)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.format + ' · ' + logo.dimensions + ' · ' + logo.fileType" (ngModelChange)="onLogoMeta(i, $event)" />
                <input class="form-input" style="font-size:.75rem" [ngModel]="logo.uploaded" (ngModelChange)="patchLogo(i, 'uploaded', $event)" />`,
'logos');

// fix logos loop index
t = t.replace('@for(logo of logos; track logo.name) {', '@for(logo of logos; track $index; let i = $index) {');

// sops
rep(
`              @for(s of filteredSops; track s.name) {
                <tr>
                  <td class="td-primary">{{ s.name }}</td>
                  <td>{{ s.description }}</td>
                  <td>{{ s.updated }}</td>`,
`              @for(s of filteredSops; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="s.name" (ngModelChange)="patchSop(i, 'name', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.description" (ngModelChange)="patchSop(i, 'description', $event)" /></td>
                  <td><input class="form-input" [ngModel]="s.updated" (ngModelChange)="patchSop(i, 'updated', $event)" /></td>`,
'sops');

// platforms - owner field editable
rep(
`                <div class="record-field"><span class="label">Account Owner</span><span class="value">{{ p.owner }}</span></div>`,
`                <app-editable-field label="Account Owner" [value]="p.owner" (valueChange)="patchPlatform('publishing', i, 'owner', $event)" />`,
'platform owner');

t = t.replace('@for(p of publishingPlatforms; track p.name) {', '@for(p of publishingPlatforms; track $index; let i = $index) {');

writeFileSync(path, t, 'utf-8');
console.log('Tables patch done');
