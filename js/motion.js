/* Original motion layer for iamanmolgupta.com. Vanilla JS, no third-party code copied. */
(function(){
  var doc=document, html=doc.documentElement, win=window;
  html.setAttribute('data-motion','1');

  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(pointer:fine)').matches && matchMedia('(hover:hover)').matches;
  var touch=('ontouchstart' in win) || (navigator.maxTouchPoints||0)>0;
  var useCursor=fine && !touch && !reduce;
  var useSmooth=fine && !touch && !reduce;

  function qs(s,el){return (el||doc).querySelector(s)}
  function qsa(s,el){return Array.prototype.slice.call((el||doc).querySelectorAll(s))}
  function clamp(n,a,b){return n<a?a:n>b?b:n}
  function onReady(fn){
    if(!html.classList.contains('pl') || html.classList.contains('pl-done')){fn();return}
    var mo=new MutationObserver(function(){
      if(!html.classList.contains('pl') || html.classList.contains('pl-done')){mo.disconnect();fn()}
    });
    mo.observe(html,{attributes:true,attributeFilter:['class']});
  }
  function maxScroll(){return Math.max(0, (doc.scrollingElement||html).scrollHeight - win.innerHeight)}

  /* ---------- scroll progress ---------- */
  var bar=doc.createElement('div');
  bar.className='scroll-progress';
  bar.setAttribute('aria-hidden','true');
  doc.body.appendChild(bar);
  function setProgress(y){
    var m=maxScroll();
    bar.style.transform='scaleX('+(m?clamp(y/m,0,1):0)+')';
  }

  /* ---------- custom cursor ---------- */
  var dot, glow, cx=0, cy=0, gx=0, gy=0, cursorOn=false, cursorRaf=0;
  function cursorTick(){
    gx+=(cx-gx)*0.18; gy+=(cy-gy)*0.18;
    dot.style.left=cx+'px'; dot.style.top=cy+'px';
    glow.style.left=gx+'px'; glow.style.top=gy+'px';
    cursorRaf=requestAnimationFrame(cursorTick);
  }
  if(useCursor){
    dot=doc.createElement('div'); dot.className='cursor-dot'; dot.setAttribute('aria-hidden','true');
    glow=doc.createElement('div'); glow.className='cursor-glow'; glow.setAttribute('aria-hidden','true');
    doc.body.appendChild(glow); doc.body.appendChild(dot);
    html.classList.add('cursor-on');
    doc.addEventListener('mousemove',function(e){
      cx=e.clientX; cy=e.clientY;
      if(!cursorOn){cursorOn=true; gx=cx; gy=cy; cursorTick()}
    },{passive:true});
    doc.addEventListener('mouseleave',function(){html.classList.add('is-cursor-off')});
    doc.addEventListener('mouseenter',function(){html.classList.remove('is-cursor-off')});
    doc.addEventListener('mousedown',function(){html.classList.add('is-hovering')});
    doc.addEventListener('mouseup',function(){/* keep if still over link */});
    function isInteractive(el){
      if(!el||el===doc||el===html)return false;
      var tag=(el.tagName||'').toLowerCase();
      if(tag==='a'||tag==='button'||tag==='label'||tag==='summary'||el.classList&&el.classList.contains('btn'))return true;
      if(el.getAttribute&&el.getAttribute('role')==='button')return true;
      return false;
    }
    function isField(el){
      var tag=(el&&el.tagName||'').toLowerCase();
      return tag==='input'||tag==='textarea'||tag==='select'||(el&&el.isContentEditable);
    }
    doc.addEventListener('mouseover',function(e){
      var t=e.target;
      html.classList.toggle('is-hovering', isInteractive(t) || isInteractive(t&&t.closest&&t.closest('a,button,.btn,summary,.wa-float,.card,.proj')));
      html.classList.toggle('is-cursor-off', isField(t));
    },{passive:true});
  }

  /* ---------- inertial scrolling (Lenis-style, original) ---------- */
  var LERP=0.15, WHEEL_MULT=1.18, ANCHOR_MS=700;
  var inertia={active:false, current:0, target:0, running:false, self:false, mode:'lerp', lerp:0.15, from:0, t0:0, dur:0};
  function isNestedScroll(el, dy, dx){
    while(el && el!==doc.body && el!==html){
      if(el===qs('.lp-box') || (el.classList&&el.classList.contains('shot-carousel'))){
        var ox=getComputedStyle(el).overflowX;
        if((ox==='auto'||ox==='scroll') && Math.abs(dx)>Math.abs(dy) && el.scrollWidth>el.clientWidth+1) return true;
        if(el.classList.contains('shot-carousel') && Math.abs(dx)>Math.abs(dy)) return true;
      }
      var st=getComputedStyle(el), oy=st.overflowY, ox=st.overflowX;
      var canY=(oy==='auto'||oy==='scroll') && el.scrollHeight>el.clientHeight+1;
      if(canY){
        if(dy<0 && el.scrollTop>0) return true;
        if(dy>0 && el.scrollTop+el.clientHeight<el.scrollHeight-1) return true;
      }
      var canX=(ox==='auto'||ox==='scroll') && el.scrollWidth>el.clientWidth+1;
      if(canX && Math.abs(dx)>Math.abs(dy)) return true;
      el=el.parentElement;
    }
    return false;
  }
  function locked(){
    return doc.body.style.overflow==='hidden' || (qs('.lp')&&qs('.lp').classList.contains('on')) || html.classList.contains('pl');
  }
  function easeOutCubic(t){return 1-Math.pow(1-t,3)}
  function inertiaStep(now){
    if(!inertia.active||locked()){inertia.running=false;inertia.current=win.scrollY;inertia.target=inertia.current;inertia.mode='lerp';return}
    if(!inertia.running) return;
    if(inertia.mode==='ease'){
      var t=Math.min(1,((now||performance.now())-inertia.t0)/inertia.dur);
      inertia.current=inertia.from+(inertia.target-inertia.from)*easeOutCubic(t);
      if(t>=1){inertia.current=inertia.target;inertia.running=false;inertia.mode='lerp'}
    } else {
      var d=inertia.target-inertia.current;
      inertia.current+=d*(inertia.lerp||LERP);
      if(Math.abs(d)<0.35){inertia.current=inertia.target;inertia.running=false}
    }
    inertia.self=true;
    win.scrollTo(0, inertia.current);
    inertia.self=false;
    if(inertia.running) requestAnimationFrame(inertiaStep);
  }
  function kickInertia(){
    inertia.mode='lerp';
    inertia.lerp=LERP;
    if(!inertia.running){inertia.running=true;inertiaStep()}
  }
  function easeTo(y, ms){
    inertia.mode='ease';
    inertia.from=inertia.current;
    inertia.target=clamp(y,0,maxScroll());
    inertia.t0=performance.now();
    inertia.dur=ms||ANCHOR_MS;
    if(!inertia.running){inertia.running=true;requestAnimationFrame(inertiaStep)}
  }
  if(useSmooth){
    inertia.active=true;
    inertia.current=win.scrollY;
    inertia.target=inertia.current;
    html.classList.add('inertia');
    win.addEventListener('wheel',function(e){
      if(e.ctrlKey||e.defaultPrevented||locked()) return;
      if(isNestedScroll(e.target, e.deltaY, e.deltaX)) return;
      e.preventDefault();
      var dy=e.deltaY;
      if(e.deltaMode===1) dy*=16;
      if(e.deltaMode===2) dy*=win.innerHeight;
      inertia.target=clamp(inertia.target+dy*WHEEL_MULT, 0, maxScroll());
      kickInertia();
    },{passive:false});
    doc.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('a[href]');
      if(!a) return;
      var href=a.getAttribute('href');
      if(!href||href.charAt(0)!=='#') return;
      var id=href.slice(1);
      if(!id) return;
      var dest=id==='top'?html:doc.getElementById(id)||qs('[name="'+id+'"]');
      if(!dest) return;
      e.preventDefault();
      var nav=qs('.nav');
      var top=dest.getBoundingClientRect().top+win.scrollY - ((nav&&nav.offsetHeight)||72) - 8;
      easeTo(top, ANCHOR_MS);
      if(history.replaceState) history.replaceState(null,'',href);
    });
    doc.addEventListener('keydown',function(e){
      var k=e.key;
      if(k!=='ArrowUp'&&k!=='ArrowDown'&&k!=='PageUp'&&k!=='PageDown'&&k!=='Home'&&k!=='End'&&k!==' '&&k!=='Spacebar') return;
      if(e.ctrlKey||e.metaKey||e.altKey) return;
      var t=e.target, tag=(t&&t.tagName||'').toLowerCase();
      if(tag==='input'||tag==='textarea'||tag==='select'||(t&&t.isContentEditable)) return;
      inertia.running=false;
      inertia.mode='lerp';
      inertia.current=win.scrollY;
      inertia.target=inertia.current;
    });
  }

  /* ---------- magnetic buttons ---------- */
  function magnetize(el, strength){
    if(!useCursor) return;
    var s=strength||0.32;
    el.addEventListener('mousemove',function(e){
      var r=el.getBoundingClientRect();
      var x=(e.clientX-r.left-r.width/2)*s;
      var y=(e.clientY-r.top-r.height/2)*s;
      el.style.setProperty('--mx', x.toFixed(1)+'px');
      el.style.setProperty('--my', y.toFixed(1)+'px');
    });
    el.addEventListener('mouseleave',function(){
      el.style.setProperty('--mx','0px');
      el.style.setProperty('--my','0px');
    });
  }

  /* ---------- card tilt ---------- */
  function tilt(el){
    if(!useCursor) return;
    el.addEventListener('mousemove',function(e){
      var r=el.getBoundingClientRect();
      var px=(e.clientX-r.left)/r.width - 0.5;
      var py=(e.clientY-r.top)/r.height - 0.5;
      el.style.setProperty('--rx', (-py*6).toFixed(2)+'deg');
      el.style.setProperty('--ry', (px*7).toFixed(2)+'deg');
    });
    el.addEventListener('mouseleave',function(){
      el.style.setProperty('--rx','0deg');
      el.style.setProperty('--ry','0deg');
    });
  }

  /* ---------- split-text headlines ---------- */
  function splitHeadline(el){
    if(reduce||el.classList.contains('is-split')) return;
    var nodes=Array.prototype.slice.call(el.childNodes);
    var delay=0, htmlBuf=doc.createDocumentFragment();
    function wrapWord(text, extraClass){
      var parts=text.split(/(\s+)/);
      parts.forEach(function(part){
        if(!part) return;
        if(/^\s+$/.test(part)){ htmlBuf.appendChild(doc.createTextNode(part)); return; }
        var w=doc.createElement('span'); w.className='split-w';
        var i=doc.createElement('span'); i.className='split-i'+(extraClass?' '+extraClass:'');
        i.textContent=part;
        i.style.setProperty('--d', (delay*0.045).toFixed(3)+'s');
        w.appendChild(i); htmlBuf.appendChild(w); delay++;
      });
    }
    nodes.forEach(function(node){
      if(node.nodeType===3){ wrapWord(node.nodeValue); return; }
      if(node.nodeType!==1){ htmlBuf.appendChild(node); return; }
      var clone=node.cloneNode(false);
      var text=node.textContent;
      if(node.childNodes.length===1 && node.childNodes[0].nodeType===3){
        var parts=text.split(/(\s+)/);
        parts.forEach(function(part){
          if(!part) return;
          if(/^\s+$/.test(part)){ clone.appendChild(doc.createTextNode(part)); return; }
          var w=doc.createElement('span'); w.className='split-w';
          var i=doc.createElement('span'); i.className='split-i';
          i.textContent=part;
          i.style.setProperty('--d', (delay*0.045).toFixed(3)+'s');
          w.appendChild(i); clone.appendChild(w); delay++;
        });
        htmlBuf.appendChild(clone);
      } else {
        htmlBuf.appendChild(node);
      }
    });
    el.textContent='';
    el.appendChild(htmlBuf);
    el.classList.add('is-split');
  }
  function showSplits(){
    qsa('h1.is-split').forEach(function(h){ h.classList.add('is-shown'); });
  }

  /* ---------- reveals + section in-view + counters fallback ---------- */
  function initReveals(){
    var els=qsa('.reveal');
    function show(el){ el.classList.add('in'); }
    if(reduce){ els.forEach(show); return; }
    html.classList.add('motion-ok');
    qsa('.grid, .pp, .faq, .steps').forEach(function(parent){
      var kids=qsa(':scope > .reveal', parent);
      kids.forEach(function(k,i){ k.style.setProperty('--stagger', (i*0.07).toFixed(2)+'s'); });
    });
    if('IntersectionObserver' in win){
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting){ show(en.target); io.unobserve(en.target); }
        });
      },{rootMargin:'0px 0px -8% 0px', threshold:0.08});
      els.forEach(function(el){ if(el.classList.contains('in')) return; io.observe(el); });
      var so=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting) en.target.classList.add('sec-in');
        });
      },{threshold:0.12});
      qsa('main > section').forEach(function(s){ so.observe(s); });
    } else els.forEach(show);
  }

  /* ---------- parallax (hero stack + page glow stays CSS) ---------- */
  var stack=qs('[data-parallax], .hero .stack');
  var shots=stack?qsa('.shot, .badge-float', stack):[];
  var mx=0, my=0, sx=0, sy=0, paraRaf=0, paraLive=false;
  function paraTick(){
    sx+=(mx-sx)*0.08; sy+=(my-sy)*0.08;
    var y=win.scrollY;
    if(stack){
      var rect=stack.getBoundingClientRect();
      var mid=rect.top+rect.height/2 - win.innerHeight/2;
      var scrollShift=clamp(mid*0.12, -80, 80);
      stack.style.transform='translate3d(0,'+scrollShift.toFixed(1)+'px,0)';
      shots.forEach(function(el,i){
        var depth=(i+1)*8;
        var extra = el.classList.contains('badge-float') ? depth*0.7 : depth;
        el.style.setProperty('--px', (sx*extra).toFixed(1)+'px');
        el.style.setProperty('--py', (sy*extra).toFixed(1)+'px');
      });
    }
    if(paraLive) paraRaf=requestAnimationFrame(paraTick);
  }
  function startPara(){
    if(reduce||paraLive) return;
    paraLive=true; paraTick();
  }
  function onHeroMove(e){
    var hero=qs('.hero');
    if(!hero||!fine) return;
    var r=hero.getBoundingClientRect();
    if(!r.width||!r.height) return;
    mx=(e.clientX-r.left)/r.width - 0.5;
    my=(e.clientY-r.top)/r.height - 0.5;
  }

  /* ---------- frame loop for progress / inertia sync ---------- */
  function onScroll(){
    var y=win.scrollY;
    if(useSmooth && !inertia.self){ inertia.current=y; inertia.target=y; }
    setProgress(y);
  }
  win.addEventListener('scroll',onScroll,{passive:true});
  onScroll();

  /* bind interactions */
  qsa('.btn, .wa-float').forEach(function(el){ magnetize(el, el.classList.contains('wa-float')?0.22:0.35); });
  qsa('.card, article.proj, .about-card').forEach(tilt);

  qsa('.hero h1, .phero h1').forEach(splitHeadline);

  initReveals();
  if(stack && fine && !reduce){
    var hero=qs('.hero');
    if(hero) hero.addEventListener('mousemove', onHeroMove, {passive:true});
    startPara();
  }

  onReady(function(){
    if(reduce) return;
    var start=function(){ showSplits(); };
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(start).catch(start);
    else start();
  });

  win.addEventListener('resize',function(){
    if(useSmooth) inertia.target=clamp(inertia.target,0,maxScroll());
    setProgress(win.scrollY);
  },{passive:true});
})();
