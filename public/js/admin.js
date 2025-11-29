/***********************
 * ADMIN LOGIN PAGE
 ***********************/
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginError = document.getElementById('admin-login-error');

if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    adminLoginError.innerText = 'Connecting...';
    adminLoginError.style.display = 'block';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        adminLoginError.innerText = data.message || 'Login failed';
        adminLoginError.style.display = 'block';
        return;
      }
      adminLoginError.innerText = '✅ Login success, redirecting...';
      adminLoginError.classList.remove('error-msg');
      adminLoginError.classList.add('form-success');
      setTimeout(() => (window.location.href = 'admin-dashboard.html'), 600);
    } catch (err) {
      adminLoginError.innerText = 'Network error. Please try again.';
      adminLoginError.style.display = 'block';
    }
  });
}

/***********************
 * ADMIN DASHBOARD
 ***********************/
if (window.location.pathname.includes('admin-dashboard.html')) {
  const adminEmailEl = document.getElementById('adminEmail');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const navItems = document.querySelectorAll('.admin-nav-item');
  const usersSection = document.getElementById('usersSection');
  const categoriesSection = document.getElementById('categoriesSection');
  const productsSection = document.getElementById('productsSection');

  // Section switching
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      navItems.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.dataset.section;
      usersSection.classList.toggle('hidden', sec !== 'usersSection');
      categoriesSection.classList.toggle('hidden', sec !== 'categoriesSection');
      productsSection.classList.toggle('hidden', sec !== 'productsSection');
    });
  });

  async function loadAdminMe() {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (!res.ok) {
        window.location.href = 'admin-login.html';
        return;
      }
      const data = await res.json();
      adminEmailEl.textContent = '👤 ' + data.email;
    } catch(err) {
      console.error("Error loading admin:", err);
    }
  }

  if (adminLogoutBtn) {
    adminLogoutBtn.onclick = async () => {
      if(confirm("Are you sure you want to logout?")) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          credentials: 'include'
        });
        window.location.href = 'admin-login.html';
      }
    };
  }

  // Users
  const userForm = document.getElementById('userForm');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  let usersCache = [];

  async function loadUsers() {
    try {
      const body = document.querySelector('#usersTable tbody');
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const users = await res.json();
      usersCache = users;
      body.innerHTML = '';
      
      if(users.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">No users registered yet.</td></tr>';
        return;
      }

      users.forEach((u) => {
        body.innerHTML += `
          <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.phone}</td>
            <td>${u.altPhone}</td>
            <td>${u.address}</td>
            <td>
              <button data-edit="${u._id}" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Edit</button>
              <button data-del="${u._id}" class="btn-remove" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
            </td>
          </tr>`;
      });

      // Edit user buttons
      body.querySelectorAll('button[data-edit]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-edit');
          const user = usersCache.find((u) => u._id === id);
          if (!user) return;
          userForm.elements.id.value = user._id;
          userForm.elements.name.value = user.name;
          userForm.elements.email.value = user.email;
          userForm.elements.phone.value = user.phone;
          userForm.elements.altPhone.value = user.altPhone;
          userForm.elements.address.value = user.address;
          userForm.style.display = 'block';
          userForm.scrollIntoView({ behavior: 'smooth' });
        };
      });

      // Delete user buttons
      body.querySelectorAll('button[data-del]').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-del');
          const user = usersCache.find((u) => u._id === id);
          if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) return;
          try {
            const res = await fetch('/api/admin/users/' + id, {
              method: 'DELETE',
              credentials: 'include'
            });
            if (!res.ok) throw new Error('Delete failed');
            alert('✅ User deleted successfully');
            loadUsers();
          } catch(err) {
            alert('❌ Error deleting user: ' + err.message);
          }
        };
      });
    } catch(err) {
      console.error("Error loading users:", err);
    }
  }

  // User form submission
  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = userForm.elements.id.value;
      const data = {
        name: userForm.elements.name.value,
        email: userForm.elements.email.value,
        phone: userForm.elements.phone.value,
        altPhone: userForm.elements.altPhone.value,
        address: userForm.elements.address.value
      };

      try {
        const res = await fetch('/api/admin/users/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (!res.ok) {
          alert('❌ Error: ' + (result.message || 'Update failed'));
          return;
        }
        alert('✅ User updated successfully');
        userForm.style.display = 'none';
        userForm.reset();
        loadUsers();
      } catch(err) {
        alert('❌ Error updating user: ' + err.message);
      }
    });

    if (cancelEditBtn) {
      cancelEditBtn.onclick = () => {
        userForm.style.display = 'none';
        userForm.reset();
      };
    }
  }

  // Categories
  const categoryForm = document.getElementById('categoryForm');
  const categoriesTableBody = document.querySelector(
    '#categoriesTable tbody'
  );
  const productCategorySelect = document.getElementById(
    'productCategorySelect'
  );
  let categoriesCache = [];

  async function loadCategories() {
    try {
      const res = await fetch('/api/categories');
      const categories = await res.json();
      categoriesCache = categories;

      // table
      categoriesTableBody.innerHTML = '';
      
      if(categories.length === 0) {
        categoriesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem;">No categories yet.</td></tr>';
      } else {
        categories.forEach((c) => {
          categoriesTableBody.innerHTML += `
            <tr>
              <td>${c.name}</td>
              <td>${c.description || '-'}</td>
              <td>
                <button data-edit="${c._id}" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Edit</button>
                <button data-del="${c._id}" class="btn-remove" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
              </td>
            </tr>`;
        });
      }

      // select for product form
      productCategorySelect.innerHTML = '';
      categories.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c._id;
        opt.textContent = c.name;
        productCategorySelect.appendChild(opt);
      });

      categoriesTableBody
        .querySelectorAll('button[data-edit]')
        .forEach((btn) => {
          btn.onclick = () => {
            const id = btn.getAttribute('data-edit');
            const cat = categoriesCache.find((c) => c._id === id);
            if (!cat) return;
            categoryForm.elements.id.value = cat._id;
            categoryForm.elements.name.value = cat.name;
            categoryForm.elements.description.value = cat.description || '';
            categoryForm.scrollIntoView({ behavior: 'smooth' });
          };
        });

      categoriesTableBody.querySelectorAll('button[data-del]').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-del');
          if (!confirm('Are you sure? This category will be deleted.')) return;
          try {
            await fetch('/api/categories/' + id, {
              method: 'DELETE',
              credentials: 'include'
            });
            categoryForm.reset();
            loadCategories();
            alert('✅ Category deleted');
          } catch(err) {
            alert('❌ Error deleting category');
          }
        };
      });
    } catch(err) {
      console.error("Error loading categories:", err);
    }
  }

  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = categoryForm.elements.id.value;
        const payload = {
          name: categoryForm.elements.name.value,
          description: categoryForm.elements.description.value
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? '/api/categories/' + id : '/api/categories';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if(res.ok) {
          alert(id ? '✅ Category updated' : '✅ Category created');
          categoryForm.reset();
          loadCategories();
        } else {
          alert('❌ Error saving category');
        }
      } catch(err) {
        alert('❌ Error: ' + err.message);
      }
    });
  }

  // Products
  const productForm = document.getElementById('productForm');
  const productsTableBody = document.querySelector('#productsTable tbody');
  let productsCache = [];

  async function loadProducts() {
    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      productsCache = products;
      productsTableBody.innerHTML = '';

      if(products.length === 0) {
        productsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No products yet.</td></tr>';
      } else {
        products.forEach((p) => {
          productsTableBody.innerHTML += `
            <tr>
              <td>${p.name}</td>
              <td>${p.category?.name || '-'}</td>
              <td>₹${p.price}</td>
              <td>${(p.images || []).length} 🖼️</td>
              <td>
                <button data-edit="${p._id}" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Edit</button>
                <button data-del="${p._id}" class="btn-remove" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Delete</button>
              </td>
            </tr>`;
        });
      }

      productsTableBody.querySelectorAll('button[data-edit]').forEach((btn) => {
        btn.onclick = () => {
          const id = btn.getAttribute('data-edit');
          const p = productsCache.find((x) => x._id === id);
          if (!p) return;
          productForm.elements.id.value = p._id;
          productForm.elements.name.value = p.name;
          productForm.elements.price.value = p.price;
          productForm.elements.category.value = p.category?._id || '';
          productForm.elements.description.value = p.description || '';
          productForm.scrollIntoView({ behavior: 'smooth' });
        };
      });

      productsTableBody.querySelectorAll('button[data-del]').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-del');
          if (!confirm('Are you sure? This product will be deleted.')) return;
          try {
            await fetch('/api/products/' + id, {
              method: 'DELETE',
              credentials: 'include'
            });
            productForm.reset();
            loadProducts();
            alert('✅ Product deleted');
          } catch(err) {
            alert('❌ Error deleting product');
          }
        };
      });
    } catch(err) {
      console.error("Error loading products:", err);
    }
  }

  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const id = productForm.elements.id.value;
        const formData = new FormData(productForm);
        const method = id ? 'PUT' : 'POST';
        const url = id ? '/api/products/' + id : '/api/products';

        const res = await fetch(url, {
          method,
          credentials: 'include',
          body: formData
        });

        if(res.ok) {
          alert(id ? '✅ Product updated' : '✅ Product added');
          productForm.reset();
          loadProducts();
        } else {
          alert('❌ Error saving product');
        }
      } catch(err) {
        alert('❌ Error: ' + err.message);
      }
    });
  }

  // Init dashboard
  loadAdminMe();
  loadUsers();
  loadCategories();
  loadProducts();
}
