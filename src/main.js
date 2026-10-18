import { cachedToken, validMember } from "./session.js";
import { enhanceSubpage, pageIllustration } from "./page-design.js";
import { FACULTIES, EXTRA_COURSES, facultyForScreen } from "./catalogue.js";
import { subjectSection, facultySection, facultyCards, learningInvitation, accessSection, approachSection, resourceSection, homeFooter } from "./home-sections.js";
import "./style.css";
import QRCode from "qrcode";
import { mountHero, homeSlider } from "./hero.js";
import { icon, sectionIcon } from "./icons.js";
import { formatTotal, PLACEHOLDER_METRICS } from "./metrics.js";

const app = document.querySelector("#app");

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const VERIFY_BASE = (import.meta.env.VITE_VERIFY_BASE_URL || API_BASE).replace(/\/$/, "");

const state = {
  screen: "splash",
  history: [],
  member: null,
  token: "",
  error: "",
  loading: false,
  data: null,
  supportMessages: [],
  adminPayments: [],
  settings: null,
  metrics: PLACEHOLDER_METRICS,
  selectedPayment: null,
  selectedCourse: null,
  admin: null
};

const PAYMENT = {
  amount: 3000,
  provider: "OPay",
  accountNumber: "8051598490",
  accountName: "Ogundeji Elijah Olusola"
};

const esc = value =>
  String(value ?? "").replace(/[&<>\"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

const naira = value =>
  `₦${Number(value || 0).toLocaleString("en-NG")}`;

function goTo(screen, data = {}) {
  if (state.screen === screen) return;

  const protectedScreens = ["splash", "entry", "card"];

  if (!protectedScreens.includes(state.screen)) {
    state.history.push(state.screen);
  }

  Object.assign(state, data);
  state.screen = screen;
  render();
}

function goBack() {
  if (!state.history.length) {
    state.screen = "home";
    render();
    return;
  }

  state.screen = state.history.pop();
  render();
}

/** Lightweight toast — replaces blocking alert() calls. */
function showToast(message, ms = 3200) {
  let toast = document.querySelector("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, ms);
}

function clearError() {
  state.error = "";
}

/** Toggle submit-button busy state without a full re-render (keeps typed input). */
function setFormBusy(form, busy, busyLabel = "PLEASE WAIT…") {
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  if (busy) {
    button.dataset.label = button.dataset.label || button.textContent;
    button.textContent = busyLabel;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}

/** Show an API-level error inside the form without destroying the user's input. */
function setFormError(form, message) {
  const slot = form.querySelector(".form-error");
  if (slot) slot.textContent = message || "";
}

function saveSession(member, token) {
  const minimal = {
    name: member?.name || "",
    gworldId: member?.gworldId || "",
    status: member?.status || "",
    token: token || ""
  };
  state.member = { ...member };
  state.token = token || "";
  localStorage.removeItem("gworld-logout-pending");
  localStorage.setItem("gworld", JSON.stringify(minimal));
}

async function loadAdminPayments() {
  try {
    const result = await api("/api/admin/payments");
    state.adminPayments = result.payments || [];
  } catch (error) {
    state.adminPayments = [];
    state.error = error.message;
  }
}

/** Payment details: admin settings fall back to built-in PAYMENT defaults. */
function paymentInfo() {
  return {
    amount: state.settings?.amount ?? PAYMENT.amount,
    provider: state.settings?.provider || PAYMENT.provider,
    accountNumber: state.settings?.accountNumber || PAYMENT.accountNumber,
    accountName: state.settings?.accountName || PAYMENT.accountName
  };
}

async function loadSettings() {
  try {
    const result = await api("/api/settings");
    state.settings = result.payment || null;
    const pay = paymentInfo();
    app.querySelectorAll('[data-payment-price]').forEach(price => { price.textContent = naira(pay.amount); });
    for (const key of ['provider', 'accountName', 'accountNumber']) {
      app.querySelectorAll(`[data-payment-detail="${key}"]`).forEach(node => { node.textContent = pay[key]; });
    }
    app.querySelectorAll('[data-payment-copy]').forEach(button => { button.dataset.copy = pay.accountNumber; });
    const homePrice = app.querySelector('[data-home-price]');
    if (homePrice) homePrice.innerHTML = `${naira(paymentInfo().amount)}<small>one-time payment, approval required</small>`;
  } catch {
    /* offline / unavailable — paymentInfo() falls back to defaults */
  }
}

function clearSession() {
  // Preserve logout intent if an offline API cannot clear its HttpOnly cookie.
  localStorage.setItem("gworld-logout-pending", "1");
  api("/api/auth/logout", { method: "POST" })
    .then(() => localStorage.removeItem("gworld-logout-pending"))
    .catch(() => {});
  localStorage.removeItem("gworld");
  state.member = null;
  state.token = "";
  state.admin = null;
  state.error = "";
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const requestToken = state.token;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    signal: AbortSignal.timeout(12000),
    ...options,
    headers
    });
  } catch {
    throw new Error("Cannot reach the G WORLD service. Check your connection and try again.");
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("The G WORLD service is unavailable or incorrectly configured. Please try again later.");
  }
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("The G WORLD service returned an invalid response. Please try again later.");
  }

  if (response.status === 401 && requestToken && state.token === requestToken) {
    // Session expired or was revoked server-side.
    state.token = "";
    state.member = null;
    localStorage.removeItem("gworld");
    state.history = [];
    state.screen = "entry";
    render();
    const error = new Error(result.error || "Your session has ended. Please sign in again.");
    error.status = 401;
    throw error;
  }

  if (!response.ok || result.ok === false) {
    const error = new Error(result.error || "G WORLD request failed.");
    error.status = response.status;
    throw error;
  }

  return result;
}

async function generateMemberQR() {
  const canvas = document.querySelector("#member-qr");
  const member = state.member;

  if (!canvas || !member?.gworldId) return;

  const base = VERIFY_BASE || window.location.origin;
  const verificationURL =
    `${base}/verify/${encodeURIComponent(member.gworldId)}`;

  try {
    await QRCode.toCanvas(canvas, verificationURL, {
      width: 150,
      margin: 2,
      errorCorrectionLevel: "M"
    });
  } catch (error) {
    console.error("QR generation failed:", error);
  }
}

function certificateHTML(course, member) {
  return `
    <div class="certificate-preview">
      <div class="certificate-border">
        <div class="certificate-inner">

          <div class="certificate-brand">
            <div class="certificate-g-mark">${brandIcon()}</div>
            <div>
              <strong>G WORLD</strong>
              <small>Discover What You Need to Know.</small>
            </div>
          </div>

          <div class="certificate-kicker">
            CERTIFICATE OF COMPLETION
          </div>

          <h1>Certificate of Achievement</h1>

          <p class="certificate-intro">
            This certificate is proudly presented to
          </p>

          <h2>${esc(member?.name || "Learner Name")}</h2>

          <div class="certificate-rule"></div>

          <p class="certificate-body">
            for successfully completing the G WORLD learning programme
          </p>

          <h3>${esc(course?.title || "G WORLD Course")}</h3>

          <div class="certificate-meta">
            <div>
              <small>G WORLD ID</small>
              <strong>${esc(member?.gworldId || "GW-XX-XXXXXX")}</strong>
            </div>

            <div>
              <small>CERTIFICATE ID</small>
              <strong>GW-CERT-${esc(member?.gworldId || "XXXX")}</strong>
            </div>

            <div>
              <small>DATE</small>
              <strong>${new Date().toLocaleDateString("en-NG")}</strong>
            </div>
          </div>

          <div class="certificate-footer">
            <div class="certificate-sign">
              <span></span>
              <small>G WORLD AUTHORIZED SIGNATURE</small>
            </div>

            <div class="certificate-seal">
              ${brandIcon()}
              <span>G WORLD</span>
              <small>VERIFIED</small>
            </div>

            <div class="certificate-sign">
              <span></span>
              <small>PROGRAMME DIRECTOR</small>
            </div>
          </div>

          <div class="certificate-verify">
            Scan the verification QR on the issued certificate to verify this achievement.
          </div>

        </div>
      </div>
    </div>
  `;
}

function brandIcon() {
  return '<img class="brand-icon" src="/assets/gworld-icon.png" alt="" width="48" height="48">';
}

function themeButton() {
  return `<button class="logout-btn theme-toggle" data-a="theme" aria-label="Switch colour theme" title="Switch colour theme"><svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 15.5A9 9 0 0 1 8.5 4a9 9 0 1 0 11.5 11.5Z"/></svg></button>`;
}

let heroInstance;
let renderedScreen;
const pageTitle = document.querySelector('#page-title');
function navigationHeader(admin = false) {
  const links = admin
    ? [['admin', 'Dashboard'], ['admin-payments', 'Payments'], ['admin-members', 'Members'], ['admin-support', 'Support'], ['admin-settings', 'Settings']]
    : [['home', 'Home'], ['courses', 'Faculties'], ['tech-skills', 'Tech Skills'], ['jamb', 'JAMB'], ['academic', 'Resources'], ['support', 'Support']];
  let active = state.screen;
  if (active.startsWith('course-') || active.startsWith('faculty-')) active = 'courses';
  if (active.startsWith('python-') || active === 'excel-course' || active === 'ai-tech') active = 'tech-skills';
  if (active.startsWith('jamb-') || active === 'combination-result') active = 'jamb';
  if (['opportunities', 'research', 'project-writer'].includes(active)) active = 'academic';
  return `<header class="site-header">
    <nav class="site-nav" aria-label="${admin ? 'Administration' : 'Main navigation'}">
      <button class="mini brand-home" type="button" data-a="${admin ? 'admin' : 'home'}" aria-label="${admin ? 'G WORLD admin dashboard' : 'G WORLD home'}">${brandIcon()}<span>G WORLD${admin ? '<small>ADMINISTRATION</small>' : ''}</span></button>
      <div class="site-nav-links" id="site-nav-menu">${links.map(([action, label]) => `<button type="button" class="site-nav-link" data-a="${action}" ${active === action ? 'aria-current="page"' : ''}>${label}</button>`).join('')}</div>
      <div class="site-nav-actions">
        <span class="site-nav-member" title="${esc(state.member?.name || '')}">${esc(admin ? 'Administrator' : state.member?.name || '')}</span>
        ${themeButton()}
        <button type="button" class="nav-signout" data-a="${admin ? 'admin-logout' : 'logout'}" aria-label="LOG OUT"><span>Log out</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M9 4H4v16h5m5-14 6 6-6 6M8 12h12"/></svg></button>
        <button type="button" class="nav-menu-toggle" data-a="nav-menu" aria-label="Open navigation menu" aria-controls="site-nav-menu" aria-expanded="false"><span></span><span></span><span></span></button>
      </div>
    </nav>
  </header>`;
}

function commonNav(back = true) {
  return `${navigationHeader()}${back && state.history.length ? '<button class="link page-back" data-a="back">← Back</button>' : ''}`;
}

function closeNavigation(returnFocus = false) {
  const header = app.querySelector('.site-header');
  const toggle = header?.querySelector('.nav-menu-toggle');
  if (!toggle) return;
  header.classList.remove('menu-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation menu');
  if (returnFocus) toggle.focus();
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && app.querySelector('.site-header.menu-open')) closeNavigation(true);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeNavigation();
});

function supportButton() {
  return `
    <section class="support-strip">
      <div>
        <div class="eyebrow">NEED HELP?</div>
        <strong>Having a challenge?</strong>
        <p>Reach out to the G WORLD Team.</p>
      </div>

      <button class="secondary" data-a="support">
        CONTACT G WORLD TEAM
      </button>
    </section>
  `;
}

function render() {
  const html = screenHTML();
  if (html !== null) {
    const screenChanged = renderedScreen !== state.screen;
    renderedScreen = state.screen;
    heroInstance?.destroy();
    pageTitle?.remove();
    app.innerHTML = html;
    if (state.screen === 'home') {
      app.querySelector('main').prepend(pageTitle);
      heroInstance = mountHero(app.querySelector('.home-slider'));
    }
    app.querySelectorAll('article[data-a], article[data-course-combination]').forEach(card => {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
    });
    decorateLearningPages();
    if (screenChanged) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (!['splash', 'entry', 'onboard', 'existing', 'card'].includes(state.screen)) {
        const main = app.querySelector('main');
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    }
    // Post-render side effects (original code ran these after innerHTML).
    if (state.screen === "card") generateMemberQR();
  }
}

/** Shared visual enhancement only; account, learning and payment workflows stay intact. */
function decorateLearningPages() {
  const main = app.querySelector('main');
  if (!main) return;
  main.id = 'main-content';
  if (state.screen === 'splash') return;
  main.dataset.screen = state.screen;
  app.querySelectorAll('.form-error, .field-error').forEach((slot, i) => {
    slot.setAttribute('aria-live', 'polite');
    slot.id = `form-feedback-${i}`;
    const field = slot.closest('label')?.querySelector('input, select, textarea');
    if (field) field.setAttribute('aria-describedby', slot.id);
  });
  app.querySelectorAll('.grid article').forEach(card => {
    const title = card.querySelector('h3')?.textContent || '';
    const mark = document.createElement('div');
    mark.className = 'resource-icon';
    mark.innerHTML = icon(sectionIcon(`${state.screen} ${card.dataset.a || ''} ${title}`.toLowerCase()));
    card.prepend(mark);
    if (card.matches('[data-a], [data-course-combination]')) {
      const affordance = document.createElement('span');
      affordance.className = 'resource-link';
      affordance.setAttribute('aria-hidden', 'true');
      const label = card.dataset.a?.startsWith('python-answer') ? 'Choose answer' : card.dataset.a?.startsWith('cbt-start') ? 'Start practice' : 'Explore';
      affordance.innerHTML = `${label} ${icon('arrow')}`;
      card.append(affordance);
    }
  });
  const hero = main.querySelector(':scope > .hero');
  if (hero) {
    const mark = document.createElement('div');
    mark.className = 'page-icon';
    mark.innerHTML = icon(sectionIcon(state.screen));
    hero.prepend(mark);
  }
  enhanceSubpage(main, state.screen);
  if (state.screen === 'admin-gate') main.querySelector('.form-brand')?.insertAdjacentHTML('afterend', `<div class="security-hero-art">${pageIllustration('admin-gate')}</div>`);
  const entry = main.matches('.enter-screen') && state.screen !== 'admin-gate';
  if (entry) {
    main.classList.add('has-welcome');
    const aside = document.createElement('aside');
    aside.className = 'welcome-aside';
    aside.innerHTML = `<div class="eyebrow">YOUR WORLD OF LEARNING</div><h2>A little curiosity.<br>A world of possibility.</h2><p>Build your knowledge, develop practical skills and take your next step with G WORLD.</p><ul><li>${icon('book')} Clear learning pathways</li><li>${icon('code')} Practical digital skills</li><li>${icon('cap')} Academic and career guidance</li></ul><div class="welcome-aside-note">Discover What You Need to Know.</div>`;
    const accountCopy = {
      entry: ['A little curiosity.<br>A world of possibility.', 'Choose how you would like to enter and discover your next learning pathway.'],
      onboard: ['Your next chapter<br>starts here.', 'Create your G WORLD account and make room for the skills and knowledge you want to build.'],
      existing: ['Back to your<br>learning journey.', 'Sign in to reconnect with your roadmaps, learning areas and G WORLD account.']
    }[state.screen];
    if (accountCopy) {
      aside.querySelector('h2').innerHTML = accountCopy[0];
      aside.querySelector('p').textContent = accountCopy[1];
      aside.querySelector('ul').outerHTML = `<div class="account-hero-art">${pageIllustration(state.screen)}</div>`;
    }
    main.prepend(aside);
  }
  app.querySelectorAll('.support-strip').forEach(strip => {
    const mark = document.createElement('div');
    mark.className = 'support-icon';
    mark.innerHTML = icon('chat');
    strip.prepend(mark);
  });
}

function screenHTML() {
  if (state.screen === "splash") return renderSplash();
  if (state.screen === "entry") return renderEntry();
  if (state.screen === "onboard") return renderOnboard();
  if (state.screen === "existing") return renderExisting();
  if (state.screen === "card") return renderCard();
  if (state.screen === "home") return renderHome();
  if (state.screen === "courses") return renderCourses();
  if (state.screen.startsWith("faculty-")) return renderFaculty();
  if (state.screen.startsWith("course-")) return renderCoursePage();
  if (state.screen === "tech-skills") return renderTechSkills();
  if (state.screen === "excel-course") return renderExcelCourse();
  if (state.screen === "python-course") return renderPythonCourse();
  if (state.screen === "python-intro") return renderPythonIntro();
  if (state.screen === "python-practice") return renderPythonPractice();
  if (state.screen === "ai-tech") return renderAiTech();
  if (state.screen === "jamb") return renderJamb();
  if (state.screen === "jamb-information" ||
    state.screen === "jamb-news") return renderJambInfoNews();
  if (state.screen === "jamb-syllabus") return renderJambSyllabus();
  if (state.screen === "jamb-cbt") return renderJambCbt();
  if (state.screen === "jamb-cbt-science" ||
    state.screen === "jamb-cbt-commercial" ||
    state.screen === "jamb-cbt-arts" ||
    state.screen === "jamb-cbt-general") return renderJambCbtPractice();
  if (state.screen === "jamb-combinations") return renderJambCombinations();
  if (state.screen === "combination-result") return renderCombinationResult();
  if (state.screen === "work-ready") return renderWorkReady();
  if (state.screen === "work-course") return renderWorkCourse();
  if (state.screen === "payment") return renderPayment();
  if (state.screen === "payment-status") return renderPaymentStatus();
  if (state.screen === "payment-rejected") return renderPaymentRejected();
  if (state.screen === "support") return renderSupport();
  if (state.screen === "certificate") return renderCertificate();
  if (state.screen === "project-writer") return renderProjectWriter();
  if (state.screen === "opportunities" ||
    state.screen === "research" ||
    state.screen === "academic") return renderInfoHub();
  if (state.screen === "admin-gate") return renderAdminGate();
  if (state.screen === "admin") return renderAdmin();
  if (state.screen === "admin-payments") return renderAdminPayments();
  if (state.screen === "admin-support") return renderAdminSupport();
  if (state.screen === "admin-content") return renderAdminContent();
  if (state.screen === "admin-jamb") return renderAdminJamb();
  if (state.screen === "admin-information") return renderAdminInformation();
  if (state.screen === "admin-certificates") return renderAdminCertificates();
  if (state.screen === "admin-members") return renderAdminMembers();
  if (state.screen === "admin-monitoring") return renderAdminMonitoring();
  if (state.screen === "admin-cleanup") return renderAdminCleanup();
  if (state.screen === "admin-settings") return renderAdminSettings();
  return null;
}

function renderSplash() {
  return `
      <main class="intro" aria-label="Entering G WORLD">
        <div class="intro-glow"></div>

        <img
          class="master-logo"
          src="/assets/gworld-master-logo.png"
          alt="G WORLD — Discover What You Need to Know."
        >

        <div class="intro-line"></div>
        <div class="intro-status">ENTERING G WORLD</div>
      </main>
    `;
}

function renderEntry() {
  return `
      <main class="center enter-screen">
        <section class="panel">

          <div class="form-brand">
            ${brandIcon()}<b>G WORLD</b>
          </div>

          <div class="eyebrow">WELCOME TO G WORLD</div>

          <h1>How would you like to enter?</h1>

          <p>
            Start a new G WORLD journey or continue with your existing
            G WORLD account.
          </p>

          ${state.error ? `<p class="form-error" role="status">${esc(state.error)}</p>` : ""}
          <div class="entry-options">

            <button class="primary full" data-a="new-member">
              NEW MEMBER
            </button>

            <button class="secondary full" data-a="existing-member">
              EXISTING MEMBER
            </button>

          </div>

          <div class="form-footnote">
            Your G WORLD ID stays with you as you continue learning.
          </div>

        </section>
      </main>
    `;
}

function renderOnboard() {
  return `
      <main class="center enter-screen">
        <section class="panel">

          <div class="form-brand">
            ${brandIcon()}<b>G WORLD</b>
          </div>

          <div class="eyebrow">NEW MEMBER</div>

          <h1>Start your journey.</h1>

          <p>
            Enter your basic details. Your G WORLD ID and digital
            member card will be created automatically.
          </p>

          <form id="f" novalidate>

            <label>
              Full Name
              <input
                name="name"
                required
                autocomplete="name"
                placeholder="Your full name"
                maxlength="80"
              >
              <small class="field-error" data-error="name"></small>
            </label>

            <label>
              Phone Number
              <input
                name="phone"
                type="tel"
                inputmode="tel"
                required
                autocomplete="tel"
                placeholder="Your phone number"
                maxlength="30"
              >
              <small class="field-error" data-error="phone"></small>
            </label>

            <label>
              Email <small>(optional)</small>
              <input
                name="email"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
                maxlength="120"
              >
              <small>If you leave email blank, sign in with your phone number.</small>
              <small class="field-error" data-error="email"></small>
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autocomplete="new-password"
                placeholder="At least 8 characters"
                maxlength="128"
              >
              <small class="field-error" data-error="password"></small>
            </label>

            <label>
              Confirm Password
              <input
                name="confirm"
                type="password"
                required
                autocomplete="new-password"
                placeholder="Repeat your password"
                maxlength="128"
              >
              <small class="field-error" data-error="confirm"></small>
            </label>

            <small class="form-error">
              ${esc(state.error)}
            </small>

            <button
              class="primary full"
              type="submit"
              ${state.loading ? "disabled" : ""}
            >
              ${state.loading
                ? "CREATING YOUR G WORLD ID…"
                : "CREATE MY G WORLD ID"}
            </button>

          </form>

          <button class="link" data-a="back-entry">
            ← Back
          </button>

          <small class="privacy-note">
            Your G WORLD ID is a platform identity.
            It is not a government ID or password.
          </small>

        </section>
      </main>
    `;
}

function renderExisting() {
  return `
      <main class="center enter-screen">
        <section class="panel">

          <div class="form-brand">
            ${brandIcon()}<b>G WORLD</b>
          </div>

          <div class="eyebrow">EXISTING MEMBER</div>

          <h1>Welcome back.</h1>

          <p>
            Enter the details connected to your G WORLD account.
          </p>

          <form id="existing-form" novalidate>

            <label>
              Email or phone number
              <input
                name="identifier"
                type="text"
                required
                autocomplete="username"
                placeholder="Your registered email or phone number"
                maxlength="120"
              >
              <small class="field-error"
                data-error="existing-identifier"></small>
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="Your password"
                maxlength="128"
              >
              <small class="field-error"
                data-error="existing-password"></small>
            </label>

            <small class="form-error">
              ${esc(state.error)}
            </small>

            <button
              class="primary full"
              type="submit"
              ${state.loading ? "disabled" : ""}
            >
              ${state.loading
                ? "ENTERING G WORLD…"
                : "ENTER G WORLD"}
            </button>

          </form>

          <button class="link" data-a="back-entry">
            ← Back
          </button>

          <div class="form-footnote">
            Your access is checked by the G WORLD service.
          </div>

        </section>
      </main>
    `;
}

function renderCard() {
  const member = state.member;
  return `
      <main class="center">

        <div class="card">

          <header>
            <div class="mini">
              ${brandIcon()}

              <span>
                <strong>G WORLD</strong>
                <small>Discover What You Need to Know.</small>
              </span>
            </div>
          </header>

          <section>

            <em>WELCOME TO G WORLD</em>

            <h2>${esc(member.name)}</h2>

            <div class="info">

              <div>
                <small>PHONE</small>
                <strong>${esc(member.phone)}</strong>
              </div>

              <div>
                <small>STATUS</small>
                <strong>${esc(member.status || "IN TRAINING")}</strong>
              </div>

              <div>
                <small>G WORLD ID</small>
                <strong>${esc(member.gworldId)}</strong>
              </div>

            </div>

            <div class="qr">
              <canvas id="member-qr"></canvas>

              <small>
                SCAN TO VERIFY<br>
                THIS G WORLD MEMBER
              </small>
            </div>

          </section>

          <footer>
            <b>Welcome to G WORLD!</b>
            <span>Your learning journey starts here.</span>
            <span>Stay committed. Keep learning. Grow with G WORLD.</span>
          </footer>

        </div>

        <button class="primary" data-a="home">
          ENTER G WORLD
        </button>

        <button class="link" data-a="reset">
          Start over
        </button>

      </main>
    `;
}

function renderHome() {
  const m = state.member;
  return `
      <main id="main-content" class="home">

        ${commonNav(false)}

        ${homeSlider()}

        <section class="home-welcome" aria-labelledby="welcome-heading">
          <div class="welcome-layout">
            <div class="welcome-visual">
              <span class="welcome-dot-pattern" aria-hidden="true"></span>
              <span class="welcome-orbit" aria-hidden="true"></span>
              <img class="welcome-graduate" src="/assets/welcome/graduate.webp" alt="An illustrative graduate smiling with a textbook and graduation cap" width="800" height="1000" loading="lazy" decoding="async">
              <div class="welcome-study-note">${icon('cap')}<span><strong>Your next chapter</strong><small>Learn with purpose. Grow with confidence.</small></span></div>
              <img class="welcome-classroom" src="/assets/hero/digital-classroom.webp" alt="Students collaborating in a digital classroom" width="320" height="240" loading="lazy" decoding="async">
            </div>
            <div class="welcome-content">
              <div class="eyebrow">WELCOME TO G WORLD</div>
              <h2 id="welcome-heading">Welcome to your<br>online learning centre.</h2>
              <p class="welcome-personal">Welcome back, ${esc(m.name)}.</p>
              <p>Make room for what you want to learn next. G WORLD brings academic foundations, practical digital skills and study guidance together, so you can move forward one clear step at a time.</p>
              <ul class="welcome-checklist">
                <li>${icon('check')}<span>Find your direction with clear course roadmaps.</span></li>
                <li>${icon('check')}<span>Connect new knowledge to practical skills.</span></li>
                <li>${icon('check')}<span>Build a study routine that works for you.</span></li>
              </ul>
              <div class="welcome-actions"><button class="primary" type="button" data-a="courses">Find your next course ${icon('arrow')}</button><div class="welcome-identity"><small>YOUR G WORLD ID</small><code>${esc(m.gworldId)}</code></div></div>
            </div>
          </div>
          <div class="welcome-highlights" aria-label="G WORLD totals">
            <div>${icon('cap')}<span><strong data-welcome-metric="achievements">${formatTotal(state.metrics?.achievements)}</strong><small>Total achievements</small></span></div>
            <div>${icon('book')}<span><strong data-welcome-metric="students">${formatTotal(state.metrics?.students)}</strong><small>Total students</small></span></div>
            <div>${icon('briefcase')}<span><strong data-welcome-metric="instructors">${formatTotal(state.metrics?.instructors)}</strong><small>Total instructors</small></span></div>
          </div>
          <p class="welcome-metrics-note">Placeholder totals shown while live metrics are being connected.</p>
        </section>

        ${facultySection()}
        ${subjectSection()}

        <section class="doors">

          <div class="section-heading"><div><div class="eyebrow">FIND YOUR DIRECTION</div><h2>Explore G WORLD</h2><p>Ten doors to knowledge. Choose where you want to go next.</p></div><span class="section-count">10 learning areas</span></div>

          <div class="grid">

            <article data-a="courses">
              <small>01</small>
              <h3>Faculties</h3>
              <p>
                Find your direction in the Faculty of Management Science, Faculty of Art or Faculty of Science. Preview a roadmap and plan your next step.
              </p>
            </article>

            <article data-a="tech-skills">
              <small>02</small>
              <h3>Tech Skills</h3>
              <p>
                Explore Python, spreadsheets, databases and web development. Start with the basics and connect your learning to practical projects.
              </p>
            </article>

            <article data-a="ai-tech">
              <small>03</small>
              <h3>AI & Technology</h3>
              <p>
                Make sense of AI tools, emerging technologies and research. Explore what they do, where they help, and how to use them thoughtfully.
              </p>
            </article>

            <article data-a="jamb">
              <small>04</small>
              <h3>JAMB</h3>
              <p>
                Organise your exam preparation with syllabus guidance, CBT practice areas and subject-combination information in one place.
              </p>
            </article>

            <article data-a="opportunities">
              <small>05</small>
              <h3>Opportunities</h3>
              <p>
                Explore pathways for further learning and professional growth. Check eligibility, requirements and deadlines before taking your next step.
              </p>
            </article>

            <article data-a="research">
              <small>06</small>
              <h3>Discoveries & Research</h3>
              <p>
                Explore ideas that expand your understanding. Learn to question evidence, interpret findings and connect discoveries to everyday life.
              </p>
            </article>

            <article data-a="project-writer">
              <small>07</small>
              <h3>Project Writer</h3>
              <p>
                Move from a research topic to a clear project structure. Understand your question, plan your methodology and organise each chapter.
              </p>
            </article>

            <article data-a="academic">
              <small>08</small>
              <h3>Academic Resources</h3>
              <p>
                Strengthen your study habits with guidance for reading, research and revision. Build a routine that makes learning more manageable.
              </p>
            </article>

            <article data-a="work-ready">
              <small>09</small>
              <h3>Work Ready</h3>
              <p>
                Develop clearer communication, stronger teamwork and professional habits. Explore the skills that matter beyond the classroom.
              </p>
            </article>

            <article data-a="support">
              <small>10</small>
              <h3>G WORLD Support</h3>
              <p>
                Get help with your account, courses, payments or technical questions. Send the team a message with the details of your challenge.
              </p>
            </article>

          </div>

        </section>

        ${learningInvitation()}
        ${accessSection(naira(paymentInfo().amount))}
        ${approachSection()}
        ${resourceSection()}
        ${homeFooter()}

      </main>
    `;
}

function renderCourses() {
  return `<main class="home">${commonNav()}
    <section class="hero"><div class="eyebrow">ACADEMIC PATHWAYS</div><h1>Find your faculty.<br>Shape your learning journey.</h1><p>Choose a faculty to explore its subjects and introductory roadmaps. Existing management courses remain available; new Art and Science roadmaps are marked as previews.</p></section>
    <section class="faculty-directory"><h2>Our Faculties</h2><div class="faculty-card-grid">${facultyCards()}</div></section>
    ${supportButton()}<footer>G WORLD · Discover What You Need to Know.</footer>
  </main>`;
}

function renderFaculty() {
  const faculty = facultyForScreen(state.screen);
  if (!faculty) return renderCourses();
  return `<main class="home">${commonNav()}
    <section class="hero"><div class="eyebrow">G WORLD · FACULTIES</div><h1>${faculty.title}</h1><p>${faculty.description}</p></section>
    <section class="doors"><h2>Available Courses</h2><div class="grid">${faculty.courses.map(([id,title,description], i) => `<article data-a="${id}"><small>${EXTRA_COURSES[id] ? 'ROADMAP PREVIEW' : String(i+1).padStart(2,'0')}</small><h3>${title}</h3><p>${description}</p></article>`).join('')}</div></section>
    ${faculty.id !== 'management' ? '<section class="continue"><div><div class="eyebrow">WHAT TO EXPECT</div><h2>A starting point, not a published full course.</h2><p>These introductory roadmaps help you explore the faculty. Full lessons, assessments and paid access are not yet available for these previews.</p></div></section>' : ''}
    <div class="faculty-return"><button class="secondary" type="button" data-a="courses">← All faculties</button></div>
    ${supportButton()}<footer>G WORLD · Discover What You Need to Know.</footer>
  </main>`;
}

function renderCoursePage() {
  const courseMap = {
      "course-accounting": {
        title: "Accounting",
        description:
          "Build your accounting knowledge from the foundation through practical understanding.",
        modules: [
          "Introduction to Accounting",
          "Accounting Concepts and Principles",
          "Double Entry",
          "Books of Original Entry",
          "Ledger Accounts",
          "Trial Balance",
          "Financial Statements",
          "Adjustments",
          "Analysis and Interpretation",
          "Practical Accounting Applications"
        ]
      },

      "course-economics": {
        title: "Economics",
        description:
          "Understand economic ideas and how they apply to real-world decisions.",
        modules: [
          "Introduction to Economics",
          "Demand and Supply",
          "Market Structures",
          "National Income",
          "Inflation",
          "Unemployment",
          "Money and Banking",
          "Fiscal Policy",
          "Monetary Policy",
          "Development Economics"
        ]
      },

      "course-business": {
        title: "Business Administration",
        description:
          "Understand organisations, management and practical business operations.",
        modules: [
          "Introduction to Business",
          "Management",
          "Planning",
          "Organising",
          "Leadership",
          "Human Resources",
          "Operations",
          "Business Strategy",
          "Decision Making",
          "Business Ethics"
        ]
      },

      "course-finance": {
        title: "Finance",
        description:
          "Build financial literacy through budgeting, investment principles and risk. Connect each concept to the decisions people and organisations make.",
        modules: [
          "Introduction to Finance",
          "Financial Management",
          "Time Value of Money",
          "Risk and Return",
          "Investment Decisions",
          "Working Capital",
          "Capital Structure",
          "Financial Analysis",
          "Financial Planning",
          "Practical Finance"
        ]
      },

      "course-marketing": {
        title: "Marketing",
        description:
          "Understand customers, markets, communication and marketing decisions.",
        modules: [
          "Introduction to Marketing",
          "Customer Needs",
          "Market Research",
          "Segmentation",
          "Targeting",
          "Positioning",
          "Marketing Mix",
          "Digital Marketing",
          "Customer Relationship",
          "Marketing Strategy"
        ]
      },

      "course-research": {
        title: "Research Methodology",
        description:
          "Learn how to move from a research problem to a defensible research project.",
        modules: [
          "Understanding Research",
          "Research Problems",
          "Objectives and Questions",
          "Literature Review",
          "Research Design",
          "Population and Sampling",
          "Data Collection",
          "Data Analysis",
          "Results and Discussion",
          "Research Reporting"
        ]
      }
    };
  const course = EXTRA_COURSES[state.screen] || courseMap[state.screen] || courseMap["course-accounting"];
  state.selectedCourse = course;
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">COURSE</div>

          <h1>${esc(course.title)}</h1>

          <p>${esc(course.description)}</p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">ROADMAP</div>

            <h2>What you will learn</h2>

            <p>
              Explore the roadmap before deciding whether to unlock
              the full learning experience.
            </p>
          </div>

          <strong>${course.modules.length} modules</strong>

        </section>

        <section class="doors">

          <h2>Learning Roadmap</h2>

          <div class="grid">

            ${course.modules.map((module, index) => `
              <article>
                <small>${String(index + 1).padStart(2, "0")}</small>
                <h3>${esc(module)}</h3>
                <p>
                  Learn → Understand → Practise → Apply.
                </p>
              </article>
            `).join("")}

          </div>

        </section>

        ${course.preview ? `<section class="payment-preview"><div class="eyebrow">ROADMAP PREVIEW</div><h2>Explore the subject before committing.</h2><p>This roadmap is a guide to the topics ahead. Full lessons, assessments and paid access have not been published for this course.</p><button class="secondary" type="button" data-a="${facultyForScreen(state.screen) ? 'faculty-' + facultyForScreen(state.screen).id : 'courses'}">Return to faculty</button></section>` : `
        <section class="payment-preview">

          <div class="eyebrow">FULL ACCESS</div>

          <h2>Unlock the complete ${esc(course.title)} learning journey.</h2>

          <p>
            Your one-time G WORLD access includes structured lessons,
            practice, assessments, projects and certificate eligibility
            after completion and review.
          </p>

          <div class="price" data-payment-price>${naira(paymentInfo().amount)}</div>

          <small>ONE-TIME PAYMENT</small>

          <button class="primary full" data-a="payment">
            MAKE PAYMENT
          </button>

        </section>

        `}

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderTechSkills() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">
          <div class="eyebrow">TECH SKILLS</div>

          <h1>Build practical skills.</h1>

          <p>
            Learn technology skills through structured lessons,
            practice and projects.
          </p>
        </section>

        <section class="doors">

          <h2>Skills</h2>

          <div class="grid">

            <article data-a="python-course">
              <small>01</small>
              <h3>Python</h3>
              <p>
                Learn Python from the foundation to practical projects.
              </p>
            </article>

            <article data-a="excel-course">
              <small>02</small>
              <h3>Excel</h3>
              <p>Explore formulas, organise datasets and build clear spreadsheets for everyday study and workplace tasks.</p>
            </article>

            <article>
              <small>03</small>
              <h3>SQL</h3>
              <p>Discover how tables, queries and relationships help you retrieve and organise information.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Data Analysis</h3>
              <p>Explore how to clean, examine and interpret data, then communicate the story behind the numbers.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Power BI</h3>
              <p>Build useful data reports and dashboards.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Web Development</h3>
              <p>Understand how websites are built.</p>
            </article>

            <article>
              <small>07</small>
              <h3>JavaScript</h3>
              <p>Build interactive web experiences.</p>
            </article>

            <article>
              <small>08</small>
              <h3>Git & GitHub</h3>
              <p>Understand version control and collaboration.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderExcelCourse() {
  const topics = [
    ['Getting started with Excel', 'Explore workbooks, worksheets, cells and the ribbon.'],
    ['Entering and organising data', 'Enter, edit, copy and arrange information in a worksheet.'],
    ['Formatting worksheets', 'Use number formats, alignment and cell styles to make data readable.'],
    ['Formulas and cell references', 'Understand calculations and relative, absolute and mixed references.'],
    ['Essential functions', 'Explore SUM, AVERAGE, COUNT, MIN and MAX.'],
    ['Logical functions', 'Use IF, AND and OR to work with conditions.'],
    ['Sorting, filtering and tables', 'Organise datasets and find the information you need.'],
    ['Working with text and dates', 'Clean text and understand common date and time operations.'],
    ['Lookup functions', 'Understand how XLOOKUP and VLOOKUP connect related data.'],
    ['Charts and visualisation', 'Choose suitable charts and communicate patterns clearly.'],
    ['PivotTables', 'Summarise datasets and explore trends across categories.'],
    ['Practical spreadsheet projects', 'Plan a budget, a study tracker or a simple data report.']
  ];
  return `<main class="home">
    ${commonNav()}
    <section class="hero"><div class="eyebrow">TECH SKILLS · EXCEL</div><h1>Excel Topics</h1><p>Build spreadsheet confidence, from your first worksheet to useful data summaries.</p></section>
    <section class="doors" aria-labelledby="excel-roadmap-heading"><div class="section-heading"><div><div class="eyebrow">COURSE ROADMAP</div><h2 id="excel-roadmap-heading">Your Excel learning roadmap</h2><p>Explore these topics in order. This is a topic preview; full lessons and exercises are not yet published.</p></div><span class="section-count">${topics.length} topics</span></div>
    <div class="grid">${topics.map(([title, description], index) => `<article><small>${String(index + 1).padStart(2, '0')}</small><h3>${esc(title)}</h3><p>${esc(description)}</p></article>`).join('')}</div>
    <button class="primary" type="button" data-a="tech-skills">Back to Tech Skills</button></section>
    ${supportButton()}<footer>G WORLD · Discover What You Need to Know.</footer></main>`;
}

function renderPythonCourse() {
  const lessons = [
      "Introduction to Python",
      "Python Basics",
      "Variables",
      "Data Types",
      "Strings",
      "Numbers & Operators",
      "Input",
      "Conditional Statements",
      "Comparison & Logical Operators",
      "Loops",
      "Lists",
      "Tuples",
      "Dictionaries",
      "Sets",
      "Functions",
      "Modules",
      "Error Handling",
      "File Handling",
      "Object-Oriented Programming",
      "Working with Libraries",
      "Practical Python Projects"
    ];
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">TECH SKILLS · PYTHON</div>

          <h1>Python Foundations</h1>

          <p>
            Know → Understand → Watch → Practise → Build → Verify.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">ROADMAP</div>
            <h2>21 lessons + practical projects</h2>
            <p>
              Work through Python one step at a time.
            </p>
          </div>

          <button class="primary" data-a="payment">
            UNLOCK FOR <span data-payment-price>${naira(paymentInfo().amount)}</span>
          </button>

        </section>

        <section class="doors">

          <h2>Python Roadmap</h2>

          <div class="grid">

            ${lessons.map((lesson, index) => `
              <article
                ${index === 0 ? 'data-a="python-intro"' : ""}
              >
                <small>${String(index + 1).padStart(2, "0")}</small>
                <h3>${esc(lesson)}</h3>
                <p>
                  ${index === 0
                    ? "Begin here."
                    : "Available inside the complete learning journey."}
                </p>
              </article>
            `).join("")}

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderPythonIntro() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">
            PYTHON FOUNDATIONS · LESSON 1
          </div>

          <h1>Introduction to Python</h1>

          <p>
            Before writing code, understand what Python is,
            where it is used and why people use it.
          </p>

        </section>

        <section class="continue">

          <div>

            <div class="eyebrow">KNOW</div>

            <h2>What is Python?</h2>

            <p>
              Python is a programming language used to give instructions
              to computers in a readable and practical way.
            </p>

            <p>
              It is used in automation, data analysis, research,
              artificial intelligence, software development and many
              other areas.
            </p>

          </div>

        </section>

        <section class="doors">

          <h2>Understand Before You Practise</h2>

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Python is a language</h3>
              <p>
                Programmers use Python to communicate instructions
                to computers.
              </p>
            </article>

            <article>
              <small>02</small>
              <h3>Python is readable</h3>
              <p>
                Its syntax is designed to be relatively easy to read.
              </p>
            </article>

            <article>
              <small>03</small>
              <h3>Python can build things</h3>
              <p>
                Python can be used to automate tasks, analyse data
                and build useful programs.
              </p>
            </article>

          </div>

        </section>

        <section class="video-card">

          <div class="eyebrow">WATCH</div>

          <h2>Focused lesson video</h2>

          <div class="video-frame">
            <iframe
              src="https://www.youtube.com/embed/cQT33yu9pY8"
              title="Python Variables lesson"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write;
              encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>

          <small>
            Video opens inside G WORLD. A longer video can be provided
            separately under Learn More.
          </small>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">PRACTICE</div>

            <h2>Ready to check your understanding?</h2>

            <p>
              Take the first practice question.
            </p>
          </div>

          <button class="primary" data-a="python-practice">
            CONTINUE
          </button>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderPythonPractice() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">
            PYTHON · CHECK YOUR UNDERSTANDING
          </div>

          <h1>Let's see what you understand.</h1>

          <p>
            There is no pressure. Think carefully and choose the answer
            that best fits what you learned.
          </p>

        </section>

        <section class="continue">

          <div>

            <div class="eyebrow">QUESTION 1</div>

            <h2>What is Python?</h2>

            <p>
              Choose the answer that best explains Python.
            </p>

          </div>

        </section>

        <section class="doors">

          <div class="grid">

            <article data-a="python-answer-wrong">
              <h3>A</h3>
              <p>A type of computer hardware.</p>
            </article>

            <article data-a="python-answer-correct">
              <h3>B</h3>
              <p>
                A programming language used to give instructions
                to a computer.
              </p>
            </article>

            <article data-a="python-answer-wrong">
              <h3>C</h3>
              <p>A social media platform.</p>
            </article>

            <article data-a="python-answer-wrong">
              <h3>D</h3>
              <p>An operating system.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderAiTech() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">AI & TECHNOLOGY</div>

          <h1>What is happening now?</h1>

          <p>
            Understand the tools and ideas shaping technology. Explore practical uses, research and responsible ways to bring AI into your learning.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">NEW UPDATES</div>
            <h2>Latest reviewed information</h2>
            <p>
              New approved information appears here first.
            </p>
          </div>

          <span class="status-pill">UPDATED REGULARLY</span>

        </section>

        <section class="doors">

          <h2>Existing Information</h2>

          <div class="grid">

            <article>
              <small>01</small>
              <h3>AI Tools</h3>
              <p>Explore what AI tools can do, where they fall short and how to evaluate their outputs responsibly.</p>
            </article>

            <article>
              <small>02</small>
              <h3>AI Research</h3>
              <p>Learn to interpret new findings, examine the evidence and distinguish a promising result from an established application.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Technology</h3>
              <p>Understand how emerging technologies affect learning and work, including questions of privacy, access and responsible use.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJamb() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB</div>

          <h1>Your JAMB learning and information centre.</h1>

          <p>
            Current information, syllabus, CBT practice and
            subject-combination guidance in one place.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article data-a="jamb-information">
              <small>01</small>
              <h3>JAMB Information</h3>
              <p>
                Important JAMB information and updates.
              </p>
            </article>

            <article data-a="jamb-news">
              <small>02</small>
              <h3>JAMB News</h3>
              <p>
                New reviewed JAMB-related developments.
              </p>
            </article>

            <article data-a="jamb-syllabus">
              <small>03</small>
              <h3>JAMB Syllabus</h3>
              <p>
                Subjects, topics and learning guidance.
              </p>
            </article>

            <article data-a="jamb-cbt">
              <small>04</small>
              <h3>JAMB CBT</h3>
              <p>
                Practice questions arranged by subject group.
              </p>
            </article>

            <article data-a="jamb-combinations">
              <small>05</small>
              <h3>Subject Combination</h3>
              <p>
                Find current subject requirements by course.
              </p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJambInfoNews() {
  const title =
      state.screen === "jamb-information"
        ? "JAMB Information"
        : "JAMB News";
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB</div>

          <h1>${title}</h1>

          <p>
            New approved information appears under New Updates.
            After the freshness period it moves into Existing Information.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">NEW UPDATES</div>
            <h2>New information</h2>
            <p>
              Current reviewed information will appear here.
            </p>
          </div>

          <span class="status-pill">NEW</span>

        </section>

        <section class="doors">

          <h2>Existing Information</h2>

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Previously reviewed information</h3>
              <p>
                Older information remains available instead of
                disappearing when newer information arrives.
              </p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJambSyllabus() {
  const subjects = [
      "English Language",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Economics",
      "Government",
      "Commerce",
      "Accounting",
      "Literature in English",
      "Agricultural Science",
      "Geography",
      "CRS",
      "IRS"
    ];
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB SYLLABUS</div>

          <h1>Study from the syllabus.</h1>

          <p>
            Subject topics can be updated centrally by the G WORLD
            administrator when the official syllabus changes.
          </p>

        </section>

        <section class="doors">

          <h2>Subjects</h2>

          <div class="grid">

            ${subjects.map((subject, index) => `
              <article>
                <small>${String(index + 1).padStart(2, "0")}</small>
                <h3>${esc(subject)}</h3>
                <p>
                  View syllabus topics and study guidance.
                </p>
              </article>
            `).join("")}

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJambCbt() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB CBT</div>

          <h1>Choose your practice area.</h1>

          <p>
            Choose a subject group and a practice length that fits your study session. Practice questions will become available when the approved question bank is connected.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article data-a="jamb-cbt-science">
              <small>01</small>
              <h3>Science</h3>
              <p>
                Science-oriented JAMB practice.
              </p>
            </article>

            <article data-a="jamb-cbt-commercial">
              <small>02</small>
              <h3>Commercial</h3>
              <p>
                Commercial-oriented JAMB practice.
              </p>
            </article>

            <article data-a="jamb-cbt-arts">
              <small>03</small>
              <h3>Arts</h3>
              <p>
                Arts-oriented JAMB practice.
              </p>
            </article>

            <article data-a="jamb-cbt-general">
              <small>04</small>
              <h3>Other Subjects</h3>
              <p>
                Other approved subject practice.
              </p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJambCbtPractice() {
  const labels = {
      "jamb-cbt-science": "SCIENCE",
      "jamb-cbt-commercial": "COMMERCIAL",
      "jamb-cbt-arts": "ARTS",
      "jamb-cbt-general": "OTHER SUBJECTS"
    };
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB CBT · ${labels[state.screen]}</div>

          <h1>Choose your practice.</h1>

          <p>
            Questions can be generated from the approved G WORLD
            question bank.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article data-a="cbt-start-10">
              <small>01</small>
              <h3>10 Questions</h3>
              <p>A short session for checking recall and identifying topics to revisit.</p>
            </article>

            <article data-a="cbt-start-20">
              <small>02</small>
              <h3>20 Questions</h3>
              <p>Build consistency with a focused set of questions across your chosen area.</p>
            </article>

            <article data-a="cbt-start-40">
              <small>03</small>
              <h3>40 Questions</h3>
              <p>Set aside more time to test your understanding across a broader practice set.</p>
            </article>

            <article data-a="cbt-start-full">
              <small>04</small>
              <h3>Full CBT</h3>
              <p>Prepare for a longer session and practise maintaining focus across a full set.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderJambCombinations() {
  const courses = [
      "Accounting",
      "Medicine and Surgery",
      "Computer Science",
      "Economics",
      "Law",
      "Mass Communication",
      "Business Administration",
      "Engineering",
      "Nursing",
      "Pharmacy",
      "Political Science",
      "Statistics",
      "Mathematics",
      "Agriculture",
      "Education",
      "Architecture"
    ];
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">SUBJECT COMBINATION</div>

          <h1>Find your course.</h1>

          <p>
            Search or select a course to view its currently approved
            subject combination.
          </p>

        </section>

        <section class="panel">

          <label>
            Search course
            <input
              id="course-search"
              placeholder="e.g. Accounting"
              autocomplete="off"
            >
          </label>

        </section>

        <section class="doors">

          <h2>Courses</h2>

          <div class="grid" id="combination-grid">

            ${courses.map((course, index) => `
              <article data-course-combination="${esc(course)}">
                <small>${String(index + 1).padStart(2, "0")}</small>
                <h3>${esc(course)}</h3>
                <p>
                  View current subject combination.
                </p>
              </article>
            `).join("")}

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderCombinationResult() {
  const course = state.selectedCourse || "Selected Course";
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">SUBJECT COMBINATION</div>

          <h1>${esc(course)}</h1>

          <p>
            Current information is maintained by the G WORLD
            administrator and reviewed against approved sources.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">CURRENT RECORD</div>

            <h2>Required subjects</h2>

            <p>
              The exact current combination will be displayed from
              the approved G WORLD information record.
            </p>
          </div>

          <span class="status-pill">LAST VERIFIED</span>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Subject 1</h3>
              <p>Current approved requirement.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Subject 2</h3>
              <p>Current approved requirement.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Subject 3</h3>
              <p>Current approved requirement.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Subject 4</h3>
              <p>Where applicable.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderWorkReady() {
  const courses = [
      ["Quality Ownership", "Understand ownership of quality in the workplace."],
      ["Customer Service", "Learn how to serve customers professionally."],
      ["Work Ethics", "Understand professional behaviour and responsibility."],
      ["Work-Life Balance", "Build healthier and more sustainable work habits."],
      ["Communication at Work", "Communicate clearly and professionally."],
      ["Teamwork", "Understand collaboration and team responsibility."],
      ["Time Management", "Manage work priorities and deadlines."],
      ["Problem Solving", "Approach workplace problems systematically."],
      ["Professional Conduct", "Understand workplace standards and conduct."],
      ["Leadership Foundations", "Develop practical leadership habits."],
      ["Conflict Management", "Handle workplace disagreements constructively."],
      ["Adaptability", "Prepare for changing workplace environments."]
    ];
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">WORK READY</div>

          <h1>Prepare for the world of work.</h1>

          <p>
            Work Ready is a complete learning area with courses
            designed around practical workplace behaviour and skills.
          </p>

        </section>

        <section class="doors">

          <h2>Work Ready Courses</h2>

          <div class="grid">

            ${courses.map((course, index) => `
              <article data-a="work-course">

                <small>${String(index + 1).padStart(2, "0")}</small>

                <h3>${esc(course[0])}</h3>

                <p>${esc(course[1])}</p>

              </article>
            `).join("")}

          </div>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">CERTIFICATION</div>

            <h2>Every completed Work Ready course can lead to a certificate.</h2>

            <p>
              Completion, verification and any required payment review
              are handled through G WORLD.
            </p>
          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderWorkCourse() {
  const course = {
      title: "Work Ready Course",
      modules: [
        "Understand the workplace",
        "Know your responsibilities",
        "Communicate professionally",
        "Practise workplace situations",
        "Apply what you learned",
        "Complete assessment",
        "Complete practical activity",
        "Verify completion",
        "Certificate"
      ]
    };
  state.selectedCourse = course;
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">WORK READY COURSE</div>

          <h1>${esc(course.title)}</h1>

          <p>
            Understand → Practise → Apply → Verify → Certify.
          </p>

        </section>

        <section class="doors">

          <h2>Roadmap</h2>

          <div class="grid">

            ${course.modules.map((module, index) => `
              <article>
                <small>${String(index + 1).padStart(2, "0")}</small>
                <h3>${esc(module)}</h3>
                <p>
                  Structured learning step.
                </p>
              </article>
            `).join("")}

          </div>

        </section>

        <section class="payment-preview">

          <div class="eyebrow">ONE-TIME ACCESS</div>

          <h2>Unlock the complete course.</h2>

          <p>
            G WORLD learning access is one-time and includes eligible
            learning content and certificate workflow.
          </p>

          <div class="price" data-payment-price>${naira(paymentInfo().amount)}</div>

          <button class="primary full" data-a="payment">
            MAKE PAYMENT
          </button>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
}

function renderPayment() {
  const pay = paymentInfo();
  const course = state.selectedCourse || {
      title: "G WORLD Learning Access"
    };
  return `
      <main class="home">

        ${commonNav()}

        <section class="payment-shell">

          <div class="payment-brand">
            <div class="eyebrow">G WORLD LEARNING ACCESS</div>

            <h1>Complete your payment</h1>

            <p>
              This is a one-time payment of <span data-payment-price>${naira(pay.amount)}</span>.
            </p>
          </div>

          <div class="payment-card">

            <div class="payment-card-top">
              <span>ONE-TIME ACCESS</span>
              <strong data-payment-price>${naira(pay.amount)}</strong>
            </div>

            <div class="payment-purpose">

              <div class="eyebrow">WHAT YOU ARE UNLOCKING</div>

              <h2>${esc(course.title)}</h2>

              <p>
                Your payment gives you access to the structured G WORLD
                learning journey, including lessons, practice,
                assessment, projects where applicable and certificate
                eligibility after successful completion and review.
              </p>

            </div>

            <div class="payment-account">

              <div class="eyebrow">PAYMENT ACCOUNT</div>

              <div class="account-row">
                <span>Provider</span>
                <strong data-payment-detail="provider">${esc(pay.provider)}</strong>
              </div>

              <div class="account-row">
                <span>Account Name</span>
                <strong data-payment-detail="accountName">${esc(pay.accountName)}</strong>
              </div>

              <div class="account-row">
                <span>Account Number</span>

                <strong>
                  <span data-payment-detail="accountNumber">${esc(pay.accountNumber)}</span>

                  <button
                    class="small-action"
                    type="button"
                    data-copy="${esc(pay.accountNumber)}" data-payment-copy
                  >
                    COPY
                  </button>
                </strong>

              </div>

            </div>

            <div class="payment-note">

              <strong>After making the transfer</strong>

              <p>
                Click “I've Made Payment”. G WORLD will record your
                payment as waiting for admin approval. Your paid
                learning content will remain locked until approval.
              </p>

            </div>

            <button
              class="primary full"
              data-a="payment-submitted"
            >
              I'VE MADE PAYMENT
            </button>

          </div>

          ${supportButton()}

        </section>

      </main>
    `;
}

function renderPaymentStatus() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">PAYMENT STATUS</div>

          <h1>Waiting for approval.</h1>

          <p>
            Your payment has been registered and sent to the G WORLD
            administration team for review.
          </p>

        </section>

        <section class="status-card">

          <div class="status-icon">✓</div>

          <div class="eyebrow">CURRENT STATUS</div>

          <h2>WAITING FOR APPROVAL</h2>

          <p>
            Your access will be activated after the payment is reviewed
            and confirmed by an authorized G WORLD administrator.
          </p>

        </section>

        <button class="secondary full" data-a="refresh-payment">
          CHECK PAYMENT STATUS
        </button>

        ${supportButton()}

      </main>
    `;
}

function renderPaymentRejected() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">PAYMENT STATUS</div>

          <h1>Payment not confirmed.</h1>

          <p>
            The submitted payment was not confirmed by G WORLD
            administration.
          </p>

        </section>

        <section class="status-card">

          <div class="status-icon">!</div>

          <div class="eyebrow">CURRENT STATUS</div>

          <h2>PAYMENT NOT CONFIRMED</h2>

          <p>
            If you believe this was an error, you can contact the
            G WORLD Team or submit your payment again.
          </p>

        </section>

        <button class="primary full" data-a="payment">
          SUBMIT PAYMENT AGAIN
        </button>

        ${supportButton()}

      </main>
    `;
}

function renderSupport() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">G WORLD SUPPORT</div>

          <h1>How can we help?</h1>

          <p>
            Send a message to the G WORLD Team. Your message will be
            attached to your G WORLD account.
          </p>

        </section>

        <section class="panel">

          <form id="support-form">

            <label>
              Category

              <select name="category">
                <option value="general">General</option>
                <option value="payment">Payment</option>
                <option value="course">Course</option>
                <option value="lesson">Lesson</option>
                <option value="jamb">JAMB</option>
                <option value="cbt">CBT</option>
                <option value="certificate">Certificate</option>
                <option value="account">Account</option>
                <option value="technical">Technical Problem</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Message

              <textarea
                name="message"
                required
                maxlength="2000"
                rows="7"
                placeholder="Type your message here..."
              ></textarea>
            </label>

            <small class="form-error">
              ${esc(state.error)}
            </small>

            <button class="primary full" type="submit">
              SEND MESSAGE
            </button>

          </form>

        </section>

        <section class="doors">

          <h2>Your Messages</h2>

          <div class="grid">

            <article>
              <small>SUPPORT</small>
              <h3>Conversation history</h3>
              <p>
                Replies from the G WORLD Team will appear in your
                account when the support system is connected.
              </p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderCertificate() {
  const course = state.selectedCourse || {
      title: "G WORLD Course"
    };
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">CERTIFICATE</div>

          <h1>Your G WORLD certificate</h1>

          <p>
            Every eligible completed course uses your persistent
            G WORLD identity and a certificate-specific record.
          </p>

        </section>

        ${certificateHTML(course, state.member)}

        <section class="continue">

          <div>
            <div class="eyebrow">VERIFICATION</div>

            <h2>Your G WORLD ID is part of your certificate identity.</h2>

            <p>
              Certificates can be verified through the G WORLD
              verification system.
            </p>
          </div>

        </section>

        ${supportButton()}

      </main>
    `;
}

function renderProjectWriter() {
  return `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">PROJECT WRITER</div>

          <h1>Understand your project before you write it.</h1>

          <p>
            Enter your topic and work through your project step by step.
          </p>

        </section>

        <section class="panel">

          <form id="project-topic-form">

            <label>
              Project Topic

              <input
                name="topic"
                required
                maxlength="250"
                placeholder="Enter your project topic"
              >
            </label>

            <button class="primary full" type="submit">
              START MY PROJECT
            </button>

          </form>

        </section>

        <section class="doors">

          <h2>Project Structure</h2>

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Understand Your Topic</h3>
              <p>Identify the key ideas, define the scope and turn your topic into a clear research question.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Chapter One</h3>
              <p>Set the context, explain the problem and connect your objectives to the questions your project will answer.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Chapter Two</h3>
              <p>Compare relevant sources, organise the main themes and identify the gap your research explores.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Chapter Three</h3>
              <p>Explain your research design, sampling choices and how you plan to collect and analyse evidence.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Chapter Four</h3>
              <p>Present findings clearly using appropriate tables or figures, and explain how they address your questions.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Chapter Five</h3>
              <p>Connect your conclusions to the findings, acknowledge limitations and propose practical recommendations.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

      </main>
    `;
}

function renderInfoHub() {
  const hubs = {
    opportunities: {
      title: 'Opportunities', summary: 'Find a pathway that fits your ambitions. Prepare thoughtfully, compare your options and take the next step with confidence.',
      tips: [['Know your direction', 'Start with your interests and current skills. Decide whether your next step is further study, practical experience or a professional pathway.'], ['Check the requirements', 'Read eligibility criteria, required documents and deadlines carefully. Confirm details with the organisation offering the opportunity.'], ['Prepare a strong application', 'Keep your CV and supporting documents organised. Tailor your statement to the opportunity and allow time for a careful review.']]
    },
    research: {
      title: 'Discoveries & Research', summary: 'Build the habits of a curious, critical reader. Explore ideas, assess the evidence and connect new findings to what you already know.',
      tips: [['Start with a good question', 'Be specific about what you want to understand. A focused question makes it easier to find relevant literature and compare perspectives.'], ['Evaluate the evidence', 'Check who conducted the research, how the study was designed and what limitations the authors acknowledge. A headline rarely tells the whole story.'], ['Keep a research trail', 'Record useful sources, publication dates and your own notes. Separate direct quotations from your interpretations and acknowledge the work you use.']]
    },
    academic: {
      title: 'Academic Resources', summary: 'Study with a clearer plan. Develop practical routines for reading, revision and academic writing, one manageable session at a time.',
      tips: [['Plan your study sessions', 'Choose a specific goal for each session. Break larger topics into smaller tasks and leave time to revisit difficult ideas.'], ['Practise active recall', 'Close your notes and explain an idea in your own words. Use practice questions to find gaps, then return to the topics that need attention.'], ['Write and reference clearly', 'Build your argument around evidence. Keep source details as you read, use a consistent referencing style and leave time to revise your work.']]
    }
  };
  const hub = hubs[state.screen];
  return `
    <main class="home">
      ${commonNav()}
      <section class="hero"><div class="eyebrow">G WORLD · KNOWLEDGE HUB</div><h1>${hub.title}</h1><p>${hub.summary}</p></section>
      <section class="continue"><div><div class="eyebrow">NEW UPDATES</div><h2>Your information hub</h2><p>Published updates will appear here when the information service is connected. In the meantime, start with the practical guidance below.</p></div><span class="status-pill">GETTING STARTED</span></section>
      <section class="doors"><h2>A useful place to begin</h2><div class="grid">${hub.tips.map(([title, text], i) => `<article><small>0${i + 1}</small><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section>
      ${supportButton()}
    </main>`;
}

function renderAdminGate() {
  return `
      <main class="center enter-screen">

        <section class="panel admin-gate">

          <div class="form-brand">
            ${brandIcon()}<b>G WORLD</b>
          </div>

          <div class="eyebrow">SECURITY CHECK</div>

          <h1>Additional verification required.</h1>

          <p>
            Your administrator identity has been recognised.
            Enter your private administrator access code.
          </p>

          <form id="admin-code-form">

            <label>
              Account Email
              <input
                name="email"
                type="email"
                required
                autocomplete="email"
                maxlength="120"
                placeholder="Your G WORLD account email"
              >
            </label>

            <label>
              Administrator Code

              <input
                name="code"
                type="password"
                required
                autocomplete="current-password"
                maxlength="128"
                placeholder="Enter your private code"
              >
            </label>

            <small class="form-error">
              ${esc(state.error)}
            </small>

            <button class="primary full" type="submit">
              VERIFY ADMIN ACCESS
            </button>

          </form>

          <button class="link" data-a="home">
            ← Return to G WORLD
          </button>

        </section>

      </main>
    `;
}

function renderAdmin() {
  return `
      <main class="home admin-home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">CONTROL ROOM</div>

          <h1>G WORLD Administration</h1>

          <p>
            Manage members, learning, payments, information,
            support, certificates and system resources.
          </p>

        </section>

        <section class="doors">

          <h2>Administration</h2>

          <div class="grid">

            <article data-a="admin-payments">
              <small>01</small>
              <h3>Payment Reviews</h3>
              <p>Review ₦3,000 payment submissions.</p>
            </article>

            <article data-a="admin-support">
              <small>02</small>
              <h3>Support Inbox</h3>
              <p>Read and reply to learner messages.</p>
            </article>

            <article data-a="admin-content">
              <small>03</small>
              <h3>Learning Content</h3>
              <p>Manage courses, lessons, skills and videos.</p>
            </article>

            <article data-a="admin-jamb">
              <small>04</small>
              <h3>JAMB</h3>
              <p>Manage news, syllabus, CBT and combinations.</p>
            </article>

            <article data-a="admin-information">
              <small>05</small>
              <h3>Information</h3>
              <p>Review new information before publication.</p>
            </article>

            <article data-a="admin-certificates">
              <small>06</small>
              <h3>Certificates</h3>
              <p>Review completion and certificate records.</p>
            </article>

            <article data-a="admin-members">
              <small>07</small>
              <h3>Members</h3>
              <p>View member records and learning access.</p>
            </article>

            <article data-a="admin-monitoring">
              <small>08</small>
              <h3>Monitoring</h3>
              <p>Watch traffic, usage and system health.</p>
            </article>

            <article data-a="admin-cleanup">
              <small>09</small>
              <h3>Storage & Cleanup</h3>
              <p>Review unnecessary temporary information.</p>
            </article>

            <article data-a="admin-settings">
              <small>10</small>
              <h3>Settings</h3>
              <p>Manage editable G WORLD settings.</p>
            </article>

          </div>

        </section>

        <section class="admin-status-panel">

          <div class="eyebrow">SYSTEM STATUS</div>

          <h2>GREEN — NORMAL</h2>

          <p>
            Monitoring is designed to conserve free-tier resources
            and protect core G WORLD functions.
          </p>

        </section>

      </main>
    `;
}

function renderAdminPayments() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · PAYMENTS</div>

          <h1>Payment Reviews</h1>

          <p>
            Review manual ₦3,000 payment submissions before unlocking
            paid learning access.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>WAITING</small>
              <h3>Payment Review Queue</h3>

              ${
                state.adminPayments && state.adminPayments.length
                  ? state.adminPayments.map(p => `
                    <div class="setting-row">
                      <span>
                        ${esc(p.full_name || "Member")}
                        · ${esc(p.gworld_id || "")}
                        · ${esc(p.course_title || "")}
                        · ${esc(String(p.status || ""))}
                      </span>

                      ${
                        String(p.status) === "PENDING"
                          ? `<span class="button-row">
                              <button class="primary" data-a="payment-approve" data-payment-id="${esc(p.id)}">
                                APPROVE
                              </button>

                              <button class="secondary" data-a="payment-reject" data-payment-id="${esc(p.id)}">
                                REJECT
                              </button>
                            </span>`
                          : `<strong>${esc(String(p.status || ""))}</strong>`
                      }
                    </div>
                  `).join("")
                  : `<p>
                      Pending payment records will appear here from the
                      G WORLD payment service.
                    </p>`
              }

            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminSupport() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · SUPPORT</div>

          <h1>Support Inbox</h1>

          <p>
            Learner messages are grouped here so the administrator
            can read and respond.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>INBOX</small>
              <h3>G WORLD Support</h3>

              ${
                state.supportMessages && state.supportMessages.length
                  ? state.supportMessages.map(m => `
                    <div class="setting-row">
                      <span>
                        <strong>${esc(m.full_name || "Member")}</strong>
                        · ${esc(m.category || "general")}
                        · ${esc(m.created_at || "")}
                        <br>
                        ${esc(m.message || "")}
                      </span>
                      <strong>${esc(m.status || "OPEN")}</strong>
                    </div>
                  `).join("")
                  : `<p>
                      Messages from members will appear here.
                    </p>`
              }

              <button class="primary" data-a="support-open">
                OPEN INBOX
              </button>

            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminContent() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · LEARNING</div>

          <h1>Learning Content</h1>

          <p>
            Manage reusable courses, lessons, skills, videos,
            questions and projects without rebuilding the learner
            interface.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Courses</h3>
              <p>Add, edit, preview and publish courses.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Tech Skills</h3>
              <p>Manage Python, Excel, SQL and other skills.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Lessons</h3>
              <p>Edit explanations, practice and assessments.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Videos</h3>
              <p>Replace YouTube IDs without changing code.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Questions</h3>
              <p>Manage quizzes and CBT question banks.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Projects</h3>
              <p>Manage practical projects and verification.</p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminJamb() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · JAMB</div>

          <h1>Manage JAMB</h1>

          <p>
            Keep JAMB information current without rebuilding the
            learner-facing pages.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>01</small>
              <h3>New Updates</h3>
              <p>Review newly collected JAMB information.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Existing Information</h3>
              <p>Manage older approved information.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Syllabus</h3>
              <p>Manage subjects and topics.</p>
            </article>

            <article>
              <small>04</small>
              <h3>CBT Questions</h3>
              <p>Manage science, commercial, arts and other questions.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Subject Combinations</h3>
              <p>Update course combinations and verification dates.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Approved Sources</h3>
              <p>Control which sources may feed the update queue.</p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminInformation() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · INFORMATION</div>

          <h1>Information Review Queue</h1>

          <p>
            New information must be reviewed before it becomes
            publicly visible across G WORLD.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">PIPELINE</div>

            <h2>
              Source → Filter → Deduplicate → Review → Approve → Publish
            </h2>

            <p>
              Approved information can appear in multiple G WORLD
              sections without duplicating the underlying record.
            </p>
          </div>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>REVIEW</small>
              <h3>No pending item displayed yet</h3>
              <p>
                The daily information pipeline will populate this
                queue after the backend update service is enabled.
              </p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminCertificates() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · CERTIFICATES</div>

          <h1>Certificate Management</h1>

          <p>
            Certificates remain linked to the member's permanent
            G WORLD identity while each certificate receives its own
            certificate record.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Completion Review</h3>
              <p>Review learner completion.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Certificate Release</h3>
              <p>Approve eligible certificates.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Verification</h3>
              <p>Maintain verification records.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Certificate Template</h3>
              <p>
                The approved G WORLD certificate pattern remains
                consistent across courses.
              </p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminMembers() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · MEMBERS</div>

          <h1>Members</h1>

          <p>
            View members, G WORLD IDs, learning access and
            completion information.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>MEMBERS</small>
              <h3>Member Directory</h3>
              <p>
                Member records are loaded from the G WORLD database.
              </p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminMonitoring() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · MONITORING</div>

          <h1>G WORLD System Health</h1>

          <p>
            Monitor application activity while conserving free-tier
            resources.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Traffic</h3>
              <p>Visitors, sessions and page activity.</p>
            </article>

            <article>
              <small>02</small>
              <h3>API</h3>
              <p>Requests, errors and response behaviour.</p>
            </article>

            <article>
              <small>03</small>
              <h3>D1</h3>
              <p>Database activity and growth.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Storage</h3>
              <p>Temporary files and retained data.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Updates</h3>
              <p>Daily update jobs and review backlog.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Security</h3>
              <p>Suspicious activity and protected routes.</p>
            </article>

          </div>

        </section>

        <section class="admin-status-panel">

          <div class="eyebrow">RESOURCE PROTECTION</div>

          <h2>GREEN — NORMAL</h2>

          <p>
            The application is designed to switch into conservation
            behaviour before optional workloads threaten core services.
          </p>

        </section>

      </main>
    `;
}

function renderAdminCleanup() {
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · STORAGE</div>

          <h1>Storage & Cleanup</h1>

          <p>
            Review information that can safely be removed before
            deleting anything.
          </p>

        </section>

        <section class="doors">

          <div class="grid">

            <article>
              <small>SAFE TO REVIEW</small>
              <h3>Temporary Files</h3>
              <p>Temporary uploads and generated files.</p>
              <button class="secondary" data-a="cleanup-temp">
                REVIEW
              </button>
            </article>

            <article>
              <small>SAFE TO REVIEW</small>
              <h3>Expired Sessions</h3>
              <p>Old authentication sessions.</p>
              <button class="secondary" data-a="cleanup-sessions">
                REVIEW
              </button>
            </article>

            <article>
              <small>SAFE TO REVIEW</small>
              <h3>Technical Logs</h3>
              <p>Old non-essential technical records.</p>
              <button class="secondary" data-a="cleanup-logs">
                REVIEW
              </button>
            </article>

            <article>
              <small>PROTECTED</small>
              <h3>Permanent Information</h3>
              <p>
                Member identity, certificates, published knowledge,
                completion records and important academic records
                are not automatically deleted.
              </p>
            </article>

          </div>

        </section>

      </main>
    `;
}

function renderAdminSettings() {
  const pay = paymentInfo();
  return `
      <main class="home">

        ${adminNav()}

        <section class="hero">

          <div class="eyebrow">ADMIN · SETTINGS</div>

          <h1>G WORLD Settings</h1>

          <p>
            Important operational settings should be editable without
            changing the application code.
          </p>

        </section>

        <section class="panel">

          <form id="settings-form" novalidate>

            <label>
              Payment Amount (₦)
              <input
                name="paymentAmount"
                type="number"
                required
                min="100"
                max="10000000"
                value="${esc(pay.amount)}"
              >
            </label>

            <label>
              Payment Provider
              <input
                name="paymentProvider"
                required
                maxlength="60"
                value="${esc(pay.provider)}"
              >
            </label>

            <label>
              Payment Account Number
              <input
                name="paymentAccountNumber"
                required
                maxlength="30"
                value="${esc(pay.accountNumber)}"
              >
            </label>

            <label>
              Account Name
              <input
                name="paymentAccountName"
                required
                maxlength="120"
                value="${esc(pay.accountName)}"
              >
            </label>

            <small class="form-error"></small>

            <button class="primary full" type="submit">
              SAVE SETTINGS
            </button>

          </form>

          <div class="setting-row">
            <span>Information Freshness</span>
            <strong>24 HOURS</strong>
          </div>

        </section>

      </main>
    `;
}


function adminNav() {
  return navigationHeader(true);
}

document.addEventListener("click", async event => {

  const target = event.target.closest("[data-a], [data-copy], [data-course-combination]");

  if (!target) return;

  const action = target.dataset.a || "";

  if (action === 'nav-menu') {
    const header = target.closest('.site-header');
    const opened = header.classList.toggle('menu-open');
    target.setAttribute('aria-expanded', String(opened));
    target.setAttribute('aria-label', opened ? 'Close navigation menu' : 'Open navigation menu');
    return;
  }
  if (target.classList.contains('site-nav-link')) closeNavigation();

  if (action === "theme") {
    const next =
      document.documentElement.dataset.theme === "light"
        ? "dark"
        : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("gworld-theme", next);
    document.querySelector('meta[name="theme-color"]').content = next === "light" ? "#ffffff" : "#000000";
    return;
  }

  if (action === "new-member") {
    clearError();
    goTo("onboard");
    return;
  }

  if (action === "existing-member") {
    clearError();
    goTo("existing");
    return;
  }

  if (action === "back-entry") {
    clearError();
    state.loading = false;
    state.history = [];
    state.screen = "entry";
    render();
    return;
  }

  if (action === "home") {
    state.history = [];
    state.screen = "home";
    render();
    return;
  }

  if (action === "back") {
    goBack();
    return;
  }

  if (action === "logout") {
    clearSession();
    state.history = [];
    state.screen = "entry";
    render();
    return;
  }

  if (action === "reset") {
    clearSession();
    state.history = [];
    state.screen = "splash";
    render();
    startIntro();
    return;
  }

  if (action === 'filter-faculty') {
    const grid = app.querySelector('#home-faculty-grid');
    if (grid) {
      grid.innerHTML = facultyCards(target.dataset.filter);
      app.querySelectorAll('.faculty-filters button').forEach(button => button.setAttribute('aria-pressed', String(button === target)));
    }
    return;
  }
  if (action.startsWith('faculty-') && FACULTIES.some(faculty => action === `faculty-${faculty.id}`)) {
    goTo(action);
    return;
  }

  if (action === "courses") {
    goTo("courses");
    return;
  }

  if (action === "tech-skills") {
    goTo("tech-skills");
    return;
  }

  if (action === "ai-tech") {
    goTo("ai-tech");
    return;
  }

  if (action === "jamb") {
    goTo("jamb");
    return;
  }

  if (action === "opportunities") {
    goTo("opportunities");
    return;
  }

  if (action === "research") {
    goTo("research");
    return;
  }

  if (action === "academic") {
    goTo("academic");
    return;
  }

  if (action === "project-writer") {
    goTo("project-writer");
    return;
  }

  if (action === "work-ready") {
    goTo("work-ready");
    return;
  }

  if (action === "excel-course") {
    goTo("excel-course");
    return;
  }

  if (action === "python-course") {
    goTo("python-course");
    return;
  }

  if (action === "python-intro") {
    goTo("python-intro");
    return;
  }

  if (action === "python-practice") {
    goTo("python-practice");
    return;
  }

  if (action === "python-answer-correct") {
    showToast(
      "Correct. Python is a programming language used to give instructions to a computer."
    );
    return;
  }

  if (action === "python-answer-wrong") {
    showToast(
      "Not quite. Python is a programming language used to give instructions to a computer."
    );
    return;
  }

  if (action.startsWith("course-")) {
    goTo(action);
    return;
  }

  if (action === "jamb-information") {
    goTo("jamb-information");
    return;
  }

  if (action === "jamb-news") {
    goTo("jamb-news");
    return;
  }

  if (action === "jamb-syllabus") {
    goTo("jamb-syllabus");
    return;
  }

  if (action === "jamb-cbt") {
    goTo("jamb-cbt");
    return;
  }

  if (action === "jamb-combinations") {
    goTo("jamb-combinations");
    return;
  }

  if (action.startsWith("jamb-cbt-")) {
    goTo(action);
    return;
  }

  if (action.startsWith("cbt-start-")) {
    showToast(
      "CBT session structure is ready. Questions will be loaded from the approved G WORLD question bank."
    );
    return;
  }

  if (action === "work-course") {
    goTo("work-course");
    return;
  }

  if (action === "payment") {
    goTo("payment");
    loadSettings(); // Update displayed payment details without resetting an in-flight submission.
    return;
  }

  if (action === "payment-submitted") {
    const button = target;
    button.disabled = true;
    button.textContent = "RECORDING…";

    try {
      await api("/api/payment/submit", {
        method: "POST",
        body: JSON.stringify({
          course: state.selectedCourse?.title || "G WORLD Learning Access"
        })
      });

      state.screen = "payment-status";
      render();

    } catch (error) {
      button.disabled = false;
      button.textContent = "I'VE MADE PAYMENT";
      state.error = error.message;
      render();
    }

    return;
  }

  if (action === "refresh-payment") {
    try {
      const result = await api("/api/payment/status");

      if (result.status === "approved" || result.access) {
        state.screen = "home";
      } else if (result.status === "rejected") {
        state.screen = "payment-rejected";
      } else {
        state.screen = "payment-status";
      }

      render();

    } catch (error) {
      state.error = error.message;
      render();
    }

    return;
  }

  if (action === "support") {
    clearError();
    goTo("support");
    return;
  }

  if (action === "certificate") {
    goTo("certificate");
    return;
  }

  if (action === "admin") {
    goTo("admin");
    return;
  }

  if (action === "admin-payments") {
    goTo("admin-payments");
    loadAdminPayments().then(render);
    return;
  }

  if (action === "admin-support") {
    goTo("admin-support");
    return;
  }

  if (action === "admin-content") {
    goTo("admin-content");
    return;
  }

  if (action === "admin-jamb") {
    goTo("admin-jamb");
    return;
  }

  if (action === "admin-information") {
    goTo("admin-information");
    return;
  }

  if (action === "admin-certificates") {
    goTo("admin-certificates");
    return;
  }

  if (action === "admin-members") {
    goTo("admin-members");
    return;
  }

  if (action === "admin-monitoring") {
    goTo("admin-monitoring");
    return;
  }

  if (action === "admin-cleanup") {
    goTo("admin-cleanup");
    return;
  }

  if (action === "admin-settings") {
    goTo("admin-settings");
    // Do not replace an editable settings form after it has been shown.
    loadSettings();
    return;
  }

  if (action === "admin-logout") {
    // Revoking the admin token also ends its member session; do not leave a
    // signed-in-looking homepage backed by a revoked token.
    clearSession();
    state.history = [];
    state.screen = "entry";
    render();
    return;
  }

  if (action === "payment-approve" || action === "payment-reject") {
    const review = action === "payment-approve" ? "approve" : "reject";
    const paymentId = Number(target.dataset.paymentId || state.selectedPayment?.id || 0);

    if (!paymentId) {
      showToast("Select a payment to review.");
      return;
    }

    try {
      await api("/api/admin/payment/review", {
        method: "POST",
        body: JSON.stringify({
          action: review,
          paymentId
        })
      });

      showToast(review === "approve" ? "Payment approved." : "Payment rejected.");
      state.screen = "admin-payments";
      await loadAdminPayments();
      render();

    } catch (error) {
      state.error = error.message;
      render();
    }

    return;
  }

  if (action === "support-open") {
    try {
      const result = await api("/api/admin/support");
      state.supportMessages = result.messages || [];
      render();
    } catch (error) {
      state.error = error.message;
      render();
    }
    return;
  }

  if (target.dataset.copy) {
    try {
      await navigator.clipboard.writeText(target.dataset.copy);
      target.textContent = "COPIED";
      setTimeout(() => {
        target.textContent = "COPY";
      }, 1500);
    } catch {
      showToast(`Account number: ${target.dataset.copy}`);
    }
    return;
  }

  if (target.dataset.courseCombination) {
    state.selectedCourse = target.dataset.courseCombination;
    goTo("combination-result");
    return;
  }
});

document.addEventListener("submit", async event => {

  if (event.target.id === "f") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    const email = String(data.email || "").trim();
    const password = String(data.password || "");
    const confirm = String(data.confirm || "");

    let valid = true;

    const setError = (field, message) => {
      const element = form.querySelector(
        `[data-error="${field}"]`
      );

      if (element) element.textContent = message;

      if (message) valid = false;
    };

    setError(
      "name",
      name.length < 2
        ? "Please enter your full name."
        : ""
    );

    setError(
      "phone",
      phone.replace(/\D/g, "").length < 7
        ? "Please enter a valid phone number."
        : ""
    );

    setError(
      "email",
      email && !/^\S+@\S+\.\S+$/.test(email)
        ? "Please enter a valid email or leave it blank."
        : ""
    );

    setError(
      "password",
      password.length < 8
        ? "Please choose a password of at least 8 characters."
        : ""
    );

    setError(
      "confirm",
      confirm !== password
        ? "Passwords do not match."
        : ""
    );

    if (!valid) return;

    setFormError(form, "");
    setFormBusy(form, true, "CREATING YOUR G WORLD ID…");

    try {
      const result = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          email,
          password
        })
      });

      if (!result.member?.gworldId || !result.member?.name || !result.token) {
        throw new Error("The G WORLD service returned incomplete account details. Please try again later.");
      }
      saveSession(result.member, result.token);

      state.loading = false;
      state.screen = "card";
      state.history = [];

      render();
      generateMemberQR();

    } catch (error) {
      setFormBusy(form, false);
      setFormError(form, error.message);
    }

    return;
  }

  if (event.target.id === "existing-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    const identifier = String(data.identifier || "").trim();
    const password = String(data.password || "");

    let valid = true;

    const identifierError = form.querySelector(
      '[data-error="existing-identifier"]'
    );

    const passwordError = form.querySelector(
      '[data-error="existing-password"]'
    );

    if (!identifier) {
      identifierError.textContent = "Please enter your registered email or phone number.";
      valid = false;
    } else {
      identifierError.textContent = "";
    }

    if (!password) {
      passwordError.textContent = "Please enter your password.";
      valid = false;
    } else {
      passwordError.textContent = "";
    }

    if (!valid) return;

    setFormError(form, "");
    setFormBusy(form, true, "ENTERING G WORLD…");

    try {
      const result = await api("/api/member-login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password
        })
      });

      if (!result.member?.gworldId || !result.member?.name || !result.token) {
        throw new Error("The G WORLD service returned incomplete account details. Please try again later.");
      }
      saveSession(result.member, result.token);

      state.loading = false;
      state.history = [];

      if (result.isAdmin) {
        state.screen = "admin-gate";
      } else {
        state.screen = "home";
      }

      render();

    } catch (error) {
      setFormBusy(form, false);
      setFormError(
        form,
        error.message ||
          "We could not find a G WORLD account with those details."
      );
    }

    return;
  }

  if (event.target.id === "support-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    const message = String(data.message || "").trim();
    const category = String(data.category || "general");

    if (!message) {
      setFormError(form, "Please enter your message.");
      return;
    }

    setFormError(form, "");
    setFormBusy(form, true, "SENDING…");

    try {
      await api("/api/support", {
        method: "POST",
        body: JSON.stringify({
          category,
          message
        })
      });

      setFormBusy(form, false);
      showToast("Your message has been sent to the G WORLD Team.");
      goTo("home");

    } catch (error) {
      setFormBusy(form, false);
      setFormError(form, error.message);
    }

    return;
  }

  if (event.target.id === "admin-code-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const email = String(data.email || "").trim();
    const code = String(data.code || "");

    if (!email || !code) {
      setFormError(form, "Enter your account email and administrator code.");
      return;
    }

    setFormError(form, "");
    setFormBusy(form, true, "VERIFYING…");

    try {
      const result = await api("/api/admin/verify", {
        method: "POST",
        body: JSON.stringify({
          email,
          code
        })
      });

      // The gate issues an elevated (admin) session token.
      if (result.token) {
        state.token = result.token;
        const saved = JSON.parse(localStorage.getItem("gworld") || "{}");
        saved.token = result.token;
        localStorage.setItem("gworld", JSON.stringify(saved));
      }

      state.admin = result.admin || {
        authenticated: true
      };
      state.history = [];
      state.screen = "admin";
      render();

    } catch (error) {
      setFormBusy(form, false);
      setFormError(
        form,
        error.message || "Administrator verification failed."
      );
    }

    return;
  }

  if (event.target.id === "project-topic-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const topic = String(data.topic || "").trim();

    if (!topic) return;

    state.selectedCourse = {
      title: topic
    };

    showToast(
      "Your project topic has been received. The guided project workflow will continue from here."
    );
    return;
  }

  if (event.target.id === "settings-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    setFormError(form, "");
    setFormBusy(form, true, "SAVING…");

    try {
      const result = await api("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          paymentAmount: data.paymentAmount,
          paymentProvider: data.paymentProvider,
          paymentAccountNumber: data.paymentAccountNumber,
          paymentAccountName: data.paymentAccountName
        })
      });

      state.settings = result.payment;
      setFormBusy(form, false);
      showToast("Settings saved.");

    } catch (error) {
      setFormBusy(form, false);
      setFormError(form, error.message);
    }

    return;
  }
});

document.addEventListener("input", event => {

  if (event.target.id !== "course-search") return;

  const query = event.target.value.toLowerCase().trim();

  document
    .querySelectorAll("[data-course-combination]")
    .forEach(card => {

      const course =
        card.dataset.courseCombination.toLowerCase();

      card.style.display =
        !query || course.includes(query)
          ? ""
          : "none";

    });
});

document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('article[role="button"]')) {
    event.preventDefault();
    event.target.click();
  }
});

function startIntro() {
  setTimeout(async () => {
    try {
      if (localStorage.getItem("gworld-logout-pending")) {
        await api("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("gworld-logout-pending");
        state.member = null;
        state.token = "";
        state.screen = "entry";
        render();
        return;
      }
      const result = await api("/api/me");
      if (!validMember(result.member)) throw new Error("The G WORLD service returned incomplete account details.");
      saveSession(result.member, state.token);
      state.error = "";
    } catch (error) {
      state.member = null;
      state.token = "";
      if (error.status === 401) {
        localStorage.removeItem("gworld");
        state.error = "";
      } else {
        state.error = "We could not verify your session. Check the service connection, then try signing in again.";
      }
    }
    state.screen = state.member ? "home" : "entry";
    render();
  }, 2800);
}

const savedTheme = localStorage.getItem("gworld-theme");
if (savedTheme) {
  document.documentElement.dataset.theme = savedTheme;
  document.querySelector('meta[name="theme-color"]').content = savedTheme === "light" ? "#ffffff" : "#000000";
}

const savedMember = localStorage.getItem("gworld");

// Validate every restored session with /api/me, including cookie-only sessions.
// A name or member ID in localStorage must never bypass sign-in.
state.token = cachedToken(savedMember);

render();
startIntro();
loadSettings();
