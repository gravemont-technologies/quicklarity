import { Router } from 'express';
import { handleIntake } from '../controllers/intakeController';
import { validateIntake } from '../middleware/validation';

const router = Router();

/**
 * POST /api/intake
 * 
 * Accepts founder quiz submission from lovable.dev frontend.
 * Validates input, stores in Supabase, enqueues job, returns jobId.
 */
router.post('/', validateIntake, handleIntake);

export default router;

