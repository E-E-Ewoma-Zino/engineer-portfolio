/* Case-page scroll choreography: reveals + stat count-ups (GSAP ScrollTrigger). */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.will-reveal').forEach(function (el) {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* hero entrance */
  var hero = document.querySelector('.case-hero, .about');
  if (hero) {
    gsap.from(hero.querySelectorAll('.kicker, h1, .standfirst, .lede, .meta-row, .scroll-cue'), {
      opacity: 0, y: 26, duration: 1, ease: 'power2.out', stagger: 0.1
    });
  }

  /* stat count-ups */
  document.querySelectorAll('.stat b[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var decimals = (String(el.getAttribute('data-count')).split('.')[1] || '').length;
    var obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: function () {
        var v = decimals ? obj.v.toFixed(decimals) : Math.round(obj.v).toLocaleString('en-GB');
        el.textContent = v + suffix;
      }
    });
  });
})();
