function loadCart(){
  let cart=JSON.parse(localStorage.getItem("cart")||"[]");
  const container=document.getElementById("cartContainer");
  const totalDOM=document.getElementById("cartTotal");
  const subtotalDOM=document.getElementById("cartSubtotal");
  const emptyMsg=document.getElementById("emptyCartMsg");
  const summarySection=document.getElementById("cartSummarySection");
  const digitalBillSection=document.getElementById("digitalBillSection");
  
  container.innerHTML="";
  let total=0;

  if(cart.length === 0) {
    container.style.display="none";
    emptyMsg.style.display="block";
    summarySection.style.display="none";
    digitalBillSection.style.display="none";
    return;
  }

  container.style.display="grid";
  emptyMsg.style.display="none";
  summarySection.style.display="block";
  digitalBillSection.style.display="none";

  function toUrl(path) {
    if (!path) return path;
    if (path.startsWith('http') || path.startsWith('//')) return path;
    return path.startsWith('/') ? path : '/' + path;
  }

  cart.forEach((i,index)=>{
    total+=i.price*i.qty;
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML=`
      <div class="cart-item-image">
        <img src="${toUrl(i.img)}" alt="${i.name}" style="cursor: zoom-in; width: 100%; height: 100%; object-fit: contain;">
      </div>
      <div class="cart-item-info">
        <h4>${i.name}</h4>
        <p class="cart-item-category">${i.category}</p>
        <div class="cart-item-quantity">
          <button onclick="updateQty(${index}, ${i.qty - 1})" class="qty-btn">−</button>
          <span>${i.qty}</span>
          <button onclick="updateQty(${index}, ${i.qty + 1})" class="qty-btn">+</button>
        </div>
      </div>
      <div class="cart-item-price">
        <p class="price-per-unit">Rs${i.price}</p>
        <p class="price-total">Rs${i.price * i.qty}</p>
      </div>
      <div class="cart-item-action">
        <button class="btn-remove" onclick="removeItem(${index})">🗑️ Remove</button>
      </div>
    `;
    container.appendChild(cartItem);
    
    // Make image open in fullscreen/lightbox
    const imgEl = cartItem.querySelector('img');
    if (imgEl) {
      imgEl.addEventListener('click', () => openCartImageLightbox(i.img, i.name));
    }
  });

  totalDOM.innerText=total;
  subtotalDOM.innerText=total;
  
  // Update digital bill
  updateDigitalBill(cart, total);
}

function updateDigitalBill(cart, total) {
  const billItemsBody = document.getElementById("billItemsBody");
  const billSubtotal = document.getElementById("billSubtotal");
  const billGrandTotal = document.getElementById("billGrandTotal");
  const billOrderId = document.getElementById("billOrderId");
  const billDate = document.getElementById("billDate");
  const billCustomerName = document.getElementById("billCustomerName");
  const billCustomerEmail = document.getElementById("billCustomerEmail");
  const billCustomerPhone = document.getElementById("billCustomerPhone");
  const billDeliveryAddress = document.getElementById("billDeliveryAddress");

  // Set current date
  const today = new Date();
  const dateStr = today.getDate() + "/" + (today.getMonth() + 1) + "/" + today.getFullYear();
  billDate.innerText = dateStr;

  // Generate order ID
  billOrderId.innerText = "#ORD-" + Math.floor(100000 + Math.random() * 900000);

  // Set customer details from stored profile (preferred) or legacy keys
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch (e) {
    stored = null;
  }

  const userName = (stored && stored.name) || "Guest Customer";
  const userEmail = (stored && stored.email) || "Not provided";
  const userPhone = (stored && stored.phone) || "Not provided";
  const userAddress = (stored && stored.address) || "Not provided";

  billCustomerName.innerText = userName;
  billCustomerEmail.innerText = userEmail;
  billCustomerPhone.innerText = userPhone;
  billDeliveryAddress.innerText = userAddress;

  // Populate items
  billItemsBody.innerHTML = "";
  cart.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>Rs ${item.price}</td>
      <td>${item.qty}</td>
      <td>Rs ${item.price * item.qty}</td>
    `;
    billItemsBody.appendChild(row);
  });

  billSubtotal.innerText = total;
  billGrandTotal.innerText = total;
}


function openCartImageLightbox(src, name) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;
  overlay.style.cursor = 'zoom-out';

  const big = document.createElement('img');
  big.src = src.startsWith('http') ? src : (src.startsWith('/') ? src : '/' + src);
  big.style.maxWidth = '95%';
  big.style.maxHeight = '95%';
  big.style.objectFit = 'contain';
  big.alt = name;

  overlay.appendChild(big);
  overlay.onclick = () => {
    if(document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  };
  document.body.appendChild(overlay);

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      if (document.body.contains(overlay)) document.body.removeChild(overlay);
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function removeItem(i){
  let cart=JSON.parse(localStorage.getItem("cart")||"[]");
  const itemName = cart[i]?.name || "Item";
  cart.splice(i,1);
  localStorage.setItem("cart",JSON.stringify(cart));
  showToast(`❌ ${itemName} removed from cart`);
  loadCart();
}

function updateQty(index, newQty) {
  if(newQty < 1) {
    removeItem(index);
    return;
  }
  let cart=JSON.parse(localStorage.getItem("cart")||"[]");
  cart[index].qty = newQty;
  localStorage.setItem("cart",JSON.stringify(cart));
  loadCart();
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

/* WhatsApp Checkout */
document.getElementById("btnCheckoutWA").onclick=()=>{
  let cart=JSON.parse(localStorage.getItem("cart")||"[]");
  // Prefer structured profile saved at login
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch(e) { stored = null; }
  const userEmail = (stored && stored.email) || "Not provided";
  const userName = (stored && stored.name) || "Valued Customer";
  const userPhone = (stored && stored.phone) || "Not provided";
  const userAddress = (stored && stored.address) || "Not provided";
  
  if(!cart.length) {
    alert("Cart is empty! 🛍️");
    return;
  }

  // Simple text-based format without special symbols
  let text = "NEW ORDER REQUEST\n";
  text += "=====================================\n\n";
  
  text += "CUSTOMER DETAILS:\n";
  text += "Name: " + userName + "\n";
  text += "Email: " + userEmail + "\n";
  text += "Phone: " + userPhone + "\n";
  text += "Delivery Address: " + userAddress + "\n\n";
  
  text += "ORDER ITEMS:\n";
  text += "-------------------------------------\n";
  let total = 0;
  
  cart.forEach((i, idx) => {
    const itemTotal = i.price * i.qty;
    total += itemTotal;
    text += "\n" + idx + 1 + ". " + i.name + "\n";
    text += "   Category: " + i.category + "\n";
    text += "   Unit Price: Rs " + i.price + "\n";
    text += "   Quantity: " + i.qty + "\n";
    text += "   Item Total: Rs " + itemTotal + "\n";
  });
  
  text += "\n-------------------------------------\n";
  text += "PRICE BREAKDOWN:\n";
  text += "Subtotal: Rs " + total + "\n";
  text += "Discount: Rs 0\n";
  text += "Shipping: FREE\n";
  text += "Tax: Rs 0\n";
  text += "-------------------------------------\n";
  text += "GRAND TOTAL: Rs " + total + "\n";
  text += "=====================================\n\n";
  text += "Please confirm this order. We will contact you shortly for payment details.";

  const encodedText = encodeURIComponent(text);
  window.open("https://wa.me/919480191392?text=" + encodedText, "_blank");
};


if(document.getElementById("cartContainer")) {
  loadCart();
  
  // View Digital Bill Button
  const btnViewBill = document.getElementById("btnViewBill");
  if (btnViewBill) {
    btnViewBill.onclick = () => {
      // Ensure user is logged in / profile available
      let stored = null;
      try { stored = JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch(e) { stored = null; }
      const currentName = (stored && stored.name) || null;
      const currentEmail = (stored && stored.email) || null;
      const currentPhone = (stored && stored.phone) || null;
      const currentAddress = (stored && stored.address) || null;

      if (!currentName || !currentEmail || !currentPhone || !currentAddress) {
        alert('Please login and complete your profile before viewing the digital bill.');
        // Redirect to main page where login/signup form exists
        window.location.href = 'index.html';
        return;
      }

      // Toggle bill visibility
      const billSection = document.getElementById("digitalBillSection");
      const cartContainer = document.getElementById("cartContainer");
      
      if (billSection.style.display === "none" || billSection.style.display === "") {
        billSection.style.display = "block";
        cartContainer.style.display = "none";
        btnViewBill.textContent = "← Back to Cart";
        window.scrollTo(0, 0);
      } else {
        billSection.style.display = "none";
        cartContainer.style.display = "grid";
        btnViewBill.textContent = "📄 View Digital Bill";
      }
    };
  }
}

// Logout button handler
const userLogoutBtn = document.getElementById('userLogoutBtn');
if (userLogoutBtn) {
  userLogoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout fetch failed', e);
    }
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
    // Redirect to index
    window.location.href = 'index.html';
  });
}
