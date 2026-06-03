-- =============================================================
-- Task Allocation System — Database Schema
-- Feature: priyambad-database-design
-- Database: PostgreSQL
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- SKILLS  (master list)
-- =============================================================
CREATE TABLE skills (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    category   VARCHAR(100),                  -- e.g. 'frontend', 'backend', 'data'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================
-- EMPLOYEES
-- =============================================================
CREATE TABLE employees (
    id                 SERIAL PRIMARY KEY,
    name               VARCHAR(100)   NOT NULL,
    email              VARCHAR(255)   NOT NULL UNIQUE,
    role               VARCHAR(100),           -- e.g. 'Backend Developer'
    total_capacity     NUMERIC(5,2)   NOT NULL DEFAULT 40, -- hours per week
    current_workload   NUMERIC(5,2)   NOT NULL DEFAULT 0,
    remaining_capacity NUMERIC(5,2)   GENERATED ALWAYS AS (total_capacity - current_workload) STORED,
    created_at         TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- =============================================================
-- EMPLOYEE_SKILLS  (maps employees ↔ skills)
-- =============================================================
CREATE TABLE employee_skills (
    employee_id  INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_id     INT NOT NULL REFERENCES skills(id)    ON DELETE CASCADE,
    proficiency  VARCHAR(20) NOT NULL DEFAULT 'intermediate', -- 'beginner','intermediate','expert'
    PRIMARY KEY (employee_id, skill_id)
);

-- =============================================================
-- TASKS
-- =============================================================
CREATE TYPE task_type     AS ENUM ('predefined', 'custom');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status   AS ENUM ('unassigned', 'assigned', 'in_progress', 'completed');

CREATE TABLE tasks (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(255)  NOT NULL,
    description    TEXT,
    effort_hours   NUMERIC(5,2)  NOT NULL,      -- estimated hours to complete
    priority       task_priority NOT NULL DEFAULT 'medium',
    task_type      task_type     NOT NULL DEFAULT 'predefined',
    status         task_status   NOT NULL DEFAULT 'unassigned',
    created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TASK_SKILLS  (maps tasks ↔ required skills)
-- =============================================================
CREATE TABLE task_skills (
    task_id   INT NOT NULL REFERENCES tasks(id)  ON DELETE CASCADE,
    skill_id  INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, skill_id)
);

-- =============================================================
-- ALLOCATIONS  (assignment records + analytics)
-- =============================================================
CREATE TYPE assignment_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

CREATE TABLE allocations (
    id                 SERIAL PRIMARY KEY,
    employee_id        INT             NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    task_id            INT             NOT NULL REFERENCES tasks(id)     ON DELETE CASCADE,
    suitability_score  NUMERIC(5,2),           -- 0.00 – 100.00, computed by skill match
    assignment_status  assignment_status NOT NULL DEFAULT 'pending',
    assigned_at        TIMESTAMP         NOT NULL DEFAULT NOW(),
    completed_at       TIMESTAMP,
    notes              TEXT,
    UNIQUE (employee_id, task_id)              -- one allocation per employee-task pair
);

-- =============================================================
-- PROFICIENCY WEIGHTS  (controls how proficiency affects suitability score)
-- =============================================================
CREATE TABLE proficiency_weights (
    proficiency  VARCHAR(20)  PRIMARY KEY,
    weight       NUMERIC(4,2) NOT NULL,   -- 0.00 – 1.00
    description  TEXT,
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_proficiency_values CHECK (proficiency IN ('beginner', 'intermediate', 'expert')),
    CONSTRAINT chk_weight_range       CHECK (weight BETWEEN 0.00 AND 1.00)
);

INSERT INTO proficiency_weights (proficiency, weight, description) VALUES
    ('beginner',     0.50, 'Knows the skill but needs guidance'),
    ('intermediate', 0.75, 'Works independently with the skill'),
    ('expert',       1.00, 'Deep knowledge, can mentor others');

-- =============================================================
-- PRIORITY WEIGHTS  (controls how task priority affects scoring order)
-- =============================================================
CREATE TABLE priority_weights (
    priority     task_priority PRIMARY KEY,
    weight       NUMERIC(4,2) NOT NULL,   -- 0.00 – 1.00
    description  TEXT,
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_priority_weight_range CHECK (weight BETWEEN 0.00 AND 1.00)
);

INSERT INTO priority_weights (priority, weight, description) VALUES
    ('low',    0.25, 'Nice to have, schedule when capacity allows'),
    ('medium', 0.50, 'Standard task, assign in normal flow'),
    ('high',   0.75, 'Important, prioritize over medium and low'),
    ('urgent', 1.00, 'Critical, must be assigned immediately');

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill    ON employee_skills(skill_id);
CREATE INDEX idx_task_skills_task         ON task_skills(task_id);
CREATE INDEX idx_task_skills_skill        ON task_skills(skill_id);
CREATE INDEX idx_allocations_employee     ON allocations(employee_id);
CREATE INDEX idx_allocations_task         ON allocations(task_id);
CREATE INDEX idx_allocations_status       ON allocations(assignment_status);
CREATE INDEX idx_tasks_status             ON tasks(status);
CREATE INDEX idx_tasks_priority           ON tasks(priority);

-- =============================================================
-- TRIGGER: auto-update employees.updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_updated
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_tasks_updated
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =============================================================
-- TRIGGER: sync current_workload when allocation status changes
-- =============================================================
CREATE OR REPLACE FUNCTION sync_employee_workload()
RETURNS TRIGGER AS $$
DECLARE
    v_effort NUMERIC(5,2);
BEGIN
    SELECT effort_hours INTO v_effort FROM tasks WHERE id = COALESCE(NEW.task_id, OLD.task_id);

    -- Allocation activated → add workload
    IF (TG_OP = 'INSERT' AND NEW.assignment_status = 'active')
       OR (TG_OP = 'UPDATE' AND NEW.assignment_status = 'active' AND OLD.assignment_status <> 'active')
    THEN
        UPDATE employees SET current_workload = current_workload + v_effort WHERE id = NEW.employee_id;

    -- Allocation completed/cancelled → remove workload
    ELSIF TG_OP = 'UPDATE'
      AND NEW.assignment_status IN ('completed', 'cancelled')
      AND OLD.assignment_status = 'active'
    THEN
        UPDATE employees SET current_workload = GREATEST(0, current_workload - v_effort) WHERE id = NEW.employee_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_workload
    AFTER INSERT OR UPDATE ON allocations
    FOR EACH ROW EXECUTE FUNCTION sync_employee_workload();