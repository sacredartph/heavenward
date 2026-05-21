// Catholic patron-saint avatars. Each saint maps to a simple gold silhouette
// rendered inside the family member's circle on Home + Hearth.
// Halo color comes from the family member's last_moment (the stained-glass color).
(function (global) {

  // Minimal SVG path glyphs. All drawn within a 24x24 box, fill currentColor.
  const GLYPHS = {
    cross:    '<path d="M11 3h2v7h7v2h-7v9h-2v-9H4v-2h7z"/>',
    rose:     '<path d="M12 3c-3 0-5 2-5 4 0 1 .5 2 1.3 2.6C7 10.3 6 11.6 6 13c0 2.2 1.8 4 4 4h.3c-.2 1.5-1.3 2.5-1.3 2.5l1 .5c0-.1 1.7-1.4 2-3 .5 0 1 0 1.5-.1L13.7 19c.6 0 1.3-.2 1.8-.5l-.3-1.4c1.5-.6 2.5-2.1 2.5-3.8 0-1.6-1-3-2.5-3.6.8-.6 1.5-1.6 1.5-2.7 0-2-2-4-5-4zm0 4a3 3 0 110 6 3 3 0 010-6z"/>',
    lily:     '<path d="M12 3v3.5M9 5.5L12 8l3-2.5M7 9c1 0 2 .5 2.5 1.5L12 13l2.5-2.5C15 9.5 16 9 17 9c1.5 0 3 1.3 3 3s-2 3-3 3c-.7 0-1.3-.2-1.8-.5L12 18l-3.2-3.5c-.5.3-1.1.5-1.8.5-1 0-3-1.3-3-3s1.5-3 3-3zm5 9v3"/>',
    crown:    '<path d="M3 9l3 7h12l3-7-4 3-5-6-5 6zM4 18h16v2H4z"/>',
    star:     '<path d="M12 2l2.6 7h7l-5.6 4.6 2 7L12 16l-6 4.6 2-7L2.4 9h7z"/>',
    dove:     '<path d="M3 14c0-3 2-5 5-5h2l1-3 3 1-1 3c2 0 4 1.5 5 4l3-1-1 4-3-1c-1 2-3 4-7 4-3 0-6-2-7-4l-2 1 1-3z"/>',
    lamb:     '<path d="M6 13c0-2 2-4 4-4l1-2 2 0 1 2c2 0 4 2 4 4 0 1-.5 2-1 2.5l.5 2-2-.5L14 18h-4l-1-1L7 17.5l.5-2C7 15 6 14 6 13zm3-1a1 1 0 110 2 1 1 0 010-2zm6 0a1 1 0 110 2 1 1 0 010-2z"/>',
    anchor:   '<path d="M12 2a2 2 0 100 4 2 2 0 000-4zm-1 5v2H8v2h3v8c-3-.5-5-3-5-5H4c0 4 3 7 7 7s7-3 7-7h-2c0 2-2 4.5-5 5v-8h3V9h-3V7z"/>',
    book:     '<path d="M4 5h6c1 0 2 .5 2 1.5V19c0-1-1-1.5-2-1.5H4zm16 0h-6c-1 0-2 .5-2 1.5V19c0-1 1-1.5 2-1.5h6z"/>',
    heart:    '<path d="M12 20l-1.5-1.3C5.5 14.3 2 11.2 2 7.5 2 4.5 4.4 2 7.5 2 9.2 2 10.9 2.8 12 4.1 13.1 2.8 14.8 2 16.5 2 19.6 2 22 4.5 22 7.5c0 3.7-3.5 6.8-8.5 11.2z"/>',
    flame:    '<path d="M12 2s4 4 4 8c0 2-1.5 3-2 3 0-2-1-3-2-3s-2 1-2 3c-.5 0-2-1-2-3 0-4 4-8 4-8zm0 14c-3 0-5 2-5 4 0 2 2 4 5 4s5-2 5-4c0-2-2-4-5-4z"/>',
    wings:    '<path d="M12 4c-1 0-2 1-2 2v2c-2-1-5-1-7 1 0 0 2 2 5 2-2 1-4 3-4 5 0 0 3-1 5-3v3l3 3 3-3v-3c2 2 5 3 5 3 0-2-2-4-4-5 3 0 5-2 5-2-2-2-5-2-7-1V6c0-1-1-2-2-2z"/>',
    sword:    '<path d="M5 4l8 8 3-1 4 4-3 2 2 3-2 2-3-2-2 3-4-4 1-3-8-8z"/>',
    mountain: '<path d="M2 19l5-9 4 5 3-3 8 7zm6-13a2 2 0 110 4 2 2 0 010-4z"/>',
    bread:    '<path d="M5 9c0-2 2-4 5-4h4c3 0 5 2 5 4 0 1-.5 2-1 2.5v6c0 1-.5 1.5-1.5 1.5h-9c-1 0-1.5-.5-1.5-1.5v-6c-.5-.5-1-1.5-1-2.5z"/>',
    crook:    '<path d="M9 4a5 5 0 015 5v2h-3V9a2 2 0 10-4 0v11H5V9a4 4 0 014-5z"/>',
    palm:     '<path d="M12 22V8m-7-3c2 0 5 1 7 3 2-2 5-3 7-3-1 2-3 4-6 4 3 1 4 3 4 5 0 0-3 0-5-2 1 3 0 5-2 6-2-1-3-3-2-6-2 2-5 2-5 2 0-2 1-4 4-5-3 0-5-2-6-4z"/>',
    eagle:    '<path d="M12 4l-2 2-3-1 1 3-2 2 3 1v4l2 2 4-2v-4l3-1-2-2 1-3-3 1z"/>',
    ox:       '<path d="M6 5l-2 2 3 2v3l-2 2 3 1 1 2 3 1 3-1 1-2 3-1-2-2v-3l3-2-2-2-3 1L12 7 9 6z"/>',
    fish:     '<path d="M2 12c2-3 5-5 9-5 5 0 9 2 11 5-2 3-6 5-11 5-4 0-7-2-9-5zm15-1a1 1 0 110 2 1 1 0 010-2z"/>',
    rays:     '<path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2M12 8a4 4 0 110 8 4 4 0 010-8z"/>',
    chalice:  '<path d="M7 4h10l-1 5a4 4 0 11-8 0zm5 11v4M9 19h6"/>',
    globe:    '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 2c.9 0 1.8 1 2.4 2.7C13.6 6.9 12.8 7 12 7s-1.6-.1-2.4-.3C10.2 5 11.1 4 12 4zm-5.7 2.6C7.5 7 9 7.2 10.5 7.3 11 9 11.5 11 11.8 12.5h-7.7A8 8 0 016.3 6.6zm11.4 0a8 8 0 012.2 5.9h-7.7c.3-1.5.8-3.5 1.3-5.2 1.5-.1 3-.3 4.2-.7zM4.1 12.5h7.7c-.3 1.5-.8 3.5-1.3 5.2-1.5.1-3 .3-4.2.7A8 8 0 014.1 12.5zm8.1 0h7.7a8 8 0 01-2.2 5.9c-1.2-.4-2.7-.6-4.2-.7-.5-1.7-1-3.7-1.3-5.2zM12 17c.8 0 1.6.1 2.4.3-.6 1.7-1.5 2.7-2.4 2.7s-1.8-1-2.4-2.7c.8-.2 1.6-.3 2.4-.3z"/>'
  };

  function svg(glyph) {
    const g = GLYPHS[glyph] || GLYPHS.cross;
    return '<svg viewBox="0 0 24 24" class="avatar-glyph" aria-hidden="true">' + g + '</svg>';
  }

  // Map every seeded saint slug to a glyph.
  const SAINT_TO_GLYPH = {
    'lorenzo-ruiz':          'cross',
    'pedro-calungsod':       'cross',
    'mary':                  'crown',
    'joseph':                'lily',
    'therese-of-lisieux':    'rose',
    'john-paul-ii':          'star',
    'thomas-aquinas':        'book',
    'augustine':             'book',
    'francis-of-assisi':     'dove',
    'ignatius-of-loyola':    'flame',
    'catherine-of-siena':    'rose',
    'teresa-benedicta':      'cross',
    'gianna-molla':          'heart',
    'joan-of-arc':           'sword',
    'teresa-of-avila':       'flame',
    'john-of-the-cross':     'cross',
    'padre-pio':             'cross',
    'maximilian-kolbe':      'cross',
    'pier-giorgio-frassati': 'mountain',
    'thomas-more':           'cross',
    'jerome':                'book',
    'francis-de-sales':      'dove',
    'benedict-of-nursia':    'cross',
    'dominic':               'rose',
    'peter':                 'crook',
    'paul':                  'book',
    'john-the-apostle':      'eagle',
    'mary-magdalene':        'anchor',
    'stephen':               'palm',
    'elizabeth-of-hungary':  'rose',
    'rose-of-lima':          'rose',
    'martin-de-porres':      'lamb',
    'cecilia':               'palm',
    'monica':                'heart',
    'anthony-of-padua':      'lily',
    'rita':                  'rose',
    'philomena':             'palm',
    'andrew':                'fish',
    'james-the-greater':     'crook',
    'matthew':               'book',
    'mark':                  'book',
    'luke':                  'book',
    'gabriel-archangel':     'wings',
    'michael-archangel':     'sword',
    'raphael-archangel':     'wings',
    'nicholas':              'crook',
    'patrick':               'crook',
    'george':                'sword',
    'cecilia-day-prayer':    'heart',
    'joachim':               'crook',
    'maximilian-of-tebessa': 'cross',
    'jeanne-jugan':          'heart',
    'kateri':                'lily',
    'damien-of-molokai':     'cross',
    'faustina':              'rays',
    'mother-teresa':         'heart',
    'john-bosco':            'star',
    'simon-stock':           'lily',
    'john-nepomucene':       'cross',
    'matthias-apostle':      'fish',
    'isidore-farmer':        'mountain',
    'rita-2':                'cross',
    'paschal-baylon':        'bread',
    'bernardine-siena':      'rays',
    'philip-neri':           'heart',
    'paul-vi':               'crook',
    'pentecost-mary':        'crown',
    'norbert':               'crook',
    'aloysius-gonzaga':      'lily',
    'cyril-methodius':       'book',
    'sacred-heart':          'heart',
    'visitation':            'crown'
  };

  // The full avatar markup: glyph inside a luminous multi-layer halo.
  // Layers (outer -> inner):
  //   .halo-shimmer   - rotating conic-gradient ring (gold + moment color)
  //   .halo-glow      - soft radial bloom around the avatar
  //   .hw-saint-avatar - the circle with the glyph
  // Pass member object (with display_name, patron_saint_slug, last_moment).
  function avatarHTML(member, opts) {
    opts = opts || {};
    const size = opts.size || 56;
    const glyph = SAINT_TO_GLYPH[member && member.patron_saint_slug] || 'cross';
    const mom = member && member.last_moment && window.Moments && Moments.BY_KEY[member.last_moment];
    const haloColor = mom ? mom.color : null;
    const activeCls = (member && member.is_active_now) ? ' is-active' : '';
    const haloCls   = haloColor ? ' has-moment' : '';
    // CSS variables drive the halo colors so each member can have their own moment hue.
    const cssVars = haloColor
      ? '--halo-color:' + haloColor + ';--halo-color-soft:' + withAlpha(haloColor, 0.35) + ';--halo-color-faint:' + withAlpha(haloColor, 0.10) + ';'
      : '';
    const dataColor = haloColor ? ' data-halo-color="' + haloColor + '"' : '';
    const dim = size + 'px';
    return '<div class="hw-saint-wrap' + activeCls + haloCls + '" style="width:' + dim + ';height:' + dim + ';' + cssVars + '"' + dataColor + '>' +
      '<div class="halo-shimmer"></div>' +
      '<div class="halo-glow"></div>' +
      '<div class="hw-saint-avatar">' + svg(glyph) + '</div>' +
    '</div>';
  }

  // Local copy of withAlpha so avatars.js doesn't need to depend on whisper.js helpers.
  function withAlpha(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  global.Avatars = { svg, avatarHTML, SAINT_TO_GLYPH, GLYPHS };
})(window);
