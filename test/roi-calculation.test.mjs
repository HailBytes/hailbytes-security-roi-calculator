// Comprehensive tests for the calculateROI() engine in @hailbytes/security-roi-calculator.
// Uses node:test (built-in, no devDeps) and a minimal DOM shim (same as smoke.test.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';

// ─── Minimal DOM shim (required because the module top-level calls customElements.define) ───

class FakeElement {
  constructor() { this.children = []; this.style = {}; this.classList = { add(){}, remove(){}, toggle(){} }; }
  appendChild(c) { this.children.push(c); return c; }
  setAttribute() {}
  getAttribute() { return null; }
  addEventListener() {}
  removeEventListener() {}
  querySelector() { return new FakeElement(); }
  querySelectorAll() { return []; }
  getElementById() { return new FakeElement(); }
  set innerHTML(_v) {} get innerHTML() { return ''; }
  set textContent(_v) {} get textContent() { return ''; }
  dispatchEvent() { return true; }
  attachShadow() { return new FakeElement(); }
}

globalThis.HTMLElement = class HTMLElement extends FakeElement {};
globalThis.customElements = { define() {}, get() { return undefined; } };
globalThis.document = {
  createElement: () => new FakeElement(),
  createElementNS: () => new FakeElement(),
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; this.bubbles = !!init.bubbles; this.composed = !!init.composed; }
};
globalThis.window = globalThis;

const { calculateROI } = await import('../hailbytes-roi-calculator.js');

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Default baseline inputs used across many tests. */
function baseInputs(overrides = {}) {
  return {
    employeeCount: 100,
    avgSalary: 80000,
    incidentsPerYear: 4,
    avgIncidentCost: 50000,
    clickRateBefore: 25,
    expectedReduction: 70,
    trainingHoursPerYear: 4,
    platformLicensing: 1500,
    implementationHours: 40,
    hourlyRate: 100,
    ...overrides,
  };
}

// Floating-point closeness check (tolerance in absolute dollars or pct points).
function close(actual, expected, tolerance, label) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tolerance,
    `${label || 'value'}: expected ≈ ${expected} (±${tolerance}), got ${actual} (diff=${diff})`
  );
}

// ─── 1. Known-input numeric output ────────────────────────────────────────

test('calculateROI — known inputs produce expected numeric outputs', () => {
  const inputs = baseInputs();
  const r = calculateROI(inputs);

  // clickRateReduction = (25 * 70) / 100 = 17.5
  close(r.clickRateReduction, 17.5, 0.001, 'clickRateReduction');

  // clickRateAfter = max(0, 25 - 17.5) = 7.5
  close(r.clickRateAfter, 7.5, 0.001, 'clickRateAfter');

  // annualRiskReduction = 4 * 50000 * (17.5 / 100) = 35000
  close(r.annualRiskReduction, 35000, 0.01, 'annualRiskReduction');

  // hourlyWage = 80000 / 2080 ≈ 38.4615
  // productivityCost = 100 * 4 * 38.4615 ≈ 15384.62
  close(r.productivityCost, 15384.615, 0.5, 'productivityCost');

  // implementationCost = 40 * 100 = 4000
  close(r.implementationCost, 4000, 0.01, 'implementationCost');

  // totalTrainingCost = 1500 + 4000 + 15384.615 ≈ 20884.615
  close(r.totalTrainingCost, 20884.615, 0.5, 'totalTrainingCost');

  // netBenefit = 35000 - 20884.615 ≈ 14115.385
  close(r.netBenefit, 14115.385, 0.5, 'netBenefit');

  // roi = (14115.385 / 20884.615) * 100 ≈ 67.59%
  close(r.roi, 67.59, 0.1, 'roi');

  // monthlyBenefit = 35000 / 12 ≈ 2916.667
  // paybackMonths = 20884.615 / 2916.667 ≈ 7.16
  close(r.paybackMonths, 7.16, 0.05, 'paybackMonths');

  // preventedIncidents = 4 * (17.5 / 100) = 0.7
  close(r.preventedIncidents, 0.7, 0.001, 'preventedIncidents');

  // Positive ROI
  assert.equal(r.isPositiveROI, true);
});

// ─── 2. Cost reduction calculations ──────────────────────────────────────

test('calculateROI — click rate reduction is applied correctly', () => {
  // 40% initial click rate, 80% expected reduction → reduction = 32pp, after = 8%
  const r = calculateROI(baseInputs({ clickRateBefore: 40, expectedReduction: 80 }));
  close(r.clickRateReduction, 32, 0.001, 'clickRateReduction');
  close(r.clickRateAfter, 8, 0.001, 'clickRateAfter');
});

test('calculateROI — annual risk reduction scales with click-rate reduction', () => {
  // annualRiskReduction = incidentsPerYear * avgIncidentCost * (clickRateReduction / 100)
  const r = calculateROI(baseInputs({
    incidentsPerYear: 10,
    avgIncidentCost: 100000,
    clickRateBefore: 20,
    expectedReduction: 50,
  }));
  // clickRateReduction = 20 * 50 / 100 = 10
  // annualRiskReduction = 10 * 100000 * (10/100) = 10 * 100000 * 0.10 = 100000
  close(r.annualRiskReduction, 100000, 0.01, 'annualRiskReduction');
});

test('calculateROI — incident cost savings directly proportional to avgIncidentCost', () => {
  const r1 = calculateROI(baseInputs({ avgIncidentCost: 50000 }));
  const r2 = calculateROI(baseInputs({ avgIncidentCost: 100000 }));
  // Doubling incident cost should double risk reduction
  close(r2.annualRiskReduction, r1.annualRiskReduction * 2, 0.01, 'risk reduction doubles');
});

// ─── 3. Employee count scaling ────────────────────────────────────────────

test('calculateROI — productivity cost scales linearly with employee count', () => {
  const r100 = calculateROI(baseInputs({ employeeCount: 100 }));
  const r500 = calculateROI(baseInputs({ employeeCount: 500 }));
  const r1000 = calculateROI(baseInputs({ employeeCount: 1000 }));

  // productivityCost = employeeCount * trainingHours * (avgSalary/2080)
  close(r500.productivityCost, r100.productivityCost * 5, 0.01, '500 = 5× productivity cost of 100');
  close(r1000.productivityCost, r100.productivityCost * 10, 0.01, '1000 = 10× productivity cost of 100');
});

test('calculateROI — more employees increase total cost but NOT risk reduction', () => {
  const r100 = calculateROI(baseInputs({ employeeCount: 100 }));
  const r1000 = calculateROI(baseInputs({ employeeCount: 1000 }));

  // Risk reduction depends on incidents and click rates, not employee count
  close(r1000.annualRiskReduction, r100.annualRiskReduction, 0.01, 'risk reduction unchanged');

  // Total cost increases because productivity cost grows
  assert.ok(r1000.totalTrainingCost > r100.totalTrainingCost, 'more employees → higher total cost');
});

test('calculateROI — more employees reduce ROI due to productivity cost increase', () => {
  const r100 = calculateROI(baseInputs({ employeeCount: 100 }));
  const r1000 = calculateROI(baseInputs({ employeeCount: 1000 }));
  assert.ok(r100.roi > r1000.roi, 'higher employee count → lower ROI (same risk reduction, higher cost)');
});

// ─── 4. Edge cases ───────────────────────────────────────────────────────

test('calculateROI — 0 employees: productivity cost is zero', () => {
  const r = calculateROI(baseInputs({ employeeCount: 0 }));
  close(r.productivityCost, 0, 0.001, 'productivityCost');
  // Total cost = platformLicensing + implementationCost
  close(r.totalTrainingCost, 1500 + 4000, 0.01, 'totalTrainingCost');
  // Net benefit = risk reduction - fixed costs
  close(r.netBenefit, 35000 - 5500, 0.01, 'netBenefit');
  assert.equal(r.isPositiveROI, true);
});

test('calculateROI — 0% click rate before: no risk reduction, infinite payback', () => {
  const r = calculateROI(baseInputs({ clickRateBefore: 0 }));
  close(r.clickRateReduction, 0, 0.001, 'clickRateReduction');
  close(r.clickRateAfter, 0, 0.001, 'clickRateAfter');
  close(r.annualRiskReduction, 0, 0.001, 'annualRiskReduction');
  close(r.preventedIncidents, 0, 0.001, 'preventedIncidents');
  // No benefit → payback is Infinity
  assert.equal(r.paybackMonths, Infinity);
  // ROI is negative (costs > 0, benefit = 0)
  assert.ok(r.roi < 0, 'ROI should be negative when no risk reduction');
  assert.equal(r.isPositiveROI, false);
});

test('calculateROI — 0% expected reduction: no improvement', () => {
  const r = calculateROI(baseInputs({ expectedReduction: 0 }));
  close(r.clickRateReduction, 0, 0.001, 'clickRateReduction');
  close(r.clickRateAfter, 25, 0.001, 'clickRateAfter stays at before');
  close(r.annualRiskReduction, 0, 0.001, 'annualRiskReduction');
  close(r.preventedIncidents, 0, 0.001, 'preventedIncidents');
  assert.equal(r.paybackMonths, Infinity);
});

test('calculateROI — 100% expected reduction: click rate drops to zero', () => {
  const r = calculateROI(baseInputs({ expectedReduction: 100 }));
  close(r.clickRateAfter, 0, 0.001, 'clickRateAfter');
  close(r.clickRateReduction, 25, 0.001, 'clickRateReduction');
  // annualRiskReduction = 4 * 50000 * (25/100) = 50000
  close(r.annualRiskReduction, 50000, 0.01, 'annualRiskReduction');
  // preventedIncidents = 4 * (25/100) = 1.0
  close(r.preventedIncidents, 1.0, 0.001, 'preventedIncidents');
});

test('calculateROI — very large org (50000 employees)', () => {
  const r = calculateROI(baseInputs({ employeeCount: 50000 }));
  // productivityCost = 50000 * 4 * (80000/2080) ≈ 7,692,307.69
  close(r.productivityCost, 7692307.69, 1, 'productivityCost');
  // Total cost = 1500 + 4000 + 7692307.69 ≈ 7697807.69
  close(r.totalTrainingCost, 7697807.69, 1, 'totalTrainingCost');
  // With risk reduction of only 35000, ROI is massively negative
  assert.ok(r.roi < 0, 'ROI should be negative for huge org with these parameters');
  assert.ok(r.netBenefit < 0, 'Net benefit should be negative');
  assert.equal(r.isPositiveROI, false);
});

test('calculateROI — very large org with proportionally large incidents → still positive ROI', () => {
  // Scale incidents to match org size
  const r = calculateROI(baseInputs({
    employeeCount: 50000,
    incidentsPerYear: 200,
    avgIncidentCost: 250000,
    platformLicensing: 750000, // $15/user for 50k
  }));
  // clickRateReduction = 25 * 70 / 100 = 17.5
  // annualRiskReduction = 200 * 250000 * 0.175 = 8,750,000
  close(r.annualRiskReduction, 8750000, 1, 'annualRiskReduction');
  // productivityCost = 50000 * 4 * (80000/2080) ≈ 7,692,308
  // totalTrainingCost = 750000 + 4000 + 7692308 ≈ 8,446,308
  close(r.totalTrainingCost, 8446308, 1, 'totalTrainingCost');
  // netBenefit = 8750000 - 8446308 ≈ 303,692
  assert.ok(r.netBenefit > 0, 'net benefit should be positive with scaled incidents');
  assert.equal(r.isPositiveROI, true);
});

test('calculateROI — 0 incidents: no risk to reduce', () => {
  const r = calculateROI(baseInputs({ incidentsPerYear: 0 }));
  close(r.annualRiskReduction, 0, 0.001, 'annualRiskReduction');
  close(r.preventedIncidents, 0, 0.001, 'preventedIncidents');
  assert.equal(r.paybackMonths, Infinity);
});

test('calculateROI — 0 training hours: no productivity cost', () => {
  const r = calculateROI(baseInputs({ trainingHoursPerYear: 0 }));
  close(r.productivityCost, 0, 0.001, 'productivityCost');
  close(r.totalTrainingCost, 1500 + 4000, 0.01, 'totalTrainingCost');
});

test('calculateROI — 0 total cost: ROI is 0', () => {
  const r = calculateROI(baseInputs({
    platformLicensing: 0,
    implementationHours: 0,
    hourlyRate: 0,
    trainingHoursPerYear: 0,
  }));
  close(r.totalTrainingCost, 0, 0.001, 'totalTrainingCost');
  assert.equal(r.roi, 0, 'ROI should be 0 when totalTrainingCost is 0');
});

// ─── 5. Result object shape — all documented fields ──────────────────────

test('calculateROI — returns all documented fields', () => {
  const r = calculateROI(baseInputs());

  // Echoed inputs
  assert.ok(r.inputs, 'has inputs');
  assert.equal(typeof r.inputs, 'object');

  // Key metrics (numbers)
  const numericFields = [
    'annualRiskReduction',
    'totalTrainingCost',
    'platformLicensing',
    'implementationCost',
    'productivityCost',
    'netBenefit',
    'roi',
    'paybackMonths',
    'clickRateBefore',
    'clickRateAfter',
    'clickRateReduction',
    'preventedIncidents',
  ];

  for (const field of numericFields) {
    assert.ok(field in r, `result has '${field}'`);
    assert.equal(typeof r[field], 'number', `'${field}' is a number`);
  }

  // isPositiveROI is boolean
  assert.ok('isPositiveROI' in r, 'result has isPositiveROI');
  assert.equal(typeof r.isPositiveROI, 'boolean', 'isPositiveROI is boolean');
});

test('calculateROI — inputs are echoed back unchanged', () => {
  const inputs = baseInputs();
  const r = calculateROI(inputs);
  assert.strictEqual(r.inputs, inputs, 'inputs reference is the same object');
  assert.equal(r.clickRateBefore, inputs.clickRateBefore, 'clickRateBefore echoed');
  assert.equal(r.platformLicensing, inputs.platformLicensing, 'platformLicensing echoed');
});

// ─── 6. Click-rate reduction tiers produce different results ─────────────

test('calculateROI — different expectedReduction tiers produce distinct results', () => {
  const tiers = [30, 50, 70, 90];
  const results = tiers.map(t => calculateROI(baseInputs({ expectedReduction: t })));

  // Each tier should have strictly increasing risk reduction
  for (let i = 1; i < results.length; i++) {
    assert.ok(
      results[i].annualRiskReduction > results[i - 1].annualRiskReduction,
      `tier ${tiers[i]}% > tier ${tiers[i - 1]}% risk reduction`
    );
    assert.ok(
      results[i].clickRateReduction > results[i - 1].clickRateReduction,
      `tier ${tiers[i]}% > tier ${tiers[i - 1]}% click rate reduction`
    );
    assert.ok(
      results[i].preventedIncidents > results[i - 1].preventedIncidents,
      `tier ${tiers[i]}% > tier ${tiers[i - 1]}% prevented incidents`
    );
  }
});

test('calculateROI — higher click-rate reduction yields higher ROI (costs constant except reduction)', () => {
  const r30 = calculateROI(baseInputs({ expectedReduction: 30 }));
  const r70 = calculateROI(baseInputs({ expectedReduction: 70 }));
  const r90 = calculateROI(baseInputs({ expectedReduction: 90 }));

  // Training costs are the same across tiers (they depend on employee count, salary, etc.)
  close(r30.totalTrainingCost, r70.totalTrainingCost, 0.01, 'same cost across tiers');
  close(r70.totalTrainingCost, r90.totalTrainingCost, 0.01, 'same cost across tiers');

  // But risk reduction increases
  assert.ok(r70.annualRiskReduction > r30.annualRiskReduction, '70% > 30% risk reduction');
  assert.ok(r90.annualRiskReduction > r70.annualRiskReduction, '90% > 70% risk reduction');

  // Therefore ROI increases
  assert.ok(r70.roi > r30.roi, '70% tier better ROI than 30%');
  assert.ok(r90.roi > r70.roi, '90% tier better ROI than 70%');
});

test('calculateROI — risk reduction proportional to reduction tier', () => {
  const r50 = calculateROI(baseInputs({ expectedReduction: 50 }));
  const r100 = calculateROI(baseInputs({ expectedReduction: 100 }));

  // risk reduction at 100% should be exactly double that at 50%
  close(r100.annualRiskReduction, r50.annualRiskReduction * 2, 0.01,
    'doubling reduction tier doubles risk reduction');
});

// ─── Additional relationship invariants ───────────────────────────────────

test('calculateROI — netBenefit = annualRiskReduction - totalTrainingCost', () => {
  const r = calculateROI(baseInputs({ expectedReduction: 60 }));
  close(r.netBenefit, r.annualRiskReduction - r.totalTrainingCost, 0.001, 'netBenefit formula');
});

test('calculateROI — totalTrainingCost = licensing + implementation + productivity', () => {
  const r = calculateROI(baseInputs());
  const expected = r.platformLicensing + r.implementationCost + r.productivityCost;
  close(r.totalTrainingCost, expected, 0.001, 'totalTrainingCost formula');
});

test('calculateROI — roi = (netBenefit / totalTrainingCost) * 100', () => {
  const r = calculateROI(baseInputs());
  const expectedRoi = (r.netBenefit / r.totalTrainingCost) * 100;
  close(r.roi, expectedRoi, 0.001, 'roi formula');
});

test('calculateROI — paybackMonths = totalTrainingCost / (annualRiskReduction / 12)', () => {
  const r = calculateROI(baseInputs());
  const monthlyBenefit = r.annualRiskReduction / 12;
  const expectedPayback = r.totalTrainingCost / monthlyBenefit;
  close(r.paybackMonths, expectedPayback, 0.01, 'paybackMonths formula');
});

test('calculateROI — clickRateAfter = max(0, clickRateBefore - clickRateReduction)', () => {
  const r1 = calculateROI(baseInputs({ clickRateBefore: 10, expectedReduction: 50 }));
  close(r1.clickRateAfter, 5, 0.001, 'normal case: 10% - 5% = 5%');

  // Even with extreme reduction, cannot go below 0
  const r2 = calculateROI(baseInputs({ clickRateBefore: 5, expectedReduction: 100 }));
  close(r2.clickRateAfter, 0, 0.001, 'floor at zero');
});

test('calculateROI — isPositiveROI matches roi > 0', () => {
  const rPos = calculateROI(baseInputs());
  assert.ok(rPos.roi > 0);
  assert.equal(rPos.isPositiveROI, true);

  const rNeg = calculateROI(baseInputs({ clickRateBefore: 0 }));
  assert.ok(rNeg.roi < 0);
  assert.equal(rNeg.isPositiveROI, false);
});
