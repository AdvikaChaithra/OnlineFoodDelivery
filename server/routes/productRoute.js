//server/routes/productRoute.js

import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";

import {
  addProduct,
  changeStock,
  productById,
  productList,
  deleteProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

/* -------- ADD PRODUCT -------- */

productRouter.post("/add", authSeller, upload.array("images", 4), addProduct);

/* -------- GET ALL PRODUCTS -------- */

productRouter.get("/list", productList);

/* -------- GET PRODUCT BY ID -------- */

productRouter.get("/id/:id", productById);

/* -------- UPDATE STOCK -------- */

productRouter.post("/stock", authSeller, changeStock);

/* -------- DELETE PRODUCT -------- */

productRouter.delete("/delete/:id", authSeller, deleteProduct);

export default productRouter;
