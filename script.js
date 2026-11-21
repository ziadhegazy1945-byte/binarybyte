(function () {
  'use strict';
  var d = document;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: sticky style, mobile menu, active link ---------- */
  var nav = d.getElementById('nav');
  var burger = d.getElementById('burger');
  var menu = d.getElementById('menu');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  d.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 760) setMenu(false); });

  function onScroll() { nav.classList.toggle('stuck', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var links = [].slice.call(d.querySelectorAll('.menu a[href^="#"]:not(.btn)'));
  var secs = links.map(function (a) { return d.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { if (s) spy.observe(s); });
  }

  /* ---------- Scroll reveal (visible by default if JS fails) ---------- */
  d.documentElement.classList.add('js');
  var items = [].slice.call(d.querySelectorAll('.reveal'));
  items.forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
  function show(el) { el.classList.add('in'); }
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(show);
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
    setTimeout(function () { items.forEach(show); }, 6000);
  }

  /* ---------- Card glow follows the pointer ---------- */
  d.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Hero background: drifting node network ---------- */
  var cv = d.getElementById('net');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d');
    var w = 0, h = 0, dpr = 1, nodes = [], raf = 0, visible = true;
    var mouse = { x: -999, y: -999 };

    function size() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(24, Math.min(70, Math.round(w * h / 16000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28 });
      }
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      var i, j, a, b, dx, dy, dist;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; }
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = 'rgba(120,180,255,' + (0.22 * (1 - dist / 130)) + ')';
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          ctx.strokeStyle = 'rgba(159,208,255,' + (0.5 * (1 - dist / 160)) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(159,208,255,.75)';
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.6, 0, 6.2832); ctx.fill();
      }
      if (!reduce && visible) raf = requestAnimationFrame(frame);
    }
    size(); frame();
    window.addEventListener('resize', function () { size(); if (reduce) frame(); });
    cv.parentNode.addEventListener('pointermove', function (e) {
      var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    cv.parentNode.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
      }).observe(cv);
    }
  }

  /* ---------- Copy helpers ---------- */
  function copyText(text, btn, done) {
    var label = btn.textContent;
    function ok() { btn.textContent = done; setTimeout(function () { btn.textContent = label; }, 1600); }
    function fallback() {
      var t = d.createElement('textarea'); t.value = text; t.setAttribute('readonly', '');
      t.style.position = 'fixed'; t.style.opacity = '0'; d.body.appendChild(t); t.select();
      try { d.execCommand('copy'); ok(); } catch (e) { btn.textContent = 'Press Ctrl/Cmd+C'; }
      d.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else { fallback(); }
  }
  d.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { copyText(b.getAttribute('data-copy'), b, 'Copied'); });
  });

  /* ---------- Contact form validation ---------- */
  var form = d.getElementById('form');
  var done = d.getElementById('done');
  var out = d.getElementById('out');
  var rules = {
    name: function (v) { return v.length < 2 ? 'Please enter your name.' : ''; },
    email: function (v) {
      if (!v) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email address does not look right.';
    },
    company: function (v) { return v.length > 80 ? 'Please keep this under 80 characters.' : ''; },
    message: function (v) { return v.length < 10 ? 'Please add a few details (at least 10 characters).' : ''; }
  };
  function check(name) {
    var el = form.elements[name];
    var msg = rules[name](el.value.trim());
    var wrap = el.closest('.field');
    wrap.classList.toggle('bad', !!msg);
    d.getElementById('e-' + name).textContent = msg;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  }
  Object.keys(rules).forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener('blur', function () { check(n); });
    el.addEventListener('input', function () { if (el.closest('.field').classList.contains('bad')) check(n); });
  });
  var ENDPOINT = 'https://formsubmit.co/ajax/binarybyte.co@gmail.com';
  var sendBtn = d.getElementById('sendBtn');
  function showDone(ok) {
    d.getElementById('doneTitle').textContent = ok ? 'Thank you, your message has been sent' : 'We could not send your message automatically';
    d.getElementById('doneText').innerHTML = ok
      ? 'We have received your enquiry and will reply within one business day.'
      : 'Please copy the message below and email it to <b>binarybyte.co@gmail.com</b>.';
    out.hidden = ok;
    d.getElementById('copyMsg').hidden = ok;
    d.getElementById('again').textContent = ok ? 'Send another message' : 'Edit message';
    d.getElementById('again').setAttribute('data-ok', ok ? '1' : '');
    form.hidden = true; done.hidden = false;
    done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    Object.keys(rules).forEach(function (n) { if (!check(n) && !firstBad) firstBad = form.elements[n]; });
    if (firstBad) { firstBad.focus(); return; }
    var f = form.elements;
    if (f._honey && f._honey.value) return;
    var data = { name: f.name.value.trim(), email: f.email.value.trim(), company: f.company.value.trim() || '-', message: f.message.value.trim(),
      _subject: 'New enquiry from ' + f.name.value.trim() + ' via BinaryByte website', _template: 'table', _replyto: f.email.value.trim() };
    out.textContent = 'Subject: New project enquiry from ' + data.name + '\n\nName: ' + data.name + '\nEmail: ' + data.email + '\nCompany: ' + data.company + '\n\n' + data.message;
    sendBtn.disabled = true; sendBtn.textContent = 'Sending...';
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().then(function (j) { return r.ok && String(j.success) === 'true'; }, function () { return false; }); })
      .catch(function () { return false; })
      .then(function (ok) { clearTimeout(timer); sendBtn.disabled = false; sendBtn.textContent = 'Send message'; showDone(ok); });
  });
  d.getElementById('copyMsg').addEventListener('click', function (e) { copyText(out.textContent, e.currentTarget, 'Copied'); });
  d.getElementById('again').addEventListener('click', function () {
    var ok = this.getAttribute('data-ok') === '1';
    if (ok) form.reset();
    done.hidden = true; form.hidden = false; form.elements[ok ? 'name' : 'message'].focus();
  });

  /* ---------- Footer year ---------- */
  var yr = d.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
