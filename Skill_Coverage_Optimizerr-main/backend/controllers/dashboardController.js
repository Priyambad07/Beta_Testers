const supabase = require('../config/supabase');

// GET /api/dashboard
async function getDashboard(req, res, next) {
  try {
    const [empsRes, tasksRes, taskSkillsRes] = await Promise.all([
      supabase.from('employees').select('id, name, current_workload, total_capacity, remaining_capacity, role'),
      supabase.from('tasks').select('id, status, priority, effort_hours'),
      supabase.from('task_skills').select('skill_id, skills(name)'),
    ]);

    const emps = empsRes.data || [];
    const tasks = tasksRes.data || [];
    const taskSkills = taskSkillsRes.data || [];

    const activeEmps = emps.filter(e => e.current_workload > 0);
    const underutilized = emps.filter(e => e.total_capacity > 0 && (e.current_workload / e.total_capacity) < 0.3);
    const overloaded = emps.filter(e => e.total_capacity > 0 && (e.current_workload / e.total_capacity) >= 0.8);

    const byStatus = { assigned: 0, unassigned: 0, in_progress: 0, completed: 0 };
    tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });

    const skillCounts = {};
    taskSkills.forEach(ts => {
      const name = ts.skills?.name;
      if (name) skillCounts[name] = (skillCounts[name] || 0) + 1;
    });
    const topDemandSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const urgentUnassigned = tasks.filter(t => t.priority === 'urgent' && t.status === 'unassigned').length;

    const insights = [];
    if (overloaded.length > 0)
      insights.push(`${overloaded.length} employee${overloaded.length > 1 ? 's are' : ' is'} overloaded (>80% capacity).`);
    if (urgentUnassigned > 0)
      insights.push(`${urgentUnassigned} urgent task${urgentUnassigned > 1 ? 's remain' : ' remains'} unassigned.`);
    if (byStatus.unassigned > 0)
      insights.push(`${byStatus.unassigned} task${byStatus.unassigned > 1 ? 's are' : ' is'} unassigned and waiting.`);
    if (underutilized.length > 0)
      insights.push(`${underutilized.length} employee${underutilized.length > 1 ? 's are' : ' is'} underutilized (<30% capacity).`);
    if (topDemandSkills[0])
      insights.push(`"${topDemandSkills[0].name}" is the most demanded skill across ${topDemandSkills[0].count} tasks.`);
    if (insights.length === 0)
      insights.push('Workload is well balanced across the team.');

    res.json({
      employees: {
        total: emps.length,
        active: activeEmps.length,
        underutilized: underutilized.length,
        overloaded: overloaded.length,
      },
      tasks: {
        total: tasks.length,
        ...byStatus,
      },
      skills: { topDemandSkills },
      workloadData: emps.slice(0, 12).map(e => ({
        name: e.name.split(' ')[0],
        workload: e.current_workload,
        capacity: e.total_capacity,
        utilization: e.total_capacity > 0 ? Math.round((e.current_workload / e.total_capacity) * 100) : 0,
      })),
      insights,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };
