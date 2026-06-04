// ============================================================
// TEAM.JS — No edit buttons, no search/filter bar
// ============================================================

const TeamPage = (() => {
  let employees   = [];
  let allSkills   = [];
  let currentView = 'teams';
  let skillEntries = [];

  /* ── helpers ─────────────────────────────────────── */
  function wPct(workload, capacity) {
    return capacity > 0 ? Math.min(100, Math.round((workload / capacity) * 100)) : 0;
  }
  function wColor(workload, capacity) {
    const p = wPct(workload, capacity);
    if (p <= 50) return '#16C60C';
    if (p <= 80) return '#FFC82C';
    return '#FF0000';
  }
  function wClass(workload, capacity) {
    const p = wPct(workload, capacity);
    if (p <= 50) return 'emp-card--green';
    if (p <= 80) return 'emp-card--yellow';
    return 'emp-card--red';
  }

  /* ── Employee cards ──────────────────────────────── */
  function renderEmployees() {
    const grid = document.getElementById('employeeGrid');

    if (!employees.length) {
      grid.innerHTML = '<div class="state-msg">No employees found.</div>';
      return;
    }

    grid.innerHTML = employees.map(emp => {
      const pct   = wPct(emp.current_workload, emp.total_capacity);
      const color = wColor(emp.current_workload, emp.total_capacity);
      const cls   = wClass(emp.current_workload, emp.total_capacity);
      const skills = (emp.employee_skills || []).map(es => es.skills?.name).filter(Boolean);
      const chips  = skills.length
        ? skills.map(s => `<span class="skill-chip">${s}</span>`).join('')
        : `<span style="font-size:0.72rem;color:#aaa">—</span>`;

      return `
        <div class="emp-card ${cls} fade-in">
          <div class="emp-card-top">
            <div>
              <div class="emp-name">${emp.name}</div>
              <div class="emp-role">${emp.role || 'No role'}</div>
            </div>
            <button class="emp-del-btn" onclick="TeamPage.deleteEmployee(${emp.id})" title="Delete">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>

          <div class="workload-row">
            <span class="workload-lbl">Workload</span>
            <span class="workload-lbl">Workload</span>
          </div>
          <div class="workload-bar">
            <div class="workload-fill" style="width:${pct}%;background:${color}"></div>
          </div>

          <div class="skills-row">
            <div class="skills-row-lbl">Skills</div>
            <div class="skills-chips">${chips}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ── Team cards ──────────────────────────────────── */
  function renderTeams() {
    const grid  = document.getElementById('teamsGrid');
    const teams = JSON.parse(localStorage.getItem('sco_teams') || '[]');

    if (!teams.length) {
      grid.innerHTML = '<div class="state-msg">No teams yet. Create one!</div>';
      return;
    }

    grid.innerHTML = teams.map(team => {
      const members  = employees.filter(e => team.member_ids.includes(e.id));
      const totalCap = members.reduce((s, e) => s + e.total_capacity, 0);
      const usedCap  = members.reduce((s, e) => s + e.current_workload, 0);
      const pct      = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;
      const color    = pct <= 30 ? '#16C60C' : pct <= 70 ? '#FFC82C' : '#FF0000';
      const levelCls = pct <= 30 ? 'badge-low' : pct <= 70 ? 'badge-medium' : 'badge-high';
      const levelLbl = pct <= 30 ? 'Low' : pct <= 70 ? 'Medium' : 'High';
      const chips    = members.length
        ? members.map(m => `<span class="skill-chip">${m.name}</span>`).join('')
        : `<span style="font-size:0.72rem;color:#aaa">No members</span>`;

      return `
        <div class="team-card fade-in">
          <div class="team-card-top">
            <div>
              <div class="team-id">${team.name}</div>
              <div class="team-task-row">
                <span class="team-task-lbl">Task Assigned</span>
                <span class="${levelCls}">${levelLbl}</span>
              </div>
            </div>
            <button class="team-del-btn" onclick="TeamPage.deleteTeam('${team.id}')">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
          <div class="team-progress-lbl">Team Progress</div>
          <div class="team-prog-bar">
            <div class="team-prog-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <div class="team-members-lbl">Team Members</div>
          <div class="skills-chips">${chips}</div>
        </div>
      `;
    }).join('');
  }

  /* ── Load ────────────────────────────────────────── */
  async function load() {
    document.getElementById('employeeGrid').innerHTML = '<div class="state-msg">Loading...</div>';
    [employees, allSkills] = await Promise.all([api.getEmployees(), api.getSkills()]);
    if (currentView === 'employee') renderEmployees();
    else renderTeams();
  }

  /* ── View toggle ─────────────────────────────────── */
  function setView(view) {
    currentView = view;
    document.querySelectorAll('#teamViewToggle .toggle-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.view === view)
    );
    document.getElementById('employeeView').style.display = view === 'employee' ? '' : 'none';
    document.getElementById('teamsView').style.display    = view === 'teams'    ? '' : 'none';

    const btn = document.getElementById('btnAddEmployee');
    const textNode = btn.lastChild;
    if (textNode) textNode.textContent = view === 'employee' ? ' ADD Employee' : ' ADD Team';

    if (view === 'teams') renderTeams();
    else renderEmployees();
  }

  /* ── Employee modal ──────────────────────────────── */
  function renderSkillEntries() {
    document.getElementById('skillEntries').innerHTML = skillEntries.map((e, i) => `
      <div class="skill-entry-row">
        <select class="mfield-input" onchange="TeamPage._setSkill(${i},'skillId',+this.value)">
          ${allSkills.map(s => `<option value="${s.id}" ${s.id===e.skillId?'selected':''}>${s.name}</option>`).join('')}
        </select>
        <select class="mfield-input prof-sel" onchange="TeamPage._setSkill(${i},'proficiency',this.value)">
          <option value="beginner"     ${e.proficiency==='beginner'    ?'selected':''}>Beginner</option>
          <option value="intermediate" ${e.proficiency==='intermediate'?'selected':''}>Intermediate</option>
          <option value="expert"       ${e.proficiency==='expert'      ?'selected':''}>Expert</option>
        </select>
        <button class="skill-entry-rm" onclick="TeamPage._rmSkill(${i})">×</button>
      </div>
    `).join('');
  }

  function _setSkill(i, field, val) { skillEntries[i][field] = val; }
  function _rmSkill(i)              { skillEntries.splice(i, 1); renderSkillEntries(); }

  function openEmpModal() {
    document.getElementById('empName').value     = '';
    document.getElementById('empEmail').value    = '';
    document.getElementById('empRole').value     = '';
    document.getElementById('empCapacity').value = 40;
    document.getElementById('empError').textContent = '';
    document.getElementById('btnSaveEmployee').textContent = 'ADD';
    skillEntries = [];
    renderSkillEntries();
    document.getElementById('modalEmployee').style.display = 'flex';
  }

  async function saveEmployee() {
    const name  = document.getElementById('empName').value.trim();
    const email = document.getElementById('empEmail').value.trim();
    if (!name || !email) { document.getElementById('empError').textContent = 'Name and email are required.'; return; }

    const btn = document.getElementById('btnSaveEmployee');
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      await api.createEmployee({
        name, email,
        role: document.getElementById('empRole').value.trim(),
        total_capacity: +document.getElementById('empCapacity').value,
        skills: skillEntries.map(e => ({ skill_id: e.skillId, proficiency: e.proficiency })),
      });
      document.getElementById('modalEmployee').style.display = 'none';
      await load();
    } catch(e) {
      document.getElementById('empError').textContent = e.message;
    } finally {
      btn.disabled = false; btn.textContent = 'ADD';
    }
  }

  async function deleteEmployee(id) {
    if (!confirm('Delete this employee?')) return;
    await api.deleteEmployee(id);
    await load();
  }

  /* ── Team modal ──────────────────────────────────── */
  function openTeamModal() {
    document.getElementById('teamName').value = '';
    document.getElementById('teamError').textContent = '';
    document.getElementById('teamMemberList').innerHTML = employees.map(emp => `
      <label class="member-item">
        <input type="checkbox" value="${emp.id}" />
        <span>${emp.name}</span>
        <span class="member-role-tag">${emp.role || ''}</span>
      </label>
    `).join('');
    document.getElementById('modalTeam').style.display = 'flex';
  }

  function saveTeam() {
    const name = document.getElementById('teamName').value.trim();
    if (!name) { document.getElementById('teamError').textContent = 'Team name is required.'; return; }
    const ids = [...document.querySelectorAll('#teamMemberList input:checked')].map(el => +el.value);
    const teams = JSON.parse(localStorage.getItem('sco_teams') || '[]');
    teams.push({ id: crypto.randomUUID(), name, member_ids: ids });
    localStorage.setItem('sco_teams', JSON.stringify(teams));
    document.getElementById('modalTeam').style.display = 'none';
    renderTeams();
  }

  function deleteTeam(id) {
    if (!confirm('Delete this team?')) return;
    const t = JSON.parse(localStorage.getItem('sco_teams') || '[]').filter(t => t.id !== id);
    localStorage.setItem('sco_teams', JSON.stringify(t));
    renderTeams();
  }

  /* ── Init ────────────────────────────────────────── */
  function init() {
    document.getElementById('btnAddEmployee').addEventListener('click', () => {
      currentView === 'employee' ? openEmpModal() : openTeamModal();
    });
    document.getElementById('btnSaveEmployee').addEventListener('click', saveEmployee);
    document.getElementById('btnSaveTeam').addEventListener('click', saveTeam);
    document.getElementById('btnAddSkillEntry').addEventListener('click', () => {
      const unused = allSkills.find(s => !skillEntries.some(e => e.skillId === s.id));
      if (unused) { skillEntries.push({ skillId: unused.id, proficiency: 'intermediate' }); renderSkillEntries(); }
    });
    document.querySelectorAll('#teamViewToggle .toggle-btn').forEach(b =>
      b.addEventListener('click', () => setView(b.dataset.view))
    );
  }

  return {
    load, init, setView, deleteEmployee, deleteTeam,
    _setSkill, _rmSkill,
  };
})();
