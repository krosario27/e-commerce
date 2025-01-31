import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import { stripe } from "../lib/stripe.js";


export const createCheckoutSession = async (req, res) => {

    try {
        const { products, couponCode } = req.body; // Get product and coupon code from the request body

        // Validate that the products array is not empty and is an array
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Invalid or empty products array" });
        }

        let totalAmount = 0; // Initialize the total amount

        // Format product data for Stripe
        const lineItems = products.map(product => {
            const amount = Math.round(product.price * 100); // Stripe wants the price in cents format.
            totalAmount += amount * product.quantity; // Calculate the total amount

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image], // Stripe requires an image URL
                    },
                    unit_amount: amount,
                },
            };
        });

        // Check if a coupon code was provided and if it is valid
        let coupon = null;
        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
            if (coupon) {
                totalAmount -= Math.round(totalAmount * coupon.discountPercentage / 100); // Apply the discount
            }
        }

        // Create a new Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // Accept only card payments
            line_items: lineItems, // Products
            mode: "payment", // One-time payment mode
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchased-cancelled`,
            discounts: coupon ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }] : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || "", // Store coupon code if used.
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                    }))
                ),
            },
        });

        // Reward user if with a new coupon if the total amount is greater than or equal to $200
        if (totalAmount >= 20000) {
            await createNewCoupon(req.user._id);
        }
        
        // Return Stripe session ID to the frontend
        res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });

    } catch (error) {
        console.error("Error processing checkout:", error);
        res.status(500).json({ message: "Error creating checkout session", error: error.message });
    }
};

export const checkoutSuccess = async (req, res) => {

    try {
        const { sessionId } = req.body; // Get the session ID from the request body
        const session = await stripe.checkout.sessions.retrieve(sessionId); // Retrieve the session from Stripe

        // Check if the payment was successful
        if (session.payment_status === "paid") {
            // If coupon code was used, deactivate it
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate({
                    code: session.metadata.couponCode,
                    userId: session.metadata.userId,
                }, {
                    isActive: false,
                })
        }

        // create a new Order
        const products = JSON.parse(session.metadata.products);

        // Create a new order in the database
        const newOrder = new Order({
            user: session.metadata.userId,
            products: products.map(product => ({
                product: product.id,
                quantity: product.quantity,
                price: product.price,
            })),
            totalAmount: session.amount_total / 100, // Convert from cents to dollars
            stripeSessionId: sessionId,
        })

        // Save the order to the database
        await newOrder.save();

        res.status(200).json({
            success: true,  
            message: "Payment successful, order created, and coupon deactivated if used",
            orderId: newOrder._id,
        });
    }

    } catch (error) {
        console.error("Error processing successful checkout:", error);
        res.status(500).json({ message: "Error processing successful checkout", error: error.message });
    }
};

// Helper function to create a new Stripe coupon
async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once", // One-time discount
    })

    return coupon.id;
};

async function createNewCoupon(userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days from now
        userId: userId,
    })

    await newCoupon.save();

    return newCoupon;
}