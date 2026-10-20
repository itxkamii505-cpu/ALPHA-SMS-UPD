/* ═══════════════════════════════════════════════════════════════
   𝑴𝑨𝑰𝑻 𝑺𝑴𝑺 — CLIENT pages. Requires speed-kit.js
   ═══════════════════════════════════════════════════════════════ */

let ZY_RANGES = [], ZY_NUMROWS = [], ZY_TESTNUMS = [];

/* ═══ MY SMS NUMBERS ════════════════════════════════════════ */
async function pgMyNumbers() {
  const c = document.getElementById('page-content');
  zyCrumb(['My SMS Numbers']);
  c.innerHTML = `
    <div class="zy-intro">Active numbers allocated to your client account. Traffic and live SMS records are monitored continuously.</div>
    <div class="zy-intro">Abbreviations: SD - SMS Daily, SW - SMS Weekly</div>
    <div class="zy-panel">
      <div class="zy-panel-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span><i class="fas fa-mobile-screen" style="color:var(--sp-primary);margin-right:6px;"></i> My SMS Numbers</span>
        <div class="zy-head-acts" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <button class="sp-btn sp-btn-danger sp-btn-sm" onclick="zyClientReturnSelected()" title="Return selected numbers back to agent pool">
            <i class="fas fa-arrow-up" style="margin-right:4px;"></i> Return to Agent
          </button>
          <button class="sp-btn sp-btn-ghost sp-btn-sm" onclick="pgMyNumbers()" title="Refresh">
            <i class="fas fa-rotate-right"></i> Refresh
          </button>
        </div>
      </div>
      <div class="zy-filter-grid" style="margin-bottom:14px;">
        <div class="zy-filter-grid-fields">
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-range">Range</label>
            <select id="num-range" class="zy-filter-input" onchange="zyClientNumFilter()">
              <option value="">All Ranges</option>
            </select>
          </div>
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-starts-with">Number starts with</label>
            <input type="text" id="num-starts-with" class="zy-filter-input" placeholder="Number starts with..." oninput="zyClientNumFilter()">
          </div>
          <div class="zy-filter-field" style="grid-column: 1 / -1;">
            <label class="zy-filter-label" for="num-range-contains">Range contains</label>
            <input type="text" id="num-range-contains" class="zy-filter-input" placeholder="Range contains..." oninput="zyClientNumFilter()">
          </div>
        </div>
        <div class="zy-filter-actions">
          <button type="button" class="zy-btn-blue-solid" onclick="zyClientNumFilter()">
            <i class="fas fa-filter"></i> Filter
          </button>
          <button type="button" class="zy-btn-amber" style="background:#64748b;border-color:#475569;" onclick="zyResetClientNumFilter()">
            <i class="fas fa-undo"></i> Reset
          </button>
        </div>
      </div>
      <div class="zy-panel-body"><div class="zy-loading">Loading numbers…</div></div>
    </div>`;

  const [nums, ranges] = await Promise.all([
    apiFetch(`/api/numbers?client_id=${CLIENT_ID}&limit=100000`),
    apiFetch('/api/numbers/sms-ranges').catch(() => [])
  ]);
  ZY_RANGES = zyList(ranges);
  window._zyClientRawNums = zyList(nums);

  const rangeSel = document.getElementById('num-range');
  if (rangeSel) {
    const uniqueRanges = Array.from(new Set(window._zyClientRawNums.map(n => n.range || n.country || '').filter(Boolean)));
    rangeSel.innerHTML = '<option value="">All Ranges</option>' +
      uniqueRanges.map(r => `<option value="${zyEsc(r)}">${zyEsc(r)}</option>`).join('');
  }

  zyRenderClientNumbers(window._zyClientRawNums);
}

function zyRenderClientNumbers(list) {
  ZY_NUMROWS = (list || []).map(n => {
    const rangeName = n.range || `${n.country || ''} ${n.provider || ''}`.trim() || '—';
    const r = [
      { v: rangeName, h: `<span style="font-weight:600;">${zyEsc(rangeName)}</span>` },
      { v: n.prefix || '', h: n.prefix || '—' },
      { v: n.number || '', h: `<span style="font-family:monospace;font-weight:600;color:var(--sp-primary,#166534);">${zyEsc(n.number || '')}</span>` },
      { v: n.payterm || 'Weekly', h: `<span class="badge" style="background:var(--sp-bg-subtle);">${zyEsc(n.payterm || 'Weekly')}</span>` },
      { v: n.payout ?? '', h: n.payout != null ? `<span style="font-weight:700;color:var(--sp-primary,#166534);">$${Number(n.payout).toFixed(4)}</span>` : '—' },
      { v: (n.sms_daily || 0) + (n.sms_weekly || 0), h: `SD: <b>${n.sms_daily || 0}</b> | SW: <b>${n.sms_weekly || 0}</b>` }
    ];
    r.__id = n.id;
    return r;
  });

  const body = document.querySelector('#page-content .zy-panel-body');
  if (body) {
    body.innerHTML = zyDT2('dt-numbers', {
      cols: ['Range', 'Prefix', 'Number', 'My Payterm', 'My Payout', 'Limits'],
      rows: ZY_NUMROWS,
      check: true
    });
    zy2Render('dt-numbers');
  }
}

function zyClientNumFilter() {
  const rVal = (document.getElementById('num-range')?.value || '').toLowerCase();
  const startsWith = (document.getElementById('num-starts-with')?.value || '').trim().toLowerCase();
  const rangeContains = (document.getElementById('num-range-contains')?.value || '').trim().toLowerCase();

  const filtered = (window._zyClientRawNums || []).filter(n => {
    if (rVal) {
      const r = (n.range || n.country || '').toLowerCase();
      if (!r.includes(rVal)) return false;
    }
    if (rangeContains) {
      const r = (n.range || n.country || '').toLowerCase();
      if (!r.includes(rangeContains)) return false;
    }
    if (startsWith) {
      const num = String(n.number || '').toLowerCase();
      if (!num.startsWith(startsWith)) return false;
    }
    return true;
  });

  zyRenderClientNumbers(filtered);
}

function zyResetClientNumFilter() {
  const r = document.getElementById('num-range');
  const sw = document.getElementById('num-starts-with');
  const rc = document.getElementById('num-range-contains');
  if (r) r.value = '';
  if (sw) sw.value = '';
  if (rc) rc.value = '';
  zyRenderClientNumbers(window._zyClientRawNums || []);
}

window.zyClientReturnSelected = async function() {
  const ids = zy2Checked('dt-numbers');
  if (!ids.length) { toast('Please select at least one number to return', 'error'); return; }
  if (!confirm(`Return ${ids.length} selected number(s) back to agent pool?`)) return;

  try {
    for (const id of ids) {
      await apiFetch(`/api/numbers/${id}/return`, { method: 'POST' });
    }
    toast(`Successfully returned ${ids.length} number(s) to agent pool`, 'success');
    pgMyNumbers();
  } catch (err) {
    toast(err.message || 'Failed to return numbers', 'error');
  }
};

/* ═══ SMS CDR STATS (CDR & STATISTICS V5) ══════════════════════ */
async function pgMySms(summary = false) {
  const c = document.getElementById('page-content');
  zyCrumb(['CDR & Statistics']);

  const defaultFrom = typeof zyDefaultFromDateTime === 'function' ? zyDefaultFromDateTime() : `${(typeof zyToday === 'function' ? zyToday() : new Date().toISOString().slice(0, 10))} 00:00:00`;
  const defaultTo = typeof zyDefaultToDateTime === 'function' ? zyDefaultToDateTime() : `${(typeof zyToday === 'function' ? zyToday() : new Date().toISOString().slice(0, 10))} 23:59:59`;

  const groupChips = [
    { id: 'hour', label: 'Hour', val: 'hour' },
    { id: 'date', label: 'Date', val: 'date' },
    { id: 'month', label: 'Month', val: 'month' },
    { id: 'range', label: 'Range', val: 'range' },
    { id: 'client', label: 'Client', val: 'client' },
    { id: 'number', label: 'Number', val: 'number' },
    { id: 'cli', label: 'CLI', val: 'cli' }
  ];

  const chipsHtml = groupChips.map(g => `
    <label class="zy-chip-pill" for="grp-chip-${g.id}">
      <input type="checkbox" id="grp-chip-${g.id}" class="grp-chk" value="${g.val}" onchange="this.closest('.zy-chip-pill').classList.toggle('active', this.checked)">
      ${g.label}
    </label>
  `).join('');

  c.innerHTML = `
    <div class="zy-intro">Detailed records of inbound SMS, real-time message streams, and payout metrics.</div>

    <div class="zy-filter-grid">
      <div class="zy-filter-grid-fields">
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-from">From</label>
          <input type="text" id="rp-from" class="zy-filter-input" value="${defaultFrom}" placeholder="YYYY-MM-DD HH:mm:ss">
        </div>
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-to">To</label>
          <input type="text" id="rp-to" class="zy-filter-input" value="${defaultTo}" placeholder="YYYY-MM-DD HH:mm:ss">
        </div>
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-range">Range</label>
          <select id="rp-range" class="zy-filter-input"><option value="">All Ranges</option></select>
        </div>
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-client">Client</label>
          <select id="rp-client" class="zy-filter-input"><option value="">All</option></select>
        </div>
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-num">Number</label>
          <input type="text" id="rp-num" class="zy-filter-input" placeholder="Number contains...">
        </div>
        <div class="zy-filter-field">
          <label class="zy-filter-label" for="rp-cli">CLI</label>
          <input type="text" id="rp-cli" class="zy-filter-input" placeholder="CLI contains...">
        </div>
      </div>

      <div class="zy-groupby-card">
        <div class="zy-groupby-title">
          <i class="fas fa-layer-group" style="font-size:11px;color:var(--sp-text-muted,#64748b);"></i>
          Group By :
        </div>
        <div class="zy-groupby-chips">
          ${chipsHtml}
        </div>
      </div>

      <div class="zy-filter-actions">
        <button type="button" class="zy-btn-amber" id="btn-export-report" onclick="typeof zyExportCdrStream === 'function' ? zyExportCdrStream({ client_id: typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : '', date_from: (document.getElementById('rp-from')||{}).value||'', date_to: (document.getElementById('rp-to')||{}).value||'', range: (document.getElementById('rp-range')||{}).value||'', search: (document.getElementById('rp-num')||{}).value||'', cli: (document.getElementById('rp-cli')||{}).value||'', group_by: Array.from(document.querySelectorAll('.grp-chk:checked')).map(cb => cb.value).join(',') }) : zy2Export('dt-cdr','csv')">
          <i class="fas fa-file-export"></i> Export Report
        </button>
        <button type="button" class="zy-btn-blue-solid" id="btn-show-report" onclick="pgMySmsLoad()">
          <i class="fas fa-chart-column"></i> Show Report
        </button>
      </div>

      <hr class="zy-filter-divider">

      <div class="zy-table-toolbar">
        <div class="zy-toolbar-left">
          <div class="zy-search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" class="zy-toolbar-search" placeholder="Search..." oninput="typeof zyToolbarFilter === 'function' ? zyToolbarFilter(this.value) : null">
          </div>
          <div class="zy-toolbar-select-wrap">
            <label class="zy-toolbar-label" for="rp-limit">Show Records</label>
            <select id="rp-limit" class="zy-toolbar-select" onchange="pgMySmsLoad()">
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000" selected>1000</option>
              <option value="5000">5000</option>
              <option value="10000">10000</option>
              <option value="15000">15000</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div class="zy-toolbar-right">
          <div class="zy-toolbar-pills">
            <button type="button" class="zy-btn-pill" onclick="typeof zyExportTableCopy === 'function' ? zyExportTableCopy('dt-cdr') : null"><i class="fas fa-copy"></i> Copy</button>
            <button type="button" class="zy-btn-pill" onclick="typeof zyExportTableCsv === 'function' ? zyExportTableCsv('dt-cdr') : null"><i class="fas fa-file-csv"></i> CSV</button>
            <button type="button" class="zy-btn-pill" onclick="typeof zyExportTableExcel === 'function' ? zyExportTableExcel('dt-cdr') : null"><i class="fas fa-file-excel"></i> Excel</button>
            <button type="button" class="zy-btn-pill" onclick="typeof zyExportTablePdf === 'function' ? zyExportTablePdf('dt-cdr') : null"><i class="fas fa-file-pdf"></i> PDF</button>
            <button type="button" class="zy-btn-pill" onclick="typeof zyPrintTable === 'function' ? zyPrintTable('dt-cdr') : null"><i class="fas fa-print"></i> Print</button>
            <button type="button" class="zy-btn-pill" onclick="typeof zyToggleColumnsModal === 'function' ? zyToggleColumnsModal('dt-cdr') : null"><i class="fas fa-columns"></i> Columns</button>
          </div>
        </div>
      </div>
    </div>

    <div class="zy-panel">
      <div class="zy-panel-head" style="display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-list"></i> CDR Detailed &amp; Grouped Records</span>
        <button class="sp-btn sp-btn-ghost sp-btn-sm" onclick="pgMySmsLoad()" title="Refresh">
          <i class="fas fa-rotate-right"></i> Refresh
        </button>
      </div>
      <div class="zy-panel-body" id="rp-body">
        <div class="zy-empty" style="padding:40px;text-align:center;color:var(--sp-text-muted,#64748b);">
          <i class="fas fa-chart-bar" style="font-size:32px;margin-bottom:12px;display:block;opacity:0.6;"></i>
          Click <b>Show Report</b> to view SMS stats.
        </div>
      </div>
    </div>`;

  const ranges = zyList(await apiFetch('/api/numbers/sms-ranges'));
  ZY_RANGES = ranges;
  const rEl = document.getElementById('rp-range');
  if (rEl) {
    rEl.innerHTML = `<option value="">All Ranges</option>` +
      ranges.map(r => `<option value="${r.id}">${zyEsc(r.name || r.country || '')}</option>`).join('');
  }
  // Auto-run first load
  pgMySmsLoad(summary);
}

async function pgMySmsLoad(summary = false) {
  const body = document.getElementById('rp-body');
  if (!body) return;
  if (typeof zySkeleton === 'function') {
    body.innerHTML = zySkeleton('report');
  } else {
    body.innerHTML = `<div class="zy-loading">Loading report…</div>`;
  }

  const val = id => (document.getElementById(id) || {}).value || '';
  const from = val('rp-from'), to = val('rp-to');
  const rangeId = val('rp-range');
  const num = val('rp-num'), cli = val('rp-cli');

  const checkedBoxes = Array.from(document.querySelectorAll('.grp-chk:checked')).map(cb => cb.value);

  const params = new URLSearchParams();
  if (typeof CLIENT_ID !== 'undefined' && CLIENT_ID) params.append('client_id', CLIENT_ID);
  if (from) params.append('date_from', from);
  if (to) params.append('date_to', to);
  if (rangeId) params.append('range', rangeId);
  if (num) params.append('search', num);
  if (cli) params.append('cli', cli);
  if (checkedBoxes.length) params.append('group_by', checkedBoxes.join(','));
  const limitVal = val('rp-limit') || '500';
  params.append('limit', limitVal);

  const logs = await apiFetch(`/api/sms/logs?${params.toString()}`);
  const data = (logs && logs.data) || [];

  if (logs && logs.grouped && checkedBoxes.length) {
    const keyLabels = {
      hour: 'Hour',
      day: 'Day',
      date: 'Date',
      month: 'Month',
      range: 'Range',
      number: 'Number',
      cli: 'CLI',
      status: 'Status'
    };
    const cols = [
      ...checkedBoxes.map(k => keyLabels[k] || k),
      'SMS Count',
      'Currency',
      'My Payout'
    ];
    const rows = data.map(g => [
      ...checkedBoxes.map(k => g[k] || '—'),
      g.sms_count || 0,
      g.currency || 'USD',
      `$${Number(g.client_payout || g.payout || 0).toFixed(4)}`
    ]);

    const sum = logs && logs.summary;
    const totalSms = (sum && sum.total_sms != null) ? sum.total_sms : data.reduce((s, g) => s + (g.sms_count || 0), 0);
    const totalPayout = (sum && sum.client_payout != null) ? sum.client_payout : data.reduce((s, g) => s + (parseFloat(g.client_payout || g.payout) || 0), 0);
    const totalGroups = (sum && sum.total_groups != null) ? sum.total_groups : data.length;

    const footTds = [
      `<td><b>Total Groups: ${totalGroups}</b></td>`,
      ...Array(Math.max(0, checkedBoxes.length - 1)).fill('<td></td>'),
      `<td><span class="zy-total-badge"><i class="fas fa-comment-sms"></i> Total SMS: <b>${totalSms.toLocaleString()}</b></span></td>`,
      `<td><span class="badge" style="background:var(--sp-bg-subtle);">USD</span></td>`,
      `<td><b>$${totalPayout.toFixed(4)}</b></td>`
    ];

    body.innerHTML = zyDT2('dt-cdr', {
      cols,
      rows,
      sort: checkedBoxes.length,
      dir: -1,
      footRow: footTds.join('')
    });
    zy2Render('dt-cdr');
  } else {
    const rows = data.map(s => [
      zyDateOnly(s.timestamp),
      s.range || `${s.country || ''} ${s.provider || ''}`.trim(),
      s.number || '',
      (s.cli || s.app || '—'),
      s.message || '',
      s.currency || '$',
      s.client_payout != null ? (typeof s.client_payout === 'number' ? `$${s.client_payout.toFixed(4)}` : `$${s.client_payout}`) : (s.payout != null ? `$${s.payout}` : '$0.0000')
    ]);

    const sum = logs && logs.summary;
    const totalSms = (sum && sum.total_sms != null) ? sum.total_sms : data.length;
    const totalPayout = (sum && sum.client_payout != null) ? sum.client_payout : data.reduce((s, x) => s + (parseFloat(x.client_payout ?? x.payout) || 0), 0);

    const footTds = [
      `<td><span class="zy-total-badge"><i class="fas fa-comment-sms"></i> Total SMS: <b>${totalSms.toLocaleString()}</b></span></td>`,
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      `<td><span class="badge" style="background:var(--sp-bg-subtle);">USD</span></td>`,
      `<td><b>$${totalPayout.toFixed(4)}</b></td>`
    ];

    body.innerHTML = zyDT2('dt-cdr', {
      cols: ['Date', 'Range', 'Number', 'CLI', 'SMS', 'Currency', 'My Payout'],
      rows,
      sort: 0,
      dir: -1,
      footRow: footTds.join('')
    });
    zy2Render('dt-cdr');
  }
}

/* ═══ SMS TEST PANEL ════════════════════════════════════════ */
async function pgSmsTestPanel() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Test Panel']);
  c.innerHTML = `<div class="zy-intro">Here you can see all test numbers.. you can make call on them and see test reports.</div>
    <div class="zy-panel">
      <div class="zy-panel-head">SMS Test Numbers
        <div class="zy-head-acts">
          ${zyS2('tp-range', 'Select Range', [])}
          <button class="zy-act zy-act-red zy-act-wide" onclick="zyTestFilter()">Filter</button>
        </div>
      </div>
      <div class="zy-panel-body"><div class="zy-loading">Loading…</div></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">Recent SMS Test</div>
      <div class="zy-panel-body" id="tp-recent"><div class="zy-loading">Loading…</div></div></div>`;

  const [ranges, nums, logs] = await Promise.all([
    apiFetch('/api/numbers/sms-ranges'),
    apiFetch('/api/sms/test-numbers?limit=500'),
    apiFetch('/api/sms/test-logs?limit=500')
  ]);
  ZY_RANGES = zyList(ranges);
  ZY_S2['tp-range'].items = ZY_RANGES.map(r => r.name || r.country || '');

  ZY_TESTNUMS = zyList(nums).map(n => [n.range_label || '—', n.number || '']);

  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-testnums', {
    cols: ['Range', 'Test Number'], rows: ZY_TESTNUMS });
  zy2Render('dt-testnums');

  const mask = s => String(s || '').replace(/./g, '*').slice(0, 6);
  const rows = zyList(logs).map(s => [
    zyDateOnly(s.timestamp), s.range_label || '—',
    s.number || '', zyMaskCli(s.cli), mask(s.message)
  ]);
  document.getElementById('tp-recent').innerHTML = zyDT2('dt-testlog', {
    cols: ['Date', 'Range', 'Number', 'CLI', 'SMS'], rows, sort: 0, dir: -1 });
  zy2Render('dt-testlog');
}
function zyTestFilter() {
  const q = zyS2Value('tp-range').toLowerCase();
  const t = ZYT2['dt-testnums']; if (!t) return;
  t.rows = q ? ZY_TESTNUMS.filter(r => String(zyCell2(r[0]).v).toLowerCase().includes(q)) : ZY_TESTNUMS;
  t.page = 1; zy2Render('dt-testnums');
}

/* ═══ CLI SEARCH (Video 01:50-02:00) ═════════════════════════ */
async function pgAccessSearch() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Module', 'CLI Search']);
  c.innerHTML = `<div class="zy-intro">See which ranges a sender has been running on in the last 24 hours. Type the sender in full, exactly as it appears. Capital letters do not matter.</div>
    <div class="zy-filterbox">
      <div style="margin-bottom:12px;">
        <label style="display:block;font-weight:700;margin-bottom:5px;font-size:12.5px;">Sender (CLI)</label>
        <input class="zy-fb-input" id="cs-cli" style="width:100%;max-width:480px;" placeholder="The full sender, e.g. facebook">
      </div>
      <div style="margin-bottom:14px;">
        <label style="display:block;font-weight:700;margin-bottom:5px;font-size:12.5px;">Message text</label>
        <input class="zy-fb-input" id="cs-text" style="width:100%;max-width:480px;" placeholder="Any words from the message">
      </div>
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="pgAccessSearchLoad()"><i class="fas fa-search"></i> Search</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">RANGES RUNNING THIS CLI</div>
      <div class="zy-panel-body" id="cs-body"><div class="zy-loading">Loading…</div></div></div>`;
  pgAccessSearchLoad();
}

async function pgAccessSearchLoad() {
  const body = document.getElementById('cs-body');
  if (!body) return;
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const logs = zyList(await apiFetch(`/api/sms/logs?limit=500`));
  const cli = (document.getElementById('cs-cli') || {}).value || '';
  const txt = (document.getElementById('cs-text') || {}).value || '';
  const seen = new Map();
  logs.forEach(s => {
    if (cli && !String(s.cli || s.app || '').toLowerCase().includes(cli.toLowerCase())) return;
    if (txt && !String(s.message || '').toLowerCase().includes(txt.toLowerCase())) return;
    const rName = s.range_label || s.range || `${s.country || ''} ${s.provider || ''}`.trim() || 'General';
    if (!seen.has(rName) || seen.get(rName) < s.timestamp) {
      seen.set(rName, s.timestamp);
    }
  });
  const rows = Array.from(seen.entries()).map(([range, lastSeen]) => [
    range,
    zyDateOnly(lastSeen)
  ]);
  body.innerHTML = zyDT2('dt-cli', { cols: ['Range', 'Last seen'], rows, sort: 1, dir: -1 });
  zy2Render('dt-cli');
}

/* ── router ─────────────────────────────────────────────────── */
(function zyHookClientPages() {
  const map = {
    'dashboard': () => pgDashboard(),
    'access-search': pgAccessSearch,
    'my-numbers': pgMyNumbers,
    'my-sms': pgMySms,
    'sms-test-panel': pgSmsTestPanel
  };
  const prev = loadPage;
  loadPage = function (page) {
    if (map[page]) {
      document.getElementById('zy-user-menu')?.classList.remove('open');
      if (window.innerWidth < 992) document.getElementById('zy-mega')?.classList.remove('open');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      document.getElementById('nav-' + page)?.classList.add('active');
      const bc = document.getElementById('breadcrumb');
      if (bc && typeof ZY_LABELS !== 'undefined') bc.textContent = ZY_LABELS[page] || bc.textContent || page;
      if (window.zyCloseSidebar) window.zyCloseSidebar();
      window.scrollTo({ top: 0 });
      try { sessionStorage.setItem('client_current_page', page); } catch (e) {}
      map[page]();
      return;
    }
    prev(page);
    if (window.zyCloseSidebar) window.zyCloseSidebar();
  };
})();
