// Voucher utility: lưu lên Firestore + localStorage, đồng bộ real-time
(function () {
  const KEY = 'vouchers';
  let userEmail = null;
  let firestoreUnsubscribe = null;

  // Lấy voucher từ localStorage
  function getVouchersLocal() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  // Lưu voucher vào localStorage
  function saveVouchersLocal(list) {
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  // Lấy voucher từ Firestore
  async function getVouchersFromFirestore(email) {
    if (!email || !window.firebase) return [];
    try {
      if (!window.__FIREBASE_INITIALIZED__) {
        await new Promise(r => setTimeout(r, 500));
      }
      const db = firebase.firestore();
      const emailLower = email.toLowerCase().trim();
      const doc = await db.collection('users').doc(emailLower).collection('vouchers').doc('list').get();
      return doc.exists ? (doc.data().items || []) : [];
    } catch (e) {
      console.warn('Failed to get vouchers from Firestore:', e);
      return [];
    }
  }

  // Lưu voucher lên Firestore
  async function saveVouchersToFirestore(email, list) {
    if (!email || !window.firebase) return;
    try {
      if (!window.__FIREBASE_INITIALIZED__) {
        await new Promise(r => setTimeout(r, 500));
      }
      const db = firebase.firestore();
      const emailLower = email.toLowerCase().trim();
      await db.collection('users').doc(emailLower).collection('vouchers').doc('list').set({
        items: list || [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to save vouchers to Firestore:', e);
    }
  }

  // Lắng nghe thay đổi voucher real-time từ Firestore
  function listenToVouchersChanges(email) {
    if (!email || !window.firebase) return;
    
    // Hủy subscription cũ
    if (firestoreUnsubscribe) {
      firestoreUnsubscribe();
    }

    try {
      if (!window.__FIREBASE_INITIALIZED__) {
        setTimeout(() => listenToVouchersChanges(email), 500);
        return;
      }

      const db = firebase.firestore();
      const emailLower = email.toLowerCase().trim();
      
      firestoreUnsubscribe = db.collection('users').doc(emailLower)
        .collection('vouchers').doc('list')
        .onSnapshot(doc => {
          if (doc.exists) {
            const newList = doc.data().items || [];
            saveVouchersLocal(newList);
            // Trigger custom event để các trang khác biết
            window.dispatchEvent(new CustomEvent('vouchersUpdated', { detail: newList }));
          }
        }, e => {
          console.warn('Firestore listener error:', e);
        });
    } catch (e) {
      console.warn('Failed to set up Firestore listener:', e);
    }
  }

  // Đồng bộ với Firestore khi có user email
  window.syncVouchersWithFirestore = async function(email) {
    if (!email) return;
    userEmail = email;
    
    // Nếu Firestore chưa có dữ liệu, đẩy dữ liệu từ localStorage lên
    const firestoreVouchers = await getVouchersFromFirestore(email);
    const localVouchers = getVouchersLocal();
    
    if (firestoreVouchers.length === 0 && localVouchers.length > 0) {
      await saveVouchersToFirestore(email, localVouchers);
    } else if (firestoreVouchers.length > 0) {
      // Lấy dữ liệu từ Firestore nếu có
      saveVouchersLocal(firestoreVouchers);
    }

    // Bắt đầu lắng nghe thay đổi
    listenToVouchersChanges(email);
  };

  function getVouchers() {
    return getVouchersLocal();
  }

  function saveVouchers(list) {
    saveVouchersLocal(list);
    // Đẩy lên Firestore nếu có user email
    if (userEmail) {
      saveVouchersToFirestore(userEmail, list);
    }
  }

  function hasVoucher(code) {
    if (!code) return false;
    code = code.toString().trim().toUpperCase();
    return getVouchers().some(v => v && v.code === code);
  }

  function addVoucher(code, meta = {}) {
    if (!code) return { added: false, reason: 'empty' };
    code = code.toString().trim().toUpperCase();
    if (hasVoucher(code)) return { added: false, reason: 'exists' };
    const list = getVouchers();
    const v = Object.assign({ code, addedAt: new Date().toISOString() }, meta);
    list.push(v);
    saveVouchers(list);
    return { added: true, voucher: v };
  }

  function removeVoucher(code) {
    if (!code) return;
    code = code.toString().trim().toUpperCase();
    const list = getVouchers().filter(v => v && v.code !== code);
    saveVouchers(list);
    return list;
  }

  window.VoucherStore = {
    getVouchers,
    saveVouchers,
    hasVoucher,
    addVoucher,
    removeVoucher,
    syncWithFirestore: window.syncVouchersWithFirestore
  };
})();
