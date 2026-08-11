/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Fleet View
   Vehicle roster, health, telemetry, maintenance
   ============================================================ */

import { formatNumber, formatDate, generateSparkline } from '../data.js';
import { renderGauge, renderSparkline } from '../charts.js';
import { showToast, statusChip, riskBar, openModal } from '../components.js';
import { state, addVehicle } from '../store.js';

export function renderFleet(container) {
  let viewMode = 'grid';
  let filterStatus = 'all';
  let searchQuery = '';

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Fleet Management</h1>
          <p class="page-subtitle" id="fleet-subtitle"></p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="exportFleetBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3M2 10v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Export
          </button>
          <button class="btn btn-primary btn-sm" id="addVehicleBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add Vehicle
          </button>
        </div>
      </div>

      <!-- Summary KPIs -->
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr)" id="fleet-kpi-grid"></div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-input-wrap" style="max-width:320px">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input class="filter-input" id="vehicleSearch" placeholder="Search by ID, name, driver…" type="search" />
        </div>
        <div class="chip-select" id="statusFilter">
          <div class="chip active" data-status="all">All</div>
          <div class="chip" data-status="active">Active</div>
          <div class="chip" data-status="transit">Transit</div>
          <div class="chip" data-status="idle">Idle</div>
          <div class="chip" data-status="maintenance">Maintenance</div>
        </div>
        <div class="tabs" style="margin-left:auto">
          <button class="tab-btn active" data-view-mode="grid" id="gridViewBtn" aria-label="Grid view">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>
            Grid
          </button>
          <button class="tab-btn" data-view-mode="table" id="tableViewBtn" aria-label="Table view">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 5h12M5 5v8" stroke="currentColor" stroke-width="1.3"/></svg>
            Table
          </button>
        </div>
      </div>

      <!-- Vehicle List -->
      <div id="vehicleList"></div>
    </div>
  `;

  function updateDOM() {
    const { vehicles } = state;
    const activeV = vehicles.filter(v => v.status === 'active' || v.status === 'transit').length;
    const idleV   = vehicles.filter(v => v.status === 'idle').length;
    const maintV  = vehicles.filter(v => v.status === 'maintenance').length;
    const avgFuel = Math.round(vehicles.reduce((s, v) => s + v.fuel, 0) / (vehicles.length || 1));

    const subEl = document.getElementById('fleet-subtitle');
    if (subEl) subEl.textContent = `${vehicles.length} vehicles · ${activeV} active · ${maintV} in maintenance`;

    const kpiGrid = document.getElementById('fleet-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        <div class="kpi-card" style="--kpi-color:#10b981;--kpi-bg:rgba(16,185,129,0.12)">
          <div class="kpi-label">Active & Transit</div>
          <div class="kpi-value">${activeV}</div>
          <div style="font-size:11px;color:var(--text-3)">of ${vehicles.length} total</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#3b82f6;--kpi-bg:rgba(59,130,246,0.12)">
          <div class="kpi-label">Idle</div>
          <div class="kpi-value">${idleV}</div>
          <div style="font-size:11px;color:var(--text-3)">Available for dispatch</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#f59e0b;--kpi-bg:rgba(245,158,11,0.12)">
          <div class="kpi-label">Maintenance</div>
          <div class="kpi-value">${maintV}</div>
          <div style="font-size:11px;color:var(--text-3)">Out of service</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#8b5cf6;--kpi-bg:rgba(139,92,246,0.12)">
          <div class="kpi-label">Avg. Fuel Level</div>
          <div class="kpi-value">${avgFuel}<span class="kpi-unit">%</span></div>
          <div style="font-size:11px;color:${avgFuel < 30 ? 'var(--danger)' : 'var(--text-3)'}">
            ${avgFuel < 30 ? '⚠ Low fleet average' : 'Fuel levels nominal'}
          </div>
        </div>
      `;
    }

    const list = document.getElementById('vehicleList');
    if (!list) return;

    const search = searchQuery.toLowerCase();
    const filtered = vehicles.filter(v => {
      const matchStatus = filterStatus === 'all' || v.status === filterStatus;
      const matchSearch = !search || v.id.toLowerCase().includes(search) || v.name.toLowerCase().includes(search) || v.driver.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    });

    if (viewMode === 'grid') {
      list.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px" class="stagger">
          ${filtered.map(v => renderVehicleCard(v)).join('')}
          ${filtered.length === 0 ? `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="9" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="19" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="19" r="2" stroke="currentColor" stroke-width="1.5"/></svg></div><div class="empty-title">No vehicles found</div><div class="empty-desc">Try adjusting your search or filter.</div></div>` : ''}
        </div>
      `;

      requestAnimationFrame(() => {
        filtered.forEach(v => {
          const fuelEl = document.getElementById(`fuel-gauge-${v.id}`);
          if (fuelEl) renderGauge(fuelEl, v.fuel, 100, {
            size: 70,
            color: v.fuel < 25 ? '#ef4444' : v.fuel < 50 ? '#f59e0b' : '#10b981',
            label: 'Fuel',
            strokeWidth: 8,
          });
          const spark = document.getElementById(`speed-spark-${v.id}`);
          if (spark) renderSparkline(spark, generateSparkline(15, 0, v.status === 'transit' ? 80 : 20), {
            color: '#3b82f6', height: 28, width: spark.offsetWidth || 80,
          });
        });
      });
    } else {
      list.innerHTML = `
        <div class="card">
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sortable">Vehicle ID</th>
                  <th>Name / Type</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Fuel</th>
                  <th>Load</th>
                  <th>Next Maint.</th>
                  <th>Risk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(v => {
                  const maintDate = new Date(v.nextMaintenance);
                  const daysUntil = Math.round((maintDate - Date.now()) / 86400000);
                  return `
                    <tr class="vehicle-row" data-id="${v.id}" style="cursor:pointer">
                      <td><span class="cell-mono">${v.id}</span></td>
                      <td>
                        <div style="font-weight:600;font-size:13px">${v.name}</div>
                        <div style="font-size:11px;color:var(--text-3)">${v.type}</div>
                      </td>
                      <td style="font-size:13px">${v.driver}</td>
                      <td>${statusChip(v.status)}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px">
                          <div class="progress" style="width:60px">
                            <div class="progress-fill ${v.fuel < 25 ? 'red' : v.fuel < 50 ? 'yellow' : 'green'} progress-bar-fill" style="width:${v.fuel}%"></div>
                          </div>
                          <span style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${v.fuel}%</span>
                        </div>
                      </td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px">
                          <div class="progress" style="width:60px">
                            <div class="progress-fill blue progress-bar-fill" style="width:${v.load}%"></div>
                          </div>
                          <span style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${v.load}%</span>
                        </div>
                      </td>
                      <td>
                        <span style="color:${daysUntil < 0 ? 'var(--danger)' : daysUntil < 7 ? 'var(--warning)' : 'var(--text-2)'};font-size:12px;font-weight:${daysUntil < 7 ? '600' : '400'}">
                          ${daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                        </span>
                      </td>
                      <td>${riskBar(v.riskScore)}</td>
                      <td>
                        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation()">Details</button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span class="pagination-info">Showing ${filtered.length} of ${vehicles.length} vehicles</span>
          </div>
        </div>
      `;
    }

    list.querySelectorAll('.vehicle-row').forEach(row => {
      row.addEventListener('click', () => openVehicleDetail(row.dataset.id));
    });
    list.querySelectorAll('.vehicle-card-el').forEach(card => {
      card.addEventListener('click', () => openVehicleDetail(card.dataset.id));
    });
  }

  function renderVehicleCard(v) {
    const maintDate = new Date(v.nextMaintenance);
    const daysUntil = Math.round((maintDate - Date.now()) / 86400000);
    return `
      <div class="vehicle-card vehicle-card-el" data-id="${v.id}" tabindex="0" role="button" aria-label="Vehicle ${v.name}">
        <div class="vehicle-header">
          <div>
            <div class="vehicle-id">${v.id}</div>
            <div class="vehicle-name">${v.name}</div>
          </div>
          ${statusChip(v.status)}
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div id="fuel-gauge-${v.id}" style="flex-shrink:0"></div>
          <div style="flex:1">
            <div class="vehicle-metrics">
              <div class="v-metric">
                <div class="v-metric-label">Load</div>
                <div class="v-metric-value">${v.load}%</div>
              </div>
              <div class="v-metric">
                <div class="v-metric-label">Speed</div>
                <div class="v-metric-value">${v.speed > 0 ? v.speed + ' mph' : '—'}</div>
              </div>
              <div class="v-metric">
                <div class="v-metric-label">Driver</div>
                <div class="v-metric-value" style="font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.driver.split(' ')[0]}</div>
              </div>
              <div class="v-metric">
                <div class="v-metric-label">Maint.</div>
                <div class="v-metric-value" style="color:${daysUntil < 0 ? 'var(--danger)' : daysUntil < 7 ? 'var(--warning)' : 'inherit'}">
                  ${daysUntil < 0 ? 'Overdue' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                </div>
              </div>
            </div>
          </div>
        </div>
        ${v.cargo ? `<div style="font-size:11px;color:var(--text-3);background:var(--bg-surface-3);padding:4px 8px;border-radius:6px;display:flex;justify-content:space-between"><span>Cargo</span><span style="color:var(--text-2);font-weight:500">${v.cargo}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div id="speed-spark-${v.id}" style="flex:1;height:28px"></div>
          ${riskBar(v.riskScore)}
        </div>
      </div>
    `;
  }

  function openVehicleDetail(vehicleId) {
    const v = state.vehicles.find(v => v.id === vehicleId);
    if (!v) return;
    const hub = state.hubs.find(h => h.id === v.currentHub);
    const maintDate = new Date(v.nextMaintenance);
    const daysUntil = Math.round((maintDate - Date.now()) / 86400000);

    openModal({
      title: `${v.name}`,
      body: `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono);margin-bottom:4px">${v.id}</div>
              <div style="font-size:13px;color:var(--text-2)">${v.type} · ${v.make}</div>
            </div>
            ${statusChip(v.status)}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><div class="form-label">Driver</div><div style="font-weight:600">${v.driver}</div></div>
            <div class="form-group"><div class="form-label">Hub</div><div style="font-weight:600">${hub?.name || '—'}</div></div>
            <div class="form-group"><div class="form-label">Mileage</div><div style="font-weight:600;font-family:var(--font-mono)">${formatNumber(v.mileage)} mi</div></div>
            <div class="form-group"><div class="form-label">Daily Miles</div><div style="font-weight:600;font-family:var(--font-mono)">${v.dailyMileage} mi</div></div>
            <div class="form-group"><div class="form-label">Fuel Level</div><div style="font-weight:600;color:${v.fuel < 25 ? 'var(--danger)' : v.fuel < 50 ? 'var(--warning)' : 'var(--success)'}">${v.fuel}%</div></div>
            <div class="form-group"><div class="form-label">Load</div><div style="font-weight:600">${v.load}%</div></div>
            <div class="form-group"><div class="form-label">Risk Score</div><div style="display:flex;align-items:center;gap:8px">${riskBar(v.riskScore)} <span style="font-family:var(--font-mono);font-size:12px">${v.riskScore}/10</span></div></div>
            <div class="form-group"><div class="form-label">Next Maintenance</div><div style="font-weight:600;color:${daysUntil < 0 ? 'var(--danger)' : daysUntil < 7 ? 'var(--warning)' : 'var(--text-1)'}">${daysUntil < 0 ? 'Overdue!' : `${daysUntil === 0 ? 'Today' : daysUntil + ' days'}`}</div></div>
          </div>
          ${v.jobId ? `<div style="background:var(--primary-dim);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:12px;font-size:13px"><span style="color:var(--text-3)">Active Job:</span> <strong>${v.jobId}</strong> — ${v.cargo}</div>` : ''}
        </div>
      `,
      footerHTML: `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Close</button>
          <button class="btn btn-warning" onclick="window.showToast?.('info','Maintenance Scheduled','Service slot booked for ${v.name}.')">Schedule Maint.</button>
          <button class="btn btn-primary">Assign Route</button>
        </div>
      `,
    });
  }

  // Event listeners
  document.getElementById('vehicleSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateDOM();
  });
  document.getElementById('statusFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#statusFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterStatus = chip.dataset.status;
      updateDOM();
    });
  });

  document.getElementById('gridViewBtn')?.addEventListener('click', () => {
    viewMode = 'grid';
    document.getElementById('gridViewBtn').classList.add('active');
    document.getElementById('tableViewBtn').classList.remove('active');
    updateDOM();
  });

  document.getElementById('tableViewBtn')?.addEventListener('click', () => {
    viewMode = 'table';
    document.getElementById('tableViewBtn').classList.add('active');
    document.getElementById('gridViewBtn').classList.remove('active');
    updateDOM();
  });

  document.getElementById('addVehicleBtn')?.addEventListener('click', () => {
    const hubOptions = state.hubs.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
    openModal({
      title: 'Add New Vehicle',
      body: `
        <form id="new-vehicle-form" style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group"><label class="form-label">Vehicle Type</label><select id="v-type" class="form-select"><option>Cargo Truck XL</option><option>Heavy Freighter</option><option>Refrigerated Van</option><option>Box Truck</option><option>Flatbed Trailer</option><option>City Sprinter</option></select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Make/Model</label><input id="v-make" class="form-input" type="text" required placeholder="e.g. Volvo FH" /></div>
            <div class="form-group"><label class="form-label">Driver Name</label><input id="v-driver" class="form-input" type="text" required placeholder="Driver Name" /></div>
          </div>
          <div class="form-group"><label class="form-label">Assigned Hub</label><select id="v-hub" class="form-select">${hubOptions}</select></div>
          <input type="submit" style="display:none" />
        </form>
      `,
      confirmLabel: 'Add Vehicle',
      onConfirm: (e, modalBody) => {
        const form = modalBody.querySelector('#new-vehicle-form');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }
        
        const type = form.querySelector('#v-type').value;
        const make = form.querySelector('#v-make').value;
        const driver = form.querySelector('#v-driver').value;
        const currentHub = form.querySelector('#v-hub').value;

        const newV = {
          id: `VH-${String(Math.floor(Math.random() * 900) + 100)}`,
          name: `${make} #${Math.floor(Math.random() * 99)}`,
          type,
          make,
          status: 'idle',
          fuel: 100,
          load: 0,
          mileage: 0,
          speed: 0,
          currentHub,
          nextMaintenance: Date.now() + 30 * 86400000, // 30 days
          driver,
          lat: 34.05,
          lng: -118.24,
          lastUpdate: Date.now(),
          dailyMileage: 0,
          riskScore: 1,
          cargo: null,
          jobId: null,
        };
        
        addVehicle(newV);
        showToast('success', 'Vehicle Added', `${newV.name} added to the fleet.`);
        return true;
      }
    });
  });

  document.getElementById('exportFleetBtn')?.addEventListener('click', () => {
    showToast('success', 'Export Started', 'Fleet report is being generated.');
  });

  const onStateChange = () => requestAnimationFrame(updateDOM);
  window.addEventListener('statechange', onStateChange);

  updateDOM();

  return {
    handleState: true,
    cleanup: () => window.removeEventListener('statechange', onStateChange)
  };
}
