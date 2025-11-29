function getQueryId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadProduct() {
  const id = getQueryId();
  if (!id) return (window.location.href = 'home.html');

  try {
    const res = await fetch('/api/products/' + id);
    if(!res.ok) throw new Error("Product not found");
    const p = await res.json();

    // Set breadcrumbs
    document.getElementById('breadcrumbCategory').innerText = p.category?.name || 'Category';
    document.getElementById('breadcrumbProduct').innerText = p.name;

    document.getElementById('prodName').innerText = p.name;
    document.getElementById('prodPrice').innerText = '₹' + p.price;
    document.getElementById('prodCategory').innerText = p.category?.name || 'General';
    document.getElementById('prodDesc').innerText = p.description || 'No description available';

    const mainImage = document.getElementById('mainImage');
    const thumbs = document.getElementById('thumbs');
    const imgs = p.images && p.images.length ? p.images : ['https://via.placeholder.com/400'];

    function toUrl(path) {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('//')) return path;
      return path.startsWith('/') ? path : '/' + path;
    }

    // Lightbox helper
    function openLightbox(src) {
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

      const img = document.createElement('img');
      img.src = toUrl(src);
      img.style.maxWidth = '95%';
      img.style.maxHeight = '95%';
      img.style.objectFit = 'contain';
      img.alt = 'Product Image (fullscreen)';

      overlay.appendChild(img);
      overlay.onclick = () => document.body.removeChild(overlay);
      document.body.appendChild(overlay);

      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          if (document.body.contains(overlay)) document.body.removeChild(overlay);
          document.removeEventListener('keydown', escHandler);
        }
      });
    }

    mainImage.src = toUrl(imgs[0]);
    mainImage.onerror = () => { mainImage.src = 'https://via.placeholder.com/400'; };
    mainImage.onclick = () => openLightbox(imgs[0]);
    
    thumbs.innerHTML = '';
    imgs.forEach((src, idx) => {
      const t = document.createElement('div');
      t.className = 'thumb-item' + (idx === 0 ? ' active' : '');
      t.innerHTML = `<img src="${toUrl(src)}" alt="Product thumbnail ${idx + 1}" style="object-fit: contain;">`;
      t.style.cursor = 'pointer';
      
      const img = t.querySelector('img');
      img.onerror = () => { img.src = 'https://via.placeholder.com/80'; };
      
      t.onclick = () => {
        // Remove active class from all thumbs
        document.querySelectorAll('.thumb-item').forEach(th => th.classList.remove('active'));
        // Add active class to clicked thumb
        t.classList.add('active');
        // Update main image
        mainImage.src = toUrl(src);
        mainImage.onerror = () => { mainImage.src = 'https://via.placeholder.com/400'; };
      };
      
      t.addEventListener('dblclick', () => openLightbox(src));
      thumbs.appendChild(t);
    });

    document.getElementById('btnAddToCart').onclick = async () => {
      let cart = JSON.parse(localStorage.getItem("cart")||"[]");
      const item = cart.find(i=>i._id===id);
      
      if(!item) {
        const img = (p.images?.[0]) ? toUrl(p.images[0]) : 'https://via.placeholder.com/250?text=No+Image';
        cart.push({ 
          _id: id, 
          name: p.name,
          price: p.price, 
          category: p.category?.name || 'General', 
          img: img, 
          qty: 1 
        });
        localStorage.setItem("cart", JSON.stringify(cart));
        showToast('✅ Added to cart!');
      } else {
        window.location.href = 'cart.html';
      }
    };

    document.getElementById('btnBuyNow').onclick = async () => {
      let cart = JSON.parse(localStorage.getItem("cart")||"[]");
      const item = cart.find(i=>i._id===id);
      
      if(!item) {
        const img = (p.images?.[0]) ? toUrl(p.images[0]) : 'https://via.placeholder.com/250?text=No+Image';
        cart.push({ 
          _id: id, 
          name: p.name,
          price: p.price, 
          category: p.category?.name || 'General', 
          img: img, 
          qty: 1 
        });
        localStorage.setItem("cart", JSON.stringify(cart));
      }
      window.location.href = 'cart.html';
    };

    // Load related products (same category)
    loadRelatedProducts(p.category?._id, id);

  } catch(err) {
    console.error("Error loading product:", err);
    document.querySelector('.product-detail').innerHTML = '<p style="text-align: center; padding: 3rem; color: #888;"><span style="font-size: 3rem; display: block; margin-bottom: 1rem;">❌</span> Product not found. <a href="home.html" style="color: var(--rose-primary); font-weight: 600;">Back to Home</a></p>';
  }
}

async function loadRelatedProducts(categoryId, currentProductId) {
  if (!categoryId) return;

  try {
    const res = await fetch(`/api/products?categoryId=${categoryId}`);
    const products = await res.json();
    
    // Filter out current product and get max 4 related products
    const related = products.filter(p => p._id !== currentProductId).slice(0, 4);
    
    if (related.length === 0) {
      document.getElementById('relatedProducts').innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #888;">No similar products found.</p>';
      return;
    }

    function toUrl(path) {
      if (!path) return path;
      if (path.startsWith('http') || path.startsWith('//')) return path;
      return path.startsWith('/') ? path : '/' + path;
    }

    const grid = document.getElementById('relatedProducts');
    grid.innerHTML = '';

    related.forEach(p => {
      const img = (p.images?.[0]) ? toUrl(p.images[0]) : 'https://via.placeholder.com/250?text=No+Image';
      const cart = JSON.parse(localStorage.getItem("cart")||"[]");
      const exists = cart.some(i => i._id === p._id);

      const prodItem = document.createElement('div');
      prodItem.className = 'product-item';
      prodItem.innerHTML = `
        <div class="product-image-wrapper">
          <img src="${img}" alt="${p.name}" style="cursor: pointer;" onclick="goToProduct('${p._id}')">
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
      `;
      grid.appendChild(prodItem);
    });

  } catch(err) {
    console.error("Error loading related products:", err);
  }
}

function goToProduct(id) {
  window.location.href = `product.html?id=${id}`;
}

function toggleRelatedCart(id,name,price,category,img){
  let cart = JSON.parse(localStorage.getItem("cart")||"[]");
  const item = cart.find(i => i._id === id);

  if(item) {
    window.location.href = "cart.html";
    return;
  }

  cart.push({ _id:id, name, price, category, img, qty:1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  showToast('✅ Added to cart!');
  loadRelatedProducts(new URLSearchParams(window.location.search).get('categoryId'), id);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

loadProduct();
