//server/controllers/productController.js

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const CATEGORIES = ["Vegetables", "Fruits", "Drinks", "Instant", "Dairy", "Bakery", "Grains"];

// Remove multer temp files once they are uploaded (or on failure)
const cleanupFiles = (files = []) => {
  for (const file of files) {
    fs.unlink(file.path, () => {});
  }
};

/* ---------------- ADD PRODUCT ---------------- */
// POST : /api/product/add

export const addProduct = async (req, res) => {
  try {
    const images = req.files;

    if (!images || images.length === 0) {
      return res.json({
        success: false,
        message: "Please upload product images",
      });
    }

    let productData;
    try {
      productData = JSON.parse(req.body.productData || "{}");
    } catch {
      return res.json({ success: false, message: "Invalid product data" });
    }

    const name = String(productData.name || "").trim();
    const price = Number(productData.price);
    const offerPrice = Number(productData.offerPrice);
    const description = (Array.isArray(productData.description)
      ? productData.description
      : [productData.description]
    )
      .map((line) => String(line ?? "").trim())
      .filter(Boolean);

    if (!name) {
      return res.json({ success: false, message: "Product name is required" });
    }
    if (!CATEGORIES.includes(productData.category)) {
      return res.json({ success: false, message: "Invalid category" });
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(offerPrice) || offerPrice <= 0) {
      return res.json({ success: false, message: "Prices must be positive numbers" });
    }
    if (offerPrice > price) {
      return res.json({ success: false, message: "Offer price cannot be greater than product price" });
    }

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });

        return result.secure_url;
      }),
    );

    await Product.create({
      name,
      description,
      category: productData.category,
      price,
      offerPrice,
      image: imagesUrl,
      inStock: true,
    });

    res.json({ success: true, message: "Product Added Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  } finally {
    cleanupFiles(req.files);
  }
};

/* ---------------- PRODUCT LIST ---------------- */
// GET : /api/product/list

export const productList = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

/* ---------------- GET SINGLE PRODUCT ---------------- */
// GET : /api/product/id/:id

export const productById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.json({ success: false, message: "Product not found" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

/* ---------------- CHANGE STOCK ---------------- */
// POST : /api/product/stock

export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;

    if (!mongoose.isValidObjectId(id) || typeof inStock !== "boolean") {
      return res.json({ success: false, message: "Invalid stock update" });
    }

    const product = await Product.findByIdAndUpdate(id, { inStock });

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Stock Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

/* ---------------- DELETE PRODUCT ---------------- */
// DELETE : /api/product/delete/:id

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.json({ success: false, message: "Product not found" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
