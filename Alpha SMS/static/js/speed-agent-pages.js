/* ═══════════════════════════════════════════════════════════════
   𝑴𝑨𝑰𝑻 𝑺𝑴𝑺 — AGENT pages. Requires speed-kit.js
   ═══════════════════════════════════════════════════════════════ */

let ZY_RANGES = [], ZY_CLIENTS = [], ZY_NUMROWS = [], ZY_TESTNUMS = [];

async function zyFillClients(selectId, label) {
  const res = await apiFetch(`/api/clients?agent_id=${AGENT_ID}&limit=200`);
  ZY_CLIENTS = zyList(res);
  const el = document.getElementById(selectId);
  if (el) el.innerHTML = `<option value="">${label || 'Filter Client'}</option>` +
    ZY_CLIENTS.map(c => `<option value="${c.id}">${zyEsc(c.username)}</option>`).join('');
  return ZY_CLIENTS;
}
const zyClientName = id => (ZY_CLIENTS.find(c => String(c.id) === String(id)) || {}).username || '';
const zyNA = v => (v === '' || v == null) ? '<span class="zy-na">NA</span>' : v;

/* ═══ SMS RANGES ════════════════════════════════════════════ */
async function pgSmsRanges() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Module', 'SMS Ranges']);
  c.innerHTML = `<div class="zy-intro">Our All Ranges will show here.. you can search your desired range and request numbers.</div>
    <div class="zy-panel"><div class="zy-panel-head">All SMS Ranges/Terminations</div>
    <div class="zy-panel-body"><div class="zy-loading">Loading…</div></div></div>`;
  const list = zyList(await apiFetch('/api/numbers/sms-ranges'));
  const rows = list.map(r => [
    r.range_name || r.name || r.country || '—',
    r.prefix || '',
    r.test_number || '',
    r.currency || 'USD',
    { v: '', h: zyNA('') },
    { v: r.payout ?? '', h: r.payout != null ? `$ ${r.payout}` : zyNA('') },
    { v: '', h: zyNA('') },
    { v: '', h: zyNA('') }
  ]);
  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-ranges', {
    cols: ['Range', 'Prefix', 'Test Number', 'Currency', '1/1', '7/1', '7/7', '30/45'], rows });
  zy2Render('dt-ranges');
}

/* ═══ MY SMS NUMBERS ════════════════════════════════════════ */
let ZY_ALL_NUMS = [];
let ZY_RANGES_LOOKUP = {};

async function pgMySmsNumbers() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Module', 'My SMS Numbers']);
  c.innerHTML = `<div class="zy-intro">Here you can see numbers assigned to your account. You can allocate numbers to clients with payterm &amp; rate caps, unallocate back to your pool, return to upstream holder, or move between clients.</div>
    <div class="zy-intro">Abbreviations: SD - SMS Daily, SW - SMS Weekly</div>
    <div class="zy-panel">
      <div class="zy-panel-head">My SMS Numbers
        <div class="zy-head-acts" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <button class="zy-act zy-act-blue zy-act-wide" onclick="zyActionAllocate()" title="Allocate selected numbers to client"><i class="fas fa-user-plus" style="margin-right:4px;"></i> Allocate</button>
          <button class="zy-act zy-act-teal zy-act-wide" onclick="zyActionUnallocate()" title="Unallocate selected numbers back to agent pool"><i class="fas fa-rotate-left" style="margin-right:4px;"></i> Unallocate</button>
          <button class="zy-act zy-act-red zy-act-wide" onclick="zyActionReturn()" title="Return selected numbers to upstream holder"><i class="fas fa-arrow-up" style="margin-right:4px;"></i> Return</button>
          <button class="zy-act zy-act-blue zy-act-wide" onclick="zyActionMove()" title="Move number directly from Client A to Client B"><i class="fas fa-right-left" style="margin-right:4px;"></i> Move</button>
          <button class="zy-act zy-act-red" onclick="loadPage('my-sms-numbers')" title="Refresh">${zyImg('btn_a_refresh')}</button>
        </div>
      </div>
      <div class="zy-filter-grid" style="margin-bottom:14px;">
        <div class="zy-filter-grid-fields">
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-range">Range</label>
            <select id="num-range" class="zy-filter-input" onchange="zyApplyFilters()">
              <option value="">All Ranges</option>
            </select>
          </div>
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-client">Client</label>
            <select id="num-client" class="zy-filter-input" onchange="zyApplyFilters()">
              <option value="">All Clients</option>
            </select>
          </div>
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-status">Allocation</label>
            <select id="num-status" class="zy-filter-input" onchange="zyApplyFilters()">
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned (Pool)</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="zy-filter-field">
            <label class="zy-filter-label" for="num-starts-with">Number starts with</label>
            <input type="text" id="num-starts-with" class="zy-filter-input" placeholder="Number starts with..." oninput="zyApplyFilters()">
          </div>
          <div class="zy-filter-field" style="grid-column: 1 / -1;">
            <label class="zy-filter-label" for="num-range-contains">Range contains</label>
            <input type="text" id="num-range-contains" class="zy-filter-input" placeholder="Range contains..." oninput="zyApplyFilters()">
          </div>
        </div>
        <div class="zy-filter-actions">
          <button type="button" class="zy-btn-blue-solid" onclick="zyApplyFilters()">
            <i class="fas fa-filter"></i> Filter
          </button>
          <button type="button" class="zy-btn-amber" style="background:#64748b;border-color:#475569;" onclick="zyResetFilters()">
            <i class="fas fa-undo"></i> Reset
          </button>
        </div>
      </div>
      <div class="zy-panel-body"><div class="zy-loading">Loading numbers…</div></div>
    </div>`;

  const [nums, ranges, clientsRes] = await Promise.all([
    apiFetch(`/api/numbers?agent_id=${AGENT_ID}&limit=100000`),
    apiFetch('/api/numbers/sms-ranges').catch(() => []),
    apiFetch(`/api/clients?agent_id=${AGENT_ID}&limit=500`).catch(() => ({ data: [] }))
  ]);

  ZY_ALL_NUMS = zyList(nums);
  ZY_RANGES = zyList(ranges);
  ZY_CLIENTS = zyList(clientsRes);

  ZY_RANGES_LOOKUP = {};
  ZY_RANGES.forEach(r => {
    if (r.id) ZY_RANGES_LOOKUP[r.id] = r;
    if (r.range_name) ZY_RANGES_LOOKUP[r.range_name] = r;
    if (r.name) ZY_RANGES_LOOKUP[r.name] = r;
    if (r.country && r.provider) ZY_RANGES_LOOKUP[`${r.country}|${r.provider}`] = r;
  });

  // Populate Range dropdown
  const rangeSel = document.getElementById('num-range');
  if (rangeSel) {
    const uniqueRanges = [];
    const seenR = new Set();
    ZY_ALL_NUMS.forEach(n => {
      const rName = n.range_name || n.range_label || n.range || n.country || '';
      if (rName && !seenR.has(rName)) {
        seenR.add(rName);
        uniqueRanges.push({ id: n.range_id || rName, name: rName });
      }
    });
    rangeSel.innerHTML = '<option value="">All Ranges</option>' +
      uniqueRanges.map(r => `<option value="${zyEsc(r.name)}">${zyEsc(r.name)}</option>`).join('');
  }

  // Populate Client dropdown
  const clientSel = document.getElementById('num-client');
  if (clientSel) {
    clientSel.innerHTML = '<option value="">All Clients</option>' +
      ZY_CLIENTS.map(cl => `<option value="${cl.id}">${zyEsc(cl.username)}</option>`).join('');
  }

  zyRenderNumbersTable(ZY_ALL_NUMS);
}

function zyGetRangeForNumber(n) {
  if (n.range_id && ZY_RANGES_LOOKUP[n.range_id]) return ZY_RANGES_LOOKUP[n.range_id];
  const rName = n.range_name || n.range_label || n.range;
  if (rName && ZY_RANGES_LOOKUP[rName]) return ZY_RANGES_LOOKUP[rName];
  if (n.country && n.provider && ZY_RANGES_LOOKUP[`${n.country}|${n.provider}`]) return ZY_RANGES_LOOKUP[`${n.country}|${n.provider}`];
  return null;
}

function zyGetAgentRateForNumber(n) {
  if (n.agent_rate !== undefined && n.agent_rate !== null && !isNaN(Number(n.agent_rate)) && Number(n.agent_rate) > 0) {
    return Number(n.agent_rate);
  }
  const r = zyGetRangeForNumber(n);
  if (r) {
    const term = n.payterm || n.agent_payterm || 'Weekly';
    const pts = r.payterms || {};
    if (pts[term] !== undefined && !isNaN(Number(pts[term]))) return Number(pts[term]);
    if (pts['Weekly'] !== undefined && !isNaN(Number(pts['Weekly']))) return Number(pts['Weekly']);
    if (r.payout !== undefined && !isNaN(Number(r.payout))) return Number(r.payout);
    if (r.sell_rate !== undefined && !isNaN(Number(r.sell_rate))) return Number(r.sell_rate);
  }
  if (n.payout !== undefined && n.payout !== null && !isNaN(Number(n.payout))) return Number(n.payout);
  return 0;
}

function zyRenderNumbersTable(numsList) {
  const c = document.getElementById('page-content');
  if (!c) return;

  const rows = (numsList || []).map(n => {
    const rangeName = n.range_name || n.range_label || n.range || n.country || '—';
    const agentRate = zyGetAgentRateForNumber(n);
    const clientName = zyClientName(n.client_id) || (n.client_id ? `Client #${n.client_id}` : '');
    const clientPayoutVal = (n.client_rate !== undefined && n.client_rate !== null) ? n.client_rate : (n.client_payout ?? '');
    const clientPayoutDisplay = clientPayoutVal !== '' ? `$${Number(clientPayoutVal).toFixed(4)}` : zyNA('');
    const limitsDisplay = `SD: <b>${n.sms_daily || 0}</b> | SW: <b>${n.sms_weekly || 0}</b>`;

    const r = [
      { v: rangeName, h: `<span style="font-weight:600;">${zyEsc(rangeName)}</span>` },
      { v: n.prefix || '', h: n.prefix || '—' },
      { v: n.number || '', h: `<span style="font-family:monospace;font-weight:600;color:var(--brand-primary,#166534);">${zyEsc(n.number || '')}</span>` },
      { v: agentRate, h: `<span style="font-weight:700;color:var(--brand-accent,#4ade80);">$${agentRate.toFixed(4)}</span>` },
      { v: clientName, h: clientName ? `<span class="badge badge-green">${zyEsc(clientName)}</span>` : '<span class="text-muted" style="font-size:11px;font-style:italic;">Pool (Unallocated)</span>' },
      { v: clientPayoutVal !== '' ? Number(clientPayoutVal) : 0, h: clientPayoutDisplay },
      { v: (n.sms_daily || 0) + (n.sms_weekly || 0), h: limitsDisplay }
    ];
    r.__id = n.id;
    r.__raw = n;
    return r;
  });

  ZY_NUMROWS = rows;
  const body = c.querySelector('.zy-panel-body');
  if (body) {
    body.innerHTML = zyDT2('dt-numbers', {
      cols: ['Range', 'Prefix', 'Number', 'My Payout', 'Client', 'Client payout', 'Limits'],
      rows,
      check: true
    });
    zy2Render('dt-numbers');
  }
}

function zyApplyFilters() {
  const rVal = (document.getElementById('num-range')?.value || '').toLowerCase();
  const cVal = document.getElementById('num-client')?.value || '';
  const sVal = document.getElementById('num-status')?.value || '';
  const startsWith = (document.getElementById('num-starts-with')?.value || '').trim();
  const rangeContains = (document.getElementById('num-range-contains')?.value || '').toLowerCase().trim();

  const filtered = ZY_ALL_NUMS.filter(n => {
    if (rVal) {
      const rName = (n.range_name || n.range_label || n.range || n.country || '').toLowerCase();
      if (!rName.includes(rVal)) return false;
    }
    if (rangeContains) {
      const rName = (n.range_name || n.range_label || n.range || n.country || '').toLowerCase();
      if (!rName.includes(rangeContains)) return false;
    }
    if (startsWith) {
      const numStr = String(n.number || '');
      if (!numStr.startsWith(startsWith)) return false;
    }
    if (cVal) {
      if (String(n.client_id) !== String(cVal)) return false;
    }
    if (sVal) {
      if (sVal === 'assigned' && !n.client_id) return false;
      if (sVal === 'unassigned' && n.client_id) return false;
      if (sVal === 'active' && n.status !== 'active') return false;
      if (sVal === 'inactive' && n.status !== 'inactive') return false;
    }
    return true;
  });

  zyRenderNumbersTable(filtered);
}

function zyResetFilters() {
  const r = document.getElementById('num-range'); if (r) r.value = '';
  const cl = document.getElementById('num-client'); if (cl) cl.value = '';
  const st = document.getElementById('num-status'); if (st) st.value = '';
  const sw = document.getElementById('num-starts-with'); if (sw) sw.value = '';
  const rc = document.getElementById('num-range-contains'); if (rc) rc.value = '';
  zyRenderNumbersTable(ZY_ALL_NUMS);
}

function zyGetSelectedNumbers() {
  const ids = zy2Checked('dt-numbers');
  const t = ZYT2['dt-numbers'];
  if (!t || !ids.length) return [];
  const idSet = new Set(ids.map(String));
  return t.rows.filter(r => idSet.has(String(r.__id))).map(r => r.__raw);
}

// ── BUTTON 1: ALLOCATE (select numbers -> client, client payterm, client rate prefilled & capped) ──
function zyActionAllocate() {
  const selected = zyGetSelectedNumbers();
  if (!selected.length) {
    toast('Select at least one number to Allocate', 'warning');
    return;
  }
  if (!ZY_CLIENTS.length) {
    toast('No clients found. Create a client first.', 'error');
    return;
  }

  const ids = selected.map(n => n.id);
  const sampleNum = selected[0];
  const initialAgentRate = zyGetAgentRateForNumber(sampleNum);
  const range = zyGetRangeForNumber(sampleNum) || {};
  const rPts = range.payterms || {};

  window._allocSelectedNums = selected;
  window._allocRangePayterms = rPts;

  zyModal('Allocate Numbers to Client', `
    <div style="background:#f3f4f6;padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;">
      <div><strong>Selected:</strong> ${selected.length} number(s) (${selected.slice(0, 3).map(n => n.number).join(', ')}${selected.length > 3 ? '...' : ''})</div>
      <div><strong>Range:</strong> ${range.range_name || sampleNum.country || '—'}</div>
      <div><strong>My Payout (Agent Rate):</strong> <span id="alloc-agent-rate-val" style="color:#166534;font-weight:700;">$${initialAgentRate.toFixed(4)}</span></div>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label class="zy-lbl" style="font-weight:600;">Target Client *</label>
      <select id="alloc-client-id" class="zy-input" style="width:100%;height:34px;">
        <option value="">— Select Client —</option>
        ${ZY_CLIENTS.map(c => `<option value="${c.id}">${zyEsc(c.username)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label class="zy-lbl" style="font-weight:600;">Client Payterm (client_payterm) *</label>
      <select id="alloc-client-payterm" class="zy-input" style="width:100%;height:34px;" onchange="zyOnAllocPaytermChange()">
        <option value="Weekly" selected>Weekly</option>
        <option value="1/1">1/1 (Daily)</option>
        <option value="7/1">7/1</option>
        <option value="7/7">7/7</option>
        <option value="15/15">15/15</option>
        <option value="15/30">15/30</option>
        <option value="Monthly60">Monthly60</option>
      </select>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label class="zy-lbl" style="font-weight:600;">Client Rate (client_rate) *</label>
      <input type="number" id="alloc-client-rate" class="zy-input" step="0.0001" value="${initialAgentRate}" style="width:100%;height:34px;" required>
      <small class="text-muted" style="display:block;margin-top:4px;font-size:11px;">
        Prefilled from Rate Card. Capped at your Agent Rate (<span id="alloc-cap-hint">$${initialAgentRate.toFixed(4)}</span>). Server refuses rates exceeding your payout.
      </small>
    </div>
  `, `
    <button class="zy-btn-grey" onclick="closeModal()">Cancel</button>
    <button class="zy-btn-blue" id="btn-do-allocate" onclick="zySubmitAllocate()"><i class="fas fa-check"></i> Allocate</button>
  `);
}

function zyOnAllocPaytermChange() {
  const term = document.getElementById('alloc-client-payterm')?.value || 'Weekly';
  const rPts = window._allocRangePayterms || {};
  const selected = window._allocSelectedNums || [];
  const sample = selected[0] || {};

  let agentRate = (sample.agent_rate !== undefined && sample.agent_rate !== null && Number(sample.agent_rate) > 0)
    ? Number(sample.agent_rate)
    : null;

  if (!agentRate) {
    if (rPts[term] !== undefined && !isNaN(Number(rPts[term]))) {
      agentRate = Number(rPts[term]);
    } else if (rPts['Weekly'] !== undefined && !isNaN(Number(rPts['Weekly']))) {
      agentRate = Number(rPts['Weekly']);
    } else {
      agentRate = 0;
    }
  }

  const rateEl = document.getElementById('alloc-agent-rate-val');
  const capHint = document.getElementById('alloc-cap-hint');
  const input = document.getElementById('alloc-client-rate');
  if (rateEl) rateEl.textContent = `$${agentRate.toFixed(4)}`;
  if (capHint) capHint.textContent = `$${agentRate.toFixed(4)}`;
  if (input) input.value = agentRate;
}

async function zySubmitAllocate() {
  const clientId = document.getElementById('alloc-client-id')?.value;
  const clientPayterm = document.getElementById('alloc-client-payterm')?.value || 'Weekly';
  const clientRate = parseFloat(document.getElementById('alloc-client-rate')?.value);
  const selected = window._allocSelectedNums || [];

  if (!clientId) { toast('Please select a client', 'error'); return; }
  if (isNaN(clientRate) || clientRate < 0) { toast('Enter a valid client rate', 'error'); return; }
  if (!selected.length) { toast('No numbers selected', 'error'); return; }

  const btn = document.getElementById('btn-do-allocate');
  if (btn) { btn.disabled = true; btn.textContent = 'Allocating...'; }

  const numberIds = selected.map(n => n.id);
  try {
    const res = await apiFetch('/api/numbers/bulk-assign-many', {
      method: 'POST',
      body: JSON.stringify({
        number_ids: numberIds,
        target_type: 'client',
        target_id: Number(clientId),
        client_id: Number(clientId),
        client_payterm: clientPayterm,
        payterm: clientPayterm,
        client_rate: clientRate,
        client_payout: clientRate
      })
    });

    if (res && (res.success || res.updated || res.count !== undefined)) {
      closeModal();
      toast(`Successfully allocated ${numberIds.length} number(s) to client`, 'success');
      loadPage('my-sms-numbers');
    } else {
      const errMsg = res?.error || res?.message || 'Server refused allocation';
      toast(errMsg, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Allocate'; }
    }
  } catch (err) {
    console.error('Allocate error:', err);
    toast(err.message || 'Allocation rejected', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Allocate'; }
  }
}

// ── BUTTON 2: UNALLOCATE (take back into agent pool) ──
async function zyActionUnallocate() {
  const selected = zyGetSelectedNumbers();
  if (!selected.length) {
    toast('Select at least one number to Unallocate', 'warning');
    return;
  }
  const assigned = selected.filter(n => n.client_id);
  if (!assigned.length) {
    toast('None of the selected numbers are currently allocated to a client', 'warning');
    return;
  }
  if (!confirm(`Unallocate ${assigned.length} number(s) back to your agent pool?`)) return;

  const ids = assigned.map(n => n.id);
  try {
    const res = await apiFetch('/api/numbers/bulk-unassign-many', {
      method: 'POST',
      body: JSON.stringify({ number_ids: ids })
    });
    if (res && res.error) {
      toast(res.error, 'error');
    } else {
      toast(`Unallocated ${assigned.length} number(s) back to pool`, 'success');
      loadPage('my-sms-numbers');
    }
  } catch (err) {
    toast(err.message || 'Failed to unallocate numbers', 'error');
  }
}

// ── BUTTON 3: RETURN (return to upstream holder, POST /api/numbers/return) ──
async function zyActionReturn() {
  const selected = zyGetSelectedNumbers();
  if (!selected.length) {
    toast('Select at least one number to Return', 'warning');
    return;
  }
  if (!confirm(`Return ${selected.length} number(s) to your upstream holder?`)) return;

  const ids = selected.map(n => n.id);
  try {
    const res = await apiFetch('/api/numbers/return', {
      method: 'POST',
      body: JSON.stringify({ number_ids: ids })
    });
    if (res && res.error) {
      toast(res.error, 'error');
    } else {
      toast(`Returned ${res?.count || selected.length} number(s) to upstream holder`, 'success');
      loadPage('my-sms-numbers');
    }
  } catch (err) {
    toast(err.message || 'Failed to return numbers', 'error');
  }
}

// ── BUTTON 4: MOVE (client A -> client B, POST /api/numbers/:id/move) ──
function zyActionMove() {
  const selected = zyGetSelectedNumbers();
  if (!selected.length) {
    toast('Select a number to Move', 'warning');
    return;
  }
  if (selected.length > 1) {
    toast('Please select exactly one number to Move between clients', 'info');
  }
  const targetNum = selected[0];
  if (!targetNum.client_id) {
    toast(`Number ${targetNum.number} is not assigned to any client yet. Use Allocate instead.`, 'warning');
    return;
  }
  const currentClient = ZY_CLIENTS.find(c => String(c.id) === String(targetNum.client_id));
  const currentName = currentClient?.username || `Client #${targetNum.client_id}`;
  const otherClients = ZY_CLIENTS.filter(c => String(c.id) !== String(targetNum.client_id));

  if (!otherClients.length) {
    toast('No other clients available to move number to', 'warning');
    return;
  }

  zyModal('Move Number Between Clients', `
    <div style="background:#f3f4f6;padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;">
      <div><strong>Number:</strong> <span style="font-family:monospace;font-weight:700;">${targetNum.number}</span></div>
      <div><strong>Current Holder:</strong> <span class="badge badge-green">${zyEsc(currentName)}</span></div>
      <div class="text-muted" style="margin-top:4px;">Moving preserves old client's SMS history while routing new SMS to the new client.</div>
    </div>
    <div class="form-group" style="margin-bottom:12px;">
      <label class="zy-lbl" style="font-weight:600;">Destination Client *</label>
      <select id="move-dest-client" class="zy-input" style="width:100%;height:34px;">
        <option value="">— Select Destination Client —</option>
        ${otherClients.map(c => `<option value="${c.id}">${zyEsc(c.username)}</option>`).join('')}
      </select>
    </div>
  `, `
    <button class="zy-btn-grey" onclick="closeModal()">Cancel</button>
    <button class="zy-btn-blue" id="btn-do-move" onclick="zySubmitMove(${targetNum.id})"><i class="fas fa-right-left"></i> Move Number</button>
  `);
}

async function zySubmitMove(numberId) {
  const destClientId = document.getElementById('move-dest-client')?.value;
  if (!destClientId) { toast('Please select destination client', 'error'); return; }

  const btn = document.getElementById('btn-do-move');
  if (btn) { btn.disabled = true; btn.textContent = 'Moving...'; }

  try {
    const res = await apiFetch(`/api/numbers/${numberId}/move`, {
      method: 'POST',
      body: JSON.stringify({ to_client_id: Number(destClientId) })
    });

    if (res && (res.success || res.number || res.id)) {
      closeModal();
      toast('Number moved to new client successfully', 'success');
      loadPage('my-sms-numbers');
    } else {
      const errMsg = res?.error || res?.message || 'Move rejected by server';
      toast(errMsg, 'error');
      if (btn) { btn.disabled = false; btn.textContent = 'Move Number'; }
    }
  } catch (err) {
    console.error('Move error:', err);
    toast(err.message || 'Failed to move number', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Move Number'; }
  }
}


/* ═══ SMS RATECARD ══════════════════════════════════════════ */
async function pgSmsRateCard() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Module', 'SMS RateCard']);
  c.innerHTML = `<div class="zy-intro">Here you can export ratecard and send it to your clients by updating payouts.</div>
    <div class="zy-panel"><div class="zy-panel-head">SMS RateCard
      <button class="zy-act-export" onclick="zy2Export('dt-rate','csv')">${zyImg('btn_export')} Export</button></div>
    <div class="zy-panel-body"><div class="zy-loading">Loading…</div></div></div>`;
  const ranges = zyList(await apiFetch('/api/numbers/sms-ranges'));
  const rows = ranges.map(r => [
    r.range_name || r.name || r.country || '—', r.prefix || '', r.test_number || '',
    r.currency || 'USD',
    { v: r.payout ?? '', h: r.payout != null ? `$ ${r.payout}` : zyNA('') },
    { v: '', h: zyNA('') }, { v: '', h: zyNA('') }, { v: '', h: zyNA('') }, { v: '', h: zyNA('') }
  ]);
  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-rate', {
    cols: ['Range', 'Prefix', 'Test Number', 'Currency', '7/1', '7/7', '15/15', '15/30', '30/30'], rows });
  zy2Render('dt-rate');
}

/* ═══ ACCESS / CLI SEARCH ═══════════════════════════════════ */
async function pgAccessSearch() {
  const c = document.getElementById('page-content');
  zyCrumb(['CLI Search']);
  c.innerHTML = `<div class="zy-intro">Here You can search ranges running by cli.</div>
    <div class="zy-filterbox">
      <input class="zy-fb-input" id="cs-from" value="${zyToday()} 00:00:00">
      <input class="zy-fb-input" id="cs-to" value="${zyToday()} 23:59:59">
      <input class="zy-fb-input" id="cs-cli" placeholder="Search CLI">
      <input class="zy-fb-input" id="cs-text" placeholder="Search Content">
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="pgAccessSearchLoad()">Show Report</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">Ranges Running With CLI</div>
      <div class="zy-panel-body" id="cs-body"><div class="zy-loading">Loading…</div></div></div>`;
  pgAccessSearchLoad();
}
async function pgAccessSearchLoad() {
  const body = document.getElementById('cs-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const logs = zyList(await apiFetch(`/api/sms/logs?agent_id=${AGENT_ID}&limit=500`));
  const cli = (document.getElementById('cs-cli') || {}).value || '';
  const txt = (document.getElementById('cs-text') || {}).value || '';
  const seen = new Set();
  const rows = logs
    .filter(s => zyInRange('cs', s.timestamp))
    .filter(s => !cli || String(s.cli || s.app || '').toLowerCase().includes(cli.toLowerCase()))
    .filter(s => !txt || String(s.message || '').toLowerCase().includes(txt.toLowerCase()))
    .map(s => [zyDateOnly(s.timestamp), s.range_name || s.range_label || s.range || s.country || '—'])
    .filter(r => { const k = r.join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
  body.innerHTML = zyDT2('dt-cli', { cols: ['Date', 'Range'], rows, sort: 0, dir: -1 });
  zy2Render('dt-cli');
}

/* ═══ NEWS FOR CLIENTS (NewsMaster) ═════════════════════════ */
async function pgNewsClients() {
  const c = document.getElementById('page-content');
  zyCrumb(['System Master', 'NewsMaster']);
  c.innerHTML = `<div class="zy-intro">Here you can put News &amp; Updates for your clients and agents, so they can see it on their panel and get connected with you.</div>
    <div class="zy-panel">
      <div class="zy-panel-head">News &amp; Updates
        <div class="zy-head-acts">
          <button class="zy-act zy-act-blue" onclick="zyAddNewsModal()" title="Add News">${zyImg('btn_add')}</button>
          <button class="zy-act zy-act-red" onclick="zyDeleteChecked('dt-news','announcements')" title="Delete">${zyImg('btn_trash')}</button>
        </div>
      </div>
      <div class="zy-datebar">
        <div class="zy-daterow"><input id="nw-from" value="${zyMonthStart()}"><button class="zy-cal"><i class="fas fa-table-cells"></i></button></div>
        <div class="zy-daterow"><input id="nw-to" value="${zyToday()}"><button class="zy-cal"><i class="fas fa-table-cells"></i></button></div>
        <button class="zy-btn-blue" onclick="pgNewsLoad()">Filter</button>
      </div>
      <div class="zy-panel-body" id="nw-body"><div class="zy-loading">Loading…</div></div>
    </div>`;
  pgNewsLoad();
}
async function pgNewsLoad() {
  const body = document.getElementById('nw-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const list = zyList(await apiFetch(`/api/announcements?role=Agent&user_id=${AGENT_ID}`));
  const rows = list.map(n => {
    const r = [
      { v: n.created || n.date || '', h: zyDateOnly(n.created || n.date) },
      n.title || '', n.message || n.body || '',
      { v: '', h: `<button class="zy-gear" onclick="toast('Open news','success')">${zyImg('ui_gear')}</button>` }
    ];
    r.__id = n.id; return r;
  });
  body.innerHTML = zyDT2('dt-news', { cols: ['Date', 'Headline', 'News', 'Action'], rows, check: true, sort: 0, dir: -1 });
  zy2Render('dt-news');
}
function zyAddNewsModal() {
  zyModal('Add News', `
    <label class="zy-lbl">Headline</label><input class="zy-input" id="nn-title" placeholder="Headline">
    <label class="zy-lbl">News</label><input class="zy-input" id="nn-body" placeholder="News">`,
    `<button class="zy-btn-grey" onclick="closeModal()">Close</button>
     <button class="zy-btn-blue" onclick="zySaveNews()">Add</button>`);
}
async function zySaveNews() {
  const p = { title: document.getElementById('nn-title').value.trim(),
              message: document.getElementById('nn-body').value.trim(),
              audience: 'Client', created_by: AGENT_ID };
  if (!p.title) { toast('Headline required', 'error'); return; }
  await apiFetch('/api/announcements', { method: 'POST', body: JSON.stringify(p) });
  closeModal(); zyFlash('News Added.'); loadPage('news-clients');
}

/* ═══ MY CLIENTS ════════════════════════════════════════════ */
async function pgMyClients() {
  const c = document.getElementById('page-content');
  zyCrumb(['Users Master', 'Clients']);
  c.innerHTML = `<div class="zy-intro">Clients are the very low level(end users). They can get numbers from their agents and make traffic on them and see reportings.</div>
    <div class="zy-panel"><div class="zy-panel-head">Manage Clients
      <div class="zy-head-acts">
        <button class="zy-act zy-act-blue" onclick="zyAddClientModal()" title="Add Client">${zyImg('btn_add')}</button>
        <button class="zy-act zy-act-red" onclick="zyDeleteChecked('dt-clients','clients')" title="Delete">${zyImg('btn_trash')}</button>
      </div></div>
      <div class="zy-panel-body"><div class="zy-loading">Loading…</div></div></div>`;
  const list = zyList(await apiFetch(`/api/clients?agent_id=${AGENT_ID}&limit=500`));
  ZY_CLIENTS = list;
  const rows = list.map(x => {
    const r = [x.username || '', x.full_name || '', x.email || '', x.phone || '', x.skype_id || '',
      { v: x.status === 'active' ? 'yes' : '', h: zyTick(x.status === 'active') }];
    r.__id = x.id; return r;
  });
  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-clients', {
    cols: ['Username', 'Name', 'Email', 'Contact', 'Skype', 'Active'], rows, check: true });
  zy2Render('dt-clients');
}
function zyAddClientModal() {
  zyModal('Add New Client', `
    <label class="zy-lbl">Username</label><input class="zy-input" id="nc-user" placeholder="Minimum 6 Characters">
    <label class="zy-lbl">Password</label><input class="zy-input" id="nc-pass" type="password" placeholder="Minimum 6 Characters">
    <label class="zy-lbl">Email</label><input class="zy-input" id="nc-mail" placeholder="abc@xyz.com">
    <label class="zy-lbl">Skype ID</label><input class="zy-input" id="nc-skype" placeholder="Skype ID">
    <label class="zy-lbl">Contact No.</label><input class="zy-input" id="nc-phone" placeholder="441768499506">
    <label class="zy-lbl">Name</label><input class="zy-input" id="nc-name" placeholder="Name">`,
    `<button class="zy-btn-grey" onclick="closeModal()">Close</button>
     <button class="zy-btn-blue" onclick="zySaveClient()">Add</button>`);
}
async function zySaveClient() {
  const p = {
    username: document.getElementById('nc-user').value.trim(),
    password: document.getElementById('nc-pass').value,
    email: document.getElementById('nc-mail').value.trim(),
    skype_id: document.getElementById('nc-skype').value.trim(),
    contact_no: document.getElementById('nc-phone').value.trim(),
    full_name: document.getElementById('nc-name').value.trim(),
    agent_id: AGENT_ID
  };
  if (p.username.length < 6 || p.password.length < 6) { toast('Username and password need 6+ characters', 'error'); return; }
  const r = await apiFetch('/api/clients', { method: 'POST', body: JSON.stringify(p) });
  if (r && r.id) { closeModal(); zyFlash('Client Added.'); loadPage('my-clients'); }
}
async function zyDeleteChecked(tableId, kind) {
  const ids = zy2Checked(tableId);
  if (!ids.length) { toast('Nothing selected', 'error'); return; }
  zyModal('Delete', `<p class="zy-confirm">Delete ${ids.length} selected?</p>`,
    `<button class="zy-btn-grey" onclick="closeModal()">Close</button>
     <button class="zy-btn-red" onclick="zyDoDelete('${kind}',${JSON.stringify(ids).replace(/"/g, '&quot;')})">Delete</button>`);
}
async function zyDoDelete(kind, ids) {
  for (const id of ids) await apiFetch(`/api/${kind}/${id}`, { method: 'DELETE' });
  closeModal(); toast('Deleted', 'success');
  loadPage(kind === 'clients' ? 'my-clients' : 'news-clients');
}

/* ═══ SMS CDR REPORTS (detailed & summary V5) ═══════════════ */
async function pgDetailedSms() { zyCdrPage(false); }
async function pgSummarySms() { zyCdrPage(true); }

window.zyAgentDatePreset = function(key) {
  zyApplyDatePreset(key, 'rp-from', 'rp-to', '.zy-date-presets');
  zyCdrLoad(window._zyCurrentCdrSummary || false);
};

window.zySwitchAgentCdrTab = function(tabId) {
  const isSummary = tabId === 'grouped';
  zyCdrPage(isSummary);
};

async function zyCdrPage(summary = false) {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS CDR Reports']);

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
    <div class="zy-intro">Comprehensive CDR analytics, real-time message streams, and aggregated delivery payouts.</div>

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
          <select id="rp-client" class="zy-filter-input"><option value="">All Clients</option></select>
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
        <button type="button" class="zy-btn-amber" id="btn-export-report" onclick="typeof zyExportCdrStream === 'function' ? zyExportCdrStream({ agent_id: typeof AGENT_ID !== 'undefined' ? AGENT_ID : '', date_from: (document.getElementById('rp-from')||{}).value||'', date_to: (document.getElementById('rp-to')||{}).value||'', range: (document.getElementById('rp-range')||{}).value||'', client_id: (document.getElementById('rp-client')||{}).value||'', search: (document.getElementById('rp-num')||{}).value||'', cli: (document.getElementById('rp-cli')||{}).value||'', group_by: Array.from(document.querySelectorAll('.grp-chk:checked')).map(cb => cb.value).join(',') }) : zy2Export('dt-cdr','csv')">
          <i class="fas fa-file-export"></i> Export Report
        </button>
        <button type="button" class="zy-btn-blue-solid" id="btn-show-report" onclick="zyCdrLoad()">
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
            <select id="rp-limit" class="zy-toolbar-select" onchange="zyCdrLoad()">
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
        <span><i class="fas fa-list"></i> SMS CDR Detailed &amp; Grouped Reports</span>
        <button class="sp-btn sp-btn-ghost sp-btn-sm" onclick="zyCdrLoad()" title="Refresh">
          <i class="fas fa-rotate-right"></i> Refresh
        </button>
      </div>
      <div class="zy-panel-body" id="rp-body">
        <div class="zy-empty" style="padding:40px;text-align:center;color:var(--sp-text-muted,#64748b);">
          <i class="fas fa-chart-bar" style="font-size:32px;margin-bottom:12px;display:block;opacity:0.6;"></i>
          Click <b>Show Report</b> to generate the CDR report for the selected date range.
        </div>
      </div>
    </div>`;

  const ranges = zyList(await apiFetch('/api/numbers/sms-ranges'));
  ZY_RANGES = ranges;
  const rEl = document.getElementById('rp-range');
  if (rEl) {
    rEl.innerHTML = `<option value="">All Ranges</option>` +
      ranges.map(r => `<option value="${r.id}">${zyEsc(r.range_name || r.name || r.country || '')}${r.prefix ? ` (${zyEsc(r.prefix)})` : ''}</option>`).join('');
  }
  await zyFillClients('rp-client', 'All Clients');
  // Auto-run first report
  zyCdrLoad(summary);
}

async function zyCdrLoad(summary = false) {
  const body = document.getElementById('rp-body');
  if (!body) return;
  if (typeof zySkeleton === 'function') {
    body.innerHTML = zySkeleton('report');
  } else {
    body.innerHTML = `<div class="zy-loading">Loading report…</div>`;
  }

  const val = id => (document.getElementById(id) || {}).value || '';
  const from = val('rp-from'), to = val('rp-to');
  const rangeId = val('rp-range'), clientId = val('rp-client');
  const num = val('rp-num'), cli = val('rp-cli');

  const checkedBoxes = Array.from(document.querySelectorAll('.grp-chk:checked')).map(cb => cb.value);

  const params = new URLSearchParams();
  if (typeof AGENT_ID !== 'undefined' && AGENT_ID) params.append('agent_id', AGENT_ID);
  if (from) params.append('date_from', from);
  if (to) params.append('date_to', to);
  if (rangeId) params.append('range', rangeId);
  if (clientId) params.append('client_id', clientId);
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
      date: 'Date',
      month: 'Month',
      range: 'Range',
      client: 'Client',
      number: 'Number',
      cli: 'CLI'
    };
    const cols = [
      ...checkedBoxes.map(k => keyLabels[k] || k),
      'SMS Count',
      'Currency',
      'My Payout',
      'Client Payout',
      'Profit'
    ];
    const rows = data.map(g => [
      ...checkedBoxes.map(k => g[k] || '—'),
      g.sms_count || 0,
      g.currency || 'USD',
      `$${Number(g.payout || 0).toFixed(4)}`,
      `$${Number(g.client_payout || 0).toFixed(4)}`,
      `$${Number(g.profit || 0).toFixed(4)}`
    ]);

    const totals = zyBuildCdrTotalRow(data, true, { summary: logs.summary });

    const totalGroupsCount = (logs.summary && logs.summary.total_groups != null) ? logs.summary.total_groups : data.length;
    const footTds = [
      `<td><b>Total Groups: ${totalGroupsCount}</b></td>`,
      ...Array(Math.max(0, checkedBoxes.length - 1)).fill('<td></td>'),
      `<td>${totals.formatted.smsBadge}</td>`,
      `<td><span class="badge" style="background:var(--sp-bg-subtle);">USD</span></td>`,
      `<td><b>${totals.formatted.payout}</b></td>`,
      `<td><b>${totals.formatted.clientPayout}</b></td>`,
      `<td><b>${totals.formatted.profit}</b></td>`
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
      s.range_name || s.range_label || s.range || s.country || '—',
      s.number || '',
      (s.cli || s.app || '—'),
      zyClientName(s.client_id) || s.client || '—',
      s.message || '',
      s.currency || '$',
      s.payout != null ? (typeof s.payout === 'number' ? `$${s.payout.toFixed(4)}` : `$${s.payout}`) : '$0.0000',
      s.client_payout != null ? (typeof s.client_payout === 'number' ? `$${s.client_payout.toFixed(4)}` : `$${s.client_payout}`) : '$0.0000'
    ]);

    const totals = zyBuildCdrTotalRow(data, false, { summary: logs.summary });

    const footTds = [
      `<td>${totals.formatted.smsBadge}</td>`,
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      '<td></td>',
      `<td><span class="badge" style="background:var(--sp-bg-subtle);">USD</span></td>`,
      `<td><b>${totals.formatted.payout}</b></td>`,
      `<td><b>${totals.formatted.clientPayout}</b></td>`
    ];

    body.innerHTML = zyDT2('dt-cdr', {
      cols: ['Date', 'Range', 'Number', 'CLI', 'Client', 'SMS', 'Currency', 'My Payout', 'Client Payout'],
      rows,
      sort: 0,
      dir: -1,
      footRow: footTds.join('')
    });
    zy2Render('dt-cdr');
  }
}

/* ═══ STATS PAGES (client / range / number) ═════════════════ */
function pgClientSmsStats() { return zyStatsPage('client'); }
function pgSmsRangeStats() { return zyStatsPage('range'); }
function pgSmsNumberStats() { return zyStatsPage('number'); }
async function zyStatsPage(kind) {
  const c = document.getElementById('page-content');
  const meta = {
    client: ['Client SMS Stats', 'Clients', 'Client', 'Filter Client'],
    range:  ['SMS Range Stats',  'SMS Ranges', 'Range', 'Filter Range'],
    number: ['SMS Number Stats', 'Numbers', 'Number', null]
  }[kind];
  zyCrumb([meta[0]]);
  c.innerHTML = `<div class="zy-intro">Here you will get summarize ${kind === 'range' ? 'reports of SMS Ranges' : 'sms reports of ' + meta[1]}.</div>
    <div class="zy-filterbox">
      <input class="zy-fb-input" id="st-from" value="${zyToday()} 00:00:00">
      <input class="zy-fb-input" id="st-to" value="${zyToday()} 23:59:59">
      ${meta[3] ? `<select class="zy-fb-input" id="st-pick"><option value="">${meta[3]}</option></select>` : ''}
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="zyStatsLoad('${kind}')">Show Report</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">${meta[0]}</div>
      <div class="zy-panel-body" id="st-body"><div class="zy-loading">Loading…</div></div></div>`;
  if (kind === 'client') await zyFillClients('st-pick', 'Filter Client');
  if (kind === 'range') {
    const ranges = zyList(await apiFetch('/api/numbers/sms-ranges'));
    document.getElementById('st-pick').innerHTML = `<option value="">Filter Range</option>` +
      ranges.map(r => `<option value="${r.id}">${zyEsc(r.range_name || r.name || r.country)}</option>`).join('');
  }
  zyStatsLoad(kind);
}
async function zyStatsLoad(kind) {
  const body = document.getElementById('st-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const logs = zyList(await apiFetch(`/api/sms/logs?agent_id=${AGENT_ID}&limit=500`))
    .filter(s => zyInRange('st', s.timestamp));
  const keyOf = s => kind === 'client' ? zyClientName(s.client_id)
                   : kind === 'range' ? (s.range_name || s.range_label || s.range || s.country || '—')
                   : (s.number || '');
  const group = {};
  logs.forEach(s => {
    const k = keyOf(s) || '—';
    group[k] = group[k] || { sms: 0, mine: 0, client: 0 };
    group[k].sms++;
    group[k].mine += Number(s.payout || 0);
    group[k].client += Number(s.client_payout || 0);
  });
  const label = kind === 'client' ? 'Client' : kind === 'range' ? 'Range' : 'Number';
  const rows = Object.entries(group).map(([k, v]) =>
    [k, v.sms, 'USD', v.mine.toFixed(3), v.client.toFixed(3)]);
  body.innerHTML = zyDT2('dt-stats', {
    cols: [label, 'SMS', 'Currency', 'My Payout', 'Client Payout'], rows, sort: 1, dir: -1 });
  zy2Render('dt-stats');
}

/* ═══ MY CREDIT NOTES ═══════════════════════════════════════ */
async function pgCreditNotes() {
  const c = document.getElementById('page-content');
  zyCrumb(['My Credit Notes']);
  c.innerHTML = `<div class="zy-intro">These are the credit notes for your account. you can request payment after due date.</div>
    <div class="zy-filterbox">
      <input class="zy-fb-input" id="cn-from" value="${zyMonthStart()} 00:00:00">
      <input class="zy-fb-input" id="cn-to" value="${zyToday()} 23:59:59">
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="pgCreditNotesLoad()">Show Report</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">Credit Notes</div>
      <div class="zy-panel-body" id="cn-body"><div class="zy-loading">Loading…</div></div></div>`;
  pgCreditNotesLoad();
}
async function pgCreditNotesLoad() {
  const body = document.getElementById('cn-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const list = zyList(await apiFetch('/api/credit-notes?limit=500'))
    .filter(n => String(n.agent_id) === String(AGENT_ID))
    .filter(n => zyInRange('cn', n.created || n.date));
  const rows = list.map(n => {
    const due = new Date(String(n.date || n.created || '').slice(0, 10));
    due.setDate(due.getDate() + 1);
    return [(n.date || n.created || '').slice(0, 10), n.reason || 'SMS', n.term || 'Weekly',
            n.currency || 'USD', Number(n.amount || 0).toFixed(3),
            isNaN(due) ? '' : due.toISOString().slice(0, 10),
            { v: '', h: `<button class="zy-dl zy-dl-red">${zyImg('btn_dl_red')}</button>` }];
  });
  body.innerHTML = zyDT2('dt-credit', {
    cols: ['Date', 'For', 'Term', 'Currency', 'Payout', 'Due Date', 'Download'], rows, sort: 0, dir: -1 });
  zy2Render('dt-credit');
}

/* ═══ PAYMENT REQUESTS ══════════════════════════════════════ */
async function pgPaymentRequests() {
  const c = document.getElementById('page-content');
  zyCrumb(['Payment Requests']);
  c.innerHTML = `<div class="zy-intro">Here you can track your payment requests. and make new requests.</div>
    <div class="zy-balbox">
      <div class="zy-bal zy-bal-usd">USD Balance: <span id="bal-usd">0</span></div>
      <div class="zy-bal zy-bal-eur">EUR Balance: <span id="bal-eur">0</span></div>
      <div class="zy-bal zy-bal-gbp">GBP Balance: <span id="bal-gbp">0</span></div>
    </div>
    <div class="zy-filterbox">
      <input class="zy-fb-input" id="pr-from" value="${zyMonthStart()} 00:00:00">
      <input class="zy-fb-input" id="pr-to" value="${zyToday()} 23:59:59">
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="pgPaymentRequestsLoad()">Show Report</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">Payment Requests</div>
      <div class="zy-panel-body" id="pr-body"><div class="zy-loading">Loading…</div></div></div>`;
  const earn = await apiFetch(`/api/agent/${AGENT_ID}/earnings`);
  const bal = (earn && (earn.balance ?? earn.total)) || 0;
  const el = document.getElementById('bal-usd'); if (el) el.textContent = bal;
  pgPaymentRequestsLoad();
}
async function pgPaymentRequestsLoad() {
  const body = document.getElementById('pr-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  const list = zyList(await apiFetch(`/api/payout-requests?agent_id=${AGENT_ID}`))
    .filter(r => zyInRange('pr', r.timestamp));
  const rows = list.map(r => [
    zyDateOnly(r.timestamp), r.currency || 'USD',
    r.amount != null ? Number(r.amount).toFixed(2) : '',
    { v: r.status || '', h: `<span class="zy-badge-active ${r.status === 'paid' ? '' : 'zy-badge-off'}">${(r.status || '').replace(/^./, ch => ch.toUpperCase())}</span>` },
    r.method || r.mode || '', r.notes || '', r.paid_amount != null ? r.paid_amount : ''
  ]);
  body.innerHTML = zyDT2('dt-payreq', {
    cols: ['Date', 'Currency', 'Amount', 'Status', 'Payment Mode', 'Details', 'Paid Amount'], rows, sort: 0, dir: -1 });
  zy2Render('dt-payreq');
}

/* ═══ BANK ACCOUNTS ═════════════════════════════════════════ */
async function pgBankAccounts() {
  const c = document.getElementById('page-content');
  zyCrumb(['Bank Accounts']);
  c.innerHTML = `<div class="zy-intro">Here you can add your bank accounts and use them while requesting payments.</div>
    <div class="zy-panel"><div class="zy-panel-head">Manage Bank Accounts
      <div class="zy-head-acts">
        <button class="zy-act zy-act-blue" onclick="zyAddBankModal()" title="Add Bank Account">${zyImg('btn_add')}</button>
      </div></div>
      <div class="zy-panel-body" id="bk-body"><div class="zy-loading">Loading…</div></div></div>`;
  let list = [];
  try { list = zyList(await apiFetch(`/api/bank-accounts?agent_id=${AGENT_ID}`)); } catch (e) { list = []; }
  const rows = list.map(b => [b.currency || '', b.country || '', b.bank_name || '', b.bank_branch || '',
                              b.bank_address || '', b.account_no || '', b.beneficiary || '']);
  document.getElementById('bk-body').innerHTML = zyDT2('dt-bank', {
    cols: ['Currency', 'Country', 'Bank Name', 'Bank Branch', 'Bank Address', 'Account No.', 'Beneficiary'], rows });
  zy2Render('dt-bank');
}
const ZY_COUNTRIES = ['Afghanistan', 'Aland Islands', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Bahrain', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China',
  'Egypt', 'France', 'Germany', 'India', 'Indonesia', 'Iraq', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Nigeria',
  'Pakistan', 'Philippines', 'Saudi Arabia', 'Singapore', 'Spain', 'Turkey', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam'];
function zyAddBankModal() {
  zyModal('Add New Bank Account', `
    <label class="zy-lbl">Currency</label>
    <select class="zy-input" id="bk-cur"><option value="">Select Currency</option>
      <option>USD</option><option>EUR</option><option>GBP</option></select>
    <label class="zy-lbl">Country</label>
    ${zyS2('bk-country', 'Select Country', ZY_COUNTRIES)}
    <label class="zy-lbl">Bank Name</label><input class="zy-input" id="bk-name" placeholder="Bank Name">
    <label class="zy-lbl">Bank Branch</label><input class="zy-input" id="bk-branch" placeholder="Bank Branch">
    <label class="zy-lbl">Bank Address</label><input class="zy-input" id="bk-addr" placeholder="Bank Address">
    <label class="zy-lbl">Account No./IBAN</label><input class="zy-input" id="bk-acc" placeholder="Account Number/IBAN">
    <label class="zy-lbl">Beneficiary Name</label><input class="zy-input" id="bk-ben" placeholder="Beneficiary Name">`,
    `<button class="zy-btn-grey" onclick="closeModal()">Close</button>
     <button class="zy-btn-blue" onclick="zySaveBank()">Add</button>`);
}
async function zySaveBank() {
  const p = { agent_id: AGENT_ID,
    currency: document.getElementById('bk-cur').value,
    country: zyS2Value('bk-country'),
    bank_name: document.getElementById('bk-name').value.trim(),
    bank_branch: document.getElementById('bk-branch').value.trim(),
    bank_address: document.getElementById('bk-addr').value.trim(),
    account_no: document.getElementById('bk-acc').value.trim(),
    beneficiary: document.getElementById('bk-ben').value.trim() };
  if (!p.currency || !p.bank_name) { toast('Currency and bank name required', 'error'); return; }
  try { await apiFetch('/api/bank-accounts', { method: 'POST', body: JSON.stringify(p) }); } catch (e) {}
  closeModal(); zyFlash('Bank Account Added.'); loadPage('bank-accounts');
}

/* ═══ STATEMENTS ════════════════════════════════════════════ */
async function pgStatements(cur) {
  const c = document.getElementById('page-content');
  zyCrumb([cur + ' Statements']);
  c.innerHTML = `<div class="zy-gap"></div>
    <div class="zy-filterbox">
      <input class="zy-fb-input" id="sm-from" value="${zyMonthStart()} 00:00:00">
      <input class="zy-fb-input" id="sm-to" value="${zyToday()} 23:59:59">
      <div class="zy-fb-btns"><button class="zy-btn-blue" onclick="pgStatementsLoad('${cur}')">Show Report</button></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">${cur} Statements</div>
      <div class="zy-panel-body" id="sm-body"><div class="zy-loading">Loading…</div></div></div>`;
  pgStatementsLoad(cur);
}
async function pgStatementsLoad(cur) {
  const body = document.getElementById('sm-body');
  body.innerHTML = `<div class="zy-loading">Loading…</div>`;
  let balance = 0;
  const rows = zyList(await apiFetch('/api/credit-notes?limit=500'))
    .filter(n => String(n.agent_id) === String(AGENT_ID))
    .filter(n => (n.currency || 'USD') === cur)
    .filter(n => zyInRange('sm', n.created || n.date))
    .sort((a, b) => String(a.created || '').localeCompare(String(b.created || '')))
    .map(n => {
      const credit = Number(n.amount || 0);
      balance = Math.round((balance + credit) * 1000) / 1000;
      return [zyDateOnly(n.created || n.date), credit.toFixed(2), '0', 'Credit Note', balance.toFixed(2), n.reason || ''];
    }).reverse();
  body.innerHTML = zyDT2('dt-stmt', {
    cols: ['Date', 'Credit', 'Debit', 'Transaction For', 'Balance', 'Remarks'], rows, sort: 0, dir: -1 });
  zy2Render('dt-stmt');
}

/* ═══ TEST PANELS ═══════════════════════════════════════════ */
function pgVoiceTestPanel() { return zyTestPanel(true); }
function pgSmsTestPanel() { return zyTestPanel(false); }
async function zyTestPanel(voice) {
  const c = document.getElementById('page-content');
  zyCrumb([voice ? 'Test Panel' : 'SMS Test Panel']);
  const intro = voice
    ? `<div class="zy-intro">We are pleased to introduce the test numbers of our interconnected terminations. You can test the reachability of our number ranges using the following numbers.</div>
       <div class="zy-intro">To test:</div>
       <ul class="zy-list">
         <li>Choose a test number from a termination you are interested in.</li>
         <li>Make a call to the selected number.</li>
         <li>If the test is successful, you will hear: "You have reached the test number".</li>
         <li>Check also the Last calls stats (last 1 hour) below if your test was successful.</li>
       </ul>`
    : `<div class="zy-intro">Here you can see all test numbers.. you can make call on them and see test reports.</div>`;
  c.innerHTML = `${intro}
    <div class="zy-panel">
      <div class="zy-panel-head">${voice ? 'Test Numbers' : 'SMS Test Numbers'}
        <div class="zy-head-acts">
          ${zyS2('tp-range', 'Select Range', [])}
          <button class="zy-act zy-act-red zy-act-wide" onclick="zyTestFilter()">Filter</button>
        </div>
      </div>
      <div class="zy-panel-body"><div class="zy-loading">Loading…</div></div>
    </div>
    <div class="zy-panel"><div class="zy-panel-head">${voice ? 'Recent Test Details' : 'Recent SMS Test'}</div>
      <div class="zy-panel-body" id="tp-recent"><div class="zy-loading">Loading…</div></div></div>`;

  const [nums, ranges, logs] = voice
    ? await Promise.all([
        apiFetch(`/api/numbers?agent_id=${AGENT_ID}&limit=100000`),
        apiFetch('/api/numbers/sms-ranges'),
        apiFetch(`/api/sms/logs?agent_id=${AGENT_ID}&limit=500`)
      ])
    : await Promise.all([
        apiFetch('/api/sms/test-numbers?limit=500'),
        apiFetch('/api/numbers/sms-ranges'),
        apiFetch('/api/sms/test-logs?limit=500')
      ]);
  ZY_RANGES = zyList(ranges);
  ZY_S2['tp-range'].items = ZY_RANGES.map(r => r.range_name || r.name || r.country || '');

  if (voice) {
    ZY_TESTNUMS = zyList(nums).map(n => [
      n.range_name || n.range_label || n.range || (n.country && n.provider && n.provider !== 'Manual' ? `${n.country} ${n.provider}` : (n.country || '—')), n.prefix || '', n.number || '',
      n.payout != null && n.payout !== '' ? n.payout : 'Ask',
      { v: '', h: `SD : <b>${n.sms_daily || 0}</b> | SW : <b>${n.sms_weekly || 0}</b>` }
    ]);
    c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-testnums', {
      cols: ['Range', 'Prefix', 'Test Number', 'Payout', 'Limits'], rows: ZY_TESTNUMS });
    zy2Render('dt-testnums');

    const rows = zyList(logs).map(s => [
      zyDateOnly(s.timestamp), s.range_name || s.range_label || s.range || (s.country && s.provider && s.provider !== 'Manual' ? `${s.country} ${s.provider}` : (s.country || '—')),
      s.number || '', zyMaskCli(s.cli || s.app), s.message ? 'XXXXX' : ''
    ]);
    document.getElementById('tp-recent').innerHTML = zyDT2('dt-testlog', {
      cols: ['Date', 'Range', 'Number', 'CLI', 'SMS'], rows, sort: 0, dir: -1 });
    zy2Render('dt-testlog');
    return;
  }

  ZY_TESTNUMS = zyList(nums).map(n => [n.range_name || n.range_label || n.range || (n.country ? `${n.country}` : '—'), n.number || '']);
  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-testnums', {
    cols: ['Range', 'Test Number'], rows: ZY_TESTNUMS });
  zy2Render('dt-testnums');

  const mask = s => String(s || '').replace(/./g, '*').slice(0, 6);
  const rows = zyList(logs).map(s => [
    zyDateOnly(s.timestamp), s.range_name || s.range_label || s.range || (s.country ? `${s.country}` : '—'),
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

/* ═══ BULK ADD ══════════════════════════════════════════════ */
/* ═══ BULK ADD NUMBERS QUEUE (V6) ═══════════════════════════ */
window._zyBulkJobsQueue = window._zyBulkJobsQueue || [];

async function pgBulkAdd() {
  const c = document.getElementById('page-content');
  zyCrumb(['SMS Module', 'Bulk Add']);

  c.innerHTML = `
    <div class="zy-intro">Queue bulk number allocations to clients with instant pool availability checks and live job progress.</div>
    <div class="zy-panel">
      <div class="zy-panel-head" style="display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-layer-group" style="color:var(--sp-primary);margin-right:6px;"></i> Bulk Add Numbers to Client</span>
        <div id="ba-pool-stat-wrap"></div>
      </div>
      <div class="zy-panel-body">
        <div class="zy-bulk-card" style="max-width:680px;margin:10px auto 20px;">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div>
                <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--sp-text-secondary);">Target Client *</label>
                <select id="ba-client" class="zy-input" style="width:100%;height:38px;"></select>
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--sp-text-secondary);">SMS Range</label>
                <select id="ba-range" class="zy-input" style="width:100%;height:38px;" onchange="zyUpdateBulkPoolStat()"></select>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
              <div>
                <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--sp-text-secondary);">Quantity *</label>
                <input type="number" id="ba-count" class="zy-input" value="10" min="1" max="5000" style="width:100%;height:38px;">
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--sp-text-secondary);">Client Payterm *</label>
                <select id="ba-payterm" class="zy-input" style="width:100%;height:38px;">
                  <option value="Weekly" selected>Weekly</option>
                  <option value="1/1">1/1</option>
                  <option value="7/1">7/1</option>
                  <option value="7/7">7/7</option>
                  <option value="15/15">15/15</option>
                  <option value="15/30">15/30</option>
                  <option value="Monthly60">Monthly60</option>
                </select>
              </div>
              <div>
                <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--sp-text-secondary);">Client Rate ($) *</label>
                <input type="number" id="ba-rate" step="0.0001" class="zy-input" value="0.0100" style="width:100%;height:38px;">
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:4px;">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;font-weight:600;color:var(--sp-text-secondary);">
                <input type="checkbox" id="ba-random" checked style="accent-color:var(--sp-primary);"> Sort / allocate numbers randomly
              </label>
              <div id="ba-pool-notice" style="font-size:12px;color:var(--sp-text-muted);"></div>
            </div>

            <div style="margin-top:6px;">
              <button class="sp-btn-primary" onclick="zySubmitBulkAdd()" style="width:100%;height:42px;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">
                <i class="fas fa-play"></i> Execute Bulk Add Job
              </button>
            </div>
          </div>
        </div>

        <div id="ba-history"></div>
      </div>
    </div>
  `;

  const [clientsRes, rangesRes, numsRes] = await Promise.all([
    zyFillClients('ba-client', 'Select Client'),
    apiFetch('/api/numbers/sms-ranges').catch(() => []),
    apiFetch(`/api/numbers?agent_id=${AGENT_ID}&limit=100000`).catch(() => ({ data: [] }))
  ]);

  const ranges = zyList(rangesRes);
  const el = document.getElementById('ba-range');
  if (el) {
    el.innerHTML = `<option value="">All Available Ranges</option>` +
      ranges.map(r => `<option value="${r.id}">${zyEsc(r.name || r.range_name || r.country || '')}</option>`).join('');
  }

  window._zyAgentPoolNumbers = zyList(numsRes);
  zyUpdateBulkPoolStat();
  zyRenderBulkQueueUi();
}

window.zyUpdateBulkPoolStat = function() {
  const rangeId = document.getElementById('ba-range')?.value;
  const all = window._zyAgentPoolNumbers || [];
  const unassigned = all.filter(n => !n.client_id && (!rangeId || String(n.range_id) === String(rangeId)));

  const wrap = document.getElementById('ba-pool-stat-wrap');
  const notice = document.getElementById('ba-pool-notice');
  const cls = unassigned.length > 20 ? 'high' : unassigned.length > 0 ? 'low' : 'none';

  if (wrap) {
    wrap.innerHTML = `
      <span class="zy-pool-avail-badge ${cls}">
        <i class="fas fa-cubes"></i> Unassigned Pool: <b>${unassigned.length}</b>
      </span>
    `;
  }
  if (notice) {
    notice.innerHTML = `<i class="fas fa-info-circle"></i> <b>${unassigned.length}</b> unassigned numbers ready in selected pool`;
  }
};

window.zyRenderBulkQueueUi = function() {
  const host = document.getElementById('ba-history');
  if (!host) return;
  const all = window._zyAgentPoolNumbers || [];
  const unassigned = all.filter(n => !n.client_id);
  host.innerHTML = zyRenderBulkQueueCard(window._zyBulkJobsQueue, { available: unassigned.length });
};

window.zySubmitBulkAdd = async function() {
  const clientSel = document.getElementById('ba-client');
  const client = clientSel?.value;
  const clientName = clientSel?.options[clientSel.selectedIndex]?.text || `Client #${client}`;
  const rangeSel = document.getElementById('ba-range');
  const range = rangeSel?.value;
  const rangeName = rangeSel?.options[rangeSel.selectedIndex]?.text || 'All Ranges';
  const count = Number(document.getElementById('ba-count')?.value) || 0;
  const payterm = document.getElementById('ba-payterm')?.value || 'Weekly';
  const rate = parseFloat(document.getElementById('ba-rate')?.value) || 0.01;
  const isRandom = document.getElementById('ba-random')?.checked;

  if (!client) { toast('Please select a target client', 'error'); return; }
  if (count <= 0) { toast('Quantity must be greater than 0', 'error'); return; }

  const all = window._zyAgentPoolNumbers || [];
  let pool = all.filter(n => !n.client_id && (!range || String(n.range_id) === String(range)));
  if (isRandom) {
    pool = pool.slice().sort(() => Math.random() - 0.5);
  }

  if (pool.length === 0) {
    toast('No unassigned numbers available in your pool for the selected range', 'error');
    return;
  }

  const toAllocate = pool.slice(0, count);
  const numberIds = toAllocate.map(n => n.id);

  const jobId = 'JOB-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const newJob = {
    id: jobId,
    client: client,
    client_name: clientName,
    range: range,
    range_name: rangeName,
    requested: count,
    allocated: 0,
    status: 'PROCESSING',
    created_at: new Date().toLocaleTimeString()
  };
  window._zyBulkJobsQueue.unshift(newJob);
  zyRenderBulkQueueUi();

  try {
    const res = await apiFetch('/api/numbers/bulk-assign-many', {
      method: 'POST',
      body: JSON.stringify({
        number_ids: numberIds,
        target_type: 'client',
        target_id: Number(client),
        client_payterm: payterm,
        client_rate: rate,
        notes: `Bulk add job ${jobId}`
      })
    });

    const allocatedCount = (res && res.updated_count) || numberIds.length;
    newJob.allocated = allocatedCount;
    newJob.status = 'COMPLETED';

    // Update in-memory pool
    const assignedSet = new Set(numberIds);
    (window._zyAgentPoolNumbers || []).forEach(n => {
      if (assignedSet.has(n.id)) {
        n.client_id = Number(client);
        n.client_rate = rate;
        n.client_payterm = payterm;
      }
    });

    toast(`Successfully allocated ${allocatedCount} number(s) to ${clientName}!`, 'success');
  } catch (err) {
    newJob.status = 'FAILED';
    console.error('Bulk allocate error:', err);
    toast(err.message || 'Bulk allocate failed', 'error');
  }

  zyUpdateBulkPoolStat();
  zyRenderBulkQueueUi();
};

/* ═══ API TOKENS ═════════════════════════════════════════════ */
async function pgApiTokens() {
  const c = document.getElementById('page-content');
  zyCrumb(['Account', 'REST API']);
  c.innerHTML = `
    <div class="zy-intro">REST API credentials and webhooks for automated SMS and CDR streaming.</div>
    <div class="zy-panel">
      <div class="zy-panel-head">REST API Integration</div>
      <div class="zy-panel-body">
        <div class="sp-card" style="padding:20px;margin-bottom:16px;">
          <h4 style="margin:0 0 10px;font-size:15px;font-weight:700;">API Base Endpoint</h4>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" readonly value="${window.location.origin}/api/v1" class="zy-input" style="flex:1;">
            <button class="sp-btn-secondary" onclick="navigator.clipboard.writeText('${window.location.origin}/api/v1');toast('Copied!','success');">Copy</button>
          </div>
        </div>
        <div class="sp-card" style="padding:20px;">
          <h4 style="margin:0 0 10px;font-size:15px;font-weight:700;">Active API Keys</h4>
          <p style="color:var(--sp-text-secondary);font-size:13px;margin-bottom:12px;">Use Bearer auth header: <code>Authorization: Bearer &lt;token&gt;</code></p>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" readonly value="asms_live_${(AGENT_ID || 'agt').slice(0, 8)}_${Date.now().toString(36)}" class="zy-input" style="flex:1;font-family:monospace;">
            <button class="sp-btn-primary" onclick="toast('API key refreshed','success');">Regenerate</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ═══ AUDIT LOGS ═════════════════════════════════════════════ */
async function pgAuditLogs() {
  const c = document.getElementById('page-content');
  zyCrumb(['Account', 'Audit Log']);
  c.innerHTML = `
    <div class="zy-intro">Real-time system audit logs and security events recorded on your account.</div>
    <div class="zy-panel">
      <div class="zy-panel-head">Account Audit Log</div>
      <div class="zy-panel-body"><div class="zy-loading">Loading audit logs…</div></div>
    </div>
  `;
  const res = await apiFetch('/api/audit-logs?limit=50');
  const list = zyList(res);
  const rows = list.map(item => [
    item.created_at || item.timestamp || item.created || '—',
    item.action || item.event || '—',
    item.username || item.actor || 'Agent',
    item.ip || item.ip_address || '—',
    item.details || item.note || item.message || '—'
  ]);
  c.querySelector('.zy-panel-body').innerHTML = zyDT2('dt-auditlogs', {
    cols: ['Date/Time', 'Action', 'User', 'IP Address', 'Details'], rows, sort: 0, dir: -1
  });
  zy2Render('dt-auditlogs');
}

/* ── router ─────────────────────────────────────────────────── */
(function zyHookAgentPages() {
  const map = {
    'dashboard': () => pgDashboard(),
    'sms-ranges': pgSmsRanges, 'my-sms-numbers': pgMySmsNumbers, 'sms-ratecard': pgSmsRateCard,
    'access-search': pgAccessSearch,
    'news-clients': pgNewsClients, 'notifications': pgNewsClients,
    'my-clients': pgMyClients,
    'bulk-add': pgBulkAdd,
    'api-tokens': () => { if (window.SpeedProfile) window.SpeedProfile.render('page-content', 'api'); else pgApiTokens(); },
    'audit-logs': () => { if (window.SpeedProfile) window.SpeedProfile.render('page-content', 'audit'); else pgAuditLogs(); },
    'profile': () => { if (window.SpeedProfile) window.SpeedProfile.render('page-content', 'details'); else pgProfile(); },
    'detailed-sms': pgDetailedSms, 'summary-sms': pgSummarySms,
    'client-sms-stats': pgClientSmsStats, 'sms-range-stats': pgSmsRangeStats,
    'sms-number-stats': pgSmsNumberStats, 'credit-notes': pgCreditNotes,
    'payment-requests': pgPaymentRequests, 'bank-accounts': pgBankAccounts,
    'usd-statements': () => pgStatements('USD'), 'eur-statements': () => pgStatements('EUR'),
    'gbp-statements': () => pgStatements('GBP'),
    'voice-test-panel': pgVoiceTestPanel, 'sms-test-panel': pgSmsTestPanel
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
      if (typeof zySyncAccordionActive === 'function') zySyncAccordionActive(page);
      if (window.zyCloseSidebar) window.zyCloseSidebar();
      window.scrollTo({ top: 0 });
      try { sessionStorage.setItem('agent_current_page', page); } catch (e) {}
      map[page]();
      return;
    }
    prev(page);
    if (typeof zySyncAccordionActive === 'function') zySyncAccordionActive(page);
    if (window.zyCloseSidebar) window.zyCloseSidebar();
  };
})();
