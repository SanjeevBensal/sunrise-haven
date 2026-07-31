let globalRooms = [];

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // BACKGROUND ANIMATIONS (Sun & Mountains)
  // ==========================================
  const sun = document.getElementById('sun');
  const rays = document.getElementById('rays');
  const mtnNear = document.getElementById('mtn-near');
  const mtnMid = document.getElementById('mtn-mid');

  if (sun && rays) {
    // 1. Continuous spinning rays
    gsap.to(rays, {
      rotation: 360,
      duration: 50,
      repeat: -1,
      ease: "none"
    });

    // 2. Sunset effect on scroll
    gsap.to(sun, {
      y: 250, 
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    if (mtnNear) {
      gsap.to(mtnNear, {
        y: -50,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }

    if (mtnMid) {
      gsap.to(mtnMid, {
        y: -25,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  // Initial Fetch from Database
  loadRooms();
});

// ==========================================
// DYNAMIC DATABASE RENDERING
// ==========================================
const grid = document.getElementById('room-grid');
const countEl = document.getElementById('result-count');
const overlay = document.getElementById('overlay');
const detail = document.getElementById('detail');

// Fetch rooms from the live FastAPI Backend
async function loadRooms() {
  try {
    // Dynamically generate dates for "Today" and "Tomorrow" to satisfy the backend requirements
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkIn = today.toISOString().split('T')[0];
    const checkOut = tomorrow.toISOString().split('T')[0];

    // Fetch from the public available endpoint instead of the locked /all endpoint
    const response = await fetch(`http://127.0.0.1:8000/rooms/available?check_in=${checkIn}&check_out=${checkOut}`);
    
    if (!response.ok) throw new Error("Failed to fetch rooms");
    
    globalRooms = await response.json();
    
    // Filter to only show active rooms to customers
    globalRooms = globalRooms.filter(r => r.is_active === true);
    render();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--ink-soft);">Failed to load rooms. Please ensure the backend server is running.</p>';
  }
}

function cardHTML(r) {
  // Grabs the first image from Cloudinary, or defaults to the gradient if no images exist yet
  const firstImage = (r.images && r.images.length > 0) ? `url('${r.images[0].image_url}')` : 'linear-gradient(160deg,#3E6B8F,#0F2A3F)';
  
  const price = parseFloat(r.base_price).toLocaleString();
  const viewTag = r.view_tag || 'Standard';

  return `<div class="room-card" data-id="${r.id}">
    <div class="room-media">
      <div class="fill" style="background:${firstImage}; background-size: cover; background-position: center;"></div>
      <span class="tag">${viewTag}</span>
      <span class="avail green"></span>
    </div>
    <div class="room-info">
      <h3>${r.name}</h3>
      <div class="room-meta">
        <span>${r.capacity} guests</span>
        <span>${r.beds} bed${r.beds > 1 ? 's' : ''}</span>
      </div>
      <div class="room-foot">
        <div class="room-price">₱${price} <span>/ night</span></div>
        <span class="room-link">View room →</span>
      </div>
    </div>
  </div>`;
}

function render() {
  const cap = document.getElementById('f-capacity').value;
  const view = document.getElementById('f-view').value;
  const sort = document.getElementById('f-sort').value;
  const q = document.getElementById('f-search').value.toLowerCase();

  let list = globalRooms.filter(r => {
    if (cap && r.capacity < parseInt(cap)) return false;
    if (view && r.view_tag !== view) return false;
    if (q && !r.name.toLowerCase().includes(q)) return false;
    return true;
  });

  if (sort === 'price-asc') list.sort((a, b) => a.base_price - b.base_price);
  if (sort === 'price-desc') list.sort((a, b) => b.base_price - a.base_price);
  if (sort === 'capacity') list.sort((a, b) => b.capacity - a.capacity);

  grid.innerHTML = list.map(cardHTML).join('');
  countEl.textContent = list.length + (list.length === 1 ? ' room' : ' rooms');

  grid.querySelectorAll('.room-card').forEach(card => {
    card.addEventListener('click', () => openDetail(parseInt(card.dataset.id)));
  });
}

// Bind Filters
['f-capacity', 'f-view', 'f-sort'].forEach(id => document.getElementById(id).addEventListener('change', render));
document.getElementById('f-search').addEventListener('input', render);

function openDetail(id) {
  const r = globalRooms.find(x => x.id === id);
  if (!r) return;
  
  // 1. Generate the image elements for the popup gallery
  let galleryHTML = '';
  if (r.images && r.images.length > 0) {
    galleryHTML = r.images.map(img => `<img src="${img.image_url}" class="gallery-img" alt="${r.name}">`).join('');
  } else {
    // Fallback if no images are uploaded
    galleryHTML = `<div style="width:100%; height:100%; background:linear-gradient(160deg,#3E6B8F,#0F2A3F);"></div>`;
  }

  const price = parseFloat(r.base_price).toLocaleString();
  const desc = r.description || "A beautiful room at Sunrise Haven, waiting for your stay.";
  const viewTag = r.view_tag || 'Standard';
  
  // Standard amenities since we removed them from the strict database schema
  const standardAmen = ['Queen bed', 'Ensuite bathroom', 'Fibre wifi', 'Reading nook', 'Rain shower'];
  const amenHTML = standardAmen.map(a => `<div>${a}</div>`).join('');

  // 2. Inject the dynamic popup HTML
  detail.innerHTML = `
    <div class="detail-media">
      <div class="gallery-scroll">
        ${galleryHTML}
      </div>
      <div class="gallery-overlay-gradient"></div>
      <div class="detail-close" id="close-btn">&times;</div>
      <div class="detail-tag">${viewTag} · Swipe to view all photos</div>
    </div>
    <div class="detail-body">
      <div class="detail-top">
        <h2>${r.name}</h2>
        <div class="detail-price">₱${price}<span>per night, excl. taxes</span></div>
      </div>
      <div class="detail-specs">
        <div class="spec"><b>${r.capacity}</b><span>Guests</span></div>
        <div class="spec"><b>${r.beds}</b><span>Bed${r.beds > 1 ? 's' : ''}</span></div>
        <div class="spec"><b>1</b><span>Bathroom</span></div>
      </div>
      <p class="detail-desc">${desc}</p>
      <div class="amen-list">${amenHTML}</div>
      <a href="availability.html" class="book-btn">Book this room →</a>
    </div>`;
    
  overlay.classList.add('open');
  document.getElementById('close-btn').addEventListener('click', closeDetail);
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
overlay.addEventListener('click', e => { if (e.target === overlay) closeDetail(); });   