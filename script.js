/* ============================================================
   AEROBOTIX — Presidential Vision
   Foundation + interactions
   ============================================================ */
(function(){
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll progress bar ---------- */
  const prog = document.getElementById('progress');
  function onScroll(){
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max>0 ? (h.scrollTop/max)*100 : 0) + '%';
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---------- Animated circuit / aero particle field ---------- */
  const canvas = document.getElementById('field');
  const ctx = canvas.getContext('2d');
  let W, H, DPR, nodes = [], raf;

  function size(){
    DPR = Math.min(window.devicePixelRatio||1, 2);
    W = canvas.width  = innerWidth  * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth+'px';
    canvas.style.height = innerHeight+'px';
    build();
  }
  function build(){
    // density scales with screen size, capped for phones
    const count = Math.min(70, Math.round((innerWidth*innerHeight)/22000));
    nodes = [];
    for(let i=0;i<count;i++){
      nodes.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:(Math.random()-.5)*0.18*DPR,
        vy:(Math.random()-.5)*0.18*DPR,
        r:(Math.random()*1.6+0.6)*DPR,
        red:Math.random()<0.32
      });
    }
  }

  const LINK = 150;
  function draw(){
    ctx.clearRect(0,0,W,H);
    const link = LINK*DPR;
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];
      a.x+=a.vx; a.y+=a.vy;
      if(a.x<0||a.x>W) a.vx*=-1;
      if(a.y<0||a.y>H) a.vy*=-1;
      // links
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d=Math.hypot(dx,dy);
        if(d<link){
          const o=(1-d/link)*0.5;
          ctx.strokeStyle = (a.red&&b.red)
            ? 'rgba(255,150,142,'+o*0.85+')'
            : 'rgba(150,215,255,'+o*1.15+')';
          ctx.lineWidth=DPR*0.6;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
      // node
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
      ctx.fillStyle = a.red ? 'rgba(255,160,152,1)' : 'rgba(170,225,255,1)';
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }

  if(!reduce){
    size();
    window.addEventListener('resize', ()=>{ cancelAnimationFrame(raf); size(); draw(); });
    draw();
  }else{
    size();
    draw(); cancelAnimationFrame(raf);   // static single frame
  }
  // fade canvas in
  requestAnimationFrame(()=> canvas.classList.add('on'));

  /* ---------- Reveal engine (shared by all sections) ---------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('inview'); io.unobserve(e.target); }
    });
  }, {threshold:0.18, rootMargin:'0px 0px -8% 0px'});
  window.__revealObserver = io; // sections will register elements here
  document.querySelectorAll('[data-reveal]').forEach(el=> io.observe(el));

  /* ============================================================
     SECTION 1 — HERO sequence
     ============================================================ */
  const bigNum = document.getElementById('bigNum');
  if(bigNum){
  const lines  = document.querySelectorAll('#heroLines .line');
  const heroQ  = document.getElementById('heroQ');
  const heroCta= document.getElementById('heroCta');
  const heroBy = document.getElementById('heroBy');

  // Count-up 0 -> 400
  function countUp(el, target, dur){
    if(reduce){ el.textContent = target; return Promise.resolve(); }
    return new Promise(res=>{
      const start = performance.now();
      function tick(now){
        const t = Math.min((now-start)/dur, 1);
        const eased = 1 - Math.pow(1-t, 3);          // easeOutCubic
        el.textContent = Math.round(eased*target);
        if(t<1) requestAnimationFrame(tick); else res();
      }
      requestAnimationFrame(tick);
    });
  }

  function runHero(){
    countUp(bigNum, 400, 1700).then(()=>{
      bigNum.innerHTML = '400<span class="plus">+</span>';
      // stagger the three lines
      lines.forEach((l,i)=> setTimeout(()=> l.classList.add('show'), i*520));
      const after = lines.length*520;
      setTimeout(()=> heroQ.classList.add('show'),  after+250);
      setTimeout(()=> heroCta.classList.add('show'), after+750);
      setTimeout(()=> heroBy.classList.add('show'),  after+1150);
    });
  }
  setTimeout(runHero, 450); // kick off after first paint
  } // end hero (skipped on subpages)

  /* ============================================================
     THE "COUP" GAG sequence
     ============================================================ */
  const coup      = document.getElementById('coup');
  if(coup){
  const coupLines = document.querySelectorAll('#coupLines p');
  const coupLock  = document.getElementById('coupLock');   // the skip button
  const coupPunch = document.getElementById('coupPunch');
  const coupMute  = document.getElementById('coupMute');
  const anthem    = document.getElementById('anthem');

  const LOCK_MS = 8000;          // unskippable duration before the skip button appears
  let coupRunning = false;

  function goToVision(){
    const next = document.querySelector('#hero ~ section:not(#coup)');
    if(next){ next.scrollIntoView({behavior:'smooth'}); }
    else { window.scrollTo({top:innerHeight, behavior:'smooth'}); }
  }

  function fadeOutAudio(){
    if(anthem.paused) return;
    const step = setInterval(()=>{
      anthem.volume = Math.max(0, anthem.volume - 0.08);
      if(anthem.volume <= 0.02){ anthem.pause(); anthem.volume = 1; clearInterval(step); }
    }, 70);
  }

  function startCoup(){
    if(coupRunning) return;
    coupRunning = true;

    coup.classList.add('show');
    coup.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';

    // play the anthem (allowed — triggered by the click gesture)
    anthem.volume = 1;
    anthem.currentTime = 0;
    anthem.play().catch(()=>{ /* autoplay blocked / no file — visuals still run */ });

    // stagger propaganda lines
    coupLines.forEach((p,i)=> setTimeout(()=> p.classList.add('show'), 1700 + i*1400));

    // unskippable: the skip button only appears after the lock period
    setTimeout(()=> coupLock.classList.add('ready'), LOCK_MS);
  }

  function revealPunch(){
    coupPunch.classList.add('show');
    fadeOutAudio();
  }

  // "Begin the journey" -> trigger the gag
  document.getElementById('beginBtn').addEventListener('click', (ev)=>{
    ev.preventDefault();
    startCoup();
  });

  // skip button -> reveal the punchline
  coupLock.addEventListener('click', revealPunch);

  // mute toggle
  coupMute.addEventListener('click', ()=>{
    anthem.muted = !anthem.muted;
    coupMute.textContent = anthem.muted ? '🔇' : '🔊';
  });

  // continue to the real presentation
  document.getElementById('coupContinue').addEventListener('click', (ev)=>{
    ev.preventDefault();
    fadeOutAudio();
    coup.classList.remove('show');
    coup.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    setTimeout(goToVision, 360);
  });
  } // end coup gag (skipped on subpages)

  /* ============================================================
     FINAL — closing reveal + "I'M IN" celebration
     ============================================================ */
  const finale = document.getElementById('finale');
  if(finale){
    const finEls = finale.querySelectorAll('[data-fin]');

    // staged reveal of the closing lines + CTA when the section enters view
    if(reduce){
      finEls.forEach(el=> el.classList.add('show'));
    }else{
      let played = false;
      const finObs = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
          if(e.isIntersecting && !played){
            played = true;
            finEls.forEach((el,i)=> setTimeout(()=> el.classList.add('show'), i*1150));
            finObs.disconnect();
          }
        });
      }, {threshold:0.45});
      finObs.observe(finale);
    }

    // "I'M IN" -> celebratory burst, then route to the final page
    const imIn = document.getElementById('imInBtn');
    const celebrate = document.getElementById('celebrate');
    if(imIn && celebrate){
      imIn.addEventListener('click', ()=>{
        if(!reduce){
          const colors = ['#8ad4ff','#46b2ff','#ff8079','#ff5d54','#c4ecff','#ffffff'];
          for(let i=0;i<48;i++){
            const c = document.createElement('span');
            c.className = 'confetti';
            const ang = Math.random()*Math.PI*2;
            const dist = 130 + Math.random()*360;
            c.style.setProperty('--tx', (Math.cos(ang)*dist).toFixed(1)+'px');
            c.style.setProperty('--ty', (Math.sin(ang)*dist).toFixed(1)+'px');
            c.style.setProperty('--rot', (Math.random()*720-360).toFixed(0)+'deg');
            c.style.setProperty('--dur', (0.9+Math.random()*0.8).toFixed(2)+'s');
            c.style.background = colors[(Math.random()*colors.length)|0];
            if(Math.random()<0.5) c.style.borderRadius = '50%';
            celebrate.appendChild(c);
          }
        }
        celebrate.classList.add('show');
        celebrate.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
        setTimeout(()=>{ window.location.href = 'together.html'; }, reduce ? 600 : 2600);
      });
    }
  } // end finale

})();
