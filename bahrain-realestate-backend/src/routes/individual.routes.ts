import { Router } from "express";
import { individualAuthMiddleware } from "../middleware/auth";
import { upload } from "../middleware/upload";
import {
	createMyProperty,
	getMyProfile,
	getMyProperties,
	submitMyProperty,
	updateMyProfile,
	updateMyProperty,
} from "../controllers/individual.controller";
import {
	registerPushTokenController,
	unregisterPushTokenController,
} from "../controllers/push.controller";

const router = Router();

router.get("/me", individualAuthMiddleware, getMyProfile);
router.patch("/me", individualAuthMiddleware, upload.single('profileImage'), updateMyProfile);
router.get("/properties", individualAuthMiddleware, getMyProperties);
router.post("/properties", individualAuthMiddleware, upload.fields([{ name: 'images', maxCount: 12 }, { name: 'videos', maxCount: 5 }]), createMyProperty);
router.patch("/properties/:id", individualAuthMiddleware, updateMyProperty);
router.post("/properties/:id/submit", individualAuthMiddleware, submitMyProperty);
router.post("/push/register", individualAuthMiddleware, registerPushTokenController);
router.post("/push/unregister", individualAuthMiddleware, unregisterPushTokenController);

export default router;
