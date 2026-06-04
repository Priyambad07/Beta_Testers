const supabase = require('../config/supabase');

// GET /api/employees
async function getEmployees(req, res, next) {
  try {
    const { skill, role, search } = req.query;

    let query = supabase
      .from('employees')
      .select(`
        *,
        employee_skills (
          proficiency,
          skill_id,
          skills ( id, name, category )
        )
      `)
      .order('name');

    const { data, error } = await query;
    if (error) throw error;

    let result = data;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        (e.role || '').toLowerCase().includes(s)
      );
    }

    if (skill) {
      result = result.filter(e =>
        (e.employee_skills || []).some(es => es.skills?.name === skill)
      );
    }

    if (role) {
      result = result.filter(e => e.role === role);
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

// POST /api/employees
async function createEmployee(req, res, next) {
  try {
    const { name, email, role, total_capacity = 40, skills = [] } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    const { data: emp, error } = await supabase
      .from('employees')
      .insert({ name, email, role, total_capacity })
      .select()
      .single();
    if (error) throw error;

    if (skills.length > 0) {
      await supabase.from('employee_skills').insert(
        skills.map(s => ({ employee_id: emp.id, skill_id: s.skill_id, proficiency: s.proficiency }))
      );
    }

    const { data: full } = await supabase
      .from('employees')
      .select('*, employee_skills(proficiency, skill_id, skills(id, name))')
      .eq('id', emp.id)
      .single();

    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
}

// PUT /api/employees/:id
async function updateEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, total_capacity, skills } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (role !== undefined) updates.role = role;
    if (total_capacity !== undefined) updates.total_capacity = total_capacity;

    const { error } = await supabase.from('employees').update(updates).eq('id', id);
    if (error) throw error;

    if (skills !== undefined) {
      await supabase.from('employee_skills').delete().eq('employee_id', id);
      if (skills.length > 0) {
        await supabase.from('employee_skills').insert(
          skills.map(s => ({ employee_id: Number(id), skill_id: s.skill_id, proficiency: s.proficiency }))
        );
      }
    }

    const { data } = await supabase
      .from('employees')
      .select('*, employee_skills(proficiency, skill_id, skills(id, name))')
      .eq('id', id)
      .single();

    res.json(data);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/employees/:id
async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };
