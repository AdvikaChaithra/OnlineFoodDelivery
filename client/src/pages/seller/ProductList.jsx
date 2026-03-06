//client/src/pages/seller/ProductList.jsx

import React from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const ProductList = () => {
  const { products, currency, fetchProducts, axios } = useAppContext();

  /* ---------------- Toggle Stock ---------------- */

  const toggleStock = async (id, inStock) => {
    try {
      const { data } = await axios.post("/api/product/stock", { id, inStock });

      if (data.success) {
        toast.success(data.message, { id: "seller-toast" });
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  /* ---------------- Delete Product ---------------- */

  const deleteProduct = async (id) => {
    try {
      const confirmDelete = window.confirm("Delete this product?");

      if (!confirmDelete) return;

      const { data } = await axios.delete(`/api/product/delete/${id}`);

      if (data.success) {
        toast.success("Product deleted", { id: "seller-toast" });
        fetchProducts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <div className="w-full md:p-10 p-4">
        <h2 className="pb-4 text-lg font-medium">All Products</h2>

        <div className="flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto table-fixed w-full overflow-hidden">
            <thead className="text-gray-900 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Selling Price</th>
                <th className="px-4 py-3 font-semibold">In Stock</th>
                <th className="px-4 py-3 font-semibold text-center">Delete</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-500">
              {products.map((product) => (
                <tr key={product._id} className="border-t border-gray-500/20">
                  {/* Product */}

                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <img
                        src={product.image[0]}
                        alt="product"
                        className="w-16"
                      />
                    </div>

                    <span className="truncate max-sm:hidden w-full">
                      {product.name}
                    </span>
                  </td>

                  {/* Category */}

                  <td className="px-4 py-3">{product.category}</td>

                  {/* Price */}

                  <td className="px-4 py-3 max-sm:hidden">
                    {currency}
                    {product.offerPrice}
                  </td>

                  {/* Stock Toggle */}

                  <td className="px-4 py-3">
                    <label className="relative inline-flex items-center cursor-pointer gap-3">
                      <input
                        type="checkbox"
                        checked={product.inStock}
                        onChange={() =>
                          toggleStock(product._id, !product.inStock)
                        }
                        className="sr-only peer"
                      />

                      <div className="w-12 h-7 bg-slate-300 rounded-full peer-checked:bg-blue-600 transition-colors duration-200"></div>

                      <span className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                    </label>
                  </td>

                  {/* Delete */}

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteProduct(product._id)}
                      className="text-red-500 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductList;
