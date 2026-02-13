import { useState, useEffect } from 'react';
import { Star, Clock, Users, BookOpen, Download, Loader2, Sparkles, X, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  category: 'course' | 'digital' | 'goodie';
  price: number; // Keep for reference, but display forgeCoins
  currency: string;
  description: string;
  image: string;
  duration?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  instructor?: string;
  size?: string[];
  downloadable?: boolean;
  rating?: number;
  students?: number;
  forgeCoins: number;
}

export default function Store() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<'all' | 'courses' | 'digital' | 'goodies'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [userForgeCoins, setUserForgeCoins] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserCoins();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      const transformed = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        currency: item.currency,
        description: item.description,
        image: item.image,
        duration: item.duration,
        level: item.level,
        instructor: item.instructor,
        downloadable: item.downloadable,
        rating: parseFloat(item.rating),
        students: item.students,
        forgeCoins: item.forge_coins_price || Math.ceil(item.price * 10), // Fallback if null
        size: item.metadata?.sizes || []
      }));

      setProducts(transformed);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCoins = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('forge_coins')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) setUserForgeCoins(data.forge_coins || 0);
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => {
      if (activeCategory === 'courses') return p.category === 'course';
      if (activeCategory === 'digital') return p.category === 'digital';
      if (activeCategory === 'goodies') return p.category === 'goodie';
      return true;
    });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'course': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'digital': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'goodie': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleBuyNow = async (product: Product) => {
    if (!user) {
      alert('Please sign in to make a purchase.');
      return;
    }

    if (userForgeCoins < product.forgeCoins) {
      alert(`Insufficient Forge Coins! You need ${product.forgeCoins - userForgeCoins} more.`);
      return;
    }

    if (!confirm(`Are you sure you want to buy "${product.name}" for ${product.forgeCoins} Forge Coins?`)) {
      return;
    }

    try {
      setIsBuying(true);

      // Use the RPC function for atomic transaction
      const { data, error } = await supabase.rpc('purchase_item_with_coins', {
        p_item_id: product.id,
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.success) {
        setUserForgeCoins(data.new_balance);
        alert('Purchase successful! Item added to your inventory.');
        setSelectedProduct(null);
        // Refresh products to update enrollment counts if needed, or just specific item
      } else {
        alert(`Purchase failed: ${data?.message || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('Error during purchase:', error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setIsBuying(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartItems([...cartItems, product]);
    alert(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Store Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">CodeForge Store</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Redeem your hard-earned Forge Coins for exclusive rewards.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-orange-500/20 transform hover:scale-105 transition-transform">
              <img src="/forgecoin_svg.svg" alt="Forge Coins" className="w-8 h-8 drop-shadow-sm" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-yellow-100 uppercase tracking-wide">Your Balance</span>
                <span className="font-black text-white text-xl leading-none">{userForgeCoins.toLocaleString()} FC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {(['all', 'courses', 'digital', 'goodies'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap ${activeCategory === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-gray-500 animate-pulse font-medium">Loading items from the Forge...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            {filteredProducts.map((product) => (
              <div key={product.id} className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                {/* Product Image */}
                <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400/1e293b/cbd5e1?text=Product+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="w-full py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg font-bold text-sm hover:bg-white/20 transition-colors"
                    >
                      Quick View
                    </button>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide backdrop-blur-md ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{product.rating || 'New'}</span>
                    {product.students && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{product.students.toLocaleString()} students</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2">{product.name}</h3>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                    {product.duration && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" /> {product.duration}
                      </span>
                    )}
                    {product.level && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        <Sparkles className="w-3 h-3" /> {product.level}
                      </span>
                    )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <img src="/forgecoin_svg.svg" alt="FC" className="w-5 h-5" />
                      <span className="text-lg font-black text-gray-900 dark:text-white">{product.forgeCoins.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleBuyNow(product)}
                      disabled={isBuying || userForgeCoins < product.forgeCoins}
                      className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${userForgeCoins >= product.forgeCoins
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {isBuying && selectedProduct?.id === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Recommendations Placeholder */}
        {!loading && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recommended for You</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on your recent solve streak, update your arsenal with these advanced data structure courses.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Community Favorites</h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Join 500+ developers who redeemed the "Full Stack Masterclass" this week.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedProduct(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className="relative">
              <div className="h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => e.currentTarget.src = 'https://placehold.co/600x400/1e293b/cbd5e1?text=Product+Image'}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80" />
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 left-8 right-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide backdrop-blur-md text-white/90 bg-white/10 border border-white/20`}>
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.rating && (
                      <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-bold text-white">{selectedProduct.rating}</span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">{selectedProduct.name}</h2>
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Description</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm md:text-base">
                      {selectedProduct.description}
                    </p>
                  </div>
                  <div className="w-full md:w-1/3 space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Details</h3>
                    {selectedProduct.duration && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" /> Duration
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProduct.duration}</span>
                      </div>
                    )}
                    {selectedProduct.level && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                          <Sparkles className="w-4 h-4" /> Level
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedProduct.level}</span>
                      </div>
                    )}
                    {selectedProduct.downloadable && (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-200 dark:border-green-500/20">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
                          <Download className="w-4 h-4" /> Downloadable
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Cost</span>
                    <div className="flex items-center gap-2">
                      <img src="/forgecoin_svg.svg" alt="FC" className="w-8 h-8" />
                      <span className="text-4xl font-black text-gray-900 dark:text-white">{selectedProduct.forgeCoins.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBuyNow(selectedProduct)}
                      disabled={isBuying || userForgeCoins < selectedProduct.forgeCoins}
                      className={`px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all ${userForgeCoins >= selectedProduct.forgeCoins
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 hover:scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {isBuying ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <span>Redeem Now</span>
                          <ShoppingCart className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {userForgeCoins < selectedProduct.forgeCoins && (
                  <p className="text-center mt-3 text-red-500 text-sm font-medium">
                    Insufficient Forge Coins. Solve more problems to earn!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
