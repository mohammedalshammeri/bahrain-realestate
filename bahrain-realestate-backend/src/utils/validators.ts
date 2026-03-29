import { body, param, query } from "express-validator";

// Auth validators
export const registerValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().notEmpty(),
];

export const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

// Company validators
export const createPropertyValidator = [
  body("title").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("price").isNumeric(),
  body("area").isNumeric(),
  body("type").notEmpty(),
  body("governorate_id").isNumeric(),
  body("area_id").isNumeric(),
];

export const updatePropertyValidator = [
  param("propertyId").isNumeric(),
  body("title").optional().trim(),
  body("description").optional().trim(),
  body("price").optional().isNumeric(),
];

// Public validators
export const propertyIdValidator = [param("propertyId").isNumeric()];

export const governorateIdValidator = [param("governorateId").isNumeric()];

export const searchPropertiesValidator = [
  query("governorate_id").optional().isNumeric(),
  query("area_id").optional().isNumeric(),
  query("type").optional().trim(),
  query("minPrice").optional().isNumeric(),
  query("maxPrice").optional().isNumeric(),
];

export const submitComplaintValidator = [
  body("property_id").optional().isNumeric(),
  body("title").trim().notEmpty(),
  body("description").trim().notEmpty(),
  body("contact_email").isEmail().normalizeEmail(),
];
