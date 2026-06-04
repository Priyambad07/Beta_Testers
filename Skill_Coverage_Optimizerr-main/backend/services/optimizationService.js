const supabase = require('../config/supabase');

const PROFICIENCY_WEIGHTS = { beginner: 0.5, intermediate: 0.75, expert: 1.0 };
const PRIORITY_WEIGHTS = { low: 0.25, medium: 0.5, high: 0.75, urgent: 1.0 };

/**
 * Calculate suitability score:
 * score = (matched_skills / total_required_skills) × avg(proficiency_weight) × priority_weight × 100
 */
function calcScore(task, empSkillMap, taskSkillIds) {
  if (taskSkillIds.length === 0) {
    return { score: PRIORITY_WEIGHTS[task.priority] * 100, matchedSkills: [], matchCount: 0 };
  }

  const matchedSkills = [];
  let totalWeight = 0;
  let matched = 0;

  for (const sid of taskSkillIds) {
    const prof = empSkillMap.get(sid);
    if (prof) {
      matched++;
      totalWeight += PROFICIENCY_WEIGHTS[prof] ?? 0;
      matchedSkills.push(prof);
    }
  }

  if (matched === 0) return { score: 0, matchedSkills: [], matchCount: 0 };

  const skillRatio = matched / taskSkillIds.length;
  const avgProficiency = totalWeight / matched;
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] ?? 0.5;
  const score = Math.round(skillRatio * avgProficiency * priorityWeight * 100 * 100) / 100;

  return { score, matchedSkills, matchCount: matched };
}

function getMatchStatus(score) {
  if (score >= 60) return 'OPTIMAL';
  if (score >= 30) return 'GOOD';
  if (score > 0) return 'LOW MATCH';
  return 'NO MATCH';
}

async function runOptimization() {
  // Fetch unassigned tasks sorted by priority (urgent first)
  const priorityOrder = ['urgent', 'high', 'medium', 'low'];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'unassigned');

  if (!tasks || tasks.length === 0) return [];

  const sortedTasks = [...tasks].sort(
    (a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  const [empRes, empSkillsRes, taskSkillsRes] = await Promise.all([
    supabase.from('employees').select('*'),
    supabase.from('employee_skills').select('employee_id, skill_id, proficiency'),
    supabase.from('task_skills').select('task_id, skill_id'),
  ]);

  const employees = empRes.data ?? [];
  const empSkillsData = empSkillsRes.data ?? [];
  const taskSkillsData = taskSkillsRes.data ?? [];

  // Build lookup: employee_id -> Map<skill_id, proficiency>
  const empSkillsByEmp = new Map();
  empSkillsData.forEach(es => {
    if (!empSkillsByEmp.has(es.employee_id)) empSkillsByEmp.set(es.employee_id, new Map());
    empSkillsByEmp.get(es.employee_id).set(es.skill_id, es.proficiency);
  });

  // Build lookup: task_id -> skill_id[]
  const taskSkillsByTask = new Map();
  taskSkillsData.forEach(ts => {
    if (!taskSkillsByTask.has(ts.task_id)) taskSkillsByTask.set(ts.task_id, []);
    taskSkillsByTask.get(ts.task_id).push(ts.skill_id);
  });

  // Track remaining capacity during allocation
  const remainingCap = new Map(employees.map(e => [e.id, e.remaining_capacity]));
  const results = [];

  for (const task of sortedTasks) {
    const taskSkillIds = taskSkillsByTask.get(task.id) ?? [];

    // Filter employees with enough capacity
    const eligible = employees.filter(e => (remainingCap.get(e.id) ?? 0) >= task.effort_hours);

    if (eligible.length === 0) {
      results.push({ task, employee: null, suitabilityScore: 0, matchStatus: 'NO MATCH', remainingCapacityAfter: 0, matchedSkills: [] });
      continue;
    }

    // Score and rank candidates
    const scored = eligible
      .map(emp => {
        const empSkillMap = empSkillsByEmp.get(emp.id) ?? new Map();
        const { score, matchedSkills } = calcScore(task, empSkillMap, taskSkillIds);
        return { emp, score, matchedSkills };
      })
      .sort((a, b) =>
        b.score - a.score ||
        (remainingCap.get(b.emp.id) ?? 0) - (remainingCap.get(a.emp.id) ?? 0)
      );

    const best = scored[0];
    const newCap = (remainingCap.get(best.emp.id) ?? 0) - task.effort_hours;
    remainingCap.set(best.emp.id, newCap);

    results.push({
      task,
      employee: best.emp,
      suitabilityScore: best.score,
      matchStatus: getMatchStatus(best.score),
      remainingCapacityAfter: Math.max(0, newCap),
      matchedSkills: best.matchedSkills,
    });
  }

  return results;
}

module.exports = { runOptimization };
