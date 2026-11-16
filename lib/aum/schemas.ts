import { z } from 'zod';

export const downloadMessageSeedSchema = z
  .object({
    transferId: z.string().min(1),
    transferTimestamp: z.string().optional(),
    messageTypeCode: z.union([z.number(), z.string()]),
    messageType: z.string().optional()
  })
  .passthrough();

export const seedRequestSchema = z.union([
  z.object({
    fixture: z.enum(['moveIn', 'moveOut']),
    transferId: z.string().min(1).optional()
  }),
  z.object({
    message: downloadMessageSeedSchema
  })
]);

export type SeedRequest = z.infer<typeof seedRequestSchema>;
