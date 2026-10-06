(() => {
  'use strict';
  const STEPS = [
    { ic: 'search', bg: '#0194F3', t: 'Search for anything',
      b: 'Use the search bar to look up a destination, a specific hotel, restaurant or attraction — or just browse the Hotels, Restaurants and Attractions tabs from the home page.' },
    { ic: 'grid', bg: '#9B51E0', t: 'Compare & explore',
      b: 'Filter by price, star rating or distance, sort by rating, distance or newest, and open any listing to see photos, amenities and real traveler reviews.' },
    { ic: 'map', bg: '#00A651', t: 'Build a day-by-day plan',
      b: 'Found a few places you like? Add any hotel, restaurant or attraction straight into your Trip Planner, or type in your own custom stops — a sunset walk, a bonfire, anything.' },
    { ic: 'shield', bg: '#FF5E1F', t: 'Book & pay securely',
      b: 'When you are ready, book a stay in a few steps: guest details, then payment. Your card number is never stored — only a payment token is kept against the booking.' },
    { ic: 'ticket', bg: '#E5330B', t: 'Manage, review & ask around',
      b: 'Track every booking under Bookings, leave a review once a stay is marked completed, and ask fellow travelers questions on the Forum before you go.' }
  ];

  let i = 0, dlg = null;

  function render() {
    const s = STEPS[i];
    dlg.querySelector('.gd-step-n').textContent = 'Step ' + (i + 1) + ' of ' + STEPS.length;
    const ic = dlg.querySelector('.gd-ic');
    ic.style.background = s.bg;
    ic.querySelector('use').setAttribute('href', '#' + s.ic);
    dlg.querySelector('.gd-body h3').textContent = s.t;
    dlg.querySelector('.gd-body p').textContent = s.b;
    [...dlg.querySelectorAll('.gd-dots span')].forEach((d, k) => d.classList.toggle('on', k === i));
    const back = dlg.querySelector('[data-back]');
    back.style.visibility = i === 0 ? 'hidden' : 'visible';
    dlg.querySelector('[data-next]').textContent = i === STEPS.length - 1 ? 'Got it' : 'Next';
  }

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'tm-dialog tm-guide';
    dlg.setAttribute('aria-label', 'How TravelMate works');
    dlg.innerHTML =
      '<div class="gd-head"><b class="gd-step-n"></b><button type="button" class="gd-x" data-skip aria-label="Close guide">✕</button></div>' +
      '<div class="gd-body"><div class="gd-ic"><svg class="i"><use href="#search"/></svg></div><h3></h3><p></p></div>' +
      '<div class="gd-dots">' + STEPS.map(() => '<span></span>').join('') + '</div>' +
      '<div class="gd-foot">' +
        '<button type="button" class="gd-skip" data-skip>Skip tour</button>' +
        '<span class="sp" style="flex:1"></span>' +
        '<button type="button" class="btn-line btn-sm" data-back>Back</button>' +
        '<button type="button" class="btn-orange btn-sm" data-next>Next</button>' +
      '</div>';
    document.body.appendChild(dlg);
    dlg.addEventListener('close', () => { dlg.remove(); dlg = null; });
    dlg.addEventListener('click', e => {
      if (e.target.closest('[data-skip]')) return finish();
      if (e.target.closest('[data-back]')) { if (i > 0) { i--; render(); } return; }
      if (e.target.closest('[data-next]')) {
        if (i < STEPS.length - 1) { i++; render(); } else finish();
      }
    });
    dlg.addEventListener('mousedown', e => { if (e.target === dlg) dlg.close(); });
  }

  function finish() {
    try { localStorage.setItem('tm_guide_seen', '1'); } catch (e) {}
    if (dlg) dlg.close();
  }

  function open() {
    i = 0;
    if (!dlg) build();
    render();
    try { dlg.showModal(); } catch (e) {}
  }

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'tm-guide-fab';
  fab.setAttribute('aria-label', 'How TravelMate works');
  fab.title = 'How it works';
  fab.innerHTML = '<span aria-hidden="true">?</span>';
  fab.addEventListener('click', open);
  document.body.appendChild(fab);

  let seen = false;
  try { seen = localStorage.getItem('tm_guide_seen') === '1'; } catch (e) {}
  if (!seen) setTimeout(open, 900);

  window.TMGuide = { open };
})();