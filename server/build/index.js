import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import userRoute from "./src/routes/userRoute.js";
import categoryRoute from "./src/routes/categoryRoute.js";
import productRoute from "./src/routes/productRoute.js";
import cartRoute from "./src/routes/cartRoute.js";
import orderRoute from "./src/routes/orderRoute.js";
import wishListRoute from "./src/routes/wishListRoute.js";
import dbConnect from "./dbConnect.js";
import cookieParser from "cookie-parser";
import errorHandler from "./src/middlewares/errHandler.js";
import bodyParser from "body-parser";
const app = express();

// configure dotenv
// skipcq: JS-P1003
dotenv.config();

// Connect to MongoDB
dbConnect();

// Middleware
// skipcq: JS-P1003
app.use(express.json());
app.use(cookieParser());

// skipcq: JS-P1003
app.use(express.urlencoded({
  extended: false
}));
app.use(cors({
  origin(origin, callback) {
    callback(null, true);
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  // allow session cookie from browser to pass through
  preflightContinue: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
// Routes
app.use("/user", userRoute);
app.use("/category", categoryRoute);
app.use("/product", productRoute);
app.use("/cart", cartRoute);
app.use("/order", orderRoute);
app.use("/wishlist", wishListRoute);
app.use(errorHandler);
app.set("view engine", "pug");

//test
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "/index.html");
// });

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});