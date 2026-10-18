export const FACULTIES = [
  { id: 'management', title: 'Faculty of Management Science', icon: 'briefcase', image: '/assets/sections/management.webp', description: 'Understand organisations, markets and financial decisions. Explore six academic course roadmaps.', courses: [
    ['course-accounting', 'Accounting', 'Build a foundation in records, double entry and financial statements.'],
    ['course-economics', 'Economics', 'Connect markets, demand and public policy to everyday decisions.'],
    ['course-business', 'Business Administration', 'Explore management, leadership and organisational responsibility.'],
    ['course-finance', 'Finance', 'Understand financial planning, investments and risk.'],
    ['course-marketing', 'Marketing', 'Explore customer needs, market research and marketing strategy.'],
    ['course-research', 'Research Methodology', 'Plan a research question, study design and evidence-based report.'],
  ] },
  { id: 'art', title: 'Faculty of Art', icon: 'pen', image: '/assets/sections/art.webp', description: 'Develop your voice through language, communication and critical reading. Start with introductory roadmap previews.', courses: [
    ['course-english', 'English Language', 'Strengthen reading, grammar and clear written expression.'],
    ['course-communication', 'Communication & Media', 'Explore audiences, storytelling and responsible communication.'],
  ] },
  { id: 'science', title: 'Faculty of Science', icon: 'spark', image: '/assets/sections/science.webp', description: 'Build confidence in scientific thinking, evidence and problem-solving. Explore introductory roadmap previews.', courses: [
    ['course-mathematics', 'Mathematics', 'Build confidence in numbers, algebra and mathematical reasoning.'],
    ['course-biology', 'Biology', 'Explore living systems, cells, genetics and the environment.'],
  ] },
];

export const EXTRA_COURSES = {
  'course-english': { title: 'English Language', preview: true, description: 'An introductory roadmap for reading thoughtfully and communicating clearly. Full lessons are not published yet.', modules: ['Reading for Understanding', 'Grammar Foundations', 'Vocabulary in Context', 'Sentence Structure', 'Academic Paragraphs', 'Writing and Revision'] },
  'course-communication': { title: 'Communication & Media', preview: true, description: 'Explore how messages reach audiences and shape understanding. This is a roadmap preview, not an unlocked course.', modules: ['Principles of Communication', 'Understanding Audiences', 'Media Literacy', 'Research and Fact-checking', 'Storytelling', 'Communication Ethics'] },
  'course-mathematics': { title: 'Mathematics', preview: true, description: 'Plan a learning path through foundational mathematical ideas. Full lessons and assessments are not available yet.', modules: ['Number Foundations', 'Algebraic Expressions', 'Equations and Inequalities', 'Functions and Graphs', 'Geometry', 'Statistics and Probability'] },
  'course-biology': { title: 'Biology', preview: true, description: 'A starting roadmap for understanding living systems. Full lessons and assessments are not available yet.', modules: ['Characteristics of Living Things', 'Cell Structure', 'Nutrition and Energy', 'Genetics', 'Ecology', 'Scientific Investigation'] },
};

export function facultyForScreen(screen) {
  return FACULTIES.find(faculty => screen === `faculty-${faculty.id}` || faculty.courses.some(([id]) => id === screen));
}
