import $ from "jquery";
import request from "request";
import moment from "moment";
import querystring from "qs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import { isAdmin, requiredSignin } from "../middlewares/authMiddleware.js";
import {
  addOrder,
  createPaymentLink,
  deleteOrder,
  getOrder,
  getOrderDetail,
  getOrders,
  myOrder,
  updateOrder,
  createOrder,
  updatePaymentStatus,
} from "../controllers/OrderController.js";
import payOS from "../Utils/payos.js";

const router = express.Router();

// add order
router.post("/add-order", requiredSignin, addOrder);

// get order

router.get("/get-order/:id", requiredSignin, getOrder);

router.get("/get-order-detail/:id", requiredSignin, getOrderDetail);

router.get("/me/order", requiredSignin, myOrder);

// update payment status
router.put(
  "/update-payment-status/:orderCode",
  requiredSignin,
  updatePaymentStatus
);

// admin route
router.get("/admin/get-orders", requiredSignin, getOrders);
router
  .route("/admin/:id")
  .put(requiredSignin, updateOrder)
  .delete(requiredSignin, deleteOrder);

const configPath = path.resolve("./src/config/default.json"); // adjust path as needed
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

router.get("/", (req, res, next) => {
  res.render("orderlist", { title: "Danh sách đơn hàng" });
});

//VNPay
// router.get("/create_payment_url", function (req, res, next) {
//   const amount = req.query.amount;
//   const orderId = req.query.orderId;
//   res.render("order", { amount: amount, orderId: orderId });
// });

router.get("/querydr", (req, res, next) => {
  const desc = "truy van ket qua thanh toan";
  res.render("querydr", { title: "Truy vấn kết quả thanh toán" });
});

router.get("/refund", (req, res, next) => {
  const desc = "Hoan tien GD thanh toan";
  res.render("refund", { title: "Hoàn tiền giao dịch thanh toán" });
});

router.post("/create_payment_url", (req, res, next) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";

  const date = new Date();
  const createDate = moment(date).format("YYYYMMDDHHmmss");

  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;
  let vnpUrl = config.vnp_Url;
  const returnUrl = config.vnp_ReturnUrl;
  //   let orderId = moment(date).format("DDHHmmss");
  const orderId = req.body.orderId;
  const amount = req.body.amount;
  const bankCode = req.body.bankCode;

  const currCode = "VND";
  let vnp_Params = {};
  vnp_Params.vnp_Version = "2.1.0";
  vnp_Params.vnp_Command = "pay";
  vnp_Params.vnp_TmnCode = tmnCode;
  vnp_Params.vnp_Locale = "vn";
  vnp_Params.vnp_CurrCode = currCode;
  vnp_Params.vnp_TxnRef = orderId;
  vnp_Params.vnp_OrderInfo = `Thanh toan cho ma GD:${orderId}`;
  vnp_Params.vnp_OrderType = "billpayment";
  vnp_Params.vnp_Amount = amount * 100;
  vnp_Params.vnp_ReturnUrl = returnUrl;
  vnp_Params.vnp_IpAddr = ipAddr;
  vnp_Params.vnp_CreateDate = createDate;
  if (bankCode !== null && bankCode !== "") {
    vnp_Params.vnp_BankCode = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params.vnp_SecureHash = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

  res.redirect(vnpUrl);
});

router.get("/vnpay_return", async (req, res, next) => {
  let vnp_Params = req.query;

  const secureHash = vnp_Params.vnp_SecureHash;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);

  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;

  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    // Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    if (vnp_Params.vnp_ResponseCode == "00") {
      const status = "ok";
      try {
        // const user = JSON.parse(req.cookies.user);
        const user = req.body.user;
        if (!user || !user._id) {
          throw new Error("User ID is missing");
        }
        console.log(user._id); // Clear cart
        const cart = await Cart.findOne({ user: user._id });
        console.log(cart);
        // Save order to database
        const order = new Order({
          orderCode: Number(String(Date.now()).slice(-6)),
          totalPrice: vnp_Params.vnp_Amount,
          items: cart.cartItems.map((item) => ({
            productId: item.product,
            purchasedQty: item.quantity,
            payablePrice: item.price,
          })),
          user: user._id,
          paymentType: "VNPAY PAYMENT",
        });

        try {
          //clear cart
          const cart = await Cart.findOne({ user: req.user._id });
          cart.cartItems = [];
          await cart.save();
        } catch (error) {
          console.error("Error deleting cart:", error);
          return res.status(500).json({ error: "Error deleting cart" });
        }
        try {
          await order.save();
        } catch (error) {
          console.error("Error saving order:", error);
          return res.status(500).json({ error: "Error saving order" });
        }

        // Redirect to the success page
        res.redirect("http://localhost:5173/order-success");
        // res.redirect("app://techshopflutter/checkout/order-success");
      } catch (error) {
        // Handle error when saving order and clearing cart
        console.error(error);
        res.redirect("http://localhost:5173/error-payment");
        // res.redirect("app://techshopflutter/checkout/order-failed");
      }
    } else {
      // Payment failed
      res.redirect("http://localhost:5173/error-payment");
      // res.redirect("app://techshopflutter/checkout/order-failed");
    }
  } else {
    res.status(200).send({ code: "97" });
  }
});

router.get("/vnpay_ipn", (req, res, next) => {
  let vnp_Params = req.query;
  const secureHash = vnp_Params.vnp_SecureHash;

  const orderId = vnp_Params.vnp_TxnRef;
  const rspCode = vnp_Params.vnp_ResponseCode;

  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);
  const secretKey = config.vnp_HashSecret;
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");

  let paymentStatus = "0"; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
  // let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
  // let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

  const checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
  const checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
  if (secureHash === signed) {
    // kiểm tra checksum
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus == "0") {
          // kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
          if (rspCode == "00") {
            // thanh cong
            paymentStatus = "1";
            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
            res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            // that bai
            // paymentStatus = '2'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
            res.status(200).json({ RspCode: "00", Message: "Failed" });
          }
        } else {
          res.status(200).json({
            RspCode: "02",
            Message: "This order has been updated to the payment status",
          });
        }
      } else {
        res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }
});

router.post("/querydr", (req, res, next) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const date = new Date();

  const vnp_TmnCode = config.get("vnp_TmnCode");
  const secretKey = config.get("vnp_HashSecret");
  const vnp_Api = config.get("vnp_Api");

  const vnp_TxnRef = req.body.orderId;
  const vnp_TransactionDate = req.body.transDate;

  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = "2.1.0";
  const vnp_Command = "querydr";
  const vnp_OrderInfo = `Truy van GD ma:${vnp_TxnRef}`;

  const vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  const currCode = "VND";
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  const data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;

  const hmac = crypto.createHmac("sha512", secretKey);
  const vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  const dataObj = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TxnRef,
    vnp_OrderInfo,
    vnp_TransactionDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash,
  };
  // /merchant_webapi/api/transaction
  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    (error, response, body) => {
      console.log(response);
    }
  );
});

router.post("/refund", (req, res, next) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const date = new Date();

  const vnp_TmnCode = config.get("vnp_TmnCode");
  const secretKey = config.get("vnp_HashSecret");
  const vnp_Api = config.get("vnp_Api");

  const vnp_TxnRef = req.body.orderId;
  const vnp_TransactionDate = req.body.transDate;
  const vnp_Amount = req.body.amount * 100;
  const vnp_TransactionType = req.body.transType;
  const vnp_CreateBy = req.body.user;

  const currCode = "VND";

  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = "2.1.0";
  const vnp_Command = "refund";
  const vnp_OrderInfo = `Hoan tien GD ma:${vnp_TxnRef}`;

  const vnp_IpAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");

  const vnp_TransactionNo = "0";

  const data =
    vnp_RequestId +
    "|" +
    vnp_Version +
    "|" +
    vnp_Command +
    "|" +
    vnp_TmnCode +
    "|" +
    vnp_TransactionType +
    "|" +
    vnp_TxnRef +
    "|" +
    vnp_Amount +
    "|" +
    vnp_TransactionNo +
    "|" +
    vnp_TransactionDate +
    "|" +
    vnp_CreateBy +
    "|" +
    vnp_CreateDate +
    "|" +
    vnp_IpAddr +
    "|" +
    vnp_OrderInfo;
  const hmac = crypto.createHmac("sha512", secretKey);
  const vnp_SecureHash = hmac.update(new Buffer(data, "utf-8")).digest("hex");

  const dataObj = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TransactionType,
    vnp_TxnRef,
    vnp_Amount,
    vnp_TransactionNo,
    vnp_CreateBy,
    vnp_OrderInfo,
    vnp_TransactionDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash,
  };

  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: dataObj,
    },
    (error, response, body) => {
      console.log(response);
    }
  );
});

const sortObject = (obj) => {
  const sorted = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

//payOS
router.post("/create", requiredSignin, createOrder);

router.get("/:orderId", async (req, res) => {
  try {
    const order = await payOS.getPaymentLinkInformation(req.params.orderId);
    if (!order) {
      return res.json({
        error: -1,
        message: "failed",
        data: null,
      });
    }
    return res.json({
      error: 0,
      message: "ok",
      data: order,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

router.put("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const body = req.body;
    const order = await payOS.cancelPaymentLink(
      orderId,
      body.cancellationReason
    );
    if (!order) {
      return res.json({
        error: -1,
        message: "failed",
        data: null,
      });
    }
    return res.json({
      error: 0,
      message: "ok",
      data: order,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

router.post("/confirm-webhook", async (req, res) => {
  const { webhookUrl } = req.body;
  try {
    await payOS.confirmWebhook(webhookUrl);
    return res.json({
      error: 0,
      message: "ok",
      data: null,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      error: -1,
      message: "failed",
      data: null,
    });
  }
});

router.post("/create-payment-link", requiredSignin, createPaymentLink);

export default router;
