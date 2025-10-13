import { Router } from 'express';
import { handleStatus } from '../controllers/statusController';

const router = Router();

/**
 * GET /api/status/:jobId
 * 
 * Returns current status of a job.
 * Frontend polls this endpoint until status is 'completed' or 'failed'.
 */
router.get('/:jobId', handleStatus);

export default router;

