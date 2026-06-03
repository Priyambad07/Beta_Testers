# Task Allocation System — Database

**Feature branch:** `feature/priyambad-database-design`  
**Database:** PostgreSQL 16  
**Purpose:** Store employee skills and capacity, define tasks, and track assignments using a rule-based suitability scoring system.


---

## Database Architecture

```
employees
    ↓
employee_skills ←── skills ──→ task_skills
    ↓                               ↑
allocations ←────── tasks ──────────┘

proficiency_weights  (scoring config)
priority_weights     (scoring config)
```

---

## Tables

### `skills`
Master list of all skills in the system.

| Column | Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Skill name, e.g. `PostgreSQL` |
| category | VARCHAR(100) | Group, e.g. `backend`, `frontend`, `ai` |

---

### `employees`
Stores employee info and tracks workload in real time.

| Column | Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Full name |
| email | VARCHAR(255) | Unique email |
| role | VARCHAR(100) | Job title |
| total_capacity | NUMERIC | Max hours available per week (default 40) |
| current_workload | NUMERIC | Hours currently assigned |
| remaining_capacity | NUMERIC | **Auto-computed:** `total_capacity - current_workload` |

> `remaining_capacity` is a generated column — never set it manually.

---

### `employee_skills`
Maps which employees have which skills, with proficiency level.

| Column | Type | Description |
|---|---|---|
| employee_id | INT | FK → employees |
| skill_id | INT | FK → skills |
| proficiency | VARCHAR | `beginner` / `intermediate` / `expert` |

---

### `tasks`
Stores both predefined and custom tasks.

| Column | Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| name | VARCHAR(255) | Task name |
| description | TEXT | Optional details |
| effort_hours | NUMERIC | Estimated hours to complete |
| priority | ENUM | `low` / `medium` / `high` / `urgent` |
| task_type | ENUM | `predefined` / `custom` |
| status | ENUM | `unassigned` → `assigned` → `in_progress` → `completed` |

---

### `task_skills`
Maps which skills are required to complete a task.

| Column | Type | Description |
|---|---|---|
| task_id | INT | FK → tasks |
| skill_id | INT | FK → skills |

---

### `allocations`
Records every task assignment. Central table for analytics and reporting.

| Column | Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| employee_id | INT | FK → employees |
| task_id | INT | FK → tasks |
| suitability_score | NUMERIC | 0–100, computed by scoring algorithm |
| assignment_status | ENUM | `pending` / `active` / `completed` / `cancelled` |
| assigned_at | TIMESTAMP | When the allocation was created |
| completed_at | TIMESTAMP | When marked completed (nullable) |
| notes | TEXT | Optional remarks |

> One employee can only have one allocation per task (enforced by UNIQUE constraint).

---

### `proficiency_weights` *(scoring config)*
Controls how much each proficiency level contributes to the suitability score.

| proficiency | weight |
|---|---|
| beginner | 0.50 |
| intermediate | 0.75 |
| expert | 1.00 |

---

### `priority_weights` *(scoring config)*
Controls how much task priority affects the scoring order.

| priority | weight |
|---|---|
| low | 0.25 |
| medium | 0.50 |
| high | 0.75 |
| urgent | 1.00 |

> Both weight tables can be updated at any time to tune the algorithm without changing code.

---

## Suitability Score Formula

Used by the backend algorithm (Daksh) to rank employees for a task:

```
suitability_score =
  (matched_skills / total_required_skills)
  × avg(proficiency_weight of matched skills)
  × priority_weight of the task
  × 100
```

**Example:** Task requires Python + FastAPI. Employee has Python (expert=1.00) and FastAPI (intermediate=0.75). Task priority is high (0.75).

```
= (2/2) × ((1.00 + 0.75) / 2) × 0.75 × 100
= 1.0 × 0.875 × 0.75 × 100
= 65.63
```

---

## Triggers

### `trg_sync_workload`
Fires on every `INSERT` or `UPDATE` on `allocations`.

- Allocation set to `active` → adds `effort_hours` to employee's `current_workload`
- Allocation set to `completed` or `cancelled` → subtracts `effort_hours` back

This means `remaining_capacity` always reflects real-time availability — no manual updates needed.

### `trg_employees_updated` / `trg_tasks_updated`
Auto-updates `updated_at` timestamp on any row change.

---

## Key Business Rules

- An employee **cannot be assigned** a task if `remaining_capacity < effort_hours`
- Each employee can only have **one allocation per task**
- `remaining_capacity` is read-only — computed automatically
- `urgent` tasks must be processed first by the algorithm
- Workload updates are handled by the database trigger — the backend does not need to manage this manually

---

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Creates all tables, enums, indexes, triggers |
| `seed.sql` | Inserts sample employees, skills, tasks, allocations |
| `README.md` | This file |