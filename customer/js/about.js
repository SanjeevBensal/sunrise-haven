document.addEventListener('DOMContentLoaded', () => {
  // GSAP Animations for the Hero Section
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