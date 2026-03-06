//client/src/pages/seller/Orders.jsx

import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

const Orders = () => {
  const { currency, axios } = useAppContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------------- Fetch Orders ---------------- */

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/seller");

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-gray-500">
        Loading Orders...
      </div>
    );
  }

  /* ---------------- Empty Orders ---------------- */

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-gray-500">
        No Orders Found
      </div>
    );
  }

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
      <div className="md:p-10 p-4 space-y-6">
        <h2 className="text-lg font-medium">Orders List</h2>

        {orders.map((order) => (
          <div
            key={order._id}
            className="flex flex-col gap-6 p-5 max-w-5xl rounded-md border border-gray-300 bg-white"
          >
            {/* ---------------- Order Items ---------------- */}

            {order.items?.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row md:items-center gap-5 justify-between"
              >
                {/* Product */}

                <div className="flex items-center gap-4 max-w-80">
                  <img
                    className="w-14 h-14 object-cover rounded border"
                    src={item.product?.image?.[0] || assets.box_icon}
                    alt={item.product?.name}
                  />

                  <div>
                    <p className="font-medium text-gray-800">
                      {item.product?.name || "Product Removed"}

                      <span className="text-primary"> x {item.quantity}</span>
                    </p>

                    <p className="text-sm text-gray-500">
                      Category: {item.product?.category || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Address */}

                <div className="text-sm md:text-base text-black/70">
                  <p className="font-medium text-black">
                    {order.address?.firstName} {order.address?.lastName}
                  </p>

                  <p>
                    {order.address?.street}, {order.address?.city}
                  </p>

                  <p>
                    {order.address?.state}, {order.address?.zipcode},{" "}
                    {order.address?.country}
                  </p>

                  <p>{order.address?.phone}</p>
                </div>

                {/* Amount */}

                <p className="font-semibold text-lg">
                  {currency}
                  {order.amount}
                </p>

                {/* Order Details */}

                <div className="flex flex-col text-sm md:text-base text-black/70">
                  <p>
                    Method:
                    <span className="font-medium"> {order.paymentType}</span>
                  </p>

                  <p>
                    Date:{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <p>
                    Payment:
                    <span
                      className={
                        order.isPaid
                          ? "text-green-600 font-medium"
                          : "text-red-500 font-medium"
                      }
                    >
                      {" "}
                      {order.isPaid ? "Paid" : "Pending"}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
