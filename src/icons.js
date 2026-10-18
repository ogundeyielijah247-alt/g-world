// Small consistent stroke icons; no external font, tracking, or runtime dependency.
const paths = {
  book: '<path d="M12 5v15M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 1-3-2-6-2-9-1Z"/>',
  code: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 20"/>',
  spreadsheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 9v12m6-12v12M7 6h10"/>',
  python: '<path d="M12 12H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8v3a3 3 0 0 0 3 3h6a4 4 0 0 0 4-4v-1a4 4 0 0 0-4-4h-5M8 9h5a3 3 0 0 0 3-3"/><circle cx="10" cy="6" r=".7" fill="currentColor" stroke="none"/><circle cx="14" cy="18" r=".7" fill="currentColor" stroke="none"/>',
  javascript: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M11 9v7a2 2 0 0 1-4 0m11-6c-3-3-6 1-3 3l2 1c3 2 0 6-3 3"/>',
  web: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 8h20M6 5.5h.01m3 0h.01M8 12l-3 3 3 3m8-6 3 3-3 3m-3-7-2 8"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5Zm4 2v6c4 3 8 3 12 0v-6m4-2v8"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  pen: '<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Zm0 0 1-6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0m-9 1v4"/>',
  chat: '<path d="M21 11a9 9 0 0 1-13 8l-5 2 1-5a9 9 0 1 1 17-5Z"/><path d="M8 10h8m-8 4h5"/>',
  shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 10 3 3 5-6"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18m-5 4h5v5h-5Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
export function icon(name = 'book', className = '') {
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
}
export function sectionIcon(value = '') {
  if (/payment|finance|accounting|billing/.test(value)) return 'wallet';
  if (/admin|security|verification|certificate/.test(value)) return 'shield';
  if (/support|communication|message|customer/.test(value)) return 'chat';
  if (/excel|spreadsheet|worksheet|pivot|formula/.test(value)) return 'spreadsheet';
  if (/python/.test(value)) return 'python';
  if (/javascript/.test(value)) return 'javascript';
  if (/html|css|web/.test(value)) return 'web';
  if (/tech-skills|sql|git|data|power bi/.test(value)) return 'code';
  if (/ai-tech|technology|ai tools|ai research/.test(value)) return 'spark';
  if (/jamb|academic|syllabus|cbt/.test(value)) return 'cap';
  if (/project|chapter/.test(value)) return 'pen';
  if (/research|discover/.test(value)) return 'search';
  if (/opportunit/.test(value)) return 'compass';
  if (/work|leadership|team|business/.test(value)) return 'briefcase';
  return 'book';
}
