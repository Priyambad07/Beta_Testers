import { useState, useEffect, useCallback } from 'react';
import { supabase, Employee } from '../lib/supabase';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

interface Team {
  id: string;
  name: string;
  member_ids: number[];
  description?: string;
}

interface TeamModalProps {
  onClose: () => void;
  onSaved: () => void;
  employees: Employee[];
}

export function TeamModal({ onClose, onSaved, employees }: TeamModalProps) {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleMember = (id: number) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Team name is required.'); return; }
    setSaving(true);
    try {
      const teams: Team[] = JSON.parse(localStorage.getItem('sco_teams') ?? '[]');
      teams.push({ id: crypto.randomUUID(), name, member_ids: selectedMembers });
      localStorage.setItem('sco_teams', JSON.stringify(teams));
      onSaved();
      onClose();
    } catch {
      setError('Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="bg-primary rounded-t-2xl px-6 py-4">
          <h2 className="text-xl font-bold text-white">Add Team</h2>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Team Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Frontend Team" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Team Members</label>
            <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {employees.map(emp => (
                <label key={emp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(emp.id)}
                    onChange={() => toggleMember(emp.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{emp.name}</span>
                  <span className="text-xs text-gray-400">{emp.role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'ADD'}</button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  // This is exported but unused — TeamPage lives in the screens folder
  return null;
}
