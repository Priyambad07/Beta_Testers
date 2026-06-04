import { useState, useCallback } from 'react';
import { supabase, OptimizeResult, Task, Employee } from '../../lib/supabase';

const PROFICIENCY_WEIGHTS: Record<string, number> = { beginner: 0.5, intermediate: 0.75, expert: 1.0 };
const PRIORITY_WEIGHTS: Record<string, number> = { low: 0.25, medium: 0.5, high: 0.75, urgent: 1.0 };

function calculateSuitabilityScore(
  task: Task,
  employee: Employee,
  taskSkillIds: number[],
  empSkillMap: Map<number, string>,
): { score: number; matchedSkills: string[] } {
  if (taskSkillIds.length === 0) {
    return { score: PRIORITY_WEIGHTS[task.priority] * 100, matchedSkills: [] };
  }
  const matchedSkills: string[] = [];
  let totalProficiencyWeight = 0;
  let matched = 0;

  for (const skillId of taskSkillIds) {
    const proficiency = empSkillMap.get(skillId);
    if (proficiency) {
      matched++;
      totalProficiencyWeight += PROFICIENCY_WEIGHTS[proficiency] ?? 0;
      matchedSkills.push(proficiency);
    }
  }

  if (matched === 0) return { score: 0, matchedSkills: [] };

  const skillRatio = matched / taskSkillIds.length;
  const avgProficiency = totalProficiencyWeight / matched;
  const priorityWeight = PRIORITY_WEIGHTS[task.priority] ?? 0.5;
  const score = skillRatio * avgProficiency * priorityWeight * 100;

  return { score: Math.round(score * 100) / 100, matchedSkills };
}

function getMatchStatus(score: number): OptimizeResult['matchStatus'] {
  if (score >= 60) return 'OPTIMAL';
  if (score >= 30) return 'GOOD';
  if (score > 0) return 'LOW MATCH';
  return 'NO MATCH';
}

const MATCH_COLORS: Record<string, string> = {
  OPTIMAL: 'bg-green-100 text-green-700 border-green-200',
  GOOD: 'bg-blue-100 text-blue-700 border-blue-200',
  'LOW MATCH': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'NO MATCH': 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function OptimizePage() {
  const [results, setResults] = useState<OptimizeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [assigned, setAssigned] = useState<Set<number>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Record<number, number>>({});

  const runOptimization = useCallback(async () => {
    setLoading(true);
    setDone(false);
    setAssigned(new Set());
    setSelectedEmployee({});

    // Fetch unassigned/in_progress tasks sorted by priority (urgent first)
    const priorityOrder = ['urgent', 'high', 'medium', 'low'];
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['unassigned']);

    if (!tasks || tasks.length === 0) {
      setResults([]);
      setLoading(false);
      setDone(true);
      return;
    }

    const sortedTasks = [...tasks].sort((a, b) =>
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
    );

    const [empRes, empSkillsRes, taskSkillsRes] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('employee_skills').select('employee_id, skill_id, proficiency'),
      supabase.from('task_skills').select('task_id, skill_id'),
    ]);

    const employees: Employee[] = empRes.data ?? [];
    const empSkillsData = empSkillsRes.data ?? [];
    const taskSkillsData = taskSkillsRes.data ?? [];

    // Build lookup maps
    const empSkillsByEmp = new Map<number, Map<number, string>>();
    empSkillsData.forEach((es: { employee_id: number; skill_id: number; proficiency: string }) => {
      if (!empSkillsByEmp.has(es.employee_id)) empSkillsByEmp.set(es.employee_id, new Map());
      empSkillsByEmp.get(es.employee_id)!.set(es.skill_id, es.proficiency);
    });

    const taskSkillsByTask = new Map<number, number[]>();
    taskSkillsData.forEach((ts: { task_id: number; skill_id: number }) => {
      if (!taskSkillsByTask.has(ts.task_id)) taskSkillsByTask.set(ts.task_id, []);
      taskSkillsByTask.get(ts.task_id)!.push(ts.skill_id);
    });

    // Track remaining capacity during optimization
    const remainingCapacity = new Map(employees.map(e => [e.id, e.remaining_capacity]));
    const optimizationResults: OptimizeResult[] = [];

    for (const task of sortedTasks) {
      const taskSkillIds = taskSkillsByTask.get(task.id) ?? [];
      const eligibleEmployees = employees.filter(emp => (remainingCapacity.get(emp.id) ?? 0) >= task.effort_hours);

      if (eligibleEmployees.length === 0) {
        optimizationResults.push({
          task,
          employee: null,
          suitabilityScore: 0,
          matchStatus: 'NO MATCH',
          remainingCapacityAfter: 0,
          matchedSkills: [],
        });
        continue;
      }

      const scored = eligibleEmployees
        .map(emp => {
          const empSkillMap = empSkillsByEmp.get(emp.id) ?? new Map();
          const { score, matchedSkills } = calculateSuitabilityScore(task, emp, taskSkillIds, empSkillMap);
          return { emp, score, matchedSkills };
        })
        .sort((a, b) => b.score - a.score || (remainingCapacity.get(b.emp.id) ?? 0) - (remainingCapacity.get(a.emp.id) ?? 0));

      const best = scored[0];
      const newCapacity = (remainingCapacity.get(best.emp.id) ?? 0) - task.effort_hours;
      remainingCapacity.set(best.emp.id, newCapacity);

      optimizationResults.push({
        task,
        employee: best.emp,
        suitabilityScore: best.score,
        matchStatus: getMatchStatus(best.score),
        remainingCapacityAfter: Math.max(0, newCapacity),
        matchedSkills: best.matchedSkills,
      });
    }

    setResults(optimizationResults);
    setLoading(false);
    setDone(true);
  }, []);

  const assignOne = useCallback(async (taskId: number, employeeId: number, score: number) => {
    if (!employeeId) return;
    await supabase.from('allocations').upsert({
      employee_id: employeeId,
      task_id: taskId,
      suitability_score: score,
      assignment_status: 'active',
    }, { onConflict: 'employee_id,task_id' });
    await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId);
    setAssigned(prev => new Set(prev).add(taskId));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-700">Workload Optimization</h2>
        <div className="flex gap-3">
          <button
            onClick={runOptimization}
            disabled={loading}
            className={`btn-primary flex items-center gap-2 ${loading ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Optimizing...
              </>
            ) : 'Generate Optimal Results'}
          </button>
        </div>
      </div>

      {!done && !loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">⚡</div>
          <p className="text-gray-500 font-medium">Click "Generate Optimal Results" to run the allocation algorithm.</p>
          <p className="text-sm text-gray-400 mt-2">The optimizer considers skill matching, proficiency, task priority, and remaining capacity.</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 border-4 border-secondary border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Analyzing skills, capacity, and priorities...</p>
        </div>
      )}

      {done && results.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="font-medium">No unassigned tasks found.</p>
          <p className="text-sm mt-1">All tasks are already assigned or there are no tasks yet.</p>
        </div>
      )}

      {done && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-400 mb-4">{results.filter(r => r.employee).length} of {results.length} tasks optimally allocated</p>
          {results.map(r => (
            <div key={r.task.id} className={`card border border-gray-100 transition-opacity ${assigned.has(r.task.id) ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800">{r.task.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${MATCH_COLORS[r.matchStatus]}`}>
                      {r.matchStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {r.employee ? (
                      <>Suggested: <span className="font-semibold text-gray-700">{r.employee.name}</span></>
                    ) : (
                      <span className="text-red-400">No suitable employee found</span>
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-xs text-gray-400">Skill Match:</span>
                    {r.matchedSkills.map((p, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p === 'expert' ? 'bg-green-100 text-green-700' :
                        p === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{p}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                    <span>Suitability Score: <span className="font-bold text-gray-700">{r.suitabilityScore.toFixed(1)}</span></span>
                    <span>Priority: <span className="font-semibold capitalize">{r.task.priority}</span></span>
                    <span>Effort: <span className="font-semibold">{r.task.effort_hours}h</span></span>
                    {r.employee && <span>Remaining Capacity After: <span className="font-semibold text-gray-700">{r.remainingCapacityAfter}h</span></span>}
                  </div>
                </div>
                {r.employee && (
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-primary">{r.suitabilityScore.toFixed(0)}</div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>
                )}
              </div>
              {r.employee && !assigned.has(r.task.id) && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <select
                    className="input-field text-sm flex-1 min-w-40"
                    value={selectedEmployee[r.task.id] ?? r.employee.id}
                    onChange={e => setSelectedEmployee(prev => ({ ...prev, [r.task.id]: Number(e.target.value) }))}
                  >
                    <option value="">— Choose employee —</option>
                    {results
                      .filter(x => x.employee)
                      .map(x => x.employee!)
                      .filter((emp, idx, self) => self.findIndex(e => e.id === emp.id) === idx)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.remaining_capacity}h left)</option>
                      ))}
                  </select>
                  <button
                    onClick={() => assignOne(r.task.id, selectedEmployee[r.task.id] ?? r.employee!.id, r.suitabilityScore)}
                    className="btn-primary text-sm px-4 py-1.5"
                  >
                    Assign
                  </button>
                </div>
              )}
              {assigned.has(r.task.id) && (
                <div className="mt-2 text-sm font-semibold text-green-600">Assigned</div>
              )}
              <div className="mt-2">
                <div className="w-full h-1 rounded-full bg-gray-100">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, r.suitabilityScore)}%`,
                      backgroundColor: r.suitabilityScore >= 60 ? '#4CAF50' : r.suitabilityScore >= 30 ? '#FFC107' : '#F44336',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
