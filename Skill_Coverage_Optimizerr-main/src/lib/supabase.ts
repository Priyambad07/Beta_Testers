import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Proficiency = 'beginner' | 'intermediate' | 'expert';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed';

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  total_capacity: number;
  current_workload: number;
  remaining_capacity: number;
  created_at: string;
  updated_at: string;
  employee_skills?: EmployeeSkill[];
}

export interface EmployeeSkill {
  employee_id: number;
  skill_id: number;
  proficiency: Proficiency;
  skills?: Skill;
}

export interface Task {
  id: number;
  name: string;
  description: string;
  effort_hours: number;
  priority: Priority;
  task_type: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  task_skills?: TaskSkill[];
}

export interface TaskSkill {
  task_id: number;
  skill_id: number;
  skills?: Skill;
}

export interface Allocation {
  id: number;
  employee_id: number;
  task_id: number;
  suitability_score: number;
  assignment_status: string;
  assigned_at: string;
  completed_at: string | null;
  notes: string | null;
  employees?: Employee;
  tasks?: Task;
}

export interface OptimizeResult {
  task: Task;
  employee: Employee | null;
  suitabilityScore: number;
  matchStatus: 'OPTIMAL' | 'GOOD' | 'LOW MATCH' | 'NO MATCH';
  remainingCapacityAfter: number;
  matchedSkills: string[];
}
