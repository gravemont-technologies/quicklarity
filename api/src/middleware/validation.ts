import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './errorHandler';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title required'),
  description: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  estimatedEffort: z.enum(['low', 'medium', 'high']).optional(),
  dependencies: z.array(z.string()).optional(),
  owner: z.string().optional(),
});

const UploadedDocSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  base64Content: z.string(),
  sizeBytes: z.number(),
});

const IntakeSchema = z.object({
  founderName: z.string().min(1, 'Founder name required'),
  founderEmail: z.string().email('Valid email required'),
  companyName: z.string().optional(),
  companyStage: z.enum(['idea', 'mvp', 'early-revenue', 'scaling']).optional(),
  founderRole: z.string().optional(),
  founderSkills: z.array(z.string()).optional(),
  tasks: z.array(TaskSchema).min(1, 'At least one task required'),
  contextNotes: z.string().optional(),
  uploadedDocs: z.array(UploadedDocSchema).optional(),
  tier: z.enum(['free', 'paid']),
  googleCalendarToken: z.string().optional(),
});

export const validateIntake = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    IntakeSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      next(new ValidationError(messages.join('; ')));
    } else {
      next(error);
    }
  }
};

