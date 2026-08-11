/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Routes View
   Route management, optimizer, capacity
   ============================================================ */

import { formatNumber } from '../data.js';
import { renderBarChart } from '../charts.js';
import { showToast, statusChip, openModal } from '../components.js';
import { state, addRoute, optimizeRoutes } from '../store.js';

export function renderRoutes(container) {
  let searchQuery = '';
  let filterStatus = 'all';

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Route Management</h1>
          <p class="page-subtitle" id="routes-subtitle"></p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm" id="optimizeBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            Optimize All
          </button>
          <button class="btn btn-primary btn-sm" id="addRouteBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add Route
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)" id="routes-kpi-grid"></div>

      <!-- Filter -->
      <div class="filter-bar">
        <div class="filter-input-wrap" style="max-width:280px">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 9l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <input class="filter-input" id="routeSearch" placeholder="Search by city or route ID…" type="search" />
        </div>
        <div class="chip-select" id="routeStatusFilter">
          <div class="chip active" data-status="all">All</div>
          <div class="chip" data-status="active">Active</div>
          <div class="chip" data-status="idle">Idle</div>
          <div class="chip" data-status="maintenance">Maintenance</div>
        </div>
      </div>

      <!-- Content Grid -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
        <!-- Route List -->
        <div style="display:flex;flex-direction:column;gap:0" class="card" id="routeList"></div>

        <!-- Route Insights Panel -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Performance Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Route Performance</div>
              <div class="card-subtitle">On-time rate by route</div>
            </div>
            <div class="card-body" style="padding-top:8px">
              <div id="routePerfChart" style="height:140px"></div>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:12px">⚡ Optimizer Suggestions</div>
            <div style="display:flex;flex-direction:column;gap:10px" id="routeRecommendations">
              <div class="alert alert-info" style="flex-direction:column;gap:4px">
                <div class="alert-title">Network Optimization</div>
                <div class="alert-msg">Run optimize all to improve average delay and on-time performance across the network.</div>
              </div>
            </div>
          </div>

          <!-- Top Routes by Volume -->
          <div class="card card-padded">
            <div class="card-title" style="margin-bottom:14px">Volume by Route</div>
            <div style="display:flex;flex-direction:column;gap:10px" id="topRoutesVolume"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  function updateDOM() {
    const { routes, jobs, hubs } = state;

    const totalRoutes = routes.length;
    const activeRoutes = routes.filter(r => r.status === 'active').length;
    const avgOnTime = (routes.reduce((s, r) => s + r.onTimeRate, 0) / (routes.length || 1)).toFixed(1);
    const totalWeeklyVolume = routes.reduce((s, r) => s + r.weeklyVolume, 0);

    const subEl = document.getElementById('routes-subtitle');
    if (subEl) subEl.textContent = `${totalRoutes} routes · ${activeRoutes} active · Avg. on-time: ${avgOnTime}%`;

    const kpiEl = document.getElementById('routes-kpi-grid');
    if (kpiEl) {
      kpiEl.innerHTML = `
        <div class="kpi-card" style="--kpi-color:#3b82f6;--kpi-bg:rgba(59,130,246,0.12)">
          <div class="kpi-label">Active Routes</div>
          <div class="kpi-value">${activeRoutes}</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#10b981;--kpi-bg:rgba(16,185,129,0.12)">
          <div class="kpi-label">Avg. On-Time</div>
          <div class="kpi-value">${avgOnTime}<span class="kpi-unit">%</span></div>
        </div>
        <div class="kpi-card" style="--kpi-color:#8b5cf6;--kpi-bg:rgba(139,92,246,0.12)">
          <div class="kpi-label">Weekly Volume</div>
          <div class="kpi-value">${formatNumber(totalWeeklyVolume)}</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#f59e0b;--kpi-bg:rgba(245,158,11,0.12)">
          <div class="kpi-label">High Risk Routes</div>
          <div class="kpi-value">${routes.filter(r => r.riskLevel === 'high').length}</div>
        </div>
      `;
    }

    const search = searchQuery.toLowerCase();
    const filtered = routes.filter(r => {
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      const matchSearch = !search || r.from.toLowerCase().includes(search) || r.to.toLowerCase().includes(search) || r.id.toLowerCase().includes(search);
      return matchStatus && matchSearch;
    });

    const listEl = document.getElementById('routeList');
    if (listEl) {
      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12H19M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="empty-title">No routes found</div><div class="empty-desc">Try adjusting your search.</div></div>`;
      } else {
        listEl.innerHTML = filtered.map((r, i) => {
          const utilPct = Math.round(r.activeJobs / r.capacity * 100);
          return `
            <div style="display:flex;gap:14px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--trans)" class="route-row" data-id="${r.id}">
              <div style="flex-shrink:0;width:72px">
                <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">${r.id}</div>
                ${statusChip(r.status)}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:14px;display:flex;align-items:center;gap:6px">
                  ${r.from.split(',')[0]}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="color:var(--text-3)"><path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  ${r.to.split(',')[0]}
                </div>
                <div style="font-size:11px;color:var(--text-3);margin-top:2px">${r.dist} mi · ${r.avgTime} avg · ${r.stops} stop${r.stops !== 1 ? 's' : ''}</div>
              </div>
              <div style="text-align:center;width:64px">
                <div style="font-size:18px;font-weight:800;font-variant-numeric:tabular-nums">${r.activeJobs}</div>
                <div style="font-size:10px;color:var(--text-3)">/ ${r.capacity} jobs</div>
              </div>
              <div style="text-align:center;width:60px">
                <div style="font-size:16px;font-weight:700;color:${r.onTimeRate >= 95 ? 'var(--success)' : r.onTimeRate >= 88 ? 'var(--warning)' : 'var(--danger)'}">${r.onTimeRate}%</div>
                <div style="font-size:10px;color:var(--text-3)">on-time</div>
              </div>
              <div style="width:100px">
                <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-3);margin-bottom:4px">
                  <span>Capacity</span><span>${utilPct}%</span>
                </div>
                <div class="progress">
                  <div class="progress-fill ${utilPct > 80 ? 'yellow' : 'blue'} progress-bar-fill" style="width:${utilPct}%"></div>
                </div>
              </div>
              <span class="badge ${r.riskLevel === 'low' ? 'badge-green' : r.riskLevel === 'medium' ? 'badge-yellow' : 'badge-red'}">${r.riskLevel}</span>
            </div>
          `;
        }).join('');

        listEl.querySelectorAll('.route-row').forEach(row => {
          row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-surface-2)');
          row.addEventListener('mouseleave', () => row.style.background = '');
          row.addEventListener('click', () => openRouteDetail(row.dataset.id));
        });
      }
    }

    const volEl = document.getElementById('topRoutesVolume');
    if (volEl) {
      volEl.innerHTML = routes.slice(0, 5).sort((a,b)=>b.weeklyVolume-a.weeklyVolume).map(r => `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:var(--text-2)">${r.from.split(',')[0]} → ${r.to.split(',')[0]}</span>
            <span style="font-weight:600;font-family:var(--font-mono)">${r.weeklyVolume}</span>
          </div>
          <div class="progress">
            <div class="progress-fill blue progress-bar-fill" style="width:${Math.round(r.weeklyVolume / (routes[0].weeklyVolume||1) * 100)}%"></div>
          </div>
        </div>
      `).join('');
    }

    const perfEl = document.getElementById('routePerfChart');
    if (perfEl) {
      perfEl.innerHTML = '';
      renderBarChart(perfEl, routes.slice(0, 8).map(r => ({
        label: r.from.split(',')[0].slice(0, 3).toUpperCase(),
        value: r.onTimeRate,
      })), {
        width: perfEl.offsetWidth || 280,
        height: 140,
        barColor: routes.slice(0, 8).map(r => r.onTimeRate >= 95 ? '#10b981' : r.onTimeRate >= 88 ? '#f59e0b' : '#ef4444'),
        labelKey: 'label',
        valueKey: 'value',
        showLabels: true,
      });
    }
  }

  function openRouteDetail(routeId) {
    const r = state.routes.find(r => r.id === routeId);
    if (!r) return;
    const routeJobs = state.jobs.filter(j => j.routeId === routeId);

    openModal({
      title: `${r.id}: ${r.from.split(',')[0]} → ${r.to.split(',')[0]}`,
      body: `
        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><div class="form-label">Distance</div><div style="font-weight:700;font-family:var(--font-mono)">${r.dist} mi</div></div>
            <div class="form-group"><div class="form-label">Avg. Time</div><div style="font-weight:700">${r.avgTime}</div></div>
            <div class="form-group"><div class="form-label">On-Time Rate</div><div style="font-weight:700;color:${r.onTimeRate >= 95 ? 'var(--success)' : r.onTimeRate >= 88 ? 'var(--warning)' : 'var(--danger)'}">${r.onTimeRate}%</div></div>
            <div class="form-group"><div class="form-label">Avg. Delay</div><div style="font-weight:700">${r.avgDelay}min</div></div>
            <div class="form-group"><div class="form-label">Active Jobs</div><div style="font-weight:700">${r.activeJobs} / ${r.capacity}</div></div>
            <div class="form-group"><div class="form-label">Stops</div><div style="font-weight:700">${r.stops}</div></div>
            <div class="form-group"><div class="form-label">Weekly Volume</div><div style="font-weight:700;font-family:var(--font-mono)">${r.weeklyVolume}</div></div>
            <div class="form-group"><div class="form-label">Risk Level</div><span class="badge ${r.riskLevel === 'low' ? 'badge-green' : r.riskLevel === 'medium' ? 'badge-yellow' : 'badge-red'}">${r.riskLevel}</span></div>
          </div>
          <div>
            <div class="form-label" style="margin-bottom:6px">Recent Jobs on this Route</div>
            <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
              ${routeJobs.length ? routeJobs.slice(0, 6).map(j => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-surface-2);border-radius:6px;border:1px solid var(--border)">
                  <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">${j.id}</span>
                  <span style="font-size:12px">${j.client}</span>
                  ${statusChip(j.status)}
                </div>
              `).join('') : '<div style="font-size:12px;color:var(--text-3)">No active jobs.</div>'}
            </div>
          </div>
        </div>
      `,
      confirmLabel: 'Close',
      onConfirm: () => true
    });
  }

  document.getElementById('routeSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateDOM();
  });

  document.getElementById('routeStatusFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#routeStatusFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterStatus = chip.dataset.status;
      updateDOM();
    });
  });

  document.getElementById('addRouteBtn')?.addEventListener('click', () => {
    const hubOptions = state.hubs.map(h => `<option value="${h.name}">${h.name} (${h.id})</option>`).join('');
    openModal({
      title: 'Add New Route',
      body: `
        <form id="new-route-form" style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group"><label class="form-label">From Hub</label><select id="r-from" class="form-select">${hubOptions}</select></div>
          <div class="form-group"><label class="form-label">To Hub</label><select id="r-to" class="form-select">${hubOptions}</select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">Max Capacity (jobs)</label><input id="r-capacity" class="form-input" type="number" required value="8" min="1" /></div>
            <div class="form-group"><label class="form-label">Stops</label><input id="r-stops" class="form-input" type="number" required value="2" min="0" /></div>
          </div>
          <div class="form-group"><label class="form-label">Preferred Vehicle Type</label><select id="r-vehicle" class="form-select"><option>Cargo Truck XL</option><option>Heavy Freighter</option><option>Box Truck</option></select></div>
          <input type="submit" style="display:none" />
        </form>
      `,
      confirmLabel: 'Create Route',
      onConfirm: (e, modalBody) => {
        const form = modalBody.querySelector('#new-route-form');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const from = form.querySelector('#r-from').value;
        const to = form.querySelector('#r-to').value;
        if (from === to) {
          showToast('error', 'Invalid Route', 'From and To hubs cannot be the same.');
          return false;
        }

        const newR = {
          id: `RT-${String(Math.floor(Math.random() * 900) + 100)}`,
          from,
          to,
          dist: Math.floor(Math.random() * 2000) + 100,
          avgTime: `${Math.floor(Math.random() * 40) + 2}h ${Math.floor(Math.random() * 60)}m`,
          status: 'active',
          onTimeRate: 100,
          activeJobs: 0,
          capacity: parseInt(form.querySelector('#r-capacity').value),
          weeklyVolume: 0,
          stops: parseInt(form.querySelector('#r-stops').value),
          riskLevel: 'low',
          avgDelay: 0
        };

        addRoute(newR);
        showToast('success', 'Route Created', `${newR.id} added to the network.`);
        return true;
      }
    });
  });

  document.getElementById('optimizeBtn')?.addEventListener('click', () => {
    optimizeRoutes();
    showToast('success', 'Optimization Complete', 'All routes have been re-optimized. Delays reduced.');
  });

  const onStateChange = () => requestAnimationFrame(updateDOM);
  window.addEventListener('statechange', onStateChange);

  updateDOM();
  setTimeout(() => window.dispatchEvent(new Event('resize')), 100);

  return {
    handleState: true,
    cleanup: () => window.removeEventListener('statechange', onStateChange)
  };
}
