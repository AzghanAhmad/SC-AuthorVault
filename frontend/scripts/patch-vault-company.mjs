import { readFileSync, writeFileSync } from 'fs';

const path = 'src/app/components/pages/vault/vault-company-page.component.ts';
let text = readFileSync(path, 'utf-8');

// Remove local interfaces
const ifaceStart = text.indexOf('// ─── Mock data interfaces');
const compStart = text.indexOf('@Component({');
if (ifaceStart >= 0 && compStart > ifaceStart) {
  text = text.slice(0, ifaceStart) + text.slice(compStart);
}

text = text.replace(
  "  private readonly PIN_KEY = 'av_company_unlocked';\n  private readonly STORED_PIN_KEY = 'av_company_pin';",
  "  private readonly PIN_KEY = 'av_company_unlocked';\n  private readonly PIN_ACTIVITY_KEY = 'av_company_pin_activity';\n  private readonly STORED_PIN_KEY = 'av_company_pin';"
);

const oldInit = `  ngOnInit(): void {
    const stored = localStorage.getItem(this.PIN_KEY);
    this.unlocked = stored === 'true';
    this.isFirstTime = !localStorage.getItem(this.STORED_PIN_KEY);
    if (this.unlocked) this.resetPinTimeout();
  }`;

const newInit = `  ngOnInit(): void {
    this.isFirstTime = !localStorage.getItem(this.STORED_PIN_KEY);
    this.unlocked = this.isSessionValid();
    if (!this.unlocked) localStorage.removeItem(this.PIN_KEY);
    else this.resetPinTimeout();
  }

  private isSessionValid(): boolean {
    if (localStorage.getItem(this.PIN_KEY) !== 'true') return false;
    const last = Number(localStorage.getItem(this.PIN_ACTIVITY_KEY) || 0);
    if (!last) return false;
    return Date.now() - last < this.PIN_TIMEOUT_MS;
  }

  private touchActivity(): void {
    if (!this.unlocked) return;
    localStorage.setItem(this.PIN_ACTIVITY_KEY, String(Date.now()));
    localStorage.setItem(this.PIN_KEY, 'true');
    this.resetPinTimeout();
  }

  private checkPinExpiry(): void {
    if (this.unlocked && !this.isSessionValid()) this.lockVault();
  }`;

if (text.includes(oldInit)) text = text.replace(oldInit, newInit);

text = text.replace(
  'this.pinTimeoutRef = setTimeout(() => this.lockVault(), this.PIN_TIMEOUT_MS);',
  'this.pinTimeoutRef = setTimeout(() => this.checkPinExpiry(), this.PIN_TIMEOUT_MS);'
);

text = text.replace(
  /localStorage\.setItem\(this\.PIN_KEY, 'true'\);\s*\n\s*this\.resetPinTimeout\(\);/g,
  'this.touchActivity();'
);

text = text.replace(
  `    localStorage.removeItem(this.PIN_KEY);
  }`,
  `    localStorage.removeItem(this.PIN_KEY);
    localStorage.removeItem(this.PIN_ACTIVITY_KEY);
  }`
);

text = text.replace(
  `@HostListener('document:click')
  @HostListener('document:keydown')
  onUserActivity(): void {
    if (this.unlocked) this.resetPinTimeout();
  }`,
  `@HostListener('document:click')
  @HostListener('document:keydown')
  @HostListener('document:mousemove')
  @HostListener('document:scroll')
  onUserActivity(): void {
    if (this.unlocked) this.touchActivity();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (document.visibilityState === 'visible') this.checkPinExpiry();
  }`
);

const mockStart = text.indexOf('  // ── Mock data (tables / lists) ──');
const mockEnd = text.indexOf('  // ── PIN methods ──');
if (mockStart >= 0 && mockEnd > mockStart) {
  text = text.slice(0, mockStart) + text.slice(mockEnd);
}

const oldGetters = `  get ownerProfiles() { return this.companyStore.ownerProfiles(); }
  set ownerProfiles(v: OwnerProfile[]) { this.companyStore.updateOwners(v); }
  get publishingPlatforms() { return this.companyStore.publishingPlatforms(); }
  set publishingPlatforms(v: Platform[]) { this.companyStore.updatePlatforms(v); }
  get teamMembers() { return this.companyStore.teamMembers(); }
  set teamMembers(v: TeamMember[]) { this.companyStore.updateTeam(v); }`;

const newGetters = `  get ownerProfiles() { return this.companyStore.ownerProfiles(); }
  get publishingPlatforms() { return this.companyStore.publishingPlatforms(); }
  get teamMembers() { return this.companyStore.teamMembers(); }
  get bankAccounts() { return this.companyStore.bankAccounts(); }
  get paymentPlatforms() { return this.companyStore.paymentPlatforms(); }
  get taxDocs() { return this.companyStore.taxDocs(); }
  get isbnRecords() { return this.companyStore.isbnRecords(); }
  get contractRecords() { return this.companyStore.contractRecords(); }
  get financialRecords() { return this.companyStore.financialRecords(); }
  get domainRecords() { return this.companyStore.domainRecords(); }
  get inventoryItems() { return this.companyStore.inventoryItems(); }
  get securityEntries() { return this.companyStore.securityEntries(); }
  get logos() { return this.companyStore.logos(); }
  get sopTemplates() { return this.companyStore.sopTemplates(); }
  get corporateDocs() { return this.companyStore.corporateDocs(); }
  get communications() { return this.companyStore.communications(); }
  get inventoryFulfillment() { return this.companyStore.inventoryFulfillment(); }
  get securityNotes() { return this.companyStore.securityNotes(); }
  get taxRegistrations() { return this.companyStore.taxRegistrations(); }

  patchOwner(i: number, key: string, val: string | boolean): void {
    const list = [...this.ownerProfiles];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateOwners(list);
  }
  patchTeam(i: number, key: string, val: string): void {
    const list = [...this.teamMembers];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateTeam(list);
  }
  patchBank(i: number, key: string, val: string): void {
    const list = [...this.bankAccounts];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateBankAccounts(list);
  }
  patchTaxDoc(i: number, key: string, val: string): void {
    const list = [...this.taxDocs];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateTaxDocs(list);
  }
  patchIsbn(i: number, key: string, val: string): void {
    const list = [...this.isbnRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateIsbnRecords(list);
  }
  patchContract(i: number, key: string, val: string): void {
    const list = [...this.contractRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateContracts(list);
  }
  patchFinancial(i: number, key: string, val: string): void {
    const list = [...this.financialRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateFinancialRecords(list);
  }
  patchDomain(i: number, key: string, val: string): void {
    const list = [...this.domainRecords];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateDomains(list);
  }
  patchInventory(i: number, key: string, val: string | number): void {
    const list = [...this.inventoryItems];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateInventory(list);
  }
  patchSecurity(i: number, key: string, val: string): void {
    const list = [...this.securityEntries];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateSecurity(list);
  }
  patchLogo(i: number, key: string, val: string): void {
    const list = [...this.logos];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateLogos(list);
  }
  patchSop(i: number, key: string, val: string): void {
    const list = [...this.sopTemplates];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateSops(list);
  }
  patchCorpDoc(i: number, key: string, val: string): void {
    const list = [...this.corporateDocs];
    list[i] = { ...list[i], [key]: val };
    this.companyStore.updateCorporateDocs(list);
  }
  patchPlatform(listKey: 'publishing' | 'payment', i: number, key: string, val: string): void {
    const list = listKey === 'publishing' ? [...this.publishingPlatforms] : [...this.paymentPlatforms];
    list[i] = { ...list[i], [key]: val };
    if (listKey === 'publishing') this.companyStore.updatePlatforms(list);
    else this.companyStore.updatePaymentPlatforms(list);
  }
  patchComms(key: string, val: string): void {
    this.companyStore.updateCommunications({ ...this.communications, [key]: val });
  }
  patchFulfillment(key: string, val: string): void {
    this.companyStore.updateInventoryFulfillment({ ...this.inventoryFulfillment, [key]: val });
  }
  patchSecurityNotes(key: string, val: string): void {
    this.companyStore.updateSecurityNotes({ ...this.securityNotes, [key]: val });
  }
  patchTaxReg(key: string, val: string): void {
    this.companyStore.updateTaxRegistrations({ ...this.taxRegistrations, [key]: val });
  }`;

if (text.includes(oldGetters)) text = text.replace(oldGetters, newGetters);
text = text.replace('get filteredSops(): SopTemplate[]', 'get filteredSops()');

writeFileSync(path, text, 'utf-8');
console.log('Patched', path);
