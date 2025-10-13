// GET /status/:jobId - Get job status and results
const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

router.get('/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Build response based on status
    const response = {
      status: job.status,
    };
    
    if (job.status === 'done' && job.result) {
      response.notion_url = job.notion_url;
      response.ics_links = job.ics_links || [];
      response.result_summary = {
        top_5_titles: job.result.topPriorities?.slice(0, 5).map(p => p.taskTitle) || [],
        eta_minutes: job.result.metadata?.planningHorizon || 'TBD',
      };
    }
    
    if (job.status === 'errored') {
      response.error_message = job.error_message;
    }
    
    res.json(response);
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;

