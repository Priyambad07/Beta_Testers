import { useState, useEffect, useCallback } from 'react';
import { supabase, Employee, Skill } from '../../lib/supabase';
import EmployeeModal from '../../components/EmployeeModal';
import { TeamModal } from '../../components/TeamModal';

interface Team {
  id: string;
  name: string;
  member_ids: number[];
}

function WorkloadBar({ workload, capacity }: { workload: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, (workload / capacity) * 100) : 0;
  const color = pct <= 50 ? '#4CAF50' : pct <= 80 ? '#FFC107' : '#F44336';
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-200 mt-1">
      <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function TeamPage() {
  const [view, setView] = useState<'Employee' | 'Teams'>('Employee');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [employeeSkillMap, setEmployeeSkillMap] = useState<Record<number, string[]>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const { data: emps } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    if (emps) setEmployees(emps);

    const { data: empSkills } = await supabase
      .from('employee_skills')
      .select('employee_id, skill_id, skills(name)');
    if (empSkills) {
      const map: Record<number, string[]> = {};
      empSkills.forEach((es: { employee_id: number; skills: { name: string } | null }) => {
        if (!map[es.employee_id]) map[es.employee_id] = [];
        if (es.skills) map[es.employee_id].push(es.skills.name);
      });
      setEmployeeSkillMap(map);
    }
    setLoading(false);
  }, []);

  const loadSkills = useCallback(async () => {
    const { data } = await supabase.from('skills').select('*').order('name');
    if (data) setAllSkills(data);
  }, []);

  const loadTeams = useCallback(() => {
    const stored = localStorage.getItem('sco_teams');
    setTeams(stored ? JSON.parse(stored) : []);
  }, []);

  useEffect(() => {
    loadEmployees();
    loadSkills();
    loadTeams();
  }, [loadEmployees, loadSkills, loadTeams]);

  const deleteEmployee = async (id: number) => {
    if (!confirm('Delete this employee?')) return;
    await supabase.from('employees').delete().eq('id', id);
    loadEmployees();
  };

  const deleteTeam = (id: string) => {
    if (!confirm('Delete this team?')) return;
    const updated = teams.filter(t => t.id !== id);
    localStorage.setItem('sco_teams', JSON.stringify(updated));
    setTeams(updated);
  };

  const filteredEmployees = employees;

  const getTeamProgress = (team: Team) => {
    if (team.member_ids.length === 0) return 0;
    const members = employees.filter(e => team.member_ids.includes(e.id));
    const total = members.reduce((s, e) => s + e.total_capacity, 0);
    const workload = members.reduce((s, e) => s + e.current_workload, 0);
    return total > 0 ? Math.round((workload / total) * 100) : 0;
  };

  const getProgressColor = (pct: number) => {
    if (pct <= 30) return '#4CAF50';
    if (pct <= 70) return '#FFC107';
    return '#F44336';
  };

  const getProgressLabel = (pct: number) => {
    if (pct <= 30) return { label: 'Low', color: 'bg-green-100 text-green-700' };
    if (pct <= 70) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'High', color: 'bg-red-100 text-red-700' };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="inline-flex rounded-full border border-secondary bg-secondary/30 p-0.5">
            {(['Employee', 'Teams'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${view === v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => view === 'Employee' ? setShowAddEmployee(true) : setShowAddTeam(true)}
          className="btn-secondary flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          ADD {view === 'Employee' ? 'Employee' : 'Team'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : view === 'Employee' ? (
        <>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No employees found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredEmployees.map(emp => {
                const pct = emp.total_capacity > 0 ? Math.min(100, (emp.current_workload / emp.total_capacity) * 100) : 0;
                const skills = employeeSkillMap[emp.id] ?? [];
                return (
                  <div key={emp.id} className="card group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base">{emp.name}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{emp.role}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => deleteEmployee(emp.id)} className="text-xs text-red-400 hover:text-red-600">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 font-medium mb-1">
                        <span>Workload ({pct.toFixed(0)}%)</span>
                        <span>{emp.current_workload}h / {emp.total_capacity}h</span>
                      </div>
                      <WorkloadBar workload={emp.current_workload} capacity={emp.total_capacity} />
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 font-semibold mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.length > 0 ? skills.map(s => (
                          <span key={s} className="skill-badge">{s}</span>
                        )) : <span className="text-xs text-gray-400">No skills assigned</span>}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Remaining capacity: <span className="font-semibold text-gray-600">{emp.remaining_capacity}h</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {teams.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No teams yet. Create one!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {teams.map(team => {
                const progress = getTeamProgress(team);
                const { label, color } = getProgressLabel(progress);
                const members = employees.filter(e => team.member_ids.includes(e.id));
                return (
                  <div key={team.id} className="card group">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 text-base">{team.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                          <span className="text-xs text-gray-400">{members.length} members</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTeam(team.id)} className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Team Progress</span><span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-200">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }} />
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-400 font-semibold mb-1.5">Team Members</p>
                      <div className="flex flex-wrap gap-1.5">
                        {members.length > 0 ? members.map(m => (
                          <span key={m.id} className="skill-badge">{m.name}</span>
                        )) : <span className="text-xs text-gray-400">No members</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddEmployee && (
        <EmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSaved={loadEmployees}
        />
      )}
      {showAddTeam && (
        <TeamModal
          onClose={() => setShowAddTeam(false)}
          onSaved={loadTeams}
          employees={employees}
        />
      )}
    </div>
  );
}
