import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");

const state = {
  screen: "splash",
  history: [],
  member: null,
  error: "",
  loading: false
};

function goTo(screen) {
  if (state.screen === screen) return;

  const excludedScreens = ["splash", "entry", "card"];

  if (!excludedScreens.includes(state.screen)) {
    state.history.push(state.screen);
  }

  state.screen = screen;
  render();

  state.screen = screen;
render();

requestAnimationFrame(() => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto"
  });
});
}

function goBack() {
  if (!state.history.length) return;

  const previousScreen = state.history.pop();

  state.screen = previousScreen;
  render();
}

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
  window.scrollTo({
  top: 0,
  left: 0,
  behavior: "auto"
});

  function backButton() {
    if (!state.history.length) return "";

    return `
      <button class="link" data-a="back">
        ← Back
      </button>
    `;
  }

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

  if (state.screen === "courses") {
    app.innerHTML = `
      <main class="home">
      ${backButton()}
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
      ${backButton()}
        <nav>
          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <div class="nav-user">
            <span>${esc(state.member?.name)}</span>
            <button class="logout-btn" data-a="back">BACK TO COURSES</button>
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
          <article data-a="python-intro">
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

  if (state.screen === "python-intro") {
  app.innerHTML = `
    <main class="home">
      ${backButton()}

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
            A programming language gives us a way to communicate
            instructions to a computer.
          </p>

          <p>
            Python is one of the programming languages people use
            to solve problems, automate tasks, analyse information,
            build software and create technology.
          </p>
        </div>
      </section>

      <section class="doors">
        <h2>Where is Python used?</h2>

        <div class="grid">
          <article>
            <small>01</small>
            <h3>Automation</h3>
            <p>
              Python can be used to automate repetitive tasks,
              helping people complete work more efficiently.
            </p>
          </article>

          <article>
            <small>02</small>
            <h3>Data</h3>
            <p>
              Python can help people work with, analyse and
              understand large amounts of information.
            </p>
          </article>

          <article>
            <small>03</small>
            <h3>Artificial Intelligence</h3>
            <p>
              Python is widely used in artificial intelligence
              and machine learning projects.
            </p>
          </article>

          <article>
            <small>04</small>
            <h3>Software Development</h3>
            <p>
              Python can be used to create useful programs,
              applications and other software systems.
            </p>
          </article>
        </div>
      </section>

      <section class="continue">
        <div>
          <div class="eyebrow">UNDERSTAND</div>

          <h2>Think of Python as a language</h2>

          <p>
            Imagine you want a person to perform a task.
            You need to communicate what you want them to do.
          </p>

          <p>
            Computers also need instructions. Python gives us
            a way to write those instructions in a form that
            people can read and computers can execute.
          </p>

          <p>
            So, when you write Python code, you are giving
            instructions to a computer.
          </p>
        </div>
      </section>

      <section class="doors">
        <h2>Three Things to Remember</h2>

        <div class="grid">
          <article>
            <small>01</small>
            <h3>Python is a programming language</h3>
            <p>
              It provides a way for humans to give instructions
              to computers.
            </p>
          </article>

          <article>
            <small>02</small>
            <h3>Python is readable</h3>
            <p>
              Its syntax was designed to be relatively clear
              and readable, which makes it approachable for beginners.
            </p>
          </article>

          <article>
            <small>03</small>
            <h3>Python solves problems</h3>
            <p>
              Python can be used to automate work, analyse data,
              build software and create technology.
            </p>
          </article>
        </div>
      </section>

      <section class="continue">
        <div>
          <div class="eyebrow">PRACTICE</div>

          <h2>Ready to test your understanding?</h2>

          <p>
            Before we continue, let's see whether you understand
            the most important idea from this lesson.
          </p>
        </div>

        <button class="primary" data-a="python-practice">
          START PRACTICE →
        </button>
      </section>

      <footer>
        G WORLD · Discover What You Need to Know.
      </footer>
    </main>`;
}

  if (state.screen === "python-practice") {
  app.innerHTML = `
    <main class="home">
      ${backButton()}

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
        <div class="eyebrow">PYTHON FOUNDATIONS · PRACTICE</div>

        <h1>Let's see what you understand.</h1>

        <p>
          Take a moment to think about what you have just learned.
          There is no pressure to get it right the first time.
        </p>
      </section>

      <section class="continue">
        <div>
          <div class="eyebrow">QUESTION 1</div>

          <h2>What is Python?</h2>

          <p>
            Choose the answer that best explains what Python is.
          </p>
        </div>
      </section>

      <section class="doors">
        <div class="grid">

         <article data-a="python-answer-wrong">
  <h3>A</h3>
  <p>
    A type of computer hardware.
  </p>
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
  <p>
    A social media platform.
  </p>
</article>

<article data-a="python-answer-wrong">
  <h3>D</h3>
  <p>
    An operating system.
  </p>
</article>

<div id="python-feedback" class="python-feedback"></div>
</div>
      </section>
      
      <footer>
        G WORLD · Discover What You Need to Know.
      </footer>
    </main>`;
  }
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
  goTo("home");
}

if (a === "courses") {
  goTo("courses");
}

if (a === "python-course") {
  goTo("python-course");
}

if (a === "python-intro") {
  goTo("python-intro");
}

if (a === "python-practice") {
  goTo("python-practice");
}

  if (a === "python-continue") {
  goTo("python-course");
}
  if (a === "python-try-again") {
  const feedback = document.querySelector("#python-feedback");

  if (feedback) {
    feedback.innerHTML = "";
  }
}
console.log("Python answer click detected:", a);
  
  if (a === "python-answer-correct" || a === "python-answer-wrong") {
  const feedback = document.querySelector("#python-feedback");

  if (feedback) {
    if (a === "python-answer-correct") {
      feedback.innerHTML = `
        <div class="feedback-card">
          <h3>✓ Correct!</h3>
          <p>Well done.</p>
          <p>
            Python is a programming language used to give
            instructions to a computer.
          </p>
          <button type="button" class="logout-btn" data-a="python-continue">
  CONTINUE →
</button>
        </div>
      `;

      feedback.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    } else {
      feedback.innerHTML = `
        <div class="feedback-card">
          <h3>↻ Not quite</h3>
          <p>That's not the correct answer.</p>
          <p>Let's look at it again.</p>
          <p>
            Python is a programming language used to give
            instructions to a computer.
          </p>
          <button type="button" class="logout-btn" data-a="python-try-again">TRY AGAIN</button>
        </div>
      `;

      feedback.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
    }
  }

if (a === "back") {
  goBack();
}

if (a === "logout") {
  localStorage.removeItem("gworld");
  state.member = null;
  state.error = "";
  state.loading = false;
  state.history = [];
  state.screen = "entry";
  render();
}

  if (a === "reset") {
  localStorage.removeItem("gworld");
  state.member = null;
  state.error = "";
  state.loading = false;
  state.history = [];
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
