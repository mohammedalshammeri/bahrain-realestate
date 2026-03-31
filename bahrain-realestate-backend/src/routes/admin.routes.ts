import { Router } from "express";
import { adminAuthMiddleware } from "../middleware/adminAuth";

const router = Router();

// Import controllers dynamically to avoid issues
const adminController = require("../controllers/admin.controller");
import * as packagesController from "../controllers/packages.controller";

// Public admin routes
router.post('/login', adminController.adminLogin);

// Protected admin routes
router.use(adminAuthMiddleware);

// Packages Management
router.get('/packages', packagesController.getAllPackages);
router.post('/packages', packagesController.createPackage);
router.patch('/packages/:id', packagesController.updatePackage);
router.delete('/packages/:id', packagesController.deletePackage);

// Subscription Requests
router.get('/subscription-requests', adminController.getSubscriptionRequests);
router.patch('/subscription-requests/:id/status', adminController.updateSubscriptionRequestStatus);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// Company Management
router.get('/companies', adminController.getAllCompanies);
router.patch('/companies/:id/status', adminController.updateCompanyStatus);
router.delete('/companies/:id', adminController.deleteCompany);

// Property Management
router.get('/properties/expiring', adminController.getExpiringProperties);
router.get('/properties', adminController.getAllProperties);
router.get('/properties/:id', adminController.getPropertyById);
router.patch('/properties/:id', adminController.updatePropertyDetails);
router.patch('/properties/:id/status', adminController.updatePropertyStatus);
router.patch('/properties/:id/expiry', adminController.updatePropertyExpiry);
router.patch('/properties/:id/featured', adminController.updatePropertyFeaturedStatus);
router.delete('/properties/:id', adminController.deleteProperty);

// Individual Properties (admin)
router.get('/individual-properties', adminController.getAllIndividualProperties);
router.post('/individual-properties/:id/reject', adminController.rejectIndividualProperty);
router.patch('/individual-properties/:id', adminController.updateIndividualProperty);
router.post('/individual-properties/:id/reset', adminController.resetIndividualPropertyToPending);
router.get('/individual-properties/:id/offers', adminController.getIndividualPropertyOffers);
router.post('/individual-properties/:id/mark-sold', adminController.markIndividualPropertyAsSold);
router.delete('/individual-properties/:id', adminController.deleteIndividualProperty);

// Individual Property Distribution (offers only)
router.post('/properties/:id/distribute', adminController.distributePropertyToCompanies);

// Complaints Management
router.get('/complaints', adminController.getAllComplaints);
router.patch('/complaints/:id/status', adminController.updateComplaintStatus);

// Employees Management
router.get('/employees', adminController.getAllEmployees);
router.patch('/employees/:id/status', adminController.updateEmployeeStatus);

// Payments Management
router.get('/payments', adminController.getAllPayments);

// Ads Management
router.get('/ads', adminController.getAllAds);
router.get('/ads/:id', adminController.getAdById);
router.patch('/ads/:id', adminController.updateAd);
router.post('/ads/:id/approve', adminController.approveAd);
router.post('/ads/:id/reject', adminController.rejectAd);
router.post('/ads/:id/featured', adminController.setAdFeatured);
router.delete('/ads/:id', adminController.deleteAd);

// System Employees Management
router.get('/system-employees', adminController.getAllSystemEmployees);
router.post('/system-employees', adminController.createSystemEmployee);
router.put('/system-employees/:id', adminController.updateSystemEmployee);
router.delete('/system-employees/:id', adminController.deleteSystemEmployee);

// Withdrawals Management
router.get('/withdrawals', adminController.getAllWithdrawals);
router.post('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.post('/withdrawals/:id/reject', adminController.rejectWithdrawal);

// Settings Management
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

export default router;
