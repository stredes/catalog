import { z } from 'zod';

export const editorialModeSchema = z.enum(['basic', 'auto', 'custom']);

export type EditorialModeInput = z.infer<typeof editorialModeSchema>;
