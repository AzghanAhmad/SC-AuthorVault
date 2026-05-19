import { readFileSync, writeFileSync } from 'fs';
const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let t = readFileSync(path, 'utf-8');

const blocks = [
  [`            <div class="form-group"><span class="form-label">Sender Domain</span><motion class="form-value">authorvaultpress.com</div></motion>
            <div class="form-group"><span class="form-label">Email Platform</span><div class="form-value">MailerLite</div></div>
            <div class="form-group"><span class="form-label">SPF Record</span><div class="form-value" style="font-family:monospace;font-size:.75rem;">v=spf1 include:_spf.mlsend.com ~all</div></div>
            <div class="form-group"><span class="form-label">DKIM</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">DMARC</span><div class="form-value"><span class="status status-green">Configured</span></div></motion>
            <div class="form-group"><span class="form-label">Newsletter List Size</span><div class="form-value">12,400 subscribers</div></div>
            <div class="form-group"><span class="form-label">Support Inbox</span><div class="form-value">support@authorvaultpress.com</div></div>`,
   `            <app-editable-field label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />
            <app-editable-field label="SPF Record" [value]="communications.spfRecord" (valueChange)="patchComms('spfRecord', $event)" />
            <app-editable-field label="DKIM" [value]="communications.dkimStatus" (valueChange)="patchComms('dkimStatus', $event)" />
            <app-editable-field label="DMARC" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />
            <app-editable-field label="Support Inbox" [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" />`],
  [`            <div class="form-group"><span class="form-label">Fulfillment Partner</span><div class="form-value">BookVault / IngramSpark</div></div>
            <motion class="form-group"><span class="form-label">Shipping Account</span><div class="form-value">UPS Business Account #****4821</div></div>
            <div class="form-group"><span class="form-label">Packaging Vendor</span><div class="form-value">Uline</div></div>
            <div class="form-group"><span class="form-label">Return Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Delivery Policy</span><div class="form-value">Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.</div></div>`,
   `            <app-editable-field label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('packagingVendor', $event)" />
            <app-editable-field label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field label="Delivery Policy" type="textarea" [rows]="3" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />`],
  [`            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><div class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</div></div>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</div></div>`,
   `            <app-editable-field label="Emergency Access Instructions" type="textarea" [rows]="4" [value]="securityNotes.emergencyAccess" (valueChange)="patchSecurityNotes('emergencyAccess', $event)" [full]="true" />
            <app-editable-field label="Contractor Offboarding Steps" type="textarea" [rows]="4" [value]="securityNotes.offboardingSteps" (valueChange)="patchSecurityNotes('offboardingSteps', $event)" [full]="true" />`],
  [`            <motion class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</motion></motion>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>`,
   `            <app-editable-field label="EIN Confirmation" [value]="taxRegistrations.einConfirmation" (valueChange)="patchTaxReg('einConfirmation', $event)" />
            <app-editable-field label="Sales Tax Registrations" [value]="taxRegistrations.salesTaxRegistrations" (valueChange)="patchTaxReg('salesTaxRegistrations', $event)" />
            <app-editable-field label="VAT / GST" [value]="taxRegistrations.vatGst" (valueChange)="patchTaxReg('vatGst', $event)" />
            <app-editable-field label="Resale Certificates" [value]="taxRegistrations.resaleCertificates" (valueChange)="patchTaxReg('resaleCertificates', $event)" />`],
];

for (const [a,b] of blocks) {
  if (t.includes(a)) { t = t.replace(a,b); console.log('ok'); }
  else {
    // try without motion typos
    const a2 = a.replace(/<motion /g,'<motion ').replace(/<\/motion>/g,'</motion>');
    if (t.includes(a.replace(/motion/g,'div'))) {
      t = t.replace(a.replace(/motion/g,'motion'), b);
      console.log('ok div');
    } else console.log('miss', a.slice(0,40));
  }
}

// plain comms
const commsPlain = `            <div class="form-group"><span class="form-label">Sender Domain</span><div class="form-value">authorvaultpress.com</div></div>
            <div class="form-group"><span class="form-label">Email Platform</span><div class="form-value">MailerLite</div></div>
            <div class="form-group"><span class="form-label">SPF Record</span><motion class="form-value" style="font-family:monospace;font-size:.75rem;">v=spf1 include:_spf.mlsend.com ~all</div></div>
            <motion class="form-group"><span class="form-label">DKIM</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">DMARC</span><div class="form-value"><span class="status status-green">Configured</span></div></div>
            <div class="form-group"><span class="form-label">Newsletter List Size</span><div class="form-value">12,400 subscribers</div></div>
            <div class="form-group"><span class="form-label">Support Inbox</span><div class="form-value">support@authorvaultpress.com</div></div>`;

const commsNew = `            <app-editable-field label="Sender Domain" [value]="communications.senderDomain" (valueChange)="patchComms('senderDomain', $event)" />
            <app-editable-field label="Email Platform" [value]="communications.emailPlatform" (valueChange)="patchComms('emailPlatform', $event)" />
            <app-editable-field label="SPF Record" [value]="communications.spfRecord" (valueChange)="patchComms('spfRecord', $event)" />
            <app-editable-field label="DKIM" [value]="communications.dkimStatus" (valueChange)="patchComms('dkimStatus', $event)" />
            <app-editable-field label="DMARC" [value]="communications.dmarcStatus" (valueChange)="patchComms('dmarcStatus', $event)" />
            <app-editable-field label="Newsletter List Size" [value]="communications.newsletterListSize" (valueChange)="patchComms('newsletterListSize', $event)" />
            <app-editable-field label="Support Inbox" [value]="communications.supportInbox" (valueChange)="patchComms('supportInbox', $event)" type="email" />`;

if (t.includes(commsPlain.replace(/motion/g,'div'))) {
  t = t.replace(commsPlain.replace(/motion/g,'div'), commsNew);
  console.log('comms plain');
} else if (t.includes(commsPlain)) {
  t = t.replace(commsPlain, commsNew);
  console.log('comms');
}

const fulPlain = `            <div class="form-group"><span class="form-label">Fulfillment Partner</span><div class="form-value">BookVault / IngramSpark</div></div>
            <div class="form-group"><span class="form-label">Shipping Account</span><div class="form-value">UPS Business Account #****4821</div></div>
            <div class="form-group"><span class="form-label">Packaging Vendor</span><div class="form-value">Uline</div></div>
            <div class="form-group"><span class="form-label">Return Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>
            <div class="form-group full"><span class="form-label">Delivery Policy</span><div class="form-value">Standard 5-7 business days. Expedited available. Digital delivery via BookFunnel within 5 minutes.</div></div>`;

const fulNew = `            <app-editable-field label="Fulfillment Partner" [value]="inventoryFulfillment.fulfillmentPartner" (valueChange)="patchFulfillment('fulfillmentPartner', $event)" />
            <app-editable-field label="Shipping Account" [value]="inventoryFulfillment.shippingAccount" (valueChange)="patchFulfillment('shippingAccount', $event)" />
            <app-editable-field label="Packaging Vendor" [value]="inventoryFulfillment.packagingVendor" (valueChange)="patchFulfillment('packagingVendor', $event)" />
            <app-editable-field label="Return Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" />
            <app-editable-field label="Delivery Policy" type="textarea" [rows]="3" [value]="inventoryFulfillment.deliveryPolicy" (valueChange)="patchFulfillment('deliveryPolicy', $event)" [full]="true" />`;

if (t.includes(fulPlain)) { t = t.replace(fulPlain, fulNew); console.log('ful'); }

const secPlain = `            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><div class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</div></div>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</motion></motion>`;

const secNew = `            <app-editable-field label="Emergency Access Instructions" type="textarea" [rows]="4" [value]="securityNotes.emergencyAccess" (valueChange)="patchSecurityNotes('emergencyAccess', $event)" [full]="true" />
            <app-editable-field label="Contractor Offboarding Steps" type="textarea" [rows]="4" [value]="securityNotes.offboardingSteps" (valueChange)="patchSecurityNotes('offboardingSteps', $event)" [full]="true" />`;

if (t.includes(secPlain.replace('</motion></motion>','</motion></motion>'))) {}
if (t.includes(`            <motion class="form-group full"><span class="form-label">Emergency Access Instructions</span>`)) {}
if (t.includes(`            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><div class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</div></div>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</div></div>`)) {
  t = t.replace(`            <div class="form-group full"><span class="form-label">Emergency Access Instructions</span><motion class="form-value">In case of emergency, contact attorney James Chen at jchen@publishinglaw.com. Master password vault is stored in 1Password under "Emergency Kit". Backup codes are in the fireproof safe at primary address.</div></div>
            <div class="form-group full"><span class="form-label">Contractor Offboarding Steps</span><div class="form-value">1. Revoke platform access within 24 hours. 2. Change shared passwords. 3. Remove from team communication channels. 4. Archive all work files. 5. Issue final payment. 6. Send NDA reminder.</div></div>`, secNew);
  console.log('sec');
}

const taxPlain = `            <div class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</motion></motion>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>`;

const taxNew = `            <app-editable-field label="EIN Confirmation" [value]="taxRegistrations.einConfirmation" (valueChange)="patchTaxReg('einConfirmation', $event)" />
            <app-editable-field label="Sales Tax Registrations" [value]="taxRegistrations.salesTaxRegistrations" (valueChange)="patchTaxReg('salesTaxRegistrations', $event)" />
            <app-editable-field label="VAT / GST" [value]="taxRegistrations.vatGst" (valueChange)="patchTaxReg('vatGst', $event)" />
            <app-editable-field label="Resale Certificates" [value]="taxRegistrations.resaleCertificates" (valueChange)="patchTaxReg('resaleCertificates', $event)" />`;

if (t.includes(taxPlain.replace(/motion/g,'motion'))) {}
if (t.includes(`            <div class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>`)) {
  t = t.replace(`            <div class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</motion></motion>`, taxNew);
  console.log('tax');
}

// logos - simple fields
if (t.includes('<motion class="entity-name">{{ logo.name }}')) {}
if (t.includes('<div class="entity-name">{{ logo.name }}</div>')) {
  t = t.replace(
    `                <div class="entity-name">{{ logo.name }}</div>
                <div class="entity-meta">{{ logo.format }} · {{ logo.dimensions }} · {{ logo.fileType }}</div>
                <div class="entity-meta" style="margin-top:.25rem;">Uploaded: {{ logo.uploaded }}</div>`,
    `                <input class="form-input" style="margin-bottom:.35rem;font-weight:600" [ngModel]="logo.name" (ngModelChange)="patchLogo(i, 'name', $event)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.format" (ngModelChange)="patchLogo(i, 'format', $event)" />
                <input class="form-input" style="margin-bottom:.25rem;font-size:.75rem" [ngModel]="logo.dimensions" (ngModelChange)="patchLogo(i, 'dimensions', $event)" />
                <input class="form-input" style="font-size:.75rem" [ngModel]="logo.uploaded" (ngModelChange)="patchLogo(i, 'uploaded', $event)" />`
  );
  console.log('logos');
}

writeFileSync(path, t, 'utf-8');
