// Skallywag - JSUI Renderer
// Renders the terminal display with colored text inside Max for Live

autowatch = 1;
inlets = 1;
outlets = 0;

// Drawing config
var BG = [0.05, 0.06, 0.09, 1.0];
var GUTTER_BG = [0.08, 0.09, 0.12, 1.0];
var LINE_HEIGHT = 14;
var FONT_SIZE = 11;
var FONT = 'Consolas';
var PADDING_LEFT = 6;
var PADDING_TOP = 4;
var GUTTER_WIDTH = 52;

var displayLines = [];
var width = 528;
var height = 300;

function loadbang() {
  mgraphics.init();
  mgraphics.relative_coords = 0;
  mgraphics.autofill = 0;
}

// Receive messages from skallywag.js
function anything() {
  var args = arrayfromargs(messagename, arguments);
  var cmd = args[0];

  if (cmd === 'clear') {
    displayLines = [];
  }
  else if (cmd === 'line') {
    // line <index> <time> <type> <text> <r> <g> <b>
    var idx = parseInt(args[1]);
    displayLines[idx] = {
      time: args[2],
      type: args[3],
      text: args.slice(4, args.length - 3).join(' '),
      r: parseFloat(args[args.length - 3]),
      g: parseFloat(args[args.length - 2]),
      b: parseFloat(args[args.length - 1])
    };
  }
  else if (cmd === 'refresh') {
    mgraphics.redraw();
  }
  else if (cmd === 'lines') {
    // ct3.js format: lines <JSON-array of {type,text,ts}>
    try {
      var raw = args.slice(1).join(' ');
      var parsed = JSON.parse(raw);
      var palette = {
        sys:[0.6,0.4,1.0], info:[0.75,0.78,0.82], cmd:[0.33,0.66,1.0],
        param:[0.0,0.85,0.85], error:[1.0,0.3,0.3], warn:[1.0,0.7,0.0],
        note:[1.0,1.0,0.4]
      };
      displayLines = parsed.map(function(l){
        var d = new Date(l.ts || Date.now());
        var pad = function(n){ return ('0'+n).slice(-2); };
        var c = palette[l.type] || palette.info;
        return {
          time: pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()),
          type: l.type || 'info',
          text: l.text || '',
          r: c[0], g: c[1], b: c[2]
        };
      });
      mgraphics.redraw();
    } catch(e) {
      post('lines parse err: ' + e + '\n');
    }
  }
}

function paint() {
  var g = mgraphics;
  width = box.rect[2] - box.rect[0];
  height = box.rect[3] - box.rect[1];

  // Background
  g.set_source_rgba(BG[0], BG[1], BG[2], BG[3]);
  g.rectangle(0, 0, width, height);
  g.fill();

  // Gutter background
  g.set_source_rgba(GUTTER_BG[0], GUTTER_BG[1], GUTTER_BG[2], GUTTER_BG[3]);
  g.rectangle(0, 0, GUTTER_WIDTH, height);
  g.fill();

  // Gutter separator line
  g.set_source_rgba(0.2, 0.22, 0.28, 1.0);
  g.move_to(GUTTER_WIDTH, 0);
  g.line_to(GUTTER_WIDTH, height);
  g.set_line_width(1);
  g.stroke();

  // Title bar
  g.set_source_rgba(0.1, 0.12, 0.18, 1.0);
  g.rectangle(0, 0, width, 18);
  g.fill();

  g.select_font_face(FONT);
  g.set_font_size(10);
  g.set_source_rgba(0.35, 0.53, 1.0, 1.0);
  g.move_to(PADDING_LEFT, 13);
  g.show_text('SKALLYWAG LITE');

  g.set_source_rgba(0.4, 0.45, 0.5, 1.0);
  g.move_to(width - 120, 13);
  g.show_text('UDP:11002 | ' + displayLines.length + ' lines');

  // Separator under title
  g.set_source_rgba(0.2, 0.25, 0.35, 1.0);
  g.move_to(0, 18);
  g.line_to(width, 18);
  g.stroke();

  // Render lines
  g.set_font_size(FONT_SIZE);
  var y = 18 + PADDING_TOP;

  for (var i = 0; i < displayLines.length; i++) {
    var line = displayLines[i];
    if (!line) continue;

    var lineY = y + (i * LINE_HEIGHT) + FONT_SIZE;
    if (lineY > height) break;

    // Highlight current line on hover region
    if (i % 2 === 0) {
      g.set_source_rgba(0.06, 0.07, 0.1, 1.0);
      g.rectangle(GUTTER_WIDTH + 1, y + (i * LINE_HEIGHT), width - GUTTER_WIDTH, LINE_HEIGHT);
      g.fill();
    }

    // Timestamp in gutter
    g.set_source_rgba(0.35, 0.4, 0.45, 1.0);
    g.move_to(PADDING_LEFT, lineY);
    g.show_text(line.time || '');

    // Type badge
    var badgeX = GUTTER_WIDTH + 4;
    var badgeColors = {
      cmd:   [0.15, 0.25, 0.45],
      osc:   [0.1, 0.3, 0.2],
      info:  [0.2, 0.2, 0.2],
      warn:  [0.35, 0.25, 0.05],
      error: [0.4, 0.1, 0.1],
      sys:   [0.25, 0.15, 0.4],
      param: [0.1, 0.3, 0.3],
      note:  [0.35, 0.35, 0.1]
    };
    var bc = badgeColors[line.type] || badgeColors.info;
    g.set_source_rgba(bc[0], bc[1], bc[2], 1.0);

    var typeLabel = (line.type || 'info').toUpperCase();
    var badgeW = typeLabel.length * 6.5 + 6;
    roundRect(g, badgeX, lineY - FONT_SIZE + 2, badgeW, FONT_SIZE + 2, 3);
    g.fill();

    g.set_source_rgba(line.r || 0.7, line.g || 0.7, line.b || 0.7, 1.0);
    g.move_to(badgeX + 3, lineY);
    g.set_font_size(9);
    g.show_text(typeLabel);
    g.set_font_size(FONT_SIZE);

    // Message text
    var textX = badgeX + badgeW + 6;
    g.set_source_rgba(line.r || 0.7, line.g || 0.7, line.b || 0.7, 1.0);
    g.move_to(textX, lineY);

    // Truncate text to fit
    var maxChars = Math.floor((width - textX - 10) / 7);
    var text = line.text || '';
    if (text.length > maxChars) text = text.substring(0, maxChars) + '...';
    g.show_text(text);
  }

  // Bottom status bar
  g.set_source_rgba(0.08, 0.1, 0.15, 1.0);
  g.rectangle(0, height - 16, width, 16);
  g.fill();

  g.set_source_rgba(0.0, 0.6, 0.3, 1.0);
  g.set_font_size(9);
  g.move_to(PADDING_LEFT, height - 4);
  g.show_text('● CONNECTED');

  g.set_source_rgba(0.4, 0.45, 0.5, 1.0);
  g.move_to(100, height - 4);
  g.show_text('Filter: ALL | Scroll: ' + displayLines.length);
}

function roundRect(g, x, y, w, h, r) {
  g.move_to(x + r, y);
  g.line_to(x + w - r, y);
  g.arc(x + w - r, y + r, r, -Math.PI/2, 0);
  g.line_to(x + w, y + h - r);
  g.arc(x + w - r, y + h - r, r, 0, Math.PI/2);
  g.line_to(x + r, y + h);
  g.arc(x + r, y + h - r, r, Math.PI/2, Math.PI);
  g.line_to(x, y + r);
  g.arc(x + r, y + r, r, Math.PI, 3*Math.PI/2);
  g.close_path();
}

function onresize(w, h) {
  width = w;
  height = h;
  mgraphics.redraw();
}
