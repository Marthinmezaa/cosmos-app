import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { asyncHandler } from "../../utils/async-handler";
import { presignUploadHandler } from "./uploads.controller";

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);

// Mismos roles que pueden dar de alta un cliente con fotos.
uploadsRouter.post("/presign", authorize("admin", "vendedor"), asyncHandler(presignUploadHandler));
