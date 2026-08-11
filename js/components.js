/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — Shared UI Components
   Toast, Modal, Notifications, Search, Skeleton
   ============================================================ */

import { notifications as notifData, timeAgo, formatDate, formatTime, formatCurrency, formatNumber } from './data.js';

// ---- Toast System ----
const toastContainer = document.getElementById('toastContainer');

export function showToast(type, title, msg, duration = 4000) {
  const icons = { success: '✓', warning: '!', error: '✕', info: 'i' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'i'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close notification">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>
  `;
  // Make showToast available globally for inline onclick handlers
  window.showToast = showToast;
  toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  };
  closeBtn.addEventListener('click', dismiss);
  if (duration > 0) setTimeout(dismiss, duration);
}

// ---- Notifications Drawer ----
const drawer = document.getElementById('notificationDrawer');
const backdrop = document.getElementById('drawerBackdrop');
const closeBtn = document.getElementById('closeNotifications');
const alertsBtn = document.getElementById('alertsBtn');
const notifList = document.getElementById('notificationList');

let notifications = [...notifData];

function renderNotifications() {
  notifList.innerHTML = notifications.map(n => `
    <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
      <div class="notification-dot ${n.read ? 'read' : 'unread'}"></div>
      <div class="notification-body">
        <div class="notification-label">${n.title}</div>
        <div class="notification-time">${timeAgo(n.time)} — ${n.body}</div>
      </div>
    </div>
  `).join('');
  // Update badge
  const unread = notifications.filter(n => !n.read).length;
  const badge = alertsBtn.querySelector('.topbar-badge');
  badge.textContent = unread;
  badge.style.display = unread ? 'flex' : 'none';
}

function openDrawer() {
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  backdrop.classList.add('visible');
  document.body.style.overflow = 'hidden';
  renderNotifications();
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  backdrop.classList.remove('visible');
  document.body.style.overflow = '';
}

alertsBtn.addEventListener('click', openDrawer);
closeBtn.addEventListener('click', closeDrawer);
backdrop.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

notifList.addEventListener('click', (e) => {
  const item = e.target.closest('.notification-item');
  if (!item) return;
  const id = item.dataset.id;
  const notif = notifications.find(n => n.id === id);
  if (notif) { notif.read = true; renderNotifications(); }
});

// ---- Modal System ----
export function openModal({ title, body, footerHTML = '', onConfirm, confirmLabel = 'Confirm', confirmClass = 'btn-primary' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">${title}</h2>
        <button class="drawer-close modal-close-btn" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="modal-body">${body}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : `
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">Cancel</button>
          <button class="btn ${confirmClass} modal-confirm">${confirmLabel}</button>
        </div>
      `}
    </div>
  `;

  const close = () => { overlay.remove(); document.body.style.overflow = ''; };
  overlay.querySelector('.modal-close-btn').addEventListener('click', close);
  overlay.querySelector('.modal-cancel')?.addEventListener('click', close);
  overlay.querySelector('.modal-confirm')?.addEventListener('click', (e) => { 
    if (onConfirm) {
      if (onConfirm(e, overlay) !== false) close();
    } else {
      close();
    }
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

// ---- Skeleton Loader ----
export function renderSkeleton(container, template) {
  container.innerHTML = template;
}

export const skeletonKPI = `
  <div class="kpi-grid">
    ${Array.from({ length: 4 }, () => `
      <div class="kpi-card">
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton" style="height:36px;width:80px;margin:8px 0"></div>
        <div class="skeleton skeleton-text"></div>
      </div>
    `).join('')}
  </div>
`;

export const skeletonTable = `
  <div class="card" style="overflow:hidden">
    <div class="card-header"><div class="skeleton skeleton-text short"></div></div>
    <div style="padding: 16px">
      ${Array.from({ length: 6 }, () => `
        <div style="display:flex;gap:16px;margin-bottom:12px">
          <div class="skeleton skeleton-text" style="width:15%"></div>
          <div class="skeleton skeleton-text" style="width:25%"></div>
          <div class="skeleton skeleton-text" style="width:20%"></div>
          <div class="skeleton skeleton-text" style="width:15%"></div>
          <div class="skeleton skeleton-text" style="width:10%"></div>
        </div>
      `).join('')}
    </div>
  </div>
`;

// ---- Global Search ----
const searchInput = document.getElementById('globalSearch');
let searchOverlay = null;

searchInput.addEventListener('focus', () => showSearchOverlay());
searchInput.addEventListener('input', (e) => updateSearch(e.target.value));

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
    showSearchOverlay();
  }
});

function showSearchOverlay() {
  if (searchOverlay) return;
  searchOverlay = document.createElement('div');
  searchOverlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:${getComputedStyle(document.documentElement).getPropertyValue('--z-overlay')};
    backdrop-filter:blur(2px);
  `;
  searchOverlay.addEventListener('click', hideSearchOverlay);
  document.body.appendChild(searchOverlay);
}

function hideSearchOverlay() {
  searchOverlay?.remove();
  searchOverlay = null;
  searchInput.blur();
  searchInput.value = '';
}

function updateSearch(query) {
  if (!query) return;
  // Searching would route to relevant views; simplified for now
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && searchOverlay) hideSearchOverlay();
});

// ---- Status Chip Helper ----
export function statusChip(status) {
  const map = {
    active:      { cls: 'status-active',      label: 'Active' },
    idle:        { cls: 'status-idle',         label: 'Idle' },
    maintenance: { cls: 'status-maintenance',  label: 'Maintenance' },
    offline:     { cls: 'status-offline',      label: 'Offline' },
    transit:     { cls: 'status-transit',      label: 'In Transit' },
    delivered:   { cls: 'status-delivered',    label: 'Delivered' },
    pending:     { cls: 'status-pending',      label: 'Pending' },
    exception:   { cls: 'status-exception',    label: 'Exception' },
    assigned:    { cls: 'status-assigned',     label: 'Assigned' },
  };
  const s = map[status] || { cls: 'status-idle', label: status };
  return `<span class="status-chip ${s.cls}">${s.label}</span>`;
}

// ---- Badge Helper ----
export function priorityBadge(priority) {
  const map = {
    critical: 'badge-red',
    express:  'badge-yellow',
    standard: 'badge-gray',
  };
  return `<span class="badge ${map[priority] || 'badge-gray'}">${priority}</span>`;
}

// ---- Risk Bar Helper ----
export function riskBar(score, max = 10) {
  const filled = Math.round((score / max) * 5);
  const level = score <= 3 ? 'low' : score <= 7 ? 'medium' : 'high';
  return `
    <div class="risk-bar" title="Risk score: ${score}/${max}">
      ${Array.from({ length: 5 }, (_, i) => `
        <div class="risk-segment ${i < filled ? `filled ${level}` : ''}"></div>
      `).join('')}
    </div>
  `;
}

// ---- Format Utilities re-exported ----
export { timeAgo, formatDate, formatTime, formatCurrency, formatNumber };
