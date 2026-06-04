// ============================================================
// TASKS.JS — Renders exactly as the Figma wireframe shows
// ============================================================

const TasksPage = (() => {
  let tasks     = [];
  let allSkills = [];
  let employees = [];
  let editingTaskId   = null;
  let selectedSkillIds = [];

  const PBADGE = { low:'badge-low', medium:'badge-medium', high:'badge-high', urgent:'badge-urgent' };
  const SBADGE = { unassigned:'tbadge-unassigned', assigned:'tbadge-assigned', in_progress:'tbadge-in_progress', completed:'tbadge-completed' };
  const SLABEL = { unassigned:'Unassigned', assigned:'Assigned', in_progress:'In Progress', completed:'Completed' };

  /* ── Render task list ────────────────────────────── */
  function render() {
    const c = document.getElementById('tasksList');
    document.getElementById('btnAddTask').previousSibling; // no-op

    // update the Tasks header count
    const header = document.querySelector('#tab-tasks .section-title');
    if (header) header.textContent = `Tasks`;

    if (!tasks.length) {
      c.innerHTML = '<div class="state-msg">No tasks yet. Add one!</div>';
      return;
    }

    const empOptions = employees
      .map(e => `<option value="${e.id}">${e.name} (${e.remaining_capacity}h left)</option>`)
      .join('');

    c.innerHTML = tasks.map(task => {
      const skills   = (task.task_skills||[]).map(ts => ts.skills?.name).filter(Boolean);
      const chips    = skills.map(s => `<span class="skill-chip">${s}</span>`).join('');
      const assigned = (task.allocations||[]).find(a => a.assignment_status === 'active');
      const statusOpts = Object.entries(SLABEL)
        .map(([v,l]) => `<option value="${v}" ${task.status===v?'selected':''}>${l}</option>`).join('');

      return `
        <div class="task-card fade-in">
          <div class="task-top">
            <div class="task-title-row">
              <span class="task-name">${task.name}</span>
              <span class="${PBADGE[task.priority]||'badge-medium'}">${task.priority.charAt(0).toUpperCase()+task.priority.slice(1)}</span>
              <span class="${SBADGE[task.status]||'tbadge-unassigned'}">${SLABEL[task.status]||task.status}</span>
            </div>
            <button class="task-del-btn" onclick="TasksPage.deleteTask(${task.id})" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>

          <div class="task-body">
            <div class="task-desc-lbl">Task Description</div>
            ${task.description ? `<div class="task-desc-text">${task.description}</div>` : ''}

            <div class="task-meta-row">
              <div class="task-meta-item">Estimated Time: <b>${task.effort_hours}h</b></div>
              ${assigned ? `<div class="task-meta-item">Assigned to: <b>${assigned.employees?.name||'—'}</b></div>` : ''}
            </div>

            <div class="task-skills-row">
              <div class="task-skills-lbl">Required Skills:</div>
              <div class="skills-chips">${chips || '<span style="font-size:0.75rem;color:#aaa">None specified</span>'}</div>
            </div>
          </div>

          <div class="task-assign-row">
            <select class="assign-select"
              onchange="TasksPage.assignTask(${task.id}, +this.value); this.value=''">
              <option value="">Assign To</option>
              ${empOptions}
            </select>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style="flex-shrink:0;margin-left:-28px;pointer-events:none">
              <path d="M1 1l6 6 6-6" stroke="#888" stroke-width="1.5"/>
            </svg>
            <select class="status-select" onchange="TasksPage.updateStatus(${task.id}, this.value)">
              ${statusOpts}
            </select>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Load ────────────────────────────────────────── */
  async function load() {
    document.getElementById('tasksList').innerHTML = '<div class="state-msg">Loading tasks...</div>';
    [tasks, allSkills, employees] = await Promise.all([
      api.getTasks(), api.getSkills(), api.getEmployees(),
    ]);
    render();
  }

  /* ── CRUD ────────────────────────────────────────── */
  async function assignTask(taskId, employeeId) {
    if (!employeeId) return;
    await api.assignTask(taskId, employeeId);
    await load();
  }

  async function updateStatus(taskId, status) {
    await api.updateTask(taskId, { status });
    await load();
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    await api.deleteTask(id);
    await load();
  }

  /* ── Task modal ──────────────────────────────────── */
  function renderSkillPicker() {
    document.getElementById('taskSkillPicker').innerHTML = allSkills.map(s => `
      <button type="button"
        class="tskill-btn ${selectedSkillIds.includes(s.id)?'selected':''}"
        onclick="TasksPage._toggleSkill(${s.id})"
      >${s.name}</button>
    `).join('');
  }

  function _toggleSkill(id) {
    const i = selectedSkillIds.indexOf(id);
    i >= 0 ? selectedSkillIds.splice(i,1) : selectedSkillIds.push(id);
    renderSkillPicker();
  }

  function openTaskModal(task = null) {
    editingTaskId = task ? task.id : null;
    document.getElementById('modalTaskTitle') &&
      (document.getElementById('modalTaskTitle').textContent = task ? 'Edit Task' : 'Add Task');
    document.getElementById('taskName').value        = task?.name        || '';
    document.getElementById('taskDescription').value = task?.description || '';
    document.getElementById('taskHours').value       = task?.effort_hours ?? 8;
    document.getElementById('taskPriority').value    = task?.priority    || 'medium';
    document.getElementById('taskType').value        = task?.task_type   || '';
    document.getElementById('taskError').textContent = '';
    document.getElementById('btnSaveTask').textContent = task ? 'Update' : 'ADD';
    selectedSkillIds = task ? (task.task_skills||[]).map(ts => ts.skill_id) : [];
    renderSkillPicker();
    document.getElementById('modalTask').style.display = 'flex';
  }

  async function saveTask() {
    const name = document.getElementById('taskName').value.trim();
    if (!name) { document.getElementById('taskError').textContent = 'Task name is required.'; return; }
    const btn = document.getElementById('btnSaveTask');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      const payload = {
        name,
        description:  document.getElementById('taskDescription').value.trim(),
        effort_hours: +document.getElementById('taskHours').value,
        priority:     document.getElementById('taskPriority').value,
        task_type:    document.getElementById('taskType').value.trim(),
        skills:       selectedSkillIds,
      };
      editingTaskId ? await api.updateTask(editingTaskId, payload) : await api.createTask(payload);
      document.getElementById('modalTask').style.display = 'none';
      await load();
    } catch(e) {
      document.getElementById('taskError').textContent = e.message;
    } finally {
      btn.disabled = false;
      btn.textContent = editingTaskId ? 'Update' : 'ADD';
    }
  }

  /* ── Init ────────────────────────────────────────── */
  function init() {
    document.getElementById('btnAddTask').addEventListener('click', () => openTaskModal());
    document.getElementById('btnSaveTask').addEventListener('click', saveTask);
  }

  return { load, init, assignTask, updateStatus, deleteTask, _toggleSkill };
})();
