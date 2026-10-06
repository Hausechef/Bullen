import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crmWorkersRouter from "./crm-workers";
import advertisersRouter from "./advertisers";
import aiRouter from "./ai";
import depositsRouter from "./deposits";
import crmFilesRouter from "./crm-files";
import kycRouter from "./kyc";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/crm", crmWorkersRouter);
router.use("/crm", crmFilesRouter);
router.use("/v1/advertisers", advertisersRouter);
router.use("/ai", aiRouter);
router.use(depositsRouter);
router.use(kycRouter);
router.use(webhooksRouter);

export default router;
