/* ===========================================================
   CONTENT. Edit these arrays to update the site.
   =========================================================== */

// id is what the arm and the stylesheet know the page by; file is the page
// itself. Renaming a file means changing it here and nowhere else.
const TABS = [
  { id:'home', file:'index.html',     label:'Home'      },
  { id:'about', file:'about.html',    label:'About'     },
  { id:'projects', file:'projects.html', label:'Projects'  },
  { id:'docs', file:'documents.html',     label:'Documents' },
  { id:'apps', file:'links.html',     label:'Links'     }
];

// Photos of me. Drop the files in assets/ and they appear; until then each slot
// shows a labelled placeholder with the filename it is looking for.
/* Anything you want here. Add, remove or reorder freely: the page builds
   whatever is in this list, and an empty list hides the section. Keep v to a
   line or so, it sits under the picture. shape is optional and sets how many
   cells the tile takes: 'big' is two by two, 'wide' and 'tall' are two by one
   each way, anything else is a single cell. Leave it out and the tiles take
   a repeating pattern of shapes on their own. Clicking a tile opens the same
   gallery a project has, so more is the rest of the pictures for that
   interest, exactly as it works below. Drop the line for a single picture. */
const INTERESTS = [
  { k:'Music', shape:'big',
    img:'assets/interest-music.jpg',
    more:['assets/interest-music-2.jpg', 'assets/interest-music-3.jpg'],
    v:'Guitar, bass, piano, drums, the works. Practicing to be better.' },
  { k:'Photography', shape:'tall',
    img:'assets/interest-photos.jpg',
    more:['assets/interest-photos-2.jpg', 'assets/interest-photos-3.jpg'],
    v:'Me, my iPhone, and my dream Sony a7III.' },
  { k:'Board games', shape:'small',
    img:'assets/interest-games.jpg',
    more:['assets/interest-games-2.jpg', 'assets/interest-games-3.jpg'],
    v:'Catan, Clue, Banagrams, etc.' },
  { k:'Art', shape:'small',
    img:'assets/interest-art.jpg',
    more:['assets/interest-art-2.jpg', 'assets/interest-art-3.jpg'],
    v:'A little bit of sketching here and there.' }
];
const SHAPES = ['big', 'tall', 'small', 'small', 'wide', 'tall'];

/* Capability, laid out as columns like the legend on a drawing. Each entry is
   a heading and the things under it; add or remove either and the row of
   columns reflows on its own. */
const CAPABILITY = [
  { k:'Programming', v:['MATLAB', 'Simulink', 'Python (NumPy, Pandas)', 'C', 'C++',
                        'Java', 'JavaScript', 'G-Code', 'UNIX', 'Git'] },
  { k:'CAD and manufacturing', v:['SolidWorks', 'Fusion 360', 'Onshape', 'FEA', 'GD&T',
                        'CAM', 'DFM', '3D printing', 'CNC machining', 'machine shop'] },
  { k:'Electronics', v:['KiCad', 'LTspice', 'soldering', 'wire harnessing',
                        'sensor integration', 'DAQ', 'motor control', 'Arduino', 'Raspberry Pi'] },
  { k:'IT and software', v:['Windows and macOS', 'Crestron', 'Classroom AV', 'Microsoft Office',
                        'Google Workspace', 'VS Code', 'Adobe Creative Cloud','Canva','Cisco WebX'] },
  { k:'Languages', v:['English (native)', 'Vietnamese (native)'] }
];

const ABOUT_FIGS = [
  { src:'assets/paul-shop.jpg', cap:'In the shop' }
];

/* Projects, in the order they appear on the sheet.
   img is the thumbnail on the tile and the first view in the detail sheet.
   more is the rest of that gallery: two further photographs by default, which
   you can cut to one, drop entirely, or extend past two. A plain filename is
   captioned with the view number alone; write { src, cap } instead to say what
   the picture shows:

     more: [{ src:'assets/dum-e-arm-2.jpg', cap:'Wrist assembly' },
            'assets/dum-e-arm-3.jpg'],

   Any file that is not there yet shows a labelled placeholder naming it, so
   the gallery works while you are still taking the photographs.

   A view can be a moving picture as easily as a still. An animated .gif needs
   nothing but the filename. A .mp4, .webm or .m4v plays silently on a loop
   while it is on screen and stops when it is not, and takes an optional poster
   frame for the moment before it starts:

     more: [{ src:'assets/dum-e-arm-2.mp4', poster:'assets/dum-e-arm-2.jpg',
              cap:'Picking up a bolt' },
            'assets/dum-e-arm-3.jpg'],

   The same is true of img above and of the Interests tiles. */
const PROJECTS = [
  {
    title: 'Nozzle test controller',
    blurb: 'A test controller for a rocket nozzle sample, controlling igition and recording load data.',
    wip: true,
    img:   'assets/nozzle-controller.jpg',
    more:  [//'assets/nozzle-controller-clip.mp4',
            'assets/nozzle-controller-2.jpg', 'assets/nozzle-controller-3.jpg'],
    when:  'Fall 2026 - Present',
    body:  '',
    spec:  ['Control systems', 'Schematic Design','Instrumentation']
  },
  {
    title: 'DUM-E robotic arm replica',
    blurb: 'A multi-axis replica of the shop arm from Iron Man, with a Python voice-control layer.',
    wip: true,
    img:   'assets/dum-e-arm.jpg',
    more:  ['assets/dum-e-arm-clip.mp4',
            'assets/dum-e-arm-2.jpg', 'assets/dum-e-arm-3.jpg'],
    when:  'Summer 2026 - Present',
    body:  'A multi-axis replica of DUM-E, the shop arm from the Iron Man films. More than 30 custom parts designed, printed and assembled across three design revisions and about 150 hours so far. The current work is a Python voice-control layer that maps spoken commands onto coordinated joint movement, now past a thousand lines and four hardware and software iterations.',
    spec:  ['SolidWorks','3D printing','Python','Inverse kinematics','Servo control']
  },
  {
    title: 'Battery degradation in MBTA electric buses',
    blurb: 'How fast charging and cold weather cycling wear out the lithium-ion cells in the MBTA electric bus fleet.',
    img:   'assets/mbta-battery.jpg',
    doc:   'assets/mbta-battery-doc.pdf',
    more:  ['assets/mbta-battery-2.jpg', 'assets/mbta-battery-3.jpg', 'assets/mbta-battery-4.jpg'],
    when:  'Spring 2026',
    body:  'Worked with four other mechanical engineering students on how fast charging and cold weather cycling wear out NMC 111 lithium-ion cells in the MBTA electric bus fleet, across more than 25 peer-reviewed studies. Traced three degradation mechanisms (lithium-ion diffusion, intergranular cracking and SEI layer growth) and proposed two materials fixes: single-crystal cathodes and dopant incorporation.',
    spec:  ['Materials science','Electrochemistry','Research']
  },
  {
    title: 'HTS junction box',
    blurb: 'The electrical junction box for a liquid propulsion test stand, utilizing more than 20 sensors and actuators.',
    img:   'assets/hts-junction-box.jpg',
    more:  ['assets/hts-junction-box-2.jpg', 'assets/hts-junction-box-3.jpg','assets/hts-junction-box-4.jpg'],
    when:  'Spring 2026',
    body:  'Designed and documented the electrical junction box for the liquid propulsion test stand with BURPG, tying together more than 20 sensors and actuators: pressure transducers, thermocouples and solenoid valves. Consolidating 14 connectors down to 6 and standardizing pin assignments across 40 or so channels cut assembly time by roughly a third and made integration errors far less likely. Wrote the full pinout and wiring documentation that went with it.',
    spec:  ['Electrical integration','Harness design','Documentation']
  },
  {
    title: 'Chord detection',
    blurb: 'A Python program takes in audio input to determine chords and notes being played.',
    img:   'assets/chord-detect-clip.mp4',
    doc:   'assets/chord-detect-doc.pdf',
    more:  ['assets/chord-detect.jpg',
            'assets/chord-detect-2.jpg', 'assets/chord-detect-3.jpg'],
    repo:  'chorddetectr',
    when:  'Spring 2025',
    body:  'A Python program that listens to takes in audio and determines the chord being played, by taking the spectrum apart and folding it into a pitch class profile before matching against chord templates. Writeup still to come: how it handles inversions, and where it currently falls over on distorted guitar.',
    spec:  ['Python','FFT','Signal processing','Audio']
  },
  {
    title: 'Truss structural analysis',
    blurb: 'Designing, creating a truss and analyzing the member forces in a truss determining buckling members and forces.',
    img:   'assets/truss-analysis.jpg',
    doc:   'assets/truss-analysis-doc.pdf',
    more:  ['assets/truss-analysis-2.jpg', 'assets/truss-analysis-3.jpg'],
    when:  'Spring 2026',
    body:  'FILL IN: the method, the loads applied, and what the analysis showed. Worth saying whether it was actually built and tested, and how the prediction compared with what it did.',
    spec:  ['Statics','Structural analysis']
  },
  {
    title: 'FPGA Whack-A-Mole',
    blurb: 'The arcade game in Verilog on a Nexys A7 board, drawn live to a VGA monitor.',
    img:   'assets/whack-a-mole.jpg',
    doc:   'assets/whack-a-mole-doc.pdf',
    more:  ['assets/whack-a-mole-2.jpg', 'assets/whack-a-mole-3.jpg', 'assets/whack-a-mole-clip.mp4', 'assets/whack-a-mole-4.jpg'],
    when:  'Fall 2025',
    body:  'Whack-A-Mole implemented in Verilog on a Nexys A7 FPGA and drawn live to a 640 by 480 VGA monitor. Eleven modules in a three tier hierarchy under whack_game_top, with the gameplay held in a four state machine: level select, a five second countdown, thirty seconds of play, then game over and back to the menu. The three difficulties change how long a mole stays lit, from one second down to 0.4, by varying how many ticks of a 10 Hz clock pass before the next one appears. Two clock dividers cut the board\u2019s 100 MHz down to 1 Hz for the timers and 10 Hz for the moles, each of the five pushbuttons runs through its own debouncer, and the slow clocks are edge detected back into the 100 MHz domain so a tick is counted exactly once. Mole positions come off a free running 16 bit counter, constrained to the five holes and stopped from picking the same hole twice in a row. Score and time are multiplexed across the eight digit seven segment display at about 381 Hz and drawn again on the VGA screen.',
    spec:  ['Verilog', 'FPGA', 'VGA', 'Finite state machines', 'Digital logic']
  },
  {
    title: 'Light based IR communication',
    blurb: 'A pair of boards that move data between them over nothing but infrared light.',
    img:   'assets/ir-link.jpg',
    more:  ['assets/ir-link-clip.mp4',
            'assets/ir-link-2.jpg', 'assets/ir-link-3.jpg','assets/ir-link-4.jpg'],
    when:  '2026',
    body:  'A pair of devices that move data between them over nothing but infrared light. A modulated IR LED on one end, a phototransistor and demodulator on the other, with framing and error checking around the bytes in between. Controlled with a keypad, inputs controlling signal sent and transmitter rotation.',
    spec:  ['Analog circuits','Modulation','Microcontrollers','KiCad']
  },
  {
    title: 'Lexus IS300 manual transmission',
    blurb: 'A full SolidWorks model of an IS300 manual gearbox, with FEA run across the assembly.',
    img:   'assets/is300-transmission-clip.mp4',
    more:  ['assets/is300-transmission-2.jpg', 'assets/is300-transmission-3.jpg', 'assets/is300-transmission-4.jpg'],
    when:  'Summer 2025',
    body:  'Modelled the gears, shafts, synchronizers and housing of an IS300 manual gearbox in SolidWorks, then ran FEA across the assembly to look at stress distribution, torque capacity, and where wear actually shows up first.',
    spec:  ['SolidWorks','FEA','GD&amp;T']
  },
  {
    title: 'EKG data processing',
    blurb: 'Reading a multitude of EKG traces under varying conditions and pulling the beats out of it, in Python and MATLAB.',
    img:   'assets/ekg-processing.jpg',
    more:  ['assets/ekg-processing-2.jpg', 'assets/ekg-processing-3.jpg'],
    when:  'Fall 2024',
    body:  'FILL IN: what the signal chain does, how beats are found, and what Python and MATLAB each handled. Numbers carry this kind of project, so put them in if you have them: sample rate, how many records, how well the detection did.',
    spec:  ['Python','MATLAB','Signal processing']
  },
  {
    title: 'Temperature sensing box',
    blurb: 'An enclosed sensor box that logs ambient temperature and humidity so a room can be watched over days.',
    img:   'assets/temp-box.jpg',
    doc:   'assets/temp-box-doc.pdf',
    more:  ['assets/temp-box-2.jpg', 'assets/temp-box-3.jpg'],
    repo:  'roomtempmon',
    when:  'Fall 2025',
    body:  'A small enclosed sensor box that reads ambient temperature and humidity on a microcontroller and logs the result so a room can be watched over days rather than glanced at.',
    spec:  ['Arduino','Sensor integration','Enclosure design','Data logging']
  },
  {
    title: 'QUARTOR',
    blurb: 'An autonomous quadcopter for disaster response, with thermal imaging and survivor detection from the air.',
    img:   'assets/quartor.jpg',
    doc:   'assets/quartor-doc.pdf',
    more:  ['assets/quartor-2.jpg', 'assets/quartor-3.jpg'],
    when:  '2023 - 2024',
    body:  'An autonomous quadcopter for disaster response: thermal imaging from the air, plus survivor detection in terrain that is unsafe to walk into. Real-time object recognition ran on YOLOv5 through a Google Colab pipeline to find and track people on the ground.',
    spec:  ['Python','YOLOv5','Autonomy','Thermal imaging']
  },
  {
    title: 'FIRST Robotics grappling system',
    blurb: 'The mechanical design and assembly of the grappling mechanism, from CAD through machining.',
    img:   'assets/first-grappler.jpg',
    more:  ['assets/first-grappler-2.jpg'],
    when:  '2023',
    body:  'Owned the mechanical design and assembly of the grappling mechanism, from CAD through machining. Also ran workshops teaching new members shop machinery and robot design so the knowledge did not leave with the seniors.',
    spec:  ['CAD','CNC','Machining','Mentoring']
  }
];

const mk = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const ICONS = {
  hex:       mk('<path d="M12 2.6l8.2 4.7v9.4L12 21.4 3.8 16.7V7.3z"/><path d="M12 7.2l4 2.3v4.6l-4 2.3-4-2.3V9.5z"/>'),
  crossword: mk('<rect x="3.5" y="3.5" width="17" height="17"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/>'),
  list:      mk('<path d="M3 5h3.2v3.2H3zM3 10.4h3.2v3.2H3zM3 15.8h3.2v3.2H3z"/><path d="M9.6 6.6h11.4M9.6 12h11.4M9.6 17.4h8"/>'),
  tetromino: mk('<path d="M2.5 6.5h19v6H15v6H9v-6H2.5z"/><path d="M9 6.5v6M15 6.5v6"/>'),
  keyboard:  mk('<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M6 10.2h.01M10 10.2h.01M14 10.2h.01M18 10.2h.01M8 14.6h8"/>'),
  note:      mk('<circle cx="7.5" cy="16.4" r="3.1"/><circle cx="18" cy="14.4" r="3.1"/><path d="M10.6 16.4V5l10.5-2.2v11.6"/>'),
  resistor:  mk('<path d="M2 12h3.5l2-5 3 10 3-10 2 5H22"/>'),
  graph:     mk('<path d="M3.5 3v17.5H21"/><path d="M3.5 17.4c4.5 0 5.5-10.4 9-10.4s4.5 5.4 8.5 5.4"/>'),
  docpen:    mk('<path d="M13.4 3H6.5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.6"/><path d="M13.4 3l5 5h-5z"/><path d="M20.6 11.9l-7.8 7.8-3.2 1 1-3.2 7.8-7.8z"/>'),
  pencil:    mk('<path d="M16.8 3.2l4 4L9 19l-4.8 1 1-4.8z"/><path d="M14.2 5.8l4 4"/><path d="M3 21.4h18"/>'),
  building:  mk('<path d="M4.6 21V6.6L12 3l7.4 3.6V21"/><path d="M3 21h18"/><path d="M9.6 21v-5.4h4.8V21"/><path d="M8 9.2h2.2M13.8 9.2H16M8 12.9h2.2M13.8 12.9H16"/>'),
  book:      mk('<path d="M12 6.8C10 5.2 7 4.6 3 5.2v12.6c4-.6 7 0 9 1.6 2-1.6 5-2.2 9-1.6V5.2c-4-.6-7 0-9 1.6z"/><path d="M12 6.8v12.6"/>')
};

// Add  shot: 'assets/name.jpg'  to any app below to show a screenshot for it.
// Groups render in this order.
const GROUPS = ['Tools', 'Games', 'Learning'];

const APPS = [
  { name:'Hexstead', icon:'hex', kind:'Games', repo:'hexstead',
    url:'https://pmngvyen.github.io/hexstead/',
    body:'Settle an island with friends. Trade, build and race to 10 points, in online rooms for two to six players or against bots.' },
  { name:'Bananagrams', icon:'crossword', kind:'Games', repo:'bananagrams',
    url:'https://pmngvyen.github.io/bananagrams/',
    body:'Real-time Bananagrams for two to eight players. Make a room, share the link, race to go bananas.' },
  { name:'Scattergories', icon:'list', kind:'Games', repo:'scattergories',
    url:'https://pmngvyen.github.io/scattergories/',
    body:'The category-and-letter party game, dealt out in the browser with a timer and a scoresheet.' },
  { name:'Tetris', icon:'tetromino', kind:'Games', repo:'tetris',
    url:'https://pmngvyen.github.io/tetris/',
    body:'The falling block classic, rebuilt from scratch. Stack, clear, survive.' },
  { name:'Typing test', icon:'keyboard', kind:'Games', repo:'type',
    url:'https://pmngvyen.github.io/type/',
    body:'A typing speed test that tracks words per minute and accuracy as you go.' },

  { name:'Harmony', icon:'note', kind:'Learning', repo:'music-theory',
    url:'https://pmngvyen.github.io/music-theory/',
    body:'A complete music theory course. Nine lessons, piano and guitar sections, five practice trainers and a reference library. Every diagram is generated as SVG and every example is playable through the Web Audio API.' },
  { name:'Circuit Lab', icon:'resistor', kind:'Learning', repo:'circuits',
    url:'https://pmngvyen.github.io/circuits/',
    body:'An interactive course in circuit analysis, built to be worked through rather than just read.' },
  { name:'Calculus flashcards', icon:'graph', kind:'Learning', repo:'calc',
    url:'https://pmngvyen.github.io/calc/',
    body:'A summer review deck for calculus and differential equations, with progress kept between sessions.' },

  { name:'PDF editor', icon:'docpen', kind:'Tools', repo:'pdf',
    url:'https://pmngvyen.github.io/pdf/',
    body:'Annotate, merge and rearrange PDFs without leaving the browser.' },
  { name:'Sketchpad', icon:'pencil', kind:'Tools', repo:'draw',
    url:'https://pmngvyen.github.io/draw/',
    body:'A minimal drawing canvas for quick sketches and diagrams.' },
  { name:'BU Housing', icon:'building', kind:'Tools', repo:'buhousing',
    url:'https://pmngvyen.github.io/buhousing/',
    body:'Room availability for Boston University housing selection, laid out so you can actually read it.' },
  { name:'Folio', icon:'book', kind:'Tools', repo:'folio',
    url:'https://pmngvyen.github.io/folio/',
    body:'Book discovery. Search, browse, and build a reading list.' }
];

const REPOS = [
  { name:'chorddetectr', desc:'Chord detection in Python' },
  { name:'roomtempmon',  desc:'Arduino room temperature monitor' },
  { name:'teensyflight', desc:'Teensy flight controller work' },
  { name:'applecalendarnotionintegration', desc:'Apple Calendar to Notion sync' }
];
