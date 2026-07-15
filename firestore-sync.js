// firestore-sync.js - Hệ thống đồng bộ toàn bộ dữ liệu với Firestore
// ============================================================

(function () {
    const SYNC_CONFIG = {
        // Cấu hình các collection và tên document
        collections: {
            users: 'users',
            orders: 'orders'
        }
    };

    let currentUser = null;
    let firestoreListeners = {}; // Lưu các listener để có thể hủy sau
    let db = null;

    // ============= UTILITY FUNCTIONS =============

    function getFirestoreDb() {
        if (!window.firebase || !window.firebase.firestore) {
            console.warn('Firebase Firestore not initialized');
            return null;
        }
        if (!db) {
            db = firebase.firestore();
        }
        return db;
    }

    function waitForFirebase(timeout = 5000) {
        return new Promise((resolve) => {
            if (window.firebase && window.__FIREBASE_INITIALIZED__) {
                resolve(true);
            } else {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    if (window.firebase && window.__FIREBASE_INITIALIZED__) {
                        clearInterval(interval);
                        resolve(true);
                    } else if (Date.now() - startTime > timeout) {
                        clearInterval(interval);
                        resolve(false);
                    }
                }, 100);
            }
        });
    }

    // ============= USER PROFILE SYNC =============

    async function syncUserProfile(userEmail) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();

            // Lấy dữ liệu user từ localStorage
            let user = null;
            try {
                user = JSON.parse(localStorage.getItem('loggedUser')) || 
                       JSON.parse(localStorage.getItem('loggedInUser'));
            } catch (e) {}

            if (!user) return;

            // Chuẩn bị dữ liệu profile
            const profileData = {
                email: emailLower,
                name: user.name || user.fullName || '',
                fullName: user.fullName || user.name || '',
                gender: user.gender || '',
                birthday: user.birthday || '',
                bankName: user.bankName || '',
                bankNumber: user.bankNumber || '',
                address: user.address || {},
                avatar: user.avatar || '',
                role: user.role || 'user',
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Đẩy lên Firestore
            await firestore.collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .set(profileData, { merge: true });

            console.log('✅ User profile synced to Firestore:', emailLower);
        } catch (e) {
            console.warn('❌ Error syncing user profile:', e);
        }
    }

    // ============= CART/GIỎ HÀNG SYNC =============

    async function syncCart(userEmail) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Lưu cart lên Firestore
            await firestore.collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('cart')
                .doc('items')
                .set({
                    items: cart,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                    appliedVoucher: localStorage.getItem('appliedVoucher') || ''
                }, { merge: true });

            console.log('✅ Cart synced to Firestore:', emailLower, 'Items:', cart.length);
        } catch (e) {
            console.warn('❌ Error syncing cart:', e);
        }
    }

    // Lắng nghe thay đổi cart từ Firestore
    function listenToCart(userEmail, callback) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const listenerId = 'cart_' + emailLower;

            // Hủy listener cũ nếu tồn tại
            if (firestoreListeners[listenerId]) {
                firestoreListeners[listenerId]();
                delete firestoreListeners[listenerId];
            }

            // Tạo listener mới
            firestoreListeners[listenerId] = firestore
                .collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('cart')
                .doc('items')
                .onSnapshot(doc => {
                    if (doc.exists) {
                        const cartData = doc.data();
                        const cart = cartData.items || [];
                        localStorage.setItem('cart', JSON.stringify(cart));
                        if (cartData.appliedVoucher) {
                            localStorage.setItem('appliedVoucher', cartData.appliedVoucher);
                        }
                        // Trigger event để các trang khác biết
                        window.dispatchEvent(new CustomEvent('cartUpdated', { 
                            detail: { cart, appliedVoucher: cartData.appliedVoucher } 
                        }));
                        if (callback) callback(cart);
                    }
                }, e => {
                    console.warn('Cart listener error:', e);
                });

            console.log('🔔 Listening to cart changes for:', emailLower);
        } catch (e) {
            console.warn('Error setting up cart listener:', e);
        }
    }

    // ============= ORDERS/ĐƠN HÀNG SYNC =============

    async function syncOrders(userEmail) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const orders = JSON.parse(localStorage.getItem('orders')) || [];
            const userOrders = orders.filter(o => 
                o.userEmail && o.userEmail.toLowerCase() === emailLower
            );

            // Lưu orders lên Firestore (một-nhiều: mỗi order là 1 document)
            const batch = firestore.batch();
            userOrders.forEach(order => {
                if (order.orderId) {
                    const orderRef = firestore.collection(SYNC_CONFIG.collections.orders).doc(order.orderId);
                    batch.set(orderRef, {
                        ...order,
                        userEmail: emailLower,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });

                    // Cũng lưu reference dưới users collection
                    const userOrderRef = firestore.collection(SYNC_CONFIG.collections.users)
                        .doc(emailLower)
                        .collection('orders')
                        .doc(order.orderId);
                    batch.set(userOrderRef, {
                        orderId: order.orderId,
                        status: order.status || 'pending',
                        total: order.total || 0,
                        createdAt: order.createdAt || order.confirmedAt || firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            });

            if (userOrders.length > 0) {
                await batch.commit();
                console.log('✅ Orders synced to Firestore:', userOrders.length, 'orders');
            }
        } catch (e) {
            console.warn('❌ Error syncing orders:', e);
        }
    }

    // Lắng nghe thay đổi orders từ Firestore
    function listenToOrders(userEmail, callback) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const listenerId = 'orders_' + emailLower;

            // Hủy listener cũ
            if (firestoreListeners[listenerId]) {
                firestoreListeners[listenerId]();
                delete firestoreListeners[listenerId];
            }

            // Lắng nghe tất cả orders của user
            firestoreListeners[listenerId] = firestore
                .collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('orders')
                .onSnapshot(snapshot => {
                    const userOrders = [];
                    snapshot.forEach(doc => {
                        userOrders.push({ id: doc.id, ...doc.data() });
                    });

                    // Cập nhật localStorage
                    const allOrders = JSON.parse(localStorage.getItem('orders')) || [];
                    const otherOrders = allOrders.filter(o => 
                        !o.userEmail || o.userEmail.toLowerCase() !== emailLower
                    );
                    const updatedOrders = [...otherOrders, ...userOrders];
                    localStorage.setItem('orders', JSON.stringify(updatedOrders));

                    // Trigger event
                    window.dispatchEvent(new CustomEvent('ordersUpdated', { 
                        detail: { orders: userOrders } 
                    }));

                    if (callback) callback(userOrders);
                }, e => {
                    console.warn('Orders listener error:', e);
                });

            console.log('🔔 Listening to orders changes for:', emailLower);
        } catch (e) {
            console.warn('Error setting up orders listener:', e);
        }
    }

    // ============= FAVORITES/YÊU THÍCH SYNC =============

    async function syncFavorites(userEmail) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

            await firestore.collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('preferences')
                .doc('favorites')
                .set({
                    items: favorites,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            console.log('✅ Favorites synced to Firestore:', favorites.length, 'items');
        } catch (e) {
            console.warn('❌ Error syncing favorites:', e);
        }
    }

    function listenToFavorites(userEmail, callback) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const listenerId = 'favorites_' + emailLower;

            if (firestoreListeners[listenerId]) {
                firestoreListeners[listenerId]();
                delete firestoreListeners[listenerId];
            }

            firestoreListeners[listenerId] = firestore
                .collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('preferences')
                .doc('favorites')
                .onSnapshot(doc => {
                    if (doc.exists && doc.data().items) {
                        const favorites = doc.data().items;
                        localStorage.setItem('favorites', JSON.stringify(favorites));
                        window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
                            detail: { favorites } 
                        }));
                        if (callback) callback(favorites);
                    }
                }, e => {
                    console.warn('Favorites listener error:', e);
                });

            console.log('🔔 Listening to favorites changes for:', emailLower);
        } catch (e) {
            console.warn('Error setting up favorites listener:', e);
        }
    }

    // ============= PREFERENCES/CÀI ĐẶT SYNC =============

    async function syncPreferences(userEmail, prefs) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const preferences = prefs || JSON.parse(localStorage.getItem('preferences')) || {};

            await firestore.collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('preferences')
                .doc('settings')
                .set({
                    ...preferences,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            localStorage.setItem('preferences', JSON.stringify(preferences));
            console.log('✅ Preferences synced to Firestore');
        } catch (e) {
            console.warn('❌ Error syncing preferences:', e);
        }
    }

    function listenToPreferences(userEmail, callback) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const listenerId = 'prefs_' + emailLower;

            if (firestoreListeners[listenerId]) {
                firestoreListeners[listenerId]();
                delete firestoreListeners[listenerId];
            }

            firestoreListeners[listenerId] = firestore
                .collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('preferences')
                .doc('settings')
                .onSnapshot(doc => {
                    if (doc.exists) {
                        const prefs = doc.data();
                        localStorage.setItem('preferences', JSON.stringify(prefs));
                        window.dispatchEvent(new CustomEvent('preferencesUpdated', { 
                            detail: { preferences: prefs } 
                        }));
                        if (callback) callback(prefs);
                    }
                }, e => {
                    console.warn('Preferences listener error:', e);
                });

            console.log('🔔 Listening to preferences changes for:', emailLower);
        } catch (e) {
            console.warn('Error setting up preferences listener:', e);
        }
    }

    // ============= VOUCHERS SYNC (tích hợp với hệ thống cũ) =============

    async function syncVouchers(userEmail) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const vouchers = JSON.parse(localStorage.getItem('vouchers')) || [];

            // Lưu vouchers lên Firestore
            await firestore.collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('vouchers')
                .doc('list')
                .set({
                    items: vouchers,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

            console.log('✅ Vouchers synced to Firestore:', emailLower, 'Count:', vouchers.length);
        } catch (e) {
            console.warn('❌ Error syncing vouchers:', e);
        }
    }

    function listenToVouchers(userEmail, callback) {
        if (!userEmail) return;
        try {
            const firestore = getFirestoreDb();
            if (!firestore) return;

            const emailLower = userEmail.toLowerCase().trim();
            const listenerId = 'vouchers_' + emailLower;

            if (firestoreListeners[listenerId]) {
                firestoreListeners[listenerId]();
                delete firestoreListeners[listenerId];
            }

            firestoreListeners[listenerId] = firestore
                .collection(SYNC_CONFIG.collections.users)
                .doc(emailLower)
                .collection('vouchers')
                .doc('list')
                .onSnapshot(doc => {
                    if (doc.exists && doc.data().items) {
                        const vouchers = doc.data().items;
                        localStorage.setItem('vouchers', JSON.stringify(vouchers));
                        window.dispatchEvent(new CustomEvent('vouchersUpdated', { 
                            detail: vouchers 
                        }));
                        if (callback) callback(vouchers);
                    }
                }, e => {
                    console.warn('Vouchers listener error:', e);
                });

            console.log('🔔 Listening to vouchers changes for:', emailLower);
        } catch (e) {
            console.warn('Error setting up vouchers listener:', e);
        }
    }

    // ============= MAIN SYNC FUNCTION =============

    async function initializeFullSync(userEmail) {
        if (!userEmail) {
            console.warn('No user email provided for sync');
            return false;
        }

        try {
            // Đợi Firebase khởi tạo
            const firebaseReady = await waitForFirebase();
            if (!firebaseReady) {
                console.error('Firebase not initialized after timeout');
                return false;
            }

            currentUser = userEmail;
            console.log('🚀 Initializing full Firestore sync for:', userEmail);

            // Đồng bộ toàn bộ dữ liệu LÊN Firestore
            await Promise.all([
                syncUserProfile(userEmail),
                syncCart(userEmail),
                syncOrders(userEmail),
                syncFavorites(userEmail),
                syncPreferences(userEmail),
                syncVouchers(userEmail)
            ]);

            // Bắt đầu lắng nghe thay đổi TỪthead Firestore
            listenToCart(userEmail);
            listenToOrders(userEmail);
            listenToFavorites(userEmail);
            listenToPreferences(userEmail);
            listenToVouchers(userEmail);

            console.log('✅ Full Firestore sync initialized successfully');
            window.dispatchEvent(new CustomEvent('firestoreSyncReady', { 
                detail: { userEmail } 
            }));

            return true;
        } catch (e) {
            console.error('❌ Error initializing full sync:', e);
            return false;
        }
    }

    // ============= MANUAL SYNC FUNCTIONS =============

    async function syncDataNow(dataType) {
        if (!currentUser) return false;

        const syncFunctions = {
            'profile': () => syncUserProfile(currentUser),
            'cart': () => syncCart(currentUser),
            'orders': () => syncOrders(currentUser),
            'favorites': () => syncFavorites(currentUser),
            'preferences': () => syncPreferences(currentUser),
            'all': () => Promise.all([
                syncUserProfile(currentUser),
                syncCart(currentUser),
                syncOrders(currentUser),
                syncFavorites(currentUser),
                syncPreferences(currentUser),
                syncVouchers(currentUser)
            ])
        };

        try {
            if (syncFunctions[dataType]) {
                await syncFunctions[dataType]();
                console.log('✅ Synced:', dataType);
                return true;
            }
        } catch (e) {
            console.error('Error syncing:', dataType, e);
        }
        return false;
    }

    // ============= CLEANUP =============

    function unsubscribeAll() {
        Object.values(firestoreListeners).forEach(unsubscribe => {
            try {
                unsubscribe();
            } catch (e) {}
        });
        firestoreListeners = {};
        currentUser = null;
        console.log('✅ All Firestore listeners unsubscribed');
    }

    // ============= EXPORT API =============

    window.FirestoreSync = {
        // Main functions
        initialize: initializeFullSync,
        syncNow: syncDataNow,
        unsubscribeAll: unsubscribeAll,

        // Individual sync functions
        syncUserProfile,
        syncCart,
        syncOrders,
        syncFavorites,
        syncPreferences,
        syncVouchers,

        // Individual listen functions
        listenToCart,
        listenToOrders,
        listenToFavorites,
        listenToPreferences,
        listenToVouchers,

        // Status functions
        getCurrentUser: () => currentUser,
        isInitialized: () => currentUser !== null
    };

    console.log('✅ FirestoreSync module loaded');
})();
