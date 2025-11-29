/* ========== USER FETCH ========== */
async function loadUser(){
  try {
    const r=await fetch("/api/auth/me",{credentials:"include"});
    if(!r.ok) return location.href="index.html";
    const u=await r.json();
    document.getElementById("userGreeting").innerText=`👋 Hi, ${u.name}!`;
  } catch(err) {
    console.error("Error loading user:", err);
    document.getElementById("userGreeting").innerText="👤 Guest";
  }
}

/* ========== DISPLAY CATEGORIES ========== */
async function loadCategories(){
  try {
    const categoriesLoading = document.getElementById("categoriesLoading");
    const categoriesEmpty = document.getElementById("categoriesEmpty");
    const cR=await fetch("/api/categories");
    const categories=await cR.json();

    const pR=await fetch("/api/products");
    const allProducts=await pR.json();

    const grid=document.getElementById("categoriesGrid");
    grid.innerHTML="";

    if(!categories || categories.length === 0) {
      grid.style.display="none";
      categoriesEmpty.style.display="block";
      categoriesLoading.style.display="none";
      return;
    }

    grid.style.display="grid";
    categoriesEmpty.style.display="none";
    categoriesLoading.style.display="none";

    function toUrl(path) {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('//')) return path;
      return path.startsWith('/') ? path : '/' + path;
    }

    categories.forEach(c=>{
      const firstProduct=allProducts.find(p=>p.category?._id===c._id);
      const productCount = allProducts.filter(p => p.category?._id === c._id).length;
      const img=(firstProduct?.images?.[0])?toUrl(firstProduct.images[0]):"https://via.placeholder.com/200?text="+encodeURIComponent(c.name);

      const catItem = document.createElement('div');
      catItem.className = 'category-item';
      catItem.style.cursor = 'pointer';
      catItem.innerHTML=`
        <img src="${img}" alt="${c.name}">
        <div class="category-info">
          <h3>${c.name}</h3>
          <p class="product-count">${productCount} items</p>
        </div>
      `;
      catItem.onclick = () => {
        document.getElementById('filterBtn').innerText = c.name;
        document.getElementById('filterBtn').dataset.categoryId = c._id;
        loadProducts(c._id);
        document.getElementById('productsSection').scrollIntoView({behavior: 'smooth'});
      };
      grid.appendChild(catItem);
    });
  } catch(err) {
    console.error("Error loading categories:", err);
    const categoriesLoading = document.getElementById("categoriesLoading");
    const categoriesEmpty = document.getElementById("categoriesEmpty");
    const grid=document.getElementById("categoriesGrid");
    grid.style.display="none";
    categoriesLoading.style.display="none";
    categoriesEmpty.style.display="block";
    categoriesEmpty.innerHTML='<p style="font-size: 3rem; margin-bottom: 1rem;">⚠️</p><p>Error loading categories. Please refresh the page.</p>';
  }
}

/* ========== DISPLAY PRODUCTS LIST ========== */
async function loadProducts(id=null){
  try {
    const productsLoading = document.getElementById("productsLoading");
    const productsEmpty = document.getElementById("productsEmpty");
    const filterSection = document.getElementById("filterSection");
    
    productsLoading.style.display="flex";
    
    const r=await fetch(`/api/products${id?`?categoryId=${id}`:""}`);
    const products=await r.json();
    const grid=document.getElementById("productsGrid");
    grid.innerHTML="";

    const cart=JSON.parse(localStorage.getItem("cart")||"[]");

    if(!products || products.length === 0) {
      grid.style.display="none";
      productsEmpty.style.display="block";
      productsLoading.style.display="none";
      if(filterSection) filterSection.style.display = id ? "flex" : "none";
      return;
    }

    grid.style.display="grid";
    productsEmpty.style.display="none";
    productsLoading.style.display="none";
    if(filterSection) filterSection.style.display = "flex";

    // Update filter button
    if(id && document.getElementById('filterBtn')) {
      const catsR = await fetch("/api/categories");
      const cats = await catsR.json();
      const cat = cats.find(c => c._id === id);
      if(cat) {
        document.getElementById('filterBtn').innerText = cat.name;
        document.getElementById('filterBtn').classList.add('active');
      }
    } else if(document.getElementById('filterBtn')) {
      document.getElementById('filterBtn').innerText = 'All Categories';
      document.getElementById('filterBtn').classList.remove('active');
    }

    function toUrl(path) {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('//')) return path;
      return path.startsWith('/') ? path : '/' + path;
    }

    // Sort products by rating (simulated) and price
    products.sort((a, b) => a.price - b.price);

    products.forEach((p, idx)=>{
      const img=(p.images?.[0])?toUrl(p.images[0]):"https://via.placeholder.com/250?text=No+Image";
      const exists=cart.some(i=>i._id===p._id);
      
      // Simulated rating (in real app, would come from database)
      const rating = (4 + Math.random()).toFixed(1);
      const reviews = Math.floor(Math.random() * 500) + 50;

      const prodItem = document.createElement('div');
      prodItem.className = 'product-item';
      prodItem.innerHTML=`
        <div class="product-image-wrapper">
          <img src="${img}" alt="${p.name}" style="cursor: pointer;" onclick="goToProduct('${p._id}')">
          <div class="product-badge">
            <span class="badge-sale">20% OFF</span>
          </div>
          <div class="product-overlay">
            <button class="quick-view-btn" onclick="goToProduct('${p._id}')">Quick View</button>
          </div>
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <div class="product-rating">
            <span class="stars">⭐ ${rating}</span>
            <span class="review-count">(${reviews})</span>
          </div>
          <div class="price-section">
            <span class="product-price">₹${p.price}</span>
            <span class="original-price">₹${Math.floor(p.price * 1.25)}</span>
            <span class="discount">20%</span>
          </div>
          <p class="product-desc">${p.description?.substring(0, 50) || 'Premium quality gift item'}...</p>
          <button onclick="toggleCart('${p._id}','${p.name}','${p.price}','${p.category?.name}','${img}')" 
                  class="product-btn ${exists?'added':''}">
            ${exists?'✓ In Cart':'Add to Cart'}
          </button>
        </div>
      `;
      grid.appendChild(prodItem);
    });
  } catch(err) {
    console.error("Error loading products:", err);
    const productsLoading = document.getElementById("productsLoading");
    const productsEmpty = document.getElementById("productsEmpty");
    const grid=document.getElementById("productsGrid");
    grid.style.display="none";
    productsLoading.style.display="none";
    productsEmpty.style.display="block";
    productsEmpty.innerHTML='<p style="font-size: 3rem; margin-bottom: 1rem;">⚠️</p><p>Error loading products. Please refresh the page.</p>';
  }
}

// SORT PRODUCTS BY DIFFERENT CRITERIA
function sortProducts(sortBy) {
  if (!sortBy) return;
  
  const items = document.querySelectorAll('.product-item');
  const container = document.getElementById('productsGrid');
  const itemsArray = Array.from(items);
  
  itemsArray.sort((a, b) => {
    const getPriceFromCard = (card) => {
      const priceText = card.querySelector('.product-price')?.textContent || '';
      return parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    };
    
    const getRatingFromCard = (card) => {
      const ratingText = card.querySelector('.stars')?.textContent || '';
      const match = ratingText.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    };
    
    if (sortBy === 'price-low') {
      return getPriceFromCard(a) - getPriceFromCard(b);
    } else if (sortBy === 'price-high') {
      return getPriceFromCard(b) - getPriceFromCard(a);
    } else if (sortBy === 'rating') {
      return getRatingFromCard(b) - getRatingFromCard(a);
    }
  });
  
  // Re-render the sorted items
  itemsArray.forEach(item => container.appendChild(item));
}

// CLEAR CATEGORY FILTER
function clearFilter() {
  document.getElementById('filterBtn').innerText = 'All Categories';
  document.getElementById('filterBtn').classList.remove('active');
  document.getElementById('filterBtn').dataset.categoryId = '';
  loadProducts();
}

/* ========== GO TO PRODUCT ========== */
function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

/* ========== CLEAR CATEGORY FILTER ========== */
function clearFilter() {
  document.getElementById('filterBtn').innerText = 'All Categories';
  document.getElementById('filterBtn').dataset.categoryId = '';
  loadProducts();
}

/* ========== CART TOGGLE ========== */
function toggleCart(id,name,price,category,img){
 let cart=JSON.parse(localStorage.getItem("cart")||"[]");
 const item=cart.find(i=>i._id===id);

 if(item) {
   location.href="cart.html";
   return;
 }

 cart.push({ _id:id,name,price,category,img,qty:1 });
 localStorage.setItem("cart",JSON.stringify(cart));
 
 // Show success toast
 showToast("✅ Added to cart!");
 loadProducts();
}

/* ========== TOAST NOTIFICATION ========== */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

/* ========== LOGOUT ========== */
document.getElementById("userLogoutBtn").onclick=()=>{
 fetch("/api/auth/logout",{method:"POST",credentials:"include"});
 localStorage.removeItem("cart");
 location.href="index.html";
};

loadUser();
loadCategories();
loadProducts();
