import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");
const state = {
  screen: "splash",
  member: null,
  error: "",
  loading: false
};

// Set VITE_API_BASE_URL when the frontend and API are deployed separately.
// Leave it empty when the API is served from the same origin.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

async function generateMemberQR() {
  const canvas = document.querySelector("#member-qr");
  const m = state.member;

  if (!canvas || !m?.gworldId) return;

  const verificationUrl =
    `https://g-world.ogundeyelijah13.workers.dev/verify/${encodeURIComponent(m.gworldId)}`;

  try {
    await QRCode.toCanvas(canvas, verificationUrl, {
      width: 150,
      margin: 2,
      errorCorrectionLevel: "M"
    });
  } catch (error) {
    console.error("QR generation failed", error);
  }
}

function render() {
  if (state.screen === "splash") {
    app.innerHTML = `
      <main class="intro" aria-label="Entering G WORLD">
        <div class="intro-glow"></div>
        <img
          class="master-logo"
          src="/assets/gworld-master-logo.png"
          alt="G WORLD — Discover What You Need to Know."
        >
        <div class="intro-line"></div>
        <div class="intro-status">ENTERING G WORLD</div>
      </main>`;
    return;
  }

  if (state.screen === "entry") {
    app.innerHTML = `
      <main class="center enter-screen">
        <section class="panel">
          <div class="form-brand">
            <span>G</span><b>G WORLD</b>
          </div>

          <div class="eyebrow">WELCOME TO G WORLD</div>

          <h1>How would you like to enter?</h1>

          <p>
            Start a new G WORLD journey or continue with your existing G WORLD account.
          </p>

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
      </main>`;
    return;
  }

  if (state.screen === "onboard") {
    app.innerHTML = `
      <main class="center enter-screen">
        <section class="panel">
          <div class="form-brand">
            <span>G</span><b>G WORLD</b>
          </div>

          <div class="eyebrow">NEW MEMBER</div>

          <h1>Start your journey.</h1>

          <p>
            Enter your basic details. Your G WORLD ID and digital member card
            will be created automatically.
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
              <small class="field-error" data-error="email"></small>
            </label>

            <small class="form-error" id="form-error">
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
            Your G WORLD ID is a platform identity. It is not a government ID or password.
          </small>

          <div class="form-footnote">
            Your details are submitted securely to the G WORLD registration service.
          </div>
        </section>
      </main>`;
    return;
  }

  if (state.screen === "existing") {
    app.innerHTML = `
      <main class="center enter-screen">
        <section class="panel">
          <div class="form-brand">
            <span>G</span><b>G WORLD</b>
          </div>

          <div class="eyebrow">EXISTING MEMBER</div>

          <h1>Welcome back.</h1>

          <p>
            Enter the name and email connected to your G WORLD account.
          </p>

          <form id="existing-form" novalidate>
            <label>
              Full Name
              <input
                name="name"
                required
                autocomplete="name"
                placeholder="Your full name"
                maxlength="80"
              >
              <small class="field-error" data-error="existing-name"></small>
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autocomplete="email"
                placeholder="you@example.com"
                maxlength="120"
              >
              <small class="field-error" data-error="existing-email"></small>
            </label>

            <small class="form-error" id="existing-form-error">
              ${esc(state.error)}
            </small>

            <button
              class="primary full"
              type="submit"
              ${state.loading ? "disabled" : ""}
            >
              ${state.loading ? "ENTERING G WORLD…" : "ENTER G WORLD"}
            </button>
          </form>

          <button class="link" data-a="back-entry">
            ← Back
          </button>

          <div class="form-footnote">
            Use the same name and email you used when joining G WORLD.
          </div>
        </section>
      </main>`;
    return;
  }

  if (state.screen === "card") {
    const m = state.member;

    app.innerHTML = `
      <main class="center">
        <div class="card">
          <header>
            <div class="mini">
              <b>G</b>
              <span>
                <strong>G WORLD</strong>
                <small>Discover What You Need to Know.</small>
              </span>
            </div>
          </header>

          <section>
            <em>WELCOME TO G WORLD</em>
            <h2>${esc(m.name)}</h2>

            <div class="info">
              <div>
                <small>PHONE</small>
                <strong>${esc(m.phone)}</strong>
              </div>

              <div>
                <small>STATUS</small>
                <strong>${esc(m.status)}</strong>
              </div>

              <div>
                <small>G WORLD ID</small>
                <strong>${esc(m.gworldId)}</strong>
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
      </main>`;
    return;
  }

  if (state.screen === "home") {
    const m = state.member;

    app.innerHTML = `
      <main class="home">
<nav>
  <div class="mini">
    <b>G</b> G WORLD
  </div>

  <div class="nav-user">
    <span>${esc(m.name)}</span>
    <button class="logout-btn" data-a="logout">LOG OUT</button>
  </div>
</nav>

        <section class="hero">
          <div class="eyebrow">G WORLD</div>

          <h1>Discover what you need to know.</h1>

          <p>
            Useful knowledge. Clear learning. Practical growth.
          </p>

          <button class="primary">
            TALK TO G WORLD
          </button>
        </section>

        <section class="continue">
          <div>
            <div class="eyebrow">YOUR G WORLD</div>

            <h2>Welcome back, ${esc(m.name)}.</h2>

            <p>
              Your learning journey is ready for the next phase.
            </p>
          </div>

          <code>${esc(m.gworldId)}</code>
        </section>

        <section class="doors">
          <h2>Explore G WORLD</h2>

          <div class="grid">
            ${[
              "Courses",
              "Tech Skills",
              "AI & Technology",
              "Opportunities",
              "Discoveries & Research",
              "Project Writer",
              "Academic Resources",
              "Work Ready"
            ].map((x, i) => `
             <article class="${x === "Courses" ? "course-door" : ""}" data-a="${x === "Courses" ? "courses" : ""}" style="${x === "Courses" ? "cursor:pointer" : ""}">
                <small>0${i + 1}</small>
                <h3>${x}</h3>
                <p>
                  ${i
                    ? "Prepared for a future G WORLD module."
                    : "Learning pathways will open in Phase 2."}
                </p>
              </article>
            `).join("")}
          </div>
        </section>

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>
</main>`;
  }

  if (state.screen === "python-course") {
    app.innerHTML = `
      <main class="home">
        <nav>
          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <div class="nav-user">
            <span>${esc(state.member?.name)}</span>
            <button class="logout-btn" data-a="logout">LOG OUT</button>
          </div>
        </nav>

        <section class="hero">
          <div class="eyebrow">PYTHON FOUNDATIONS · MODULE 1</div>

          <h1>Python Foundations</h1>

          <p>
            Start from the beginning. Understand the basics, practise what
            you learn, and build something you can explain.
          </p>
        </section>

        <section class="doors">
          <h2>Your Learning Journey</h2>

          <div class="grid">
            <article data-a="python-intro">
  <small>01</small>
  <h3>Introduction to Python</h3>
  <p>
    Understand what Python is, where it is used, and why it matters.
  </p>
</article>

            <article>
              <small>02</small>
              <h3>Variables & Data Types</h3>
              <p>Learn how Python stores and works with information.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Input & Output</h3>
              <p>Learn how programs receive information and respond.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Type Conversion</h3>
              <p>Understand how to change information from one type to another.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Combining Everything</h3>
              <p>Bring the concepts together in simple programs.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Mini Practice</h3>
              <p>Test your understanding with practical exercises.</p>
            </article>

            <article>
              <small>07</small>
              <h3>Module Project</h3>
              <p>Build your Personal Profile Program.</p>
            </article>

            <article>
              <small>08</small>
              <h3>Project Defence</h3>
              <p>Explain what you built and why you built it that way.</p>
            </article>
          </div>
        </section>

        <section class="continue">
          <div>
            <div class="eyebrow">MODULE PROJECT</div>

            <h2>Personal Profile Program</h2>

            <p>
              Build a simple Python program that asks for your name, age,
              location, favourite skill and learning goal.
            </p>
          </div>

          <code>MODULE 1</code>
        </section>

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>
      </main>`;
  }

  if (state.screen === "courses") {
    app.innerHTML = `
      <main class="home">
        <nav>
          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <div class="nav-user">
            <span>${esc(state.member?.name)}</span>
            <button class="logout-btn" data-a="logout">LOG OUT</button>
          </div>
        </nav>

        <section class="hero">
          <div class="eyebrow">COURSES</div>

          <h1>Learn something that moves you forward.</h1>

          <p>
            Explore structured learning journeys designed to help you
            understand, practise, build and prove what you know.
          </p>
        </section>

        <section class="doors">
          <h2>Featured Course</h2>

          <div class="grid">
            <article data-a="python-course">
              <small>01</small>
              <h3>Python Foundations</h3>
              <p>
                Start learning Python from the foundations through
                explanation, practice, projects and verification.
              </p>
            </article>
          </div>
        </section>

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>
</main>`;
  }

  if (state.screen === "python-course") {
    app.innerHTML = `
      <main class="home">
        <nav>
          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <div class="nav-user">
            <span>${esc(state.member?.name)}</span>
            <button class="logout-btn" data-a="courses">BACK TO COURSES</button>
          </div>
        </nav>

        <section class="hero">
          <div class="eyebrow">PYTHON FOUNDATIONS</div>

          <h1>Start learning Python.</h1>

          <p>
            Learn Python step by step, from the foundations to practical
            projects and verification.
          </p>
        </section>

        <section class="doors">
          <h2>Course Overview</h2>

          <div class="grid">
            <article>
              <small>01</small>
              <h3>Introduction to Python</h3>
              <p>
                Understand what Python is, what it can do, and where it is
                used.
              </p>
            </article>

            <article>
              <small>02</small>
              <h3>Python Basics</h3>
              <p>
                Learn variables, data types, operators and basic Python
                instructions.
              </p>
            </article>

            <article>
              <small>03</small>
              <h3>Practice</h3>
              <p>
                Test what you have learned with simple exercises.
              </p>
            </article>
          </div>
        </section>

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>
      </main>`;
  }
}
if (state.screen === "python-intro") {
    app.innerHTML = `
      <main class="home">
        <nav>
          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <div class="nav-user">
            <span>${esc(state.member?.name)}</span>
            <button class="logout-btn" data-a="logout">LOG OUT</button>
          </div>
        </nav>

        <section class="hero">
          <div class="eyebrow">PYTHON FOUNDATIONS · LESSON 1</div>

          <h1>Introduction to Python</h1>

          <p>
            Before writing code, let's understand what Python is,
            where it is used, and why people use it.
          </p>
        </section>

        <section class="continue">
          <div>
            <div class="eyebrow">KNOW</div>

            <h2>What is Python?</h2>

            <p>
              Python is a programming language that allows people
              to give instructions to a computer in a way that is
              relatively easy to read and understand.
            </p>

            <p>
              It is used for many things, including automation,
              data analysis, web development, artificial intelligence,
              research and software development.
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
                Just as people use languages to communicate,
                programmers use Python to communicate instructions
                to computers.
              </p>
            </article>

            <article>
              <small>02</small>
              <h3>Python is readable</h3>
              <p>
                Python was designed with readability in mind,
                making it a useful language for beginners.
              </p>
            </article>

            <article>
              <small>03</small>
              <h3>Python can build things</h3>
              <p>
                You can use Python to solve problems, automate tasks,
                analyse information and build useful programs.
              </p>
            </article>
          </div>
        </section>

        <section class="continue">
          <div>
            <div class="eyebrow">PRACTICE</div>

            <h2>Think about this</h2>

            <p>
              If Python is a language used to communicate with a
              computer, what do you think a Python program is?
            </p>
          </div>

          <button class="primary">
            CONTINUE
          </button>
        </section>

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>
      </main>`;
  }
document.addEventListener("click", e => {
  const a = e.target.closest("[data-a]")?.dataset.a;

  if (a === "new-member") {
    state.error = "";
    state.screen = "onboard";
    render();
  }

  if (a === "existing-member") {
    state.error = "";
    state.screen = "existing";
    render();
  }

  if (a === "back-entry") {
    state.error = "";
    state.loading = false;
    state.screen = "entry";
    render();
  }

  if (a === "home") {
    state.screen = "home";
    render();
  }
  if (a === "courses") {
  state.screen = "courses";
  render();
}
  if (a === "python-course") {
  state.screen = "python-course";
  render();
}
  if (a === "python-intro") {
  state.screen = "python-intro";
  render();
}
if (a === "logout") {
  localStorage.removeItem("gworld");
  state.member = null;
  state.error = "";
  state.loading = false;
  state.screen = "entry";
  render();
}
  if (a === "reset") {
    localStorage.removeItem("gworld");
    state.member = null;
    state.error = "";
    state.screen = "splash";
    render();
    startIntro();
  }
});

document.addEventListener("submit", async e => {
  if (e.target.id !== "f") return;

  e.preventDefault();

  const form = e.target;
  const d = Object.fromEntries(new FormData(form));

  const name = String(d.name || "").trim();
  const phone = String(d.phone || "").trim();
  const email = String(d.email || "").trim();

  let ok = true;

  const setErr = (field, message) => {
    const el = form.querySelector(`[data-error="${field}"]`);

    if (el) el.textContent = message || "";

    if (message) ok = false;
  };

  setErr(
    "name",
    name.length < 2 ? "Please enter your full name." : ""
  );

  setErr(
    "phone",
    phone.replace(/\D/g, "").length < 7
      ? "Please enter a valid phone number."
      : ""
  );

  setErr(
    "email",
    email && !/^\S+@\S+\.\S+$/.test(email)
      ? "Please enter a valid email or leave it blank."
      : ""
  );

  if (!ok) return;

  state.loading = true;
  state.error = "";

  render();

  try {
    const response = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        phone,
        email
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      state.error =
        result.error ||
        "Registration could not be completed. Please try again.";

      state.loading = false;
      render();
      return;
    }

    state.member = result.member;

    localStorage.setItem(
      "gworld",
      JSON.stringify(state.member)
    );

    state.loading = false;
    state.error = "";
    state.screen = "card";

    render();
    generateMemberQR();

  } catch (error) {
    console.error(error);

    state.error =
      "G WORLD could not connect to the registration service. Please check the connection and try again.";

    state.loading = false;
    render();
  }
});

document.addEventListener("submit", async e => {
  if (e.target.id !== "existing-form") return;

  e.preventDefault();

  const form = e.target;
  const d = Object.fromEntries(new FormData(form));

  const name = String(d.name || "").trim();
  const email = String(d.email || "").trim();

  let ok = true;

  const nameError = form.querySelector(
    '[data-error="existing-name"]'
  );

  const emailError = form.querySelector(
    '[data-error="existing-email"]'
  );

  if (name.length < 2) {
    nameError.textContent = "Please enter your full name.";
    ok = false;
  } else {
    nameError.textContent = "";
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    emailError.textContent = "Please enter a valid email.";
    ok = false;
  } else {
    emailError.textContent = "";
  }

  if (!ok) return;

  state.loading = true;
  state.error = "";

  render();

  try {
    const response = await fetch(`${API_BASE}/api/member-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok) {
      state.error =
        result.error ||
        "We could not find a G WORLD account with those details.";

      state.loading = false;
      render();
      return;
    }

    state.member = result.member;

    localStorage.setItem(
      "gworld",
      JSON.stringify(state.member)
    );

    state.loading = false;
    state.error = "";
    state.screen = "home";

    render();

  } catch (error) {
    console.error(error);

    state.error =
      "G WORLD could not connect to the member service. Please try again.";

    state.loading = false;
    render();
  }
});

function startIntro() {
  setTimeout(() => {
    if (state.member) {
      state.screen = "home";
    } else {
      state.screen = "entry";
    }

    render();
  }, 2800);
}

const saved = localStorage.getItem("gworld");

if (saved) {
  try {
    state.member = JSON.parse(saved);
  } catch {
    localStorage.removeItem("gworld");
  }
}

render();
startIntro();
