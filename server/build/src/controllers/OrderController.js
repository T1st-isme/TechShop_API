import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import asyncHandler from "express-async-handler";
import payOS from "../Utils/payos.js";
async function updateStockAndsold(order) {
  const productIds = order.items.map(item => item.productId);
  const products = await Product.find({
    _id: {
      $in: productIds
    }
  }).exec();
  const updatePromises = products.map(product => {
    const item = order.items.find(item => item.productId?.toString() === product._id.toString());
    if (item) {
      product.stock -= item.purchasedQty;
      product.sold += item.purchasedQty;
      return product.save();
    }
  });
  await Promise.all(updatePromises);
}
const updateOrder = asyncHandler(async (req, res) => {
  const {
    id
  } = req.params;
  const {
    status
  } = req.body;
  const order = await Order.findByIdAndUpdate(id, {
    orderStatus: status
  }, {
    new: true
  });
  if (order) {
    order.paymentStatus = status === "delivered" ? "completed" : order.paymentStatus;
    await order.save();
    if (status === "delivered") {
      updateStockAndsold(order);
    }
    res.json(order);
  }
});
const deleteOrder = asyncHandler(async (req, res) => {
  const {
    id
  } = req.params;
  const order = await Order.findByIdAndDelete(id);
  res.status(200).json({
    success: Boolean(order),
    message: order ? "Xóa đơn hàng thành công!!!" : "Không tìm thấy đơn hàng!!!"
  });
});
const myOrder = asyncHandler(async (req, res) => {
  // console.log(req.user._id);
  const {
    orderStatus
  } = req.query;
  const query = {
    user: req.user._id
  };
  if (orderStatus) {
    query.orderStatus = orderStatus;
  }
  const order = await Order.find(query).populate("user", "_id fullname email phone address").populate("items.productId", "_id name proImg").sort({
    createdAt: -1
  });
  res.status(200).json({
    success: Boolean(order),
    data: order
  });
});
const addOrder = asyncHandler(async (req, res) => {
  req.body.user = req.user._id;
  req.body.orderCode = Number(String(Date.now()).slice(-6));
  console.log(req.body.items);
  const cartItems = JSON.parse(JSON.stringify(req.body.items));
  const productIds = cartItems.map(item => item.productId);
  const products = await Product.find({
    _id: {
      $in: productIds
    }
  }).exec();

  // check stock
  let hasEnoughStock = true;
  cartItems.forEach(item => {
    const product = products.find(p => p._id.toString() === item.productId?.toString());
    if (!product || product.stock < item.purchasedQty) {
      console.log(product?.stock, item.purchasedQty);
      hasEnoughStock = false;
    }
  });
  if (!hasEnoughStock) {
    return res.status(400).json({
      error: "Kho không đủ!!!"
    });
  }
  const order = new Order(req.body);
  try {
    //clear cart
    const cart = await Cart.findOne({
      user: req.user._id
    });
    cart.cartItems = [];
    await cart.save();
  } catch (error) {
    console.error("Error deleting cart:", error);
    return res.status(500).json({
      error: "Error deleting cart"
    });
  }
  try {
    await order.save();
  } catch (error) {
    console.error("Error saving order:", error);
    return res.status(500).json({
      error: "Error saving order"
    });
  }
  res.status(201).json({
    success: Boolean(order),
    order
  });
});
const getOrders = asyncHandler(async (req, res) => {
  const {
    _id
  } = req.user._id;
  const orders = await Order.find({
    orderBy: _id
  }).select("_id user paymentStatus paymentType orderStatus totalPrice items createdAt").populate("user", "_id firstname lastname email").populate("items.productId", "_id name proImg").exec();
  res.status(200).json({
    success: Boolean(orders),
    data: orders ? {
      orders
    } : "Không tìm thấy đơn hàng!!!"
  });
});
const getOrderDetail = asyncHandler(async (req, res) => {
  const {
    id
  } = req.params;
  const order = await Order.findById(id).populate("user", "_id fullname email phone address").populate("items.productId", "_id name proImg").exec();
  res.status(200).json({
    success: Boolean(order),
    data: order ? {
      order
    } : "Không tìm thấy đơn hàng!!!"
  });
});
const AdGetOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().select("_id paymentStatus paymentType orderStatus items").populate("items.productId", "_id name proImg").exec();
  let totalAmount = 0;
  orders.forEach(order => {
    totalAmount += order.totalPrice;
  });
  res.status(200).json({
    success: Boolean(orders),
    data: orders ? {
      orders,
      totalAmount
    } : "Không tìm thấy đơn hàng!!!"
  });
});
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id
  }).populate("user", "_id firstname lastname email").populate("items.productId", "_id name proImg").lean().exec();
  res.status(200).json({
    success: Boolean(order),
    data: order ? {
      order
    } : "Không tìm thấy đơn hàng!!!"
  });
});
const createPaymentLink = asyncHandler(async (req, res) => {
  const orderCode = Number(String(Date.now()).slice(-6));
  const {
    amount,
    returnUrl,
    cancelUrl,
    items
  } = req.body;
  const body = {
    orderCode: orderCode,
    // amount: Number(amount),
    amount: 10000,
    description: "Don hang #" + orderCode,
    returnUrl: returnUrl,
    cancelUrl: cancelUrl
  };
  console.log(body);
  try {
    const paymentLinkResponse = await payOS.createPaymentLink(body);
    res.redirect(paymentLinkResponse.checkoutUrl);
    if (body.returnUrl) {
      req.body.user = req.user._id;
      const cart = await Cart.findOne({
        user: req.user._id
      });
      // Create a new order
      console.log(items);
      const order = new Order({
        user: req.user._id,
        totalPrice: amount,
        items: cart.cartItems.map(item => ({
          productId: item.product,
          purchasedQty: item.quantity,
          payablePrice: item.price
        })),
        paymentStatus: "Đang xử lý",
        paymentType: "VietQR",
        orderStatus: "Đã đặt hàng"
      });
      try {
        await order.save();
      } catch (error) {
        console.error("Error saving order:", error);
        return res.status(500).json({
          error: "Error saving order"
        });
      }
    } else {
      res.send("Something went wrong");
    }
  } catch (error) {
    console.error(error);
    res.send("Something went error");
  }
});
const createOrder = asyncHandler(async function (req, res) {
  const {
    description,
    returnUrl,
    cancelUrl,
    amount,
    items
  } = req.body;
  if (!description || !returnUrl || !cancelUrl || !amount) {
    return res.status(400).json({
      error: -1,
      message: "Missing required fields",
      data: null
    });
  }
  if (amount <= 0) {
    return res.status(400).json({
      error: -1,
      message: "Amount must be greater than 0",
      data: null
    });
  }
  const body = {
    orderCode: Number(String(new Date().getTime()).slice(-6)),
    amount,
    description,
    cancelUrl,
    returnUrl
  };
  try {
    const paymentLinkRes = await payOS.createPaymentLink(body);
    req.body.user = req.user._id;
    const cart = await Cart.findOne({
      user: req.user._id
    });
    const order = new Order({
      user: req.user._id,
      orderCode: body.orderCode,
      totalPrice: amount,
      items: cart.cartItems.map(item => ({
        productId: item.product,
        purchasedQty: item.quantity,
        payablePrice: item.price
      })),
      paymentStatus: "Đang xử lý",
      paymentType: "VietQR",
      orderStatus: "Đã đặt hàng"
    });
    try {
      cart.cartItems = [];
      await cart.save();
    } catch (error) {
      console.error("Error clear cart:", error);
      return res.status(500).json({
        error: "Error clear cart"
      });
    }
    try {
      await order.save();
    } catch (error) {
      console.error("Error saving order:", error);
      return res.status(500).json({
        error: "Error saving order"
      });
    }
    return res.json({
      error: 0,
      message: "Success",
      data: {
        bin: paymentLinkRes.bin,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode
      }
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: -1,
      message: "fail",
      data: null
    });
  }
});

//update payment status
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const {
    orderCode
  } = req.params;
  const {
    paymentStatus
  } = req.body;
  const order = await Order.findOneAndUpdate({
    orderCode
  }, {
    paymentStatus
  }, {
    new: true
  });
  res.status(200).json({
    success: Boolean(order),
    data: order
  });
});
export { addOrder, getOrders, getOrder, getOrderDetail, AdGetOrders, updateOrder, deleteOrder, myOrder, createPaymentLink, createOrder, updatePaymentStatus };