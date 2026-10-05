(()=>{
'use strict';
const pairs=[...document.querySelectorAll('.auth-pair')];
if(!pairs.length)return;
let openMenu=null,uid=0;

function close(){
  if(!openMenu)return;
  openMenu.classList.remove('open');
  openMenu.querySelector('.auth-toggle').setAttribute('aria-expanded','false');
  openMenu=null;
}
function build(pair){
  const id='auth-menu-'+(++uid);
  const wrap=document.createElement('span');
  wrap.className='auth-dd';
  wrap.innerHTML=
    `<button type="button" class="auth-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="${id}">Log in / Sign up <i aria-hidden="true">▾</i></button>`+
    `<span class="auth-menu" id="${id}" role="menu">`+
      `<button type="button" role="menuitem" data-act="login">Log in</button>`+
      `<button type="button" role="menuitem" data-act="signup">Sign up</button>`+
    `</span>`;
  pair.replaceWith(wrap);
}
pairs.forEach(build);
document.querySelectorAll('.site-nav .links a[data-act="login"]').forEach(a=>a.remove());

document.addEventListener('click',e=>{
  const t=e.target.closest&&e.target.closest('.auth-toggle');
  if(t){
    const dd=t.parentElement,was=dd.classList.contains('open');
    close();
    if(!was){dd.classList.add('open');t.setAttribute('aria-expanded','true');openMenu=dd;}
    return;
  }
  if(openMenu&&!(e.target.closest&&e.target.closest('.auth-menu')&&!e.target.closest('[data-act]')))close();
});
document.addEventListener('keydown',e=>{
  if(!openMenu)return;
  const items=[...openMenu.querySelectorAll('.auth-menu button')],i=items.indexOf(document.activeElement);
  if(e.key==='Escape'){const b=openMenu.querySelector('.auth-toggle');close();b.focus();}
  else if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    items[(i+(e.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
  }else if(e.key==='Tab')close();
});
window.addEventListener('hashchange',close);
})();
