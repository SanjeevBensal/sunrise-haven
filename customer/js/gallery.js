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

// ... Keep your existing `const photos = [...]` array and logic below this ...
const photos = [
  {cat:'Sunrise', h:320, cap:'First light over the ridge', grad:'linear-gradient(160deg,#FFD54A,#0A4D8C)'},
  {cat:'Rooms', h:260, cap:'The Firstlight Room', grad:'linear-gradient(160deg,#3E6B8F,#0F2A3F)'},
  {cat:'Exterior', h:380, cap:'Main entrance, morning', grad:'linear-gradient(160deg,#4A7A63,#122A21)'},
  {cat:'Views', h:230, cap:'Looking east from the terrace', grad:'linear-gradient(160deg,#6BA3C9,#1C3852)'},
  {cat:'Kitchen', h:300, cap:'Shared kitchen and grill', grad:'linear-gradient(160deg,#8C6A3E,#2A1E10)'},
  {cat:'Rooms', h:340, cap:'The Understory Suite', grad:'linear-gradient(160deg,#4A7A63,#122A21)'},
  {cat:'Night view', h:280, cap:'The valley after dark', grad:'linear-gradient(160deg,#1C1130,#050308)'},
  {cat:'Bathroom', h:250, cap:'Rain shower, Amber Loft', grad:'linear-gradient(160deg,#B9C6CE,#5A5A7A)'},
  {cat:'Amenities', h:220, cap:'Garden fire pit', grad:'linear-gradient(160deg,#8C6A3E,#3A2A12)'},
  {cat:'Views', h:360, cap:'Mist rolling through the pines', grad:'linear-gradient(160deg,#5A5A7A,#151526)'},
  {cat:'Rooms', h:270, cap:'The Summit Room', grad:'linear-gradient(160deg,#2E5C8C,#0A1E33)'},
  {cat:'Exterior', h:230, cap:'Garden path at dusk', grad:'linear-gradient(160deg,#16342A,#0D231C)'},
  {cat:'Sunrise', h:290, cap:'Sun breaking through the fog', grad:'linear-gradient(160deg,#FFE9AE,#3E6B8F)'},
  {cat:'Kitchen', h:240, cap:'Morning coffee station', grad:'linear-gradient(160deg,#6B4E8F,#1C1130)'},
  {cat:'Rooms', h:310, cap:'The Amber Loft', grad:'linear-gradient(160deg,#8C6A3E,#2A1E10)'},
  {cat:'Night view', h:340, cap:'Stars over the ridge', grad:'linear-gradient(160deg,#0A1E33,#02060C)'},
  {cat:'Bathroom', h:220, cap:'Ensuite, Firstlight Room', grad:'linear-gradient(160deg,#9FB4BE,#4A6B7A)'},
  {cat:'Views', h:250, cap:'The valley from the balcony', grad:'linear-gradient(160deg,#3F7A55,#0F2418)'},
  {cat:'Amenities', h:260, cap:'Reading nook by the window', grad:'linear-gradient(160deg,#5A5A7A,#1C1130)'},
  {cat:'Exterior', h:300, cap:'The property at blue hour', grad:'linear-gradient(160deg,#062E56,#020C18)'},
  {cat:'Rooms', h:250, cap:'The Fogline Room', grad:'linear-gradient(160deg,#5A5A7A,#151526)'},
  {cat:'Sunrise', h:340, cap:'The daily ritual, from the garden', grad:'linear-gradient(160deg,#FFD54A,#8C6A3E)'},
  {cat:'Kitchen', h:270, cap:'Long table, family style', grad:'linear-gradient(160deg,#3F7A55,#122A21)'},
  {cat:'Views', h:230, cap:'Clouds below the ridge line', grad:'linear-gradient(160deg,#B9C6CE,#3E6B8F)'}
];

const masonry = document.getElementById('masonry');
function render(){
  masonry.innerHTML = photos.map((p,i)=>`
    <div class="gitem" data-cat="${p.cat}" data-idx="${i}">
      <div class="fill" style="height:${p.h}px;background:${p.grad};"></div>
      <div class="cap">${p.cap}</div>
    </div>`).join('');
  masonry.querySelectorAll('.gitem').forEach(el=>{
    el.addEventListener('click', ()=> openLightbox(parseInt(el.dataset.idx)));
  });
}
render();

document.querySelectorAll('.fchip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    document.querySelectorAll('.fchip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    document.querySelectorAll('.gitem').forEach(item=>{
      item.classList.toggle('hidden', cat!=='all' && item.dataset.cat!==cat);
    });
  });
});

/* LIGHTBOX */
let currentIdx = 0;
const lightbox = document.getElementById('lightbox');
const lbMedia = document.getElementById('lb-media');

function openLightbox(idx){
  currentIdx = idx;
  updateLightbox();
  lightbox.classList.add('open');
  document.body.style.overflow='hidden';
}
function updateLightbox(){
  const p = photos[currentIdx];
  lbMedia.style.background = p.grad;
  lbMedia.style.borderRadius='16px';
  document.getElementById('lb-cap').textContent = p.cap + ' — ' + p.cat;
  document.getElementById('lb-count').textContent = (currentIdx+1) + ' / ' + photos.length;
}
document.getElementById('lb-close').addEventListener('click', ()=>{
  lightbox.classList.remove('open');
  document.body.style.overflow='';
});
document.getElementById('lb-prev').addEventListener('click', e=>{
  e.stopPropagation();
  currentIdx = (currentIdx - 1 + photos.length) % photos.length;
  updateLightbox();
});
document.getElementById('lb-next').addEventListener('click', e=>{
  e.stopPropagation();
  currentIdx = (currentIdx + 1) % photos.length;
  updateLightbox();
});
lightbox.addEventListener('click', e=>{
  if(e.target===lightbox){ lightbox.classList.remove('open'); document.body.style.overflow=''; }
});
document.addEventListener('keydown', e=>{
  if(!lightbox.classList.contains('open')) return;
  if(e.key==='Escape'){ lightbox.classList.remove('open'); document.body.style.overflow=''; }
  if(e.key==='ArrowLeft'){ currentIdx=(currentIdx-1+photos.length)%photos.length; updateLightbox(); }
  if(e.key==='ArrowRight'){ currentIdx=(currentIdx+1)%photos.length; updateLightbox(); }
});
