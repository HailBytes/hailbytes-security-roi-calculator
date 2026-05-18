/**
 * Type declarations for @hailbytes/security-roi-calculator.
 */

export interface ROIInputs {
  employeeCount: number;
  avgSalary: number;
  incidentsPerYear: number;
  avgIncidentCost: number;
  /** Pre-training phishing click rate, as a percent (0–100). */
  clickRateBefore: number;
  /** Expected reduction in click rate, as a percent (0–100). */
  expectedReduction: number;
  trainingHoursPerYear: number;
  /** Platform licensing $ per year (total). */
  platformLicensing: number;
  implementationHours: number;
  hourlyRate: number;
}

export interface ROIResult {
  inputs: ROIInputs;
  annualRiskReduction: number;
  totalTrainingCost: number;
  platformLicensing: number;
  implementationCost: number;
  productivityCost: number;
  netBenefit: number;
  /** ROI as a percent (e.g. 250 means 250%). */
  roi: number;
  paybackMonths: number;
  clickRateBefore: number;
  clickRateAfter: number;
  clickRateReduction: number;
  preventedIncidents: number;
  isPositiveROI: boolean;
}

/**
 * Pure ROI calculation — no DOM required.
 */
export function calculateROI(inputs: ROIInputs): ROIResult;

/**
 * The custom-element class. Importing this module also registers
 * the `<hailbytes-roi-calculator>` tag via `customElements.define`.
 *
 * Supported attributes:
 *   - `theme="dark"|"light"`  (default: `"dark"`)
 *   - `branding="off"`        hides the "by HailBytes" header line and CTA
 */
export default class HailbytesROICalculator extends HTMLElement {
  static readonly observedAttributes: readonly string[];
}

declare global {
  interface HTMLElementTagNameMap {
    'hailbytes-roi-calculator': HailbytesROICalculator;
  }
  interface HTMLElementEventMap {
    'roi-calculated': CustomEvent<ROIResult>;
  }
}
