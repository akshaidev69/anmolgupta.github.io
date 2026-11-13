(function(){
  var C=window.SITE||{};
  var WA='https://wa.me/919582747027';
  function track(name,params){try{if(typeof gtag==='function')gtag('event',name,params||{});if(window.clarity)clarity('event',name);}catch(e){}}

  // nav
  var nav=document.querySelector('.nav');
  function onScroll(){nav&&nav.classList.toggle('scrolled',window.scrollY>10)}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});
  var b=document.querySelector('.burger'),m=document.querySelector('.menu');
  if(b&&m){b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o)});
    m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){m.classList.remove('open');b.setAttribute('aria-expanded','false')})});}

  // reveal
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    els.forEach(function(e){io.observe(e)});
  } else els.forEach(function(e){e.classList.add('in')});
  document.querySelectorAll('[data-count]').forEach(function(el){
    var end=+el.dataset.count,suf=el.dataset.suffix||'',done=false;
    var o=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!done){done=true;var t0=null;
      function step(t){t0=t0||t;var p=Math.min((t-t0)/1200,1);el.textContent=Math.round(end*(1-Math.pow(1-p,3)))+suf;if(p<1)requestAnimationFrame(step)}
      requestAnimationFrame(step)}});o.observe(el);
  });

  // project filters
  var fb=document.querySelectorAll('.filters button');
  fb.forEach(function(btn){btn.addEventListener('click',function(){
    fb.forEach(function(x){x.classList.remove('on')});btn.classList.add('on');
    var f=btn.dataset.f;document.querySelectorAll('.proj[data-cat]').forEach(function(p){p.classList.toggle('hide',f!=='all'&&p.dataset.cat.indexOf(f)<0)});
  })});

  // click tracking (GA4 events)
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a');if(!a)return;
    var h=a.getAttribute('href')||'',label=(a.textContent||'').trim().slice(0,60),page=location.pathname;
    if(/free demo/i.test(label))track('cta_free_demo_click',{link_text:label,link_url:h,page:page});
    if(h.indexOf('wa.me')>-1)track('whatsapp_click',{link_text:label,page:page});
    else if(h.indexOf('tel:')===0)track('phone_click',{page:page});
    else if(h.indexOf('mailto:')===0)track('email_click',{page:page});
    else if(a.closest('.proj')&&/^https?:/.test(h))track('project_outbound_click',{project_url:h,link_text:label,page:page});
    else if(/^https?:/.test(h)&&h.indexOf(location.host)<0)track('outbound_click',{link_url:h,page:page});
  },true);

  // lead helpers
  function utm(){var q=new URLSearchParams(location.search),o=[];['utm_source','utm_medium','utm_campaign'].forEach(function(k){if(q.get(k))o.push(k+'='+q.get(k))});
    return o.join('&')||(document.referrer?'ref='+document.referrer:'direct');}
  function sendLead(d,source){
    var payload={name:d.name||'',phone:d.phone||'',email:d.email||'',service:d.service||'',message:d.msg||'',business:d.business||'',site:d.site||'',page:location.pathname,source:source+' | '+utm()};
    if(C.leads){try{fetch(C.leads,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)})}catch(e){}}
    if(C.endpoint){try{var body=Object.assign({},payload,{_subject:'New website lead: '+payload.name});if(C.w3key)body.access_key=C.w3key;
      fetch(C.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)})}catch(e){}}
  }
  function toObj(form){var o={};new FormData(form).forEach(function(v,k){o[k]=String(v).trim()});return o;}
  function waText(d){var t='Hi Anmol, I would like a free demo.\n\nName: '+(d.name||'')+(d.phone?'\nPhone: '+d.phone:'')+(d.email?'\nEmail: '+d.email:'')+(d.business?'\nBusiness: '+d.business:'')+'\nService: '+(d.service||'')+(d.site?'\nCurrent website: '+d.site:'');if(d.msg)t+='\n\n'+d.msg;return t;}

  // contact page form
  var form=document.getElementById('cform');
  if(form){
    form.addEventListener('submit',function(e){e.preventDefault();if(!form.reportValidity())return;var d=toObj(form);
      sendLead(d,'contact_form');track('contact_form_submit',{service:d.service,method:'whatsapp'});track('generate_lead',{form:'contact'});
      window.open(WA+'?text='+encodeURIComponent(waText(d)),'_blank','noopener');});
    var em=document.getElementById('cform-email');
    em&&em.addEventListener('click',function(){if(!form.reportValidity())return;var d=toObj(form);
      sendLead(d,'contact_form_email');track('contact_form_submit',{service:d.service,method:'email'});
      location.href='mailto:anmolg2270@gmail.com?subject='+encodeURIComponent('Free demo request')+'&body='+encodeURIComponent(waText(d));});
  }

  // lead popup: 15s, 50% scroll or exit intent; once per session
  var lp=document.getElementById('lp');
  if(lp){
    var KEY='lp_seen',lastFocus=null,shown=false;
    function seen(){try{return sessionStorage.getItem(KEY)}catch(e){return false}}
    function open(trigger){
      if(shown||seen())return;shown=true;try{sessionStorage.setItem(KEY,'1')}catch(e){}
      lastFocus=document.activeElement;lp.hidden=false;requestAnimationFrame(function(){lp.classList.add('on')});
      document.body.style.overflow='hidden';var f=lp.querySelector('input');f&&f.focus({preventScroll:true});
      track('popup_view',{trigger:trigger,page:location.pathname});cleanup();
    }
    function close(){lp.classList.remove('on');document.body.style.overflow='';setTimeout(function(){lp.hidden=true},250);lastFocus&&lastFocus.focus&&lastFocus.focus();}
    lp.querySelectorAll('[data-close]').forEach(function(x){x.addEventListener('click',close)});
    document.addEventListener('keydown',function(e){if(lp.hidden)return;
      if(e.key==='Escape')close();
      if(e.key==='Tab'){var f=lp.querySelectorAll('button,input,select,textarea,a[href]'),first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
    var timer=setTimeout(function(){open('timer_15s')},15000);
    function onSc(){var h=document.documentElement;if((h.scrollTop+innerHeight)/h.scrollHeight>=.5)open('scroll_50')}
    function onOut(e){if(!e.relatedTarget&&e.clientY<=0)open('exit_intent')}
    function cleanup(){clearTimeout(timer);removeEventListener('scroll',onSc);document.removeEventListener('mouseout',onOut)}
    if(!seen()&&!/contact\.html$/.test(location.pathname)){
      addEventListener('scroll',onSc,{passive:true});
      if(matchMedia('(pointer:fine)').matches)document.addEventListener('mouseout',onOut);
    } else cleanup();
    var lf=document.getElementById('lp-form');
    lf.addEventListener('submit',function(e){e.preventDefault();if(!lf.reportValidity())return;var d=toObj(lf);
      sendLead(d,'popup');track('popup_lead',{service:d.service,page:location.pathname});track('generate_lead',{form:'popup'});
      window.open(WA+'?text='+encodeURIComponent(waText(d)),'_blank','noopener');
      lf.innerHTML='<div class="lp-done"><h3>Thank you! 🎉</h3><p>WhatsApp should open with your details. If it did not, message me at <a class="inl" href="'+WA+'">+91 95827 47027</a>.</p></div>';
      setTimeout(close,4000);});
  }
  var y=document.getElementById('yr');if(y)y.textContent=new Date().getFullYear();
})();
