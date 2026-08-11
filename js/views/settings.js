/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Settings View
   Notifications, alert thresholds, user profile, preferences
   ============================================================ */

import { showToast } from '../components.js';

export function renderSettings(container) {
  let activeSection = 'profile';

  container.innerHTML = `
    <div class="page stagger">
      <div class="page-header">
        <div>
          <h1 class="page-title">Settings</h1>
          <p class="page-subtitle">Account preferences, notifications, and system configuration</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary btn-sm" id="saveSettingsBtn">Save Changes</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:start">

        <!-- Settings Navigation -->
        <div class="card card-padded" style="position:sticky;top:20px">
          <div style="display:flex;flex-direction:column;gap:2px">
            ${[
              { id: 'profile',       label: 'Profile',           icon: 'user' },
              { id: 'notifications', label: 'Notifications',     icon: 'bell' },
              { id: 'alerts',        label: 'Alert Thresholds',  icon: 'alert' },
              { id: 'display',       label: 'Display',           icon: 'display' },
              { id: 'integrations',  label: 'Integrations',      icon: 'link' },
              { id: 'security',      label: 'Security',          icon: 'lock' },
            ].map(s => `
              <button class="settings-nav-item ${s.id === activeSection ? 'active' : ''}" data-section="${s.id}" style="
                display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;
                font-size:13px;font-weight:500;text-align:left;width:100%;
                transition:background var(--trans),color var(--trans);
                background:${s.id === activeSection ? 'var(--primary-dim)' : 'transparent'};
                color:${s.id === activeSection ? 'var(--primary-light)' : 'var(--text-2)'};
              ">
                ${getSettingsIcon(s.icon)}
                ${s.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Settings Content -->
        <div id="settingsContent"></div>
      </div>
    </div>
  `;

  function renderSection(section) {
    const el = document.getElementById('settingsContent');
    if (!el) return;

    const sections = {
      profile: renderProfileSection,
      notifications: renderNotificationsSection,
      alerts: renderAlertsSection,
      display: renderDisplaySection,
      integrations: renderIntegrationsSection,
      security: renderSecuritySection,
    };

    el.innerHTML = `<div class="animate-fade-in-up">${(sections[section] || sections.profile)()}</div>`;
  }

  function renderProfileSection() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">User Profile</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:20px">
          <!-- Avatar -->
          <div style="display:flex;align-items:center;gap:16px">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:white;flex-shrink:0">JR</div>
            <div>
              <button class="btn btn-secondary btn-sm">Change Photo</button>
              <div style="font-size:11px;color:var(--text-3);margin-top:6px">JPG, PNG or GIF · Max 2MB</div>
            </div>
          </div>
          <!-- Form Fields -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="form-group"><label class="form-label">First Name</label><input class="form-input" value="James" /></div>
            <div class="form-group"><label class="form-label">Last Name</label><input class="form-input" value="Rivera" /></div>
            <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" value="james.rivera@antigravity.net" /></div>
            <div class="form-group"><label class="form-label">Phone</label><input class="form-input" type="tel" value="+1 (404) 555-0192" /></div>
            <div class="form-group"><label class="form-label">Role</label><select class="form-select"><option selected>Operations Manager</option><option>Fleet Coordinator</option><option>Dispatch Supervisor</option><option>Administrator</option></select></div>
            <div class="form-group"><label class="form-label">Timezone</label><select class="form-select"><option selected>EST (UTC-5)</option><option>CST (UTC-6)</option><option>MST (UTC-7)</option><option>PST (UTC-8)</option></select></div>
          </div>
          <div class="form-group"><label class="form-label">Bio / Notes</label><textarea class="form-textarea" placeholder="Add a note about your role or responsibilities…">Oversees all anti-gravity cargo operations across the Eastern region, managing 6 hubs and a fleet of 24 vehicles.</textarea></div>
        </div>
      </div>
    `;
  }

  function renderNotificationsSection() {
    const categories = [
      { id: 'ops', label: 'Operations', items: [
        { id: 'job_created', label: 'New job created', email: true, push: true, sms: false },
        { id: 'job_delivered', label: 'Job delivered', email: true, push: true, sms: false },
        { id: 'job_exception', label: 'Job exception raised', email: true, push: true, sms: true },
        { id: 'job_delay', label: 'Delivery delay detected', email: false, push: true, sms: false },
      ]},
      { id: 'fleet', label: 'Fleet', items: [
        { id: 'fleet_maint', label: 'Maintenance due reminder', email: true, push: false, sms: false },
        { id: 'fleet_overload', label: 'Vehicle overload detected', email: true, push: true, sms: true },
        { id: 'fleet_offline', label: 'Vehicle goes offline', email: false, push: true, sms: false },
      ]},
      { id: 'hub', label: 'Hubs', items: [
        { id: 'hub_capacity', label: 'Hub approaching capacity (>85%)', email: true, push: true, sms: false },
        { id: 'hub_critical', label: 'Hub critical capacity (>95%)', email: true, push: true, sms: true },
      ]},
      { id: 'safety', label: 'Safety', items: [
        { id: 'safety_high', label: 'Critical safety event', email: true, push: true, sms: true },
        { id: 'safety_medium', label: 'Warning safety event', email: true, push: true, sms: false },
        { id: 'safety_breach', label: 'Geofence breach', email: false, push: true, sms: false },
      ]},
    ];

    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Notification Preferences</div><div class="card-subtitle">Control which events trigger notifications</div></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;gap:0;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
            <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em">Event</div>
            <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;text-align:center">Email</div>
            <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;text-align:center">Push</div>
            <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em;text-align:center">SMS</div>
          </div>
          ${categories.map(cat => `
            <div style="margin-bottom:16px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border)">${cat.label}</div>
              ${cat.items.map(item => `
                <div style="display:grid;grid-template-columns:1fr 80px 80px 80px;gap:0;padding:7px 0;align-items:center">
                  <span style="font-size:13px;color:var(--text-1)">${item.label}</span>
                  ${['email', 'push', 'sms'].map(type => `
                    <div style="display:flex;justify-content:center">
                      <label class="toggle-switch" style="position:relative;width:36px;height:20px;display:block;cursor:pointer">
                        <input type="checkbox" ${item[type] ? 'checked' : ''} style="opacity:0;width:0;height:0" onchange="window.showToast('success','Preference Saved','Notification setting updated.')" />
                        <span style="
                          position:absolute;inset:0;border-radius:10px;
                          background:var(--bg-surface-3);border:1px solid var(--border);
                          transition:all var(--trans);
                        " class="toggle-track"></span>
                      </label>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderAlertsSection() {
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Alert Thresholds</div><div class="card-subtitle">Configure when operational alerts are triggered</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:16px">
          ${[
            { label: 'Hub Capacity Warning', unit: '%', value: 85, min: 50, max: 98, desc: 'Alert when hub reaches this capacity percentage' },
            { label: 'Hub Capacity Critical', unit: '%', value: 95, min: 70, max: 100, desc: 'Emergency alert when hub reaches this level' },
            { label: 'Vehicle Fuel Warning', unit: '%', value: 25, min: 10, max: 50, desc: 'Alert when vehicle fuel drops below this level' },
            { label: 'Speed Limit Threshold', unit: ' mph', value: 75, min: 60, max: 90, desc: 'Safety event triggered when vehicle exceeds this speed' },
            { label: 'Delivery Delay Alert', unit: ' min', value: 30, min: 15, max: 120, desc: 'Alert when estimated delay exceeds this duration' },
            { label: 'Risk Score Alert', unit: '/10', value: 7, min: 5, max: 10, desc: 'Alert when vehicle risk score reaches this level' },
          ].map(t => `
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <label class="form-label">${t.label}</label>
                <span style="font-size:13px;font-weight:700;font-family:var(--font-mono);color:var(--primary-light)">${t.value}${t.unit}</span>
              </div>
              <input type="range" min="${t.min}" max="${t.max}" value="${t.value}" style="width:100%;accent-color:var(--primary);cursor:pointer" oninput="this.parentElement.querySelector('.form-label + span').style.display='none';this.previousElementSibling.querySelector('span').textContent=this.value+'${t.unit}'" />
              <div style="font-size:11px;color:var(--text-3);margin-top:3px">${t.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderDisplaySection() {
    return `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Appearance</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label">Theme</label>
              <div style="display:flex;gap:10px;margin-top:6px">
                <button class="btn btn-secondary ${document.documentElement.getAttribute('data-theme') === 'dark' ? 'btn-primary' : ''}" onclick="document.getElementById('themeToggle')?.click();this.classList.add('btn-primary');">
                  🌙 Dark Mode
                </button>
                <button class="btn btn-secondary" onclick="document.getElementById('themeToggle')?.click();">
                  ☀️ Light Mode
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Sidebar Default</label>
              <select class="form-select">
                <option>Expanded (Show Labels)</option>
                <option>Collapsed (Icons Only)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Dashboard Refresh Rate</label>
              <select class="form-select">
                <option>Every 30 seconds</option>
                <option selected>Every 1 minute</option>
                <option>Every 5 minutes</option>
                <option>Manual only</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Date Format</label>
              <select class="form-select">
                <option selected>MMM DD, YYYY (Dec 25, 2024)</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Map View Default</label>
              <select class="form-select">
                <option selected>All Active Vehicles</option>
                <option>In Transit Only</option>
                <option>Hubs Only</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Density & Accessibility</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group">
              <label class="form-label">Table Density</label>
              <select class="form-select"><option>Comfortable</option><option selected>Compact</option><option>Dense</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Font Size</label>
              <select class="form-select"><option>Small (13px)</option><option selected>Default (14px)</option><option>Large (16px)</option></select>
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <label class="form-label" style="margin:0">Reduce Motion</label>
                <input type="checkbox" style="accent-color:var(--primary);width:16px;height:16px;cursor:pointer" />
              </div>
            </div>
            <div class="form-group">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <label class="form-label" style="margin:0">High Contrast Mode</label>
                <input type="checkbox" style="accent-color:var(--primary);width:16px;height:16px;cursor:pointer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderIntegrationsSection() {
    const integrations = [
      { name: 'Salesforce CRM', status: 'connected', icon: '⬆', lastSync: '5min ago', desc: 'Client and invoice data sync' },
      { name: 'SAP ERP', status: 'connected', icon: '🔗', lastSync: '12min ago', desc: 'Financial & inventory integration' },
      { name: 'HERE Maps', status: 'connected', icon: '🗺', lastSync: 'Real-time', desc: 'Route optimization & traffic data' },
      { name: 'Stripe Payments', status: 'disconnected', icon: '💳', lastSync: '—', desc: 'Automated invoice payment processing' },
      { name: 'Slack', status: 'connected', icon: '💬', lastSync: '2min ago', desc: 'Alert notifications to Ops channel' },
      { name: 'AWS S3', status: 'connected', icon: '☁', lastSync: 'Real-time', desc: 'Document and report storage' },
    ];
    return `
      <div class="card">
        <div class="card-header"><div class="card-title">Integrations</div><div class="card-subtitle">Connected third-party services</div></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
          ${integrations.map(int => `
            <div style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-surface-2);border:1px solid var(--border);border-radius:10px">
              <div style="width:40px;height:40px;border-radius:8px;background:var(--bg-surface-3);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${int.icon}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:700">${int.name}</div>
                <div style="font-size:11px;color:var(--text-3);margin-top:1px">${int.desc}</div>
                ${int.status === 'connected' ? `<div style="font-size:10px;color:var(--text-3);margin-top:3px;font-family:var(--font-mono)">Last sync: ${int.lastSync}</div>` : ''}
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0">
                <span class="badge ${int.status === 'connected' ? 'badge-green' : 'badge-gray'}">${int.status}</span>
                <button class="btn btn-ghost btn-sm" onclick="window.showToast('info','Integration','${int.name} settings opened.')">
                  ${int.status === 'connected' ? 'Configure' : 'Connect'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSecuritySection() {
    return `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Password & Authentication</div>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div class="form-group"><label class="form-label">Current Password</label><input class="form-input" type="password" placeholder="••••••••" /></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div class="form-group"><label class="form-label">New Password</label><input class="form-input" type="password" placeholder="••••••••" /></div>
              <div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" type="password" placeholder="••••••••" /></div>
            </div>
            <button class="btn btn-primary btn-sm" style="align-self:flex-start" onclick="window.showToast('success','Password Updated','Your password has been changed.')">Update Password</button>
          </div>
        </div>

        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:16px">Two-Factor Authentication</div>
          <div class="alert alert-success" style="margin-bottom:14px">
            <div class="alert-icon">✓</div>
            <div class="alert-body"><div class="alert-title">2FA is enabled</div><div class="alert-msg">Your account is protected with authenticator app 2FA.</div></div>
          </div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-secondary btn-sm" onclick="window.showToast('info','2FA','Recovery codes downloaded.')">Download Recovery Codes</button>
            <button class="btn btn-danger btn-sm" onclick="window.showToast('warning','2FA Disabled','Two-factor authentication has been disabled.')">Disable 2FA</button>
          </div>
        </div>

        <div class="card card-padded">
          <div class="card-title" style="margin-bottom:14px">Active Sessions</div>
          ${[
            { device: 'Chrome on Windows 11', location: 'Atlanta, GA', time: 'Now (current)', current: true },
            { device: 'Safari on iPhone 15', location: 'Atlanta, GA', time: '3 hours ago', current: false },
            { device: 'Firefox on macOS', location: 'Chicago, IL', time: '2 days ago', current: false },
          ].map(s => `
            <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
              <div style="width:36px;height:36px;border-radius:8px;background:${s.current ? 'var(--primary-dim)' : 'var(--bg-surface-2)'};display:flex;align-items:center;justify-content:center;color:${s.current ? 'var(--primary)' : 'var(--text-3)'};flex-shrink:0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 13h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:600">${s.device}</div>
                <div style="font-size:10px;color:var(--text-3)">${s.location} · ${s.time}</div>
              </div>
              ${s.current ? '<span class="badge badge-green" style="font-size:10px">Current</span>' : `<button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="window.showToast('success','Session Revoked','Device has been signed out.')">Revoke</button>`}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function getSettingsIcon(icon) {
    const icons = {
      user: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      bell: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 0 1 4 4v2.5l1.5 3H2.5L4 7.5V5a4 4 0 0 1 4-4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      alert: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L1.5 13h13L8 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v3M8 11.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      display: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      link: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 8a4 4 0 0 1 4 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 6l-2 2 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6l2 2-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      lock: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 1 1 6 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    };
    return icons[icon] || '';
  }

  // Section navigation
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.settings-nav-item');
    if (!btn) return;
    container.querySelectorAll('.settings-nav-item').forEach(b => {
      b.style.background = 'transparent';
      b.style.color = 'var(--text-2)';
    });
    btn.style.background = 'var(--primary-dim)';
    btn.style.color = 'var(--primary-light)';
    activeSection = btn.dataset.section;
    renderSection(activeSection);
  });

  // Save button
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
    showToast('success', 'Settings Saved', 'Your preferences have been updated.');
  });

  renderSection(activeSection);
}
