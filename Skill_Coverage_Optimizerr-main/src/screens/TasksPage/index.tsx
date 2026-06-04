import { useState, useEffect, useCallback } from 'react';
import { supabase, Task, Skill, Priority, TaskStatus } from '../../lib/supabase';

interface TaskModalProps {
  onClose: () => void;
  onSaved: () => void;
  editTask?: Task | null;
}

function TaskModal({ onClose, onSaved, editTask }: TaskModalProps) {
  const [name, setName] = useState(editTask?.name ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [effortHours, setEffortHours] = useState(editTask?.effort_hours ?? 8);
  const [priority, setPriority] = useState<Priority>(editTask?.priority ?? 'medium');
  const [taskType, setTaskType] = useState(editTask?.task_type ?? '');
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('skills').select('*').order('name');
      if (data) setAllSkills(data);
      if (editTask) {
        const { data: ts } = await supabase.from('task_skills').select('skill_id').eq('task_id', editTask.id);
        if (ts) setSelectedSkills(ts.map((t: { skill_id: number }) => t.skill_id));
      }
    })();
  }, [editTask]);

  const toggleSkill = (id: number) => {
    setSelectedSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Task name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      let taskId: number;
      if (editTask) {
        const { error: err } = await supabase
          .from('tasks')
          .update({ name, description, effort_hours: effortHours, priority, task_type: taskType })
          .eq('id', editTask.id);
        if (err) throw err;
        taskId = editTask.id;
        await supabase.from('task_skills').delete().eq('task_id', taskId);
      } else {
        const { data, error: err } = await supabase
          .from('tasks')
          .insert({ name, description, effort_hours: effortHours, priority, task_type: taskType, status: 'unassigned' })
          .select('id')
          .single();
        if (err) throw err;
        taskId = data.id;
      }
      if (selectedSkills.length > 0) {
        await supabase.from('task_skills').insert(selectedSkills.map(sid => ({ task_id: taskId, skill_id: sid })));
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="bg-primary rounded-t-2xl px-6 py-4">
          <h2 className="text-xl font-bold text-white">{editTask ? 'Edit Task' : 'Add Task'}</h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Task name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea className="input-field resize-none" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Task description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Hours</label>
              <input className="input-field" type="number" min={1} value={effortHours} onChange={e => setEffortHours(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
              <select className="input-field" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Task Type</label>
            <input className="input-field" value={taskType} onChange={e => setTaskType(e.target.value)} placeholder="e.g. Frontend, Backend" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Required Skills</label>
            <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
              {allSkills.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedSkills.includes(s.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : editTask ? 'Update' : 'ADD'}</button>
        </div>
      </div>
    </div>
  );
}

const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  unassigned: 'bg-gray-100 text-gray-500',
  assigned: 'bg-blue-100 text-blue-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

interface EmployeeOption {
  id: number;
  name: string;
  remaining_capacity: number;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSkillMap, setTaskSkillMap] = useState<Record<number, string[]>>({});
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<number | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);

    const { data: ts } = await supabase.from('task_skills').select('task_id, skills(name)');
    if (ts) {
      const map: Record<number, string[]> = {};
      ts.forEach((t: { task_id: number; skills: { name: string } | null }) => {
        if (!map[t.task_id]) map[t.task_id] = [];
        if (t.skills) map[t.task_id].push(t.skills.name);
      });
      setTaskSkillMap(map);
    }
    setLoading(false);
  }, []);

  const loadEmployees = useCallback(async () => {
    const { data } = await supabase.from('employees').select('id, name, remaining_capacity').order('name');
    if (data) setEmployees(data);
  }, []);

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, [loadTasks, loadEmployees]);

  const deleteTask = async (id: number) => {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    loadTasks();
  };

  const assignTask = async (taskId: number, employeeId: number) => {
    if (!employeeId) return;
    setAssigning(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      await supabase.from('allocations').upsert({
        employee_id: employeeId,
        task_id: taskId,
        suitability_score: 0,
        assignment_status: 'active',
      }, { onConflict: 'employee_id,task_id' });
      await supabase.from('tasks').update({ status: 'assigned' }).eq('id', taskId);
      await loadTasks();
      await loadEmployees();
    } finally {
      setAssigning(null);
    }
  };

  const updateStatus = async (taskId: number, status: TaskStatus) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    loadTasks();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-700">Tasks ({tasks.length})</h2>
        <button onClick={() => setShowAddTask(true)} className="btn-secondary flex items-center gap-2">
          <span className="text-lg">+</span> ADD Task
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No tasks yet. Add one!</div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const skills = taskSkillMap[task.id] ?? [];
            return (
              <div key={task.id} className="card group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800">{task.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[task.status]}`}>{task.status.replace('_', ' ')}</span>
                    </div>
                    {task.description && <p className="text-sm text-gray-400 mt-1 truncate">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>Estimated: <span className="font-semibold text-gray-600">{task.effort_hours}h</span></span>
                      {task.task_type && <span>Type: <span className="font-semibold text-gray-600">{task.task_type}</span></span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.map(s => <span key={s} className="skill-badge">{s}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <select
                    className="input-field text-sm flex-1 min-w-40"
                    defaultValue=""
                    disabled={assigning === task.id}
                    onChange={e => { if (e.target.value) assignTask(task.id, Number(e.target.value)); }}
                  >
                    <option value="">Assign To...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.remaining_capacity}h left)</option>
                    ))}
                  </select>
                  <select
                    className="input-field text-sm w-36"
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value as TaskStatus)}
                  >
                    <option value="unassigned">Unassigned</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddTask && (
        <TaskModal
          onClose={() => { setShowAddTask(false); setEditTask(null); }}
          onSaved={loadTasks}
          editTask={editTask}
        />
      )}
    </div>
  );
}
