// ============================================================
// APP.JS — SPA routing, modal wiring
// ============================================================

(function () {
  const TABS = ['team', 'tasks', 'dashboard', 'optimize'];
  let active = 'team';

  /* ── Modal wiring ──────────────────────────────── */
  function setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(btn.dataset.close).style.display = 'none';
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    });
  }

  /* ── Tab switching ─────────────────────────────── */
  function showTab(tab) {
    if (!TABS.includes(tab)) return;
    active = tab;

    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab)
    );
    document.querySelectorAll('.tab-content').forEach(el =>
      el.classList.toggle('active', el.id === `tab-${tab}`)
    );

    if (tab === 'team')      TeamPage.load();
    else if (tab === 'tasks')     TasksPage.load();
    else if (tab === 'dashboard') DashboardPage.load();
  }

  /* ── Init ──────────────────────────────────────── */
  function init() {
    TeamPage.init();
    TasksPage.init();
    OptimizePage.init();
    setupModals();

    document.querySelectorAll('.nav-btn').forEach(btn =>
      btn.addEventListener('click', () => showTab(btn.dataset.tab))
    );

    showTab('team');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
