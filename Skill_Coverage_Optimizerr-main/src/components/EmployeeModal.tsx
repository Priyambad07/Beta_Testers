import { useState, useEffect, useCallback } from 'react';
import { supabase, Employee, Skill, Proficiency } from '../lib/supabase';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  editEmployee?: Employee | null;
}

interface SkillEntry {
  skillId: number;
  proficiency: Proficiency;
}

export default function EmployeeModal({ onClose, onSaved, editEmployee }: Props) {
  const [name, setName] = useState(editEmployee?.name ?? '');
  const [email, setEmail] = useState(editEmployee?.email ?? '');
  const [role, setRole] = useState(editEmployee?.role ?? '');
  const [capacity, setCapacity] = useState(editEmployee?.total_capacity ?? 40);
  const [skillEntries, setSkillEntries] = useState<SkillEntry[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSkills = useCallback(async () => {
    const { data } = await supabase.from('skills').select('*').order('name');
    if (data) setAllSkills(data);
  }, []);

  const loadExistingSkills = useCallback(async () => {
    if (!editEmployee) return;
    const { data } = await supabase
      .from('employee_skills')
      .select('skill_id, proficiency')
      .eq('employee_id', editEmployee.id);
    if (data) {
      setSkillEntries(data.map(d => ({ skillId: d.skill_id, proficiency: d.proficiency as Proficiency })));
    }
  }, [editEmployee]);

  useEffect(() => {
    loadSkills();
    loadExistingSkills();
  }, [loadSkills, loadExistingSkills]);

  const addSkillEntry = () => {
    const unused = allSkills.find(s => !skillEntries.some(e => e.skillId === s.id));
    if (unused) setSkillEntries(prev => [...prev, { skillId: unused.id, proficiency: 'intermediate' }]);
  };

  const removeSkillEntry = (idx: number) => setSkillEntries(prev => prev.filter((_, i) => i !== idx));

  const updateEntry = (idx: number, field: 'skillId' | 'proficiency', value: string | number) => {
    setSkillEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    setSaving(true);
    setError('');
    try {
      let empId: number;
      if (editEmployee) {
        const { error: err } = await supabase
          .from('employees')
          .update({ name, email, role, total_capacity: capacity })
          .eq('id', editEmployee.id);
        if (err) throw err;
        empId = editEmployee.id;
        await supabase.from('employee_skills').delete().eq('employee_id', empId);
      } else {
        const { data, error: err } = await supabase
          .from('employees')
          .insert({ name, email, role, total_capacity: capacity })
          .select('id')
          .single();
        if (err) throw err;
        empId = data.id;
      }
      if (skillEntries.length > 0) {
        await supabase.from('employee_skills').insert(
          skillEntries.map(e => ({ employee_id: empId, skill_id: e.skillId, proficiency: e.proficiency }))
        );
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
          <h2 className="text-xl font-bold text-white">{editEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@company.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
            <input className="input-field" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Frontend Developer" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Capacity (hours/week)</label>
            <input className="input-field" type="number" min={1} max={80} value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">Skills & Proficiency</label>
              <button onClick={addSkillEntry} className="text-sm text-secondary-dark font-semibold hover:text-primary transition-colors">+ Add Skill</button>
            </div>
            <div className="space-y-2">
              {skillEntries.map((entry, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select
                    className="input-field flex-1"
                    value={entry.skillId}
                    onChange={e => updateEntry(idx, 'skillId', Number(e.target.value))}
                  >
                    {allSkills.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    className="input-field w-36"
                    value={entry.proficiency}
                    onChange={e => updateEntry(idx, 'proficiency', e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button onClick={() => removeSkillEntry(idx)} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : editEmployee ? 'Update' : 'ADD'}</button>
        </div>
      </div>
    </div>
  );
}
