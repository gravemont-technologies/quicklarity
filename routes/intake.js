// POST /intake - Accept strategic planning submission
const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const { supabase } = require('../lib/supabaseClient');
const { enqueueJob } = require('../lib/queueClient');
const { trackEvent } = require('../lib/posthogClient');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// Validation helper
function validateIntakePayload(body) {
  const required = ['name', 'email', 'tasks'];
  for (const field of required) {
    if (!body[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (!Array.isArray(body.tasks) || body.tasks.length === 0) {
    throw new Error('tasks must be a non-empty array');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    throw new Error('Invalid email format');
  }
  
  return true;
}

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const payload = req.body;
    
    // Validate payload
    validateIntakePayload(payload);
    
    // Determine if guest or authenticated
    const isGuest = payload.guest === true || !req.auth?.userId;
    let founderId = null;
    let founderRole = 'free';
    
    if (!isGuest && req.auth?.userId) {
      // Look up founder by Clerk ID
      const { data: founder } = await supabase
        .from('founders')
        .select('*')
        .eq('clerk_id', req.auth.userId)
        .single();
      
      if (founder) {
        founderId = founder.id;
        founderRole = founder.role;
      } else {
        // Create founder record
        const { data: newFounder, error } = await supabase
          .from('founders')
          .insert({
            clerk_id: req.auth.userId,
            email: payload.email,
            name: payload.name,
            company: payload.company || null,
            role: 'free',
          })
          .select()
          .single();
        
        if (error) throw error;
        founderId = newFounder.id;
      }
    }
    
    // Create job
    const jobId = nanoid(16);
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        founder_id: founderId,
        status: 'queued',
        input: payload,
      })
      .select()
      .single();
    
    if (jobError) throw jobError;
    
    // Enqueue for processing
    await enqueueJob(jobId, payload, founderRole);
    
    // Track event
    await trackEvent({
      distinctId: req.auth?.userId || `guest_${payload.email}`,
      event: 'intake_submitted',
      properties: {
        jobId,
        isGuest,
        founderRole,
        taskCount: payload.tasks.length,
        hasCalendarOAuth: !!payload.calendar_oauth,
      },
    });
    
    // Calculate ETA (simple estimation)
    const taskCount = payload.tasks.length;
    const docCount = (payload.docs || []).length;
    const etaSeconds = 30 + taskCount * 3 + docCount * 15;
    
    res.status(202).json({
      jobId,
      eta_seconds: etaSeconds,
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;

