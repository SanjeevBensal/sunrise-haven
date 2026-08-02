document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // BACKGROUND ANIMATIONS (Sun & Mountains)
  // ==========================================
  const sun = document.getElementById('sun');
  const rays = document.getElementById('rays');
  const mtnNear = document.getElementById('mtn-near');
  const mtnMid = document.getElementById('mtn-mid');

  if (sun && rays) {
    gsap.to(rays, {
      rotation: 360,
      duration: 50,
      repeat: -1,
      ease: "none"
    });

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

// ==========================================
// REAL CLOUDINARY GALLERY PHOTOS
// ==========================================
const photos = [
  // ROOMS
  {cat:'Rooms', h:400, cap:'The Firstlight Room', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785655472/download_13_techho.jpg'},
  {cat:'Rooms', h:280, cap:'Room Interior View', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785655434/download_10_frzsqh.jpg'},
  {cat:'Rooms', h:350, cap:'The Understory Suite', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785655434/download_9_thwfik.jpg'},
  {cat:'Rooms', h:300, cap:'Cozy Bed Setup', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785655434/download_12_viri94.jpg'},
  {cat:'Rooms', h:420, cap:'The Amber Loft', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785655434/download_11_buyla1.jpg'},

  // KITCHEN
  {cat:'Kitchen', h:320, cap:'Shared kitchen and grill', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785654304/gngto1rz2k8ixff7hhrw.jpg'},
  {cat:'Kitchen', h:450, cap:'Morning coffee station', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785652590/unyopnpr5oo5lhijpkfs.jpg'},
  {cat:'Kitchen', h:450, cap:'Long table, family style', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785652489/eav68unfjlkdmdl8u66g.jpg'},

  // VIEWS
  {cat:'Views', h:280, cap:'Cozy Cloudy Day Balcony Vibes', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656144/Cozy_Cloudy_Day_Balcony_Vibes_%EF%B8%8F_pvne5k.jpg'},
  {cat:'Views', h:280, cap:'Sunset Serenity Balcony', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656144/Sunset_Serenity_Balcony_xkgckf.jpg'},
  {cat:'Views', h:280, cap:'Beautiful view from ridge', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656144/Beautiful_view_%EF%B8%8F_mvbxp9.jpg'},
  {cat:'Views', h:280, cap:'Looking east from the terrace', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656143/download_14_qscebc.jpg'},

  // NIGHT VIEW
  {cat:'Night view', h:280, cap:'The valley after dark', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656232/download_15_rx06ij.jpg'},
  {cat:'Night view', h:280, cap:'Stars over the ridge', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656232/download_16_ypuear.jpg'},

  // BATHROOM
  {cat:'Bathroom', h:280, cap:'Rain shower, Amber Loft', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656441/download_17_dhrl5w.jpg'},
  {cat:'Bathroom', h:280, cap:'Ensuite, Firstlight Room', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656441/download_18_gswswy.jpg'},

  // EXTERIOR
  {cat:'Exterior', h:280, cap:'Main entrance, morning', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656511/download_19_cihigq.jpg'},
  {cat:'Exterior', h:280, cap:'Campfire and grounds', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656510/campfire_yqcf0n.jpg'},

  // SUNRISE
  {cat:'Sunrise', h:280, cap:'First light over the ridge', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656607/download_20_tmyk4e.jpg'},
  {cat:'Sunrise', h:280, cap:'Sun breaking through the fog', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656606/sunrise_juspyt.jpg'},
  {cat:'Sunrise', h:280, cap:'The daily ritual, from the garden', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656674/download_21_pnvytz.jpg'},

  // AMENITIES
  {cat:'Amenities', h:280, cap:'Garden fire pit & seating', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656749/download_22_rrig0t.jpg'},
  {cat:'Amenities', h:280, cap:'Luxury Indoor Spa Retreat', img:'https://res.cloudinary.com/khlyszri/image/upload/v1785656749/Luxury_Indoor_Spa_Retreat_with_Round_Jacuzzi_and_Stone_Accent_Wall_y0tgz9.jpg'}
];

const masonry = document.getElementById('masonry');

function render(){
  masonry.innerHTML = photos.map((p, i) => `
    <div class="gitem" data-cat="${p.cat}" data-idx="${i}">
      <div class="fill" style="height:${p.h}px; background-image: url('${p.img}'); background-size: cover; background-position: center; border-radius: 12px;"></div>
      <div class="cap">${p.cap}</div>
    </div>`).join('');
    
  masonry.querySelectorAll('.gitem').forEach(el => {
    el.addEventListener('click', () => openLightbox(parseInt(el.dataset.idx)));
  });
}
render();

// Category Filter Logic
document.querySelectorAll('.fchip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.fchip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const cat = chip.dataset.cat;
    document.querySelectorAll('.gitem').forEach(item => {
      item.classList.toggle('hidden', cat !== 'all' && item.dataset.cat !== cat);
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
  document.body.style.overflow = 'hidden';
}

function updateLightbox(){
  const p = photos[currentIdx];
  lbMedia.style.backgroundImage = `url('${p.img}')`;
  lbMedia.style.backgroundSize = 'cover';
  lbMedia.style.backgroundPosition = 'center';
  lbMedia.style.borderRadius = '16px';
  document.getElementById('lb-cap').textContent = p.cap + ' — ' + p.cat;
  document.getElementById('lb-count').textContent = (currentIdx + 1) + ' / ' + photos.length;
}

document.getElementById('lb-close').addEventListener('click', () => {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
});
document.getElementById('lb-prev').addEventListener('click', e => {
  e.stopPropagation();
  currentIdx = (currentIdx - 1 + photos.length) % photos.length;
  updateLightbox();
});
document.getElementById('lb-next').addEventListener('click', e => {
  e.stopPropagation();
  currentIdx = (currentIdx + 1) % photos.length;
  updateLightbox();
});
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) { 
    lightbox.classList.remove('open'); 
    document.body.style.overflow = ''; 
  }
});
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') { lightbox.classList.remove('open'); document.body.style.overflow = ''; }
  if (e.key === 'ArrowLeft') { currentIdx = (currentIdx - 1 + photos.length) % photos.length; updateLightbox(); }
  if (e.key === 'ArrowRight') { currentIdx = (currentIdx + 1) % photos.length; updateLightbox(); }
});