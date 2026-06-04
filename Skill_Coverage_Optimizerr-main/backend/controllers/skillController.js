const supabase = require('../config/supabase');

// GET /api/skills
async function getSkills(req, res, next) {
  try {
    const { data, error } = await supabase.from('skills').select('*').order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
}

// POST /api/skills
async function createSkill(req, res, next) {
  try {
    const { name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Skill name is required' });
    const { data, error } = await supabase
      .from('skills')
      .insert({ name, category })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSkills, createSkill };
