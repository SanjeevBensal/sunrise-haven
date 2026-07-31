
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
});

// ... Keep your existing `const destinations = [...]` array and logic below this ...
const destinations = [
  {name:'Burnham Park', grad:'linear-gradient(160deg,#4A7A63,#122A21)', distKm:1.8, drive:'6 min', walk:'22 min', jeep:'₱13', taxi:'₱90'},
  {name:'Mines View Park', grad:'linear-gradient(160deg,#3E6B8F,#0F2A3F)', distKm:3.4, drive:'10 min', walk:'48 min', jeep:'₱15', taxi:'₱120'},
  {name:'Camp John Hay', grad:'linear-gradient(160deg,#3F7A55,#0F2418)', distKm:4.1, drive:'12 min', walk:'55 min', jeep:'₱15', taxi:'₱140'},
  {name:'Botanical Garden', grad:'linear-gradient(160deg,#6B8C4E,#1E2A10)', distKm:2.6, drive:'8 min', walk:'34 min', jeep:'₱13', taxi:'₱100'},
  {name:'Session Road', grad:'linear-gradient(160deg,#8C6A3E,#2A1E10)', distKm:2.2, drive:'7 min', walk:'28 min', jeep:'₱13', taxi:'₱95'},
  {name:'The Mansion', grad:'linear-gradient(160deg,#5A5A7A,#151526)', distKm:3.7, drive:'11 min', walk:'50 min', jeep:'₱15', taxi:'₱130'},
  {name:'Wright Park', grad:'linear-gradient(160deg,#4A6B7A,#101E24)', distKm:3.6, drive:'11 min', walk:'49 min', jeep:'₱15', taxi:'₱125'},
  {name:'Strawberry Farm', grad:'linear-gradient(160deg,#6B4E8F,#1C1130)', distKm:8.5, drive:'22 min', walk:'—', jeep:'₱25', taxi:'₱260'}
];

const grid = document.getElementById('dest-grid');
grid.innerHTML = destinations.map(d=>`
  <div class="dest-card">
    <div class="dest-media" style="background:${d.grad}">
      <span class="dist-badge">${d.distKm} km away</span>
    </div>
    <div class="dest-body">
      <h4>${d.name}</h4>
      <div class="dest-fares">
        <div class="fare">Jeep fare<b>${d.jeep}</b></div>
        <div class="fare">Taxi fare<b>${d.taxi}</b></div>
        <div class="fare">Driving<b>${d.drive}</b></div>
        <div class="fare">Walking<b>${d.walk}</b></div>
      </div>
      <div class="dest-foot">
        <span class="dest-time">From Sunrise Haven</span>
        <a href="#" class="dir-btn">Directions →</a>
      </div>
    </div>
  </div>`).join('');

/* ITINERARY GENERATOR */
const templates = {
  couple:[
    {morning:'Slow breakfast on the terrace, then a walk around Burnham Park lake.', lunch:'Coffee and pastries along Session Road.', afternoon:'Wander Camp John Hay\'s pine trails, just the two of you.', dinner:'A quiet dinner reservation near Session Road.', night:'Fire pit back at Sunrise Haven, weather permitting.'},
    {morning:'Sunrise from the room, then breakfast whenever you wake up.', lunch:'Picnic lunch at Wright Park.', afternoon:'Horseback ride along the ridge trail.', dinner:'Dinner at a Session Road favourite.', night:'Stargazing from the garden.'},
    {morning:'Late breakfast, then a relaxed drive to Mines View Park.', lunch:'Local Cordilleran lunch near the viewpoint.', afternoon:'Souvenir browsing at the Mines View stalls.', dinner:'Farewell dinner close to home.', night:'Pack slowly, one last sunset from the balcony.'}
  ],
  family:[
    {morning:'Breakfast together, then Burnham Park for boating and bikes.', lunch:'Casual lunch near the park, kid-friendly menu.', afternoon:'Botanical Garden for an easy walk and photos.', dinner:'Family-style dinner near Session Road.', night:'Early night — long day for the little ones.'},
    {morning:'Camp John Hay\'s open fields for a morning run-around.', lunch:'Packed lunch at the picnic grove.', afternoon:'Strawberry Farm for picking and photos.', dinner:'Dinner back near the property.', night:'Board games in the shared kitchen.'},
    {morning:'Relaxed morning at Sunrise Haven\'s garden.', lunch:'Lunch at Wright Park before the horses.', afternoon:'Short horseback rides for the kids.', dinner:'Easy dinner close to the hotel.', night:'Early lights out before the drive home.'}
  ],
  solo:[
    {morning:'Sunrise from the ridge trail behind the property.', lunch:'Quick bite at a Session Road café.', afternoon:'Camp John Hay on foot, no schedule.', dinner:'Dinner at the counter of a local favourite.', night:'Journal by the fire pit.'},
    {morning:'Early coffee, then Mines View before the crowds.', lunch:'Street food along Session Road.', afternoon:'The Mansion grounds, a slow loop.', dinner:'Solo dinner with a book.', night:'Quiet walk under the pines.'},
    {morning:'One more sunrise, no alarm needed.', lunch:'Last lunch at Burnham Park.', afternoon:'Free time — wherever the day takes you.', dinner:'Wherever looks good.', night:'Pack and reflect on the trip.'}
  ],
  adventure:[
    {morning:'Early ridge hike behind Sunrise Haven.', lunch:'Trail lunch, packed the night before.', afternoon:'Zipline and rope course at Camp John Hay.', dinner:'High-protein dinner near Session Road.', night:'Stretch and rest — tomorrow starts early too.'},
    {morning:'Sunrise trek toward Mines View Park.', lunch:'Quick refuel near the viewpoint.', afternoon:'Mountain biking trail loop.', dinner:'Big dinner, you earned it.', night:'Fire pit, sore legs, good stories.'},
    {morning:'Optional second hike, shorter loop.', lunch:'Farewell lunch at Wright Park.', afternoon:'Free time to recover before the drive.', dinner:'Casual dinner near the property.', night:'Pack gear, early sleep.'}
  ],
  food:[
    {morning:'Breakfast at Sunrise Haven, then a Session Road coffee crawl.', lunch:'Lunch stop at a long-running local carinderia.', afternoon:'Snack run through Burnham Park vendors.', dinner:'Reservation at a Session Road institution.', night:'Dessert walk before bed.'},
    {morning:'Local bakery run for pandesal and kapeng barako.', lunch:'Strawberry Farm for fresh produce and jam tasting.', afternoon:'Market browsing for pasalubong.', dinner:'Grilled dinner near Camp John Hay.', night:'Hot chocolate back at the property.'},
    {morning:'One more café before checkout.', lunch:'Last-day lunch, guest\'s choice.', afternoon:'Snack stock-up for the drive home.', dinner:'Light dinner en route.', night:'—'}
  ],
  nature:[
    {morning:'Walk through the Botanical Garden at opening time.', lunch:'Packed lunch among the pines.', afternoon:'Camp John Hay nature trails.', dinner:'Simple dinner near the property.', night:'Fire pit under a clear sky.'},
    {morning:'Sunrise from the ridge trail.', lunch:'Picnic at Wright Park.', afternoon:'Strawberry Farm and the surrounding fields.', dinner:'Farm-to-table dinner nearby.', night:'Stargazing, if the sky cooperates.'},
    {morning:'Slow garden walk at Sunrise Haven.', lunch:'Light lunch before departure.', afternoon:'One last look at the ridge view.', dinner:'—', night:'—'}
  ]
};

document.querySelectorAll('#days-row .pill').forEach(p=>p.addEventListener('click', ()=>{
  document.querySelectorAll('#days-row .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
}));
document.querySelectorAll('#style-row .pill').forEach(p=>p.addEventListener('click', ()=>{
  document.querySelectorAll('#style-row .pill').forEach(x=>x.classList.remove('active'));
  p.classList.add('active');
}));

document.getElementById('gen-btn').addEventListener('click', ()=>{
  const days = parseInt(document.querySelector('#days-row .pill.active').dataset.days);
  const style = document.querySelector('#style-row .pill.active').dataset.style;
  const plan = templates[style].slice(0, days);
  const result = document.getElementById('itin-result');
  result.innerHTML = plan.map((day, i)=>`
    <div class="day-block">
      <h4>Day ${i+1}</h4>
      ${['morning','lunch','afternoon','dinner','night'].map(slot=>
        day[slot] && day[slot]!=='—' ? `<div class="slot"><div class="label">${slot}</div><div class="text">${day[slot]}</div></div>` : ''
      ).join('')}
    </div>`).join('');
  result.scrollIntoView({behavior:'smooth', block:'nearest'});
});