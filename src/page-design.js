// Local, topic-specific vector illustrations. No stock-photo reuse or network requests.
const scenes = {
  directory: '<path d="M80 72h100v82H80zM200 72h100v82H200zM140 182h100v82H140z"/><path d="M130 154v14h120v-14m-60 14v14"/><path d="M102 96h56m-56 16h36m64-16h56m-56 16h36m-76 94h56m-56 16h36"/>',
  spreadsheet: '<rect x="62" y="64" width="256" height="208" rx="12"/><path d="M62 108h256M62 150h256M62 192h256M62 234h256M126 108v164m64-164v164m64-164v164"/><path class="art-highlight" d="M134 158h48v26h-48z"/><path d="m274 82 8 8 18-18"/>',
  terminal: '<rect x="52" y="64" width="276" height="204" rx="14"/><path d="M52 100h276M74 82h2m12 0h2m12 0h2m-26 46 20 16-20 16m38 0h48m-86 30h154m-154 18h110m-110 18h132"/><path class="art-highlight" d="m265 143-18 24 18 24m24-48 18 24-18 24"/>',
  ai: '<path d="m190 53 87 50v100l-87 50-87-50V103zM103 103l87 52 87-52m-87 52v98"/><circle cx="190" cy="155" r="22"/><path d="M103 103 65 81m212 22 38-22M103 203l-38 22m212-22 38 22M190 53V28m0 225v34"/><circle cx="65" cy="81" r="8"/><circle cx="315" cy="81" r="8"/><circle cx="65" cy="225" r="8"/><circle cx="315" cy="225" r="8"/>',
  exam: '<rect x="94" y="48" width="192" height="240" rx="12"/><path d="M138 48v-8h104v8m-94 42h84M154 130h90m-90 44h90m-90 44h90"/><path class="art-highlight" d="m116 128 8 8 15-18m-23 54 8 8 15-18m-23 54 8 8 15-18"/>',
  practice: '<rect x="55" y="65" width="270" height="183" rx="14"/><path d="M55 105h270M140 275h100m-50-27v27"/><circle cx="190" cy="173" r="42"/><path class="art-highlight" d="m175 173 11 11 24-25"/>',
  pathway: '<path d="M70 263h80v-55h80v-55h80V70M70 263v-50m80-5v-50m80-5v-50"/><path class="art-highlight" d="M84 155 275 52m-45-2 45 2-22 40"/><circle cx="70" cy="191" r="15"/>',
  research: '<circle cx="175" cy="135" r="75"/><circle cx="175" cy="135" r="54"/><path d="m230 190 71 71m-180-126h108m-92-25h70m-70 50h70"/><path class="art-highlight" d="m149 237 14-16 12 16m-75 0h49m26 0h38"/>',
  writing: '<path d="M85 60h150l45 45v172H85zM235 60v45h45M115 114h85m-85 28h100m-100 28h120m-120 28h80m-80 28h62"/><path class="art-highlight" d="m231 219 61-61 21 21-61 61-28 7zM282 168l21 21"/>',
  study: '<path d="M190 93c-45-28-97-25-134-10v165c45-14 90-11 134 11 44-22 89-25 134-11V83c-37-15-89-18-134 10Zm0 0v166M80 117c24-5 53-3 83 8m-83 19c24-5 53-3 83 8m-83 19c24-5 53-3 83 8m54-62c24-11 53-13 83-8m-83 34c24-11 53-13 83-8"/>',
  support: '<path d="M74 75h190v135H154l-43 34v-34H74z"/><path class="art-highlight" d="M264 125h44v132h-39l-33 27v-27h-70v-28"/><circle cx="122" cy="139" r="5"/><circle cx="169" cy="139" r="5"/><circle cx="216" cy="139" r="5"/>',
  payment: '<rect x="64" y="88" width="252" height="164" rx="18"/><path d="M64 128h252M94 214h57m-57-22h94"/><path class="art-highlight" d="m235 170 17 17 32-34"/>',
  certificate: '<path d="M64 66h252v190H64zM81 83h218v156H81M122 112h136m-111 27h86"/><circle cx="190" cy="198" r="32"/><path class="art-highlight" d="m173 224-10 60 27-17 27 17-10-60m-29-87 8 8 16-18"/>',
  science: '<path d="M155 45h70m-55 0v86L99 247c-9 15 0 29 17 29h148c17 0 26-14 17-29l-71-116V45M128 202h124"/><circle cx="174" cy="237" r="10"/><circle cx="212" cy="214" r="6"/><circle cx="190" cy="164" r="7"/>',
  art: '<path d="M190 53c-80 0-127 50-127 113s57 111 111 111c41 0 17-46 45-46h31c76 0 79-178-60-178Z"/><circle cx="116" cy="146" r="15"/><circle cx="149" cy="101" r="15"/><circle cx="208" cy="96" r="15"/><circle cx="252" cy="134" r="15"/><path class="art-highlight" d="m223 249 79-79 17 17-79 79-23 6z"/>',
  business: '<rect x="66" y="106" width="248" height="160" rx="15"/><path d="M146 106V68h88v38M66 158c73 35 175 35 248 0M176 164h28v35h-28z"/><path class="art-highlight" d="M109 237h29m25 0h29m25 0h54"/>',
  chart: '<path d="M65 65v207h259M103 243v-68h44v68m25 0V133h44v110m25 0V88h44v155"/><path class="art-highlight" d="m97 132 71-53 59 22 66-54m-28 0h28v28"/>',
  network: '<circle cx="190" cy="161" r="39"/><circle cx="89" cy="74" r="24"/><circle cx="291" cy="74" r="24"/><circle cx="89" cy="248" r="24"/><circle cx="291" cy="248" r="24"/><path d="m107 90 54 47m58 0 54-47m-166 142 54-47m58 0 54 47"/>',
  web: '<rect x="44" y="60" width="292" height="222" rx="14"/><path d="M44 104h292M67 82h2m14 0h2m14 0h2M66 125h248v47H66zM66 193h109v65H66zM195 193h119m-119 24h119m-119 24h77"/>',
  microscope: '<path d="m167 56 48 30-51 82-48-30zM158 76l-18-12m65 61c78 44 64 132-15 132M99 193h124M99 282h201M161 257v25"/><circle cx="231" cy="163" r="15"/><path d="M118 153v21m-28 29h18"/>',
  doorway: '<path d="M106 278V54h168v224M146 278V94h88v184M61 278h258"/><path class="art-highlight" d="M71 166h124m-26-26 26 26-26 26"/><circle cx="214" cy="178" r="5"/>',
  key: '<circle cx="142" cy="129" r="55"/><circle cx="142" cy="129" r="20"/><path d="m181 168 96 96 32-32-23-23-16 16-22-22 16-16-44-44"/>',
  seedling: '<path d="M190 258V138c-67 0-89-36-89-76 60-3 89 26 89 76m0 50c0-60 43-93 100-89-1 57-36 91-100 89M133 258h114l-12 44h-90z"/>',
  lock: '<rect x="99" y="145" width="182" height="139" rx="18"/><path d="M134 145V96a56 56 0 0 1 112 0v49"/><circle cx="190" cy="204" r="14"/><path d="M190 218v29"/>',
  ledger: '<path d="M82 48h216v240H82zM62 81h40m-40 39h40m-40 39h40m-40 39h40m-40 39h40M132 87h124m-124 33h124m-124 33h124m-124 33h124m-124 33h124m-44-132v165"/>',
  economics: '<path d="M70 55v214h242M96 93c60 0 98 123 190 123M96 227c60 0 98-123 190-123"/><circle cx="194" cy="159" r="13"/><path d="M194 176v93M70 159h107" stroke-dasharray="5 8"/>',
  finance: '<ellipse cx="154" cy="225" rx="78" ry="28"/><path d="M76 185v40m156-40v40M76 148v37m156-37v37M76 111v37m156-37v37"/><ellipse cx="154" cy="111" rx="78" ry="28"/><path d="M76 148c0 38 156 38 156 0m-156 37c0 38 156 38 156 0"/><circle cx="263" cy="102" r="43"/><path d="M263 80v44m13-36h-19a8 8 0 0 0 0 16h12a8 8 0 0 1 0 16h-20"/>',
  marketing: '<path d="M75 137h69l135-66v192l-135-66H75zM144 137v60m-39 0 20 71h41l-22-71m135-70 25 12v57l-25 12m-155-104 12-39m176 16 26-26m-18 226 26 26"/>',
  mathematics: '<path d="M190 64v210M82 169h216m-34-107c-15 72-43 106-75 106S126 134 111 62m-1 211c15-72 45-106 77-106s63 34 78 106"/><circle cx="190" cy="169" r="8"/>',
  biology: '<path d="M101 247C49 111 161 68 292 56c12 131-45 242-191 191ZM101 247 264 84m-114 114-7-75m46 36 76-2m-115 79h80m-38-81-3-65"/>',
  english: '<path d="M71 65h166v214H71zM97 98h112m-112 29h112m-112 29h76m-76 29h57"/><path d="m193 238 83-145 27 16-83 145-32 24zM276 93l9-16 27 16-9 16m-110 129 27 16"/>',
  communication: '<circle cx="190" cy="151" r="64"/><path d="M100 162v-22a90 90 0 0 1 180 0v22M100 144H76v68h38v-68zm180 0h24v68h-38v-68zM280 212c0 43-36 58-71 58"/><rect x="169" y="258" width="41" height="20" rx="10"/>',
  campus: '<path d="m55 120 135-65 135 65zM72 135h236M62 265h256M80 250h220M102 138v110m58-110v110m60-110v110m58-110v110"/><circle cx="190" cy="100" r="12"/>',
  office: '<path d="M117 59h147v215H117zM62 160h55v114H62m202-165h54v165h-54M170 274v-41h41v41M143 90h20m26 0h20m26 0h4m-96 34h20m26 0h20m26 0h4m-96 34h20m26 0h20m26 0h4m-96 34h20m26 0h20m26 0h4"/>',
  functions: '<path d="M68 71h244v196H68zM68 112h244M95 146l29 24-29 24m50 0h58m-58 35h115"/><path d="M210 136h74v67h-74zM247 136v67m-37-34h74"/>',
  puzzle: '<path d="M80 81h77c-18-43 64-43 46 0h77v77c43-18 43 64 0 46v77h-77c18-43-64-43-46 0H80v-77c43 18 43-64 0-46z"/>',
  news: '<path d="M72 73h225v189H72zM97 100h103v75H97zM222 100h50m-50 24h50m-50 24h50M97 202h175M97 228h175M297 97h25v148c0 23-25 23-25 0"/>',
  calendar: '<rect x="67" y="75" width="246" height="204" rx="15"/><path d="M67 126h246M125 53v45m130-45v45M102 158h30m40 0h30m40 0h30m-170 40h30m40 0h30m40 0h30m-170 40h30m40 0h30"/>',
  timetable: '<path d="M65 70h250v200H65zM65 110h250M125 110v160M65 150h250M65 190h250M65 230h250"/><path class="art-highlight" d="M140 123h70v15h-70zm50 40h110v15H190zm-50 40h110v15H140z"/>',
  atom: '<ellipse cx="190" cy="164" rx="126" ry="45"/><ellipse cx="190" cy="164" rx="126" ry="45" transform="rotate(60 190 164)"/><ellipse cx="190" cy="164" rx="126" ry="45" transform="rotate(120 190 164)"/><circle cx="190" cy="164" r="13"/>',
  balance: '<path d="M190 64v199M122 278h136M80 105h220M110 105l-44 93h88zm160 0-44 93h88zM66 198c0 51 88 51 88 0m72 0c0 51 88 51 88 0"/><circle cx="190" cy="83" r="15"/>',
  theatre: '<path d="M76 65c48 22 91 23 133 0v106c0 56-66 89-66 89S76 227 76 171zM107 120h20m31 0h20m-65 59c20 21 40 21 59 0"/><path d="M215 103c32-3 62-12 89-27v109c0 56-65 89-65 89s-25-16-44-42m34-82h18m25-7h18m-56 71c14-24 33-25 47-10"/>',
  target: '<circle cx="190" cy="172" r="105"/><circle cx="190" cy="172" r="70"/><circle cx="190" cy="172" r="35"/><path class="art-highlight" d="m190 172 96-96m-1 1 2-40 22 20 20 22-40 2"/>',
  branch: '<circle cx="190" cy="72" r="28"/><path d="M190 100v50M85 190v-40h210v40m-105-40v40"/><rect x="53" y="190" width="64" height="64" rx="12"/><rect x="158" y="190" width="64" height="64" rx="12"/><rect x="263" y="190" width="64" height="64" rx="12"/>',
  checklist: '<path d="M79 55h221v227H79zM108 94h24v24h-24zm0 62h24v24h-24zm0 62h24v24h-24zM156 101h111m-111 62h111m-111 62h111"/><path class="art-highlight" d="m110 101 9 9 16-22m-25 75 9 9 16-22"/>',
  handshake: '<path d="m59 131 40-53 60 32m162 21-40-53-60 32m-122 21 53-33h51l66 57-64 80-106-82M152 98l-34 42 24 16 39-31 81 61M118 177l-17 22 19 17 17-22m-1 13-13 18 19 16 15-19m0 0-10 22 19 16 17-23m0 0 14 16 24-25"/>',
  hourglass: '<path d="M118 50h144M118 282h144M133 50v55l57 61-57 61v55m114-232v55l-57 61 57 61v55M154 87h72l-36 41zm0 167 36-41 36 41z"/>',
  declined: '<path d="m190 45 127 229H63z"/><path class="art-highlight" d="M190 119v69m0 31v5"/>',
  dashboard: '<rect x="61" y="61" width="118" height="90" rx="12"/><rect x="201" y="61" width="118" height="151" rx="12"/><rect x="61" y="173" width="118" height="100" rx="12"/><rect x="201" y="234" width="118" height="39" rx="12"/><path d="M85 127v-25m26 25V86m26 41v-16m-52 87h70m-70 22h48m125-126v75m-19-45 19-19 19 19"/>',
  receipt: '<path d="M105 45h170v240l-22-13-21 13-21-13-21 13-21-13-21 13-21-13-22 13zM133 93h114m-114 35h114m-114 35h76m-76 60h114"/>',
  inbox: '<path d="M102 73h176l43 133v58H59v-58zM59 206h81l17 25h66l17-25h81M137 115h106m-106 35h106"/>',
  layers: '<path d="m62 112 128-66 128 66-128 66zm0 55 128 66 128-66M62 222l128 66 128-66"/>',
  graduation: '<path d="m53 126 137-67 137 67-137 67zM102 152v71c56 38 120 38 176 0v-71m49-26v116m-9 0h18v25h-18"/>',
  broadcast: '<path d="M190 165v116m-47 0h94"/><circle cx="190" cy="147" r="17"/><path d="M150 107a57 57 0 0 0 0 81m80-81a57 57 0 0 1 0 81m-107-108a96 96 0 0 0 0 135m134-135a96 96 0 0 1 0 135"/>',
  seal: '<path d="m190 48 30 20 36 1 10 34 27 24-12 35 3 36-32 17-19 30-35-4-34 11-24-27-34-11-1-36-20-30 20-30 1-36 34-11 24-27z"/><circle cx="190" cy="152" r="48"/><path d="m167 153 16 16 30-34M143 239l-9 56 56-28 56 28-9-56"/>',
  people: '<circle cx="190" cy="107" r="36"/><path d="M122 251v-33a68 68 0 0 1 136 0v33z"/><circle cx="85" cy="132" r="27"/><circle cx="295" cy="132" r="27"/><path d="M94 174a48 48 0 0 0-57 47v30h60m189-77a48 48 0 0 1 57 47v30h-60"/>',
  pulse: '<path d="M53 173h70l26-64 41 132 40-105 21 37h76M70 60h240v222H70"/>',
  cleanup: '<path d="M91 101h198M130 101V68h120v33M108 101l12 180h140l12-180M159 138v104m62-104v104"/>',
  settings: '<path d="M68 89h244M68 169h244M68 249h244"/><rect x="115" y="69" width="36" height="40" rx="8"/><rect x="232" y="149" width="36" height="40" rx="8"/><rect x="155" y="229" width="36" height="40" rx="8"/>',

};
const routeScenes = {
  entry: 'doorway', onboard: 'seedling', existing: 'key', 'admin-gate': 'lock',
  courses: 'campus', 'faculty-management': 'office', 'faculty-art': 'art', 'faculty-science': 'science',
  'course-accounting': 'ledger', 'course-economics': 'economics', 'course-business': 'business', 'course-finance': 'finance', 'course-marketing': 'marketing', 'course-research': 'microscope',
  'course-english': 'english', 'course-communication': 'communication', 'course-mathematics': 'mathematics', 'course-biology': 'biology',
  'tech-skills': 'web', 'excel-course': 'spreadsheet', 'python-course': 'terminal', 'python-intro': 'functions', 'python-practice': 'puzzle', 'ai-tech': 'ai',
  jamb: 'exam', 'jamb-information': 'calendar', 'jamb-news': 'news', 'jamb-syllabus': 'timetable', 'jamb-cbt': 'practice',
  'jamb-cbt-science': 'atom', 'jamb-cbt-commercial': 'balance', 'jamb-cbt-arts': 'theatre', 'jamb-cbt-general': 'target', 'jamb-combinations': 'network', 'combination-result': 'branch',
  'work-ready': 'handshake', 'work-course': 'checklist', payment: 'payment', 'payment-status': 'hourglass', 'payment-rejected': 'declined',
  support: 'support', certificate: 'certificate', 'project-writer': 'writing', opportunities: 'pathway', research: 'research', academic: 'study',
  admin: 'dashboard', 'admin-payments': 'receipt', 'admin-support': 'inbox', 'admin-content': 'layers', 'admin-jamb': 'graduation', 'admin-information': 'broadcast',
  'admin-certificates': 'seal', 'admin-members': 'people', 'admin-monitoring': 'pulse', 'admin-cleanup': 'cleanup', 'admin-settings': 'settings'
};

export function heroScene(screen) {
  if (routeScenes[screen]) return routeScenes[screen];
  if (/excel/.test(screen)) return 'spreadsheet';
  if (/python/.test(screen)) return screen.includes('practice') ? 'practice' : 'terminal';
  if (/ai-tech/.test(screen)) return 'ai';
  if (/certificate/.test(screen)) return 'certificate';
  if (/payment/.test(screen)) return 'payment';
  if (/support/.test(screen)) return 'support';
  if (/cbt/.test(screen)) return 'practice';
  if (/jamb|combination/.test(screen)) return screen.includes('combination') ? 'network' : 'exam';
  if (/project|research/.test(screen)) return screen === 'research' ? 'research' : 'writing';
  if (/faculty-art|english|communication/.test(screen)) return 'art';
  if (/faculty-science|biology/.test(screen)) return 'science';
  if (/accounting|finance|economics|mathematics/.test(screen)) return 'chart';
  if (/management|business|marketing/.test(screen)) return 'business';
  if (/tech-skills/.test(screen)) return 'web';
  if (/opportunit|work-/.test(screen)) return 'pathway';
  if (/academic|syllabus/.test(screen)) return 'study';
  return 'directory';
}
export function pageIllustration(screen) {
  const seed = [...screen].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const scene = heroScene(screen);
  // Route-specific orbit and small data marks distinguish related roadmap heroes.
  const marks = Array.from({length: 7}, (_, i) => `<path d="M${35 + i * 15} 310v-${5 + ((seed >>> (i * 3)) % 17)}"/>`).join('');
  return `<svg class="page-illustration" data-art="${screen}" data-scene="${scene}" viewBox="0 0 380 340" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="art-orbit" cx="190" cy="165" r="145" stroke-dasharray="${8 + seed % 19} 12"/><g class="art-scene">${scenes[scene]}</g><g class="art-data">${marks}<path d="M262 305h${25 + seed % 50}"/></g></svg>`;
}
export function enhanceSubpage(main, screen) {
  if (['home', 'splash', 'entry', 'existing', 'onboard', 'card', 'admin-gate'].includes(screen)) return;
  main.classList.add('modern-subpage');
  const hero = main.querySelector(':scope > .hero');
  if (hero) {
    hero.classList.add('subpage-hero');
    hero.dataset.scene = heroScene(screen);
    const copy = document.createElement('div');
    copy.className = 'subpage-hero-copy';
    while (hero.firstChild) copy.append(hero.firstChild);
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'page-breadcrumb';
    breadcrumb.innerHTML = `<button type="button" data-a="${screen.startsWith('admin') ? 'admin' : 'home'}">${screen.startsWith('admin') ? 'Dashboard' : 'Home'}</button><span aria-hidden="true">/</span><span>${screen.startsWith('admin') ? 'Workspace' : 'Explore & learn'}</span>`;
    copy.prepend(breadcrumb);
    const visual = document.createElement('div');
    visual.className = 'subpage-hero-art';
    visual.innerHTML = pageIllustration(screen);
    hero.append(copy, visual);
  }
  const paymentBrand = main.querySelector('.payment-brand');
  if (paymentBrand) paymentBrand.insertAdjacentHTML('beforeend', pageIllustration(screen));
  main.querySelectorAll('.grid').forEach(grid => {
    const count = grid.children.length;
    grid.dataset.columns = count === 1 ? 'one' : count === 2 || count === 4 ? 'two' : 'three';
  });
}
