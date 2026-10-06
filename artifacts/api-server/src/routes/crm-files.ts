import { Router } from "express";
import { adaptHandler } from "../lib/adapter";
import clientFilesHandler from "../../../../api/crm/clients/[id]/files/index";

const router = Router({ mergeParams: true });

router.get("/clients/:id/files", adaptHandler(clientFilesHandler));
router.post("/clients/:id/files", adaptHandler(clientFilesHandler));
router.delete("/clients/:id/files", adaptHandler(clientFilesHandler));

export default router;
