// ============================================================
// DASHBOARD.JS — Matches the Figma dashboard layout exactly
// Figma shows: 2 stat boxes top-left, donut chart right side,
// "Total Tasks" card bottom-left with counts
// ============================================================

const DashboardPage = (() => {
  let charts = [];

  function destroyCharts() { charts.forEach(c => c.destroy()); charts = []; }

  async function load() {
    destroyCharts();
    const el = document.getElementById('dashboardContent');
    el.innerHTML = '<div class="state-msg">Loading dashboard...</div>';

    const data = await api.getDashboard();
    render(data);
  }

  function render(data) {
    const total = data.tasks.total || 1;
    const inPct   = Math.round((data.tasks.in_progress / total) * 100);
    const compPct = Math.round((data.tasks.completed   / total) * 100);
    const pendPct = Math.round((data.tasks.unassigned  / total) * 100);

    document.getElementById('dashboardContent').innerHTML = `
      <div class="dash-wrap">

        <!-- Row 1: stat boxes + donut -->
        <div style="display:flex;gap:28px;align-items:flex-start;flex-wrap:wrap;margin-bottom:28px">

          <!-- Left column: stat boxes + tasks card -->
          <div style="display:flex;flex-direction:column;gap:16px;flex:0 0 auto">
            <!-- Stat boxes row -->
            <div style="display:flex;gap:16px">
              <div class="dash-stat-box">
                <div class="dash-stat-box-lbl">Total Active<br>Employees</div>
                <div class="dash-stat-box-val">${data.employees.active}</div>
              </div>
              <div class="dash-stat-box">
                <div class="dash-stat-box-lbl">Employees<br>Underutilized</div>
                <div class="dash-stat-box-val">${data.employees.underutilized}</div>
              </div>
            </div>

            <!-- Total tasks card -->
            <div class="dash-tasks-card">
              <div class="dash-tasks-title">Total Tasks</div>
              <div class="dash-tasks-row">
                <span class="dash-tasks-row-lbl">Assigned :</span>
                <span class="dash-tasks-row-val">${data.tasks.assigned}</span>
              </div>
              <div class="dash-tasks-row">
                <span class="dash-tasks-row-lbl">Unassigned :</span>
                <span class="dash-tasks-row-val">${data.tasks.unassigned}</span>
              </div>
              <div class="dash-tasks-row">
                <span class="dash-tasks-row-lbl">In Progress :</span>
                <span class="dash-tasks-row-val">${data.tasks.in_progress}</span>
              </div>
              <div class="dash-tasks-row">
                <span class="dash-tasks-row-lbl">Completed :</span>
                <span class="dash-tasks-row-val">${data.tasks.completed}</span>
              </div>
            </div>
          </div>

          <!-- Right: donut chart with floating % labels -->
          <div style="position:relative;flex:1;display:flex;align-items:center;justify-content:center;min-height:280px;min-width:320px">

            <!-- In Progress label — left side -->
            <div style="position:absolute;left:0;top:50%;transform:translateY(-80%);text-align:center">
              <div style="font-weight:700;font-size:1.5rem;color:#4CAF50">${inPct}%</div>
              <div style="font-size:0.78rem;color:#555;font-weight:500">Task in Progress</div>
            </div>

            <!-- Completed label — right side -->
            <div style="position:absolute;right:0;top:30%;text-align:center">
              <div style="font-weight:700;font-size:1.5rem;color:#F44336">${compPct}%</div>
              <div style="font-size:0.78rem;color:#555;font-weight:500">Task Completed</div>
            </div>

            <!-- Pending label — bottom -->
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);text-align:center">
              <div style="font-weight:700;font-size:1.5rem;color:#7FE7F7">${pendPct}%</div>
              <div style="font-size:0.78rem;color:#555;font-weight:500">Task Pending</div>
            </div>

            <!-- Donut canvas -->
            <div style="width:220px;height:220px;flex-shrink:0">
              <canvas id="chartDonut"></canvas>
            </div>
          </div>
        </div>

        <!-- Row 2: skill demand + insights -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="dash-tasks-card">
            <div class="dash-tasks-title" style="font-size:0.9rem">Top Skill Demand</div>
            <canvas id="chartSkills" height="180"></canvas>
          </div>
          <div class="dash-tasks-card">
            <div class="dash-tasks-title" style="font-size:0.9rem">Insights</div>
            ${data.insights.map(i => `
              <div style="display:flex;gap:8px;padding:7px 10px;background:#f8f8f8;border-radius:8px;margin-bottom:7px">
                <span style="color:#F08080;font-size:10px;margin-top:4px;flex-shrink:0">●</span>
                <span style="font-size:0.82rem;color:#555">${i}</span>
              </div>`).join('')}
          </div>
        </div>

      </div>
    `;

    buildCharts(data);
  }

  function buildCharts(data) {
    // Donut
    const dc = document.getElementById('chartDonut')?.getContext('2d');
    if (dc) {
      charts.push(new Chart(dc, {
        type: 'doughnut',
        data: {
          labels: ['In Progress', 'Completed', 'Pending', 'Assigned'],
          datasets: [{
            data: [data.tasks.in_progress, data.tasks.completed, data.tasks.unassigned, data.tasks.assigned],
            backgroundColor: ['#4CAF50', '#F44336', '#7FE7F7', '#FFC107'],
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true,
          cutout: '60%',
          plugins: { legend: { display: false } },
        },
      }));
    }

    // Skill demand (horizontal)
    const sc = document.getElementById('chartSkills')?.getContext('2d');
    if (sc && data.skills.topDemandSkills.length) {
      charts.push(new Chart(sc, {
        type: 'bar',
        data: {
          labels: data.skills.topDemandSkills.map(s => s.name),
          datasets: [{ label: 'Tasks', data: data.skills.topDemandSkills.map(s => s.count), backgroundColor: '#7FE7F7', borderRadius: 4 }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } },
            y: { grid: { display: false } },
          },
        },
      }));
    }
  }

  return { load };
})();
