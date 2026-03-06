//server/controllers/productController.js

import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

/* ---------------- ADD PRODUCT ---------------- */
// POST : /api/product/add

export const addProduct = async (req, res) => {
  try {
    const productData = JSON.parse(req.body.productData);

    const images = req.files;

    if (!images || images.length === 0) {
      return res.json({
        success: false,
        message: "Please upload product images",
      });
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
      ...productData,
      image: imagesUrl,
      inStock: true,
    });

    res.json({ success: true, message: "Product Added Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

/* ---------------- PRODUCT LIST ---------------- */
// GET : /api/product/list

export const productList = async (req, res) => {
  try {
    const products = await Product.find({});

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

    await Product.findByIdAndUpdate(id, { inStock });

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

    const product = await Product.findById(id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
