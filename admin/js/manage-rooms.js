// ==========================================
// FRONTEND BOUNCE: ADMIN DASHBOARD PROTECTION
// ==========================================

// 1. Check if we just arrived from the Customer login page with a token in the URL
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');

if (tokenFromUrl) {
    // Save it to the admin site's local storage
    localStorage.setItem('access_token', tokenFromUrl);
    // Erase the token from the browser's address bar for security
    window.history.replaceState({}, document.title, window.location.pathname);
}

// 2. Now proceed with the normal check
const token = localStorage.getItem('access_token');
const AUTH_API_URL = "https://sunrise-haven.onrender.com";
const LIVE_CUSTOMER_URL = "https://sunrise-haven.vercel.app";

if (!token) {
    alert("You must be logged in to view this page.");
    window.location.href = LIVE_CUSTOMER_URL; // Kick them out to the live homepage
} else {
    // Verify with the backend that this token belongs to an APPROVED ADMIN
    fetch(`${AUTH_API_URL}/auth/requests`, { 
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (res.status === 403 || res.status === 401) {
            alert("Unauthorized: Only approved owners can access this dashboard.");
            localStorage.removeItem('access_token'); // Clear the fake/unauthorized token
            window.location.href = LIVE_CUSTOMER_URL; // Kick them out
        }
    })
    .catch(err => console.error("Validation error", err));
}
// ==========================================