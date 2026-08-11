/* ============================================================
   ANTI-GRAVITY CARGO NETWORK — App Router & Shell
   ============================================================ */

import { renderDashboard } from './views/dashboard.js';
import { loadState } from './store.js';
import { renderFleet }     from './views/fleet.js';
import { renderRoutes }    from './views/routes.js';
import { renderJobs }      from './views/jobs.js';
import { renderHubs }      from './views/hubs.js';
import { renderTracking }  from './views/tracking.js';
import { renderAnalytics } from './views/analytics.js';
import { renderBilling }   from './views/billing.js';
import { renderSafety }    from './views/safety.js';
import { renderSettings }  from './views/settings.js';

const views = {
  dashboard: { render: renderDashboard, title: 'Dashboard',    label: 'Dashboard' },
  fleet:     { render: renderFleet,     title: 'Fleet',        label: 'Fleet Management' },
  routes:    { render: renderRoutes,    title: 'Routes',       label: 'Route Management' },
  jobs:      { render: renderJobs,      title: 'Jobs',         label: 'Job Board' },
  hubs:      { render: renderHubs,      title: 'Cargo Hubs',   label: 'Cargo Hubs' },
  tracking:  { render: renderTracking,  title: 'Live Tracking',label: 'Live Tracking' },
  analytics: { render: renderAnalytics, title: 'Analytics',    label: 'Analytics' },
  billing:   { render: renderBilling,   title: 'Billing',      label: 'Billing' },
  safety:    { render: renderSafety,    title: 'Safety',       label: 'Safety & Compliance' },
  settings:  { render: renderSettings,  title: 'Settings',     label: 'Settings' },
};

const container   = document.getElementById('viewContainer');
const breadcrumb  = document.getElementById('breadcrumbPage');
const loadScreen  = document.getElementById('loadingScreen');
const sidebar     = document.getElementById('sidebar');
const appShell    = document.getElementById('app');
const sidebarToggle = document.getElementById('sidebarToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const themeToggle = document.getElementById('themeToggle');

let currentView = null;
let cleanupFn   = null;

// ---- Router ----
function navigate(hash) {
  const view = hash.replace('#', '') || 'dashboard';
  const def = views[view] || views.dashboard;

  // Update nav state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.view === (view || 'dashboard'));
  });

  // Breadcrumb
  breadcrumb.textContent = def.label;
  document.title = `${def.title} — Anti-Gravity Cargo Network`;

  // Cleanup previous
  if (cleanupFn) { try { cleanupFn(); } catch(e) {} cleanupFn = null; }

  // Render new view
  container.innerHTML = '';
  const page = document.createElement('div');
  page.className = 'view-enter';
  container.appendChild(page);

  currentView = view;
  const result = def.render(page);
  currentViewResult = result;
  if (result && typeof result.cleanup === 'function') cleanupFn = result.cleanup;

  // Close mobile nav
  appShell.classList.remove('mobile-nav-open');

  // Scroll to top
  container.scrollTop = 0;
  container.focus({ preventScroll: true });
}

// ---- Hash Router ----
function handleRoute() {
  const hash = window.location.hash || '#dashboard';
  navigate(hash);
}

window.addEventListener('hashchange', handleRoute);

let currentViewResult = null;
window.addEventListener('statechange', () => {
  if (currentViewResult && currentViewResult.handleState) {
    // View handles its own state updates (e.g. billing.js)
    return;
  }
  // Otherwise full re-render
  handleRoute();
});

// ---- Sidebar collapse ----
let collapsed = false;
sidebarToggle.addEventListener('click', () => {
  collapsed = !collapsed;
  appShell.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  localStorage.setItem('sidebarCollapsed', collapsed);
});

// Restore state
if (localStorage.getItem('sidebarCollapsed') === 'true') {
  collapsed = true;
  appShell.classList.add('sidebar-collapsed');
  sidebarToggle.setAttribute('aria-expanded', 'false');
}

// Mobile nav toggle
mobileMenuBtn.addEventListener('click', () => {
  appShell.classList.toggle('mobile-nav-open');
});

// ---- Theme Toggle ----
const moonIcon = themeToggle.querySelector('.icon-moon');
const sunIcon  = themeToggle.querySelector('.icon-sun');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  if (theme === 'light') {
    moonIcon.style.display = 'none';
    sunIcon.style.display  = 'block';
  } else {
    moonIcon.style.display = 'block';
    sunIcon.style.display  = 'none';
  }
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ---- Keyboard Shortcuts ----
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const shortcuts = {
    '1': '#dashboard',
    '2': '#fleet',
    '3': '#routes',
    '4': '#jobs',
    '5': '#hubs',
    '6': '#tracking',
    '7': '#analytics',
    '8': '#billing',
    '9': '#safety',
  };
  if (shortcuts[e.key]) {
    window.location.hash = shortcuts[e.key];
  }
});

// ---- Init ----
async function init() {
  await loadState();
  // Short loading delay for polish
  setTimeout(() => {
    loadScreen.style.display = 'none';
    handleRoute();
  }, 600);
}

init();

// ---- Live ops simulation ----
// Simulate badge updates every 30s
setInterval(() => {
  const safetyBadge = document.getElementById('safety-badge');
  const jobsBadge   = document.getElementById('jobs-badge');
  if (safetyBadge) {
    const n = Math.floor(Math.random() * 4) + 1;
    safetyBadge.textContent = n;
  }
}, 30000);
