import Cart from "../models/cartModel.js";
import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

const runUpdate = asyncHandler(async (condition, update) => {
  try {
    const result = await Cart.findOneAndUpdate(condition, update, {
      new: true,
    });
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
});

export const addItemToCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    const promiseArray = [];

    for (const cartItem of req.body.cartItems) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(400).json({ message: "Product not found" });
      }

      const item = cart.cartItems.find(
        (c) => c.product.toString() === product._id.toString()
      );
      let condition, update;
      if (item) {
        condition = {
          user: req.user._id,
          cartItems: { $elemMatch: { product: product._id } },
        };
        update = {
          $inc: { "cartItems.$.quantity": cartItem.quantity },
          $set: {
            "cartItems.$.price":
              product.price * (item.quantity + cartItem.quantity),
          }, // update the price
        };
      } else {
        condition = { user: req.user._id };
        update = {
          $push: {
            cartItems: {
              product: product._id,
              quantity: cartItem.quantity,
              price: product.price * cartItem.quantity, // calculate the price
            },
          },
        };
      }
      promiseArray.push(runUpdate(condition, update));
    }

    Promise.all(promiseArray)
      .then((response) => res.status(201).json({ response }))
      .catch((error) => res.status(400).json({ error }));
  } else {
    const cartItemsWithPrice = await Promise.all(
      req.body.cartItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ message: "Product not found" });
        }
        return {
          product: product._id,
          quantity: item.quantity,
          price: product.price * item.quantity, // calculate the price
        };
      })
    );

    const cart = new Cart({
      user: req.user._id,
      cartItems: cartItemsWithPrice,
    });

    const newCart = await cart.save();
    return res.status(201).json({
      success: Boolean(newCart),
      cart: newCart,
    });
  }
});

//clear all item in cart
export const clearCart = asyncHandler(async (req, res) => {
  const result = await Cart.updateOne(
    { user: req.user._id },
    { $set: { cartItems: [] } }
  ).exec();

  if (!result) {
    return res.status(400).json({ error: "Failed to clear cart" });
  }
  return res.status(200).json({ success: true });
});

// exports.addToCart = (req, res) => {
//     const { cartItems } = req.body;
//     if(cartItems){
//        if(Object.keys(cartItems).length > 0){
//            Cart.findOneAndUpdate({
//                "user": req.user._id
//            }, {
//                "cartItems": cartItems
//            }, {
//                 upsert: true, new: true, setDefaultsOnInsert: true
//            }, (error, cartItems) => {
//                if(error) return res.status(400).json({ error });
//                if(cartItems) res.status(201).json({ message: 'Added Successfully' });
//            })
//        }
//        //res.status(201).json({ cartItems });
//     }else{
//         //res.status(201).json({ req });
//     }
// }

//update quantity product in cart
export const updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body; // Ensure these fields are present in the request body

  if (!productId || quantity === undefined) {
    res.status(400);
    throw new Error("Product ID and quantity are required");
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id, "cartItems.product": productId },
    { $set: { "cartItems.$.quantity": quantity } },
    { new: true }
  );

  if (!cart) {
    res.status(404);
    throw new Error("Cart not found");
  }

  res.status(200).json({ success: true, cart });
});

export const getCartItems = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("cartItems.product", "_id name price proImg")
    .exec();

  if (!cart) {
    return res.status(404).json({ error: "Giỏ hàng không tồn tại!!!" });
  }

  const cartItems = cart.cartItems.reduce((items, item, index) => {
    if (item.product) {
      items.push({
        cartItem: {
          _id: item.product._id.toString(),
          name: item.product.name,
          img: item.product.proImg[0]?.img || "",
          price: item.product.price * item.quantity, //price with quantity
          quantity: item.quantity,
        },
      });
    }
    return items;
  }, []);
  res.status(200).json({
    success: Boolean(cartItems),
    total_items: cart.cartItems.length,
    total_price: (
      cart.cartItems.reduce(
        (total, item) => total + parseFloat(item.product.price * item.quantity), //total price with quantity
        0
      ) * 1000000
    ).toFixed(2),
    total_quantity: cart.cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    ),
    cartItems,
  });
});

// New removeCartItems function
export const removeCartItems = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res
      .status(400)
      .json({ error: "Không tìm thấy sản phẩm trong giỏ hàng!!!" });
  }

  const result = await Cart.updateOne(
    { user: req.user._id },
    { $pull: { cartItems: { product: productId } } }
  ).exec();

  if (result) {
    res.status(200).json({ result });
  } else {
    res.status(400).json({ error: "Xóa thất bại!!" });
  }
});
