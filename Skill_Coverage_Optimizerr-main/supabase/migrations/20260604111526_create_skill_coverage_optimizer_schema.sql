/*
  # Skill Coverage Optimizer - Complete Schema

  ## Overview
  Full schema for the Skill Coverage Optimizer application.

  ## New Tables
  1. `skills` - Available skills with categories
  2. `employees` - Employee records with capacity tracking
  3. `employee_skills` - Many-to-many: employees to skills with proficiency level
  4. `tasks` - Tasks with priority and status enums
  5. `task_skills` - Many-to-many: tasks to required skills
  6. `allocations` - Task-to-employee assignments with suitability scores
  7. `proficiency_weights` - Lookup table for proficiency scoring weights
  8. `priority_weights` - Lookup table for priority scoring weights

  ## Security
  - RLS enabled on all tables
  - Anon users can read/write all tables (public app, no auth required per spec)

  ## Notes
  - `employees.remaining_capacity` is a generated column (total - workload)
  - Triggers auto-sync workload when allocations change
  - Triggers auto-update `updated_at` on employees and tasks
*/

-- =====================
-- ENUMS
-- =====================
DO $$ BEGIN
  CREATE TYPE priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE status_enum AS ENUM ('unassigned', 'assigned', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================
-- SKILLS
-- =====================
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100)
);

-- =====================
-- EMPLOYEES
-- =====================
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100),
  total_capacity NUMERIC DEFAULT 40,
  current_workload NUMERIC DEFAULT 0,
  remaining_capacity NUMERIC GENERATED ALWAYS AS (total_capacity - current_workload) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- EMPLOYEE_SKILLS
-- =====================
CREATE TABLE IF NOT EXISTS employee_skills (
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
  proficiency VARCHAR(50) CHECK (proficiency IN ('beginner','intermediate','expert')),
  PRIMARY KEY (employee_id, skill_id)
);

-- =====================
-- TASKS
-- =====================
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  effort_hours NUMERIC DEFAULT 0,
  priority priority_enum DEFAULT 'medium',
  task_type VARCHAR(50),
  status status_enum DEFAULT 'unassigned',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- TASK_SKILLS
-- =====================
CREATE TABLE IF NOT EXISTS task_skills (
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  skill_id INT REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, skill_id)
);

-- =====================
-- ALLOCATIONS
-- =====================
CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
  suitability_score NUMERIC,
  assignment_status VARCHAR(50) DEFAULT 'active',
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,
  UNIQUE(employee_id, task_id)
);

-- =====================
-- PROFICIENCY WEIGHTS
-- =====================
CREATE TABLE IF NOT EXISTS proficiency_weights (
  proficiency VARCHAR(50) PRIMARY KEY,
  weight NUMERIC NOT NULL
);

INSERT INTO proficiency_weights (proficiency, weight) VALUES
  ('beginner', 0.50),
  ('intermediate', 0.75),
  ('expert', 1.00)
ON CONFLICT (proficiency) DO NOTHING;

-- =====================
-- PRIORITY WEIGHTS
-- =====================
CREATE TABLE IF NOT EXISTS priority_weights (
  priority VARCHAR(50) PRIMARY KEY,
  weight NUMERIC NOT NULL
);

INSERT INTO priority_weights (priority, weight) VALUES
  ('low', 0.25),
  ('medium', 0.50),
  ('high', 0.75),
  ('urgent', 1.00)
ON CONFLICT (priority) DO NOTHING;

-- =====================
-- TRIGGERS: updated_at
-- =====================
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- =====================
-- TRIGGER: sync workload
-- =====================
CREATE OR REPLACE FUNCTION fn_sync_workload()
RETURNS TRIGGER AS $$
DECLARE
  v_effort NUMERIC;
BEGIN
  -- Get effort hours for this task
  SELECT effort_hours INTO v_effort FROM tasks WHERE id = COALESCE(NEW.task_id, OLD.task_id);

  IF TG_OP = 'INSERT' THEN
    -- New allocation: add workload
    IF NEW.assignment_status = 'active' THEN
      UPDATE employees SET current_workload = current_workload + v_effort
      WHERE id = NEW.employee_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.assignment_status != 'active' AND NEW.assignment_status = 'active' THEN
      -- Became active
      UPDATE employees SET current_workload = current_workload + v_effort
      WHERE id = NEW.employee_id;
    ELSIF OLD.assignment_status = 'active' AND NEW.assignment_status != 'active' THEN
      -- Was deactivated
      UPDATE employees SET current_workload = GREATEST(0, current_workload - v_effort)
      WHERE id = OLD.employee_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove allocation
    IF OLD.assignment_status = 'active' THEN
      UPDATE employees SET current_workload = GREATEST(0, current_workload - v_effort)
      WHERE id = OLD.employee_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_workload ON allocations;
CREATE TRIGGER trg_sync_workload
  AFTER INSERT OR UPDATE OR DELETE ON allocations
  FOR EACH ROW EXECUTE FUNCTION fn_sync_workload();

-- =====================
-- RLS
-- =====================
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proficiency_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_weights ENABLE ROW LEVEL SECURITY;

-- Allow anon access for all tables (public app per spec)
CREATE POLICY "Public read skills" ON skills FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert skills" ON skills FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public read employees" ON employees FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert employees" ON employees FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update employees" ON employees FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public delete employees" ON employees FOR DELETE TO anon USING (true);

CREATE POLICY "Public read employee_skills" ON employee_skills FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert employee_skills" ON employee_skills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public delete employee_skills" ON employee_skills FOR DELETE TO anon USING (true);

CREATE POLICY "Public read tasks" ON tasks FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert tasks" ON tasks FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update tasks" ON tasks FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public delete tasks" ON tasks FOR DELETE TO anon USING (true);

CREATE POLICY "Public read task_skills" ON task_skills FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert task_skills" ON task_skills FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public delete task_skills" ON task_skills FOR DELETE TO anon USING (true);

CREATE POLICY "Public read allocations" ON allocations FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert allocations" ON allocations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public update allocations" ON allocations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public delete allocations" ON allocations FOR DELETE TO anon USING (true);

CREATE POLICY "Public read proficiency_weights" ON proficiency_weights FOR SELECT TO anon USING (true);
CREATE POLICY "Public read priority_weights" ON priority_weights FOR SELECT TO anon USING (true);
