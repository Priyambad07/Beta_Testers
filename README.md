# Skill Coverage Optimizer

> Intelligently match people to work. Built in one week. Deployed on day seven.

A full-stack web application that analyzes employee skill profiles, maps them against task requirements, and produces optimized, data-driven task allocations — eliminating manual guesswork from workload distribution.

**Live deployment** — [skilllcoverageoptimizer.vercel.app](https://skilllcoverageoptimizer.vercel.app)  
**Repository** — [github.com/Priyambad07/Beta_Testers](https://github.com/Priyambad07/Beta_Testers)

---

## The Team

Built during Week 1 of the Xebia internship program, under the mentorship of **Raygun Jose**.

| Name | Role |
|---|---|
| Shruti | Backend  |
| Daksh Mehrotra | Algorithm and Integration |
| Priyambad Suman | Database |
| Ishita Pradhan | Frontend |
| Pranav Rai | Frontend |

**Team Name:** Beta Testers

---

## What It Does

Organizations struggle to answer a deceptively simple question: *who should do what?* Manual assignment ignores skill gaps, overloads strong performers, and leaves underutilized bandwidth invisible.

The Skill Coverage Optimizer solves this by scoring every employee-task pairing using a weighted suitability algorithm, then greedily allocating tasks in priority order — urgent work goes to the best-matched available person, every time.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│   React + TypeScript + Tailwind CSS              │
│   ┌──────────┬──────────┬──────────┬──────────┐ │
│   │  Team    │  Tasks   │Dashboard │ Optimize │ │
│   └──────────┴──────────┴──────────┴──────────┘ │
└────────────────────┬────────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────────┐
│              Express.js API Server               │
│                                                  │
│  /api/employees    /api/tasks    /api/optimize   │
│  /api/skills       /api/dashboard  /api/allocations│
│                                                  │
│           Optimization Service                   │
│  score = (matched/total) x avg_proficiency       │
│            x priority_weight x 100               │
└────────────────────┬────────────────────────────┘
                     │ Supabase JS Client
┌────────────────────▼────────────────────────────┐
│                  Supabase                        │
│                                                  │
│  employees    employee_skills    tasks           │
│  task_skills  skills             allocations     │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

```
employees
├── id (uuid, PK)
├── name
├── role
├── total_capacity (hours)
├── current_workload (hours)
└── remaining_capacity (computed)

skills
├── id (uuid, PK)
└── name

employee_skills
├── employee_id (FK → employees)
├── skill_id    (FK → skills)
└── proficiency  [beginner | intermediate | expert]

tasks
├── id (uuid, PK)
├── title
├── description
├── priority     [low | medium | high | urgent]
├── effort_hours
└── status       [unassigned | assigned | in_progress | completed]

task_skills
├── task_id  (FK → tasks)
└── skill_id (FK → skills)

allocations
├── employee_id       (FK → employees)
├── task_id           (FK → tasks)
├── suitability_score
└── assignment_status
```

---

## The Scoring Algorithm

The core of the system is a deterministic suitability scoring function. For every employee-task pair:

```
score = (matched_skills / total_required_skills)
      x avg(proficiency_weight of matched skills)
      x priority_weight
      x 100
```

**Proficiency weights:**

| Level | Weight |
|---|---|
| beginner | 0.5 |
| intermediate | 0.75 |
| expert | 1.0 |

**Priority weights:**

| Priority | Weight |
|---|---|
| low | 0.25 |
| medium | 0.5 |
| high | 0.75 |
| urgent | 1.0 |

**Match status thresholds:**

| Score | Label |
|---|---|
| >= 60 | OPTIMAL |
| >= 30 | GOOD |
| > 0 | LOW MATCH |
| 0 | NO MATCH |

**Allocation flow:**

```
Unassigned tasks
      │
      ▼
Sort by priority (urgent → high → medium → low)
      │
      ▼
For each task:
  Filter employees with remaining_capacity >= effort_hours
      │
      ▼
  Score all eligible employees
      │
      ▼
  Assign to highest scorer
  (tie-break: higher remaining capacity wins)
      │
      ▼
  Deduct effort_hours from employee capacity
      │
      ▼
Next task
```

---

## API Reference

### Employees

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | List all employees with skill profiles |
| POST | `/api/employees` | Create a new employee |
| PUT | `/api/employees/:id` | Update employee details |
| DELETE | `/api/employees/:id` | Remove an employee |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List all tasks with required skills |
| POST | `/api/tasks` | Create a new task |
| PUT | `/api/tasks/:id` | Update task details |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/tasks/:id/assign` | Manually assign a task |

### Optimization

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/optimize` | Run optimization engine |

Request body:
```json
{ "save": false }
```

Set `save: true` to persist allocations to the database and update task statuses. Set `save: false` for a dry run — preview results without committing.

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Aggregated metrics and insights |

Returns employee utilization, task status breakdown, top demanded skills, and auto-generated workload insights.

### Other

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/skills` | List all skills |
| GET | `/api/allocations` | List all current allocations |
| GET | `/api/health` | Health check |

---

## Application Pages

### Team
View all employees, their roles, current workload, total capacity, and assigned skills with proficiency levels. Create and edit employee profiles including multi-skill assignments.

### Tasks
Manage the task backlog. Create tasks with priority levels, effort hour estimates, and required skill tags. Manually assign tasks or leave them for the optimizer.

### Dashboard
Live analytics view. Shows employee utilization bars, task status distribution, top demanded skills across all open work, and AI-generated insights flagging overloaded or underutilized team members and urgent unassigned tasks.

### Optimize
One-click optimization. Preview the full allocation plan — every unassigned task paired with the best-matched employee, suitability scores, match status labels, and remaining capacity projections. Confirm to save the results.

---

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS
- Chart.js for data visualization
- Vite for bundling
- Lucide React for icons

**Backend**
- Node.js with Express
- Supabase JS client for database access
- dotenv for environment config
- nodemon for development

**Database & Auth**
- Supabase (PostgreSQL)

**Deployment**
- Vercel (frontend + serverless)

---

## Local Development

### Prerequisites

- Node.js 18+
- A Supabase project with the schema above

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/Priyambad07/Beta_Testers.git
cd Beta_Testers
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

**3. Install and run the frontend**

```bash
npm install
npm run dev
```

Frontend runs at [http://localhost:5173](http://localhost:5173)

**4. Install and run the backend**

```bash
cd backend
npm install
npm run dev
```

API runs at [http://localhost:3001](http://localhost:3001)

**5. Health check**

```
GET http://localhost:3001/api/health
→ { "status": "ok", "timestamp": "..." }
```

### Build for production

```bash
npm run build
```

---

## Project Structure

```
Skill_Coverage_Optimizer/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component and navigation
│   ├── screens/
│   │   ├── TeamPage/             # Employee management view
│   │   ├── TasksPage/            # Task management view
│   │   ├── DashboardPage/        # Analytics and insights
│   │   └── OptimizePage/         # Optimization engine UI
│   ├── components/
│   │   ├── EmployeeModal.tsx     # Create/edit employee form
│   │   ├── TeamModal.tsx         # Team management modal
│   │   └── ui/                   # Shared UI primitives
│   └── lib/
│       └── supabase.ts           # Supabase client init
│
├── backend/
│   ├── server.js                 # Express server entry point
│   ├── routes/                   # Route definitions
│   │   ├── employees.js
│   │   ├── tasks.js
│   │   ├── skills.js
│   │   ├── optimize.js
│   │   ├── dashboard.js
│   │   └── allocations.js
│   ├── controllers/              # Request handlers
│   │   ├── employeeController.js
│   │   ├── taskController.js
│   │   ├── skillController.js
│   │   ├── optimizeController.js
│   │   └── dashboardController.js
│   ├── services/
│   │   └── optimizationService.js  # Core scoring algorithm
│   ├── middleware/
│   │   └── errorHandler.js
│   └── config/
│       └── supabase.js           # Backend Supabase client
│
├── .env.example
├── package.json
└── README.md
```

---

## Key Design Decisions

**Greedy allocation over global optimization** — tasks are sorted by priority and assigned one by one to the current best-available match. This is O(T x E) per run, predictable, and explainable. A globally optimal assignment (Hungarian algorithm, LP) would be more theoretically correct but opaque to end users — a manager needs to understand *why* someone was assigned a task.

**Dry-run by default** — the `POST /api/optimize` endpoint previews results without mutating state unless `save: true` is passed. This lets teams review the plan before committing.

**Supabase for storage** — removes the need to manage a database server during a one-week sprint while still providing a real relational schema with row-level security available when needed.

---

## Acknowledgements

Built under the mentorship of **Raygun Jose** at Xebia, as part of the Week 1 internship project.

---

*Beta Testers — Xebia Internship, 2026*
