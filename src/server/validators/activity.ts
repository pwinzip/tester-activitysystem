import { z } from "zod";

const activityStatus = z.enum(["DRAFT", "OPEN", "CLOSED", "CANCELLED"]);

export const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().optional(),
    activityDate: z.coerce.date(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().trim().min(1, "Location is required"),
  })
  .refine((d) => d.endTime.getTime() > d.startTime.getTime(), {
    path: ["endTime"],
    message: "endTime must be after startTime",
  });

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    activityDate: z.coerce.date().optional(),
    startTime: z.coerce.date().optional(),
    endTime: z.coerce.date().optional(),
    location: z.string().trim().min(1).optional(),
  })
  .superRefine((d, ctx) => {
    if (
      d.startTime &&
      d.endTime &&
      d.endTime.getTime() <= d.startTime.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be after startTime",
      });
    }
  });

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const changeStatusSchema = z.object({
  status: activityStatus,
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

export const listActivitiesQuerySchema = z.object({
  status: activityStatus.optional(),
});
