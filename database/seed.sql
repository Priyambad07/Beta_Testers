-- =============================================================
-- Task Allocation System — Seed Data
-- Run AFTER schema.sql
-- Note: proficiency_weights and priority_weights are seeded
--       directly in schema.sql as they are config, not sample data.
-- =============================================================

-- =============================================================
-- SKILLS
-- =============================================================
INSERT INTO skills (id, name, category) VALUES
    (1,  'PostgreSQL',       'database'),
    (2,  'Python',           'backend'),
    (3,  'FastAPI',          'backend'),
    (4,  'React',            'frontend'),
    (5,  'TypeScript',       'frontend'),
    (6,  'Machine Learning', 'ai'),
    (7,  'Data Analysis',    'data'),
    (8,  'Docker',           'devops'),
    (9,  'REST API Design',  'backend'),
    (10, 'UI/UX Design',     'frontend');

-- Reset sequence to avoid PK conflicts after explicit IDs
SELECT setval('skills_id_seq', 10);

-- =============================================================
-- EMPLOYEES
-- =============================================================
INSERT INTO employees (id, name, email, role, total_capacity, current_workload) VALUES
    (1, 'Priyambad', 'priyambad@team.dev', 'Database Engineer',     40, 0),
    (2, 'Daksh',     'daksh@team.dev',     'AI/ML Engineer',        40, 0),
    (3, 'Anika',     'anika@team.dev',     'Frontend Developer',    40, 0),
    (4, 'Rohan',     'rohan@team.dev',     'Backend Developer',     40, 0),
    (5, 'Meera',     'meera@team.dev',     'Full Stack Developer',  40, 0);

SELECT setval('employees_id_seq', 5);

-- =============================================================
-- EMPLOYEE_SKILLS
-- =============================================================
INSERT INTO employee_skills (employee_id, skill_id, proficiency) VALUES
    -- Priyambad: database + backend
    (1, 1, 'expert'),        -- PostgreSQL
    (1, 2, 'intermediate'),  -- Python
    (1, 9, 'intermediate'),  -- REST API Design

    -- Daksh: AI + data
    (2, 6, 'expert'),        -- Machine Learning
    (2, 7, 'expert'),        -- Data Analysis
    (2, 2, 'expert'),        -- Python
    (2, 3, 'intermediate'),  -- FastAPI

    -- Anika: frontend
    (3, 4, 'expert'),        -- React
    (3, 5, 'expert'),        -- TypeScript
    (3, 10,'expert'),        -- UI/UX Design

    -- Rohan: backend
    (4, 2, 'expert'),        -- Python
    (4, 3, 'expert'),        -- FastAPI
    (4, 9, 'expert'),        -- REST API Design
    (4, 8, 'intermediate'),  -- Docker

    -- Meera: full stack
    (5, 4, 'intermediate'),  -- React
    (5, 2, 'intermediate'),  -- Python
    (5, 3, 'intermediate'),  -- FastAPI
    (5, 8, 'expert');        -- Docker

-- =============================================================
-- TASKS
-- =============================================================
INSERT INTO tasks (id, name, description, effort_hours, priority, task_type, status) VALUES
    (1, 'Design core database schema',
        'Create tables for employees, tasks, allocations, and skills.',
        8, 'high', 'predefined', 'completed'),

    (2, 'Write seed data',
        'Populate all tables with realistic sample data.',
        4, 'medium', 'predefined', 'in_progress'),

    (3, 'Build REST API for task allocation',
        'CRUD endpoints for employees, tasks, and allocation management.',
        16, 'high', 'predefined', 'assigned'),

    (4, 'Develop skill-matching algorithm',
        'Score employees against task requirements and rank by suitability.',
        12, 'urgent', 'predefined', 'assigned'),

    (5, 'Build task management dashboard',
        'React UI showing employee workloads, task status, and allocations.',
        20, 'high', 'predefined', 'unassigned'),

    (6, 'Containerize application with Docker',
        'Dockerfile and docker-compose for local dev and staging.',
        6, 'medium', 'predefined', 'unassigned'),

    (7, 'Generate workload analytics report',
        'Custom report: utilization rate per employee over last 30 days.',
        5, 'low', 'custom', 'unassigned'),

    (8, 'Integrate ML model for auto-assignment',
        'Use trained model to auto-suggest best employee for incoming tasks.',
        18, 'urgent', 'custom', 'unassigned');

SELECT setval('tasks_id_seq', 8);

-- =============================================================
-- TASK_SKILLS
-- =============================================================
INSERT INTO task_skills (task_id, skill_id) VALUES
    (1, 1),   -- schema design → PostgreSQL
    (2, 1),   -- seed data     → PostgreSQL
    (2, 2),   -- seed data     → Python
    (3, 3),   -- REST API      → FastAPI
    (3, 9),   -- REST API      → REST API Design
    (3, 2),   -- REST API      → Python
    (4, 6),   -- skill match   → Machine Learning
    (4, 7),   -- skill match   → Data Analysis
    (4, 2),   -- skill match   → Python
    (5, 4),   -- dashboard     → React
    (5, 5),   -- dashboard     → TypeScript
    (5, 10),  -- dashboard     → UI/UX Design
    (6, 8),   -- docker        → Docker
    (7, 7),   -- analytics     → Data Analysis
    (7, 1),   -- analytics     → PostgreSQL
    (8, 6),   -- ML integrate  → Machine Learning
    (8, 2);   -- ML integrate  → Python

-- =============================================================
-- ALLOCATIONS
-- =============================================================
INSERT INTO allocations (employee_id, task_id, suitability_score, assignment_status, notes) VALUES
    (1, 1, 98.00, 'completed', 'Schema designed and reviewed by team.'),
    (1, 2, 91.00, 'active',    'Seed data in progress.'),
    (4, 3, 95.00, 'active',    'Rohan leading API development.'),
    (2, 4, 97.00, 'active',    'Daksh building the skill-matching algorithm.');

-- The workload trigger will fire on 'active' inserts above.
-- Verify with: SELECT name, current_workload, remaining_capacity FROM employees;