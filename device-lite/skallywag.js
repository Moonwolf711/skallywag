// Skallywag - Max for Live Device
// Real-time activity feed showing what your automation is doing in Ableton
// Sits in the device chain like an effect, displays CLI-style output

autowatch = 1;
inlets = 2;  // inlet 0: messages to display, inlet 1: commands from UI
outlets = 3; // outlet 0: to jsui, outlet 1: to live.text, outlet 2: OSC passthrough

var LOG_MAX = 12; // LITE: capped history — full version is unlimited
var lines = [];
var scrollPos = 0;
var filterLevel = 'all'; // all, cmd, osc, info, error
var paused = false;
var udpPort = 11002; // listen for incoming messages
var connected = false;

// Color codes for different message types
var COLORS = {
  cmd:   [0.33, 0.66, 1.0, 1.0],   // blue - commands
  osc:   [0.0, 0.8, 0.4, 1.0],     // green - OSC messages
  info:  [0.7, 0.7, 0.7, 1.0],     // gray - info
  warn:  [1.0, 0.7, 0.0, 1.0],     // orange - warnings
  error: [1.0, 0.2, 0.2, 1.0],     // red - errors
  sys:   [0.6, 0.4, 1.0, 1.0],     // purple - system
  param: [0.0, 0.8, 0.8, 1.0],     // cyan - parameter changes
  note:  [1.0, 1.0, 0.3, 1.0]      // yellow - MIDI notes
};

function loadbang() {
  addLine('sys', '=== SKALLYWAG LITE ===');
  addLine('sys', 'Live feed on UDP ' + udpPort);
  addLine('info', 'Full version: filter, pause, export + unlimited history');
  addLine('info', 'gumroad.com/l/skallywag');
  addLine('info', '');
  updateDisplay();

  // Start UDP listener task
  var t = new Task(pollUDP, this);
  t.interval = 50; // 20Hz polling
  t.repeat();
}

// === MESSAGE INPUT ===

function anything() {
  var args = arrayfromargs(messagename, arguments);
  var msg = args.join(' ');

  // Detect message type from prefix
  var type = 'info';
  if (msg.indexOf('[CMD]') === 0) { type = 'cmd'; msg = msg.substring(5).trim(); }
  else if (msg.indexOf('[OSC]') === 0) { type = 'osc'; msg = msg.substring(5).trim(); }
  else if (msg.indexOf('[ERR]') === 0) { type = 'error'; msg = msg.substring(5).trim(); }
  else if (msg.indexOf('[WARN]') === 0) { type = 'warn'; msg = msg.substring(6).trim(); }
  else if (msg.indexOf('[SYS]') === 0) { type = 'sys'; msg = msg.substring(5).trim(); }
  else if (msg.indexOf('[PARAM]') === 0) { type = 'param'; msg = msg.substring(7).trim(); }
  else if (msg.indexOf('[NOTE]') === 0) { type = 'note'; msg = msg.substring(6).trim(); }
  else if (msg.indexOf('/live/') === 0) { type = 'osc'; }
  else if (msg.indexOf('ableton ') === 0) { type = 'cmd'; }

  addLine(type, msg);
  updateDisplay();
}

function msg_int(v) {
  // Scroll position from live.dial
  scrollPos = v;
  updateDisplay();
}

// Inlet 1: UI commands
function list() {
  if (inlet === 1) {
    var args = arrayfromargs(arguments);
    var cmd = args[0];

    if (cmd === 'clear') { lines = []; scrollPos = 0; updateDisplay(); }
    if (cmd === 'pause' || cmd === 'filter') { addLine('sys', '* ' + cmd + ' is in the full version -> gumroad.com/l/skallywag'); updateDisplay(); }
    if (cmd === 'scroll_top') { scrollPos = 0; updateDisplay(); }
    if (cmd === 'scroll_bottom') { scrollPos = Math.max(0, lines.length - 20); updateDisplay(); }
    if (cmd === 'export') { addLine('sys', '* export is in the full version -> gumroad.com/l/skallywag'); updateDisplay(); }
  }
}

// === CORE ===

function addLine(type, text) {
  if (paused && type !== 'sys') return;

  var now = new Date();
  var ts = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

  lines.push({
    time: ts,
    type: type,
    text: text,
    color: COLORS[type] || COLORS.info
  });

  if (lines.length > LOG_MAX) lines.shift();

  // Auto-scroll to bottom unless user scrolled up
  if (scrollPos >= lines.length - 22) {
    scrollPos = Math.max(0, lines.length - 20);
  }
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function updateDisplay() {
  // Filter lines
  var visible = lines;
  if (filterLevel !== 'all') {
    visible = lines.filter(function(l) { return l.type === filterLevel || l.type === 'sys'; });
  }

  // Send visible lines to jsui for rendering
  var start = Math.max(0, Math.min(scrollPos, visible.length - 20));
  var end = Math.min(start + 20, visible.length);
  var displayLines = visible.slice(start, end);

  // Output formatted text to outlet 0 (jsui)
  outlet(0, 'clear');
  for (var i = 0; i < displayLines.length; i++) {
    var l = displayLines[i];
    outlet(0, 'line', i, l.time, l.type, l.text, l.color[0], l.color[1], l.color[2]);
  }
  outlet(0, 'refresh');

  // Update line count display
  outlet(1, visible.length + ' lines');
}

// === UDP LISTENER ===

function pollUDP() {
  // This is handled by [udpreceive] object in the patcher
  // Messages come in through inlet 0
}

// === EXPORT ===

function exportLog() {
  var path = 'skallywag-log-' + Date.now() + '.txt';
  var f = new File(path, 'write', 'TEXT');
  if (f.isopen) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      f.writeline('[' + l.time + '] [' + l.type.toUpperCase() + '] ' + l.text);
    }
    f.close();
    addLine('sys', 'Exported to ' + path);
    updateDisplay();
  }
}

// === LIVE API WATCHER ===
// Watch for parameter changes and log them

function watchTransport() {
  var api = new LiveAPI(function(args) {
    if (args[0] === 'is_playing') {
      addLine('param', 'Transport: ' + (parseInt(args[1]) ? 'PLAYING' : 'STOPPED'));
      updateDisplay();
    }
  }, 'live_set');
  api.property = 'is_playing';
}

function watchTempo() {
  var api = new LiveAPI(function(args) {
    if (args[0] === 'tempo') {
      addLine('param', 'Tempo: ' + parseFloat(args[1]).toFixed(1) + ' BPM');
      updateDisplay();
    }
  }, 'live_set');
  api.property = 'tempo';
}

// Start watchers on load
function bang() {
  try {
    watchTransport();
    watchTempo();
    addLine('sys', 'Live API watchers active');
    updateDisplay();
  } catch(e) {
    addLine('error', 'Watcher setup failed: ' + e.message);
    updateDisplay();
  }
}
