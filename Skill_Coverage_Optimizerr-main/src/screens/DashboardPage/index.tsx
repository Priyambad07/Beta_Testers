import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Chart, ArcElement, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, DoughnutController, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DashboardStats {
  employees: { total: number; active: number; underutilized: number };
  tasks: { total: number; assigned: number; unassigned: number; in_progress: number; completed: number };
  topSkills: { name: string; count: number }[];
  workloadData: { name: string; workload: number; capacity: number }[];
  insights: string[];
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card text-center py-4">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1 font-medium">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const skillRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [empsRes, tasksRes, empSkillsRes, taskSkillsRes] = await Promise.all([
      supabase.from('employees').select('id, name, current_workload, total_capacity, remaining_capacity'),
      supabase.from('tasks').select('id, status, priority'),
      supabase.from('employee_skills').select('employee_id, skills(name)'),
      supabase.from('task_skills').select('skill_id, skills(name)'),
    ]);

    const emps = empsRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const empSkills = empSkillsRes.data ?? [];
    const taskSkills = taskSkillsRes.data ?? [];

    const activeEmps = emps.filter((e: { current_workload: number; total_capacity: number }) => e.current_workload > 0);
    const underutilized = emps.filter((e: { current_workload: number; total_capacity: number }) => e.total_capacity > 0 && (e.current_workload / e.total_capacity) < 0.3);

    const assigned = tasks.filter((t: { status: string }) => t.status === 'assigned').length;
    const unassigned = tasks.filter((t: { status: string }) => t.status === 'unassigned').length;
    const inProgress = tasks.filter((t: { status: string }) => t.status === 'in_progress').length;
    const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;

    // Top demand skills from tasks
    const skillCounts: Record<string, number> = {};
    taskSkills.forEach((ts: { skills: { name: string } | null }) => {
      if (ts.skills) skillCounts[ts.skills.name] = (skillCounts[ts.skills.name] ?? 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    // Workload data
    const workloadData = emps.slice(0, 10).map((e: { name: string; current_workload: number; total_capacity: number }) => ({
      name: e.name.split(' ')[0],
      workload: e.current_workload,
      capacity: e.total_capacity,
    }));

    // Insights
    const insights: string[] = [];
    const overloaded = emps.filter((e: { current_workload: number; total_capacity: number }) => e.total_capacity > 0 && (e.current_workload / e.total_capacity) >= 0.8).length;
    if (overloaded > 0) insights.push(`${overloaded} employee${overloaded > 1 ? 's are' : ' is'} overloaded (>80% capacity).`);
    const urgentUnassigned = tasks.filter((t: { priority: string; status: string }) => t.priority === 'urgent' && t.status === 'unassigned').length;
    if (urgentUnassigned > 0) insights.push(`${urgentUnassigned} urgent task${urgentUnassigned > 1 ? 's remain' : ' remains'} unassigned.`);
    if (unassigned > 0) insights.push(`${unassigned} task${unassigned > 1 ? 's are' : ' is'} unassigned and waiting for allocation.`);
    if (underutilized.length > 0) insights.push(`${underutilized.length} employee${underutilized.length > 1 ? 's are' : ' is'} underutilized (<30% capacity).`);
    if (topSkills[0]) insights.push(`"${topSkills[0].name}" is the most demanded skill across ${topSkills[0].count} tasks.`);
    if (insights.length === 0) insights.push('Workload is well balanced across the team.');

    setStats({
      employees: { total: emps.length, active: activeEmps.length, underutilized: underutilized.length },
      tasks: { total: tasks.length, assigned, unassigned, in_progress: inProgress, completed },
      topSkills,
      workloadData,
      insights,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!stats) return;
    chartsRef.current.forEach(c => c.destroy());
    chartsRef.current = [];

    if (doughnutRef.current) {
      const ctx = doughnutRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['In Progress', 'Completed', 'Unassigned', 'Assigned'],
            datasets: [{
              data: [stats.tasks.in_progress, stats.tasks.completed, stats.tasks.unassigned, stats.tasks.assigned],
              backgroundColor: ['#FFC107', '#4CAF50', '#F08080', '#7FE7F7'],
              borderWidth: 2,
              borderColor: '#fff',
            }],
          },
          options: {
            responsive: true,
            cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { padding: 12, font: { size: 11 } } } },
          },
        }));
      }
    }

    if (skillRef.current && stats.topSkills.length > 0) {
      const ctx = skillRef.current.getContext('2d');
      if (ctx) {
        chartsRef.current.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: stats.topSkills.map(s => s.name),
            datasets: [{
              label: 'Tasks Requiring Skill',
              data: stats.topSkills.map(s => s.count),
              backgroundColor: '#7FE7F7',
              borderRadius: 4,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f0f0f0' } }, y: { grid: { display: false } } },
          },
        }));
      }
    }

    return () => { chartsRef.current.forEach(c => c.destroy()); chartsRef.current = []; };
  }, [stats]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading dashboard...</div>;
  if (!stats) return null;

  const taskTotal = stats.tasks.total || 1;
  const inProgressPct = Math.round((stats.tasks.in_progress / taskTotal) * 100);
  const completedPct = Math.round((stats.tasks.completed / taskTotal) * 100);
  const unassignedPct = Math.round((stats.tasks.unassigned / taskTotal) * 100);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={stats.employees.total} color="text-gray-800" />
        <StatCard label="Active Employees" value={stats.employees.active} color="text-green-600" />
        <StatCard label="Underutilized" value={stats.employees.underutilized} color="text-yellow-600" />
        <StatCard label="Total Tasks" value={stats.tasks.total} color="text-gray-800" />
      </div>

      {/* Dashboard main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task summary */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-4">Total Tasks</h3>
          <div className="space-y-3">
            {[
              { label: 'Assigned', value: stats.tasks.assigned, color: 'text-blue-600' },
              { label: 'Unassigned', value: stats.tasks.unassigned, color: 'text-red-500' },
              { label: 'In Progress', value: stats.tasks.in_progress, color: 'text-yellow-600' },
              { label: 'Completed', value: stats.tasks.completed, color: 'text-green-600' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{row.label} :</span>
                <span className={`font-bold text-lg ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doughnut chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700">Task Status Distribution</h3>
            <div className="flex gap-4 text-xs text-gray-500">
              <span><span className="font-bold text-yellow-600">{inProgressPct}%</span> In Progress</span>
              <span><span className="font-bold text-green-600">{completedPct}%</span> Completed</span>
              <span><span className="font-bold text-primary">{unassignedPct}%</span> Pending</span>
            </div>
          </div>
          <div className="flex justify-center" style={{ height: 200 }}>
            <canvas ref={doughnutRef} />
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">Top Skill Demand</h3>
          <canvas ref={skillRef} height={180} />
        </div>
        {/* Insights */}
        <div className="card">
          <h3 className="font-bold text-gray-700 mb-3">Insights</h3>
          <div className="space-y-2">
            {stats.insights.map((insight, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-primary mt-0.5 shrink-0">●</span>
                <p className="text-sm text-gray-600">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
