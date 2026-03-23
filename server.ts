import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// In-memory database for flash sale
let products = [
  {
    id: "p1",
    name: "Quantum X Pro Smartphone",
    description: "Next-gen smartphone with quantum processor.",
    price: 999,
    stock: 10,
    originalPrice: 1299,
    image: "https://picsum.photos/seed/phone/400/400",
  },
  {
    id: "p2",
    name: "AeroGlide Wireless Headphones",
    description: "Noise-cancelling over-ear headphones.",
    price: 149,
    stock: 5,
    originalPrice: 299,
    image: "https://picsum.photos/seed/headphones/400/400",
  },
  {
    id: "p3",
    name: "Titanium Smart Watch",
    description: "Rugged smartwatch with 30-day battery life.",
    price: 199,
    stock: 2,
    originalPrice: 349,
    image: "https://picsum.photos/seed/watch/400/400",
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/products", (req, res) => {
    res.json(products);
  });

  app.post("/api/checkout", (req, res) => {
    const { items } = req.body; // Array of { productId, quantity }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Simulate a slight delay for realism
    setTimeout(() => {
      // Check inventory atomically (in single thread Node.js, this is safe)
      let canFulfill = true;
      const errors = [];

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          canFulfill = false;
          errors.push(`Product ${item.productId} not found`);
          continue;
        }
        if (product.stock < item.quantity) {
          canFulfill = false;
          errors.push(`Not enough stock for ${product.name}. Only ${product.stock} left.`);
        }
      }

      if (!canFulfill) {
        return res.status(400).json({ error: "Checkout failed", details: errors });
      }

      // Deduct inventory
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          product.stock -= item.quantity;
        }
      }

      res.json({ success: true, message: "Order placed successfully!" });
    }, 500);
  });

  // Admin route to reset stock for testing
  app.post("/api/admin/reset", (req, res) => {
    products = products.map(p => {
      if (p.id === 'p1') return { ...p, stock: 10 };
      if (p.id === 'p2') return { ...p, stock: 5 };
      if (p.id === 'p3') return { ...p, stock: 2 };
      return p;
    });
    res.json({ success: true, products });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
