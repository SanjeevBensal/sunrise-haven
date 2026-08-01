let globalRooms = [];
let currentEditId = null;

const grid = document.getElementById('room-grid');
const roomModal = document.getElementById('room-modal');
const closeRoomModal = document.getElementById('close-room-modal');
const newRoomBtn = document.getElementById('new-room-btn');
const form = document.querySelector('.login-form');
const deleteBtn = document.querySelector('.action-btn.delete');

// ==========================================
// FRONTEND BOUNCE: ADMIN DASHBOARD PROTECTION
// ==========================================
const token = localStorage.getItem('access_token');
const AUTH_API_URL = "https://sunrise-haven.onrender.com";

if (!token) {
    alert("You must be logged in to view this page.");
    window.location.href = "../customer/index.html"; // Kick them out to the homepage
} else {
    // Verify with the backend that this token belongs to an APPROVED ADMIN
    fetch(`${AUTH_API_URL}/auth/requests`, { 
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (res.status === 403 || res.status === 401) {
            alert("Unauthorized: Only approved owners can access this dashboard.");
            localStorage.removeItem('access_token'); // Clear the fake/unauthorized token
            window.location.href = "../customer/index.html"; // Kick them out
        }
    })
    .catch(err => console.error("Validation error", err));
}
// ==========================================

// 1. Fetch from your Database
async function loadRooms() {
    try {
        const res = await fetch('https://sunrise-haven.onrender.com/rooms/all', {
            // FIXED: Added token to load the rooms
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        
        if (res.status === 401) {
            console.error("Unauthorized to load rooms. Token may be expired.");
            return;
        }

        globalRooms = await res.json();
        render();
    } catch (e) {
        console.error("Failed to load rooms", e);
    }
}

// 2. Render Cards
function cardHTML(r) {
    // Grabs the first image from Cloudinary, or defaults to the gradient if no images exist yet
    const firstImage = (r.images && r.images.length > 0) ? `url('${r.images[0].image_url}')` : 'linear-gradient(160deg,#3E6B8F,#0F2A3F)';
    
    return `<div class="room-card" data-id="${r.id}">
    <div class="room-media">
      <div class="fill" style="background: ${firstImage}; background-size: cover; background-position: center;"></div>
      <span class="tag">${r.view_tag || 'Standard'}</span>
    </div>
    <div class="room-info">
      <h3>${r.name}</h3>
      <div class="room-meta"><span>${r.capacity} guests</span><span>${r.beds} bed${r.beds > 1 ? 's' : ''}</span></div>
      <div class="room-foot">
        <div class="room-price">₱${parseFloat(r.base_price).toLocaleString()} <span>/ night</span></div>
        <div class="action-cells">
          <button class="action-btn edit edit-room-btn" data-id="${r.id}">Edit details</button>
        </div>
      </div>
    </div>
  </div>`;
}

// Filter & Sort Logic
function render() {
    const cap = document.getElementById('f-capacity').value;
    const view = document.getElementById('f-view').value;
    const sort = document.getElementById('f-sort').value;
    const q = document.getElementById('f-search').value.toLowerCase();

    // Prevent crashing if globalRooms isn't an array yet
    if (!Array.isArray(globalRooms)) return;

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

    document.querySelectorAll('.edit-room-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openEditModal(parseInt(btn.getAttribute('data-id')));
        });
    });
}

// 3. Open Modal for Edit
function openEditModal(id) {
    currentEditId = id;
    const r = globalRooms.find(x => x.id === id);
    if (r) {
        document.getElementById('room-modal-title').textContent = "Edit Room";
        document.getElementById('m-name').value = r.name;
        document.getElementById('m-price').value = r.base_price;
        if(document.getElementById('m-tag')) document.getElementById('m-tag').value = r.view_tag || '';
        if(document.getElementById('m-desc')) document.getElementById('m-desc').value = r.description || '';
        if(document.getElementById('m-cap')) document.getElementById('m-cap').value = r.capacity;
        if(document.getElementById('m-beds')) document.getElementById('m-beds').value = r.beds;
        if(document.getElementById('m-images')) document.getElementById('m-images').value = ''; 
        if(deleteBtn) deleteBtn.style.display = "block"; 

        // --- NEW: Populate the Mini-Gallery ---
        const gallery = document.getElementById('m-existing-images');
        if (gallery) {
            gallery.innerHTML = ''; // Clear out previous images
            
            // Safely grab images no matter how the database sends them
            let imageList = [];
            if (r.images && r.images.length > 0) {
                imageList = r.images.map(img => img.image_url);
            } else if (r.image_urls) {
                imageList = r.image_urls.split(',').filter(u => u.trim() !== '');
            }

            if (imageList.length > 0) {
                imageList.forEach(url => {
                    gallery.innerHTML += `
                        <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:1px solid rgba(14,28,41,0.15);">
                            <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
                            <button type="button" class="remove-img-btn" data-url="${url}" data-room-id="${r.id}" style="position:absolute; top:4px; right:4px; background:#D93838; color:white; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.3);">&times;</button>
                        </div>
                    `;
                });
            } else {
                gallery.innerHTML = '<span style="font-size:13px; color:var(--ink-soft); margin:auto;">No images uploaded yet.</span>';
            }
        }
    }
    roomModal.classList.add('active');
}

// --- Handle deleting an individual image ---
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.remove-img-btn');
    if (btn) {
        e.preventDefault();
        const url = btn.getAttribute('data-url');
        const roomId = btn.getAttribute('data-room-id');

        if(confirm("Are you sure you want to remove this specific image?")) {
            try {
                const res = await fetch(`https://sunrise-haven.onrender.com/rooms/${roomId}/remove-image`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // FIXED: Added token for deleting image
                    },
                    body: JSON.stringify({ image_url: url })
                });

                if (res.ok) {
                    btn.parentElement.remove(); // Visually remove the thumbnail immediately
                    loadRooms(); // Refresh the grid in the background
                } else {
                    alert("Failed to remove image from database.");
                }
            } catch (err) {
                console.error(err);
            }
        }
    }
});

// 4. Open Modal for New Room
if (newRoomBtn) {
    newRoomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentEditId = null;
        document.getElementById('room-modal-title').textContent = "Add New Room";
        document.querySelectorAll('#room-modal input').forEach(input => input.value = '');
        
        const gallery = document.getElementById('m-existing-images');
        if (gallery) gallery.innerHTML = '<span style="font-size:13px; color:var(--ink-soft); margin:auto;">No images uploaded yet.</span>';

        if(deleteBtn) deleteBtn.style.display = "none"; // Hide delete button for new rooms
        roomModal.classList.add('active');
    });
}

// 5. Save Changes (Create or Edit) & Upload Images to Cloudinary
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const roomData = {
            name: document.getElementById('m-name').value,
            base_price: parseFloat(document.getElementById('m-price').value),
            view_tag: document.getElementById('m-tag') ? document.getElementById('m-tag').value : '',
            description: document.getElementById('m-desc') ? document.getElementById('m-desc').value : '',
            capacity: document.getElementById('m-cap') ? parseInt(document.getElementById('m-cap').value) : 2,
            beds: document.getElementById('m-beds') ? parseInt(document.getElementById('m-beds').value) : 1
        };

        let targetUrl = 'https://sunrise-haven.onrender.com/rooms/';
        let method = 'POST';

        if (currentEditId) {
            targetUrl = `https://sunrise-haven.onrender.com/rooms/${currentEditId}`;
            method = 'PATCH';
        }

        try {
            // Step A: Save text details to database
            const res = await fetch(targetUrl, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // FIXED: Added token for saving room data
                },
                body: JSON.stringify(roomData)
            });
            
            if (!res.ok) throw new Error("Failed to save room details.");
            const savedRoom = await res.json();
            const finalRoomId = savedRoom.id;

            // Step B: Upload Images if selected
            const imageInput = document.getElementById('m-images');
            if (imageInput && imageInput.files.length > 0) {
                const formData = new FormData();
                for (let i = 0; i < imageInput.files.length; i++) {
                    formData.append("files", imageInput.files[i]);
                }
                
                // Fire to the Cloudinary endpoint
                const imgRes = await fetch(`https://sunrise-haven.onrender.com/rooms/${finalRoomId}/images`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}` // FIXED: Added token for uploading images
                    },
                    body: formData
                });
                
                if (!imgRes.ok) {
                    const errorData = await imgRes.json();
                    alert("Text saved, but image upload failed: " + JSON.stringify(errorData));
                    throw new Error("Image upload failed");
                }
            }

            roomModal.classList.remove('active');
            loadRooms(); // Refresh the grid to show new data/images!
        } catch (err) {
            if (err.message !== "Image upload failed") {
                alert("Failed to save room details.");
            }
            console.error(err);
        }
    });
}

// 6. Delete Room
if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentEditId) return;
        
        if (confirm("Are you sure you want to delete this room entirely?")) {
            await fetch(`https://sunrise-haven.onrender.com/rooms/${currentEditId}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // FIXED: Added token for deleting room
                } 
            });
            roomModal.classList.remove('active');
            loadRooms();
        }
    });
}

// Bind Modal Closing
if (closeRoomModal) closeRoomModal.addEventListener('click', () => roomModal.classList.remove('active'));
window.addEventListener('click', (e) => { if (e.target === roomModal) roomModal.classList.remove('active'); });

// Bind Filters
['f-capacity', 'f-view', 'f-sort'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', render);
});
const searchEl = document.getElementById('f-search');
if(searchEl) searchEl.addEventListener('input', render);

// Boot it up!
loadRooms();