// cart-count.js
// Compute cart total items and update #cart-count on the page.
(function(){
  function computeAndSetCartCount(){
    try{
      const raw = localStorage.getItem('cart');
      const cart = raw ? JSON.parse(raw) : [];
      const total = Array.isArray(cart) ? cart.reduce((s,i)=>s + (Number(i.quantity)||0),0) : 0;
      const el = document.getElementById('cart-count');
      if (el) el.textContent = total;
      return total;
    }catch(e){ return 0; }
  }

  // expose updateCartCount if not defined already
  if (!window.updateCartCount) window.updateCartCount = computeAndSetCartCount;

  // run on DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', computeAndSetCartCount);
  else computeAndSetCartCount();

  // update when localStorage changes in other tabs
  window.addEventListener('storage', (ev)=>{
    if (ev.key === 'cart' || ev.key === null) computeAndSetCartCount();
  });
})();
