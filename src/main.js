import "./style.css";
import QRCode from "qrcode";

const app = document.querySelector("#app");

window.history.replaceState(
  { gworld: true, screen: "splash" },
  "",
  window.location.href
);

/* =========================================================
   G WORLD CORE STATE
========================================================= */

const state = {
  screen: "splash",
  history: [],
  member: null,
  error: "",
  loading: false,

  selectedTechSkill: null,
  selectedLesson: null,
  selectedUniversityCourse: null,

  lessonStage: "learn",

  quiz: {
    lessonId: null,
    questionIndex: 0,
    score: 0
  }
};

/* =========================================================
   CONFIG
========================================================= */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

/* =========================================================
   THEME
========================================================= */

const savedTheme = localStorage.getItem("gworld-theme") || "dark";

document.documentElement.dataset.theme = savedTheme;

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("gworld-theme", theme);
}

/* =========================================================
   SECURITY / HTML ESCAPING
========================================================= */

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));

/* =========================================================
   NAVIGATION
========================================================= */

function goTo(screen, options = {}) {
  if (state.screen === screen && !options.force) return;

  const excludedScreens = [
    "splash",
    "entry",
    "card"
  ];

  if (!excludedScreens.includes(state.screen)) {
    state.history.push(state.screen);
  }

  state.screen = screen;

  if (!options.replace) {
    window.history.pushState(
      { gworld: true, screen },
      "",
      window.location.href
    );
  }

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

  state.screen = state.history.pop();

  render();
}

window.addEventListener("popstate", event => {
  if (!event.state?.gworld) return;

  goBack();
});

/* =========================================================
   PYTHON RUNTIME
   Browser-side execution = no Cloudflare request
========================================================= */

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

/* =========================================================
   QUIZ
========================================================= */

function resetQuiz(lessonId) {
  state.quiz = {
    lessonId,
    questionIndex: 0,
    score: 0
  };
}

/* =========================================================
   PYTHON FOUNDATIONS CONTENT
========================================================= */

const pythonLessons = [

  {
    id: "python-1",
    number: 1,
    title: "Introduction to Python",
    summary:
      "Understand what Python is, where it is used and why people learn it.",

    learn: [
      [
        "What is Python?",
        "Python is a programming language used to give instructions to computers in a readable way."
      ],
      [
        "Where is Python used?",
        "Python is used in automation, data analysis, artificial intelligence, web development, education, research and many other areas."
      ],
      [
        "The main idea",
        "You do not need to memorise everything. You learn how to think through a problem and express the solution with code."
      ]
    ],

    examples: [
      'print("Hello, G WORLD!")',
      "print(2 + 3)"
    ],

    quiz: [],

    guidedPractice: null,

    apply:
      "Explain in your own words one problem Python could help you solve."
  },

  {
    id: "python-2",
    number: 2,
    title: "Python Basics",
    summary:
      "Learn the basic shape of Python programs and how instructions are executed.",

    learn: [
      [
        "Statements",
        "A statement is an instruction Python can execute."
      ],
      [
        "print()",
        "The print() function displays information."
      ],
      [
        "Comments",
        "Comments help humans understand code and are ignored by Python when the program runs."
      ]
    ],

    examples: [
      'print("My first program")',
      "# This is a comment",
      'print("Python is running")'
    ],

    quiz: [
      {
        question:
          "Which function is commonly used to display something in Python?",

        options: [
          "show()",
          "print()",
          "display_text()",
          "output()"
        ],

        answer: 1,

        explanation:
          "print() is Python's standard function for displaying output."
      }
    ],

    guidedPractice: {
      title: "First Coding Practice",

      instruction:
        "Write a Python program that prints your name and one thing you want to learn.",

      starter:
`print("My name is Elijah")
print("I want to learn Python")`
    },

    apply:
      "Change the program so it prints a different personal goal."
  },

  {
    id: "python-3",
    number: 3,
    title: "Variables",
    summary:
      "Learn how Python stores information so your program can use it later.",

    learn: [
      [
        "What is a variable?",
        "A variable is a name that refers to a value."
      ],
      [
        "Assignment",
        "The = sign assigns a value to a variable."
      ],
      [
        "Using variables",
        "Once a value has a name, you can use that name in another part of your program."
      ]
    ],

    examples: [
      'name = "Elijah"',
      "age = 25",
      "print(name)",
      "print(age)"
    ],

    watch: {
      title: "Variables in Python",
      url:
        "https://www.youtube.com/results?search_query=python+variables+for+beginners"
    },

    quiz: [],

    guidedPractice: {
      title: "Create Your First Variables",

      instruction:
        "Create variables for your name, age and favourite skill. Then print all three.",

      starter:
`name = "Elijah"
age = 25
skill = "Python"

print(name)
print(age)
print(skill)`
    },

    apply:
      "Create three new variables that could be useful in a student information program."
  },

  {
    id: "python-4",
    number: 4,
    title: "Data Types",
    summary:
      "Understand the main kinds of values Python works with.",

    learn: [
      [
        "String",
        "Text values are strings."
      ],
      [
        "Integer",
        "Whole numbers such as 10 and 250 are integers."
      ],
      [
        "Float",
        "Numbers with decimal parts, such as 3.14, are floats."
      ],
      [
        "Boolean",
        "A Boolean represents True or False."
      ]
    ],

    examples: [
      'name = "Elijah"',
      "age = 25",
      "score = 84.5",
      "passed = True"
    ],

    quiz: [],

    guidedPractice: {
      title: "Identify and Use Data Types",

      instruction:
        "Create one string, one integer, one float and one Boolean, then print them.",

      starter:
`name = "Python"
count = 10
price = 15.5
active = True

print(name)
print(count)
print(price)
print(active)`
    },

    apply:
      "Create variables that could represent a product name, quantity, price and availability."
  },

  {
    id: "python-5",
    number: 5,
    title: "Strings",
    summary:
      "Work with text and learn common string operations.",

    learn: [
      [
        "Text",
        "Strings store text."
      ],
      [
        "Combining text",
        "You can join strings together or use f-strings to build readable messages."
      ],
      [
        "Useful methods",
        "Python provides methods such as upper(), lower(), strip() and replace()."
      ]
    ],

    examples: [
      'first = "G"',
      'second = "WORLD"',
      'print(first + " " + second)',
      'print("python".upper())'
    ],

    quiz: [],

    guidedPractice: {
      title: "Work With Text",

      instruction:
        "Create a name variable and print a greeting using it.",

      starter:
`name = "Elijah"

print("Hello, " + name)
print(name.upper())`
    },

    apply:
      "Make a short welcome message for a G WORLD learner."
  },

  {
    id: "python-6",
    number: 6,
    title: "Numbers & Operators",
    summary:
      "Use arithmetic operators to make Python calculate.",

    learn: [
      [
        "Arithmetic",
        "Python can add, subtract, multiply and divide numbers."
      ],
      [
        "Operators",
        "Common operators include +, -, *, /, //, %, and **."
      ],
      [
        "Order",
        "Python follows normal mathematical precedence rules."
      ]
    ],

    examples: [
      "total = 20 + 5",
      "difference = 20 - 5",
      "product = 20 * 5",
      "quotient = 20 / 5"
    ],

    quiz: [],

    guidedPractice: {
      title: "Build a Calculator",

      instruction:
        "Create two numbers and calculate their sum, difference and product.",

      starter:
`a = 20
b = 5

print(a + b)
print(a - b)
print(a * b)`
    },

    apply:
      "Create a small calculation for the total cost of three items."
  },

  {
    id: "python-7",
    number: 7,
    title: "Input",
    summary:
      "Understand how programs can receive information from users.",

    learn: [
      [
        "Input",
        "input() normally allows a user to type information into a running Python program."
      ],
      [
        "Text first",
        "The value returned by input() is text unless you convert it."
      ],
      [
        "Conversion",
        "int() and float() can convert suitable text into numbers."
      ]
    ],

    examples: [
      'name = input("What is your name? ")',
      'print("Hello", name)',
      'age = int(input("Age: "))'
    ],

    quiz: [],

    guidedPractice: {
      title: "Understand User Input",

      instruction:
        "The G WORLD browser playground uses sample input so you can practise without opening a terminal.",

      starter:
`user_name = "Elijah"

print("Hello", user_name)`
    },

    apply:
      "Change the sample value and make the program display a different greeting."
  },

  {
    id: "python-8",
    number: 8,
    title: "Conditional Statements",
    summary:
      "Teach a program to make decisions.",

    learn: [
      [
        "if",
        "if runs a block when a condition is true."
      ],
      [
        "elif",
        "elif lets you test another condition when the previous one was false."
      ],
      [
        "else",
        "else handles the remaining case."
      ]
    ],

    examples: [
      "score = 75",
      'if score >= 50:',
      '    print("Pass")',
      'else:',
      '    print("Try again")'
    ],

    quiz: [],

    guidedPractice: {
      title: "Build a Simple Decision",

      instruction:
        "Create a score and print whether the learner passed.",

      starter:
`score = 72

if score >= 50:
    print("Pass")
else:
    print("Try again")`
    },

    apply:
      "Add a second condition for a distinction score."
  },

  {
    id: "python-9",
    number: 9,
    title: "Comparison & Logical Operators",
    summary:
      "Combine conditions so programs can reason about information.",

    learn: [
      [
        "Comparison",
        "Operators such as ==, !=, >, <, >= and <= compare values."
      ],
      [
        "and",
        "and requires both conditions to be true."
      ],
      [
        "or",
        "or requires at least one condition to be true."
      ],
      [
        "not",
        "not reverses a Boolean result."
      ]
    ],

    examples: [
      "age = 20",
      "has_id = True",
      'if age >= 18 and has_id:',
      '    print("Allowed")'
    ],

    quiz: [],

    guidedPractice: {
      title: "Combine Conditions",

      instruction:
        "Write a program that checks two conditions before allowing access.",

      starter:
`age = 21
has_id = True

if age >= 18 and has_id:
    print("Access allowed")
else:
    print("Access denied")`
    },

    apply:
      "Change the values and test different outcomes."
  },

  {
    id: "python-10",
    number: 10,
    title: "Loops",
    summary:
      "Repeat instructions without writing the same code again and again.",

    learn: [
      [
        "for loop",
        "A for loop repeats for each item in a sequence or range."
      ],
      [
        "while loop",
        "A while loop continues while a condition remains true."
      ],
      [
        "Why loops matter",
        "Loops make repeated tasks shorter and easier to maintain."
      ]
    ],

    examples: [
      "for number in range(5):",
      "    print(number)"
    ],

    quiz: [],

    guidedPractice: {
      title: "Repeat a Task",

      instruction:
        "Use a for loop to print the numbers 1 through 5.",

      starter:
`for number in range(1, 6):
    print(number)`
    },

    apply:
      "Change the loop so it prints five short learning messages."
  },

  {
    id: "python-11",
    number: 11,
    title: "Lists",
    summary:
      "Store multiple values together and work with them.",

    learn: [
      [
        "List",
        "A list stores multiple values in an ordered collection."
      ],
      [
        "Index",
        "List positions start at zero."
      ],
      [
        "Methods",
        "append(), remove() and sort() are common list operations."
      ]
    ],

    examples: [
      'skills = ["Python", "Excel", "AI"]',
      'print(skills[0])',
      'skills.append("SQL")'
    ],

    quiz: [],

    guidedPractice: {
      title: "Create a Skill List",

      instruction:
        "Create a list of skills, add one skill and print the list.",

      starter:
`skills = ["Python", "Excel", "AI"]

skills.append("SQL")

print(skills)`
    },

    apply:
      "Create a list of five subjects or skills you want to learn."
  },

  {
    id: "python-12",
    number: 12,
    title: "Tuples",
    summary:
      "Understand ordered collections that are not normally changed after creation.",

    learn: [
      [
        "Tuple",
        "A tuple is an ordered collection written with parentheses."
      ],
      [
        "Immutable",
        "Tuples are designed for values that should not be changed in place."
      ],
      [
        "Use",
        "They can be useful for fixed groups of related values."
      ]
    ],

    examples: [
      'point = (10, 20)',
      'print(point[0])'
    ],

    quiz: [],

    guidedPractice: {
      title: "Work With a Tuple",

      instruction:
        "Create a tuple containing three fixed values and access one of them.",

      starter:
`course_info = ("Python", "Beginner", 2026)

print(course_info[0])
print(course_info[1])`
    },

    apply:
      "Create a tuple representing a fixed set of information."
  },

  {
    id: "python-13",
    number: 13,
    title: "Dictionaries",
    summary:
      "Store information using meaningful keys and values.",

    learn: [
      [
        "Dictionary",
        "A dictionary stores key-value pairs."
      ],
      [
        "Keys",
        "Keys give names to values so you can retrieve information directly."
      ],
      [
        "Updating",
        "You can add or change values by assigning to a key."
      ]
    ],

    examples: [
      'student = {"name": "Elijah", "score": 84}',
      'print(student["name"])',
      'student["score"] = 90'
    ],

    quiz: [],

    guidedPractice: {
      title: "Build a Student Record",

      instruction:
        "Create a dictionary containing a name, course and score.",

      starter:
`student = {
    "name": "Elijah",
    "course": "Python",
    "score": 84
}

print(student["name"])
print(student["score"])`
    },

    apply:
      "Add one more field to the dictionary."
  },

  {
    id: "python-14",
    number: 14,
    title: "Sets",
    summary:
      "Store unique values and remove duplicates.",

    learn: [
      [
        "Set",
        "A set is an unordered collection of unique values."
      ],
      [
        "Duplicates",
        "Repeated values are automatically represented only once."
      ],
      [
        "Use",
        "Sets are useful when uniqueness matters."
      ]
    ],

    examples: [
      'skills = {"Python", "AI", "Python"}',
      "print(skills)"
    ],

    quiz: [],

    guidedPractice: {
      title: "Find Unique Values",

      instruction:
        "Create a set containing repeated values and observe the result.",

      starter:
`items = {"Python", "AI", "Python", "Excel", "AI"}

print(items)`
    },

    apply:
      "Create a set of unique skills you already know."
  },

  {
    id: "python-15",
    number: 15,
    title: "Functions",
    summary:
      "Create reusable blocks of code.",

    learn: [
      [
        "Function",
        "A function groups instructions so they can be reused."
      ],
      [
        "Parameters",
        "Parameters allow a function to receive information."
      ],
      [
        "Return",
        "return sends a result back to the code that called the function."
      ]
    ],

    examples: [
      "def greet(name):",
      '    return "Hello " + name',
      "",
      'print(greet("Elijah"))'
    ],

    quiz: [],

    guidedPractice: {
      title: "Create a Function",

      instruction:
        "Create a function that receives a name and returns a greeting.",

      starter:
`def greet(name):
    return "Hello " + name

print(greet("Elijah"))`
    },

    apply:
      "Create a function that calculates the total of two numbers."
  },

  {
    id: "python-16",
    number: 16,
    title: "Modules",
    summary:
      "Reuse code from Python's standard library and other modules.",

    learn: [
      [
        "Module",
        "A module is a Python file or library containing reusable code."
      ],
      [
        "import",
        "The import statement makes a module available to your program."
      ],
      [
        "Standard library",
        "Python includes useful modules such as math, random and datetime."
      ]
    ],

    examples: [
      "import math",
      "print(math.sqrt(25))"
    ],

    quiz: [],

    guidedPractice: {
      title: "Use a Module",

      instruction:
        "Import math and use it to calculate a square root.",

      starter:
`import math

number = 81

print(math.sqrt(number))`
    },

    apply:
      "Use another useful function from the math module."
  },

  {
    id: "python-17",
    number: 17,
    title: "Error Handling",
    summary:
      "Make programs respond safely when something goes wrong.",

    learn: [
      [
        "Errors",
        "Programs can fail because of invalid data, missing resources or programming mistakes."
      ],
      [
        "try",
        "try contains code that may produce an error."
      ],
      [
        "except",
        "except lets you handle a particular error instead of crashing unexpectedly."
      ]
    ],

    examples: [
      "try:",
      '    number = int("abc")',
      "except ValueError:",
      '    print("That was not a valid number.")'
    ],

    quiz: [],

    guidedPractice: {
      title: "Handle a Conversion Error",

      instruction:
        "Use try/except to handle invalid number conversion.",

      starter:
`try:
    number = int("abc")
    print(number)
except ValueError:
    print("Invalid number")`
    },

    apply:
      "Change the code so a valid number also works."
  },

  {
    id: "python-18",
    number: 18,
    title: "File Handling",
    summary:
      "Understand how Python can read and write files.",

    learn: [
      [
        "Files",
        "Programs can store information outside the running program using files."
      ],
      [
        "Modes",
        "Common modes include reading and writing."
      ],
      [
        "Safety",
        "with open() is a common safe pattern for managing files."
      ]
    ],

    examples: [
      'with open("notes.txt", "w") as file:',
      '    file.write("G WORLD")'
    ],

    quiz: [],

    guidedPractice: {
      title: "Understand File Writing",

      instruction:
        "Practise the idea using a virtual in-memory file because browser security may restrict ordinary file access.",

      starter:
`from io import StringIO

file = StringIO()

file.write("G WORLD")

print(file.getvalue())`
    },

    apply:
      "Change the text written to the virtual file."
  },

  {
    id: "python-19",
    number: 19,
    title: "Object-Oriented Programming",
    summary:
      "Model related data and behaviour using classes and objects.",

    learn: [
      [
        "Class",
        "A class is a blueprint for creating objects."
      ],
      [
        "Object",
        "An object is an instance created from a class."
      ],
      [
        "Methods",
        "Methods are functions defined inside a class."
      ]
    ],

    examples: [
      "class Student:",
      "    def __init__(self, name):",
      "        self.name = name"
    ],

    quiz: [],

    guidedPractice: {
      title: "Create a Class",

      instruction:
        "Create a simple Student class and an object from it.",

      starter:
`class Student:
    def __init__(self, name):
        self.name = name

student = Student("Elijah")

print(student.name)`
    },

    apply:
      "Add another property to the class."
  },

  {
    id: "python-20",
    number: 20,
    title: "Working with Libraries",
    summary:
      "Learn how Python projects use libraries to solve larger problems.",

    learn: [
      [
        "Library",
        "A library is reusable code that provides functionality you do not need to build from scratch."
      ],
      [
        "Choosing libraries",
        "Use reliable libraries that fit the problem and understand what they do."
      ],
      [
        "Project thinking",
        "Good developers combine their own logic with appropriate libraries."
      ]
    ],

    examples: [
      "import math",
      "numbers = [4, 9, 16]",
      "roots = [math.sqrt(n) for n in numbers]",
      "print(roots)"
    ],

    quiz: [],

    guidedPractice: {
      title: "Use a Library in a Small Task",

      instruction:
        "Use the math library to transform a list of numbers.",

      starter:
`import math

numbers = [4, 9, 16]

roots = [math.sqrt(n) for n in numbers]

print(roots)`
    },

    apply:
      "Modify the list and observe the result."
  },

  {
    id: "python-21",
    number: 21,
    title: "Practical Python Projects",
    summary:
      "Combine your Python foundations into useful small projects.",

    learn: [
      [
        "Project thinking",
        "A project starts with a problem, not random code."
      ],
      [
        "Plan first",
        "Break the problem into inputs, processing, decisions, data and outputs."
      ],
      [
        "Build progressively",
        "Start small, test each part and then add features."
      ]
    ],

    examples: [
      "scores = [70, 85, 90]",
      "average = sum(scores) / len(scores)",
      'print("Average:", average)'
    ],

    quiz: [],

    guidedPractice: {
      title: "Mini Project: Score Analyzer",

      instruction:
        "Build a small program that calculates the average score and reports whether it meets a target.",

      starter:
`scores = [70, 85, 90]

average = sum(scores) / len(scores)

print("Average:", average)

if average >= 50:
    print("Pass")
else:
    print("Try again")`
    },

    apply:
      "Extend the project with a highest-score or lowest-score result."
  }

];

/* =========================================================
   TECH SKILLS ENGINE
========================================================= */

const techSkills = {

  "python-foundations": {

    title: "Python Foundations",

    category: "Programming",

    description:
      "Learn Python from first principles through guided coding, challenges and practical projects.",

    lessons: pythonLessons
  }

};

/* =========================================================
   UNIVERSITY COURSE ENGINE
========================================================= */

const universityCourses = {

  "course-engine-demo": {

    title: "University Course Engine",

    department: "Academic Courses",

    description:
      "A reusable structure for university-level subjects. Future courses can be loaded into the same engine without rebuilding the interface.",

    modules: [

      {
        title: "Course Introduction",

        lessons: [

          {
            title: "Course Overview",

            learn:
              "This is the reusable University Course Engine. Future subjects such as Accounting can use the same structure."
          }

        ]
      }

    ]

  }

};

/* =========================================================
   DATA HELPERS
========================================================= */

function getTechSkill() {

  return state.selectedTechSkill
    ? techSkills[state.selectedTechSkill]
    : null;

}

function getLesson() {

  const skill = getTechSkill();

  if (!skill || !state.selectedLesson) {
    return null;
  }

  return (
    skill.lessons.find(
      lesson => lesson.id === state.selectedLesson
    ) || null
  );

}

/* =========================================================
   SPLASH
========================================================= */

function splashScreen() {

  app.innerHTML = `
    <main class="intro">

      <div class="intro-glow"></div>

      <img
        class="master-logo"
        src="/assets/gworld-master-logo.png"
        alt="G WORLD"
      >

      <div class="intro-line"></div>

      <div class="intro-status">
        Discover What You Need to Know.
      </div>

    </main>
  `;

  setTimeout(() => {

    if (state.screen === "splash") {
      goTo("entry", {
        replace: true
      });
    }

  }, 2200);

}

/* =========================================================
   ENTRY
========================================================= */

function entryScreen() {

  app.innerHTML = `

    <main class="splash center">

      <section class="panel">

        <div class="form-brand">
          <b>G</b> G WORLD
        </div>

        <div class="eyebrow">
          LEARNING & DISCOVERY
        </div>

        <h1>
          Welcome to G WORLD
        </h1>

        <p>
          Discover what you need to know,
          learn useful skills and build knowledge
          that moves you forward.
        </p>

        <div class="stack-actions">

          <button
            class="primary full"
            data-a="register">
            Create G WORLD ID
          </button>

          <button
            class="link full"
            data-a="login">
            Already a member? Sign in
          </button>

        </div>

      </section>

    </main>

  `;

}

/* =========================================================
   REGISTER
========================================================= */

function registrationScreen() {

  app.innerHTML = `

    <main class="splash center">

      <section class="panel">

        <button
          class="link"
          data-a="entry">
          ← Back
        </button>

        <div class="form-brand">
          <b>G</b> G WORLD
        </div>

        <div class="eyebrow">
          CREATE YOUR ACCOUNT
        </div>

        <h1>
          Join G WORLD
        </h1>

        <p>
          Your G WORLD ID is your platform identity.
          It is not a government ID.
        </p>

        <form id="register-form">

          <label>
            Full name
          </label>

          <input
            name="name"
            required
            autocomplete="name"
            placeholder="Your full name"
          >

          <label>
            Phone number
          </label>

          <input
            name="phone"
            required
            autocomplete="tel"
            placeholder="080..."
          >

          <label>
            Email
            <span style="opacity:.6">
              (optional)
            </span>
          </label>

          <input
            name="email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
          >

          <button
            class="primary full"
            type="submit">

            ${state.loading
              ? "Creating..."
              : "Create G WORLD ID"}

          </button>

          ${
            state.error
              ? `<div class="error">${esc(state.error)}</div>`
              : ""
          }

        </form>

      </section>

    </main>

  `;

}

/* =========================================================
   LOGIN
========================================================= */

function loginScreen() {

  app.innerHTML = `

    <main class="splash center">

      <section class="panel">

        <button
          class="link"
          data-a="entry">
          ← Back
        </button>

        <div class="form-brand">
          <b>G</b> G WORLD
        </div>

        <div class="eyebrow">
          MEMBER LOGIN
        </div>

        <h1>
          Welcome back
        </h1>

        <p>
          Use the phone number connected
          to your G WORLD account.
        </p>

        <form id="login-form">

          <label>
            Phone number
          </label>

          <input
            name="phone"
            required
            autocomplete="tel"
            placeholder="080..."
          >

          <button
            class="primary full"
            type="submit">

            ${state.loading
              ? "Signing in..."
              : "Sign in"}

          </button>

          ${
            state.error
              ? `<div class="error">${esc(state.error)}</div>`
              : ""
          }

        </form>

      </section>

    </main>

  `;

}

/* =========================================================
   MEMBER CARD
========================================================= */

function memberCardScreen() {

  const member = state.member || {};

  app.innerHTML = `

    <main class="splash center">

      <section class="card">

        <header>

          <div class="mini">
            <b>G</b> G WORLD
          </div>

          <span>
            MEMBER
          </span>

        </header>

        <section>

          <div class="eyebrow">
            G WORLD ID
          </div>

          <h2>
            ${esc(member.gworldId)}
          </h2>

          <div class="info">

            <div>
              <small>NAME</small>
              <strong>
                ${esc(member.name)}
              </strong>
            </div>

            <div>
              <small>PHONE</small>
              <strong>
                ${esc(member.phone)}
              </strong>
            </div>

            ${
              member.email
                ? `
                  <div>
                    <small>EMAIL</small>
                    <strong>
                      ${esc(member.email)}
                    </strong>
                  </div>
                `
                : ""
            }

          </div>

          <div
            class="qr"
            id="member-qr">
          </div>

        </section>

        <footer>
          Scan to verify this G WORLD membership.
        </footer>

        <button
          class="primary full"
          data-a="home">
          Enter G WORLD
        </button>

      </section>

    </main>

  `;

  generateMemberQR();

}

/* =========================================================
   QR
========================================================= */

async function generateMemberQR() {

  const node =
    document.querySelector("#member-qr");

  const member = state.member;

  if (!node || !member?.gworldId) return;

  try {

    const verificationUrl =
      `https://g-world.ogundeyelijah13.workers.dev/verify/${encodeURIComponent(
        member.gworldId
      )}`;

    const canvas =
      document.createElement("canvas");

    await QRCode.toCanvas(
      canvas,
      verificationUrl,
      {
        width: 180,
        margin: 1
      }
    );

    node.innerHTML = "";

    node.appendChild(canvas);

  } catch {

    node.textContent =
      "QR unavailable";

  }

}

/* =========================================================
   TOP NAVIGATION
========================================================= */

function topNav(title = "G WORLD") {

  const dark =
    document.documentElement.dataset.theme === "dark";

  return `

    <nav>

      <div class="mini">
        <b>G</b> ${esc(title)}
      </div>

      <div class="nav-user">

        <span>
          ${esc(state.member?.name || "")}
        </span>

        <button
          class="link"
          data-a="theme">
          ${dark ? "Light" : "Dark"}
        </button>

        <button
          class="link"
          data-a="logout">
          Logout
        </button>

      </div>

    </nav>

  `;

}

/* =========================================================
   HOME
========================================================= */

function homeScreen() {

  app.innerHTML = `

    <main class="home">

      ${topNav()}

      <section class="hero">

        <div class="eyebrow">
          WELCOME TO G WORLD
        </div>

        <h1>
          Discover What You Need to Know.
        </h1>

        <p>
          Learn skills. Understand your field.
          Find useful information. Build something real.
        </p>

      </section>

      <section class="doors">

        <div class="continue">

          <div>

            <small>
              YOUR LEARNING SPACE
            </small>

            <h2>
              Start with what moves you forward.
            </h2>

            <p>
              Choose a practical skill
              or explore academic learning.
            </p>

          </div>

        </div>

      </section>

      <section class="grid">

        <article data-a="courses">
          <small>01</small>
          <h3>Courses</h3>
          <p>
            University and academic course learning.
          </p>
        </article>

        <article data-a="tech-skills">
          <small>02</small>
          <h3>Tech Skills</h3>
          <p>
            Practical skills you can learn and practise.
          </p>
        </article>

        <article>
          <small>03</small>
          <h3>AI & Technology</h3>
          <p>
            Understand modern technology and AI.
          </p>
        </article>

        <article>
          <small>04</small>
          <h3>Opportunities</h3>
          <p>
            Discover opportunities that may move you forward.
          </p>
        </article>

        <article>
          <small>05</small>
          <h3>Discoveries & Research</h3>
          <p>
            Explore useful discoveries and research.
          </p>
        </article>

        <article>
          <small>06</small>
          <h3>Project Writer</h3>
          <p>
            Structure and develop academic projects.
          </p>
        </article>

        <article>
          <small>07</small>
          <h3>Academic Resources</h3>
          <p>
            Find useful learning resources.
          </p>
        </article>

        <article>
          <small>08</small>
          <h3>Work Ready</h3>
          <p>
            Build practical workplace readiness.
          </p>
        </article>

      </section>

      <footer>
        G WORLD · Discover What You Need to Know.
      </footer>

    </main>

  `;

}

/* =========================================================
   TECH SKILLS
========================================================= */

function techSkillsScreen() {

  app.innerHTML = `

    <main class="home">

      ${topNav("TECH SKILLS")}

      <section class="hero">

        <button
          class="link"
          data-a="home">
          ← Back
        </button>

        <div class="eyebrow">
          PRACTICAL LEARNING
        </div>

        <h1>
          Tech Skills
        </h1>

        <p>
          Learn a skill by understanding it,
          practising it and using it.
        </p>

      </section>

      <section class="grid">

        ${Object.entries(techSkills)
          .map(([id, skill]) => `

            <article data-a="skill:${esc(id)}">

              <small>
                ${esc(skill.category)}
              </small>

              <h3>
                ${esc(skill.title)}
              </h3>

              <p>
                ${esc(skill.description)}
              </p>

            </article>

          `)
          .join("")}

      </section>

    </main>

  `;

}

/* =========================================================
   TECH SKILL ROADMAP
========================================================= */

function skillRoadmapScreen() {

  const skill = getTechSkill();

  if (!skill) {
    goTo("tech-skills");
    return;
  }

  app.innerHTML = `

    <main class="home">

      ${topNav(skill.title)}

      <section class="hero">

        <button
          class="link"
          data-a="tech-skills">
          ← Back to Tech Skills
        </button>

        <div class="eyebrow">
          ${esc(skill.category)}
        </div>

        <h1>
          ${esc(skill.title)}
        </h1>

        <p>
          ${esc(skill.description)}
        </p>

      </section>

      <section
        class="panel"
        style="max-width:900px;margin:0 auto 28px;">

        <div class="eyebrow">
          ROADMAP
        </div>

        <h2>
          KNOW → UNDERSTAND → PRACTISE → APPLY → BUILD → VERIFY
        </h2>

        <p>
          Follow the lessons in order.
          Each lesson becomes more practical as you progress.
        </p>

      </section>

      <section class="grid">

        ${skill.lessons
          .map((lesson, index) => `

            <article data-a="lesson:${esc(lesson.id)}">

              <small>
                LESSON ${index + 1}
              </small>

              <h3>
                ${esc(lesson.title)}
              </h3>

              <p>
                ${esc(lesson.summary)}
              </p>

            </article>

          `)
          .join("")}

      </section>

    </main>

  `;

}

/* =========================================================
   LESSON NAVIGATION
========================================================= */

function lessonStageTabs(lesson) {

  const stages = ["learn"];

  if (lesson.watch) {
    stages.push("watch");
  }

  if (lesson.quiz?.length) {
    stages.push("check");
  }

  if (lesson.guidedPractice) {
    stages.push("practice");
  }

  if (lesson.apply) {
    stages.push("apply");
  }

  return `

    <div
      style="
        display:flex;
        gap:8px;
        flex-wrap:wrap;
        margin:20px 0;
      ">

      ${stages.map(stage => `

        <button
          class="${state.lessonStage === stage
            ? "primary"
            : "link"}"
          data-a="stage:${stage}"
          type="button">

          ${
            stage === "learn"
              ? "Learn"
              : stage === "watch"
                ? "Watch"
                : stage === "check"
                  ? "Check Understanding"
                  : stage === "practice"
                    ? "Practice"
                    : "Apply"
          }

        </button>

      `).join("")}

    </div>

  `;

}

/* =========================================================
   LESSON — LEARN
========================================================= */

function renderLessonLearn(lesson) {

  const nextStage =
    lesson.watch
      ? "watch"
      : lesson.quiz?.length
        ? "check"
        : lesson.guidedPractice
          ? "practice"
          : "apply";

  return `

    <section
      class="panel"
      style="max-width:900px;margin:auto;">

      <div class="eyebrow">
        LEARN
      </div>

      ${lesson.learn.map(([heading, text]) => `

        <div style="margin-bottom:24px;">

          <h3>
            ${esc(heading)}
          </h3>

          <p>
            ${esc(text)}
          </p>

        </div>

      `).join("")}

      <h3>
        Examples
      </h3>

      <pre
        style="
          background:var(--g-panel-soft);
          padding:18px;
          border-radius:14px;
          overflow:auto;
        "><code>${esc(
          lesson.examples.join("\n")
        )}</code></pre>

      <button
        class="primary full"
        data-a="stage:${nextStage}">

        Continue

      </button>

    </section>

  `;

}

/* =========================================================
   LESSON — WATCH
========================================================= */

function renderLessonWatch(lesson) {

  const nextStage =
    lesson.quiz?.length
      ? "check"
      : lesson.guidedPractice
        ? "practice"
        : "apply";

  return `

    <section
      class="panel"
      style="max-width:900px;margin:auto;">

      <div class="eyebrow">
        WATCH
      </div>

      <h2>
        ${esc(lesson.watch.title)}
      </h2>

      <p>
        Watch the focused lesson,
        then return to G WORLD for practice.
      </p>

      <a
        href="${esc(lesson.watch.url)}"
        target="_blank"
        rel="noopener noreferrer"
        style="
          display:block;
          text-align:center;
          text-decoration:none;
          margin:20px 0;
          padding:14px;
          border-radius:12px;
          background:var(--g-accent);
          color:var(--g-bg);
          font-weight:800;
        ">

        Watch on YouTube

      </a>

      <button
        class="primary full"
        data-a="stage:${nextStage}">

        Continue

      </button>

    </section>

  `;

}

/* =========================================================
   LESSON — CHECK
========================================================= */

function renderCheck(lesson) {

  const question =
    lesson.quiz[state.quiz.questionIndex];

  if (!question) {

    return `

      <section
        class="panel"
        style="max-width:900px;margin:auto;">

        <div class="eyebrow">
          CHECK COMPLETE
        </div>

        <h2>
          You scored
          ${state.quiz.score}/${lesson.quiz.length}
        </h2>

        <p>
          You have completed the understanding check.
        </p>

        <button
          class="primary full"
          data-a="${
            lesson.guidedPractice
              ? "stage:practice"
              : "stage:apply"
          }">

          ${
            lesson.guidedPractice
              ? "Start Practice"
              : "Continue"
          }

        </button>

      </section>

    `;

  }

  return `

    <section
      class="panel"
      style="max-width:900px;margin:auto;">

      <div class="eyebrow">

        CHECK YOUR UNDERSTANDING ·
        ${state.quiz.questionIndex + 1}/${lesson.quiz.length}

      </div>

      <h2>
        ${esc(question.question)}
      </h2>

      <div
        class="answer-grid"
        style="
          display:grid;
          gap:10px;
          margin-top:22px;
        ">

        ${question.options.map((option, index) => `

          <button
            class="link"
            data-a="answer:${index}"
            style="
              text-align:left;
              padding:14px;
              border:1px solid var(--g-border);
              border-radius:12px;
            ">

            ${esc(option)}

          </button>

        `).join("")}

      </div>

    </section>

  `;

}

/* =========================================================
   REUSABLE PYTHON PLAYGROUND
========================================================= */

function renderPlayground(lesson) {

  const practice = lesson.guidedPractice;

  return `

    <section
      class="panel"
      style="max-width:1000px;margin:auto;">

      <div class="eyebrow">
        GUIDED CODING / PRACTICE
      </div>

      <h2>
        ${esc(practice.title)}
      </h2>

      <p>
        ${esc(practice.instruction)}
      </p>

      <label
        style="
          display:block;
          margin-top:20px;
          font-weight:700;
        ">

        Your Python code

        <textarea
          id="python-editor"
          spellcheck="false"
          style="
            display:block;
            width:100%;
            min-height:260px;
            margin-top:8px;
            padding:16px;
            border-radius:14px;
            border:1px solid var(--g-border);
            background:var(--g-panel-soft);
            color:var(--g-text);
            font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
            font-size:15px;
            line-height:1.55;
          ">${esc(practice.starter)}</textarea>

      </label>

      <div
        style="
          display:flex;
          gap:10px;
          flex-wrap:wrap;
          margin-top:14px;
        ">

        <button
          class="primary"
          data-a="run-python">

          Run Code

        </button>

        <button
          class="link"
          data-a="reset-python">

          Reset Code

        </button>

      </div>

      <div style="margin-top:20px;">

        <div class="eyebrow">
          OUTPUT
        </div>

        <pre
          id="python-output"
          style="
            white-space:pre-wrap;
            min-height:100px;
            background:var(--g-panel-soft);
            padding:16px;
            border-radius:14px;
            overflow:auto;
          ">Press Run Code to execute your Python.</pre>

      </div>

      <div
        style="
          margin-top:24px;
          padding:18px;
          border-radius:14px;
          background:var(--g-panel-soft);
        ">

        <strong>
          Challenge
        </strong>

        <p>
          Do not only copy the example.
          Change something yourself, run the code,
          observe the result and explain what changed.
        </p>

      </div>

      <button
        class="primary full"
        style="margin-top:20px;"
        data-a="stage:apply">

        I Practised It — Continue

      </button>

    </section>

  `;

}

/* =========================================================
   LESSON — APPLY
========================================================= */

function renderApply(lesson) {

  return `

    <section
      class="panel"
      style="max-width:900px;margin:auto;">

      <div class="eyebrow">
        APPLY
      </div>

      <h2>
        Use what you learned
      </h2>

      <p>
        ${esc(lesson.apply)}
      </p>

      <div
        style="
          padding:18px;
          border-radius:14px;
          background:var(--g-panel-soft);
          margin:20px 0;
        ">

        <strong>
          Think before you code.
        </strong>

        <p>
          What information will your program need?
          What should it do with that information?
          What result should it produce?
        </p>

      </div>

      <button
        class="primary full"
        data-a="next-lesson">

        Complete Lesson

      </button>

    </section>

  `;

}

/* =========================================================
   NEXT LESSON
========================================================= */

function nextLesson() {

  const skill = getTechSkill();

  if (!skill) return;

  const index =
    skill.lessons.findIndex(
      lesson => lesson.id === state.selectedLesson
    );

  if (index === -1) return;

  if (index < skill.lessons.length - 1) {

    const next =
      skill.lessons[index + 1];

    state.selectedLesson = next.id;
    state.lessonStage = "learn";

    if (next.quiz?.length) {
      resetQuiz(next.id);
    }

    render();

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    });

    return;
  }

  goTo("python-complete");

}

/* =========================================================
   LESSON SCREEN
========================================================= */

function skillLessonScreen() {

  const skill = getTechSkill();
  const lesson = getLesson();

  if (!skill || !lesson) {
    goTo("skill-roadmap");
    return;
  }

  app.innerHTML = `

    <main class="home">

      ${topNav(skill.title)}

      <section class="hero">

        <button
          class="link"
          data-a="skill-roadmap">

          ← Back to Roadmap

        </button>

        <div class="eyebrow">

          LESSON ${lesson.number} ·
          ${esc(skill.category)}

        </div>

        <h1>
          ${esc(lesson.title)}
        </h1>

        <p>
          ${esc(lesson.summary)}
        </p>

        ${lessonStageTabs(lesson)}

      </section>

      ${
        state.lessonStage === "learn"
          ? renderLessonLearn(lesson)
          : ""
      }

      ${
        state.lessonStage === "watch" &&
        lesson.watch
          ? renderLessonWatch(lesson)
          : ""
      }

      ${
        state.lessonStage === "check" &&
        lesson.quiz?.length
          ? renderCheck(lesson)
          : ""
      }

      ${
        state.lessonStage === "practice" &&
        lesson.guidedPractice
          ? renderPlayground(lesson)
          : ""
      }

      ${
        state.lessonStage === "apply"
          ? renderApply(lesson)
          : ""
      }

    </main>

  `;

}

/* =========================================================
   PYTHON COMPLETE
========================================================= */

function pythonCompleteScreen() {

  app.innerHTML = `

    <main class="home">

      ${topNav("PYTHON FOUNDATIONS")}

      <section
        class="panel"
        style="max-width:900px;margin:50px auto;">

        <div class="eyebrow">
          FOUNDATIONS COMPLETE
        </div>

        <h1>
          You have reached the end
          of Python Foundations.
        </h1>

        <p>
          You have worked through the foundation topics
          and practised writing Python code directly
          in the browser.
        </p>

        <div
          style="
            padding:18px;
            background:var(--g-panel-soft);
            border-radius:14px;
            margin:24px 0;
          ">

          <strong>
            NEXT:
            BUILD → VERIFY → PRESENT → CERTIFY
          </strong>

          <p>
            The engine is structured so the future
            capstone, verification and certificate
            systems can connect without rebuilding
            the learning interface.
          </p>

        </div>

        <button
          class="primary full"
          data-a="skill-roadmap">

          Return to Python Roadmap

        </button>

      </section>

    </main>

  `;

}

/* =========================================================
   UNIVERSITY COURSES
========================================================= */

function coursesScreen() {

  app.innerHTML = `

    <main class="home">

      ${topNav("COURSES")}

      <section class="hero">

        <button
          class="link"
          data-a="home">

          ← Back to G WORLD

        </button>

        <div class="eyebrow">
          ACADEMIC LEARNING
        </div>

        <h1>
          Courses
        </h1>

        <p>
          University-style courses use a separate
          learning engine from practical Tech Skills.
        </p>

      </section>

      <section class="grid">

        ${Object.entries(universityCourses)
          .map(([id, course]) => `

            <article data-a="course:${esc(id)}">

              <small>
                ${esc(course.department)}
              </small>

              <h3>
                ${esc(course.title)}
              </h3>

              <p>
                ${esc(course.description)}
              </p>

            </article>

          `)
          .join("")}

      </section>

    </main>

  `;

}

/* =========================================================
   UNIVERSITY COURSE ENGINE
========================================================= */

function universityCourseScreen() {

  const course =
    universityCourses[
      state.selectedUniversityCourse
    ];

  if (!course) {
    goTo("courses");
    return;
  }

  app.innerHTML = `

    <main class="home">

      ${topNav("COURSES")}

      <section class="hero">

        <button
          class="link"
          data-a="courses">

          ← Back to Courses

        </button>

        <div class="eyebrow">
          ${esc(course.department)}
        </div>

        <h1>
          ${esc(course.title)}
        </h1>

        <p>
          ${esc(course.description)}
        </p>

      </section>

      ${course.modules.map(
        (module, moduleIndex) => `

          <section
            class="panel"
            style="
              max-width:900px;
              margin:0 auto 20px;
            ">

            <div class="eyebrow">
              MODULE ${moduleIndex + 1}
            </div>

            <h2>
              ${esc(module.title)}
            </h2>

            ${module.lessons.map(
              (lesson, lessonIndex) => `

                <div
                  style="
                    padding:16px;
                    margin-top:12px;
                    border:1px solid var(--g-border);
                    border-radius:14px;
                  ">

                  <small>
                    LESSON ${lessonIndex + 1}
                  </small>

                  <h3>
                    ${esc(lesson.title)}
                  </h3>

                  <p>
                    ${esc(lesson.learn)}
                  </p>

                </div>

              `
            ).join("")}

          </section>

        `
      ).join("")}

    </main>

  `;

}

/* =========================================================
   REGISTRATION
========================================================= */

async function handleRegistration(form) {

  state.loading = true;
  state.error = "";

  render();

  const data =
    Object.fromEntries(
      new FormData(form).entries()
    );

  try {

    const response =
      await fetch(
        `${API_BASE}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Registration failed."
      );
    }

    state.member =
      result.member || result;

    localStorage.setItem(
      "gworld",
      JSON.stringify(state.member)
    );

    state.loading = false;

    goTo("card");

  } catch (error) {

    state.loading = false;

    state.error =
      error.message ||
      "Registration failed.";

    render();

  }

}

/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(form) {

  state.loading = true;
  state.error = "";

  render();

  const data =
    Object.fromEntries(
      new FormData(form).entries()
    );

  try {

    const response =
      await fetch(
        `${API_BASE}/api/member-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Login failed."
      );
    }

    state.member =
      result.member || result;

    localStorage.setItem(
      "gworld",
      JSON.stringify(state.member)
    );

    state.loading = false;

    goTo("home");

  } catch (error) {

    state.loading = false;

    state.error =
      error.message ||
      "Login failed.";

    render();

  }

}

/* =========================================================
   RENDER ENGINE
========================================================= */

function render() {

  switch (state.screen) {

    case "splash":
      return splashScreen();

    case "entry":
      return entryScreen();

    case "register":
      return registrationScreen();

    case "login":
      return loginScreen();

    case "card":
      return memberCardScreen();

    case "home":
      return homeScreen();

    case "tech-skills":
      return techSkillsScreen();

    case "skill-roadmap":
      return skillRoadmapScreen();

    case "skill-lesson":
      return skillLessonScreen();

    case "python-complete":
      return pythonCompleteScreen();

    case "courses":
      return coursesScreen();

    case "university-course":
      return universityCourseScreen();

    default:
      return homeScreen();

  }

}

/* =========================================================
   FORM EVENTS
========================================================= */

document.addEventListener(
  "submit",
  event => {

    if (
      event.target.id ===
      "register-form"
    ) {

      event.preventDefault();

      handleRegistration(
        event.target
      );

    }

    if (
      event.target.id ===
      "login-form"
    ) {

      event.preventDefault();

      handleLogin(
        event.target
      );

    }

  }
);

/* =========================================================
   CLICK ENGINE
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const target =
      event.target.closest("[data-a]");

    if (!target) return;

    const action =
      target.dataset.a;

    /* -------------------------
       BASIC NAVIGATION
    ------------------------- */

    if (action === "register") {
      return goTo("register");
    }

    if (action === "login") {
      return goTo("login");
    }

    if (action === "entry") {
      return goTo("entry");
    }

    if (action === "home") {
      return goTo("home");
    }

    if (action === "courses") {
      return goTo("courses");
    }

    if (action === "tech-skills") {
      return goTo("tech-skills");
    }

    if (action === "skill-roadmap") {
      return goTo("skill-roadmap");
    }

    /* -------------------------
       THEME
    ------------------------- */

    if (action === "theme") {

      const current =
        document.documentElement.dataset.theme;

      setTheme(
        current === "dark"
          ? "light"
          : "dark"
      );

      render();

      return;
    }

    /* -------------------------
       LOGOUT
    ------------------------- */

    if (action === "logout") {

      localStorage.removeItem("gworld");

      state.member = null;
      state.history = [];
      state.selectedTechSkill = null;
      state.selectedLesson = null;
      state.selectedUniversityCourse = null;

      state.screen = "entry";

      window.history.replaceState(
        {
          gworld: true,
          screen: "entry"
        },
        "",
        window.location.href
      );

      render();

      return;
    }

    /* -------------------------
       TECH SKILL
    ------------------------- */

    if (action.startsWith("skill:")) {

      const skillId =
        action.slice(6);

      if (!techSkills[skillId]) {
        return;
      }

      state.selectedTechSkill =
        skillId;

      state.selectedLesson = null;
      state.lessonStage = "learn";

      return goTo("skill-roadmap");
    }

    /* -------------------------
       LESSON
    ------------------------- */

    if (action.startsWith("lesson:")) {

      const lessonId =
        action.slice(7);

      const lesson =
        getTechSkill()?.lessons.find(
          item => item.id === lessonId
        );

      if (!lesson) return;

      state.selectedLesson =
        lessonId;

      state.lessonStage =
        "learn";

      if (lesson.quiz?.length) {
        resetQuiz(lesson.id);
      }

      return goTo("skill-lesson");
    }

    /* -------------------------
       UNIVERSITY COURSE
    ------------------------- */

    if (action.startsWith("course:")) {

      const courseId =
        action.slice(7);

      if (!universityCourses[courseId]) {
        return;
      }

      state.selectedUniversityCourse =
        courseId;

      return goTo("university-course");
    }

    /* -------------------------
       LESSON STAGE
    ------------------------- */

    if (action.startsWith("stage:")) {

      const stage =
        action.slice(6);

      const lesson =
        getLesson();

      if (!lesson) return;

      state.lessonStage =
        stage;

      if (
        stage === "check" &&
        lesson.quiz?.length
      ) {

        if (
          state.quiz.lessonId !==
          lesson.id
        ) {

          resetQuiz(
            lesson.id
          );

        }

      }

      render();

      return;
    }

    /* -------------------------
       QUIZ ANSWER
    ------------------------- */

    if (action.startsWith("answer:")) {

      const lesson =
        getLesson();

      if (!lesson?.quiz?.length) {
        return;
      }

      const selected =
        Number(action.slice(7));

      const question =
        lesson.quiz[
          state.quiz.questionIndex
        ];

      if (!question) return;

      if (
        selected ===
        question.answer
      ) {

        state.quiz.score += 1;

      }

      state.quiz.questionIndex += 1;

      render();

      return;
    }

    /* -------------------------
       PYTHON RUN
    ------------------------- */

    if (action === "run-python") {

      const editor =
        document.querySelector(
          "#python-editor"
        );

      const output =
        document.querySelector(
          "#python-output"
        );

      if (!editor || !output) {
        return;
      }

      output.textContent =
        "Loading Python...";

      try {

        const runtime =
          await loadPython();

        let stdout = "";
        let stderr = "";

        runtime.setStdout({
          batched(text) {
            stdout += text;
          }
        });

        runtime.setStderr({
          batched(text) {
            stderr += text;
          }
        });

        await runtime.runPythonAsync(
          editor.value
        );

        output.textContent =
          stdout ||
          stderr ||
          "Code ran successfully with no printed output.";

      } catch (error) {

        output.textContent =
          error?.message ||
          String(error);

      }

      return;
    }

    /* -------------------------
       RESET PYTHON
    ------------------------- */

    if (action === "reset-python") {

      const lesson =
        getLesson();

      const editor =
        document.querySelector(
          "#python-editor"
        );

      const output =
        document.querySelector(
          "#python-output"
        );

      if (
        editor &&
        lesson?.guidedPractice
      ) {

        editor.value =
          lesson.guidedPractice.starter;

      }

      if (output) {

        output.textContent =
          "Press Run Code to execute your Python.";

      }

      return;
    }

    /* -------------------------
       NEXT LESSON
    ------------------------- */

    if (action === "next-lesson") {

      return nextLesson();

    }

  }
);

/* =========================================================
   RESTORE MEMBER
========================================================= */

const storedMember =
  localStorage.getItem("gworld");

if (storedMember) {

  try {

    state.member =
      JSON.parse(storedMember);

  } catch {

    localStorage.removeItem(
      "gworld"
    );

  }

}

/* =========================================================
   START
========================================================= */

render();
