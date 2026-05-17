/**
 * HailBytes Security ROI Calculator
 * Zero-dependency Web Component — no build step required.
 * Usage: <hailbytes-roi-calculator></hailbytes-roi-calculator>
 *
 * @license MPL-2.0
 * @see https://hailbytes.com
 */

// ─── Calculation engine ───────────────────────────────────────────────────────

/**
 * @typedef {Object} ROIInputs
 * @property {number} employeeCount
 * @property {number} avgSalary
 * @property {number} incidentsPerYear
 * @property {number} avgIncidentCost
 * @property {number} clickRateBefore     - % (0-100)
 * @property {number} expectedReduction   - % (0-100) reduction in click rate
 * @property {number} trainingHoursPerYear
 * @property {number} platformLicensing   - $ per year total
 * @property {number} implementationHours
 * @property {number} hourlyRate
 */

/**
 * Core ROI calculation — pure function, no DOM.
 * @param {ROIInputs} inputs
 * @returns {Object} full result object
 */
function calculateROI(inputs) {
  const {
    employeeCount,
    avgSalary,
    incidentsPerYear,
    avgIncidentCost,
    clickRateBefore,
    expectedReduction,
    trainingHoursPerYear,
    platformLicensing,
    implementationHours,
    hourlyRate,
  } = inputs;

  // Reduced click rate after training
  const clickRateReduction = (clickRateBefore * expectedReduction) / 100;
  const clickRateAfter = Math.max(0, clickRateBefore - clickRateReduction);

  // Annual risk reduction — incidents avoided × cost per incident × reduction fraction
  const annualRiskReduction = incidentsPerYear * avgIncidentCost * (clickRateReduction / 100);

  // Productivity cost of training time
  const hourlyWage = avgSalary / 2080; // 2080 work hours/year
  const productivityCost = employeeCount * trainingHoursPerYear * hourlyWage;

  // Total training cost
  const implementationCost = implementationHours * hourlyRate;
  const totalTrainingCost = platformLicensing + implementationCost + productivityCost;

  // Net benefit & ROI
  const netBenefit = annualRiskReduction - totalTrainingCost;
  const roi = totalTrainingCost > 0 ? (netBenefit / totalTrainingCost) * 100 : 0;

  // Payback period in months (how long until cumulative benefit covers cost)
  const monthlyBenefit = annualRiskReduction / 12;
  const paybackMonths = monthlyBenefit > 0 ? totalTrainingCost / monthlyBenefit : Infinity;

  // Prevented incidents
  const preventedIncidents = incidentsPerYear * (clickRateReduction / 100);

  return {
    // Inputs (echoed back)
    inputs,
    // Key metrics
    annualRiskReduction,
    totalTrainingCost,
    platformLicensing,
    implementationCost,
    productivityCost,
    netBenefit,
    roi,
    paybackMonths,
    clickRateBefore,
    clickRateAfter,
    clickRateReduction,
    preventedIncidents,
    // Convenience
    isPositiveROI: roi > 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(n) {
  if (!isFinite(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fmtPct(n) {
  if (!isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US') + '%';
}
function fmtNum(n, decimals = 1) {
  if (!isFinite(n)) return '—';
  return n.toFixed(decimals);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  :host {
    display: block;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.5;
    box-sizing: border-box;
  }
  *, *::before, *::after { box-sizing: inherit; }

  /* ── Themes ── */
  :host([theme="dark"]), :host(.dark) {
    --bg:         #1a1a2e;
    --bg-card:    #16213e;
    --bg-input:   #0f3460;
    --border:     #2d4a7a;
    --text:       #e0e0e0;
    --muted:      #8892a4;
    --accent:     #ff6b35;
    --accent-dim: rgba(255,107,53,.12);
    --green:      #2ed573;
    --red:        #ff4757;
    --shadow:     0 4px 24px rgba(0,0,0,.45);
    --tab-bg:     #0f3460;
    --tab-active: #ff6b35;
  }
  :host, :host([theme="light"]) {
    --bg:         #f5f7fa;
    --bg-card:    #ffffff;
    --bg-input:   #ffffff;
    --border:     #dde2ec;
    --text:       #1a1a2e;
    --muted:      #6b7280;
    --accent:     #ff6b35;
    --accent-dim: rgba(255,107,53,.08);
    --green:      #16a34a;
    --red:        #dc2626;
    --shadow:     0 4px 24px rgba(0,0,0,.08);
    --tab-bg:     #f1f3f8;
    --tab-active: #ff6b35;
  }

  .wrapper {
    background: var(--bg);
    color: var(--text);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--shadow);
    max-width: 680px;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    padding: 1.5rem 1.75rem 1.25rem;
    display: flex; align-items: center; gap: .85rem;
    border-bottom: 2px solid var(--accent);
  }
  .logo-mark {
    width: 40px; height: 40px; flex-shrink: 0;
    background: var(--accent);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; font-weight: 800; color: #fff;
  }
  .header-text h2 { margin: 0; font-size: 1.15rem; font-weight: 700; color: #fff; }
  .header-text p  { margin: 0; font-size: .8rem; color: #8892a4; }

  /* ── Tab bar ── */
  .tab-bar {
    display: flex;
    background: var(--tab-bg);
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }
  .tab-btn {
    flex: 1;
    min-width: 90px;
    padding: .7rem .5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: .82rem;
    font-weight: 600;
    color: var(--muted);
    transition: all .2s;
    white-space: nowrap;
  }
  .tab-btn:hover { color: var(--text); background: rgba(128,128,128,.07); }
  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
    background: var(--bg-card);
  }
  .tab-step {
    display: inline-block;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: var(--border);
    color: var(--muted);
    font-size: .7rem;
    font-weight: 700;
    line-height: 20px;
    text-align: center;
    margin-right: .3rem;
    vertical-align: middle;
  }
  .tab-btn.active .tab-step {
    background: var(--accent);
    color: #fff;
  }
  .tab-btn.done .tab-step {
    background: var(--green);
    color: #fff;
  }

  /* ── Tab content ── */
  .tab-panel {
    display: none;
    padding: 1.5rem 1.75rem;
    background: var(--bg-card);
    min-height: 260px;
  }
  .tab-panel.active { display: block; }

  .panel-title {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 1.1rem;
    color: var(--text);
    display: flex; align-items: center; gap: .5rem;
  }
  .panel-title-icon { font-size: 1.2rem; }

  /* ── Form fields ── */
  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  @media (max-width: 420px) { .field-grid { grid-template-columns: 1fr; } }

  .field { display: flex; flex-direction: column; gap: .3rem; }
  .field.full { grid-column: 1 / -1; }

  label {
    font-size: .82rem;
    font-weight: 600;
    color: var(--muted);
  }
  label .hint {
    font-weight: 400;
    font-style: italic;
    opacity: .75;
  }

  input[type="number"], input[type="text"] {
    padding: .6rem .8rem;
    background: var(--bg-input);
    border: 1.5px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    font-size: .95rem;
    outline: none;
    transition: border-color .2s;
    width: 100%;
  }
  input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(255,107,53,.15);
  }
  input.invalid { border-color: var(--red); }

  .field-error {
    font-size: .75rem;
    color: var(--red);
    min-height: 1rem;
  }

  .auto-badge {
    font-size: .7rem;
    background: var(--accent-dim);
    color: var(--accent);
    border: 1px solid rgba(255,107,53,.25);
    border-radius: 10px;
    padding: .1rem .45rem;
    margin-left: .3rem;
    vertical-align: middle;
  }

  /* ── Navigation buttons ── */
  .nav-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.75rem 1.25rem;
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    gap: .5rem;
  }
  .btn {
    padding: .6rem 1.4rem;
    border-radius: 7px;
    border: none;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
    transition: all .15s;
    display: flex; align-items: center; gap: .4rem;
  }
  .btn-primary {
    background: var(--accent);
    color: #fff;
  }
  .btn-primary:hover { background: #e55a28; transform: translateY(-1px); }
  .btn-secondary {
    background: transparent;
    color: var(--muted);
    border: 1.5px solid var(--border);
  }
  .btn-secondary:hover { color: var(--text); border-color: var(--text); }
  .btn:disabled { opacity: .4; cursor: not-allowed; transform: none !important; }

  .progress-text {
    font-size: .78rem;
    color: var(--muted);
  }

  /* ── Results panel ── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: .85rem;
    margin-bottom: 1.5rem;
  }
  .metric-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
    text-align: center;
  }
  .metric-card.highlight {
    border-color: var(--accent);
    background: var(--accent-dim);
  }
  .metric-card.positive { border-color: var(--green); }
  .metric-card.negative { border-color: var(--red); }

  .metric-icon  { font-size: 1.4rem; margin-bottom: .35rem; }
  .metric-label {
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .04em;
    color: var(--muted);
    margin-bottom: .25rem;
  }
  .metric-value {
    font-size: 1.35rem;
    font-weight: 800;
    color: var(--text);
    line-height: 1.1;
  }
  .metric-value.green { color: var(--green); }
  .metric-value.red   { color: var(--red); }
  .metric-value.accent { color: var(--accent); }

  /* ── Bar chart ── */
  .chart-section { margin-bottom: 1.5rem; }
  .chart-title {
    font-size: .82rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: .75rem;
  }
  .bar-chart { display: flex; flex-direction: column; gap: .6rem; }
  .bar-row { display: flex; flex-direction: column; gap: .2rem; }
  .bar-label {
    display: flex; justify-content: space-between;
    font-size: .8rem; color: var(--muted);
  }
  .bar-label strong { color: var(--text); }
  .bar-track {
    height: 22px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 5px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width .6s ease;
    min-width: 2px;
  }
  .bar-fill.risk-reduction { background: var(--green); }
  .bar-fill.training-cost  { background: var(--accent); }
  .bar-fill.net-benefit    { background: #1e90ff; }

  /* ── Breakdown table ── */
  .breakdown-section { margin-bottom: 1.25rem; }
  .breakdown-title {
    font-size: .82rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .04em;
    margin-bottom: .6rem;
  }
  .breakdown-rows { display: flex; flex-direction: column; gap: 0; }
  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: .45rem .7rem;
    font-size: .83rem;
    border-bottom: 1px solid var(--border);
  }
  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-row.total {
    font-weight: 700;
    font-size: .88rem;
    background: var(--accent-dim);
    border-radius: 6px;
    margin-top: .3rem;
    border-bottom: none;
  }
  .breakdown-key { color: var(--muted); }
  .breakdown-val { font-weight: 600; color: var(--text); }

  /* ── ROI callout ── */
  .roi-callout {
    background: linear-gradient(135deg, #1a1a2e, #0f3460);
    border: 1px solid var(--accent);
    border-radius: 10px;
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }
  .roi-callout-icon { font-size: 2rem; }
  .roi-callout-text .big {
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--green);
  }
  .roi-callout-text .big.neg { color: var(--red); }
  .roi-callout-text .sub { font-size: .82rem; color: #8892a4; }

  /* ── CTA row ── */
  .results-cta {
    text-align: center;
    padding-top: .5rem;
  }
  .results-cta p { font-size: .85rem; color: var(--muted); margin-bottom: .75rem; }
  .cta-link {
    display: inline-flex; align-items: center; gap: .4rem;
    background: var(--accent);
    color: #fff;
    text-decoration: none;
    padding: .6rem 1.4rem;
    border-radius: 7px;
    font-weight: 700;
    font-size: .88rem;
    transition: background .15s;
  }
  .cta-link:hover { background: #e55a28; }

  /* ── Empty state ── */
  .empty-results {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--muted);
  }
  .empty-results .icon { font-size: 2.5rem; margin-bottom: .75rem; }
`;

// ─── Template builder ─────────────────────────────────────────────────────────

function buildTemplate() {
  return `
    <style>${STYLES}</style>
    <div class="wrapper" part="wrapper">

      <div class="header">
        <div class="logo-mark">📊</div>
        <div class="header-text">
          <h2>Security Awareness ROI Calculator</h2>
          <p>by <a href="https://hailbytes.com" target="_blank" rel="noopener" style="color:#ff6b35;text-decoration:none">HailBytes</a> — estimate the ROI of security training</p>
        </div>
      </div>

      <!-- Tab bar -->
      <div class="tab-bar" role="tablist">
        <button class="tab-btn active" data-tab="0" role="tab">
          <span class="tab-step">1</span>Baseline
        </button>
        <button class="tab-btn" data-tab="1" role="tab">
          <span class="tab-step">2</span>Training
        </button>
        <button class="tab-btn" data-tab="2" role="tab">
          <span class="tab-step">3</span>Costs
        </button>
        <button class="tab-btn" data-tab="3" role="tab">
          <span class="tab-step">4</span>Results
        </button>
      </div>

      <!-- Panel 0: Baseline -->
      <div class="tab-panel active" data-panel="0">
        <div class="panel-title"><span class="panel-title-icon">🏢</span> Organization Baseline</div>
        <div class="field-grid">
          <div class="field">
            <label for="employee_count">Number of Employees</label>
            <input type="number" id="employee_count" min="1" placeholder="e.g. 250" />
            <div class="field-error" id="err-employee_count"></div>
          </div>
          <div class="field">
            <label for="avg_salary">Average Annual Salary ($)</label>
            <input type="number" id="avg_salary" min="0" placeholder="e.g. 65000" />
            <div class="field-error" id="err-avg_salary"></div>
          </div>
          <div class="field">
            <label for="incidents_per_year">Security Incidents per Year</label>
            <input type="number" id="incidents_per_year" min="0" placeholder="e.g. 12" />
            <div class="field-error" id="err-incidents_per_year"></div>
          </div>
          <div class="field">
            <label for="avg_incident_cost">Average Cost per Incident ($)</label>
            <input type="number" id="avg_incident_cost" min="0" placeholder="e.g. 25000" />
            <div class="field-error" id="err-avg_incident_cost"></div>
          </div>
        </div>
      </div>

      <!-- Panel 1: Training -->
      <div class="tab-panel" data-panel="1">
        <div class="panel-title"><span class="panel-title-icon">🎯</span> Training Parameters</div>
        <div class="field-grid">
          <div class="field">
            <label for="click_rate_before">Phishing Click Rate Before Training (%)</label>
            <input type="number" id="click_rate_before" min="0" max="100" placeholder="e.g. 30" />
            <div class="field-error" id="err-click_rate_before"></div>
          </div>
          <div class="field">
            <label for="expected_reduction">Expected Click Rate Reduction (%)</label>
            <input type="number" id="expected_reduction" min="0" max="100" placeholder="e.g. 70" />
            <div class="field-error" id="err-expected_reduction"></div>
          </div>
          <div class="field full">
            <label for="training_hours">Training Hours per Employee per Year</label>
            <input type="number" id="training_hours" min="0" placeholder="e.g. 4" />
            <div class="field-error" id="err-training_hours"></div>
          </div>
        </div>
      </div>

      <!-- Panel 2: Costs -->
      <div class="tab-panel" data-panel="2">
        <div class="panel-title"><span class="panel-title-icon">💰</span> Training Costs</div>
        <div class="field-grid">
          <div class="field full">
            <label for="platform_licensing">
              Platform Licensing ($/year total)
              <span class="auto-badge">auto-calc</span>
            </label>
            <input type="number" id="platform_licensing" min="0" placeholder="Auto: $15/user/yr" />
            <div class="field-error" id="err-platform_licensing"></div>
          </div>
          <div class="field">
            <label for="implementation_hours">Implementation Hours</label>
            <input type="number" id="implementation_hours" min="0" placeholder="e.g. 40" />
            <div class="field-error" id="err-implementation_hours"></div>
          </div>
          <div class="field">
            <label for="hourly_rate">Implementation Hourly Rate ($)</label>
            <input type="number" id="hourly_rate" min="0" placeholder="e.g. 75" />
            <div class="field-error" id="err-hourly_rate"></div>
          </div>
        </div>
      </div>

      <!-- Panel 3: Results -->
      <div class="tab-panel" data-panel="3">
        <div id="results-content">
          <div class="empty-results">
            <div class="icon">📈</div>
            <p>Complete the previous steps and click <strong>Calculate ROI</strong> to see your results.</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="nav-row">
        <button class="btn btn-secondary" id="btn-prev" disabled>← Previous</button>
        <span class="progress-text" id="progress-text">Step 1 of 4</span>
        <button class="btn btn-primary" id="btn-next">Next →</button>
      </div>
    </div>
  `;
}

// ─── Web Component ────────────────────────────────────────────────────────────

class HailbytesROICalculator extends HTMLElement {
  static get observedAttributes() { return ['theme']; }

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._currentTab = 0;
    this._totalTabs = 4;
    this._results = null;
  }

  connectedCallback() {
    this._shadow.innerHTML = buildTemplate();
    this._bindEvents();
    this._updateNav();
  }

  attributeChangedCallback() {
    if (this._shadow.innerHTML) {
      // Re-render preserving form values
      const saved = this._collectAllValues();
      this._shadow.innerHTML = buildTemplate();
      this._restoreValues(saved);
      this._bindEvents();
      this._updateNav();
      if (this._results) this._renderResults(this._results);
    }
  }

  // ── Public static API ────────────────────────────────────────────────────
  static calculate(inputs) {
    return calculateROI(inputs);
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const root = this._shadow;

    // Tab buttons
    root.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = parseInt(btn.dataset.tab);
        // Only allow navigating to completed tabs or current+1
        if (tab <= this._currentTab + 1) this._goToTab(tab);
      });
    });

    // Prev / Next
    root.getElementById('btn-prev').addEventListener('click', () => {
      if (this._currentTab > 0) this._goToTab(this._currentTab - 1);
    });
    root.getElementById('btn-next').addEventListener('click', () => {
      if (this._currentTab === this._totalTabs - 1) {
        this._doCalculate();
      } else {
        if (this._validateCurrentTab()) {
          this._goToTab(this._currentTab + 1);
        }
      }
    });

    // Auto-calc platform licensing when employee count changes
    root.getElementById('employee_count').addEventListener('input', () => {
      const empInput = root.getElementById('employee_count');
      const licInput = root.getElementById('platform_licensing');
      const n = parseFloat(empInput.value);
      if (n > 0 && !licInput._manuallyEdited) {
        licInput.value = Math.round(n * 15);
      }
    });
    root.getElementById('platform_licensing').addEventListener('input', () => {
      root.getElementById('platform_licensing')._manuallyEdited = true;
    });

    // Live validation on blur
    root.querySelectorAll('input').forEach(input => {
      input.addEventListener('blur', () => this._validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('invalid')) this._validateField(input);
      });
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  _goToTab(index) {
    const root = this._shadow;
    this._currentTab = index;

    root.querySelectorAll('.tab-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      if (i < index) btn.classList.add('done');
    });
    root.querySelectorAll('.tab-panel').forEach((panel, i) => {
      panel.classList.toggle('active', i === index);
    });

    this._updateNav();
  }

  _updateNav() {
    const root = this._shadow;
    const prevBtn = root.getElementById('btn-prev');
    const nextBtn = root.getElementById('btn-next');
    const progressText = root.getElementById('progress-text');

    prevBtn.disabled = this._currentTab === 0;
    progressText.textContent = `Step ${this._currentTab + 1} of ${this._totalTabs}`;

    if (this._currentTab === this._totalTabs - 1) {
      nextBtn.textContent = '📊 Calculate ROI';
    } else {
      nextBtn.textContent = 'Next →';
    }
  }

  // ── Validation ───────────────────────────────────────────────────────────
  _getTabFields(tabIndex) {
    const fieldMap = {
      0: ['employee_count', 'avg_salary', 'incidents_per_year', 'avg_incident_cost'],
      1: ['click_rate_before', 'expected_reduction', 'training_hours'],
      2: ['platform_licensing', 'implementation_hours', 'hourly_rate'],
      3: [],
    };
    return fieldMap[tabIndex] || [];
  }

  _validateField(inputEl) {
    const root = this._shadow;
    const id = inputEl.id;
    const val = parseFloat(inputEl.value);
    const errEl = root.getElementById(`err-${id}`);
    if (!errEl) return true;

    let msg = '';

    const required = ['employee_count', 'avg_salary', 'incidents_per_year', 'avg_incident_cost',
      'click_rate_before', 'expected_reduction', 'training_hours',
      'implementation_hours', 'hourly_rate'];

    if (required.includes(id)) {
      if (inputEl.value === '' || inputEl.value === null) {
        msg = 'This field is required.';
      } else if (isNaN(val) || val < 0) {
        msg = 'Please enter a valid positive number.';
      }
    }

    if (id === 'employee_count' && val < 1 && inputEl.value !== '') {
      msg = 'Must be at least 1 employee.';
    }
    if ((id === 'click_rate_before' || id === 'expected_reduction') && val > 100) {
      msg = 'Percentage cannot exceed 100.';
    }

    // Platform licensing is optional (auto-calc)
    if (id === 'platform_licensing' && inputEl.value !== '' && (isNaN(val) || val < 0)) {
      msg = 'Please enter a valid dollar amount.';
    }

    errEl.textContent = msg;
    inputEl.classList.toggle('invalid', msg !== '');
    return msg === '';
  }

  _validateCurrentTab() {
    const fields = this._getTabFields(this._currentTab);
    const root = this._shadow;
    let valid = true;
    fields.forEach(id => {
      const el = root.getElementById(id);
      if (el && !this._validateField(el)) valid = false;
    });
    return valid;
  }

  // ── Calculation ──────────────────────────────────────────────────────────
  _collectInputs() {
    const g = (id) => parseFloat(this._shadow.getElementById(id)?.value) || 0;
    const empCount = g('employee_count');
    let platformLicensing = parseFloat(this._shadow.getElementById('platform_licensing')?.value);
    if (isNaN(platformLicensing) || platformLicensing === 0) {
      platformLicensing = empCount * 15;
    }

    return {
      employeeCount:        empCount,
      avgSalary:            g('avg_salary'),
      incidentsPerYear:     g('incidents_per_year'),
      avgIncidentCost:      g('avg_incident_cost'),
      clickRateBefore:      g('click_rate_before'),
      expectedReduction:    g('expected_reduction'),
      trainingHoursPerYear: g('training_hours'),
      platformLicensing,
      implementationHours:  g('implementation_hours'),
      hourlyRate:           g('hourly_rate'),
    };
  }

  _collectAllValues() {
    const ids = ['employee_count', 'avg_salary', 'incidents_per_year', 'avg_incident_cost',
      'click_rate_before', 'expected_reduction', 'training_hours',
      'platform_licensing', 'implementation_hours', 'hourly_rate'];
    const vals = {};
    ids.forEach(id => {
      const el = this._shadow.getElementById(id);
      if (el) vals[id] = el.value;
    });
    return vals;
  }

  _restoreValues(vals) {
    Object.entries(vals).forEach(([id, val]) => {
      const el = this._shadow.getElementById(id);
      if (el) el.value = val;
    });
  }

  _doCalculate() {
    // Validate all tabs first
    let allValid = true;
    for (let t = 0; t < 3; t++) {
      const fields = this._getTabFields(t);
      const root = this._shadow;
      fields.forEach(id => {
        const el = root.getElementById(id);
        if (el && !this._validateField(el)) { allValid = false; }
      });
    }
    if (!allValid) {
      // Go back to first invalid tab
      for (let t = 0; t < 3; t++) {
        const fields = this._getTabFields(t);
        const hasErr = fields.some(id => {
          const el = this._shadow.getElementById(id);
          return el && el.classList.contains('invalid');
        });
        if (hasErr) { this._goToTab(t); break; }
      }
      return;
    }

    const inputs = this._collectInputs();
    const results = calculateROI(inputs);
    this._results = results;

    // Navigate to results tab
    this._goToTab(3);
    this._renderResults(results);

    // Emit event
    this.dispatchEvent(new CustomEvent('roi-calculated', {
      bubbles: true, composed: true,
      detail: results,
    }));
  }

  // ── Results rendering ────────────────────────────────────────────────────
  _renderResults(r) {
    const container = this._shadow.getElementById('results-content');
    if (!container) return;

    const roiClass = r.roi >= 0 ? 'green' : 'red';
    const netClass = r.netBenefit >= 0 ? 'green' : 'red';
    const roiCalloutClass = r.roi >= 0 ? '' : 'neg';

    // Bar chart — scale all bars relative to the largest value
    const chartMax = Math.max(r.annualRiskReduction, r.totalTrainingCost, Math.abs(r.netBenefit), 1);
    const pct = (v) => Math.max(2, (Math.abs(v) / chartMax) * 100).toFixed(1);

    container.innerHTML = `
      <div class="roi-callout">
        <div class="roi-callout-icon">${r.roi >= 0 ? '🚀' : '⚠️'}</div>
        <div class="roi-callout-text">
          <div class="big ${roiCalloutClass}">${fmtPct(r.roi)} ROI</div>
          <div class="sub">${r.roi >= 0
            ? `For every $1 invested, you gain $${(r.roi / 100).toFixed(2)} back`
            : 'Training costs exceed projected risk reduction'}</div>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card highlight">
          <div class="metric-icon">🛡️</div>
          <div class="metric-label">Risk Reduction</div>
          <div class="metric-value accent">${fmt$(r.annualRiskReduction)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">💸</div>
          <div class="metric-label">Training Cost</div>
          <div class="metric-value">${fmt$(r.totalTrainingCost)}</div>
        </div>
        <div class="metric-card ${r.netBenefit >= 0 ? 'positive' : 'negative'}">
          <div class="metric-icon">${r.netBenefit >= 0 ? '✅' : '❌'}</div>
          <div class="metric-label">Net Benefit</div>
          <div class="metric-value ${netClass}">${fmt$(r.netBenefit)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">⏱️</div>
          <div class="metric-label">Payback Period</div>
          <div class="metric-value">${isFinite(r.paybackMonths) ? fmtNum(r.paybackMonths, 1) + ' mo' : '—'}</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-label">Click Rate After</div>
          <div class="metric-value">${fmtNum(r.clickRateAfter, 1)}%</div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">🚫</div>
          <div class="metric-label">Incidents Prevented</div>
          <div class="metric-value">${fmtNum(r.preventedIncidents, 1)}/yr</div>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-title">📊 Financial Comparison</div>
        <div class="bar-chart">
          <div class="bar-row">
            <div class="bar-label">
              <span>Annual Risk Reduction</span>
              <strong>${fmt$(r.annualRiskReduction)}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill risk-reduction" style="width:${pct(r.annualRiskReduction)}%"></div>
            </div>
          </div>
          <div class="bar-row">
            <div class="bar-label">
              <span>Total Training Cost</span>
              <strong>${fmt$(r.totalTrainingCost)}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill training-cost" style="width:${pct(r.totalTrainingCost)}%"></div>
            </div>
          </div>
          <div class="bar-row">
            <div class="bar-label">
              <span>Net Benefit</span>
              <strong>${fmt$(r.netBenefit)}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill net-benefit" style="width:${pct(r.netBenefit)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="breakdown-section">
        <div class="breakdown-title">Cost Breakdown</div>
        <div class="breakdown-rows" style="background:var(--bg);border:1px solid var(--border);border-radius:8px;overflow:hidden;">
          <div class="breakdown-row">
            <span class="breakdown-key">Platform Licensing</span>
            <span class="breakdown-val">${fmt$(r.platformLicensing)}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-key">Implementation Cost</span>
            <span class="breakdown-val">${fmt$(r.implementationCost)}</span>
          </div>
          <div class="breakdown-row">
            <span class="breakdown-key">Employee Productivity Cost</span>
            <span class="breakdown-val">${fmt$(r.productivityCost)}</span>
          </div>
          <div class="breakdown-row total">
            <span class="breakdown-key">Total Investment</span>
            <span class="breakdown-val">${fmt$(r.totalTrainingCost)}</span>
          </div>
        </div>
      </div>

      <div class="results-cta">
        <p>Want to see a detailed proposal for your organization?</p>
        <a class="cta-link" href="https://hailbytes.com" target="_blank" rel="noopener">
          🚀 Talk to a HailBytes Expert
        </a>
      </div>
    `;
  }
}

customElements.define('hailbytes-roi-calculator', HailbytesROICalculator);

export default HailbytesROICalculator;
export { calculateROI };
