/**
 * Utility module to fetch all orders from Firestore
 * Supports both server-side (Cloud Functions) and direct Firestore access
 */

// Option 1: Fetch through Cloud Function (recommended for security)
async function getAllOrdersViaFunction() {
  try {
    const user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!user || user.role !== 'admin') {
      console.error('Admin access required');
      return null;
    }

    // Get token from localStorage or session
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found');
      return null;
    }

    const functionUrl = 'https://us-central1-thao-vy-store.cloudfunctions.net/getAllOrders';
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching orders:', error);
      return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error in getAllOrdersViaFunction:', error);
    return null;
  }
}

// Option 2: Direct Firestore access (requires proper security rules)
async function getAllOrdersDirectly() {
  try {
    if (!window.firebase || !window.__FIREBASE_INITIALIZED__) {
      console.error('Firebase not initialized');
      return null;
    }

    const db = firebase.firestore();
    const user = JSON.parse(localStorage.getItem('loggedUser')) || JSON.parse(localStorage.getItem('loggedInUser'));
    
    if (!user || user.role !== 'admin') {
      console.error('Admin access required');
      return null;
    }

    // Query all orders from global collection
    const ordersSnapshot = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .get();

    const orders = [];
    const stats = {
      totalOrders: 0,
      totalRevenue: 0,
      ordersByUser: {},
      ordersByStatus: {},
      ordersByDate: {}
    };

    ordersSnapshot.forEach(doc => {
      const order = {
        id: doc.id,
        ...doc.data()
      };
      
      orders.push(order);
      
      // Calculate stats
      stats.totalOrders++;
      stats.totalRevenue += (order.total || 0);
      
      // Group by user
      const userEmail = order.userEmail || order.email || 'Unknown';
      if (!stats.ordersByUser[userEmail]) {
        stats.ordersByUser[userEmail] = {
          count: 0,
          totalSpent: 0,
          orders: []
        };
      }
      stats.ordersByUser[userEmail].count++;
      stats.ordersByUser[userEmail].totalSpent += (order.total || 0);
      stats.ordersByUser[userEmail].orders.push(order.orderId);
      
      // Group by status
      const status = order.status || 'unknown';
      if (!stats.ordersByStatus[status]) {
        stats.ordersByStatus[status] = 0;
      }
      stats.ordersByStatus[status]++;
      
      // Group by date
      const date = order.orderDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'Unknown');
      if (!stats.ordersByDate[date]) {
        stats.ordersByDate[date] = {
          count: 0,
          revenue: 0
        };
      }
      stats.ordersByDate[date].count++;
      stats.ordersByDate[date].revenue += (order.total || 0);
    });

    return {
      success: true,
      stats,
      orders,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in getAllOrdersDirectly:', error);
    return null;
  }
}

// Export all orders to CSV format
function exportOrdersToCSV(orders, filename = 'all-orders.csv') {
  if (!orders || orders.length === 0) {
    console.warn('No orders to export');
    return;
  }

  // Prepare CSV header
  const headers = [
    'Order ID',
    'User Email',
    'Customer Name',
    'Phone',
    'Address',
    'Status',
    'Total',
    'Products',
    'Order Date',
    'Payment Method',
    'Delivery Type'
  ];

  // Prepare CSV rows
  const rows = orders.map(order => [
    order.orderId || order.id || '',
    order.userEmail || order.email || '',
    order.customer?.name || order.name || '',
    order.customer?.phone || order.phone || '',
    order.customer?.address || order.address || '',
    order.status || 'pending',
    order.total || 0,
    order.products?.length || 0,
    order.orderDate || order.createdAt || '',
    order.payment || 'unknown',
    order.delivery || 'unknown'
  ]);

  // Create CSV content
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export all orders to JSON format
function exportOrdersToJSON(orderData, filename = 'all-orders.json') {
  if (!orderData) {
    console.warn('No orders to export');
    return;
  }

  const json = JSON.stringify(orderData, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Main function to get and display all orders
async function fetchAndDisplayAllOrders() {
  console.log('Fetching all orders...');
  
  // Try cloud function first, fallback to direct Firestore
  let result = await getAllOrdersViaFunction();
  
  if (!result) {
    console.log('Cloud Function failed, trying direct Firestore access...');
    result = await getAllOrdersDirectly();
  }

  if (result && result.orders) {
    console.log('All orders fetched successfully:', result);
    console.log('Total orders:', result.stats?.totalOrders || result.orders.length);
    console.log('Total revenue:', result.stats?.totalRevenue || 'N/A');
    return result;
  } else {
    console.error('Failed to fetch orders');
    return null;
  }
}

// Make functions available globally
window.getAllOrders = {
  viaFunction: getAllOrdersViaFunction,
  directly: getAllOrdersDirectly,
  fetch: fetchAndDisplayAllOrders,
  exportCSV: exportOrdersToCSV,
  exportJSON: exportOrdersToJSON
};

// Usage examples (uncomment to use in console):
// window.getAllOrders.fetch().then(result => { if(result) { console.table(result.orders); } });
// window.getAllOrders.exportCSV(result.orders);
// window.getAllOrders.exportJSON(result);
