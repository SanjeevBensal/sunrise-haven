// ==========================================
// FRONTEND BOUNCE: ADMIN DASHBOARD PROTECTION
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get('token');

if (tokenFromUrl) {
    localStorage.setItem('access_token', tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
}

const token = localStorage.getItem('access_token');
const AUTH_API_URL = "https://sunrise-haven.onrender.com";
const LIVE_CUSTOMER_URL = "https://sunrise-haven.vercel.app";

if (!token) {
    alert("You must be logged in to view this page.");
    window.location.href = LIVE_CUSTOMER_URL; 
} else {
    fetch(`${AUTH_API_URL}/auth/requests`, { 
        headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => {
        if (res.status === 403 || res.status === 401) {
            alert("Unauthorized: Only approved owners can access this dashboard.");
            localStorage.removeItem('access_token'); 
            window.location.href = LIVE_CUSTOMER_URL; 
        }
    })
    .catch(err => console.error("Validation error", err));
}
// ==========================================

// WAIT FOR THE HTML TO FULLY LOAD BEFORE ARMING BUTTONS
document.addEventListener('DOMContentLoaded', () => {
    let globalRooms = [];
    let currentEditId = null;

    const grid = document.getElementById('room-grid');
    const roomModal = document.getElementById('room-modal');
    const closeRoomModal = document.getElementById('close-room-modal');
    const newRoomBtn = document.getElementById('new-room-btn');
    const form = document.querySelector('.login-form');
    const deleteBtn = document.querySelector('.action-btn.delete');

    async function loadRooms() {
        try {
            const res = await fetch('https://sunrise-haven.onrender.com/rooms/all', {
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (res.status === 401) {
                console.error("Unauthorized to load rooms.");
                return;
            }
            globalRooms = await res.json();
            render();
        } catch (e) {
            console.error("Failed to load rooms", e);
        }
    }

    function cardHTML(r) {
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

    function render() {
        const cap = document.getElementById('f-capacity').value;
        const view = document.getElementById('f-view').value;
        const sort = document.getElementById('f-sort').value;
        const q = document.getElementById('f-search').value.toLowerCase();

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

        if (grid) grid.innerHTML = list.map(cardHTML).join('');

        document.querySelectorAll('.edit-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openEditModal(parseInt(btn.getAttribute('data-id')));
            });
        });
    }

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

            const gallery = document.getElementById('m-existing-images');
            if (gallery) {
                gallery.innerHTML = ''; 
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
        if (roomModal) roomModal.classList.add('active');
    }

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
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ image_url: url })
                    });
                    if (res.ok) {
                        btn.parentElement.remove(); 
                        loadRooms(); 
                    } else {
                        alert("Failed to remove image from database.");
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
    });

    // THIS IS THE BUTTON THAT WAS FAILING
    if (newRoomBtn) {
        newRoomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentEditId = null;
            document.getElementById('room-modal-title').textContent = "Add New Room";
            document.querySelectorAll('#room-modal input').forEach(input => input.value = '');
            const gallery = document.getElementById('m-existing-images');
            if (gallery) gallery.innerHTML = '<span style="font-size:13px; color:var(--ink-soft); margin:auto;">No images uploaded yet.</span>';
            if(deleteBtn) deleteBtn.style.display = "none"; 
            if (roomModal) roomModal.classList.add('active');
        });
    }

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
                const res = await fetch(targetUrl, {
                    method: method,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(roomData)
                });
                
                if (!res.ok) throw new Error("Failed to save room details.");
                const savedRoom = await res.json();
                const finalRoomId = savedRoom.id;

                const imageInput = document.getElementById('m-images');
                if (imageInput && imageInput.files.length > 0) {
                    const formData = new FormData();
                    for (let i = 0; i < imageInput.files.length; i++) {
                        formData.append("files", imageInput.files[i]);
                    }
                    
                    const imgRes = await fetch(`https://sunrise-haven.onrender.com/rooms/${finalRoomId}/images`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}` 
                        },
                        body: formData
                    });
                    
                    if (!imgRes.ok) {
                        const errorData = await imgRes.json();
                        alert("Text saved, but image upload failed: " + JSON.stringify(errorData));
                        throw new Error("Image upload failed");
                    }
                }

                if (roomModal) roomModal.classList.remove('active');
                loadRooms(); 
            } catch (err) {
                if (err.message !== "Image upload failed") {
                    alert("Failed to save room details.");
                }
                console.error(err);
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!currentEditId) return;
            if (confirm("Are you sure you want to delete this room entirely?")) {
                await fetch(`https://sunrise-haven.onrender.com/rooms/${currentEditId}`, { 
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    } 
                });
                if (roomModal) roomModal.classList.remove('active');
                loadRooms();
            }
        });
    }

    if (closeRoomModal) closeRoomModal.addEventListener('click', () => { if(roomModal) roomModal.classList.remove('active'); });
    window.addEventListener('click', (e) => { if (e.target === roomModal) roomModal.classList.remove('active'); });

    ['f-capacity', 'f-view', 'f-sort'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', render);
    });
    const searchEl = document.getElementById('f-search');
    if(searchEl) searchEl.addEventListener('input', render);

    loadRooms();
});