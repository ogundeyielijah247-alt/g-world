// G WORLD — MAIN.JS
// Complete frontend foundation for:
// Member access • Courses • Tech Skills • AI & Technology • JAMB • Work Ready
// Payments • Support • Certificates • Admin entry • New/Existing Information
// Free-tier conscious architecture

import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const state = {
  screen: "splash",
  history: [],
  member: null,
  error: "",
  loading: false,
  data: null,
  supportMessages: [],
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

function clearError() {
  state.error = "";
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.ok === false) {
    throw new Error(result.error || "G WORLD request failed.");
  }

  return result;
}

async function generateMemberQR() {
  const canvas = document.querySelector("#member-qr");
  const member = state.member;

  if (!canvas || !member?.gworldId) return;

  const verificationURL =
    `https://g-world.ogundeyelijah13.workers.dev/verify/${encodeURIComponent(member.gworldId)}`;

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
            <div class="certificate-g-mark">G</div>
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
              <b>G</b>
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

function commonNav(back = true) {
  return `
    ${back && state.history.length ? `
      <button class="link page-back" data-a="back">← Back</button>
    ` : ""}

    <nav>
      <div class="mini">
        <b>G</b> G WORLD
      </div>

      <div class="nav-user">
        <span>${esc(state.member?.name || "")}</span>
        <button class="logout-btn" data-a="logout">LOG OUT</button>
      </div>
    </nav>
  `;
}

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
      </main>
    `;
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
            Start a new G WORLD journey or continue with your existing
            G WORLD account.
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
      </main>
    `;
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
            Enter the details connected to your G WORLD account.
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
              <small class="field-error"
                data-error="existing-name"></small>
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
              <small class="field-error"
                data-error="existing-email"></small>
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
    return;
  }

  if (state.screen === "card") {
    const member = state.member;

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

    generateMemberQR();
    return;
  }

  if (state.screen === "home") {
    const m = state.member;

    app.innerHTML = `
      <main class="home">

        ${commonNav(false)}

        <section class="hero">

          <div class="eyebrow">G WORLD</div>

          <h1>Discover what you need to know.</h1>

          <p>
            Useful knowledge. Clear learning. Practical growth.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">YOUR G WORLD</div>

            <h2>Welcome back, ${esc(m.name)}.</h2>

            <p>
              Your learning journey is ready for the next step.
            </p>
          </div>

          <code>${esc(m.gworldId)}</code>

        </section>

        <section class="doors">

          <h2>Explore G WORLD</h2>

          <div class="grid">

            <article data-a="courses">
              <small>01</small>
              <h3>Courses</h3>
              <p>
                Structured academic and professional learning.
              </p>
            </article>

            <article data-a="tech-skills">
              <small>02</small>
              <h3>Tech Skills</h3>
              <p>
                Learn practical digital and technology skills.
              </p>
            </article>

            <article data-a="ai-tech">
              <small>03</small>
              <h3>AI & Technology</h3>
              <p>
                Keep up with important technology developments.
              </p>
            </article>

            <article data-a="jamb">
              <small>04</small>
              <h3>JAMB</h3>
              <p>
                JAMB information, syllabus, CBT and subject combinations.
              </p>
            </article>

            <article data-a="opportunities">
              <small>05</small>
              <h3>Opportunities</h3>
              <p>
                Discover useful opportunities and pathways.
              </p>
            </article>

            <article data-a="research">
              <small>06</small>
              <h3>Discoveries & Research</h3>
              <p>
                Research, discoveries and important developments.
              </p>
            </article>

            <article data-a="project-writer">
              <small>07</small>
              <h3>Project Writer</h3>
              <p>
                Understand and build your academic project step by step.
              </p>
            </article>

            <article data-a="academic">
              <small>08</small>
              <h3>Academic Resources</h3>
              <p>
                Useful academic resources and study support.
              </p>
            </article>

            <article data-a="work-ready">
              <small>09</small>
              <h3>Work Ready</h3>
              <p>
                Learn the skills, habits and knowledge needed for work.
              </p>
            </article>

            <article data-a="support">
              <small>10</small>
              <h3>G WORLD Support</h3>
              <p>
                Reach out when you need help.
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
    return;
  }

  if (state.screen === "courses") {
    app.innerHTML = `
      <main class="home">

        ${commonNav()}

        <section class="hero">
          <div class="eyebrow">COURSES</div>

          <h1>Learn something that moves you forward.</h1>

          <p>
            Structured learning journeys that help you understand,
            practise, apply, build and verify what you know.
          </p>
        </section>

        <section class="doors">

          <h2>Available Courses</h2>

          <div class="grid">

            <article data-a="course-accounting">
              <small>01</small>
              <h3>Accounting</h3>
              <p>
                Understand accounting from the foundations through
                practical learning and application.
              </p>
            </article>

            <article data-a="course-economics">
              <small>02</small>
              <h3>Economics</h3>
              <p>
                Build a clear understanding of economic principles.
              </p>
            </article>

            <article data-a="course-business">
              <small>03</small>
              <h3>Business Administration</h3>
              <p>
                Learn the principles behind organisations and business.
              </p>
            </article>

            <article data-a="course-finance">
              <small>04</small>
              <h3>Finance</h3>
              <p>
                Learn financial concepts and practical applications.
              </p>
            </article>

            <article data-a="course-marketing">
              <small>05</small>
              <h3>Marketing</h3>
              <p>
                Understand customers, markets and marketing practice.
              </p>
            </article>

            <article data-a="course-research">
              <small>06</small>
              <h3>Research Methodology</h3>
              <p>
                Learn how to understand, design and conduct research.
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
    return;
  }

  if (state.screen.startsWith("course-")) {
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
          "Learn how financial decisions are understood, analysed and applied.",
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

    const course = courseMap[state.screen] || courseMap["course-accounting"];
    state.selectedCourse = course;

    app.innerHTML = `
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

        <section class="payment-preview">

          <div class="eyebrow">FULL ACCESS</div>

          <h2>Unlock the complete ${esc(course.title)} learning journey.</h2>

          <p>
            Your one-time G WORLD access includes structured lessons,
            practice, assessments, projects and certificate eligibility
            after completion and review.
          </p>

          <div class="price">${naira(PAYMENT.amount)}</div>

          <small>ONE-TIME PAYMENT</small>

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
    return;
  }

  if (state.screen === "tech-skills") {
    app.innerHTML = `
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

            <article>
              <small>02</small>
              <h3>Excel</h3>
              <p>Practical spreadsheet skills.</p>
            </article>

            <article>
              <small>03</small>
              <h3>SQL</h3>
              <p>Understand and work with databases.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Data Analysis</h3>
              <p>Turn information into useful insights.</p>
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
    return;
  }

  if (state.screen === "python-course") {
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

    app.innerHTML = `
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
            UNLOCK FOR ${naira(3000)}
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
    return;
  }

  if (state.screen === "python-intro") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "python-practice") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "ai-tech") {
    app.innerHTML = `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">AI & TECHNOLOGY</div>

          <h1>What is happening now?</h1>

          <p>
            Important technology information is reviewed and updated
            regularly so G WORLD does not remain static.
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
              <p>Useful tools and what they are designed to do.</p>
            </article>

            <article>
              <small>02</small>
              <h3>AI Research</h3>
              <p>Important developments and research.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Technology</h3>
              <p>Important technology developments.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
    return;
  }

  if (state.screen === "jamb") {
    app.innerHTML = `
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
    return;
  }

  if (
    state.screen === "jamb-information" ||
    state.screen === "jamb-news"
  ) {
    const title =
      state.screen === "jamb-information"
        ? "JAMB Information"
        : "JAMB News";

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "jamb-syllabus") {
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

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "jamb-cbt") {
    app.innerHTML = `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">JAMB CBT</div>

          <h1>Choose your practice area.</h1>

          <p>
            G WORLD can use an approved question bank to generate
            different practice sets without calling AI for every student.
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
    return;
  }

  if (
    state.screen === "jamb-cbt-science" ||
    state.screen === "jamb-cbt-commercial" ||
    state.screen === "jamb-cbt-arts" ||
    state.screen === "jamb-cbt-general"
  ) {
    const labels = {
      "jamb-cbt-science": "SCIENCE",
      "jamb-cbt-commercial": "COMMERCIAL",
      "jamb-cbt-arts": "ARTS",
      "jamb-cbt-general": "OTHER SUBJECTS"
    };

    app.innerHTML = `
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
              <p>Quick practice.</p>
            </article>

            <article data-a="cbt-start-20">
              <small>02</small>
              <h3>20 Questions</h3>
              <p>Standard practice.</p>
            </article>

            <article data-a="cbt-start-40">
              <small>03</small>
              <h3>40 Questions</h3>
              <p>Extended practice.</p>
            </article>

            <article data-a="cbt-start-full">
              <small>04</small>
              <h3>Full CBT</h3>
              <p>Long-form practice.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

        <footer>
          G WORLD · Discover What You Need to Know.
        </footer>

      </main>
    `;
    return;
  }

  if (state.screen === "jamb-combinations") {
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

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "combination-result") {
    const course = state.selectedCourse || "Selected Course";

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "work-ready") {
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

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "work-course") {
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

    app.innerHTML = `
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

          <div class="price">${naira(3000)}</div>

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
    return;
  }

  if (state.screen === "payment") {
    const course = state.selectedCourse || {
      title: "G WORLD Learning Access"
    };

    app.innerHTML = `
      <main class="home">

        ${commonNav()}

        <section class="payment-shell">

          <div class="payment-brand">
            <div class="eyebrow">G WORLD LEARNING ACCESS</div>

            <h1>Complete your payment</h1>

            <p>
              This is a one-time payment of ${naira(PAYMENT.amount)}.
            </p>
          </div>

          <div class="payment-card">

            <div class="payment-card-top">
              <span>ONE-TIME ACCESS</span>
              <strong>${naira(PAYMENT.amount)}</strong>
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
                <strong>${esc(PAYMENT.provider)}</strong>
              </div>

              <div class="account-row">
                <span>Account Name</span>
                <strong>${esc(PAYMENT.accountName)}</strong>
              </div>

              <div class="account-row">
                <span>Account Number</span>

                <strong>
                  ${esc(PAYMENT.accountNumber)}

                  <button
                    class="small-action"
                    type="button"
                    data-copy="${esc(PAYMENT.accountNumber)}"
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
    return;
  }

  if (state.screen === "payment-status") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "payment-rejected") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "support") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "certificate") {
    const course = state.selectedCourse || {
      title: "G WORLD Course"
    };

    app.innerHTML = `
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
    return;
  }

  if (state.screen === "project-writer") {
    app.innerHTML = `
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
              <p>Understand what your topic is asking.</p>
            </article>

            <article>
              <small>02</small>
              <h3>Chapter One</h3>
              <p>Build the introduction and research problem.</p>
            </article>

            <article>
              <small>03</small>
              <h3>Chapter Two</h3>
              <p>Build the literature review.</p>
            </article>

            <article>
              <small>04</small>
              <h3>Chapter Three</h3>
              <p>Build the methodology.</p>
            </article>

            <article>
              <small>05</small>
              <h3>Chapter Four</h3>
              <p>Understand analysis and presentation.</p>
            </article>

            <article>
              <small>06</small>
              <h3>Chapter Five</h3>
              <p>Build conclusions and recommendations.</p>
            </article>

          </div>

        </section>

        ${supportButton()}

      </main>
    `;
    return;
  }

  if (
    state.screen === "opportunities" ||
    state.screen === "research" ||
    state.screen === "academic"
  ) {
    const titles = {
      opportunities: "Opportunities",
      research: "Discoveries & Research",
      academic: "Academic Resources"
    };

    app.innerHTML = `
      <main class="home">

        ${commonNav()}

        <section class="hero">

          <div class="eyebrow">G WORLD</div>

          <h1>${titles[state.screen]}</h1>

          <p>
            Important information is organised centrally and surfaced
            in the section where it is useful.
          </p>

        </section>

        <section class="continue">

          <div>
            <div class="eyebrow">NEW UPDATES</div>

            <h2>Current information</h2>

            <p>
              Newly approved information appears first, while older
              information remains available under Existing Information.
            </p>
          </div>

        </section>

        <section class="doors">

          <h2>Existing Information</h2>

          <div class="grid">

            <article>
              <small>01</small>
              <h3>Information Library</h3>
              <p>
                Previously approved information remains accessible.
              </p>
            </article>

          </div>

        </section>

        ${supportButton()}

      </main>
    `;
    return;
  }

  if (state.screen === "admin-gate") {
    app.innerHTML = `
      <main class="center enter-screen">

        <section class="panel admin-gate">

          <div class="form-brand">
            <span>G</span><b>G WORLD</b>
          </div>

          <div class="eyebrow">SECURITY CHECK</div>

          <h1>Additional verification required.</h1>

          <p>
            Your administrator identity has been recognised.
            Enter your private administrator access code.
          </p>

          <form id="admin-code-form">

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
    return;
  }

  if (state.screen === "admin") {
    app.innerHTML = `
      <main class="home admin-home">

        <nav>

          <div class="mini">
            <b>G</b> G WORLD ADMIN
          </div>

          <div class="nav-user">
            <span>ADMIN</span>
            <button class="logout-btn" data-a="admin-logout">
              LOG OUT
            </button>
          </div>

        </nav>

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
    return;
  }

  if (state.screen === "admin-payments") {
    app.innerHTML = `
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
              <p>
                Pending payment records will appear here from the
                G WORLD payment service.
              </p>

              <div class="button-row">
                <button class="primary" data-a="payment-approve">
                  APPROVE
                </button>

                <button class="secondary" data-a="payment-reject">
                  REJECT
                </button>
              </div>
            </article>

          </div>

        </section>

      </main>
    `;
    return;
  }

  if (state.screen === "admin-support") {
    app.innerHTML = `
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

              <p>
                Messages from members will appear here.
              </p>

              <button class="primary" data-a="support-open">
                OPEN INBOX
              </button>

            </article>

          </div>

        </section>

      </main>
    `;
    return;
  }

  if (state.screen === "admin-content") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-jamb") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-information") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-certificates") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-members") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-monitoring") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-cleanup") {
    app.innerHTML = `
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
    return;
  }

  if (state.screen === "admin-settings") {
    app.innerHTML = `
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

          <div class="setting-row">
            <span>Payment Amount</span>
            <strong>${naira(PAYMENT.amount)}</strong>
          </div>

          <div class="setting-row">
            <span>Payment Provider</span>
            <strong>${esc(PAYMENT.provider)}</strong>
          </div>

          <div class="setting-row">
            <span>Payment Account</span>
            <strong>${esc(PAYMENT.accountNumber)}</strong>
          </div>

          <div class="setting-row">
            <span>Account Name</span>
            <strong>${esc(PAYMENT.accountName)}</strong>
          </div>

          <div class="setting-row">
            <span>Information Freshness</span>
            <strong>24 HOURS</strong>
          </div>

        </section>

      </main>
    `;
    return;
  }
}

function adminNav() {
  return `
    <nav>

      <div class="mini">
        <b>G</b> G WORLD ADMIN
      </div>

      <div class="nav-user">

        <button
          class="secondary"
          data-a="admin"
        >
          DASHBOARD
        </button>

        <button
          class="logout-btn"
          data-a="admin-logout"
        >
          LOG OUT
        </button>

      </div>

    </nav>
  `;
}

document.addEventListener("click", async event => {

  const target = event.target.closest("[data-a]");

  if (!target) return;

  const action = target.dataset.a;

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
    localStorage.removeItem("gworld");
    state.member = null;
    state.history = [];
    state.error = "";
    state.screen = "entry";
    render();
    return;
  }

  if (action === "reset") {
    localStorage.removeItem("gworld");
    state.member = null;
    state.history = [];
    state.screen = "splash";
    render();
    startIntro();
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
    alert(
      "Correct. Python is a programming language used to give instructions to a computer."
    );
    return;
  }

  if (action === "python-answer-wrong") {
    alert(
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
    alert(
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
    return;
  }

  if (action === "payment-submitted") {
    state.loading = true;
    render();

    try {
      await api("/api/payment/submit", {
        method: "POST",
        body: JSON.stringify({
          gworldId: state.member?.gworldId,
          amount: PAYMENT.amount,
          course: state.selectedCourse?.title || "G WORLD Learning Access"
        })
      });

      state.loading = false;
      state.screen = "payment-status";
      render();

    } catch (error) {
      state.loading = false;
      state.error = error.message;
      render();
    }

    return;
  }

  if (action === "refresh-payment") {
    try {
      const result = await api(
        `/api/payment/status?gworldId=${encodeURIComponent(
          state.member?.gworldId || ""
        )}`
      );

      if (result.status === "approved") {
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
    return;
  }

  if (action === "admin-logout") {
    state.admin = null;
    state.history = [];
    state.screen = "home";
    render();
    return;
  }

  if (action === "payment-approve") {
    try {
      await api("/api/admin/payment/review", {
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          paymentId: state.selectedPayment?.id || null
        })
      });

      alert("Payment approved.");
      goTo("admin-payments");

    } catch (error) {
      state.error = error.message;
      render();
    }

    return;
  }

  if (action === "payment-reject") {
    try {
      await api("/api/admin/payment/review", {
        method: "POST",
        body: JSON.stringify({
          action: "reject",
          paymentId: state.selectedPayment?.id || null
        })
      });

      alert("Payment rejected.");
      goTo("admin-payments");

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
      alert(
        state.supportMessages.length
          ? `${state.supportMessages.length} support message(s) loaded.`
          : "No support messages yet."
      );
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
      alert(`Account number: ${target.dataset.copy}`);
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

    if (!valid) return;

    state.loading = true;
    state.error = "";
    render();

    try {
      const result = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          phone,
          email
        })
      });

      state.member = result.member;

      localStorage.setItem(
        "gworld",
        JSON.stringify(state.member)
      );

      state.loading = false;
      state.screen = "card";
      state.history = [];

      render();
      generateMemberQR();

    } catch (error) {
      state.loading = false;
      state.error = error.message;
      render();
    }

    return;
  }

  if (event.target.id === "existing-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));

    const name = String(data.name || "").trim();
    const email = String(data.email || "").trim();

    let valid = true;

    const nameError = form.querySelector(
      '[data-error="existing-name"]'
    );

    const emailError = form.querySelector(
      '[data-error="existing-email"]'
    );

    if (name.length < 2) {
      nameError.textContent = "Please enter your full name.";
      valid = false;
    } else {
      nameError.textContent = "";
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      emailError.textContent = "Please enter a valid email.";
      valid = false;
    } else {
      emailError.textContent = "";
    }

    if (!valid) return;

    state.loading = true;
    state.error = "";
    render();

    try {
      const result = await api("/api/member-login", {
        method: "POST",
        body: JSON.stringify({
          name,
          email
        })
      });

      state.member = result.member;

      localStorage.setItem(
        "gworld",
        JSON.stringify(state.member)
      );

      state.loading = false;
      state.history = [];

      if (result.isAdmin) {
        state.screen = "admin-gate";
      } else {
        state.screen = "home";
      }

      render();

    } catch (error) {
      state.loading = false;
      state.error =
        error.message ||
        "We could not find a G WORLD account with those details.";
      render();
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
      state.error = "Please enter your message.";
      render();
      return;
    }

    state.loading = true;
    state.error = "";
    render();

    try {
      await api("/api/support", {
        method: "POST",
        body: JSON.stringify({
          gworldId: state.member?.gworldId,
          category,
          message
        })
      });

      state.loading = false;
      state.error = "";
      alert("Your message has been sent to the G WORLD Team.");
      goTo("home");

    } catch (error) {
      state.loading = false;
      state.error = error.message;
      render();
    }

    return;
  }

  if (event.target.id === "admin-code-form") {
    event.preventDefault();

    const form = event.target;
    const data = Object.fromEntries(new FormData(form));
    const code = String(data.code || "");

    if (!code) {
      state.error = "Enter your administrator code.";
      render();
      return;
    }

    state.loading = true;
    state.error = "";
    render();

    try {
      const result = await api("/api/admin/verify", {
        method: "POST",
        body: JSON.stringify({
          code
        })
      });

      state.loading = false;
      state.admin = result.admin || {
        authenticated: true
      };
      state.history = [];
      state.screen = "admin";
      render();

    } catch (error) {
      state.loading = false;
      state.error =
        "Administrator verification failed.";
      render();
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

    alert(
      "Your project topic has been received. The guided project workflow will continue from here."
    );
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

const savedMember = localStorage.getItem("gworld");

if (savedMember) {
  try {
    state.member = JSON.parse(savedMember);
  } catch {
    localStorage.removeItem("gworld");
  }
}

render();
startIntro();
