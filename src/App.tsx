import React, { useState, useEffect } from 'react';
import { CartProvider, Product, useCart } from './context/CartContext';
import { CountdownTimer } from './components/CountdownTimer';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { ShoppingBag, Zap, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, runTransaction, writeBatch, getDocs } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';

const INITIAL_PRODUCTS = [
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

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const { cart, itemCount, clearCart } = useCart();

  // Set flash sale end time to 1 hour from now for demo purposes
  const [saleEndTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const isSaleActive = new Date() < saleEndTime;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Real-time listener for products
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (snapshot.empty) {
        setProducts([]);
        setIsLoading(false);
      } else {
        const productsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        // Sort by ID to keep order consistent
        productsData.sort((a, b) => a.id.localeCompare(b.id));
        setProducts(productsData);
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const seedDatabase = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach(product => {
        const docRef = doc(db, 'products', product.id);
        const { id, ...productData } = product;
        batch.set(docRef, productData);
      });
      await batch.commit();
      setCheckoutMessage({ type: 'success', text: 'Database seeded successfully!' });
      setTimeout(() => setCheckoutMessage(null), 3000);
    } catch (error: any) {
      console.error("Error seeding database:", error);
      setCheckoutMessage({ type: 'error', text: error.message || 'Failed to seed database.' });
    }
  };

  const handleLogin = () => {
    signInWithPopup(auth, new GoogleAuthProvider()).catch(console.error);
  };

  const handleLogout = () => {
    signOut(auth).catch(console.error);
  };

  const isAdmin = user?.email === 'nicokie0420@gmail.com';

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    setCheckoutMessage(null);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read all product documents first (Firestore requirement)
        const productRefs = cart.map(item => doc(db, 'products', item.id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        
        const updates = [];
        const errors = [];

        // 2. Check stock for all items
        for (let i = 0; i < cart.length; i++) {
          const item = cart[i];
          const productDoc = productDocs[i];
          
          if (!productDoc.exists()) {
            errors.push(`Product ${item.name} not found.`);
            continue;
          }
          
          const currentStock = productDoc.data().stock;
          if (currentStock < item.quantity) {
            errors.push(`Not enough stock for ${item.name}. Only ${currentStock} left.`);
          } else {
            updates.push({
              ref: productRefs[i],
              newStock: currentStock - item.quantity
            });
          }
        }

        if (errors.length > 0) {
          throw new Error(errors.join(' | '));
        }

        // 3. Apply all updates
        updates.forEach(update => {
          transaction.update(update.ref, { stock: update.newStock });
        });
      });

      // Transaction successful
      setCheckoutMessage({ type: 'success', text: 'Order placed successfully! Items secured.' });
      clearCart();
      setTimeout(() => {
        setIsCartOpen(false);
        setCheckoutMessage(null);
      }, 3000);

    } catch (error: any) {
      console.error("Checkout failed:", error);
      setCheckoutMessage({ 
        type: 'error', 
        text: error.message || 'Checkout failed due to high traffic. Please try again.' 
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const resetInventory = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach(product => {
        const docRef = doc(db, 'products', product.id);
        batch.update(docRef, { stock: product.stock });
      });
      await batch.commit();
      setCheckoutMessage({ type: 'success', text: 'Inventory reset for testing.' });
      setTimeout(() => setCheckoutMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset inventory', error);
      // Fallback to seed if documents don't exist
      seedDatabase();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Flash<span className="text-indigo-600">Cart</span>
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {isAdmin && (
                <button 
                  onClick={resetInventory}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Stock
                </button>
              )}
              
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Admin Login
                </button>
              )}
              
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <ShoppingBag className="w-6 h-6" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Tech Drops</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto md:mx-0">
              Limited quantities. Massive discounts. Once they're gone, they're gone forever. Secure your items before time runs out.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <CountdownTimer targetDate={saleEndTime} />
          </div>
        </div>

        {/* Global Messages */}
        {checkoutMessage && !isCartOpen && (
          <div className={`mb-8 p-4 rounded-xl flex items-center justify-center font-medium shadow-sm border ${
            checkoutMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {checkoutMessage.text}
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No products available</h2>
            <p className="text-slate-600 mb-6">The flash sale catalog is currently empty.</p>
            {isAdmin ? (
              <button 
                onClick={seedDatabase} 
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Initialize Store Database
              </button>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 inline-block px-4 py-2 rounded-lg">
                Please log in as the administrator (nicokie0420@gmail.com) to initialize the store.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isSaleActive={isSaleActive} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />
      
      {/* Drawer Messages (rendered inside or over drawer ideally, but simple alert here for now) */}
      {isCartOpen && checkoutMessage && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm w-full animate-in slide-in-from-bottom-5">
           <div className={`p-4 rounded-xl shadow-lg border font-medium ${
            checkoutMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {checkoutMessage.text}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}
