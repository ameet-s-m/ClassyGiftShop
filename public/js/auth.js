/**************** SWITCH TABS ****************/
const loginTab   = document.getElementById("loginTab");
const signupTab  = document.getElementById("signupTab");
const loginForm  = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

loginTab.onclick = () => {
  loginForm.style.display="block";
  signupForm.style.display="none";
  loginTab.classList.add("active");
  signupTab.classList.remove("active");
  document.getElementById("loginError").style.display="none";
};

signupTab.onclick = () => {
  signupForm.style.display="block";
  loginForm.style.display="none";
  signupTab.classList.add("active");
  loginTab.classList.remove("active");
  document.getElementById("signupError").style.display="none";
};


/**************** CUSTOMER LOGIN ****************/
loginForm.addEventListener("submit", async (e)=>{
  e.preventDefault();

  let email = document.getElementById("loginEmail").value.trim();
  let password = document.getElementById("loginPassword").value.trim();
  const errorEl = document.getElementById("loginError");

  try {
    const res = await fetch("/api/auth/login",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      credentials:"include",
      body:JSON.stringify({email,password})
    });

    const data = await res.json();
    if(!res.ok) {
      errorEl.innerText = data.message || "Login failed";
      errorEl.style.display = "block";
      return;
    }

    // Fetch full user profile (phone, address etc.) from /api/auth/me and store as `currentUser`
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const me = await meRes.json();
        localStorage.setItem('currentUser', JSON.stringify(me));
        // Remove legacy individual keys to consolidate storage
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userAltPhone');
        localStorage.removeItem('userAddress');
      }
    } catch (err) {
      // Non-fatal: proceed to home even if profile fetch fails
      console.warn('Could not fetch user profile after login', err);
    }

    location.href = "home.html";
  } catch(err) {
    errorEl.innerText = "Network error. Please try again.";
    errorEl.style.display = "block";
  }
});


/**************** CUSTOMER SIGNUP ****************/
signupForm.addEventListener("submit", async (e)=>{
  e.preventDefault();

  let payload = {
    name     : document.getElementById("s_name").value.trim(),
    email    : document.getElementById("s_email").value.trim(),
    password : document.getElementById("s_password").value.trim(),
    phone    : document.getElementById("s_phone").value.trim(),
    altPhone : document.getElementById("s_altPhone").value.trim(),
    address  : document.getElementById("s_address").value.trim()
  };

  const errorEl = document.getElementById("signupError");

  try {
    const res = await fetch("/api/auth/signup",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      credentials:"include",
      body:JSON.stringify(payload)
    });

    const data = await res.json();
    if(!res.ok) {
      errorEl.innerText = data.message || "Signup failed";
      errorEl.style.display = "block";
      return;
    }

    // After successful signup the server sets the auth cookie.
    // Fetch the user profile and store it as `currentUser` so frontend can use it immediately.
    try {
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      if (meRes.ok) {
        const me = await meRes.json();
        localStorage.setItem('currentUser', JSON.stringify(me));
        // Remove legacy individual keys to consolidate storage
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userAltPhone');
        localStorage.removeItem('userAddress');
      }
    } catch (err) {
      console.warn('Could not fetch profile after signup', err);
    }

    // Redirect to home (auto-logged in)
    location.href = 'home.html';
  } catch(err) {
    errorEl.innerText = "Network error. Please try again.";
    errorEl.style.display = "block";
  }
});

/* **************** ADMIN LOGIN REDIRECT **************** */
// Admin login button is now visible at top-right of index.html
// Direct link in HTML navigates to admin-login.html

