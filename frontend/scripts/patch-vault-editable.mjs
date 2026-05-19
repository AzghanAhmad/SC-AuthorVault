import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let t = readFileSync(path, 'utf-8');

const R = [
  ['<motion class="form-group full"><span class="form-label">Business Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>',
   '<app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />'],
  ['<div class="form-group full"><span class="form-label">Business Address</span><div class="form-value">{{ company().identity.primaryAddress }}</div></div>',
   '<app-editable-field label="Business Address" [value]="company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ primaryAddress: $event })" [full]="true" />'],
  ['<div class="form-group full"><span class="form-label">Mailing Address</span><motion class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</motion></motion>',
   '<app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />'],
  ['<div class="form-group full"><span class="form-label">Mailing Address</span><div class="form-value">{{ company().identity.mailingAddress || company().identity.primaryAddress }}</div></div>',
   '<app-editable-field label="Mailing Address" [value]="company().identity.mailingAddress || company().identity.primaryAddress" (valueChange)="vs.patchIdentity({ mailingAddress: $event })" [full]="true" />'],
  ['<div class="form-group"><span class="form-label">Operating Agreement File</span><div class="form-value">{{ company().ownership.operatingAgreementFile }}</div></div>',
   '<app-editable-field label="Operating Agreement File" [value]="company().ownership.operatingAgreementFile" (valueChange)="vs.patchOwnership({ operatingAgreementFile: $event })" />'],
  ['<div class="form-group"><span class="form-label">S-Corp Election File</span><div class="form-value">{{ company().ownership.sCorpElectionFile || \'—\' }}</div></motion>',
   '<app-editable-field label="S-Corp Election File" [value]="company().ownership.sCorpElectionFile || \'\'" (valueChange)="vs.patchOwnership({ sCorpElectionFile: $event })" />'],
  ['<div class="form-group"><span class="form-label">S-Corp Election File</span><div class="form-value">{{ company().ownership.sCorpElectionFile || \'—\' }}</div></div>',
   '<app-editable-field label="S-Corp Election File" [value]="company().ownership.sCorpElectionFile || \'\'" (valueChange)="vs.patchOwnership({ sCorpElectionFile: $event })" />'],
  ['<div class="form-group"><span class="form-label">Trademark Registrations</span><div class="form-value">{{ company().contractsLegal.trademarkRegistrations }}</div></div>',
   '<app-editable-field label="Trademark Registrations" [value]="company().contractsLegal.trademarkRegistrations" (valueChange)="vs.patchContractsLegal({ trademarkRegistrations: $event })" />'],
  ['<div class="form-group"><span class="form-label">Copyright Assignments</span><div class="form-value">{{ company().contractsLegal.copyrightAssignments }}</div></div>',
   '<app-editable-field label="Copyright Assignments" [value]="company().contractsLegal.copyrightAssignments" (valueChange)="vs.patchContractsLegal({ copyrightAssignments: $event })" />'],
  ['<div class="form-group"><span class="form-label">Insurance Policies</span><div class="form-value">{{ company().contractsLegal.insurancePolicies }}</div></div>',
   '<app-editable-field label="Insurance Policies" [value]="company().contractsLegal.insurancePolicies" (valueChange)="vs.patchContractsLegal({ insurancePolicies: $event })" />'],
  ['<div class="form-group"><span class="form-label">Attorney Name</span><div class="form-value">{{ company().contractsLegal.attorneyName }}</div></div>',
   '<app-editable-field label="Attorney Name" [value]="company().contractsLegal.attorneyName" (valueChange)="vs.patchContractsLegal({ attorneyName: $event })" />'],
  ['<motion class="form-group"><span class="form-label">Attorney Contact</span><div class="form-value">{{ company().contractsLegal.attorneyContact }}</div></div>',
   '<app-editable-field label="Attorney Contact" [value]="company().contractsLegal.attorneyContact" (valueChange)="vs.patchContractsLegal({ attorneyContact: $event })" type="email" />'],
  ['<motion class="form-group"><span class="form-label">Attorney Contact</span><div class="form-value">{{ company().contractsLegal.attorneyContact }}</motion></motion>',
   '<app-editable-field label="Attorney Contact" [value]="company().contractsLegal.attorneyContact" (valueChange)="vs.patchContractsLegal({ attorneyContact: $event })" type="email" />'],
  ['<div class="form-group"><span class="form-label">Attorney Contact</span><div class="form-value">{{ company().contractsLegal.attorneyContact }}</div></div>',
   '<app-editable-field label="Attorney Contact" [value]="company().contractsLegal.attorneyContact" (valueChange)="vs.patchContractsLegal({ attorneyContact: $event })" type="email" />'],
  ['<div class="form-group"><span class="form-label">Payment Processors</span><div class="form-value">{{ company().financial.paymentProcessors }}</div></div>',
   '<app-editable-field label="Payment Processors" [value]="company().financial.paymentProcessors" (valueChange)="vs.patchFinancial({ paymentProcessors: $event })" />'],
  ['<div class="form-group"><span class="form-label">Accounting Software</span><div class="form-value">{{ company().financial.accountingSoftware }}</div></div>',
   '<app-editable-field label="Accounting Software" [value]="company().financial.accountingSoftware" (valueChange)="vs.patchFinancial({ accountingSoftware: $event })" />'],
  ['<div class="form-group"><span class="form-label">CPA Name</span><div class="form-value">{{ company().financial.cpaName }}</div></div>',
   '<app-editable-field label="CPA Name" [value]="company().financial.cpaName" (valueChange)="vs.patchFinancial({ cpaName: $event })" />'],
  ['<div class="form-group"><span class="form-label">CPA Contact</span><div class="form-value">{{ company().financial.cpaContact }}</div></div>',
   '<app-editable-field label="CPA Contact" [value]="company().financial.cpaContact" (valueChange)="vs.patchFinancial({ cpaContact: $event })" type="email" />'],
  ['<div class="form-group"><span class="form-label">Tax Schedule</span><div class="form-value">{{ company().financial.quarterlyTaxSchedule }}</motion></motion>',
   '<app-editable-field label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />'],
  ['<div class="form-group"><span class="form-label">Tax Schedule</span><div class="form-value">{{ company().financial.quarterlyTaxSchedule }}</motion></motion>',
   '<app-editable-field label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />'],
  ['<div class="form-group"><span class="form-label">Tax Schedule</span><div class="form-value">{{ company().financial.quarterlyTaxSchedule }}</motion></motion>',
   '<app-editable-field label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />'],
  ['<div class="form-group"><span class="form-label">Tax Schedule</span><div class="form-value">{{ company().financial.quarterlyTaxSchedule }}</div></div>',
   '<app-editable-field label="Tax Schedule" [value]="company().financial.quarterlyTaxSchedule" (valueChange)="vs.patchFinancial({ quarterlyTaxSchedule: $event })" />'],
  ['<div class="form-group"><span class="form-label">State Tax Registrations</span><div class="form-value">{{ company().financial.stateTaxRegistrations }}</div></div>',
   '<app-editable-field label="State Tax Registrations" [value]="company().financial.stateTaxRegistrations" (valueChange)="vs.patchFinancial({ stateTaxRegistrations: $event })" />'],
];

for (const [a, b] of R) {
  if (t.includes(a)) {
    t = t.replace(a, b);
    console.log('replaced:', a.slice(0, 50));
  }
}

// corporate docs table
const corpOld = `            <tbody>
              <tr><td class="td-primary">Operating Agreement</td><td>{{ company().contractsLegal.operatingAgreement }}</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Articles of Incorporation</td><td>articles-of-incorporation.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Bylaws</td><td>company-bylaws.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">State Registration Docs</td><td>de-state-registration.pdf</td><td><span class="status status-green">On File</span></td></tr>
              <tr><td class="td-primary">Annual Report Filing 2024</td><td>annual-report-2024.pdf</td><td><span class="status status-green">Filed</span></td></tr>
              <tr><td class="td-primary">Annual Report Filing 2023</td><td>annual-report-2023.pdf</td><td><span class="status status-green">Filed</span></td></tr>
              <tr><td class="td-primary">Business License</td><td>business-license-ny.pdf</td><td><span class="status status-green">Active</span></td></tr>
              <tr><td class="td-primary">Shareholder Agreement</td><td>{{ company().contractsLegal.shareholderAgreement || 'N/A — Single Member' }}</td><td><span class="status status-default">N/A</span></td></tr>
            </tbody>`;

const corpNew = `            <tbody>
              @for(doc of corporateDocs; track $index; let i = $index) {
                <tr>
                  <td><input class="form-input" [ngModel]="doc.document" (ngModelChange)="patchCorpDoc(i, 'document', $event)" /></td>
                  <td><input class="form-input" [ngModel]="doc.fileRef" (ngModelChange)="patchCorpDoc(i, 'fileRef', $event)" /></td>
                  <td><input class="form-input" [ngModel]="doc.status" (ngModelChange)="patchCorpDoc(i, 'status', $event)" /></td>
                </tr>
              }
            </tbody>`;

if (t.includes(corpOld)) t = t.replace(corpOld, corpNew);

// tax docs table
t = t.replace(
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
              }`
);

// tax registrations
const taxRegOld = `            <motion class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><motion class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>`;

const taxRegNew = `            <app-editable-field label="EIN Confirmation" [value]="taxRegistrations.einConfirmation" (valueChange)="patchTaxReg('einConfirmation', $event)" />
            <app-editable-field label="Sales Tax Registrations" [value]="taxRegistrations.salesTaxRegistrations" (valueChange)="patchTaxReg('salesTaxRegistrations', $event)" />
            <app-editable-field label="VAT / GST" [value]="taxRegistrations.vatGst" (valueChange)="patchTaxReg('vatGst', $event)" />
            <app-editable-field label="Resale Certificates" [value]="taxRegistrations.resaleCertificates" (valueChange)="patchTaxReg('resaleCertificates', $event)" />`;

if (t.includes(taxRegOld)) t = t.replace(taxRegOld, taxRegNew);
else {
  t = t.replace(
    `            <motion class="form-group"><span class="form-label">EIN Confirmation</span><div class="form-value">ein-confirmation-cp575.pdf</div></div>
            <div class="form-group"><span class="form-label">Sales Tax Registrations</span><div class="form-value">NY, DE</div></div>
            <div class="form-group"><span class="form-label">VAT / GST</span><div class="form-value">N/A — US only</div></div>
            <div class="form-group"><span class="form-label">Resale Certificates</span><div class="form-value">resale-cert-ny.pdf</div></div>`,
    taxRegNew
  );
}

writeFileSync(path, t, 'utf-8');
console.log('Editable patch complete');
