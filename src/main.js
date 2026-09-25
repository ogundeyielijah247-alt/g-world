import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");

const state = {
  screen: "splash",
  member: null,
  error: "",
  loading: false,
  selectedCourse: null,
  selectedLesson: null,
  selectedSection: null
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

const videos = {
  pythonFull: {
    title: "Python Full Course for Beginners — Programming with Mosh",
    videoId: "_uQrJ0TkZlc"
  },

  pythonVariables: {
    title: "Python Variables — Programming with Mosh",
    videoId: "cQT33yu9pY8"
  },

  accountingBasics: {
    title: "Accounting Basics: a Guide to (Almost) Everything — Accounting Stuff",
    videoId: "yYX4bvQSqbo"
  },

  jambPrep: {
    title: "BEST WAY to study & prepare for JAMB Examination",
    videoId: "9MPJ4EQqjQM"
  },

  jambCbt: {
    title: "JAMB CBT Demo — JAMB CBT Practice",
    videoId: "WSHihZqHqY4"
  },

  excelAnalysis: {
    title: "Beginner to Pro FREE Excel Data Analysis Course",
    videoId: "v2oNWja7M2E"
  },

  variablesAlternative: {
    title: "Python Tutorial for Absolute Beginners — What Are Variables?",
    videoId: "Z1Yd7upQsXY"
  }
};

const youtube = video => {
  if (!video?.videoId) return "";

  return `
    <div class="video-box">
      <div class="video-label">
        <span>WATCH & LEARN</span>
        <small>${esc(video.title)}</small>
      </div>

      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}"
          title="${esc(video.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>

      <a
        class="video-fallback"
        href="https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}"
        target="_blank"
        rel="noopener noreferrer">
        Open this video on YouTube ↗
      </a>
    </div>
  `;
};

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

function go(screen) {
  state.screen = screen;
  state.error = "";
  render();
}

function shell(content, title = "G WORLD") {
  return `
    <main class="home">
      <nav>
        <button class="mini brand-button" data-a="home">
          <b>G</b> G WORLD
        </button>

        <div class="nav-user">
          <span>${esc(state.member?.name || "")}</span>
          <button class="logout-btn" data-a="logout">LOG OUT</button>
        </div>
      </nav>

      ${content}

      <footer>
        G WORLD · Discover What You Need to Know.
      </footer>
    </main>
  `;
}

function pageHero(eyebrow, title, text, image = "") {
  return `
    <section class="hero ${image ? "hero-image" : ""}"
      ${image ? `style="--hero-image:url('${esc(image)}')"` : ""}>
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      <p>${esc(text)}</p>
    </section>
  `;
}

function backButton(target = "home", label = "← Back") {
  return `
    <button class="link back-link" data-a="${esc(target)}">
      ${esc(label)}
    </button>
  `;
}
import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");

const state = {
  screen: "splash",
  member: null,
  error: "",
  loading: false,
  selectedCourse: null,
  selectedLesson: null,
  selectedSection: null
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const esc = s =>
  String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

const videos = {
  pythonFull: {
    title: "Python Full Course for Beginners — Programming with Mosh",
    videoId: "_uQrJ0TkZlc"
  },

  pythonVariables: {
    title: "Python Variables — Programming with Mosh",
    videoId: "cQT33yu9pY8"
  },

  accountingBasics: {
    title: "Accounting Basics: a Guide to (Almost) Everything — Accounting Stuff",
    videoId: "yYX4bvQSqbo"
  },

  jambPrep: {
    title: "BEST WAY to study & prepare for JAMB Examination",
    videoId: "9MPJ4EQqjQM"
  },

  jambCbt: {
    title: "JAMB CBT Demo — JAMB CBT Practice",
    videoId: "WSHihZqHqY4"
  },

  excelAnalysis: {
    title: "Beginner to Pro FREE Excel Data Analysis Course",
    videoId: "v2oNWja7M2E"
  },

  variablesAlternative: {
    title: "Python Tutorial for Absolute Beginners — What Are Variables?",
    videoId: "Z1Yd7upQsXY"
  }
};

const youtube = video => {
  if (!video?.videoId) return "";

  return `
    <div class="video-box">
      <div class="video-label">
        <span>WATCH & LEARN</span>
        <small>${esc(video.title)}</small>
      </div>

      <div class="video-frame">
        <iframe
          src="https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}"
          title="${esc(video.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      </div>

      <a
        class="video-fallback"
        href="https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}"
        target="_blank"
        rel="noopener noreferrer">
        Open this video on YouTube ↗
      </a>
    </div>
  `;
};

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

function go(screen) {
  state.screen = screen;
  state.error = "";
  render();
}

function shell(content, title = "G WORLD") {
  return `
    <main class="home">
      <nav>
        <button class="mini brand-button" data-a="home">
          <b>G</b> G WORLD
        </button>

        <div class="nav-user">
          <span>${esc(state.member?.name || "")}</span>
          <button class="logout-btn" data-a="logout">LOG OUT</button>
        </div>
      </nav>

      ${content}

      <footer>
        G WORLD · Discover What You Need to Know.
      </footer>
    </main>
  `;
}

function pageHero(eyebrow, title, text, image = "") {
  return `
    <section class="hero ${image ? "hero-image" : ""}"
      ${image ? `style="--hero-image:url('${esc(image)}')"` : ""}>
      <div class="eyebrow">${esc(eyebrow)}</div>
      <h1>${esc(title)}</h1>
      <p>${esc(text)}</p>
    </section>
  `;
}

function backButton(target = "home", label = "← Back") {
  return `
    <button class="link back-link" data-a="${esc(target)}">
      ${esc(label)}
    </button>
  `;
}
const informationSections = [
  {
    id: "ai",
    title: "AI & Technology",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=75",
    description:
      "Understand important developments in artificial intelligence and technology without having to search through thousands of posts.",
    video: videos.pythonFull,
    items: [
      {
        title: "AI Fundamentals",
        description:
          "Understand what artificial intelligence is, what machine learning means, and where AI is being used.",
        video: videos.pythonFull
      },
      {
        title: "AI Tools",
        description:
          "Learn how to identify useful AI tools and match them to real problems.",
        video: videos.pythonFull
      },
      {
        title: "Prompting",
        description:
          "Learn how to communicate clearly with AI systems to obtain useful results.",
        video: videos.pythonFull
      },
      {
        title: "AI for Students",
        description:
          "Use AI to understand difficult topics, organise research and improve learning without replacing your own thinking.",
        video: videos.pythonFull
      }
    ]
  },

  {
    id: "jamb",
    title: "JAMB",
    image:
      "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=75",
    description:
      "A focused JAMB preparation area bringing information, syllabus guidance, CBT practice, subject combinations and past-question resources together.",
    video: videos.jambPrep,
    items: [
      {
        title: "JAMB Information / News",
        description:
          "Current JAMB information is reviewed before publication and displayed with its source and update date.",
        video: videos.jambPrep
      },
      {
        title: "JAMB Syllabus",
        description:
          "Subject-by-subject syllabus guidance organised for easier study planning.",
        video: videos.jambPrep
      },
      {
        title: "JAMB CBT",
        description:
          "Practise questions in a CBT-style environment.",
        video: videos.jambCbt
      },
      {
        title: "JAMB Subject Combination",
        description:
          "Search courses and view the relevant UTME subject combination after the requirement has been reviewed.",
        video: videos.jambPrep
      },
      {
        title: "JAMB Past Questions",
        description:
          "Practise from properly sourced materials uploaded and managed by G WORLD administrators.",
        video: videos.jambCbt
      }
    ]
  },

  {
    id: "ican",
    title: "ICAN / ATS",
    image:
      "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=75",
    description:
      "A structured accounting-technician learning area connecting study resources, past questions, mixed practice and current professional information.",
    video: videos.accountingBasics,
    items: [
      {
        title: "ATS Study Pack Link",
        description:
          "Access the official ICAN ATSWA learning-materials area configured by G WORLD Admin.",
        video: videos.accountingBasics
      },
      {
        title: "ATS Study",
        description:
          "Learn ATSWA subjects through structured explanations, videos, questions and practical application.",
        video: videos.accountingBasics
      },
      {
        title: "ATS Past Questions",
        description:
          "Past-question materials uploaded and organised by subject.",
        video: videos.accountingBasics
      },
      {
        title: "ATS Mixed Past Questions",
        description:
          "Practise mixed questions across subjects to test broader understanding.",
        video: videos.accountingBasics
      },
      {
        title: "ATS News",
        description:
          "Current professional and examination information reviewed before publication.",
        video: videos.accountingBasics
      }
    ]
  }
];

const workReady = [
  {
    title: "Quality Ownership",
    description:
      "Learn how to take responsibility for the quality of your work.",
    video: videos.accountingBasics
  },
  {
    title: "Customer Service",
    description:
      "Understand communication, listening, problem-solving and professional customer interaction.",
    video: videos.accountingBasics
  },
  {
    title: "Work Ethics",
    description:
      "Learn professional behaviour, responsibility, honesty, confidentiality and accountability.",
    video: videos.accountingBasics
  },
  {
    title: "Work-Life Balance",
    description:
      "Understand practical ways to organise work, responsibilities, energy and personal life.",
    video: videos.accountingBasics
  }
];

const jambQuestions = [
  {
    id: "j1",
    subject: "Use of English",
    question: "Choose the word closest in meaning to 'abundant'.",
    options: ["Scarce", "Plentiful", "Tiny", "Weak"],
    answer: 1
  },
  {
    id: "j2",
    subject: "Mathematics",
    question: "If 2x + 6 = 14, what is x?",
    options: ["2", "3", "4", "5"],
    answer: 2
  },
  {
    id: "j3",
    subject: "Biology",
    question: "Which structure controls many activities of a cell?",
    options: ["Nucleus", "Cell wall", "Vacuole", "Ribosome"],
    answer: 0
  },
  {
    id: "j4",
    subject: "Economics",
    question: "What generally happens to quantity demanded when price rises, other things being equal?",
    options: [
      "It rises",
      "It falls",
      "It remains fixed",
      "It becomes zero"
    ],
    answer: 1
  },
  {
    id: "j5",
    subject: "Commerce",
    question: "Which document normally shows goods supplied and their prices?",
    options: ["Invoice", "Passport", "Certificate", "Receipt book"],
    answer: 0
  }
];

const jambStreams = {
  Science: [
    "Use of English",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology"
  ],
  Commercial: [
    "Use of English",
    "Mathematics",
    "Economics",
    "Commerce",
    "Accounting"
  ],
  Arts: [
    "Use of English",
    "Literature",
    "Government",
    "CRS / IRS",
    "History"
  ]
};

const courseCombinations = [
  {
    course: "Accounting",
    combination:
      "Use of English + Mathematics + Economics + one relevant subject according to the current official requirement.",
    source:
      "Verify against the current official JAMB/IBASS requirement before relying on it."
  },
  {
    course: "Computer Science",
    combination:
      "Use of English + Mathematics + two relevant science/technical subjects according to the current official requirement.",
    source:
      "Verify against the current official JAMB/IBASS requirement before relying on it."
  },
  {
    course: "Economics",
    combination:
      "Use of English + Mathematics + Economics + one relevant subject according to the current official requirement.",
    source:
      "Verify against the current official JAMB/IBASS requirement before relying on it."
  },
  {
    course: "Business Administration",
    combination:
      "Use of English + Mathematics + Economics + one relevant subject according to the current official requirement.",
    source:
      "Verify against the current official JAMB/IBASS requirement before relying on it."
  }
];

const pastQuestionResources = [
  {
    title: "JAMB Past Questions",
    type: "Admin-managed resource",
    description:
      "Past-question files can be uploaded by Admin, categorised by subject and year, and made available to learners."
  },
  {
    title: "ATS Past Questions",
    type: "Admin-managed resource",
    description:
      "ATSWA past-question resources can be uploaded and organised by subject and examination diet."
  }
];

const catalogue = [
  "Accounting",
  "Economics",
  "Business Administration",
  "Finance",
  "Marketing",
  "Entrepreneurship",
  "Cooperative & Rural Development",
  "Management",
  "Statistics",
  "Mathematics",
  "Computer Science",
  "Information Technology",
  "Research Methodology",
  "Project Management",
  "Communication",
  "Excel",
  "SQL",
  "Data Analysis",
  "Power BI",
  "Tableau",
  "Web Development",
  "HTML / CSS",
  "JavaScript",
  "Git / GitHub",
  "Databases",
  "Cybersecurity Fundamentals",
  "Cloud Fundamentals",
  "UI / UX",
  "Digital Literacy",
  "AI Fundamentals",
  "AI Tools",
  "Prompting",
  "Prompt Engineering",
  "AI Research",
  "AI for Students",
  "AI for Business",
  "AI for Content Creation",
  "AI Agents / Bots",
  "AI Automation",
  "n8n",
  "Make",
  "Zapier",
  "AI + Python",
  "Responsible AI"
];

const projects = [
  {
    title: "Beginner Python Project",
    description:
      "Build a small useful Python application using the concepts learned.",
    steps: [
      "Understand the problem",
      "Plan the solution",
      "Write the first version",
      "Test it",
      "Fix errors",
      "Explain how it works",
      "Submit for verification"
    ],
    video: videos.pythonFull
  },
  {
    title: "Accounting Analysis Project",
    description:
      "Use a small financial dataset to understand transactions, accounts and financial information.",
    steps: [
      "Understand the dataset",
      "Classify information",
      "Perform calculations",
      "Prepare a structured analysis",
      "Explain findings",
      "Present the result"
    ],
    video: videos.accountingBasics
  }
];
function renderEntry() {
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
}

function renderOnboard() {
  app.innerHTML = `
    <main class="center enter-screen">
      <section class="panel">
        <div class="form-brand">
          <span>G</span><b>G WORLD</b>
        </div>

        <div class="eyebrow">NEW MEMBER</div>

        <h1>Start your journey.</h1>

        <p>
          Enter your basic details. Your G WORLD ID and digital member
          card will be created automatically.
        </p>

        <form id="f" novalidate>
          <label>
            Full Name
            <input name="name" required autocomplete="name"
              placeholder="Your full name" maxlength="80">
            <small class="field-error" data-error="name"></small>
          </label>

          <label>
            Phone Number
            <input name="phone" required autocomplete="tel"
              placeholder="Your phone number" maxlength="30">
            <small class="field-error" data-error="phone"></small>
          </label>

          <label>
            Email <small>(optional)</small>
            <input name="email" type="email" autocomplete="email"
              placeholder="you@example.com" maxlength="120">
            <small class="field-error" data-error="email"></small>
          </label>

          <small class="form-error" id="form-error">
            ${esc(state.error)}
          </small>

          <button class="primary full" type="submit"
            ${state.loading ? "disabled" : ""}>
            ${state.loading
              ? "CREATING YOUR G WORLD ID…"
              : "CREATE MY G WORLD ID"}
          </button>
        </form>

        <button class="link" data-a="back-entry">← Back</button>

        <small class="privacy-note">
          Your G WORLD ID is a platform identity. It is not a government ID
          or password.
        </small>
      </section>
    </main>
  `;
}

function renderExisting() {
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
            <input name="name" required autocomplete="name"
              placeholder="Your full name" maxlength="80">
            <small class="field-error"
              data-error="existing-name"></small>
          </label>

          <label>
            Email
            <input name="email" type="email" required
              autocomplete="email" placeholder="you@example.com"
              maxlength="120">
            <small class="field-error"
              data-error="existing-email"></small>
          </label>

          <small class="form-error">
            ${esc(state.error)}
          </small>

          <button class="primary full" type="submit"
            ${state.loading ? "disabled" : ""}>
            ${state.loading ? "ENTERING G WORLD…" : "ENTER G WORLD"}
          </button>
        </form>

        <button class="link" data-a="back-entry">← Back</button>
      </section>
    </main>
  `;
}

function renderCard() {
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
          <h2>${esc(m?.name)}</h2>

          <div class="info">
            <div>
              <small>PHONE</small>
              <strong>${esc(m?.phone)}</strong>
            </div>

            <div>
              <small>STATUS</small>
              <strong>${esc(m?.status || "ACTIVE")}</strong>
            </div>

            <div>
              <small>G WORLD ID</small>
              <strong>${esc(m?.gworldId)}</strong>
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
}

function renderHome() {
  const m = state.member;

  app.innerHTML = shell(`
    <section class="hero">
      <div class="eyebrow">G WORLD</div>

      <h1>Discover what you need to know.</h1>

      <p>
        Useful knowledge. Clear learning. Practical growth.
        One place to reduce information overload.
      </p>
    </section>

    <section class="continue">
      <div>
        <div class="eyebrow">YOUR G WORLD</div>
        <h2>Welcome back, ${esc(m?.name)}.</h2>
        <p>
          Continue learning, discover useful information and build
          practical skills.
        </p>
      </div>

      <code>${esc(m?.gworldId)}</code>
    </section>

    <section class="doors">
      <h2>Explore G WORLD</h2>

      <div class="visual-grid">
        <article class="visual-door"
          data-a="courses"
          style="--door-image:url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>01</small>
            <h3>University Courses</h3>
            <p>Understand your field from the foundation upward.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="tech-skills"
          style="--door-image:url('https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>02</small>
            <h3>Tech Skills</h3>
            <p>Learn practical digital skills through guided practice.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="ai"
          style="--door-image:url('https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>03</small>
            <h3>AI & Technology</h3>
            <p>Find the information that matters without the noise.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="jamb"
          style="--door-image:url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>04</small>
            <h3>JAMB</h3>
            <p>Information, syllabus, CBT, combinations and practice.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="ican"
          style="--door-image:url('https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>05</small>
            <h3>ICAN / ATS</h3>
            <p>Study resources, practice and professional information.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="work-ready"
          style="--door-image:url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>06</small>
            <h3>Work Ready</h3>
            <p>Build the skills employers expect in real work.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="projects"
          style="--door-image:url('https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>07</small>
            <h3>Projects</h3>
            <p>Move from knowing something to actually building.</p>
          </div>
        </article>

        <article class="visual-door"
          data-a="support"
          style="--door-image:url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=70')">
          <div>
            <small>08</small>
            <h3>GWard Support</h3>
            <p>Need help? Reach the G WORLD support team.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="update-strip">
      <div>
        <span class="eyebrow">NEW INFORMATION</span>
        <h2>Stay informed without drowning in information.</h2>
        <p>
          Important updates are organised, reviewed and moved into
          existing information as they become older.
        </p>
      </div>

      <button class="secondary" data-a="information">
        EXPLORE INFORMATION
      </button>
    </section>
  `);
}
function renderCourses() {
  app.innerHTML = shell(`
    ${pageHero(
      "UNIVERSITY COURSES",
      "Understand your field from the foundation upward.",
      "A structured learning environment that gives you the explanation,
      examples, videos, practice and direction you need."
    )}

    <section class="doors">
      <h2>Course Catalogue</h2>

      <div class="visual-grid">
        ${universityCourses.map(course => `
          <article
            class="visual-door course-card"
            data-a="course"
            data-id="${esc(course.id)}"
            style="--door-image:url('${esc(course.image)}')">
            <div>
              <small>${esc(course.category)}</small>
              <h3>${esc(course.title)}</h3>
              <p>${esc(course.description)}</p>
              <span class="door-link">OPEN COURSE →</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="continue">
      <div>
        <div class="eyebrow">MORE COURSES COMING</div>
        <h2>Build the catalogue without rebuilding G WORLD.</h2>
        <p>
          New courses can be added through the Admin content system
          instead of changing the learner interface.
        </p>
      </div>
    </section>

    ${backButton()}
  `);
}

function renderCourse(course) {
  if (!course) {
    go("courses");
    return;
  }

  state.selectedCourse = course.id;

  app.innerHTML = shell(`
    ${pageHero(
      course.title.toUpperCase(),
      course.title,
      course.description,
      course.image
    )}

    <section class="continue">
      <div>
        <div class="eyebrow">YOUR ROADMAP</div>
        <h2>What you will learn</h2>

        <div class="roadmap-list">
          ${course.roadmap.map((item, i) => `
            <div class="roadmap-item">
              <span>${String(i + 1).padStart(2, "0")}</span>
              <strong>${esc(item)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    ${youtube(course.video)}

    <section class="doors">
      <h2>Lessons</h2>

      <div class="grid">
        ${course.lessons.map((lesson, i) => `
          <article
            data-a="lesson"
            data-id="${esc(lesson.id)}">
            <small>LESSON ${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(lesson.title)}</h3>
            <p>${esc(lesson.text)}</p>
            <span class="door-link">START LESSON →</span>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton("courses")}
  `);
}

function renderLesson(course, lesson) {
  if (!course || !lesson) {
    go("courses");
    return;
  }

  state.selectedLesson = lesson.id;

  app.innerHTML = shell(`
    ${pageHero(
      `LEARN · ${course.title}`,
      lesson.title,
      "Learn it simply. Watch it. Check your understanding. Then practise."
    )}

    <section class="continue lesson-content">
      <div>
        <div class="eyebrow">LEARN</div>
        <h2>Understand the idea</h2>
        <p>${esc(lesson.text)}</p>

        <div class="lesson-points">
          ${lesson.points.map(point => `
            <div class="lesson-point">
              <span>✓</span>
              <p>${esc(point)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    ${youtube(lesson.video)}

    <section class="doors">
      <h2>Check Your Understanding</h2>

      <div class="question-list">
        ${lesson.questions.map((question, i) => `
          <article>
            <small>QUESTION ${i + 1}</small>
            <h3>${esc(question)}</h3>
            <button class="secondary" data-a="show-answer">
              THINK ABOUT IT
            </button>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="practice-panel">
      <div>
        <div class="eyebrow">PRACTISE</div>
        <h2>Now use what you learned.</h2>
        <p>
          Learning becomes useful when you can apply the idea to a
          problem of your own.
        </p>
      </div>

      <button
        class="primary"
        data-a="${lesson.action || "practice"}">
        START PRACTICE
      </button>
    </section>

    ${backButton("course")}
  `);
}

function renderTechSkills() {
  app.innerHTML = shell(`
    ${pageHero(
      "TECH SKILLS",
      "Learn skills you can actually use.",
      "Step-by-step learning with explanations, videos, guided practice,
      challenges and projects."
    )}

    <section class="doors">
      <h2>Technology Learning</h2>

      <div class="visual-grid">
        ${techSkills.map(skill => `
          <article
            class="visual-door"
            data-a="skill"
            data-id="${esc(skill.id)}"
            style="--door-image:url('${esc(skill.image)}')">
            <div>
              <small>TECH SKILL</small>
              <h3>${esc(skill.title)}</h3>
              <p>${esc(skill.description)}</p>
              <span class="door-link">START LEARNING →</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton()}
  `);
}

function renderSkill(skill) {
  app.innerHTML = shell(`
    ${pageHero(
      "TECH SKILL",
      skill.title,
      skill.description
    )}

    ${youtube(skill.video)}

    <section class="doors">
      <h2>Learning Path</h2>

      <div class="grid">
        ${skill.lessons.map((lesson, i) => `
          <article
            data-a="skill-lesson"
            data-id="${esc(lesson.id)}">
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(lesson.title)}</h3>
            <p>${esc(lesson.text)}</p>
            <span class="door-link">OPEN →</span>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton("tech-skills")}
  `);
}

function renderInformation() {
  app.innerHTML = shell(`
    ${pageHero(
      "INFORMATION",
      "Less noise. More useful knowledge.",
      "G WORLD brings important information together so you spend less
      time searching and more time understanding."
    )}

    <section class="doors">
      <h2>Information Areas</h2>

      <div class="visual-grid">
        ${informationSections.map(section => `
          <article
            class="visual-door"
            data-a="information-section"
            data-id="${esc(section.id)}"
            style="--door-image:url('${esc(section.image)}')">
            <div>
              <small>UPDATED INFORMATION</small>
              <h3>${esc(section.title)}</h3>
              <p>${esc(section.description)}</p>
              <span class="door-link">EXPLORE →</span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="update-strip">
      <div>
        <span class="eyebrow">NEW → EXISTING</span>
        <h2>Information does not simply disappear.</h2>
        <p>
          New information can be highlighted while older approved
          information remains available as Existing Information.
        </p>
      </div>
    </section>

    ${backButton()}
  `);
}
function renderInformationSection(section) {
  app.innerHTML = shell(`
    ${pageHero(
      section.title.toUpperCase(),
      section.title,
      section.description,
      section.image
    )}

    ${youtube(section.video)}

    <section class="doors">
      <div class="section-heading-row">
        <div>
          <span class="eyebrow">NEW INFORMATION</span>
          <h2>Important things to know</h2>
        </div>

        <span class="updated-badge">
          LAST REVIEWED · ADMIN CONTROLLED
        </span>
      </div>

      <div class="grid">
        ${section.items.map((item, i) => `
          <article
            data-a="information-item"
            data-section="${esc(section.id)}"
            data-index="${i}">
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
            <span class="door-link">LEARN MORE →</span>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="continue">
      <div>
        <div class="eyebrow">EXISTING INFORMATION</div>
        <h2>Older approved information remains useful.</h2>
        <p>
          Once information is no longer considered new, it can move
          into the Existing Information area rather than being deleted.
        </p>
      </div>
    </section>

    ${backButton("information")}
  `);
}

function renderInformationItem(section, item) {
  app.innerHTML = shell(`
    ${pageHero(
      section.title,
      item.title,
      item.description
    )}

    <section class="continue lesson-content">
      <div>
        <div class="eyebrow">UNDERSTAND</div>
        <h2>What you should know</h2>

        <p>${esc(item.description)}</p>

        <div class="lesson-points">
          <div class="lesson-point">
            <span>01</span>
            <p>Understand the basic idea before moving to deeper material.</p>
          </div>

          <div class="lesson-point">
            <span>02</span>
            <p>Watch the focused video and return to G WORLD.</p>
          </div>

          <div class="lesson-point">
            <span>03</span>
            <p>Apply what you learned to a real situation.</p>
          </div>
        </div>
      </div>
    </section>

    ${youtube(item.video)}

    ${backButton("information-section")}
  `);
}

function renderJamb() {
  const streams = Object.entries(jambStreams);

  app.innerHTML = shell(`
    ${pageHero(
      "JAMB",
      "Prepare with direction, not information overload.",
      "Bring JAMB information, syllabus, CBT practice, subject combinations
      and past-question resources into one organised learning path."
    )}

    ${youtube(videos.jambPrep)}

    <section class="visual-feature">
      <div class="visual-feature-image"
        style="background-image:url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=75')">
      </div>

      <div class="visual-feature-content">
        <span class="eyebrow">JAMB PREPARATION</span>
        <h2>Know what to study. Know why you are studying it.</h2>
        <p>
          Start with the official syllabus and requirements, then use
          structured practice to identify what you understand and what
          needs more work.
        </p>

        <button class="primary" data-a="jamb-cbt">
          START CBT PRACTICE
        </button>
      </div>
    </section>

    <section class="doors">
      <h2>JAMB Learning Areas</h2>

      <div class="grid">
        <article data-a="jamb-news">
          <small>01</small>
          <h3>JAMB Information / News</h3>
          <p>Current reviewed information and important announcements.</p>
        </article>

        <article data-a="jamb-syllabus">
          <small>02</small>
          <h3>JAMB Syllabus</h3>
          <p>Subject-by-subject study guidance.</p>
        </article>

        <article data-a="jamb-cbt">
          <small>03</small>
          <h3>JAMB CBT</h3>
          <p>Practise questions in a structured CBT environment.</p>
        </article>

        <article data-a="jamb-combinations">
          <small>04</small>
          <h3>Subject Combination</h3>
          <p>Find course requirements and verify against current official information.</p>
        </article>

        <article data-a="jamb-past">
          <small>05</small>
          <h3>Past Questions</h3>
          <p>Access administrator-managed past-question resources.</p>
        </article>
      </div>
    </section>

    <section class="doors">
      <h2>Study Streams</h2>

      <div class="grid">
        ${streams.map(([name, subjects], i) => `
          <article>
            <small>STREAM ${i + 1}</small>
            <h3>${esc(name)}</h3>
            <p>${subjects.map(esc).join(" · ")}</p>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton()}
  `);
}

function renderJambNews() {
  app.innerHTML = shell(`
    ${pageHero(
      "JAMB INFORMATION",
      "Know what is changing.",
      "Current information is intended to be reviewed before it becomes
      visible to learners."
    )}

    ${youtube(videos.jambPrep)}

    <section class="update-strip">
      <div>
        <span class="eyebrow">CURRENT INFORMATION</span>
        <h2>JAMB updates</h2>
        <p>
          The Admin review system is designed to keep current information
          separate from older archived information.
        </p>
      </div>
    </section>

    <section class="doors">
      <h2>Information categories</h2>

      <div class="grid">
        <article>
          <small>01</small>
          <h3>Registration</h3>
          <p>Important registration information.</p>
        </article>

        <article>
          <small>02</small>
          <h3>Examination</h3>
          <p>Important examination information.</p>
        </article>

        <article>
          <small>03</small>
          <h3>Results</h3>
          <p>Result-related information.</p>
        </article>

        <article>
          <small>04</small>
          <h3>Admission</h3>
          <p>Admission-related information.</p>
        </article>
      </div>
    </section>

    ${backButton("jamb")}
  `);
}

function renderJambSyllabus() {
  app.innerHTML = shell(`
    ${pageHero(
      "JAMB SYLLABUS",
      "Study from a clear direction.",
      "Choose your subject area, understand what you are expected to cover,
      then practise."
    )}

    ${youtube(videos.jambPrep)}

    <section class="doors">
      <h2>Subjects</h2>

      <div class="grid">
        ${[
          "Use of English",
          "Mathematics",
          "Physics",
          "Chemistry",
          "Biology",
          "Economics",
          "Commerce",
          "Accounting",
          "Government",
          "Literature",
          "History",
          "CRS / IRS"
        ].map((subject, i) => `
          <article>
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(subject)}</h3>
            <p>
              Subject syllabus and study guidance managed through G WORLD.
            </p>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton("jamb")}
  `);
}
function renderJambCBT() {
  app.innerHTML = shell(`
    ${pageHero(
      "JAMB CBT",
      "Practise. Check. Improve.",
      "Use short practice sessions to discover what you know and what
      you still need to learn."
    )}

    ${youtube(videos.jambCbt)}

    <section class="doors">
      <h2>Choose a practice stream</h2>

      <div class="grid">
        ${Object.keys(jambStreams).map((stream, i) => `
          <article
            data-a="jamb-stream"
            data-stream="${esc(stream)}">
            <small>STREAM ${i + 1}</small>
            <h3>${esc(stream)}</h3>
            <p>
              ${jambStreams[stream].map(esc).join(" · ")}
            </p>
            <span class="door-link">PRACTISE →</span>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton("jamb")}
  `);
}

function renderJambStream(stream) {
  const questions = jambQuestions.filter((q, i) =>
    stream === "Science"
      ? [0, 1, 2].includes(i)
      : stream === "Commercial"
        ? [0, 1, 3, 4].includes(i)
        : [0].includes(i)
  );

  app.innerHTML = shell(`
    ${pageHero(
      `JAMB CBT · ${stream}`,
      `${stream} Practice`,
      "Answer the questions, review your result and return to the
      syllabus when you find a weak area."
    )}

    <section class="practice-panel">
      <div>
        <div class="eyebrow">PRACTICE SET</div>
        <h2>${questions.length} questions ready</h2>
        <p>
          This is the beginning of the question system. The Admin
          question bank can continuously add reviewed questions.
        </p>
      </div>
    </section>

    <section class="question-list">
      ${questions.map((q, i) => `
        <article class="cbt-question">
          <small>${esc(q.subject)} · QUESTION ${i + 1}</small>
          <h3>${esc(q.question)}</h3>

          <div class="answer-grid">
            ${q.options.map((option, index) => `
              <button
                class="secondary answer-choice"
                data-a="jamb-answer"
                data-q="${esc(q.id)}"
                data-answer="${index}">
                ${String.fromCharCode(65 + index)}. ${esc(option)}
              </button>
            `).join("")}
          </div>

          <div class="answer-result" id="result-${esc(q.id)}"></div>
        </article>
      `).join("")}
    </section>

    ${backButton("jamb-cbt")}
  `);
}

function renderJambCombinations() {
  app.innerHTML = shell(`
    ${pageHero(
      "JAMB SUBJECT COMBINATION",
      "Find the requirement for your course.",
      "Search the course you want and check the current official requirement
      before making your final subject choices."
    )}

    ${youtube(videos.jambPrep)}

    <section class="search-panel">
      <label>
        Search course
        <input
          id="combination-search"
          placeholder="e.g. Accounting"
          autocomplete="off">
      </label>
    </section>

    <section class="doors" id="combination-results">
      ${courseCombinations.map(item => `
        <article class="combination-card">
          <small>COURSE</small>
          <h3>${esc(item.course)}</h3>
          <p>${esc(item.combination)}</p>
          <span>${esc(item.source)}</span>
        </article>
      `).join("")}
    </section>

    ${backButton("jamb")}
  `);
}

function renderJambPast() {
  app.innerHTML = shell(`
    ${pageHero(
      "JAMB PAST QUESTIONS",
      "Practise from organised resources.",
      "Past-question resources are managed by Admin so files can be
      organised, reviewed and replaced when necessary."
    )}

    ${youtube(videos.jambCbt)}

    <section class="doors">
      ${pastQuestionResources.map((resource, i) => `
        <article>
          <small>${String(i + 1).padStart(2, "0")}</small>
          <h3>${esc(resource.title)}</h3>
          <p>${esc(resource.description)}</p>
          <span>${esc(resource.type)}</span>
        </article>
      `).join("")}
    </section>

    ${backButton("jamb")}
  `);
}

function renderIcan() {
  app.innerHTML = shell(`
    ${pageHero(
      "ICAN / ATS",
      "Build your accounting technician journey.",
      "Bring study materials, explanations, videos, past questions,
      mixed practice and current professional information together."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="visual-feature">
      <div class="visual-feature-image"
        style="background-image:url('https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=75')">
      </div>

      <div class="visual-feature-content">
        <span class="eyebrow">ATS STUDY PACK</span>
        <h2>Go directly to the official study-material source.</h2>
        <p>
          The final study-pack destination is controlled by Admin so that
          the link can be updated whenever the official source changes.
        </p>

        <button class="secondary" data-a="ats-study-link">
          OPEN ATS STUDY PACK
        </button>
      </div>
    </section>

    <section class="doors">
      <h2>ICAN / ATS Learning Areas</h2>

      <div class="grid">
        <article data-a="ats-study">
          <small>01</small>
          <h3>ATS Study</h3>
          <p>Structured learning across ATS subjects.</p>
        </article>

        <article data-a="ats-past">
          <small>02</small>
          <h3>ATS Past Questions</h3>
          <p>Subject-organised past-question resources.</p>
        </article>

        <article data-a="ats-mixed">
          <small>03</small>
          <h3>ATS Mixed Past Questions</h3>
          <p>Mixed practice to test broader understanding.</p>
        </article>

        <article data-a="ats-news">
          <small>04</small>
          <h3>ATS News</h3>
          <p>Current professional and examination information.</p>
        </article>
      </div>
    </section>

    ${backButton()}
  `);
}
function renderIcanStudy() {
  const subjects = [
    "Basic Accounting",
    "Financial Accounting",
    "Cost Accounting",
    "Taxation",
    "Business Law",
    "Economics",
    "Communication Skills",
    "Information Technology",
    "Management",
    "Principles of Auditing & Assurance",
    "Public Sector Accounting",
    "Quantitative Analysis"
  ];

  app.innerHTML = shell(`
    ${pageHero(
      "ATS STUDY",
      "Study one subject at a time.",
      "Understand the idea, watch the relevant explanation, practise and
      connect the topic to examination questions."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="doors">
      <h2>ATS Subjects</h2>

      <div class="grid">
        ${subjects.map((subject, i) => `
          <article>
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(subject)}</h3>
            <p>
              Structured explanation, focused video, examples and
              practice questions.
            </p>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton("ican")}
  `);
}

function renderIcanPast() {
  app.innerHTML = shell(`
    ${pageHero(
      "ATS PAST QUESTIONS",
      "Practise the way you will be tested.",
      "Past-question materials can be uploaded and organised by Admin."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="doors">
      <article>
        <small>RESOURCE LIBRARY</small>
        <h3>Uploaded ATS Past Questions</h3>
        <p>
          Files are categorised by subject, year and examination diet
          when that information is available.
        </p>
      </article>

      <article>
        <small>ADMIN CONTROLLED</small>
        <h3>More Questions</h3>
        <p>
          New files can be added without changing the learner interface.
        </p>
      </article>
    </section>

    ${backButton("ican")}
  `);
}

function renderIcanMixed() {
  app.innerHTML = shell(`
    ${pageHero(
      "ATS MIXED PAST QUESTIONS",
      "Test your wider understanding.",
      "Mixed practice combines questions from different subject areas."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="practice-panel">
      <div>
        <span class="eyebrow">MIXED PRACTICE</span>
        <h2>Ready for a mixed set?</h2>
        <p>
          The question bank can grow continuously as Admin adds reviewed
          questions.
        </p>
      </div>

      <button class="primary" data-a="mixed-start">
        START MIXED PRACTICE
      </button>
    </section>

    ${backButton("ican")}
  `);
}

function renderIcanNews() {
  app.innerHTML = shell(`
    ${pageHero(
      "ATS NEWS",
      "Keep up with important professional information.",
      "Current information is separated from older information so learners
      can quickly see what needs attention."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="update-strip">
      <div>
        <span class="eyebrow">NEW INFORMATION</span>
        <h2>Latest reviewed ATS information</h2>
        <p>
          Admin-approved updates appear here. Older items remain available
          through Existing Information.
        </p>
      </div>
    </section>

    ${backButton("ican")}
  `);
}

function renderWorkReady() {
  app.innerHTML = shell(`
    ${pageHero(
      "WORK READY",
      "Learn how to operate professionally.",
      "Work Ready is a learning category covering the behaviours and
      practical skills people need in real workplaces."
    )}

    ${youtube(videos.accountingBasics)}

    <section class="doors">
      <h2>Work Ready Courses</h2>

      <div class="grid">
        ${workReady.map((item, i) => `
          <article
            data-a="work-course"
            data-index="${i}">
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
            <span class="door-link">LEARN →</span>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton()}
  `);
}

function renderWorkCourse(item) {
  app.innerHTML = shell(`
    ${pageHero(
      "WORK READY",
      item.title,
      item.description
    )}

    <section class="continue lesson-content">
      <div>
        <div class="eyebrow">LEARN</div>
        <h2>Build the habit</h2>
        <p>${esc(item.description)}</p>

        <div class="lesson-points">
          <div class="lesson-point">
            <span>01</span>
            <p>Understand what professional behaviour looks like.</p>
          </div>

          <div class="lesson-point">
            <span>02</span>
            <p>See how it works in a real workplace.</p>
          </div>

          <div class="lesson-point">
            <span>03</span>
            <p>Practise the behaviour.</p>
          </div>

          <div class="lesson-point">
            <span>04</span>
            <p>Apply it consistently.</p>
          </div>
        </div>
      </div>
    </section>

    ${youtube(item.video)}

    ${backButton("work-ready")}
  `);
}

function renderProjects() {
  app.innerHTML = shell(`
    ${pageHero(
      "PROJECTS",
      "Move from knowing to building.",
      "Projects help you apply knowledge, solve problems, create evidence
      of your ability and prepare for verification."
    )}

    ${youtube(videos.pythonFull)}

    <section class="doors">
      <h2>Project Library</h2>

      <div class="grid">
        ${projects.map((project, i) => `
          <article data-a="project" data-index="${i}">
            <small>PROJECT ${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(project.title)}</h3>
            <p>${esc(project.description)}</p>
            <span class="door-link">OPEN PROJECT →</span>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="practice-panel">
      <div>
        <span class="eyebrow">PROJECT WRITER</span>
        <h2>Need help with an academic project?</h2>
        <p>
          Understand your topic, then move through Chapter One to
          Chapter Five with guidance.
        </p>
      </div>

      <button class="secondary" data-a="project-writer">
        OPEN PROJECT WRITER
      </button>
    </section>

    ${backButton()}
  `);
}
function renderProject(project) {
  app.innerHTML = shell(`
    ${pageHero(
      "PROJECT",
      project.title,
      project.description
    )}

    ${youtube(project.video)}

    <section class="continue">
      <div>
        <div class="eyebrow">PROJECT ROADMAP</div>
        <h2>Follow the process</h2>

        <div class="roadmap-list">
          ${project.steps.map((step, i) => `
            <div class="roadmap-item">
              <span>${String(i + 1).padStart(2, "0")}</span>
              <strong>${esc(step)}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="practice-panel">
      <div>
        <span class="eyebrow">SUBMISSION</span>
        <h2>Submit when you are ready.</h2>
        <p>
          Copy-and-paste submission can be used first. Temporary uploaded
          files can be reviewed and removed after the review process.
        </p>
      </div>

      <button class="primary" data-a="support">
        NEED HELP?
      </button>
    </section>

    ${backButton("projects")}
  `);
}

function renderProjectWriter() {
  app.innerHTML = shell(`
    ${pageHero(
      "PROJECT WRITER",
      "Understand your project before writing it.",
      "Enter your topic and G WORLD will guide you through understanding,
      planning, researching and presenting the project."
    )}

    <section class="search-panel">
      <form id="project-topic-form">
        <label>
          Project Topic
          <input
            name="topic"
            required
            maxlength="200"
            placeholder="Enter your project topic">
        </label>

        <button class="primary" type="submit">
          UNDERSTAND MY TOPIC
        </button>
      </form>
    </section>

    ${youtube(videos.accountingBasics)}

    <section class="doors">
      <h2>Project Structure</h2>

      <div class="grid">
        ${[
          "Understand Your Topic",
          "Chapter One",
          "Chapter Two",
          "Chapter Three",
          "Chapter Four",
          "Chapter Five",
          "References",
          "Presentation / Defence"
        ].map((item, i) => `
          <article>
            <small>${String(i + 1).padStart(2, "0")}</small>
            <h3>${esc(item)}</h3>
            <p>
              Learn what belongs in this part and how it connects
              to the rest of the project.
            </p>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="doors">
      <h2>Project Models & Methods</h2>

      <div class="grid">
        ${[
          "Descriptive Analysis",
          "Correlation",
          "Regression",
          "ANOVA",
          "Chi-Square",
          "Time Series",
          "Research Design",
          "Sampling Methods"
        ].map((item, i) => `
          <article>
            <small>MODEL ${i + 1}</small>
            <h3>${esc(item)}</h3>
            <p>
              Understand purpose, variables, assumptions, application,
              interpretation and reporting.
            </p>
          </article>
        `).join("")}
      </div>
    </section>

    ${backButton()}
  `);
}

function renderSupport() {
  app.innerHTML = shell(`
    ${pageHero(
      "GWard SUPPORT",
      "Need help? Reach the G WORLD team.",
      "Tell us what is confusing, what is not working or what you need
      help understanding."
    )}

    <section class="search-panel">
      <form id="support-form">
        <label>
          Your message
          <textarea
            name="message"
            rows="6"
            maxlength="2000"
            required
            placeholder="Tell the GWard team what you need help with..."></textarea>
        </label>

        <button class="primary" type="submit">
          SEND TO GWard
        </button>
      </form>
    </section>

    <section class="continue">
      <div>
        <span class="eyebrow">COURSE SUPPORT</span>
        <h2>Any challenge? Reach the GWard team.</h2>
        <p>
          Your message is stored in your support thread so replies from
          the team can be shown to you later.
        </p>
      </div>
    </section>

    ${backButton()}
  `);
}

function renderAdminEntry() {
  app.innerHTML = shell(`
    ${pageHero(
      "G WORLD",
      "Secure access",
      "Authorised administrators can continue to the control area."
    )}

    <section class="search-panel">
      <form id="admin-form">
        <label>
          Admin Email
          <input
            name="email"
            type="email"
            autocomplete="username"
            required
            placeholder="Admin email">
        </label>

        <label>
          Admin Code
          <input
            name="code"
            type="password"
            autocomplete="one-time-code"
            required
            maxlength="12"
            placeholder="Security code">
        </label>

        <small class="form-error">${esc(state.error)}</small>

        <button class="primary full" type="submit">
          SECURE ADMIN LOGIN
        </button>
      </form>
    </section>

    ${backButton()}
  `);
}

function renderAdmin() {
  app.innerHTML = `
    <main class="admin-shell">
      <header class="admin-header">
        <div>
          <div class="eyebrow">G WORLD CONTROL</div>
          <h1>Admin Dashboard</h1>
          <p>Manage content, learners, updates and system health.</p>
        </div>

        <button class="logout-btn" data-a="home">
          EXIT
        </button>
      </header>

      <section class="admin-health">
        <div>
          <span class="status-dot"></span>
          <strong>System operating normally</strong>
        </div>

        <small>Monitoring is designed to protect free-tier resources.</small>
      </section>

      <section class="admin-grid">
        ${[
          ["Members", "admin-members"],
          ["Courses", "admin-courses"],
          ["Skills", "admin-skills"],
          ["Lessons", "admin-lessons"],
          ["Videos", "admin-videos"],
          ["Questions", "admin-questions"],
          ["Projects", "admin-projects"],
          ["Project Models", "admin-models"],
          ["Resources", "admin-resources"],
          ["Opportunities", "admin-opportunities"],
          ["Research / Discoveries", "admin-research"],
          ["AI Content", "admin-ai"],
          ["Certificates", "admin-certificates"],
          ["Announcements", "admin-announcements"],
          ["Information", "admin-information"],
          ["Payments", "admin-payments"],
          ["JAMB", "admin-jamb"],
          ["ICAN / ATS", "admin-ican"],
          ["GWard Support", "admin-support"],
          ["Review Queue", "admin-review"],
          ["Approved Sources", "admin-sources"],
          ["Daily Updates", "admin-updates"],
          ["Monitoring", "admin-monitoring"],
          ["Storage Cleanup", "admin-storage"],
          ["Import / Export", "admin-import"],
          ["Settings", "admin-settings"]
        ].map(([title, action], i) => `
          <button class="admin-card" data-a="${action}">
            <small>${String(i + 1).padStart(2, "0")}</small>
            <strong>${esc(title)}</strong>
            <span>OPEN →</span>
          </button>
        `).join("")}
      </section>

      <section class="admin-note">
        <strong>Free-tier protection</strong>
        <p>
          Monitoring should use aggregated and sampled information rather
          than creating a database write for every visitor action.
        </p>
      </section>
    </main>
  `;
}
function renderAdminPage(title, description, type = "content") {
  const forms = {
    "admin-videos": `
      <form id="admin-video-form">
        <label>
          Section / Lesson
          <input name="location" required
            placeholder="e.g. Tech Skills → Python → Variables">
        </label>

        <label>
          Video title
          <input name="title" required
            placeholder="Exact YouTube video title">
        </label>

        <label>
          YouTube video ID
          <input name="videoId" required
            placeholder="Example: cQT33yu9pY8">
        </label>

        <label>
          Video purpose
          <select name="kind">
            <option value="lesson">Main Lesson</option>
            <option value="learn-more">Learn More</option>
            <option value="practice">Practice</option>
            <option value="orientation">Orientation</option>
          </select>
        </label>

        <button class="primary" type="submit">SAVE VIDEO</button>
      </form>
    `,

    "admin-questions": `
      <form id="admin-question-form">
        <label>
          Question
          <textarea name="question" required rows="5"></textarea>
        </label>

        <label>
          Subject / Topic
          <input name="subject" required>
        </label>

        <label>
          Question type
          <select name="type">
            <option>Multiple Choice</option>
            <option>True / False</option>
            <option>Short Answer</option>
            <option>Coding Challenge</option>
            <option>Practical Task</option>
          </select>
        </label>

        <label>
          Correct answer / marking guide
          <textarea name="answer" rows="4"></textarea>
        </label>

        <button class="primary" type="submit">SAVE QUESTION</button>
      </form>
    `,

    "admin-sources": `
      <form id="admin-source-form">
        <label>
          Source name
          <input name="name" required>
        </label>

        <label>
          Source URL
          <input name="url" type="url" required>
        </label>

        <label>
          Category
          <input name="category" required
            placeholder="AI, JAMB, ATS, Accounting...">
        </label>

        <label>
          Refresh frequency
          <select name="frequency">
            <option value="24">Every 24 hours</option>
            <option value="12">Every 12 hours</option>
            <option value="6">Every 6 hours</option>
          </select>
        </label>

        <button class="primary" type="submit">
          SAVE APPROVED SOURCE
        </button>
      </form>
    `,

    "admin-updates": `
      <div class="admin-actions">
        <button class="primary" data-a="admin-update-now">
          UPDATE NOW
        </button>

        <button class="secondary" data-a="admin-pause-updates">
          PAUSE UPDATES
        </button>

        <button class="secondary" data-a="admin-review-queue">
          OPEN REVIEW QUEUE
        </button>
      </div>

      <div class="admin-stat-row">
        <div><small>LAST SUCCESS</small><strong>Admin controlled</strong></div>
        <div><small>NEXT RUN</small><strong>24-hour cycle</strong></div>
        <div><small>STATUS</small><strong>Protected</strong></div>
      </div>
    `,

    "admin-monitoring": `
      <div class="monitor-grid">
        ${[
          ["Worker Requests", "Provider metric / estimate"],
          ["API Requests", "Application estimate"],
          ["D1 Reads", "Application estimate"],
          ["D1 Writes", "Application estimate"],
          ["D1 Storage", "Provider metric where available"],
          ["Bandwidth", "Provider metric where available"],
          ["Errors", "Application + provider logs"],
          ["Active Usage", "Application estimate"]
        ].map(([a, b]) => `
          <div class="monitor-card">
            <small>${esc(a)}</small>
            <strong>Monitoring</strong>
            <span>${esc(b)}</span>
          </div>
        `).join("")}
      </div>

      <div class="monitor-status">
        <span>🟢</span>
        <div>
          <strong>Normal</strong>
          <p>
            The system can automatically move toward conservation mode
            when configured thresholds are approached.
          </p>
        </div>
      </div>
    `,

    "admin-storage": `
      <div class="cleanup-list">
        ${[
          "Temporary project uploads",
          "Expired temporary files",
          "Duplicate draft assets",
          "Old debug records",
          "Unnecessary generated files"
        ].map((x, i) => `
          <label class="cleanup-item">
            <input type="checkbox" value="${i}">
            <span>${esc(x)}</span>
          </label>
        `).join("")}
      </div>

      <button class="primary" data-a="cleanup-selected">
        DELETE SELECTED SAFE ITEMS
      </button>

      <p class="warning-note">
        Member identity records, certificate verification records,
        payment audit records and required support records must not be
        deleted by automatic cleanup.
      </p>
    `,

    "admin-import": `
      <form id="admin-import-form">
        <label>
          Content Package JSON
          <textarea
            name="json"
            rows="16"
            placeholder='Paste a G WORLD content package here...'></textarea>
        </label>

        <button class="secondary" type="submit">
          VALIDATE PACKAGE
        </button>

        <button class="primary" type="button" data-a="admin-publish-import">
          PREVIEW / PUBLISH
        </button>
      </form>
    `
  };

  const body = forms[type] || `
    <div class="admin-placeholder">
      <div class="eyebrow">ADMIN AREA</div>
      <h2>${esc(title)}</h2>
      <p>${esc(description)}</p>

      <div class="admin-checklist">
        <div>✓ Create and edit content</div>
        <div>✓ Attach focused YouTube videos</div>
        <div>✓ Save as draft</div>
        <div>✓ Preview before publishing</div>
        <div>✓ Publish without editing learner code</div>
      </div>
    </div>
  `;

  app.innerHTML = `
    <main class="admin-shell">
      <header class="admin-header compact">
        <div>
          <div class="eyebrow">G WORLD CONTROL</div>
          <h1>${esc(title)}</h1>
          <p>${esc(description)}</p>
        </div>

        <button class="secondary" data-a="admin">
          DASHBOARD
        </button>
      </header>

      <section class="admin-panel">
        ${body}
      </section>
    </main>
  `;
}

function renderPythonPlayground() {
  app.innerHTML = shell(`
    ${pageHero(
      "CODE PLAYGROUND",
      "Write Python and see what happens.",
      "Your browser runs the practice environment. Routine coding practice
      does not need a database request."
    )}

    <section class="code-playground">
      <label>
        Python code
        <textarea id="python-code" rows="12">name = "G WORLD"
print("Hello", name)</textarea>
      </label>

      <button class="primary" data-a="run-python">
        RUN CODE
      </button>

      <pre id="python-output">Ready.</pre>
    </section>

    ${youtube(videos.pythonFull)}

    ${backButton("skill")}
  `);
}

function render() {
  if (state.screen === "splash") {
    app.innerHTML = `
      <main class="intro">
        <div class="intro-glow"></div>
        <img
          class="master-logo"
          src="/assets/gworld-master-logo.png"
          alt="G WORLD — Discover What You Need to Know.">
        <div class="intro-line"></div>
        <div class="intro-status">ENTERING G WORLD</div>
      </main>
    `;
    return;
  }

  if (state.screen === "entry") return renderEntry();
  if (state.screen === "onboard") return renderOnboard();
  if (state.screen === "existing") return renderExisting();
  if (state.screen === "card") return renderCard();
  if (state.screen === "home") return renderHome();
  if (state.screen === "courses") return renderCourses();

  if (state.screen === "course") {
    const course = universityCourses.find(
      x => x.id === state.selectedCourse
    );
    return renderCourse(course);
  }

  if (state.screen === "lesson") {
    const course = universityCourses.find(
      x => x.id === state.selectedCourse
    );

    const lesson = course?.lessons.find(
      x => x.id === state.selectedLesson
    );

    return renderLesson(course, lesson);
  }

  if (state.screen === "tech-skills") return renderTechSkills();

  if (state.screen === "skill") {
    const skill = techSkills.find(
      x => x.id === state.selectedSection
    );

    return renderSkill(skill);
  }

  if (state.screen === "skill-lesson") {
    const skill = techSkills.find(
      x => x.id === state.selectedSection
    );

    const lesson = skill?.lessons.find(
      x => x.id === state.selectedLesson
    );

    return renderLesson(
      {
        title: skill?.title,
        description: skill?.description
      },
      lesson
    );
  }

  if (state.screen === "information") return renderInformation();

  if (state.screen === "information-section") {
    const section = informationSections.find(
      x => x.id === state.selectedSection
    );

    return renderInformationSection(section);
  }

  if (state.screen === "information-item") {
    const section = informationSections.find(
      x => x.id === state.selectedSection
    );

    const item = section?.items[state.selectedLesson];

    return renderInformationItem(section, item);
  }

  if (state.screen === "jamb") return renderJamb();
  if (state.screen === "jamb-news") return renderJambNews();
  if (state.screen === "jamb-syllabus") return renderJambSyllabus();
  if (state.screen === "jamb-cbt") return renderJambCBT();
  if (state.screen === "jamb-combinations") return renderJambCombinations();
  if (state.screen === "jamb-past") return renderJambPast();

  if (state.screen === "jamb-stream") {
    return renderJambStream(state.selectedSection);
  }

  if (state.screen === "ican") return renderIcan();
  if (state.screen === "ats-study") return renderIcanStudy();
  if (state.screen === "ats-past") return renderIcanPast();
  if (state.screen === "ats-mixed") return renderIcanMixed();
  if (state.screen === "ats-news") return renderIcanNews();

  if (state.screen === "work-ready") return renderWorkReady();

  if (state.screen === "work-course") {
    return renderWorkCourse(
      workReady[Number(state.selectedLesson)]
    );
  }

  if (state.screen === "projects") return renderProjects();

  if (state.screen === "project") {
    return renderProject(
      projects[Number(state.selectedLesson)]
    );
  }

  if (state.screen === "project-writer") return renderProjectWriter();
  if (state.screen === "support") return renderSupport();

  if (state.screen === "python-playground") {
    return renderPythonPlayground();
  }

  if (state.screen === "admin-login") return renderAdminEntry();
  if (state.screen === "admin") return renderAdmin();

  if (state.screen.startsWith("admin-")) {
    const names = {
      "admin-members": ["Members", "Manage member records and account status."],
      "admin-courses": ["Courses", "Create and manage university courses."],
      "admin-skills": ["Skills", "Manage technology and digital skills."],
      "admin-lessons": ["Lessons", "Create structured lessons."],
      "admin-videos": ["Videos", "Attach exact YouTube videos to lessons."],
      "admin-questions": ["Questions", "Manage learning and CBT questions."],
      "admin-projects": ["Projects", "Manage practical projects."],
      "admin-models": ["Project Models", "Manage research methods."],
      "admin-resources": ["Resources", "Manage useful learning resources."],
      "admin-opportunities": ["Opportunities", "Manage reviewed opportunities."],
      "admin-research": ["Research / Discoveries", "Manage discoveries."],
      "admin-ai": ["AI Content", "Manage AI learning information."],
      "admin-certificates": ["Certificates", "Manage certificate eligibility and verification."],
      "admin-announcements": ["Announcements", "Publish important announcements."],
      "admin-information": ["Information", "Manage current and existing information."],
      "admin-payments": ["Payments", "Review manual payment submissions."],
      "admin-jamb": ["JAMB", "Manage syllabus, questions and updates."],
      "admin-ican": ["ICAN / ATS", "Manage ATS learning materials and questions."],
      "admin-support": ["GWard Support", "Review learner messages and replies."],
      "admin-review": ["Review Queue", "Review information before publication."],
      "admin-sources": ["Approved Sources", "Manage trusted information sources."],
      "admin-updates": ["Daily Updates", "Control the daily information cycle."],
      "admin-monitoring": ["Monitoring", "Monitor resource usage and free-tier protection."],
      "admin-storage": ["Storage Cleanup", "Safely remove unnecessary temporary information."],
      "admin-import": ["Import / Export", "Move structured G WORLD content without editing code."],
      "admin-settings": ["Settings", "Manage platform settings."]
    };

    const [title, description] =
      names[state.screen] || ["Admin", "G WORLD administration."];

    return renderAdminPage(title, description, state.screen);
  }
}
document.addEventListener("click", async e => {
  const target = e.target.closest("[data-a]");
  if (!target) return;

  const action = target.dataset.a;

  if (action === "new-member") {
    go("onboard");
    return;
  }

  if (action === "existing-member") {
    go("existing");
    return;
  }

  if (action === "back-entry") {
    go("entry");
    return;
  }

  if (action === "home") {
    go("home");
    return;
  }

  if (action === "logout") {
    localStorage.removeItem("gworld");
    state.member = null;
    state.error = "";
    state.loading = false;
    go("entry");
    return;
  }

  if (action === "reset") {
    localStorage.removeItem("gworld");
    state.member = null;
    state.error = "";
    state.screen = "splash";
    render();
    startIntro();
    return;
  }

  if (action === "courses") {
    go("courses");
    return;
  }

  if (action === "course") {
    state.selectedCourse = target.dataset.id;
    go("course");
    return;
  }

  if (action === "lesson") {
    state.selectedLesson = target.dataset.id;
    go("lesson");
    return;
  }

  if (action === "tech-skills") {
    go("tech-skills");
    return;
  }

  if (action === "skill") {
    state.selectedSection = target.dataset.id;
    go("skill");
    return;
  }

  if (action === "skill-lesson") {
    state.selectedLesson = target.dataset.id;
    go("skill-lesson");
    return;
  }

  if (action === "python-playground") {
    go("python-playground");
    return;
  }

  if (action === "run-python") {
    await runPython();
    return;
  }

  if (action === "ai" || action === "information") {
    go("information");
    return;
  }

  if (action === "information-section") {
    state.selectedSection = target.dataset.id;
    go("information-section");
    return;
  }

  if (action === "information-item") {
    state.selectedSection = target.dataset.section;
    state.selectedLesson = target.dataset.index;
    go("information-item");
    return;
  }

  if (action === "jamb") {
    go("jamb");
    return;
  }

  if (action === "jamb-news") {
    go("jamb-news");
    return;
  }

  if (action === "jamb-syllabus") {
    go("jamb-syllabus");
    return;
  }

  if (action === "jamb-cbt") {
    go("jamb-cbt");
    return;
  }

  if (action === "jamb-combinations") {
    go("jamb-combinations");
    return;
  }

  if (action === "jamb-past") {
    go("jamb-past");
    return;
  }

  if (action === "jamb-stream") {
    state.selectedSection = target.dataset.stream;
    go("jamb-stream");
    return;
  }

  if (action === "jamb-answer") {
    const q = jambQuestions.find(
      x => x.id === target.dataset.q
    );

    const result = document.querySelector(
      `#result-${CSS.escape(target.dataset.q)}`
    );

    if (!q || !result) return;

    const selected = Number(target.dataset.answer);

    result.textContent =
      selected === q.answer
        ? "✓ Correct. Keep going."
        : `Not quite. Review the topic and try again.`;

    result.className =
      `answer-result ${selected === q.answer ? "correct" : "incorrect"}`;

    return;
  }

  if (action === "ican") {
    go("ican");
    return;
  }

  if (action === "ats-study") {
    go("ats-study");
    return;
  }

  if (action === "ats-past") {
    go("ats-past");
    return;
  }

  if (action === "ats-mixed") {
    go("ats-mixed");
    return;
  }

  if (action === "ats-news") {
    go("ats-news");
    return;
  }

  if (action === "ats-study-link") {
    window.open(
      "https://www.icanig.org/",
      "_blank",
      "noopener,noreferrer"
    );
    return;
  }

  if (action === "work-ready") {
    go("work-ready");
    return;
  }

  if (action === "work-course") {
    state.selectedLesson = target.dataset.index;
    go("work-course");
    return;
  }

  if (action === "projects") {
    go("projects");
    return;
  }

  if (action === "project") {
    state.selectedLesson = target.dataset.index;
    go("project");
    return;
  }

  if (action === "project-writer") {
    go("project-writer");
    return;
  }

  if (action === "support") {
    go("support");
    return;
  }

  if (action === "admin-login") {
    go("admin-login");
    return;
  }

  if (action === "admin") {
    go("admin");
    return;
  }

  if (action.startsWith("admin-")) {
    go(action);
    return;
  }

  if (action === "admin-update-now") {
    alert(
      "Update request recorded. The secure Worker update endpoint should perform the approved-source review."
    );
    return;
  }

  if (action === "admin-pause-updates") {
    alert("Daily updates are now marked for pause.");
    return;
  }

  if (action === "cleanup-selected") {
    alert(
      "Cleanup selection recorded. Permanent identity, certificate and audit records must remain protected."
    );
    return;
  }

  if (action === "admin-publish-import") {
    alert(
      "Validate the content package before publishing it to the live content layer."
    );
    return;
  }

  if (action === "show-answer") {
    target.textContent = "Think about the question, then explain your answer.";
    return;
  }
});

document.addEventListener("submit", async e => {
  if (e.target.id === "f") {
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
          "Registration could not be completed.";

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
        "G WORLD could not connect to the registration service.";

      state.loading = false;
      render();
    }

    return;
  }

  if (e.target.id === "existing-form") {
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
      const response = await fetch(
        `${API_BASE}/api/member-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email
          })
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        state.error =
          result.error ||
          "We could not find a G WORLD account.";

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
        "G WORLD could not connect to the member service.";

      state.loading = false;
      render();
    }

    return;
  }

  if (e.target.id === "support-form") {
    e.preventDefault();

    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch(`${API_BASE}/api/support`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          gworldId: state.member?.gworldId,
          message: String(data.message || "").trim()
        })
      });

      if (!response.ok) {
        throw new Error("Support request failed.");
      }

      form.reset();

      alert(
        "Your message has been sent to the GWard team."
      );

    } catch (error) {
      console.error(error);

      alert(
        "The message could not be sent right now. Please try again."
      );
    }

    return;
  }

  if (e.target.id === "project-topic-form") {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    const topic = String(data.topic || "").trim();

    if (!topic) return;

    alert(
      `Your project topic is: ${topic}\n\nG WORLD will guide you through understanding the topic, research design, Chapter One to Chapter Five, analysis and presentation.`
    );

    return;
  }

  if (e.target.id === "admin-video-form") {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/content/video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) throw new Error("Save failed.");

      alert("Video saved.");
      go("admin-videos");

    } catch (error) {
      console.error(error);
      alert("The secure Admin service is not available yet.");
    }

    return;
  }

  if (e.target.id === "admin-question-form") {
    e.preventDefault();

    alert(
      "Question package prepared for the secure Admin question bank."
    );

    return;
  }

  if (e.target.id === "admin-source-form") {
    e.preventDefault();

    alert(
      "Approved source prepared for the secure daily update system."
    );

    return;
  }

  if (e.target.id === "admin-import-form") {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    try {
      JSON.parse(String(data.json || ""));

      alert(
        "Content package is valid JSON. It can now be previewed before publishing."
      );

    } catch {
      alert(
        "This content package is not valid JSON."
      );
    }
  }

  if (e.target.id === "admin-form") {
    e.preventDefault();

    const data = Object.fromEntries(
      new FormData(e.target)
    );

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify(data)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        state.error =
          result.error || "Admin authentication failed.";

        render();
        return;
      }

      state.error = "";
      go("admin");

    } catch (error) {
      console.error(error);

      state.error =
        "Secure Admin authentication is unavailable.";

      render();
    }
  }
});
let pyodide = null;
let pyodideReady = null;

async function loadPython() {
  if (pyodide) return pyodide;

  if (!pyodideReady) {
    pyodideReady = new Promise((resolve, reject) => {
      const script = document.createElement("script");

      script.src =
        "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js";

      script.onload = async () => {
        try {
          pyodide = await window.loadPyodide({
            indexURL:
              "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/"
          });

          resolve(pyodide);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(
          new Error("Python runtime could not be loaded.")
        );
      };

      document.head.appendChild(script);
    });
  }

  return pyodideReady;
}

async function runPython() {
  const input = document.querySelector("#python-code");
  const output = document.querySelector("#python-output");

  if (!input || !output) return;

  output.textContent = "Loading Python…";

  try {
    const runtime = await loadPython();

    runtime.globals.set(
      "gworld_code",
      input.value
    );

    const result = await runtime.runPythonAsync(`
import io
import contextlib

_buffer = io.StringIO()

with contextlib.redirect_stdout(_buffer):
    exec(gworld_code)

_buffer.getvalue()
    `);

    output.textContent =
      String(result || "").trim() ||
      "Code ran successfully with no printed output.";

  } catch (error) {
    output.textContent =
      `Python error:\n${error.message || error}`;
  }
}

function filterCombinations(value) {
  const results = document.querySelector(
    "#combination-results"
  );

  if (!results) return;

  const q = String(value || "").trim().toLowerCase();

  results.querySelectorAll(".combination-card").forEach(card => {
    card.style.display =
      !q ||
      card.textContent.toLowerCase().includes(q)
        ? ""
        : "none";
  });
}

document.addEventListener("input", e => {
  if (e.target.id === "combination-search") {
    filterCombinations(e.target.value);
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
  }, 1800);
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
