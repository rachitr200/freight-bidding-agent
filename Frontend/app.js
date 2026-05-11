/**
 * FreightAI — app.js
 * ─────────────────────────────────────────────────────────────────
 * Matched exactly to the FastAPI backend (src/server.py, quote_routes.py,
 * quote_service.py, and the Pydantic models in src/types/freight.py).
 *
 * ── API ──────────────────────────────────────────────────────────
 *   GET  /api/health   →  { "status": "ok" }
 *   POST /api/quote    →  see RESPONSE SHAPE below
 *
 * ── REQUEST BODY (FreightRequest Pydantic model) ─────────────────
 * {
 *   "origin":        string          e.g. "Toronto, ON, Canada"
 *   "destination":   string          e.g. "Vancouver, BC, Canada"
 *   "weight_kg":     number (> 0)
 *   "cargo_type":    "general" | "fragile" | "hazardous" | "temperature_controlled"
 *   "timeline_days": integer (1–30)
 *   "customer_tier": "standard" | "preferred"   ← NOT customer_type
 *   "currency":      "CAD" | "USD"              default "CAD"
 *   "notes":         string | null
 * }
 *
 * ── RESPONSE SHAPE (run_quote_workflow in quote_service.py) ──────
 * {
 *   "request_id":      string
 *   "shipment":        NormalizedFreightRequest   (normalized_request fields)
 *   "quotes_received": number
 *   "valid_quotes":    number
 *   "invalid_quotes":  [ { "carrier": string, "reason": string } ]
 *   "selected_quote":  FinalQuote | null   {
 *                        "request_id", "selected_carrier", "base_rate",
 *                        "markup_percent", "final_rate", "currency",
 *                        "estimated_transit_days", "quote_expires_at",
 *                        "llm_reasoning", "risk_flags", "confidence"
 *                      }
 *   "status":          "quoted" | "failed" | "error"
 *   "errors":          string[]
 *   "audit_trail":     string[]
 * }
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

/* ═══════════════════════════ CONFIG ════════════════════════════ */
const API_BASE   = 'http://localhost:8000';
const API_HEALTH = `${API_BASE}/api/health`;
const API_QUOTE  = `${API_BASE}/api/quote`;

/* ═══════════════════════════ WORKFLOW STEPS ════════════════════ */
/* Mirror the 6 LangGraph nodes so the loading UI teaches the viewer
   what the agent is actually doing under the hood. */
const STEPS = [
  { id: 'validate',  label: 'validate_request — Pydantic validation…'           },
  { id: 'normalize', label: 'normalize_request — lane, urgency, request_id…'    },
  { id: 'collect',   label: 'collect_rates — querying 5 Canadian carriers…'     },
  { id: 'llm',       label: 'llm_analyze_quotes — GPT-4o-mini reasoning…'       },
  { id: 'select',    label: 'select_best_quote — applying LLM recommendation…'  },
  { id: 'finalize',  label: 'finalize_quote — applying markup, setting expiry…' },
];

/* Per-step delay for mock demo (ms) — makes the animation feel real */
const MOCK_DELAY = {
  validate: 380, normalize: 360, collect: 950,
  llm: 1500,     select: 320,    finalize: 280,
};

/* ═══════════════════════════ DOM REFS ══════════════════════════ */
const $ = id => document.getElementById(id);
const dom = {
  // nav
  navToggle:     $('navToggle'),
  navMobile:     $('navMobile'),
  // api status indicator
  apiDot:        $('apiDot'),
  apiStatusText: $('apiStatusText'),
  // form inputs — ids match Pydantic field names where possible
  customerTier:  $('customerTier'),
  origin:        $('origin'),
  destination:   $('destination'),
  weightKg:      $('weightKg'),
  timelineDays:  $('timelineDays'),
  cargoType:     $('cargoType'),
  currency:      $('currency'),
  notes:         $('notes'),
  // buttons
  submitBtn:     $('submitBtn'),
  submitLabel:   $('submitLabel'),
  submitSpinner: $('submitSpinner'),
  mockBtn:       $('mockBtn'),
  errorMockBtn:  $('errorMockBtn'),
  // result areas
  resultBadge:   $('resultBadge'),
  resultIdle:    $('resultIdle'),
  resultLoading: $('resultLoading'),
  loadingSteps:  $('loadingSteps'),
  resultOutput:  $('resultOutput'),
  resultError:   $('resultError'),
};

/* ═══════════════════════════ NAV ═══════════════════════════════ */
dom.navToggle.addEventListener('click', () =>
  dom.navMobile.classList.toggle('open')
);
dom.navMobile.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => dom.navMobile.classList.remove('open'))
);

/* ═══════════════════════════ PIPELINE NODES ════════════════════ */
/* Click any pipe-row to expand/collapse its description.
   The LLM node (pipe-star) starts open by default. */
document.querySelectorAll('.pipe-row').forEach(row => {
  row.addEventListener('click', () => {
    const wasStar   = row.classList.contains('pipe-star');
    const wasActive = row.classList.contains('active');
    document.querySelectorAll('.pipe-row').forEach(r => r.classList.remove('active'));
    if (!wasActive) row.classList.add('active');
    if (wasStar)    row.classList.add('active'); // keep star always open
  });
  row.querySelector('.pipe-card').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); row.click(); }
  });
});
document.querySelector('.pipe-star')?.classList.add('active');

/* ═══════════════════════════ API HEALTH CHECK ══════════════════ */
async function checkAPIHealth() {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(API_HEALTH, { signal: ctrl.signal });
    if (res.ok) {
      dom.apiDot.className    = 'api-dot online';
      dom.apiStatusText.textContent = 'API online';
      return true;
    }
  } catch (_) {}
  dom.apiDot.className    = 'api-dot offline';
  dom.apiStatusText.textContent = 'API offline';
  return false;
}

/* ═══════════════════════════ UI STATE ══════════════════════════ */
function showPanel(name) {
  // hide all first
  [dom.resultIdle, dom.resultLoading, dom.resultOutput, dom.resultError].forEach(el => { if(el){ el.hidden = true; el.style.display = "none"; } });
  const map = {idle:dom.resultIdle, loading:dom.resultLoading, output:dom.resultOutput, error:dom.resultError};
  const t = map[name]; if(t){ t.hidden = false; t.style.display = ""; }
  // legacy assignments (no-op now)
}

function setBadge(text, cls = '') {
  dom.resultBadge.textContent = text;
  dom.resultBadge.className   = `result-badge ${cls}`.trim();
}

function setSubmitting(on) {
  dom.submitBtn.disabled          = on;
  dom.submitLabel.textContent     = on ? 'Running agent…' : 'Get AI quote →';
  dom.submitSpinner.hidden        = !on;
}

/* ═══════════════════════════ LOADING ANIMATION ═════════════════ */
function buildLoadingUI() {
  dom.loadingSteps.innerHTML = STEPS.map(s => `
    <div class="lstep" id="ls-${s.id}">
      <div class="lstep-dot"></div>
      <span>${s.label}</span>
    </div>`).join('');
}

async function animateSteps(useMock = false) {
  for (let i = 0; i < STEPS.length; i++) {
    const step = STEPS[i];

    /* Mark previous step done */
    if (i > 0) {
      const prevEl = document.getElementById(`ls-${STEPS[i - 1].id}`);
      if (prevEl) prevEl.className = 'lstep done';
    }

    /* Mark current step active */
    const el = document.getElementById(`ls-${step.id}`);
    if (el) el.className = 'lstep active';

    const delay = useMock
      ? (MOCK_DELAY[step.id] ?? 400)
      : (step.id === 'llm' ? 1600 : step.id === 'collect' ? 900 : 480);

    await sleep(delay);
  }

  /* Mark last step done */
  const lastEl = document.getElementById(`ls-${STEPS[STEPS.length - 1].id}`);
  if (lastEl) lastEl.className = 'lstep done';
  await sleep(280);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ═══════════════════════════ BUILD PAYLOAD ═════════════════════ */
/* Constructs the exact body that FreightRequest (Pydantic) expects. */
function buildPayload() {
  const notes = dom.notes.value.trim();
  return {
    origin:        dom.origin.value.trim()      || 'Toronto, ON, Canada',
    destination:   dom.destination.value.trim() || 'Vancouver, BC, Canada',
    weight_kg:     parseFloat(dom.weightKg.value)   || 420,
    cargo_type:    dom.cargoType.value,
    timeline_days: parseInt(dom.timelineDays.value, 10) || 3,
    customer_tier: dom.customerTier.value,   // "standard" | "preferred"
    currency:      dom.currency.value,       // "CAD" | "USD"
    notes:         notes || null,
  };
}

/* ═══════════════════════════ RENDER RESULT ═════════════════════ */
/**
 * Maps the real API response to the UI.
 *
 * Key field paths from quote_service.py → run_quote_workflow():
 *   data.selected_quote        → FinalQuote object
 *   data.selected_quote.selected_carrier
 *   data.selected_quote.base_rate
 *   data.selected_quote.markup_percent
 *   data.selected_quote.final_rate
 *   data.selected_quote.currency
 *   data.selected_quote.estimated_transit_days
 *   data.selected_quote.quote_expires_at
 *   data.selected_quote.llm_reasoning
 *   data.selected_quote.risk_flags        → string[]
 *   data.selected_quote.confidence        → float 0.0–1.0
 *   data.invalid_quotes                   → [ { carrier, reason } ]
 *   data.valid_quotes                     → number
 *   data.shipment.lane                    → "Toronto... -> Vancouver..."
 *   data.shipment.urgency_level           → "standard"|"urgent"|"critical"
 *   data.audit_trail                      → string[]
 */
function renderResult(data) {
  const sq      = data.selected_quote || {};
  const invalid = data.invalid_quotes || [];
  const shipment = data.shipment || {};

  const carrier    = sq.selected_carrier || '—';
  const baseRate   = parseFloat(sq.base_rate  || 0).toFixed(2);
  const finalRate  = parseFloat(sq.final_rate || 0).toFixed(2);
  const markup     = sq.markup_percent ?? '—';
  const currency   = sq.currency || 'CAD';
  const transit    = sq.estimated_transit_days ?? '—';
  const confidence = typeof sq.confidence === 'number' ? sq.confidence : null;
  const reasoning  = sq.llm_reasoning || 'No LLM reasoning returned.';
  const riskFlags  = Array.isArray(sq.risk_flags) ? sq.risk_flags : [];
  const lane       = shipment.lane || '—';
  const urgency    = shipment.urgency_level || '—';
  const validCount = data.valid_quotes ?? 0;

  let expiryStr = '—';
  if (sq.quote_expires_at) {
    try {
      expiryStr = new Date(sq.quote_expires_at)
        .toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (_) { expiryStr = sq.quote_expires_at; }
  }

  const confPct = confidence !== null ? Math.round(confidence * 100) : null;

  const confHTML = confPct !== null ? `
    <div class="conf-row">
      <span>AI confidence score</span>
      <span class="conf-score">${confPct}%</span>
    </div>
    <div class="conf-bar">
      <div class="conf-fill" id="confFill" style="width:0%"></div>
    </div>` : '';

  const riskHTML = riskFlags.length ? `
    <div class="risk-chips">
      ${riskFlags.map(f => `<span class="risk-chip">⚠ ${esc(f)}</span>`).join('')}
    </div>` : '';

  const rejectedHTML = invalid.length ? `
    <div class="rejected-title">Rejected carriers (${invalid.length})</div>
    ${invalid.map(r => `
      <div class="rejected-row">
        <span class="rejected-name">${esc(r.carrier || '—')}</span>
        <span class="rejected-reason">${esc(r.reason || '—')}</span>
      </div>`).join('')}` : '';

  /* Audit trail — shown as collapsible detail */
  const auditItems = Array.isArray(data.audit_trail) ? data.audit_trail : [];
  const auditHTML = auditItems.length ? `
    <details class="audit-trail">
      <summary>📋 Audit trail (${auditItems.length} steps)</summary>
      <div class="audit-list">
        ${auditItems.map(s => `<div class="audit-item">✓ ${esc(s)}</div>`).join('')}
      </div>
    </details>` : '';

  dom.resultOutput.innerHTML = `
    <div class="quote-carrier-row">
      <div>
        <div class="quote-status">✓ Quote ready · ${esc(currency)}</div>
        <div class="quote-carrier-name">${esc(carrier)}</div>
        <div class="quote-meta-lane">${esc(lane)}</div>
      </div>
      <div class="quote-price">
        <div class="quote-price-val">${esc(currency)} $${finalRate}</div>
        <div class="quote-price-label">Final rate (markup included)</div>
      </div>
    </div>

    ${confHTML}

    <div class="meta-grid">
      <div class="meta-cell">
        <div class="meta-cell-label">Base rate</div>
        <div class="meta-cell-value">${esc(currency)} $${baseRate}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-cell-label">Markup</div>
        <div class="meta-cell-value">${markup}%</div>
      </div>
      <div class="meta-cell">
        <div class="meta-cell-label">Transit time</div>
        <div class="meta-cell-value">${transit} day(s)</div>
      </div>
      <div class="meta-cell">
        <div class="meta-cell-label">Valid carriers</div>
        <div class="meta-cell-value">${validCount} / 5</div>
      </div>
      <div class="meta-cell">
        <div class="meta-cell-label">Urgency level</div>
        <div class="meta-cell-value urgency-${esc(urgency)}">${esc(urgency)}</div>
      </div>
      <div class="meta-cell">
        <div class="meta-cell-label">Expires</div>
        <div class="meta-cell-value" style="font-size:11px;font-weight:500">${expiryStr}</div>
      </div>
    </div>

    <div class="reasoning-box">
      <div class="reasoning-label">🤖 LLM reasoning — GPT-4o-mini</div>
      <div class="reasoning-text">${esc(reasoning)}</div>
    </div>

    ${riskHTML}
    ${rejectedHTML}
    ${auditHTML}
  `;

  showPanel('output');
  setBadge('✓ Complete', 'success');

  /* Animate confidence bar */
  if (confPct !== null) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const fill = document.getElementById('confFill');
        if (fill) fill.style.width = (confidence * 100) + '%';
      }, 80);
    });
  }
}

/* Minimal XSS escape */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ═══════════════════════════ LIVE SUBMIT ═══════════════════════ */
async function submitQuote() {
  setSubmitting(true);
  buildLoadingUI();
  showPanel('loading');
  setBadge('Processing…');

  const payload = buildPayload();

  try {
    /* Run animation + API call in parallel.
       Animation finishes first in most cases so the UI feels live. */
    const [, response] = await Promise.all([
      animateSteps(false),
      fetch(API_QUOTE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }),
    ]);

    if (!response.ok) {
      /* Try to surface FastAPI validation errors (422 detail) */
      let detail = `HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody.detail) {
          if (Array.isArray(errBody.detail)) {
            detail = errBody.detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('\n');
          } else {
            detail = String(errBody.detail);
          }
        }
      } catch (_) {}
      throw new Error(detail);
    }

    const data = await response.json();

    /* Handle agent-level failures (status = "failed" / "error") */
    if (data.status === 'failed' || data.status === 'error') {
      const errs = data.errors?.length
        ? data.errors.map(esc).join('<br>')
        : 'The agent could not produce a valid quote.';
      dom.resultOutput.innerHTML = `
        <div class="result-error" style="display:flex;position:static;padding:40px 0">
          <div class="error-icon">🚫</div>
          <p class="error-title">Quote failed</p>
          <p class="error-desc">${errs}</p>
        </div>`;
      showPanel('output');
      setBadge('Failed', 'error');
    } else {
      renderResult(data);
    }

  } catch (err) {
    console.error('[FreightAI] submit error:', err.message);
    showPanel('error');
    setBadge('Error', 'error');
  } finally {
    setSubmitting(false);
  }
}

/* ═══════════════════════════ MOCK DEMO ═════════════════════════ */
/**
 * Generates a realistic fake response that matches run_quote_workflow()
 * exactly — same field names and nesting as the real API.
 * Useful to demo without starting the server.
 */
async function runMockDemo() {
  setSubmitting(true);
  buildLoadingUI();
  showPanel('loading');
  setBadge('Processing…');

  await animateSteps(true);

  /* Reflect the form values so the demo looks personalised */
  const tier     = dom.customerTier.value;
  const markupPc = tier === 'preferred' ? 5 : 10;
  const baseRate = 770.45;
  const finalRate = parseFloat((baseRate * (1 + markupPc / 100)).toFixed(2));
  const currency  = dom.currency.value || 'CAD';
  const orig      = dom.origin.value.trim()      || 'Toronto, ON, Canada';
  const dest      = dom.destination.value.trim() || 'Vancouver, BC, Canada';
  const days      = parseInt(dom.timelineDays.value, 10) || 3;
  const urgency   = days <= 1 ? 'critical' : days <= 2 ? 'urgent' : 'standard';

  const mockResponse = {
    request_id:      'mock-' + Math.random().toString(36).slice(2, 10),
    status:          'quoted',
    shipment: {
      origin:        orig,
      destination:   dest,
      weight_kg:     parseFloat(dom.weightKg.value) || 420,
      cargo_type:    dom.cargoType.value,
      timeline_days: days,
      customer_tier: tier,
      currency:      currency,
      request_id:    'mock-req',
      lane:          `${orig} -> ${dest}`,
      is_domestic:   orig.includes('Canada') && dest.includes('Canada'),
      urgency_level: urgency,
    },
    quotes_received: 3,
    valid_quotes:    3,
    invalid_quotes: [
      { carrier: 'Canpar Transport', reason: 'weight 420kg exceeds limit 300kg' },   // max_weight_kg: 500 but weight > transit threshold
      { carrier: 'GFL Logistics',    reason: 'carrier timed out after 2.5s' },
    ],
    selected_quote: {
      request_id:             'mock-req',
      selected_carrier:       'Purolator Freight',
      base_rate:              baseRate,
      markup_percent:         markupPc,
      final_rate:             finalRate,
      currency:               currency,
      estimated_transit_days: 2,
      quote_expires_at:       new Date(Date.now() + 86_400_000).toISOString(),
      llm_reasoning: `Purolator Freight is the optimal choice for the ${orig.split(',')[0]} → ${dest.split(',')[0]} lane. `
        + `It offers reliable 2-day transit within the ${days}-day window, strong national coverage, `
        + `and competitive general freight pricing. Day & Ross was considered but quoted 12% higher. `
        + `XTL Transport is premium-tier — better suited for hazmat or time-critical shipments.`,
      risk_flags: [
        'Only 3 valid quotes received — 2 carriers excluded',
        'GFL Logistics API timed out (simulated slow carrier)',
      ],
      confidence: 0.88,
    },
    errors:      [],
    audit_trail: [
      'request_received',
      'request_validated',
      'request_normalized',
      'carrier_rates_collected',
      'llm_quotes_analyzed',
      'best_quote_selected',
      'final_quote_ready',
    ],
  };

  renderResult(mockResponse);
  setSubmitting(false);
}

/* ═══════════════════════════ EVENT LISTENERS ═══════════════════ */
dom.submitBtn.addEventListener('click',    submitQuote);
dom.mockBtn.addEventListener('click',      runMockDemo);
dom.errorMockBtn.addEventListener('click', runMockDemo);

/* ═══════════════════════════ INIT ══════════════════════════════ */
checkAPIHealth();