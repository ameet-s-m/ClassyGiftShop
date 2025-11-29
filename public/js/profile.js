// Load profile on page load
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  setupLogout();
  setupUserGreeting();
});

// Load user profile from localStorage and populate form
function loadProfile() {
  const profileLoading = document.getElementById('profileLoading');
  const profileForm = document.getElementById('profileForm');
  
  profileLoading.style.display = 'block';
  profileForm.style.display = 'none';

  // Get currentUser from localStorage
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch (e) {
    user = null;
  }

  if (!user || !user.name) {
    // Not logged in or profile incomplete
    profileLoading.style.display = 'none';
    alert('Please login to access your profile.');
    window.location.href = 'index.html';
    return;
  }

  // Populate form fields
  document.getElementById('profileName').value = user.name || '';
  document.getElementById('profileEmail').value = user.email || '';
  document.getElementById('profilePhone').value = user.phone || '';
  document.getElementById('profileAltPhone').value = user.altPhone || '';
  document.getElementById('profileAddress').value = user.address || '';

  profileLoading.style.display = 'none';
  profileForm.style.display = 'block';
}

// Handle form submission
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const errorEl = document.getElementById('profileError');
  const successEl = document.getElementById('profileSuccess');
  
  // Clear previous messages
  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const altPhone = document.getElementById('profileAltPhone').value.trim();
  const address = document.getElementById('profileAddress').value.trim();

  if (!name || !phone || !address) {
    errorEl.innerText = 'Please fill in all required fields.';
    errorEl.style.display = 'block';
    return;
  }

  try {
    // Send update request to backend
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, phone, altPhone, address })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.innerText = data.message || 'Failed to update profile.';
      errorEl.style.display = 'block';
      return;
    }

    // Update localStorage with new profile
    localStorage.setItem('currentUser', JSON.stringify(data.user || data));
    
    // Show success message
    successEl.innerText = '✅ Profile updated successfully!';
    successEl.style.display = 'block';

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 2000);

  } catch (err) {
    errorEl.innerText = 'Network error. Please try again.';
    errorEl.style.display = 'block';
  }
});

// Setup logout button
function setupLogout() {
  const logoutBtn = document.getElementById('userLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
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
}

// Setup user greeting
function setupUserGreeting() {
  const greeting = document.getElementById('userGreeting');
  if (greeting) {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch (e) {
      user = null;
    }
    if (user && user.name) {
      greeting.innerText = `👤 ${user.name}`;
    }
  }
}
