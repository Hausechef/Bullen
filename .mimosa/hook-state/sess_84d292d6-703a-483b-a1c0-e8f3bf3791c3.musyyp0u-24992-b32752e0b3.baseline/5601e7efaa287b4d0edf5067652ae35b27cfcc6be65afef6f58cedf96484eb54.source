import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crmWorkersRouter from "./crm-workers";
import advertisersRouter from "./advertisers";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/crm", crmWorkersRouter);
router.use("/v1/advertisers", advertisersRouter);
router.use("/ai", aiRouter);

export default router;
