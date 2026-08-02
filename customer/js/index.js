gsap.registerPlugin(ScrollTrigger);

// ==========================================
// BACKGROUND & SCROLL ANIMATIONS
// ==========================================
// particles
const pWrap = document.getElementById('particles');
if (pWrap) {
  for(let i=0;i<26;i++){
    const p = document.createElement('div');
    p.className='p';
    p.style.left = Math.random()*100+'%';
    p.style.top = 40+Math.random()*55+'%';
    p.style.opacity = 0.2+Math.random()*0.5;
    pWrap.appendChild(p);
    gsap.to(p,{
      y: -30-Math.random()*60,
      x: (Math.random()-0.5)*40,
      opacity:0,
      duration: 4+Math.random()*4,
      repeat:-1,
      delay: Math.random()*4,
      ease:'sine.inOut'
    });
  }
}

// clouds and birds drifting
if (document.getElementById('cloud1')) {
  gsap.to('#cloud1',{x:60,duration:26,repeat:-1,yoyo:true,ease:'sine.inOut'});
  gsap.to('#cloud2',{x:-50,duration:22,repeat:-1,yoyo:true,ease:'sine.inOut'});
  gsap.to('#bird1',{x:40,y:-14,duration:6,repeat:-1,yoyo:true,ease:'sine.inOut'});
  gsap.to('#bird2',{x:-30,y:-10,duration:5,repeat:-1,yoyo:true,ease:'sine.inOut'});
}

// Slow, continuous 360-degree rotation for the rays
if (document.getElementById('rays')) {
  gsap.to('#rays', {
    rotate: 360, 
    duration: 80, 
    repeat: -1, 
    ease: 'none', 
    transformOrigin: '50% 50%'
  });
}

// Hero Parallax Scroll
if (document.getElementById('hero')) {
  gsap.timeline({
    scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:0.6}
  })
  .to('#sun-container',{bottom:'120%', left:'70%', scale:1.1, ease:'none'},0) 
  .to('#mtn-far',{y:-40,ease:'none'},0)
  .to('#mtn-mid',{y:-70,ease:'none'},0)
  .to('#mtn-near',{y:-20,ease:'none'},0)
  .to('#pines',{y:-10,ease:'none'},0)
  .to('.hero-copy',{y:-60,opacity:0.4,ease:'none'},0)
  .to('.hero-sky-glow',{opacity:0.9,ease:'none'},0);
}

// reveal on scroll
document.querySelectorAll('[data-reveal]').forEach((el)=>{
  ScrollTrigger.create({
    trigger: el, start:'top 85%',
    onEnter: () => el.classList.add('in')
  });
});

// ==========================================
// AUTHENTICATION & MODAL LOGIC
// ==========================================
const API_BASE_URL = "https://sunrise-haven.onrender.com";

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // DYNAMIC FEATURED ROOMS
  // ==========================================
  async function loadFeaturedRooms() {
      const track = document.querySelector('.room-track');
      if (!track) return; // Failsafe in case we aren't on the home page
      
      try {
          const res = await fetch(`${API_BASE_URL}/rooms/public`);
          if (!res.ok) throw new Error("Failed to fetch public rooms");
          const rooms = await res.json();
          
          if (rooms.length > 0) {
              // Replace the hardcoded HTML with our live database data
              track.innerHTML = rooms.map(r => {
                  // Fallback to your gradient if the room has no images yet
                  const firstImage = (r.images && r.images.length > 0) ? `url('${r.images[0].image_url}')` : 'linear-gradient(160deg,#3E6B8F,#0F2A3F)';
                  
                  return `
                  <div class="room-card">
                    <div class="room-media">
                      <div class="fill" style="background:${firstImage}; background-size: cover; background-position: center;"></div>
                      <span class="tag">${r.view_tag || 'Standard'}</span>
                    </div>
                    <div class="room-info">
                      <h3>${r.name}</h3>
                      <div class="room-meta">
                        <span>${r.capacity} guests</span>
                        <span>${r.beds} bed${r.beds > 1 ? 's' : ''}</span>
                      </div>
                      <div class="room-foot">
                        <div class="room-price">₱${Number(r.base_price).toLocaleString()} <span>/ night</span></div>
                        <a class="room-link" href="availability.html">Book room →</a>
                      </div>
                    </div>
                  </div>`;
              }).join('');
          }
      } catch (e) {
          console.error("Could not load featured rooms:", e);
          // If the fetch fails, it just leaves your hardcoded HTML in place as a safe fallback!
      }
  }

  // Execute the function
  loadFeaturedRooms();

  // ==========================================
  // FRONTEND BOUNCE: ADMIN DASHBOARD PROTECTION
  // ==========================================
  // We only run this security check if the user is actually on the owner dashboard page.
  if (window.location.pathname.includes('ownerindex.html')) {
      const token = localStorage.getItem('access_token');
      if (!token) {
          alert("You must be logged in to view this page.");
          window.location.href = "../index.html"; // Kick them out to the homepage
          return; 
      }

      // Verify with the backend that this token belongs to an APPROVED ADMIN
      fetch(`${API_BASE_URL}/auth/requests`, { 
          headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => {
          if (res.status === 403 || res.status === 401) {
              alert("Unauthorized: Only approved owners can access this dashboard.");
              localStorage.removeItem('access_token'); // Clear the fake/unauthorized token
              window.location.href = "../index.html"; // Kick them out
          }
      })
      .catch(err => console.error("Validation error", err));
  }


  // ==========================================
  // LOGIN MODAL LOGIC
  // ==========================================
  // Select DOM Elements
  const loginBtn = document.getElementById('login-btn');
  const loginModal = document.getElementById('login-modal');
  const closeModal = document.getElementById('close-modal');
  const tabs = document.querySelectorAll('.tab-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalSub = document.getElementById('modal-sub');
  const submitBtn = document.getElementById('submit-btn');
  const nameGroup = document.getElementById('name-group'); // Full Name field
  
  // Track current action (login or signup)
  let currentAction = 'login'; 

  // 1. Open Modal
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginModal.classList.add('active');
    });
  }
  
  // 2. Close Modal (via X button)
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      loginModal.classList.remove('active');
    });
  }
  
  // 3. Close Modal (via clicking outside the box)
  window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.classList.remove('active');
    }
  });
  
  // 4. Handle Tab Switching (Log In vs Sign Up)
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      currentAction = tab.getAttribute('data-action');
      
      if (currentAction === 'signup') {
        modalTitle.innerHTML = 'Create an account';
        modalSub.innerHTML = 'Join us to book your mountain escape.';
        submitBtn.innerHTML = 'Sign Up';
        nameGroup.style.display = 'block'; 
      } else {
        modalTitle.innerHTML = 'Welcome back';
        modalSub.innerHTML = 'Sign in to manage your bookings.';
        submitBtn.innerHTML = 'Sign In';
        nameGroup.style.display = 'none'; 
      }
    });
  });

  // 5. Handle Form Submission to FastAPI
  const loginForm = document.querySelector('.login-form'); 
  
  if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
          e.preventDefault(); 
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const nameInput = document.getElementById('name');
          
          // Build the JSON payload
          const payload = { email, password };
          if (currentAction === 'signup' && nameInput) {
              payload.full_name = nameInput.value;
          }

          try {
              // UI Loading State
              submitBtn.textContent = 'Processing...';
              submitBtn.disabled = true;

              const response = await fetch(`${API_BASE_URL}/auth/${currentAction}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });

              // Check if backend blocked us (Rate Limit 429) OR authentication failed (401)
              if (!response.ok) {
                  const errorData = await response.json();
                  // standard errors use 'detail', our rate limit uses 'message'
                  throw new Error(errorData.message || errorData.detail || 'Authentication failed'); 
              }

              const data = await response.json();

              // Cleaned up success logic
              if (currentAction === 'login') {
                  // Save JWT Token securely for future requests
                  localStorage.setItem('access_token', data.access_token);
                  alert('Login successful!');
                  
                  // Redirect directly to the admin dashboard
                  window.location.href = `https://sunrise-haven-admin.vercel.app/index.html?token=${data.access_token}`;
              } else {
                  alert('Your request to create an admin account has been sent for approval.');
                  // Automatically switch back to the login tab
                  document.querySelector('.tab-btn[data-action="login"]').click();
              }
              
              // Close modal and reset form
              loginModal.classList.remove('active');
              loginForm.reset();

          } catch (error) {
              alert(`Error: ${error.message}`); 
          } finally {
              // Restore button text and state
              submitBtn.textContent = currentAction === 'signup' ? 'Sign Up' : 'Sign In';
              submitBtn.disabled = false;
          }
      });
  }
});