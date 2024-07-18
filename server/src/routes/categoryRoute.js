import express from "express";
import { isAdmin, requiredSignin } from "../middlewares/authMiddleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryByName,
  updateCategoryById,
} from "../controllers/categoryController.js";
const router = express.Router();

// GET all categories
router.get("/", getAllCategories);

// GET a single category by name
router.get("/:slug", getCategoryByName);

// CREATE a new category
router.post("/create-category", createCategory);

// UPDATE a category by ID
router.patch("/:_id", updateCategoryById);

// DELETE a category
router.delete("/:id", deleteCategory);

export default router;
