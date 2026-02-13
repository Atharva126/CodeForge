import { useState, useEffect } from 'react';
import { Package, Download, Play, Calendar, CheckCircle, Clock, Loader2, FileText, Printer, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  currency: '₹' | '$';
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
}

interface OrderItem {
  id: string;
  name: string;
  category: 'course' | 'digital' | 'goodie';
  price: number;
  quantity: number;
  downloadable?: boolean;
  accessUrl?: string;
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch user_orders with children user_order_items and their store_items
      const { data, error } = await supabase
        .from('user_orders')
        .select(`
          id,
          created_at,
          total,
          currency,
          status,
          user_order_items (
            price,
            quantity,
            size,
            store_items (
              name,
              category,
              downloadable
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformed: Order[] = (data || []).map((order: any) => ({
        id: order.id.split('-')[0].toUpperCase(), // Friendly ID
        date: order.created_at,
        total: order.total,
        currency: order.currency,
        status: order.status,
        items: order.user_order_items.map((item: any) => ({
          id: order.id, // Using order ID as ref for now
          name: item.store_items.name,
          category: item.store_items.category,
          price: parseFloat(item.price),
          quantity: item.quantity,
          downloadable: item.store_items.downloadable,
          // Access URLs would normally be generated based on item/category
          accessUrl: item.store_items.category === 'course'
            ? `/courses/${item.store_items.name.toLowerCase().replace(/\s+/g, '-')}`
            : item.store_items.downloadable
              ? `/downloads/${item.store_items.name.toLowerCase().replace(/\s+/g, '-')}`
              : undefined
        }))
      }));

      setOrders(transformed);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'processing': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'pending': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'course': return <Play className="w-4 h-4" />;
      case 'digital': return <Download className="w-4 h-4" />;
      case 'goodie': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your purchases and access your digital content
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-gray-500">Retrieving your order history...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">Order #{order.id}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {order.currency}{order.total.toLocaleString()}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Purchased Items</h3>
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-sm">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)} • Quantity: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {order.currency}{item.price.toLocaleString()}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {item.downloadable && order.status === 'completed' && (
                                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  Download
                                </button>
                              )}
                              {item.accessUrl && order.status === 'completed' && (
                                <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                  <Play className="w-3 h-3" />
                                  Access
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between px-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {order.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Order Delivered Successfully
                        </div>
                      )}
                      {order.status === 'processing' && (
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <Clock className="w-4 h-4" />
                          Processing Order...
                        </div>
                      )}
                      {order.status === 'pending' && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          Waiting for Confirmation
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-20 border border-gray-200 dark:border-gray-800 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No orders found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              Your order history is empty. Time to gear up and start your learning journey!
            </p>
            <a href="/store" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
              Go to Store
            </a>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl overflow-hidden print:shadow-none print:max-h-none print:overflow-visible">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 print:hidden">
              <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <FileText className="w-5 h-5 text-blue-500" />
                Order Invoice
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Print Invoice"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-10 font-sans print:p-0" id="invoice-content">
              {/* Brand Header */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="text-3xl font-black text-blue-600 mb-2">CODEFORGE</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Elevating your coding journey through premium courses and digital resources.
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-4xl font-extrabold text-gray-950 dark:text-white uppercase tracking-tighter mb-2">Invoice</h1>
                  <div className="text-sm text-gray-500 dark:text-gray-400">#INV-{selectedInvoiceOrder.id}</div>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To:</div>
                  <div className="font-bold text-gray-900 dark:text-white text-lg">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Forge Coder'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Order Details:</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">Date:</span> {new Date(selectedInvoiceOrder.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">Status:</span> {selectedInvoiceOrder.status.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-gray-900 dark:text-white">Payment:</span> {selectedInvoiceOrder.total > 0 ? 'Online Payment' : 'Forge Coins Redemption'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-12">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-900 dark:border-white">
                      <th className="py-4 font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest">Description</th>
                      <th className="py-4 font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest text-right">Qty</th>
                      <th className="py-4 font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest text-right">Price</th>
                      <th className="py-4 font-bold text-gray-900 dark:text-white uppercase text-xs tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedInvoiceOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-6">
                          <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">{item.category}</div>
                        </td>
                        <td className="py-6 text-right text-gray-700 dark:text-gray-300 font-mono">{item.quantity}</td>
                        <td className="py-6 text-right text-gray-700 dark:text-gray-300 font-mono">{selectedInvoiceOrder.currency}{item.price.toLocaleString()}</td>
                        <td className="py-6 text-right text-gray-900 dark:text-white font-bold font-mono">{selectedInvoiceOrder.currency}{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-mono text-gray-900 dark:text-white">{selectedInvoiceOrder.currency}{selectedInvoiceOrder.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax (Included)</span>
                    <span className="font-mono text-gray-900 dark:text-white">{selectedInvoiceOrder.currency}0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-t border-gray-900 dark:border-white">
                    <span className="text-xl font-black uppercase tracking-tighter">Total</span>
                    <span className="text-2xl font-black font-mono">{selectedInvoiceOrder.currency}{selectedInvoiceOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-20 pt-12 border-t border-gray-100 dark:border-gray-800 text-center">
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-2 italic">Thank you for being part of CodeForge!</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  This is a computer generated invoice and does not require a physical signature.
                  <br />
                  For support, contact us at <span className="text-blue-500">support@codeforge.io</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
