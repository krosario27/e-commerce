import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {

    try {
        // Find all products that match the IDs in teh users cart.
        const products = await Product.find({ _id: { $in: req.user.cartItems } });

        // Map through the products and attach the correct quantity.
        const cartItems = products.map(product => {
            // Find the matching item in the cart.
            const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);
            return { ...product.toJSON(), quantity: item.quantity };
        });
        
        res.json(cartItems); // Send the cart items as a response.
    } catch (error) {
        console.log("Error in getCartProducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    };

};

export const addToCart = async (req, res) => {

    try {
        const { productId } = req.body; // Get the product ID from the request body.
        const user = req.user; // Get the logged in user

        // Check if the product is already in the cart.
        const existingItem = user.cartItems.find(item => item.id === productId);

        if (existingItem) {
            // If the product is already in the cart, increase the quantity by 1.
            existingItem.quantity += 1;
        } else {
            // If not, add the product to the cart with default quantity of 1.
            user.cartItems.push(productId);
        }

        await user.save(); // Save the updated cart to the database.
        res.json(user.cartItems); // Send updated cart back to user.

    } catch (error) {
        console.log("Error in addToCart controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const removeAllFromCart = async (req, res) => {

    try {
        const { productId } = req.body; // Get product id from request body.
        const user = req.user; // Get the logged in user.

        if (!productId) {
            // If no product ID is provided, remove all items from the cart
            user.cartItems = [];
        } else {
            // If a product ID is provided, remove only that product from the cart.
            user.cartItems = user.cartItems.filter((item) => item.id !== productId); 
        }

        await user.save(); // Save updated cart to the database.
        res.json(user.cartItems); // Send updated cart back to user.

    } catch (error) {
        console.log("Error in removeAllFromCart controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateQuantity = async (req, res) => {

    try {
        const { id: productId } = req.params; // Get product ID from request params.
        const { quantity } = req.body; // Get new quantity from request body.
        const user = req.user; // Get the logged in user.

        // Find the product in the cart.
        const existingItem = user.cartItems.find((item) => item.id === productId);

        if (existingItem) {
            if (quantity === 0) {
                // If quantity is set to 0, remove the product from the cart.
                user.cartItems = user.cartItems.filter((item) => item.id !== productId);
                await user.save();
                return res.json(user.cartItems);
            }

            // Update the quantity of the product in the cart.
            existingItem.quantity = quantity;

            await user.save();
            res.json(user.cartItems);

        } else {
            res.status(404).json({ message: "Product not found in cart" });
        }
        
    } catch (error) {
        console.log("Error in updateQuantity controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

