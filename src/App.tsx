import React, { useState, useEffect } from 'react';
import { CartProvider, Product, useCart } from './context/CartContext';
import { CountdownTimer } from './components/CountdownTimer';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { ShoppingBag, Zap, RefreshCw } from 'lucide-react';

function AppContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const { cart, itemCount, clearCart } = useCart();

  // Set flash sale end time to 1 hour from now for demo purposes
  const [saleEndTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const isSaleActive = new Date() < saleEndTime;

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Poll for inventory updates every 5 seconds
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsCheckingOut(true);
    setCheckoutMessage(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({ productId: item.id, quantity: item.quantity })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCheckoutMessage({ type: 'success', text: 'Order placed successfully! Items secured.' });
        clearCart();
        fetchProducts(); // Refresh inventory immediately
        setTimeout(() => {
          setIsCartOpen(false);
          setCheckoutMessage(null);
        }, 3000);
      } else {
        setCheckoutMessage({ 
          type: 'error', 
          text: data.details ? data.details.join(', ') : data.error || 'Checkout failed' 
        });
        fetchProducts(); // Refresh inventory to show what's out of stock
      }
    } catch (error) {
      setCheckoutMessage({ type: 'error', text: 'Network error during checkout. Please try again.' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const resetInventory = async () => {
    try {
      await fetch('/api/admin/reset', { method: 'POST' });
      fetchProducts();
      setCheckoutMessage({ type: 'success', text: 'Inventory reset for testing.' });
      setTimeout(() => setCheckoutMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset inventory', error);
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
              <button 
                onClick={resetInventory}
                className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Stock
              </button>
              
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
        {isLoading && products.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
