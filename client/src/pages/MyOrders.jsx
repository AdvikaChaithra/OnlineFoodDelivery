//client/src/pages/MyOrders.jsx

import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);

  const { currency, axios, user } = useAppContext();

  /* ---------------- Fetch Orders ---------------- */

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/user");

      if (data.success) {
        setMyOrders(data.orders || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  return (
    <div className="mt-16 pb-16">
      {/* Title */}

      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>

        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {/* No Orders */}

      {myOrders.length === 0 && (
        <p className="text-gray-500">No orders found</p>
      )}

      {/* Orders */}

      {myOrders.map((order) => (
        <div
          key={order._id}
          className="border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl"
        >
          {/* Order Header */}

          <p className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col">
            <span>OrderId : {order._id}</span>

            <span>Payment : {order.paymentType}</span>

            <span>
              Total Amount : {currency}
              {order.amount}
            </span>
          </p>

          {/* Order Items */}

          {order.items?.map((item, index) => (
            <div
              key={index}
              className={`relative bg-white text-gray-500/70 ${
                order.items.length !== index + 1 ? "border-b" : ""
              } border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 py-5 md:gap-16 w-full max-w-4xl`}
            >
              {/* Product Info */}

              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <img
                    src={item.product?.image?.[0] || assets.box_icon}
                    alt="product"
                    className="w-16 h-16 object-cover"
                  />
                </div>

                <div className="ml-4">
                  <h2 className="text-xl font-medium text-gray-800">
                    {item.product?.name || "Product Removed"}
                  </h2>

                  <p>Category: {item.product?.category || "Unavailable"}</p>
                </div>
              </div>

              {/* Order Info */}

              <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0">
                <p>Quantity: {item.quantity || 1}</p>

                <p>Status: {order.status || "Processing"}</p>

                <p>
                  Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              {/* Price */}

              <p className="text-primary text-lg font-medium">
                Amount: {currency}
                {(item.product?.offerPrice || 0) * item.quantity}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MyOrders;
