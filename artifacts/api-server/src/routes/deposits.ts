import { Router } from "express";
import { adaptHandler } from "../lib/adapter";

// Vercel-style handlers reuse business logic unchanged.
import depositsIndexHandler from "../../../../api/deposits/index";
import depositsIdHandler from "../../../../api/deposits/[id]";
import depositsConfigHandler from "../../../../api/deposits/config";
import adminDepositsIndexHandler from "../../../../api/admin/deposits/index";
import adminDepositsIdHandler from "../../../../api/admin/deposits/[id]";
import adminPaymentsHandler from "../../../../api/admin/payments/trapay/index";
import adminPaymentsTestHandler from "../../../../api/admin/payments/trapay/test";

const router = Router();

router.get("/deposits", adaptHandler(depositsIndexHandler));
router.post("/deposits", adaptHandler(depositsIndexHandler));
router.get("/deposits/config", adaptHandler(depositsConfigHandler));
router.get("/deposits/:id", adaptHandler(depositsIdHandler));

router.get("/admin/deposits", adaptHandler(adminDepositsIndexHandler));
router.get("/admin/deposits/:id", adaptHandler(adminDepositsIdHandler));
router.post("/admin/deposits/:id", adaptHandler(adminDepositsIdHandler));

router.get("/admin/payments/trapay", adaptHandler(adminPaymentsHandler));
router.post("/admin/payments/trapay", adaptHandler(adminPaymentsHandler));
router.patch("/admin/payments/trapay", adaptHandler(adminPaymentsHandler));
router.post("/admin/payments/trapay/test", adaptHandler(adminPaymentsTestHandler));

export default router;
