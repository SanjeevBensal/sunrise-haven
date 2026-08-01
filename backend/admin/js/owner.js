
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
// Security: Escape HTML to prevent XSS in the dashboard
function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
    );
}

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
    };
}

let globalBookings = [];

document.addEventListener('DOMContentLoaded', () => {
    const bookingModal = document.getElementById('booking-modal');
    const closeBookingModal = document.getElementById('close-booking-modal');
    const newBookingBtn = document.getElementById('new-booking-btn');
    const tbody = document.getElementById('bookings-tbody');

    async function loadBookings() {
        try {
            const response = await fetch(`/https://sunrise-haven.onrender.combookings/`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error("Failed to load bookings");
            globalBookings = await response.json();
            renderBookings(globalBookings);
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Failed to load data. Make sure backend is running.</td></tr>`;
        }
    }

    function renderBookings(bookings) {
        tbody.innerHTML = ''; 
        if (bookings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No active bookings found.</td></tr>`;
            return;
        }

        bookings.forEach(b => {
            const row = document.createElement('tr');
            const checkIn = new Date(b.check_in).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const checkOut = new Date(b.check_out).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            row.innerHTML = `
                <td><b>${escapeHTML(b.booking_reference)}</b></td>
                <td>${escapeHTML(b.guest_name)}</td>
                <td>Room: ${b.room_id || 'N/A'}</td>
                <td>${checkIn} &mdash; ${checkOut}</td>
                <td><span class="status ${b.status}">${escapeHTML(b.status)}</span></td>
                <td class="action-cells">
                    <button class="action-btn edit" data-id="${b.id}">Edit</button>
                    <button class="action-btn delete" data-id="${b.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        attachActionListeners();
    }

    function attachActionListeners() {
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Are you sure you want to delete this booking?")) {
                    await fetch(`https://sunrise-haven.onrender.com/bookings/${e.target.dataset.id}`, { method: 'DELETE', headers: getAuthHeaders() });
                    loadBookings();
                }
            });
        });

        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const booking = globalBookings.find(b => b.id === parseInt(e.target.dataset.id));
                if (booking) openEditModal(booking);
            });
        });
    }

    let currentEditId = null;
    function openEditModal(booking) {
        currentEditId = booking.id;
        document.getElementById('m-guest-name').value = booking.guest_name;
        document.getElementById('m-check-in').value = booking.check_in;
        document.getElementById('m-check-out').value = booking.check_out;
        document.getElementById('m-status').value = booking.status;
        document.getElementById('m-room-id').value = booking.room_id || '';
        
        document.getElementById('modal-title').textContent = "Edit Booking Details";
        bookingModal.classList.add('active');
    }

    document.getElementById('save-booking-btn').addEventListener('click', async () => {
        if (!currentEditId) return;
        
        // This ensures the Room ID is captured and converted to a number properly!
        const roomIdVal = document.getElementById('m-room-id').value;
        const requestBody = {
            guest_name: document.getElementById('m-guest-name').value,
            check_in: document.getElementById('m-check-in').value,
            check_out: document.getElementById('m-check-out').value,
            status: document.getElementById('m-status').value,
            room_id: roomIdVal ? parseInt(roomIdVal) : null
        };

        try {
            const response = await fetch(`https://sunrise-haven.onrender.com/bookings/${currentEditId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                bookingModal.classList.remove('active');
                loadBookings();
            } else {
                const errorData = await response.json();
                alert(`Update failed: ${errorData.detail}`); // This will tell us if the room doesn't exist!
            }
        } catch (error) { console.error(error); }
    });

    if (bookingModal && newBookingBtn) {
        newBookingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            currentEditId = null; 
            ['m-guest-name', 'm-check-in', 'm-check-out', 'm-room-id'].forEach(id => document.getElementById(id).value = '');
            document.getElementById('m-status').value = 'pending';
            document.getElementById('modal-title').textContent = "New Booking";
            bookingModal.classList.add('active');
        });
        document.getElementById('close-booking-modal').addEventListener('click', () => bookingModal.classList.remove('active'));
    }

    loadBookings();
});