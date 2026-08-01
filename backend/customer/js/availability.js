document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // BACKGROUND ANIMATIONS (Sun & Mountains)
  // ==========================================
  const sun = document.getElementById('sun');
  const rays = document.getElementById('rays');
  const mtnNear = document.getElementById('mtn-near');
  const mtnMid = document.getElementById('mtn-mid');

  if (sun && rays) {
    gsap.to(rays, { rotation: 360, duration: 50, repeat: -1, ease: "none" });
    gsap.to(sun, { y: 250, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (mtnNear) gsap.to(mtnNear, { y: -50, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    if (mtnMid) gsap.to(mtnMid, { y: -25, scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
});

// ==========================================
// STATE VARIABLES & API SETTINGS
// ==========================================
const API_BASE_URL = "https://sunrise-haven.onrender.com";

const startupDate = new Date();
let currentMonth = startupDate.getMonth(); 
let currentYear = startupDate.getFullYear();
let selectedCheckInDate = null;
let nights = 2;
let selectedRoom = null;
let bookingStep = 1;
let guestInfo = {};
let latestFetchedRooms = []; // Cache the fetched rooms for local view filtering

// ==========================================
// SECURITY: XSS PREVENTION
// ==========================================
// Escapes potentially dangerous characters from user input before rendering to the DOM
function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// ==========================================
// API FETCH LOGIC
// ==========================================
async function fetchAvailableRooms() {
  if (!selectedCheckInDate) {
      renderRoomsList([]); 
      return;
  }

  const capacityFilter = document.getElementById('f-capacity').value;

  // 1. Calculate check-out date
  const checkIn = new Date(selectedCheckInDate);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + parseInt(nights));

  // Format dates as YYYY-MM-DD
  const checkInStr = checkIn.toISOString().split('T')[0];
  const checkOutStr = checkOut.toISOString().split('T')[0];

  // 2. Build the URL
  let url = `${API_BASE_URL}/rooms/available?check_in=${checkInStr}&check_out=${checkOutStr}`;
  if (capacityFilter) {
      url += `&capacity=${capacityFilter}`;
  }

  try {
      // 3. Fetch from FastAPI
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      latestFetchedRooms = await response.json();
      
      // 4. Update the UI
      renderRoomsList(latestFetchedRooms); 
      
  } catch (error) {
      console.error("Error fetching rooms:", error);
      document.getElementById('room-list').innerHTML = "<div class='empty-state'><p>Sorry, we couldn't load the rooms right now. Make sure the backend is running.</p></div>";
  }
}
function renderRoomsList(rooms) {
  const roomListContainer = document.getElementById('room-list');
  const resultCount = document.getElementById('result-count');
  const viewFilter = document.getElementById('f-view').value;
  
  // Apply the "View" dropdown filter locally
  let filteredRooms = rooms;
  if (viewFilter) {
      filteredRooms = filteredRooms.filter(r => r.view_tag === viewFilter);
  }

  resultCount.textContent = `${filteredRooms.length} room${filteredRooms.length === 1 ? '' : 's'}`;

  if (!selectedCheckInDate) {
      roomListContainer.innerHTML = `<div class="empty-state"><h4>No date selected</h4><p>Choose a check-in date on the calendar to see live availability.</p></div>`;
      return;
  }

  if (filteredRooms.length === 0) {
      roomListContainer.innerHTML = "<div class='empty-state'><p>No rooms available for these dates and filters.</p></div>";
      return;
  }

  // Generate HTML from PostgreSQL data
  roomListContainer.innerHTML = filteredRooms.map((r, index) => {
      // 1. Setup fallback gradients
      const fallbackGradients = [
        'linear-gradient(160deg,#3E6B8F,#0F2A3F)', 'linear-gradient(160deg,#4A7A63,#122A21)',
        'linear-gradient(160deg,#8C6A3E,#2A1E10)', 'linear-gradient(160deg,#5A5A7A,#151526)'
      ];
      const defaultGrad = fallbackGradients[r.id % fallbackGradients.length];

      // 2. Safely grab the first image from Cloudinary, or use the gradient
      const firstImage = (r.images && r.images.length > 0) ? `url('${r.images[0].image_url}')` : defaultGrad;

      return `<div class="room-row">
        <div class="room-thumb" style="background:${firstImage}; background-size: cover; background-position: center; border-radius:10px;"></div>
        <div>
          <h4>${r.name}</h4>
          <div class="meta">
              <span>${r.view_tag || 'Standard'}</span>
              <span>${r.capacity} guests</span>
              <span>${r.beds} bed${r.beds > 1 ? 's' : ''}</span>
          </div>
          <span class="status-chip green">Available</span>
        </div>
        <div class="room-side">
          <div class="room-price">₱${Number(r.base_price).toLocaleString()}<span>/ night</span></div>
          <button class="select-btn" data-id="${r.id}">Select room</button>
        </div>
      </div>`;
  }).join('');

  // Attach event listeners to the dynamically created "Select" buttons
  roomListContainer.querySelectorAll('.select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
          selectedRoom = filteredRooms.find(r => r.id === parseInt(btn.dataset.id));
          bookingStep = 1;
          guestInfo = {};
          openBooking();
      });
  });
}

// ==========================================
// CALENDAR LOGIC (Database Connected)
// ==========================================
let monthlyAvailability = {}; // Cache the database availability for the current month

// Fetch availability status for the entire month from PostgreSQL
async function fetchMonthCalendarData(year, month) {
    const monthStr = String(month + 1).padStart(2, '0');
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/calendar?year=${year}&month=${monthStr}`);
        if (response.ok) {
            monthlyAvailability = await response.json();
        }
    } catch (error) {
        console.warn("Calendar overview endpoint not connected yet. Defaulting all days to available.");
        monthlyAvailability = {}; 
    }
    renderCalendar(); // Re-render once data arrives
}

// Map the specific day to the fetched database status
function dayStatus(y, m, d) {
    const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (monthlyAvailability[key]) {
        return monthlyAvailability[key]; // Returns 'green', 'amber', or 'red' based on backend
    }
    return 'green'; // Default fallback
}

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const dowRow = document.getElementById('cal-dow-row');
['S','M','T','W','T','F','S'].forEach(d => {
  const el = document.createElement('div'); el.className = 'cal-dow'; el.textContent = d; dowRow.appendChild(el);
});

function renderCalendar() {
  document.getElementById('cal-month').textContent = monthNames[currentMonth] + ' ' + currentYear;
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = '';
  
  const firstDow = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // 1. Get the actual real-world date to prevent past bookings
  const today = new Date();
  const realYear = today.getFullYear();
  const realMonth = today.getMonth();
  const realDate = today.getDate();

  // 2. Disable the "Previous Month" button if we are currently in the present month
  const prevBtn = document.getElementById('cal-prev');
  if (currentYear < realYear || (currentYear === realYear && currentMonth <= realMonth)) {
      prevBtn.disabled = true;
      prevBtn.style.opacity = '0.3';
      prevBtn.style.cursor = 'not-allowed';
  } else {
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      prevBtn.style.cursor = 'pointer';
  }
  
  for (let i = 0; i < firstDow; i++) {
    const pad = document.createElement('div'); pad.className = 'cal-day pad'; grid.appendChild(pad);
  }
  
  // Calculate check-in and check-out dates to highlight the range
  let checkInObj = null;
  let checkOutObj = null;
  if (selectedCheckInDate) {
      checkInObj = new Date(selectedCheckInDate);
      checkInObj.setHours(0,0,0,0); // Normalize to midnight
      checkOutObj = new Date(checkInObj);
      checkOutObj.setDate(checkOutObj.getDate() + nights);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let status = dayStatus(currentYear, currentMonth, d);
    
    // 3. Prevent clicking on days that have already passed in the current month
    if (currentYear === realYear && currentMonth === realMonth && d < realDate) {
        status = 'red'; // Flags it as fully booked / unavailable
    }

    const el = document.createElement('div');
    el.className = 'cal-day ' + status;
    el.textContent = d;
    
    // Format date properly for consistency (YYYY-MM-DD)
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Check if this specific day falls within the selected length of stay
    const currentDayObj = new Date(currentYear, currentMonth, d);
    currentDayObj.setHours(0,0,0,0);

    if (selectedCheckInDate === key) {
        el.classList.add('selected'); // Highlight the exact check-in day
    } else if (checkInObj && checkOutObj && currentDayObj > checkInObj && currentDayObj < checkOutObj) {
        el.classList.add('in-range'); // Highlight the remaining stay duration
    }
    
    if (status !== 'red') {
      el.addEventListener('click', () => {
        selectedCheckInDate = key;
        refreshNote();
        renderCalendar(); // Re-render to update the highlight range immediately
        fetchAvailableRooms(); 
      });
    }
    grid.appendChild(el);
  }
}

document.getElementById('cal-prev').addEventListener('click', () => {
  const prevBtn = document.getElementById('cal-prev');
  if (prevBtn.disabled) return;
  currentMonth--; 
  if (currentMonth < 0) { currentMonth = 11; currentYear--; } 
  fetchMonthCalendarData(currentYear, currentMonth); // Fetch new month data
});

document.getElementById('cal-next').addEventListener('click', () => {
  currentMonth++; 
  if (currentMonth > 11) { currentMonth = 0; currentYear++; } 
  fetchMonthCalendarData(currentYear, currentMonth); // Fetch new month data
});

// ==========================================
// FILTERS & NIGHTS CONTROLS
// ==========================================
document.getElementById('nights-minus').addEventListener('click', () => {
  if (nights > 1) { 
      nights--; 
      document.getElementById('nights-val').textContent = nights; 
      refreshNote();
      renderCalendar(); // Re-render so the calendar range highlight shrinks
      fetchAvailableRooms();
  }
});
document.getElementById('nights-plus').addEventListener('click', () => {
  if (nights < 14) { 
      nights++; 
      document.getElementById('nights-val').textContent = nights; 
      refreshNote();
      renderCalendar(); // Re-render so the calendar range highlight expands
      fetchAvailableRooms();
  }
});

function refreshNote() {
  if (!selectedCheckInDate) return;
  const [y, m, d] = selectedCheckInDate.split('-').map(Number);
  document.getElementById('date-note').textContent =
    `Showing rooms for check-in ${monthNames[m - 1]} ${d}, ${y} · ${nights} night${nights > 1 ? 's' : ''}.`;
}

// Initial Page Load execution
fetchMonthCalendarData(currentYear, currentMonth);
renderRoomsList([]);

// Listen to dropdown filters
document.getElementById('f-capacity').addEventListener('change', fetchAvailableRooms); // Needs API call
document.getElementById('f-view').addEventListener('change', () => renderRoomsList(latestFetchedRooms)); // Local filter

// ==========================================
// BOOKING MODAL FLOW
// ==========================================
const overlay = document.getElementById('overlay');
const panel = document.getElementById('booking-panel');

function nightlyTotal() { return Number(selectedRoom.base_price) * nights; }
function taxes() { return Math.round(nightlyTotal() * 0.12); }
function grandTotal() { return nightlyTotal() + taxes(); }

function stepper(active) {
  let dots = '';
  for (let i = 1; i <= 4; i++) dots += `<div class="step-dot ${i <= active ? 'active' : ''}"></div>`;
  return `<div class="stepper">${dots}</div>`;
}

function renderBooking() {
  const [y, m, d] = selectedCheckInDate.split('-').map(Number);
  const dateStr = `${monthNames[m - 1]} ${d}, ${y}`;

  let body = '';
  if (bookingStep === 1) {
    body = `<div class="bp-body">
      <h4>Guest information</h4>
      <div class="field"><label>Full name</label><input id="g-name" type="text" placeholder="Juan Dela Cruz" value="${escapeHTML(guestInfo.name) || ''}"></div>
      <div class="two-col">
        <div class="field"><label>Email</label><input id="g-email" type="email" placeholder="you@email.com" value="${escapeHTML(guestInfo.email) || ''}"></div>
        <div class="field"><label>Phone</label><input id="g-phone" type="tel" placeholder="+63 900 000 0000" value="${escapeHTML(guestInfo.phone) || ''}"></div>
      </div>
      <div class="field"><label>Number of guests</label><input id="g-guests" type="number" min="1" max="${selectedRoom.capacity}" value="${guestInfo.guests || 1}"></div>
      <div class="field"><label>Special requests (optional)</label><textarea id="g-notes" rows="3" placeholder="Early check-in, dietary notes...">${escapeHTML(guestInfo.notes) || ''}</textarea></div>
      <div class="bp-actions">
        <span></span>
        <button class="btn-primary" id="to-review">Continue to review →</button>
      </div>
    </div>`;
  } else if (bookingStep === 2) {
    body = `<div class="bp-body">
      <h4>Review your booking</h4>
      <div class="summary-card">
        <div class="summary-row"><span>Room</span><b>${selectedRoom.name}</b></div>
        <div class="summary-row"><span>Check-in</span><b>${dateStr}</b></div>
        <div class="summary-row"><span>Length of stay</span><b>${nights} night${nights > 1 ? 's' : ''}</b></div>
        <div class="summary-row"><span>Guests</span><b>${guestInfo.guests} of ${selectedRoom.capacity}</b></div>
        <div class="summary-row"><span>Guest</span><b>${escapeHTML(guestInfo.name)}</b></div>
        <div class="summary-row"><span>Room rate</span><span>₱${Number(selectedRoom.base_price).toLocaleString()} × ${nights}</span></div>
        <div class="summary-row"><span>Taxes and fees (12%)</span><span>₱${taxes().toLocaleString()}</span></div>
        <div class="summary-row total"><span>Estimated total</span><span>₱${grandTotal().toLocaleString()}</span></div>
      </div>
      <div class="bp-actions">
        <button class="btn-ghost" id="back-1">← Back</button>
        <button class="btn-primary" id="to-pay">Continue to payment →</button>
      </div>
    </div>`;
  } else if (bookingStep === 3) {
    body = `<div class="bp-body">
      <h4>Payment details</h4>
      <div class="pay-card">
        <div class="field"><label>Card number</label><input type="text" placeholder="4242 4242 4242 4242"></div>
        <div class="two-col">
          <div class="field"><label>Expiry</label><input type="text" placeholder="MM / YY"></div>
          <div class="field"><label>CVC</label><input type="text" placeholder="123"></div>
        </div>
        <p class="pay-note">This is a placeholder payment form for demonstration only — no real payment is processed.</p>
      </div>
      <div class="summary-card">
        <div class="summary-row total"><span>Amount due today</span><span>₱${grandTotal().toLocaleString()}</span></div>
      </div>
      <div class="bp-actions">
        <button class="btn-ghost" id="back-2">← Back</button>
        <button class="btn-primary" id="to-confirm">Confirm and pay →</button>
      </div>
    </div>`;
  } 
  else if (bookingStep === 4) {
    const ref = 'SH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    body = `<div class="bp-body confirm-wrap">
      <svg class="check-circle" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="34"/>
        <path d="M28 43 L38 53 L57 31"/>
      </svg>
      <h4>Booking confirmed</h4>
      <p>A confirmation has been sent to <b>${escapeHTML(guestInfo.email) || 'your email'}</b>. We look forward to your sunrise on ${dateStr}.</p>
      <div class="ref-code">Reference ${ref}</div>
      <div class="bp-actions" style="justify-content:center;">
        <button class="btn-primary" id="done-btn">Done</button>
      </div>
    </div>`;
  }

  panel.innerHTML = `
    <div class="bp-head">
      <h3>${bookingStep < 4 ? selectedRoom.name : 'Confirmation'}</h3>
      <div class="bp-close" id="bp-close">&times;</div>
    </div>
    ${bookingStep < 4 ? stepper(bookingStep) : ''}
    ${body}`;

  document.getElementById('bp-close').addEventListener('click', closeBooking);
  
  if (bookingStep === 1) {
    document.getElementById('to-review').addEventListener('click', () => {
      guestInfo = {
        name: document.getElementById('g-name').value || 'Guest',
        email: document.getElementById('g-email').value,
        phone: document.getElementById('g-phone').value,
        guests: document.getElementById('g-guests').value || 1,
        notes: document.getElementById('g-notes').value
      };
      bookingStep = 2; renderBooking();
    });
  }
  if (bookingStep === 2) {
    document.getElementById('back-1').addEventListener('click', () => { bookingStep = 1; renderBooking(); });
    document.getElementById('to-pay').addEventListener('click', () => { bookingStep = 3; renderBooking(); });
  }
  if (bookingStep === 3) {
    document.getElementById('back-2').addEventListener('click', () => { bookingStep = 2; renderBooking(); });
    
    document.getElementById('to-confirm').addEventListener('click', async () => { 
        const confirmBtn = document.getElementById('to-confirm');
        confirmBtn.textContent = "Processing Payment...";
        confirmBtn.disabled = true;

        try {
            // Updated Payload: Included the guest info so FastAPI validation passes
            const bookingPayload = {
                room_id: selectedRoom.id,
                guest_name: guestInfo.name, 
                guest_email: guestInfo.email,
                guest_phone: guestInfo.phone,
                check_in: selectedCheckInDate,
                check_out: new Date(new Date(selectedCheckInDate).setDate(new Date(selectedCheckInDate).getDate() + nights)).toISOString().split('T')[0],
                guests: parseInt(guestInfo.guests),
                total_amount: grandTotal(),
                special_requests: guestInfo.notes
            };

            // Removed Auth Headers since guests do not log in to book
            const bookingResponse = await fetch(`${API_BASE_URL}/bookings/`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(bookingPayload)
            });

            if (!bookingResponse.ok) {
                const errorData = await bookingResponse.json();
                console.error("Backend Error Details:", errorData);
                throw new Error("Backend rejected the booking.");
            }
            
            const bookingData = await bookingResponse.json();

            // Directly push to the confirmation step (Step 4) to bypass the fake GCash checkout
            bookingStep = 4;
            renderBooking();

        } catch (error) {
            console.error(error);
            alert("An error occurred while processing your booking. Check the browser console (F12) for exact details.");
            confirmBtn.textContent = "Confirm and pay →";
            confirmBtn.disabled = false;
        }
    });
  }
  if (bookingStep === 4) {
    document.getElementById('done-btn').addEventListener('click', closeBooking);
  }
}

function openBooking() {
  renderBooking();
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBooking() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  if(bookingStep === 4) {
      fetchAvailableRooms();
  }
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeBooking(); });