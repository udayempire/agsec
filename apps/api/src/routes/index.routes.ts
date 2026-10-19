import { Router } from "express";
import { auditLogsRouter } from "./auditLogs.routes";
import { userRouter } from "./user.routes";

export const indexRouter = Router();

indexRouter.use(auditLogsRouter);
indexRouter.use(userRouter);
