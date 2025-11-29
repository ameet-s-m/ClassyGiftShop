/* ========== USER FETCH ========== */
async function loadUser(){
  try {
    const r = await fetch("/api/auth/me",{credentials:"include"});
    if(!r.ok) return location.href="index.html";
    const u = await r.json();
    document.getElementById("userGreeting").innerText=`👋 Hi, ${u.name}!`;
  } catch(err) {
    console.error("Error loading user:", err);
    document.getElementById("userGreeting").innerText="👤 Guest";
  }
}

/* ========== IMAGE URL HANDLER (FIXED FOR CLOUDINARY) ========== */
function toUrl(path) {
  return (path && path.startsWith("http")) 
         ? path 
         : "https://via.placeholder.com/250?text=No+Image";
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

    categories.forEach(c=>{
      const firstProduct=allProducts.find(p=>p.category?._id===c._id);
      const productCount = allProducts.filter(p => p.category?._id === c._id).length;
      const img = toUrl(firstProduct?.images?.[0]);

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
    console.error("Error:", err);
    categoriesLoading.style.display="none";
    categoriesEmpty.style.display="block";
  }
}

/* ========== DISPLAY PRODUCTS LIST ========== */
async function loadProducts(id=null){
  try {
    const productsLoading = document.getElementById("productsLoading");
    const productsEmpty = document.getElementById("productsEmpty");
    const filterSection = document.getElementById("filterSection");
    
    productsLoading.style.display="flex";
    const r = await fetch(`/api/products${id?`?categoryId=${id}`:""}`);
    const products = await r.json();
    const grid = document.getElementById("productsGrid");
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

    // Sort products by price (default)
    products.sort((a, b) => a.price - b.price);

    products.forEach((p)=>{
      const img = toUrl(p.images?.[0]);
      const exists = cart.some(i=>i._id===p._id);

      const rating = (4 + Math.random()).toFixed(1);
      const reviews = Math.floor(Math.random() * 500) + 50;

      const prodItem = document.createElement('div');
      prodItem.className = 'product-item';

      prodItem.innerHTML=`
        <div class="product-image-wrapper">
          <img src="${img}" alt="${p.name}" onclick="goToProduct('${p._id}')">
          <div class="product-badge"><span class="badge-sale">20% OFF</span></div>
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

          <p class="product-desc">${p.description?.substring(0, 50) || ''}...</p>

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
  }
}

/* ========== CART HELPERS ========== */
function goToProduct(id){ window.location.href=`product.html?id=${id}` }

function toggleCart(id,name,price,category,img){
 let cart=JSON.parse(localStorage.getItem("cart")||"[]");
 const item=cart.find(i=>i._id===id);

 if(item) return location.href="cart.html";

 cart.push({ _id:id,name,price,category,img,qty:1 });
 localStorage.setItem("cart",JSON.stringify(cart));

 showToast("✅ Added to cart!");
 loadProducts();
}

function showToast(msg){
  const t=document.createElement('div');
  t.className='toast-notification';
  t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2000);
}

/* ========== LOGOUT ========== */
document.getElementById("userLogoutBtn").onclick=()=>{
 fetch("/api/auth/logout",{method:"POST",credentials:"include"});
 localStorage.removeItem("cart");
 location.href="index.html";
};

loadUser(); loadCategories(); loadProducts();
