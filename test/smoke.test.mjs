// Smoke test for @hailbytes/security-roi-calculator.
// Uses node:test (built-in, no devDeps) and a minimal DOM shim.

import { test } from 'node:test';
import assert from 'node:assert/strict';

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

const mod = await import('../hailbytes-roi-calculator.js');

test('module exports a default class', () => {
  assert.equal(typeof mod.default, 'function');
});

test('module exports named calculateROI()', () => {
  assert.equal(typeof mod.calculateROI, 'function');
});

test('calculateROI() returns a structured result', () => {
  const r = mod.calculateROI({
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
  });
  assert.equal(typeof r, 'object');
  assert.ok(r);
});

test('calculateROI() reduces click rate as expected', () => {
  const r = mod.calculateROI({
    employeeCount: 50, avgSalary: 60000, incidentsPerYear: 2, avgIncidentCost: 25000,
    clickRateBefore: 30, expectedReduction: 50,
    trainingHoursPerYear: 2, platformLicensing: 750, implementationHours: 20, hourlyRate: 100,
  });
  assert.ok('clickRateAfter' in r);
  assert.ok(r.clickRateAfter < 30);
});

test('calculateROI() yields a numeric net benefit', () => {
  const r = mod.calculateROI({
    employeeCount: 1000, avgSalary: 90000, incidentsPerYear: 10, avgIncidentCost: 100000,
    clickRateBefore: 30, expectedReduction: 80,
    trainingHoursPerYear: 4, platformLicensing: 15000, implementationHours: 80, hourlyRate: 150,
  });
  assert.equal(typeof r.netBenefit, 'number');
  assert.equal(typeof r.roi, 'number');
  assert.equal(typeof r.paybackMonths, 'number');
});
