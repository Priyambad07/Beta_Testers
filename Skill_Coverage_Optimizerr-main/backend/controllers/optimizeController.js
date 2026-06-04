const supabase = require('../config/supabase');
const { runOptimization } = require('../services/optimizationService');

// POST /api/optimize
async function optimize(req, res, next) {
  try {
    const { save = false } = req.body;
    const results = await runOptimization();

    if (save) {
      for (const r of results) {
        if (!r.employee) continue;
        await supabase.from('allocations').upsert(
          {
            employee_id: r.employee.id,
            task_id: r.task.id,
            suitability_score: r.suitabilityScore,
            assignment_status: 'active',
          },
          { onConflict: 'employee_id,task_id' }
        );
        await supabase.from('tasks').update({ status: 'assigned' }).eq('id', r.task.id);
      }
    }

    res.json({ results, saved: save });
  } catch (err) {
    next(err);
  }
}

module.exports = { optimize };
