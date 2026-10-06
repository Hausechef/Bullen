import { Router } from "express";
import { adaptHandler } from "../lib/adapter";
import kycAnalyzeHandler from "../../../../api/kyc/analyze-external";

const router = Router();

router.post("/kyc/analyze-external", adaptHandler(kycAnalyzeHandler));

export default router;
