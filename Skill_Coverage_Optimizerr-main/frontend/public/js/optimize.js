// ============================================================
// OPTIMIZE.JS — Per-card individual Assign buttons
// No global "Save Allocations" — user picks each allocation
// ============================================================

const OptimizePage = (() => {
  let currentResults = [];

  function barColor(score) {
    if (score >= 60) return '#4CAF50';
    if (score >= 30) return '#FFC107';
    return '#F44336';
  }

  /* ── Assign a single task from the result card ─── */
  async function assignSingle(taskId, employeeId, score, btnEl) {
    if (!employeeId) { alert('Please select an employee first.'); return; }
    btnEl.disabled = true;
    btnEl.textContent = 'Assigning...';
    try {
      await api.request('POST', '/allocations', {
        employee_id: employeeId,
        task_id: taskId,
        suitability_score: score,
        assignment_status: 'active',
      });
      await api.updateTask(taskId, { status: 'assigned' });
      // Mark card as done
      const card = btnEl.closest('.opt-card');
      card.style.opacity = '0.55';
      btnEl.textContent = 'Assigned ✓';
      btnEl.style.background = '#4CAF50';
      btnEl.style.color = 'white';
    } catch(e) {
      btnEl.disabled = false;
      btnEl.textContent = 'Assign';
      alert('Error: ' + e.message);
    }
  }

  /* ── Render results ──────────────────────────────── */
  function renderResults(results) {
    currentResults = results;
    const resultsEl = document.getElementById('optimizeResults');
    const actionsEl = document.getElementById('optimizeActions');

    // Reset toolbar to just the generate button
    actionsEl.innerHTML = `<button class="btn-generate" id="btnOptimize">Generate Optimal Results</button>`;
    document.getElementById('btnOptimize').addEventListener('click', run);

    if (!results.length) {
      resultsEl.innerHTML = `
        <div class="optimize-placeholder">
          <p style="font-weight:600">No unassigned tasks found.</p>
          <p style="margin-top:6px;font-size:0.82rem;color:#aaa">All tasks are already assigned or there are no tasks yet.</p>
        </div>`;
      return;
    }

    const matched = results.filter(r => r.employee).length;

    resultsEl.innerHTML = `
      <p class="opt-summary">${matched} of ${results.length} tasks can be optimally allocated — assign individually below</p>
      ${results.map((r, idx) => {
        const taskSkills = (r.task.task_skills || []).map(ts => ts.skills?.name).filter(Boolean);
        const chips = taskSkills.map(s => `<span class="skill-chip">${s}</span>`).join('');
        const badgeCls = `badge-${(r.matchStatus || 'NO MATCH').replace(' ', '-')}`;

        // Build employee select for this card (suggested employee pre-selected)
        const empSelectId = `emp-sel-${idx}`;
        const empOpts = r.allCandidates
          ? r.allCandidates.map(c =>
              `<option value="${c.emp.id}" ${r.employee && c.emp.id === r.employee.id ? 'selected' : ''}>
                ${c.emp.name} — Score: ${c.score.toFixed(0)} (${c.emp.remaining_capacity}h left)
              </option>`
            ).join('')
          : r.employee
            ? `<option value="${r.employee.id}" selected>${r.employee.name} (${r.employee.remaining_capacity}h left)</option>`
            : '';

        return `
          <div class="opt-card fade-in">
            <div class="opt-top">
              <div style="flex:1">
                <div class="opt-task-name">${r.task.name}</div>
                <div class="opt-assign-line" style="margin-top:4px">
                  ${r.employee
                    ? `Suggested: <b>${r.employee.name}</b>`
                    : `<span style="color:#dc2626">No suitable employee found</span>`}
                </div>
                <div class="opt-skills-row" style="margin-top:6px">
                  <div class="skills-chips">${chips || '<span style="font-size:0.75rem;color:#aaa">No skills required</span>'}</div>
                </div>
                <div class="opt-meta-row">
                  <span>Estimated: <b>${r.task.effort_hours}h</b></span>
                  <span>Priority: <b>${r.task.priority}</b></span>
                  <span>Score: <b>${r.suitabilityScore.toFixed(1)}</b></span>
                </div>
              </div>
              <span class="${badgeCls}" style="flex-shrink:0;margin-left:12px;align-self:flex-start">${r.matchStatus}</span>
            </div>

            ${r.employee ? `
              <div style="display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap">
                <select id="${empSelectId}" class="assign-select" style="flex:1;min-width:220px">
                  <option value="">— Choose employee —</option>
                  ${empOpts}
                </select>
                <button
                  class="btn-generate"
                  style="height:34px;padding:0 18px;font-size:0.82rem"
                  onclick="OptimizePage.assignOne(${r.task.id}, +document.getElementById('${empSelectId}').value, ${r.suitabilityScore}, this)"
                >Assign</button>
              </div>
            ` : ''}

            <div class="opt-bar">
              <div class="opt-bar-fill" style="width:${Math.min(100, r.suitabilityScore)}%;background:${barColor(r.suitabilityScore)}"></div>
            </div>
          </div>
        `;
      }).join('')}
    `;
  }

  async function run() {
    const resultsEl = document.getElementById('optimizeResults');
    const actionsEl = document.getElementById('optimizeActions');

    actionsEl.innerHTML = `<button class="btn-generate" disabled>Optimizing...</button>`;
    resultsEl.innerHTML = `
      <div class="opt-loading">
        <div class="spinner"></div>
        <p style="color:#666;font-weight:500">Analyzing skills, capacity, and priorities...</p>
      </div>`;

    try {
      const data = await api.optimize(false);
      renderResults(data.results);
    } catch(e) {
      resultsEl.innerHTML = `<div class="optimize-placeholder" style="color:#dc2626">Error: ${e.message}</div>`;
      actionsEl.innerHTML = `<button class="btn-generate" id="btnOptimize">Generate Optimal Results</button>`;
      document.getElementById('btnOptimize').addEventListener('click', run);
    }
  }

  function init() {
    document.getElementById('btnOptimize').addEventListener('click', run);
  }

  return { init, assignOne: assignSingle };
})();
