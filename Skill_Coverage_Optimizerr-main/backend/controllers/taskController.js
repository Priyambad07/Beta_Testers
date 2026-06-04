const supabase = require('../config/supabase');

// GET /api/tasks
async function getTasks(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        task_skills (
          skill_id,
          skills ( id, name, category )
        ),
        allocations (
          id, employee_id, suitability_score, assignment_status,
          employees ( id, name, role )
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const { name, description, effort_hours = 0, priority = 'medium', task_type, skills = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'Task name is required' });

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({ name, description, effort_hours, priority, task_type, status: 'unassigned' })
      .select()
      .single();
    if (error) throw error;

    if (skills.length > 0) {
      await supabase.from('task_skills').insert(
        skills.map(sid => ({ task_id: task.id, skill_id: sid }))
      );
    }

    const { data: full } = await supabase
      .from('tasks')
      .select('*, task_skills(skill_id, skills(id, name))')
      .eq('id', task.id)
      .single();

    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, effort_hours, priority, task_type, status, skills } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (effort_hours !== undefined) updates.effort_hours = effort_hours;
    if (priority !== undefined) updates.priority = priority;
    if (task_type !== undefined) updates.task_type = task_type;
    if (status !== undefined) updates.status = status;

    const { error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) throw error;

    if (skills !== undefined) {
      await supabase.from('task_skills').delete().eq('task_id', id);
      if (skills.length > 0) {
        await supabase.from('task_skills').insert(
          skills.map(sid => ({ task_id: Number(id), skill_id: sid }))
        );
      }
    }

    const { data } = await supabase
      .from('tasks')
      .select('*, task_skills(skill_id, skills(id, name))')
      .eq('id', id)
      .single();

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// POST /api/tasks/:id/assign
async function assignTask(req, res, next) {
  try {
    const { id } = req.params;
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'employee_id is required' });

    await supabase.from('allocations').upsert(
      { employee_id, task_id: Number(id), suitability_score: 0, assignment_status: 'active' },
      { onConflict: 'employee_id,task_id' }
    );
    await supabase.from('tasks').update({ status: 'assigned' }).eq('id', id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, assignTask };
