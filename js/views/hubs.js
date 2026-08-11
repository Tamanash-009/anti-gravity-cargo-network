/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Hubs View
   Cargo hub management, capacity, inventory
   ============================================================ */

import { formatNumber, timeAgo } from '../data.js';
import { state } from '../store.js';
import { renderDonut, renderGauge } from '../charts.js';
import { showToast, statusChip } from '../components.js';

export function renderHubs(container) {
  const { hubs, jobs, vehicles } = state;
  const totalCapacity = hubs.reduce((s, h) => s + h.capacity, 0);
  const totalUsed = hubs.reduce((s, h) => s + h.current, 0);
  const overallUtil = Math.round(totalUsed / totalCapacity * 100);
  const criticalHubs = hubs.filter(h => h.current / h.capacity >= 0.9).length;

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cargo Hubs</h1>
          <p class="page-subtitle">${hubs.length} hubs · ${overallUtil}% network capacity used · ${criticalHubs} critical</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" id="addHubBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Add Hub
          </button>
        </div>
      </div>

      <!-- Network Overview KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="kpi-card" style="--kpi-color:#3b82f6;--kpi-bg:rgba(59,130,246,0.12)">
          <div class="kpi-label">Network Capacity</div>
          <div class="kpi-value">${overallUtil}<span class="kpi-unit">%</span></div>
          <div style="font-size:11px;color:var(--text-3)">Used of ${formatNumber(totalCapacity)} total units</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#10b981;--kpi-bg:rgba(16,185,129,0.12)">
          <div class="kpi-label">Active Hubs</div>
          <div class="kpi-value">${hubs.filter(h => h.status === 'active').length}</div>
          <div style="font-size:11px;color:var(--text-3)">${hubs.filter(h => h.status === 'maintenance').length} in maintenance</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#ef4444;--kpi-bg:rgba(239,68,68,0.12)">
          <div class="kpi-label">Critical Capacity</div>
          <div class="kpi-value">${criticalHubs}</div>
          <div style="font-size:11px;color:var(--text-3)">Hubs above 90% capacity</div>
        </div>
        <div class="kpi-card" style="--kpi-color:#f59e0b;--kpi-bg:rgba(245,158,11,0.12)">
          <div class="kpi-label">Total Inbound</div>
          <div class="kpi-value">${hubs.reduce((s, h) => s + h.inbound, 0)}</div>
          <div style="font-size:11px;color:var(--text-3)">Shipments en route</div>
        </div>
      </div>

      <!-- Hub Cards Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px" class="stagger" id="hubGrid"></div>

      <!-- Hub Network Summary -->
      <div class="dashboard-grid" style="margin-top:16px">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Hub Throughput</div>
            <div class="card-subtitle">Inbound vs. Outbound shipments</div>
          </div>
          <div class="card-body">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Hub</th>
                    <th>Location</th>
                    <th>Manager</th>
                    <th>Capacity</th>
                    <th>Inbound</th>
                    <th>Outbound</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${hubs.map(h => {
                    const pct = Math.round(h.current / h.capacity * 100);
                    return `
                      <tr style="cursor:pointer" class="hub-row" data-id="${h.id}">
                        <td>
                          <div style="font-weight:700;font-size:13px">${h.name}</div>
                          <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${h.id}</div>
                        </td>
                        <td style="font-size:12px;color:var(--text-2)">${h.city}</td>
                        <td style="font-size:12px">${h.manager}</td>
                        <td>
                          <div style="display:flex;align-items:center;gap:6px">
                            <div class="progress" style="width:60px">
                              <div class="progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'} progress-bar-fill" style="width:${pct}%"></div>
                            </div>
                            <span style="font-size:11px;font-family:var(--font-mono)">${pct}%</span>
                          </div>
                        </td>
                        <td><span class="badge badge-blue">${h.inbound} ↓</span></td>
                        <td><span class="badge badge-green">${h.outbound} ↑</span></td>
                        <td>${statusChip(h.status)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Network Capacity Donut -->
        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Capacity Distribution</div>
          <div style="display:flex;justify-content:center;margin-bottom:20px" id="networkDonut"></div>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${hubs.map(h => {
              const pct = Math.round(h.current / h.capacity * 100);
              const hubColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
                    <span style="color:var(--text-2)">${h.name.split(' ')[0]}</span>
                    <span style="font-weight:700;font-family:var(--font-mono);color:${pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--success)'}">${pct}%</span>
                  </div>
                  <div class="progress">
                    <div class="progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'} progress-bar-fill" style="width:${pct}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // Render hub cards
  const grid = document.getElementById('hubGrid');
  hubs.forEach((h, i) => {
    const pct = Math.round(h.current / h.capacity * 100);
    const hubColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
    const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
    const hubJobs = jobs.filter(j => j.route.fromHub === h.id || j.route.toHub === h.id);
    const activeJobs = hubJobs.filter(j => j.status === 'transit' || j.status === 'assigned').length;
    const hubVehicles = vehicles.filter(v => v.currentHub === h.id);

    const card = document.createElement('div');
    card.className = 'hub-card hover-lift';
    card.dataset.id = h.id;
    card.innerHTML = `
      <div class="hub-header">
        <div class="hub-icon" style="background:${hubColors[i % hubColors.length]}20;color:${hubColors[i % hubColors.length]}">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 1.5L20.5 6.5V15.5L11 20.5L1.5 15.5V6.5L11 1.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M11 7L17 10V16L11 19L5 16V10L11 7Z" stroke="currentColor" stroke-width="1.5" opacity="0.5"/></svg>
        </div>
        <div style="flex:1;min-width:0">
          <div class="hub-name">${h.name}</div>
          <div class="hub-location">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="display:inline;color:var(--text-3)"><path d="M5 1a3 3 0 0 1 3 3c0 2.5-3 6-3 6S2 6.5 2 4a3 3 0 0 1 3-3Z" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="4" r="1" fill="currentColor"/></svg>
            ${h.city}
          </div>
        </div>
        ${statusChip(h.status)}
      </div>

      <div>
        <div class="hub-capacity-label">
          <span>Capacity</span>
          <span style="font-weight:700;color:${color}">${pct}%</span>
        </div>
        <div class="progress progress-thick">
          <div class="progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'} progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <div style="font-size:10px;color:var(--text-3);margin-top:4px;font-family:var(--font-mono)">${formatNumber(h.current)} / ${formatNumber(h.capacity)} units</div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--bg-surface-2);border-radius:8px;padding:10px;border:1px solid var(--border)">
        <div style="text-align:center">
          <div style="font-size:18px;font-weight:800;color:var(--primary-light)">${h.inbound}</div>
          <div style="font-size:10px;color:var(--text-3)">Inbound</div>
        </div>
        <div style="text-align:center;border-left:1px solid var(--border);border-right:1px solid var(--border)">
          <div style="font-size:18px;font-weight:800;color:var(--success)">${h.outbound}</div>
          <div style="font-size:10px;color:var(--text-3)">Outbound</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:18px;font-weight:800">${hubVehicles.length}</div>
          <div style="font-size:10px;color:var(--text-3)">Vehicles</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
        <span style="color:var(--text-3)">Manager: ${h.manager}</span>
        <span style="color:var(--text-3)">Synced ${timeAgo(h.lastSync)}</span>
      </div>

      ${pct >= 90 ? `<div class="alert alert-danger" style="padding:8px 10px"><div class="alert-icon" style="font-size:12px">!</div><div class="alert-body"><div class="alert-title" style="font-size:12px">Critical capacity — reroute needed</div></div></div>` : ''}
    `;

    card.addEventListener('click', () => openHubDetail(h.id));
    grid.appendChild(card);
  });

  // Render gauges
  requestAnimationFrame(() => {
    const donutEl = document.getElementById('networkDonut');
    if (donutEl) {
      const hubColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
      renderDonut(donutEl, hubs.map((h, i) => ({
        value: h.current,
        color: hubColors[i % hubColors.length],
      })), {
        size: 140,
        strokeWidth: 20,
        centerLabel: `${overallUtil}%`,
        centerSub: 'Network',
      });
    }
  });

  function openHubDetail(hubId) {
    const h = hubs.find(h => h.id === hubId);
    if (!h) return;
    const pct = Math.round(h.current / h.capacity * 100);
    const hubJobs = jobs.filter(j => j.route.fromHub === h.id || j.route.toHub === h.id);

    import('../components.js').then(({ openModal }) => {
      openModal({
        title: h.name,
        body: `
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">${h.id} · ${h.type}</div>
                <div style="font-size:13px;color:var(--text-2);margin-top:2px">${h.city}</div>
              </div>
              ${statusChip(h.status)}
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px">
                <span>Capacity Utilization</span>
                <span style="font-weight:700;color:${pct >= 90 ? 'var(--danger)' : pct >= 75 ? 'var(--warning)' : 'var(--success)'}">${pct}%</span>
              </div>
              <div class="progress progress-thick">
                <div class="progress-fill ${pct >= 90 ? 'red' : pct >= 75 ? 'yellow' : 'green'} progress-bar-fill" style="width:${pct}%"></div>
              </div>
              <div style="font-size:11px;color:var(--text-3);margin-top:4px;font-family:var(--font-mono)">${formatNumber(h.current)} / ${formatNumber(h.capacity)} units</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><div class="form-label">Manager</div><div style="font-weight:600">${h.manager}</div></div>
              <div class="form-group"><div class="form-label">Hub Type</div><div style="font-weight:600">${h.type}</div></div>
              <div class="form-group"><div class="form-label">Inbound Shipments</div><div style="font-weight:600;color:var(--primary)">${h.inbound}</div></div>
              <div class="form-group"><div class="form-label">Outbound Shipments</div><div style="font-weight:600;color:var(--success)">${h.outbound}</div></div>
            </div>
            <div>
              <div class="form-label" style="margin-bottom:8px">Active Jobs at this Hub</div>
              <div style="display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto">
                ${hubJobs.slice(0, 8).map(j => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:var(--bg-surface-2);border-radius:6px;border:1px solid var(--border)">
                    <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">${j.id}</span>
                    <span style="font-size:12px">${j.cargo}</span>
                    ${statusChip(j.status)}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `,
        footerHTML: `
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">Close</button>
            ${pct >= 90 ? `<button class="btn btn-warning" onclick="window.showToast('info','Rerouting','Overflow jobs being rerouted to nearest hub.')">Reroute Overflow</button>` : ''}
            <button class="btn btn-primary" onclick="window.showToast('success','Report Generated','Hub status report is ready.')">Generate Report</button>
          </div>
        `,
      });
    });
  }

  // Table row clicks
  container.querySelectorAll('.hub-row').forEach(row => {
    row.addEventListener('click', () => openHubDetail(row.dataset.id));
  });

  // Add hub
  document.getElementById('addHubBtn')?.addEventListener('click', () => {
    showToast('info', 'Add Hub', 'Hub creation wizard coming soon.');
  });
}
