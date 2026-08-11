/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Live Tracking View
   SVG map with real-time vehicle positions & timeline
   ============================================================ */

import { timeAgo, formatDate } from '../data.js';
import { state } from '../store.js';
import { showToast, statusChip } from '../components.js';

export function renderTracking(container) {
  const { vehicles, hubs, jobs, routes } = state;
  let selectedVehicle = null;
  let filterStatus = 'transit';
  let refreshInterval = null;

  const transitVehicles = vehicles.filter(v => v.status === 'transit');
  const allActive = vehicles.filter(v => v.status === 'transit' || v.status === 'active');

  container.innerHTML = `
    <div class="page" style="padding: 0; height: calc(100vh - var(--topbar-height)); display: flex; flex-direction: column;">

      <!-- Tracking Toolbar -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--bg-surface);flex-shrink:0;gap:12px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <div>
            <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em">Live Tracking</span>
            <div class="status-chip status-active" style="display:inline-flex;margin-left:10px;font-size:10px">Live · Updated just now</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="chip-select" id="trackFilter">
            <div class="chip ${filterStatus === 'transit' ? 'active' : ''}" data-filter="transit">In Transit (${transitVehicles.length})</div>
            <div class="chip ${filterStatus === 'all' ? 'active' : ''}" data-filter="all">All Active (${allActive.length})</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="refreshTrackBtn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7a6 6 0 1 1 1.5 3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M1 11.5V8M1 8h3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div style="flex:1;display:grid;grid-template-columns:1fr 360px;overflow:hidden;min-height:0">

        <!-- Map Area -->
        <div id="trackingMap" style="position:relative;background:var(--bg-surface-2);overflow:hidden"></div>

        <!-- Side Panel -->
        <div style="border-left:1px solid var(--border);background:var(--bg-surface);display:flex;flex-direction:column;overflow:hidden">

          <!-- Panel Header -->
          <div style="padding:14px 16px;border-bottom:1px solid var(--border);flex-shrink:0">
            <div style="font-size:13px;font-weight:700;color:var(--text-1)">Shipment Intelligence</div>
            <div style="font-size:11px;color:var(--text-3);margin-top:2px">${transitVehicles.length} vehicles being tracked</div>
          </div>

          <!-- Alerts Strip -->
          <div style="padding:10px 14px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;flex-direction:column;gap:6px" id="alertStrip">
            <div class="alert alert-danger" style="padding:8px 10px">
              <div class="alert-icon" style="font-size:12px">!</div>
              <div class="alert-body">
                <div class="alert-title" style="font-size:11px">VH-007 Delay: +45min</div>
                <div class="alert-msg" style="font-size:10px">Traffic on I-95 approaching Miami</div>
              </div>
            </div>
            <div class="alert alert-warning" style="padding:8px 10px">
              <div class="alert-icon" style="font-size:12px">!</div>
              <div class="alert-body">
                <div class="alert-title" style="font-size:11px">HUB-LAX approaching capacity</div>
                <div class="alert-msg" style="font-size:10px">3 inbound trucks may need to reroute</div>
              </div>
            </div>
          </div>

          <!-- Vehicle List -->
          <div style="flex:1;overflow-y:auto" id="vehicleSideList"></div>

          <!-- Selected Vehicle Detail -->
          <div id="vehicleDetail" style="border-top:1px solid var(--border);padding:14px 16px;flex-shrink:0;display:none">
            <div id="vehicleDetailContent"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  function getDisplayedVehicles() {
    if (filterStatus === 'transit') return vehicles.filter(v => v.status === 'transit');
    return vehicles.filter(v => v.status === 'transit' || v.status === 'active');
  }

  function renderVehicleList() {
    const el = document.getElementById('vehicleSideList');
    if (!el) return;
    const displayed = getDisplayedVehicles();

    el.innerHTML = displayed.map(v => {
      const vJob = jobs.find(j => j.vehicle === v.id);
      const isSelected = selectedVehicle?.id === v.id;
      return `
        <div class="vehicle-list-item" data-id="${v.id}" style="
          display:flex;gap:10px;align-items:center;padding:10px 14px;
          border-bottom:1px solid var(--border);cursor:pointer;
          transition:background var(--trans-fast);
          background:${isSelected ? 'var(--primary-dim)' : 'transparent'};
        ">
          <div style="
            width:34px;height:34px;border-radius:8px;flex-shrink:0;
            background:${v.status === 'transit' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'};
            display:flex;align-items:center;justify-content:center;
            color:${v.status === 'transit' ? 'var(--primary)' : 'var(--success)'};
            border:1px solid ${isSelected ? 'var(--primary)' : 'transparent'};
          ">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M11 8h2l2 2.5V13h-4V8Z" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="13.5" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="13.5" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:700;color:${isSelected ? 'var(--primary-light)' : 'var(--text-1)'}">${v.id} · ${v.name.split('#')[0].trim()}</div>
            <div style="font-size:10px;color:var(--text-3);margin-top:1px">
              ${vJob ? `${vJob.route.from.split(',')[0]} → ${vJob.route.to.split(',')[0]}` : 'No active job'}
            </div>
            <div style="display:flex;gap:6px;margin-top:4px;align-items:center">
              <span style="font-size:10px;font-family:var(--font-mono);color:var(--text-3)">${v.speed > 0 ? v.speed + ' mph' : 'Stationary'}</span>
              <span style="color:var(--text-3)">·</span>
              <span style="font-size:10px;color:var(--text-3)">Fuel ${v.fuel}%</span>
              ${v.load > 85 ? `<span class="badge badge-yellow" style="font-size:9px;padding:1px 5px">High Load</span>` : ''}
            </div>
          </div>
          ${vJob ? `
            <div style="text-align:right;flex-shrink:0">
              <div style="font-size:10px;color:var(--text-3)">ETA</div>
              <div style="font-size:11px;font-weight:600;font-family:var(--font-mono)">${formatDate(vJob.eta).split(',')[0]}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    el.querySelectorAll('.vehicle-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const v = vehicles.find(v => v.id === item.dataset.id);
        selectVehicle(v);
        renderVehicleList();
      });
    });
  }

  function selectVehicle(v) {
    selectedVehicle = v;
    const detailEl = document.getElementById('vehicleDetail');
    const contentEl = document.getElementById('vehicleDetailContent');
    if (!detailEl || !contentEl) return;

    const vJob = jobs.find(j => j.vehicle === v.id);
    detailEl.style.display = 'block';

    contentEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          <div style="font-weight:700;font-size:13px">${v.name}</div>
          <div style="font-size:10px;font-family:var(--font-mono);color:var(--text-3)">${v.id}</div>
        </div>
        ${statusChip(v.status)}
      </div>
      ${vJob ? `
        <div style="background:var(--bg-surface-2);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px;font-size:12px">
          <div style="color:var(--text-3);margin-bottom:4px;font-size:10px">Active Job</div>
          <div style="font-weight:700;color:var(--primary-light);font-family:var(--font-mono)">${vJob.id}</div>
          <div style="margin-top:4px;color:var(--text-2)">${vJob.route.from.split(',')[0]} → ${vJob.route.to.split(',')[0]}</div>
          <div style="margin-top:6px">
            <div class="progress">
              <div class="progress-fill blue progress-bar-fill" style="width:${vJob.progress}%"></div>
            </div>
            <div style="font-size:10px;color:var(--text-3);margin-top:3px;text-align:right">${vJob.progress}% complete</div>
          </div>
        </div>
      ` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
        <div><span style="color:var(--text-3)">Speed</span><div style="font-weight:700;margin-top:2px">${v.speed} mph</div></div>
        <div><span style="color:var(--text-3)">Fuel</span><div style="font-weight:700;margin-top:2px;color:${v.fuel < 25 ? 'var(--danger)' : 'inherit'}">${v.fuel}%</div></div>
        <div><span style="color:var(--text-3)">Load</span><div style="font-weight:700;margin-top:2px">${v.load}%</div></div>
        <div><span style="color:var(--text-3)">Driver</span><div style="font-weight:700;margin-top:2px">${v.driver.split(' ')[0]}</div></div>
      </div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="window.showToast('info','Contacting Driver','Initiating call to ${v.driver}.')">Contact Driver</button>
        <button class="btn btn-secondary btn-sm" onclick="window.showToast('success','Alert Sent','ETA update sent to client.')">Alert Client</button>
      </div>
    `;

    // Center map on selected vehicle
    renderTrackingMap();
  }

  function renderTrackingMap() {
    const mapEl = document.getElementById('trackingMap');
    if (!mapEl) return;
    const w = mapEl.offsetWidth || 800;
    const h = mapEl.offsetHeight || 500;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;inset:0;cursor:default';

    // Background gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const bgGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
    bgGrad.setAttribute('id', 'mapBg'); bgGrad.setAttribute('cx', '50%'); bgGrad.setAttribute('cy', '50%'); bgGrad.setAttribute('r', '70%');
    const bs1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    bs1.setAttribute('offset', '0%'); bs1.setAttribute('stop-color', '#0f1e35');
    const bs2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    bs2.setAttribute('offset', '100%'); bs2.setAttribute('stop-color', '#080c14');
    bgGrad.appendChild(bs1); bgGrad.appendChild(bs2);
    defs.appendChild(bgGrad);
    svg.appendChild(defs);

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', w); bgRect.setAttribute('height', h); bgRect.setAttribute('fill', 'url(#mapBg)');
    svg.appendChild(bgRect);

    // Grid overlay
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * w;
      const vl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vl.setAttribute('x1', x); vl.setAttribute('x2', x); vl.setAttribute('y1', 0); vl.setAttribute('y2', h);
      vl.setAttribute('stroke', 'rgba(59,130,246,0.04)'); vl.setAttribute('stroke-width', 1);
      svg.appendChild(vl);
    }
    for (let i = 0; i <= 6; i++) {
      const y = (i / 6) * h;
      const hl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hl.setAttribute('x1', 0); hl.setAttribute('x2', w); hl.setAttribute('y1', y); hl.setAttribute('y2', y);
      hl.setAttribute('stroke', 'rgba(59,130,246,0.04)'); hl.setAttribute('stroke-width', 1);
      svg.appendChild(hl);
    }

    const latMin = 25, latMax = 49, lngMin = -124, lngMax = -66;
    const toSvg = (lat, lng) => ({
      x: ((lng - lngMin) / (lngMax - lngMin)) * (w - 60) + 30,
      y: ((latMax - lat) / (latMax - latMin)) * (h - 60) + 30,
    });

    // Hub areas (soft glow circles)
    hubs.forEach(hub => {
      const pt = toSvg(hub.lat, hub.lng);
      const pct = hub.current / hub.capacity;
      const c = pct >= 0.9 ? '#ef4444' : pct >= 0.75 ? '#f59e0b' : '#10b981';

      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('cx', pt.x); glow.setAttribute('cy', pt.y); glow.setAttribute('r', 40);
      glow.setAttribute('fill', c + '08'); glow.setAttribute('stroke', c + '20'); glow.setAttribute('stroke-width', 1);
      svg.appendChild(glow);
    });

    // Route lines
    const routePairs = [
      ['HUB-ATL', 'HUB-MIA'], ['HUB-LAX', 'HUB-SEA'], ['HUB-ORD', 'HUB-DFW'],
      ['HUB-ATL', 'HUB-ORD'], ['HUB-DFW', 'HUB-LAX'], ['HUB-MIA', 'HUB-ORD'],
      ['HUB-SEA', 'HUB-DFW'], ['HUB-ATL', 'HUB-DFW'],
    ];
    const hubMap = Object.fromEntries(hubs.map(h => [h.id, h]));

    routePairs.forEach(([aId, bId]) => {
      const a = hubMap[aId], b = hubMap[bId];
      if (!a || !b) return;
      const pa = toSvg(a.lat, a.lng);
      const pb = toSvg(b.lat, b.lng);
      const mid = { x: (pa.x + pb.x) / 2, y: Math.min(pa.y, pb.y) - 30 };

      // Curved route line
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${pa.x},${pa.y} Q${mid.x},${mid.y} ${pb.x},${pb.y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(59,130,246,0.18)');
      path.setAttribute('stroke-width', 1.5);
      path.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(path);
    });

    // Vehicles
    const displayed = getDisplayedVehicles();
    displayed.forEach((v, i) => {
      const pt = toSvg(v.lat, v.lng);
      const isSelected = selectedVehicle?.id === v.id;
      const vJob = jobs.find(j => j.vehicle === v.id);
      const color = isSelected ? '#60a5fa' : '#3b82f6';

      // Destination line (if selected)
      if (isSelected && vJob) {
        const destHub = hubMap[vJob.route.toHub];
        if (destHub) {
          const dest = toSvg(destHub.lat, destHub.lng);
          const destLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          destLine.setAttribute('x1', pt.x); destLine.setAttribute('y1', pt.y);
          destLine.setAttribute('x2', dest.x); destLine.setAttribute('y2', dest.y);
          destLine.setAttribute('stroke', '#60a5fa'); destLine.setAttribute('stroke-width', 2);
          destLine.setAttribute('stroke-dasharray', '6 3'); destLine.setAttribute('opacity', '0.6');
          svg.appendChild(destLine);
        }
      }

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.cursor = 'pointer';

      // Ping ring
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', pt.x); ring.setAttribute('cy', pt.y); ring.setAttribute('r', isSelected ? 14 : 8);
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', color); ring.setAttribute('stroke-width', isSelected ? 2 : 1.5);
      ring.setAttribute('opacity', '0.4');
      ring.style.transformOrigin = `${pt.x}px ${pt.y}px`;
      ring.style.animation = `radar-ping ${2 + (i % 3) * 0.4}s ease-out ${(i * 0.2) % 1.5}s infinite`;
      g.appendChild(ring);

      // Main dot
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', isSelected ? 7 : 5);
      dot.setAttribute('fill', color); dot.setAttribute('stroke', isSelected ? '#fff' : 'rgba(255,255,255,0.3)'); dot.setAttribute('stroke-width', isSelected ? 2 : 1);
      g.appendChild(dot);

      // Label (if selected)
      if (isSelected) {
        const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        labelBg.setAttribute('x', pt.x - 28); labelBg.setAttribute('y', pt.y - 28);
        labelBg.setAttribute('width', 56); labelBg.setAttribute('height', 16);
        labelBg.setAttribute('rx', 4); labelBg.setAttribute('fill', '#1c2840');
        labelBg.setAttribute('stroke', '#3b82f6'); labelBg.setAttribute('stroke-width', 1);
        g.appendChild(labelBg);

        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pt.x); label.setAttribute('y', pt.y - 17);
        label.setAttribute('text-anchor', 'middle'); label.setAttribute('font-size', '9');
        label.setAttribute('fill', '#60a5fa'); label.setAttribute('font-weight', '700');
        label.setAttribute('font-family', 'Inter, sans-serif');
        label.textContent = v.id;
        g.appendChild(label);
      }

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        selectVehicle(v);
        renderVehicleList();
      });

      svg.appendChild(g);
    });

    // Hub markers
    hubs.forEach(hub => {
      const pt = toSvg(hub.lat, hub.lng);
      const pct = hub.current / hub.capacity;
      const c = pct >= 0.9 ? '#ef4444' : pct >= 0.75 ? '#f59e0b' : '#10b981';

      const hexPts = [0, 60, 120, 180, 240, 300].map(angle => {
        const rad = (angle - 90) * Math.PI / 180;
        return `${pt.x + 10 * Math.cos(rad)},${pt.y + 10 * Math.sin(rad)}`;
      }).join(' ');

      const hex = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      hex.setAttribute('points', hexPts);
      hex.setAttribute('fill', c + '20'); hex.setAttribute('stroke', c); hex.setAttribute('stroke-width', 1.5);
      svg.appendChild(hex);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pt.x); text.setAttribute('y', pt.y + 24);
      text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '9');
      text.setAttribute('fill', c); text.setAttribute('font-weight', '700');
      text.setAttribute('font-family', 'Inter, sans-serif');
      text.textContent = hub.city.split(',')[0];
      svg.appendChild(text);
    });

    // Legend
    const legendItems = [
      { color: '#3b82f6', label: 'Vehicle in Transit' },
      { color: '#10b981', label: 'Hub OK' },
      { color: '#f59e0b', label: 'Hub Busy' },
      { color: '#ef4444', label: 'Hub Critical' },
    ];
    legendItems.forEach((item, i) => {
      const x = 16 + i * 140;
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', x); dot.setAttribute('cy', h - 20); dot.setAttribute('r', 4);
      dot.setAttribute('fill', item.color);
      svg.appendChild(dot);
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', x + 10); t.setAttribute('y', h - 16);
      t.setAttribute('font-size', '10'); t.setAttribute('fill', 'rgba(255,255,255,0.4)');
      t.setAttribute('font-family', 'Inter, sans-serif');
      t.textContent = item.label;
      svg.appendChild(t);
    });

    mapEl.innerHTML = '';
    mapEl.appendChild(svg);
  }

  // Filter chips
  document.getElementById('trackFilter')?.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#trackFilter .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterStatus = chip.dataset.filter;
      renderVehicleList();
      renderTrackingMap();
    });
  });

  // Refresh
  document.getElementById('refreshTrackBtn')?.addEventListener('click', () => {
    showToast('success', 'Tracking Refreshed', 'Vehicle positions updated.');
    renderTrackingMap();
    renderVehicleList();
  });

  // Auto-refresh every 30 seconds
  refreshInterval = setInterval(() => {
    renderTrackingMap();
  }, 30000);

  requestAnimationFrame(() => {
    renderTrackingMap();
    renderVehicleList();
  });

  return { cleanup: () => clearInterval(refreshInterval) };
}
