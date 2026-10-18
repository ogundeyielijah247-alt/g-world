import { icon } from "./icons.js";
export const AUTOPLAY_MS = 5000;

const slides = [
  { background: '/assets/hero/library-background.webp', image: '/assets/hero/learning-library.webp', imageAlt: 'Students studying together in a university library', tag: 'YOUR NEXT CHAPTER STARTS HERE', title: 'Discover what you need to know.', text: 'From academic foundations to practical digital skills, find a clearer path to the knowledge that matters to you.', action: 'courses', cta: 'Explore courses', label: 'Learn with purpose', detail: 'Understand. Practise. Apply.', items: ['Academic foundations', 'Practical learning', 'Your own pace'] },
  { background: '/assets/hero/lab-background.webp', image: '/assets/hero/digital-classroom.webp', imageAlt: 'Students collaborating around a laptop in a digital classroom', tag: 'TURN CURIOSITY INTO CAPABILITY', title: 'Small steps. Real-world skills.', text: 'Start with Python, explore digital tools, and build the confidence to turn new ideas into practical projects.', action: 'tech-skills', cta: 'Discover tech skills', label: 'Build something meaningful', detail: 'Learn. Experiment. Create.', items: ['Python foundations', 'Digital confidence', 'Project-based thinking'] },
  { background: '/assets/hero/campus-background.webp', image: '/assets/hero/exam-preparation.webp', imageAlt: 'A learner preparing for an exam with a textbook and notes', tag: 'PREPARE FOR WHAT COMES NEXT', title: 'Your future deserves a head start.', text: 'Plan your JAMB preparation, explore academic resources, and develop the professional habits that help you move forward.', action: 'jamb', cta: 'Explore JAMB', label: 'Move forward with confidence', detail: 'Prepare. Focus. Grow.', items: ['Study guidance', 'CBT practice areas', 'Workplace readiness'] },
];

export function wrapIndex(index, count) {
  return count ? ((index % count) + count) % count : 0;
}

// Local learning-area content: this hero never needs the article API.
export function homeSlider() {
  return `<section class="home-slider" aria-roledescription="carousel" aria-label="Explore G WORLD">
    <div class="slide-stage">${slides.map((slide, i) => `<div class="home-slide ${i === 0 ? 'is-active' : ''}" data-slide="${i}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}" aria-hidden="${i !== 0}" ${i ? 'inert' : ''}>
      <img class="slide-background" src="${slide.background}" alt="" loading="${i ? 'lazy' : 'eager'}" fetchpriority="${i ? 'low' : 'high'}" decoding="async" width="1408" height="768">
      <div class="slide-background-gradient" aria-hidden="true"></div>
      <div class="hero-decoration hero-decoration-dots" aria-hidden="true"></div><div class="hero-decoration hero-decoration-ring" aria-hidden="true"></div><span class="hero-decoration hero-decoration-star" aria-hidden="true">✧</span>
      <div class="slide-copy"><div class="eyebrow">${slide.tag}</div><h2>${slide.title}</h2><p>${slide.text}</p><div class="hero-actions"><button class="primary" type="button" data-a="${slide.action}">${slide.cta} ${icon("arrow")}</button><button class="hero-secondary" type="button" data-a="support">Get guidance ${icon("chat")}</button></div><div class="slide-note">Useful knowledge. Clear learning. Practical growth.</div></div>
      <div class="slide-art"><div class="hero-shape hero-shape-purple" aria-hidden="true"></div><div class="hero-shape hero-shape-pink" aria-hidden="true"></div><div class="hero-shape hero-shape-white" aria-hidden="true"></div><div class="hero-shape hero-shape-yellow" aria-hidden="true"></div><div class="hero-person-window"><img class="slide-photo" src="${slide.image}" alt="${slide.imageAlt}" loading="${i ? 'lazy' : 'eager'}" fetchpriority="${i ? 'low' : 'high'}" decoding="async" width="1408" height="768"></div><div class="hero-learning-badge">${icon("cap")}<span><strong>${slide.label}</strong><small>${slide.detail}</small></span></div><span class="hero-art-plus" aria-hidden="true">+</span></div>
    </div>`).join('')}</div>
    <div class="hero-pathways" aria-label="Ways to learn"><span>${icon("book")} Academic foundations</span><span>${icon("code")} Practical digital skills</span><span>${icon("cap")} Exam preparation</span><span>${icon("compass")} Your next chapter</span></div>
    <div class="slider-bottom"><span class="slider-caption">A WORLD OF POSSIBILITIES</span><div class="slider-controls"><button type="button" class="slider-arrow" data-slider="prev" aria-label="Previous slide">←</button><div class="slider-dots">${slides.map((_, i) => `<button type="button" data-slider="to" data-index="${i}" aria-label="Go to slide ${i + 1}" aria-current="${i === 0}"></button>`).join('')}</div><button type="button" class="slider-arrow" data-slider="next" aria-label="Next slide">→</button><button type="button" class="slider-arrow" data-slider="pause" aria-label="Pause slideshow">Ⅱ</button></div></div>
  </section>`;
}

export function mountHero(shell) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const panels = [...shell.querySelectorAll('[data-slide]')];
  const dots = [...shell.querySelectorAll('[data-slider="to"]')];
  // Warm the distinct foreground and background photos before their first loop.
  const images = [...shell.querySelectorAll('.slide-photo, .slide-background')];
  images.forEach(image => {
    image.addEventListener('error', () => { image.hidden = true; }, { once: true });
    const preload = new Image();
    preload.fetchPriority = 'low';
    preload.src = image.src;
  });
  let current = 0, paused = false, timer;
  function showSlide(index) {
    current = wrapIndex(index, panels.length);
    panels.forEach((panel, i) => {
      const active = current === i;
      panel.classList.toggle('is-active', active);
      panel.setAttribute('aria-hidden', String(!active));
      panel.inert = !active;
      dots[i].setAttribute('aria-current', String(active));
    });
  }
  function restartTimer() {
    clearInterval(timer);
    if (paused || motion.matches || document.hidden || !panels.length) return;
    timer = setInterval(() => {
      if (!shell.contains(document.activeElement)) showSlide(current + 1);
    }, AUTOPLAY_MS);
  }
  function handleClick(event) {
    const button = event.target.closest('[data-slider]');
    if (!button) return;
    if (button.dataset.slider === 'pause') {
      paused = !paused;
      button.textContent = paused ? '▷' : 'Ⅱ';
      button.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    } else {
      showSlide(button.dataset.slider === 'to' ? Number(button.dataset.index) : current + (button.dataset.slider === 'next' ? 1 : -1));
    }
    restartTimer();
  }
  shell.addEventListener('click', handleClick);
  motion.addEventListener('change', restartTimer);
  document.addEventListener('visibilitychange', restartTimer);
  restartTimer();
  return { destroy() {
    clearInterval(timer);
    shell.removeEventListener('click', handleClick);
    motion.removeEventListener('change', restartTimer);
    document.removeEventListener('visibilitychange', restartTimer);
  } };
}
