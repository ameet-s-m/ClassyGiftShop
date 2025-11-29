function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/* 🔥 NEW — Always return Cloudinary URL if available */
function toUrl(path) {
  return (path && path.startsWith('http'))
    ? path
    : "https://via.placeholder.com/400?text=No+Image";
}

async function loadProduct() {
  const id = getQueryId();
  if (!id) return (window.location.href = 'home.html');

  try {
    const res = await fetch('/api/products/' + id);
    if(!res.ok) throw new Error("Product not found");
    const p = await res.json();

    // Breadcrumbs
    document.getElementById('breadcrumbCategory').innerText = p.category?.name || 'Category';
    document.getElementById('breadcrumbProduct').innerText = p.name;

    // Product details
    document.getElementById('prodName').innerText = p.name;
    document.getElementById('prodPrice').innerText = '₹' + p.price;
    document.getElementById('prodCategory').innerText = p.category?.name || 'General';
    document.getElementById('prodDesc').innerText = p.description || 'No description available';

    const mainImage = document.getElementById('mainImage');
    const thumbs = document.getElementById('thumbs');
    const imgs = (p.images?.length > 0) ? p.images.map(toUrl) : ['https://via.placeholder.com/400'];

    // 🔥 MAIN IMAGE
    mainImage.src = imgs[0];
    mainImage.onerror = () => (mainImage.src = toUrl(null));

    mainImage.onclick = () => openLightbox(imgs[0]);

    // 🔥 THUMBNAILS
    thumbs.innerHTML = '';
    imgs.forEach((src, idx) => {
      const t = document.createElement('div');
      t.className = 'thumb-item' + (idx === 0 ? ' active' : '');
      t.innerHTML = `<img src="${src}" alt="Thumb ${idx + 1}" style="object-fit:contain;">`;
      t.style.cursor = 'pointer';

      t.onclick = () => {
        document.querySelectorAll('.thumb-item').forEach(th => th.classList.remove('active'));
        t.classList.add('active');
        mainImage.src = src;
      };

      // Double click → fullscreen lightbox
      t.ondblclick = () => openLightbox(src);

      thumbs.appendChild(t);
    });

    // ADD TO CART
    document.getElementById('btnAddToCart').onclick = () => {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const item = cart.find(i => i._id === id);

      if (!item) {
        cart.push({
          _id: id,
          name: p.name,
          price: p.price,
          category: p.category?.name,
          img: imgs[0],
          qty: 1
        });
        localStorage.setItem("cart", JSON.stringify(cart));
        showToast("✅ Added to cart!");
      } else {
        window.location.href = 'cart.html';
      }
    };

    // BUY NOW
    document.getElementById('btnBuyNow').onclick = () => {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!cart.find(i => i._id === id)) {
        cart.push({
          _id: id,
          name: p.name,
          price: p.price,
          category: p.category?.name,
          img: imgs[0],
          qty: 1
        });
        localStorage.setItem("cart", JSON.stringify(cart));
      }
      window.location.href = 'cart.html';
    };

    loadRelatedProducts(p.category?._id, id);

  } catch(err) {
    console.error("Error loading product:", err);
    document.querySelector('.product-detail').innerHTML =
      `<p style="text-align:center;padding:3rem;color:#888">
         <span style="font-size:3rem;display:block;margin-bottom:1rem">❌</span>
         Product not found. 
         <a href="home.html" style="color:#ff3b6d;font-weight:600">Back Home</a>
       </p>`;
  }
}

/* 🔥 RELATED PRODUCTS — Cloudinary FIXED */
async function loadRelatedProducts(categoryId, currentId) {
  if (!categoryId) return;
  try {
    const r = await fetch(`/api/products?categoryId=${categoryId}`);
    const products = await r.json();
    const related = products.filter(p => p._id !== currentId).slice(0, 4);
    const grid = document.getElementById('relatedProducts');

    if (related.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:2rem;color:#888">
        No similar products.
      </p>`;
      return;
    }

    grid.innerHTML = '';
    related.forEach(p => {
      const img = toUrl(p.images?.[0]);
      const cart = JSON.parse(localStorage.getItem("cart")||"[]");
      const exists = cart.some(i=>i._id===p._id);

      grid.innerHTML += `
        <div class="product-item">
          <div class="product-image-wrapper">
            <img src="${img}" alt="${p.name}" onclick="goToProduct('${p._id}')">
            <div class="product-overlay">
              <button class="quick-view-btn" onclick="goToProduct('${p._id}')">Quick View</button>
            </div>
          </div>
          <div class="product-info">
            <h3>${p.name}</h3>
            <p class="product-price">₹${p.price}</p>
            <button onclick="toggleRelatedCart('${p._id}','${p.name}','${p.price}','${p.category?.name}','${img}')"
                    class="product-btn ${exists?'added':''}">
              ${exists?'🛒 In Cart':'➕ Add to Cart'}
            </button>
          </div>
        </div>`;
    });

  } catch(err) { console.error(err); }
}

function goToProduct(id) { window.location.href=`product.html?id=${id}`; }

function toggleRelatedCart(id,name,price,category,img){
  let cart = JSON.parse(localStorage.getItem("cart")||"[]");
  if(cart.find(i=>i._id===id)) return window.location.href="cart.html";

  cart.push({ _id:id, name, price, category, img, qty:1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  showToast('✅ Added to cart!');
}

function showToast(msg){
  const t=document.createElement('div');
  t.className='toast-notification';
  t.innerText=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2000);
}

loadProduct();
