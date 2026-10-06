const dogs = [...document.querySelectorAll('[data-dog]')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
let pointerX = 0, pointerY = 0, pointerInside = false;
let lastFrame = 0, activeTime = 0;
const states = dogs.map((dog, index) => ({dog, head: dog.querySelector('.dog-head'), eyes: [...dog.querySelectorAll('.iris')], phase: index * 2.4, smoothX: 0, smoothY: 0, nextBlink: 2.5 + index * 1.8, blinkEnd: 0}));
const clamp = value => Math.max(-1, Math.min(1, value));
window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch') return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  pointerInside = true;
}, {passive: true});
document.documentElement.addEventListener('pointerleave', () => {pointerInside = false;});
window.addEventListener('blur', () => {pointerInside = false;});
const toggle = document.querySelector('.motion-toggle');
function updateMotionButton(){toggle.setAttribute('aria-pressed', String(paused));toggle.setAttribute('aria-label', paused ? 'Resume dog animations' : 'Pause dog animations');toggle.querySelector('.motion-label').textContent = paused ? 'Wake the paws' : 'Pause the paws';toggle.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';}
toggle.addEventListener('click', () => {paused = !paused;updateMotionButton();});
reducedMotion.addEventListener('change', event => {paused = event.matches;updateMotionButton();});
updateMotionButton();
function animate(now){
  const delta = Math.min((now - lastFrame) / 1000 || 0, .05); lastFrame = now;
  if (!paused && !document.hidden) {
    activeTime += delta;
    const ease = 1 - Math.exp(-delta * 6);
    states.forEach(state => {
      const bounds = state.dog.getBoundingClientRect();
      // Each dog looks from its own face toward the cursor, including after scrolling.
      const x = pointerInside ? clamp((pointerX - (bounds.left + bounds.width * .55)) / (bounds.width * .8)) : Math.sin(activeTime * .32 + state.phase) * .3;
      const y = pointerInside ? clamp((pointerY - (bounds.top + bounds.height * .43)) / (bounds.height * .65)) : Math.sin(activeTime * .43 + state.phase) * .2;
      state.smoothX += (x - state.smoothX) * ease;
      state.smoothY += (y - state.smoothY) * ease;
      const {smoothX, smoothY} = state;
      const idle = Math.sin(activeTime * .7 + state.phase);
      // Preserve the reference artwork: modest rigid motion, no mesh warping or pose swaps.
      state.head.style.transform = `translate(${smoothX * 4}px, ${idle * .7 + smoothY * 3}px) rotate(${smoothX * 1.8 + idle * .35}deg)`;
      state.eyes.forEach(eye => {eye.style.transform = `translate(${smoothX * 2.5}px, ${smoothY * 1.8}px)`;});
      if (activeTime > state.nextBlink){state.dog.classList.add('blink');state.blinkEnd = activeTime + .22;state.nextBlink = activeTime + 3.5 + Math.random() * 4;}
      if (state.blinkEnd && activeTime > state.blinkEnd){state.dog.classList.remove('blink');state.blinkEnd = 0;}
    });
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu(returnFocus = false) {
  mobileMenu.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  if (returnFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
mobileMenu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => {
  if (!mobileMenu.hidden && !event.target.closest('.navigation')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMenu.hidden) closeMenu(true);
});
window.matchMedia('(max-width:760px)').addEventListener('change', () => closeMenu());



// Duplicate testimonial cards so the vertical marquee loops without a visible reset.
document.querySelectorAll('.testimonial-track').forEach(track => {
  [...track.children].forEach(card => {
    const copy = card.cloneNode(true);
    copy.classList.add('testimonial-copy');
    copy.setAttribute('aria-hidden', 'true');
    track.append(copy);
  });
});
