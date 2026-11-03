'use strict';
// Theme preference is a cosmetic setting only; classroom data stays in IndexedDB.
const THEME_KEY='my-teacher-planner-theme';
function storedTheme(){try{return localStorage.getItem(THEME_KEY)==='dark'?'dark':'light'}catch(_){return 'light'}}
function applyPlannerTheme(theme){
 const choice=theme==='dark'?'dark':'light';
 document.documentElement.dataset.theme=choice;
 document.documentElement.style.colorScheme=choice;
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.setAttribute('content',choice==='dark'?'#0e1b2b':'#10243b');
 document.querySelectorAll('[data-theme]').forEach(button=>{
   const active=button.dataset.theme===choice;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',active?'true':'false');
 });
}
applyPlannerTheme(storedTheme());
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-theme]');
 if(!button)return;
 const choice=button.dataset.theme==='dark'?'dark':'light';
 try{localStorage.setItem(THEME_KEY,choice)}catch(_){}
 applyPlannerTheme(choice);
});
const previousThemeRender=render;
render=function(){previousThemeRender();applyPlannerTheme(storedTheme())};
