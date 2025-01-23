import { z } from 'zod'

export const createReportSchema = z.object({
  title: z.string().min(1, "Title is required"),
  originalFileName: z.string().min(1, "Original file name is required"),
  fileUrl: z.string().url("Invalid file URL"),
  filePath: z.string().optional(),
  fileType: z.enum(["PDF", "IMAGE", "TEXT"]),
  fileSize: z.number().positive().optional()
})

export type CreateReportInput = z.infer<typeof createReportSchema>

export const reportResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  createdAt: z.date(),
  fileUrl: z.string()
})
