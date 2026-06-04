const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/allocations — create a single allocation
router.post('/', async (req, res, next) => {
  try {
    const { employee_id, task_id, suitability_score = 0, assignment_status = 'active' } = req.body;
    if (!employee_id || !task_id) return res.status(400).json({ error: 'employee_id and task_id are required' });

    const { data, error } = await supabase
      .from('allocations')
      .upsert({ employee_id, task_id, suitability_score, assignment_status }, { onConflict: 'employee_id,task_id' })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
