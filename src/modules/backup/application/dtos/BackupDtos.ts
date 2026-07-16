import { z } from 'zod';

export const CreateBackupSchema = z.object({
  label: z.string().min(1, 'La etiqueta es requerida').max(100),
  trigger: z.enum(['manual', 'auto-before-delete', 'auto-periodic', 'auto-before-seed']),
});

export type CreateBackupInput = z.infer<typeof CreateBackupSchema>;

export const RestoreBackupSchema = z.object({
  backupId: z.string().min(1, 'ID de backup requerido'),
  confirmRestore: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar la restauración' }),
  }),
});

export type RestoreBackupInput = z.infer<typeof RestoreBackupSchema>;

export const ListBackupsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export type ListBackupsInput = z.infer<typeof ListBackupsSchema>;

export const DeleteBackupSchema = z.object({
  backupId: z.string().min(1, 'ID de backup requerido'),
});

export type DeleteBackupInput = z.infer<typeof DeleteBackupSchema>;

export const AutoBackupConfigSchema = z.object({
  enabled: z.boolean(),
  maxSnapshots: z.number().int().min(1).max(50).default(10),
  changeThreshold: z.number().int().min(1).default(5),
});

export type AutoBackupConfig = z.infer<typeof AutoBackupConfigSchema>;
