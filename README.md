# HailBytes Security ROI Calculator

> **Zero-dependency web component** for calculating the return on investment of security awareness training. Works in Hugo, React, Vue, plain HTML, or any SPA framework. Install via npm or drop in via a `<script type="module">` CDN tag.

[![npm version](https://img.shields.io/npm/v/@hailbytes/security-roi-calculator.svg)](https://www.npmjs.com/package/@hailbytes/security-roi-calculator)
[![npm downloads](https://img.shields.io/npm/dw/%40hailbytes%2Fsecurity-roi-calculator.svg)](https://www.npmjs.com/package/@hailbytes/security-roi-calculator)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL_2.0-brightgreen.svg)](LICENSE)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/%40hailbytes%2Fsecurity-roi-calculator)](https://bundlephobia.com/package/@hailbytes/security-roi-calculator)

---

## What it is

A single JavaScript file that registers the custom HTML element `<hailbytes-roi-calculator>`. It implements a guided 4-step calculator that quantifies the financial benefit of security awareness training for your organization.

Built using the **Web Components standard** (Custom Elements + Shadow DOM):

- 🔒 Styles fully encapsulated — no CSS bleed in or out
- 🧩 Framework-agnostic — Hugo, React, Vue, Angular, Svelte, plain HTML
- ⚡ No build step required — single `<script type="module">` tag
- 📦 Zero external dependencies — no jQuery, no Chart.js, no lodash

### Calculator Steps

| Step | What it captures |
|------|-----------------|
| **1. Baseline** | Employees, average salary, annual incidents, cost per incident |
| **2. Training** | Pre-training phishing click rate, expected reduction %, hours/year |
| **3. Costs** | Platform licensing (auto-calculated at $15/user/yr), implementation hours & rate |
| **4. Results** | Full ROI analysis with metric cards, CSS bar chart, and cost breakdown |

---

## Install

```bash
npm install @hailbytes/security-roi-calculator
```

Or use it without a bundler via a CDN (see below).

## Quick Start

### 1. npm (bundlers, Next.js, Vite, Webpack, etc.)

```js
// Side-effect import registers the <hailbytes-roi-calculator> custom element.
import '@hailbytes/security-roi-calculator';

// Or import the pure DOM-free calculator:
import { calculateROI } from '@hailbytes/security-roi-calculator';
console.log(calculateROI({ /* inputs */ }).netBenefit);
```

```html
<hailbytes-roi-calculator theme="dark"></hailbytes-roi-calculator>
```

### 2. Plain HTML / Hugo / Static Sites

```html
<!-- Load the component -->
<script type="module" src="hailbytes-roi-calculator.js"></script>

<!-- Use it anywhere on the page -->
<hailbytes-roi-calculator></hailbytes-roi-calculator>

<!-- Dark theme, white-label (no HailBytes branding) -->
<hailbytes-roi-calculator theme="dark" branding="off"></hailbytes-roi-calculator>
```

### 3. Via CDN (jsDelivr — no download needed)

```html
<!-- From npm via jsDelivr (recommended — version-pinned) -->
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@hailbytes/security-roi-calculator/hailbytes-roi-calculator.js">
</script>

<!-- Or directly from GitHub main (always latest) -->
<script type="module"
  src="https://cdn.jsdelivr.net/gh/HailBytes/security-roi-calculator@main/hailbytes-roi-calculator.js">
</script>

<hailbytes-roi-calculator theme="dark"></hailbytes-roi-calculator>
```

### 4. React / Vue

```js
// In your entry point or component file:
import 'hailbytes-roi-calculator.js'; // registers the custom element
```

```jsx
// React component
export function ROIPage() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const handler = (e) => console.log('ROI result:', e.detail);
    el.addEventListener('roi-calculated', handler);
    return () => el.removeEventListener('roi-calculated', handler);
  }, []);

  return <hailbytes-roi-calculator ref={ref} theme="dark" />;
}
```

```vue
<!-- Vue 3 -->
<template>
  <hailbytes-roi-calculator
    theme="dark"
    @roi-calculated="onResult"
  />
</template>

<script setup>
import 'hailbytes-roi-calculator.js';
const onResult = (e) => console.log(e.detail);
</script>
```

---

## API

### Attributes

| Attribute  | Values              | Default   | Description                                       |
|------------|---------------------|-----------|---------------------------------------------------|
| `theme`    | `"light"` / `"dark"` | `"light"` | Color theme                                       |
| `branding` | `"off"`             | _(shown)_ | Hide the "by HailBytes" header line and CTA       |

### Custom Events

#### `roi-calculated`

Fired when the user completes all tabs and clicks **Calculate ROI**. Bubbles up through the DOM.

```js
document.querySelector('hailbytes-roi-calculator')
  .addEventListener('roi-calculated', (event) => {
    const {
      annualRiskReduction,
      totalTrainingCost,
      netBenefit,
      roi,
      paybackMonths,
      clickRateAfter,
      preventedIncidents,
    } = event.detail;

    console.log(`ROI: ${roi.toFixed(0)}%`);
    console.log(`Net benefit: $${netBenefit.toLocaleString()}`);
    console.log(`Payback: ${paybackMonths.toFixed(1)} months`);
  });
```

### Static Method: `calculate(inputs)`

Run the calculation engine directly without a DOM element:

```js
import HailbytesROICalculator from './hailbytes-roi-calculator.js';
// or named export:
import { calculateROI } from './hailbytes-roi-calculator.js';

const result = HailbytesROICalculator.calculate({
  employeeCount:        250,
  avgSalary:            65000,
  incidentsPerYear:     12,
  avgIncidentCost:      25000,
  clickRateBefore:      30,      // 30% click rate before training
  expectedReduction:    70,      // 70% reduction after training
  trainingHoursPerYear: 4,
  platformLicensing:    3750,    // or 0 to auto-calc ($15/user)
  implementationHours:  40,
  hourlyRate:           75,
});

console.log(result.roi);               // e.g. 312
console.log(result.annualRiskReduction); // e.g. $63,000
console.log(result.paybackMonths);     // e.g. 2.3
```

### Result Object Shape

```ts
{
  // Key metrics
  annualRiskReduction:  number;  // $ saved by reducing incidents
  totalTrainingCost:    number;  // $ total cost of training program
  netBenefit:           number;  // annualRiskReduction - totalTrainingCost
  roi:                  number;  // (netBenefit / totalTrainingCost) * 100
  paybackMonths:        number;  // months until cumulative benefit covers cost
  isPositiveROI:        boolean;

  // Derived metrics
  clickRateBefore:      number;
  clickRateAfter:       number;
  clickRateReduction:   number;
  preventedIncidents:   number;

  // Cost breakdown
  platformLicensing:    number;
  implementationCost:   number;
  productivityCost:     number;  // employee time cost during training

  // Echo of inputs
  inputs: { ... }
}
```

---

## Calculation Methodology

```
click_rate_reduction = click_rate_before × (expected_reduction / 100)
click_rate_after     = click_rate_before - click_rate_reduction

annual_risk_reduction = incidents_per_year × avg_incident_cost
                        × (click_rate_reduction / 100)

hourly_wage           = avg_salary / 2080  (2080 work hours/year)
productivity_cost     = employees × training_hours × hourly_wage
implementation_cost   = implementation_hours × hourly_rate
total_training_cost   = platform_licensing + implementation_cost
                        + productivity_cost

net_benefit           = annual_risk_reduction - total_training_cost
roi (%)               = (net_benefit / total_training_cost) × 100
payback (months)      = total_training_cost / (annual_risk_reduction / 12)
```

**Platform licensing default:** $15 per user per year (industry average for security awareness platforms). Auto-populated when employee count is entered; can be overridden.

---

## See also

Part of the HailBytes calculator suite — drop-in web components for security and risk:

- [`@hailbytes/security-roi-calculator`](https://www.npmjs.com/package/@hailbytes/security-roi-calculator) — security awareness training ROI _(this package)_
- [`@hailbytes/password-analyzer`](https://www.npmjs.com/package/@hailbytes/password-analyzer) — password strength + entropy analyzer ([repo](https://github.com/HailBytes/hailbytes-password-analyzer))
- [`@hailbytes/pentest-calculator`](https://www.npmjs.com/package/@hailbytes/pentest-calculator) — penetration testing scope and cost estimator ([repo](https://github.com/HailBytes/hailbytes-pentest-calculator))
- [`@hailbytes/vulnerability-calculator`](https://www.npmjs.com/package/@hailbytes/vulnerability-calculator) — vulnerability scanner infrastructure sizing ([repo](https://github.com/HailBytes/hailbytes-vulnerability-calculator))

---

## License

[Mozilla Public License 2.0](LICENSE)

---

## About HailBytes

[HailBytes](https://hailbytes.com) provides cybersecurity training, phishing simulation, and security awareness tools for organizations. Our mission is to make enterprise-grade security accessible to every organization.

---

## Enterprise Support

[![HailBytes - Enterprise Security](https://hailbytes.com/images/icons/hb_hb_white_horizontal.png)](https://www.hailbytes.com/enterprise?utm_source=github&utm_medium=repo_readme&utm_campaign=security-roi-calculator&utm_content=enterprise_banner)

Need SOC 2-ready managed security tooling for your compliance roadmap? **HailBytes** delivers BYOC-deployed security platforms with enterprise trust documentation.

[**Get Enterprise Support ->**](https://www.hailbytes.com/enterprise?utm_source=github&utm_medium=repo_readme&utm_campaign=security-roi-calculator&utm_content=enterprise_banner)
---

*Part of the [HailBytes](https://hailbytes.com) open-source security toolkit.*
