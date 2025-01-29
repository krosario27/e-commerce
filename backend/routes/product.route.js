import express from 'express';

import { getAllProducts, 
    getFeaturedProducts, 
    createProduct, 
    deleteProduct, 
    getRecommendedProducts,
    getProductsByCategory,
    toggleFeaturedProduct } from '../controllers/product.controller.js';

import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getProductsByCategory);
router.get("/category/:category", getFeaturedProducts);
router.get("/recommendations", getRecommendedProducts)
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);



export default router;