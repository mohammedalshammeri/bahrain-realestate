import { Router } from "express";
import {
  getProfile,
  updateProfile,
  createProperty,
  getCompanyProperties,
  getCompanyProperty,
  updateProperty,
  deleteProperty,
  getIndividualPropertyOffers,
  getIndividualPropertyOffer,
  respondToIndividualPropertyOffer,
  getCompanyEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  addPropertyImage,
  deletePropertyImage,
  featureProperty,
  getFeaturedAdsBalance,
  getCompanyComplaints,
  createPaymentRequest,
  createPaymentSession,
  handleAfsCallback,
  getCompanyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createSubscriptionRequest,
  getCompanyFeaturedPackages,
  createFeaturedPackage,
  cancelFeaturedPackage,
  extendFeaturedPackage,
  updatePropertyWithLocation,
  getCompanySubscriptionHistory,
} from "../controllers/company.controller";
import {
  createPaymentIntentController,
  handlePaymentSuccessController,
  handlePaymentFailureController,
  getPaymentController,
  getCompanyPaymentsController,
  afsPaymentSuccessRedirect,
  afsPaymentFailureRedirect,
} from "../controllers/payment.controller";
import {
  createBoostController,
  getCompanyActiveBoostsController,
  getCompanyBoostsController,
  getBoostController,
  cancelBoostController,
  extendBoostController,
  getCompanyBoostStatsController,
} from "../controllers/boost.controller";
import {
  registerPushTokenController,
  unregisterPushTokenController,
  sendPushNotificationController,
  getPushNotificationHistoryController,
} from "../controllers/push.controller";
import { companyEmployeeAuthMiddleware, AuthRequest } from "../middleware/auth";
import { deleteCompanyAccountController } from "../controllers/deleteAccount.controller";
import { upload } from "../middleware/upload";

const router = Router();

// Account management
router.delete("/account", companyEmployeeAuthMiddleware, deleteCompanyAccountController);

// Company profile
router.get("/profile", companyEmployeeAuthMiddleware, getProfile);
router.patch("/profile", companyEmployeeAuthMiddleware, updateProfile);

// Company properties
router.post("/properties", companyEmployeeAuthMiddleware, upload.fields([{ name: 'images', maxCount: 12 }, { name: 'videos', maxCount: 5 }]), createProperty);
router.get("/properties", companyEmployeeAuthMiddleware, getCompanyProperties);
router.get("/properties/:id", companyEmployeeAuthMiddleware, getCompanyProperty);
router.patch("/properties/:id", companyEmployeeAuthMiddleware, updateProperty);
router.delete("/properties/:id", companyEmployeeAuthMiddleware, deleteProperty);

// Individual property offers (marketing)
router.get(
  "/individual-property-offers",
  companyEmployeeAuthMiddleware,
  getIndividualPropertyOffers
);

router.get(
  "/individual-property-offers/:id",
  companyEmployeeAuthMiddleware,
  getIndividualPropertyOffer
);

router.patch(
  "/individual-property-offers/:id",
  companyEmployeeAuthMiddleware,
  respondToIndividualPropertyOffer
);

// Company employees
router.get("/employees", companyEmployeeAuthMiddleware, getCompanyEmployees);
router.post("/employees", companyEmployeeAuthMiddleware, addEmployee);
router.patch("/employees/:id", companyEmployeeAuthMiddleware, updateEmployee);
router.delete("/employees/:id", companyEmployeeAuthMiddleware, deleteEmployee);
router.patch("/employees/:id/status", companyEmployeeAuthMiddleware, toggleEmployeeStatus);

// Property images & videos
router.post("/properties/:propertyId/images", companyEmployeeAuthMiddleware, upload.fields([{ name: 'images' }, { name: 'videos' }]), addPropertyImage);
router.delete("/properties/images/:imageId", companyEmployeeAuthMiddleware, deletePropertyImage);

// Featured ads
router.patch("/properties/:id/feature", companyEmployeeAuthMiddleware, featureProperty);
router.get("/featured-ads-balance", companyEmployeeAuthMiddleware, getFeaturedAdsBalance);

// Company complaints
router.get("/complaints", companyEmployeeAuthMiddleware, getCompanyComplaints);

// Payments
router.post(
  "/payments/request",
  companyEmployeeAuthMiddleware,
  createPaymentRequest
);

router.post(
  "/payments/session",
  companyEmployeeAuthMiddleware,
  createPaymentSession
);

router.post(
  "/payments/afs-callback",
  handleAfsCallback
);

// Phase 4: Enhanced Payment System
router.post(
  "/payments/intent",
  companyEmployeeAuthMiddleware,
  createPaymentIntentController
);

router.post(
  "/payments/success",
  handlePaymentSuccessController
);

router.post(
  "/payments/failure",
  handlePaymentFailureController
);

router.get(
  "/payments/:id",
  companyEmployeeAuthMiddleware,
  getPaymentController
);

router.get(
  "/payments",
  companyEmployeeAuthMiddleware,
  getCompanyPaymentsController
);

// AFS Payment redirects (for web payment flow)
router.get(
  "/payments/afs-success",
  afsPaymentSuccessRedirect
);

router.get(
  "/payments/afs-failure",
  afsPaymentFailureRedirect
);

// Phase 4: Boost System
router.post(
  "/boosts",
  companyEmployeeAuthMiddleware,
  createBoostController
);

router.get(
  "/boosts/active",
  companyEmployeeAuthMiddleware,
  getCompanyActiveBoostsController
);

router.get(
  "/boosts",
  companyEmployeeAuthMiddleware,
  getCompanyBoostsController
);

router.get(
  "/boosts/:id",
  companyEmployeeAuthMiddleware,
  getBoostController
);

router.patch(
  "/boosts/:id/cancel",
  companyEmployeeAuthMiddleware,
  cancelBoostController
);

router.patch(
  "/boosts/:id/extend",
  companyEmployeeAuthMiddleware,
  extendBoostController
);

router.get(
  "/boosts/stats",
  companyEmployeeAuthMiddleware,
  getCompanyBoostStatsController
);

// Phase 4: Push Notifications
router.post(
  "/push-tokens/register",
  companyEmployeeAuthMiddleware,
  registerPushTokenController
);

router.post(
  "/push-tokens/unregister",
  companyEmployeeAuthMiddleware,
  unregisterPushTokenController
);

router.post(
  "/push-notifications/send",
  companyEmployeeAuthMiddleware,
  sendPushNotificationController
);

router.get(
  "/push-notifications/history",
  companyEmployeeAuthMiddleware,
  getPushNotificationHistoryController
);

// Phase 3: Notifications
router.get("/notifications", companyEmployeeAuthMiddleware, getCompanyNotifications);
router.patch("/notifications/:id/read", companyEmployeeAuthMiddleware, markNotificationAsRead);
router.patch("/notifications/mark-all-read", companyEmployeeAuthMiddleware, markAllNotificationsAsRead);

// Subscription Requests
router.post("/subscription-requests", companyEmployeeAuthMiddleware, createSubscriptionRequest);
router.get("/subscription-history", companyEmployeeAuthMiddleware, getCompanySubscriptionHistory);

// Phase 3: Featured Packages
router.post("/featured-packages", companyEmployeeAuthMiddleware, createFeaturedPackage);
router.get("/featured-packages", companyEmployeeAuthMiddleware, getCompanyFeaturedPackages);
router.patch("/featured-packages/:id/cancel", companyEmployeeAuthMiddleware, cancelFeaturedPackage);
router.patch("/featured-packages/:id/extend", companyEmployeeAuthMiddleware, extendFeaturedPackage);

// Phase 3: Property location updates
router.patch("/properties/:id/location", companyEmployeeAuthMiddleware, updatePropertyWithLocation);

export default router;
