// The 10 stained-glass moments. The single source for color, label, and
// sacramental echo line. Home + Whisper + Hearth halos all read from this.
(function (global) {
  const MOMENTS = [
    { key: 'tired',      color: '#8B6F47', label: 'Tired',      echo: 'You are dust, and beloved.' },
    { key: 'grateful',   color: '#C9A84C', label: 'Grateful',   echo: 'Thank you, Lord.' },
    { key: 'working',    color: '#5C7A5C', label: 'Working',    echo: 'He is in your work.' },
    { key: 'struggling', color: '#6B4A8B', label: 'Struggling', echo: 'He carried his cross too.' },
    { key: 'joyful',     color: '#D4A5B9', label: 'Joyful',     echo: 'Rejoice - and rejoice again.' },
    { key: 'sick',       color: '#F5F2EA', label: 'Sick',       echo: 'He heals.' },
    { key: 'angry',      color: '#B83333', label: 'Angry',      echo: 'Let the fire be his.' },
    { key: 'afraid',     color: '#4A6BA8', label: 'Afraid',     echo: 'Mary is near.' },
    { key: 'peaceful',   color: '#F4ECD6', label: 'Peaceful',   echo: 'Stay here a while.' },
    { key: 'loved',      color: '#C9756E', label: 'Loved',      echo: "His heart, opened for you." }
  ];
  const BY_KEY = {};
  for (const m of MOMENTS) BY_KEY[m.key] = m;

  function discsHTML(idPrefix) {
    return MOMENTS.map(m =>
      '<button class="moment-disc" data-moment="' + m.key + '" data-color="' + m.color + '" style="--disc-color:' + m.color + '" aria-label="' + m.label + '">' +
        '<span class="disc-glass"></span>' +
        '<span class="disc-label">' + m.label + '</span>' +
      '</button>'
    ).join('');
  }

  global.Moments = { MOMENTS, BY_KEY, discsHTML };
})(window);
