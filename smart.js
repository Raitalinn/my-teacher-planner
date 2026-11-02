'use strict';
// Mobile-first realtime controls; notifications work while the app is active.
let reminderMinutes=5, reminderEnabled=true, lastReminderKey='';
const msTime=(date,time)=>{let [h,m]=time.split(':').map(Number),d=new Date(date);d.setHours(h,m,0,0);return d};
function liveState(){
 let now=new Date(),today=now.getDay(),mins=now.getHours()*60+now.getMinutes();
 let todaySlots=slots.filter(s=>s.day===today).sort((a,b)=>a.start.localeCompare(b.start));
 let curr=todaySlots.find(s=>s.start<=now.toTimeString().slice(0,5)&&s.end>now.toTimeString().slice(0,5));
 let next=todaySlots.find(s=>s.start>now.toTimeString().slice(0,5));
 return {now,curr,next,mins,todaySlots};
}
function minutesTill(time,now){return Math.max(0,Math.ceil((msTime(now,time)-now)/60000))}
function smartPanel(){
 let {now,curr,next}=liveState(),l=curr||next;
 let key=now.toLocaleDateString('th-TH',{weekday:'long',day:'numeric',month:'short'});
 if(!l)return '<div class="card panel"><div class="labelmini">ตารางเรียนตามเวลาจริง</div><h2>ไม่มีคาบเรียนที่กำลังสอนหรือรอเริ่มวันนี้</h2></div>';
 let label=curr?'กำลังสอนอยู่':'คาบถัดไป',counter=curr?minutesTill(curr.end,now):minutesTill(next.start,now);
 return '<div class="card panel" style="border:1px solid #b8d6f9"><div class="section" style="margin:0 0 8px"><strong>◉ '+label+'</strong><span class="tag">'+key+'</span></div><h2 style="margin:0">'+esc(l.room)+' · '+esc(l.subject)+'</h2><div class="muted" style="margin:8px 0">'+esc(l.type)+' · คาบ '+l.period+' · '+l.start+'–'+l.end+'</div><div class="stats" style="margin:14px 0"><div class="stat"><strong>'+counter+'</strong><span>นาที'+(curr?'จนหมดคาบ':'ก่อนเริ่มคาบ')+'</span></div><div class="stat"><strong>'+now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+'</strong><span>เวลาปัจจุบัน</span></div></div><div class="actions"><button class="btn secondary" data-attopen="'+esc(l.id)+'" data-attroom="'+esc(l.room)+'" data-attdate="'+localDate()+'">เช็กชื่อ</button>'+(([...CLASSES,'กิจกรรมชาย','กิจกรรมหญิง'].includes(l.room))?'<button class="btn secondary" data-attopen="'+esc(l.id)+'" data-attroom="'+esc(l.room)+'" data-attdate="'+localDate()+'">เช็กชื่อ</button>':'')+'</div></div>';
}
function reminderPreferences(){
 return '<div class="card panel"><h2>แจ้งเตือนก่อนสอน</h2><div class="muted">แจ้งเตือนเมื่อเปิดแอปอยู่ หากปิดแอปหรือมือถือพักหน้าจออาจไม่เตือน</div><div class="field"><label>เตือนล่วงหน้า</label><div class="pills">'+[5,10,15].map(n=>'<button class="'+(reminderMinutes===n?'active':'')+'" data-remmin="'+n+'">'+n+' นาที</button>').join('')+'</div></div><div class="actions"><button class="btn secondary" data-remtoggle="1">'+(reminderEnabled?'ปิดเตือน':'เปิดเตือน')+'</button><button class="btn" data-rempermission="1">อนุญาตแจ้งเตือน</button></div></div>';
}
async function loadReminder(){
 let v=(await all('settings')).find(x=>x.id==='smart-reminder');
 if(v){reminderMinutes=v.minutes||5;reminderEnabled=v.enabled!==false}
}
async function saveReminder(){await put('settings',{id:'smart-reminder',minutes:reminderMinutes,enabled:reminderEnabled})}
async function checkReminder(){
 if(!db||!reminderEnabled)return;
 const {now,next}=liveState();
 if(!next)return;
 let delta=(msTime(now,next.start)-now)/60000;
 if(delta<0||delta>reminderMinutes||delta<=reminderMinutes-1.5)return;
 let key=localDate()+'|'+next.id+'|'+reminderMinutes;
 if(lastReminderKey===key)return;
 let marker=(await all('settings')).find(x=>x.id==='reminded:'+key);
 if(marker)return;
 lastReminderKey=key;await put('settings',{id:'reminded:'+key,at:now.toISOString()});
 let msg='อีก '+Math.ceil(delta)+' นาที: '+next.room+' · '+next.subject;
 toast(msg);
 if('Notification'in window&&Notification.permission==='granted'){
 try{new Notification('เตรียมเข้าสอนคาบ '+next.period,{body:msg,tag:key})}catch(err){console.warn(err)}
 }
}
function quickLogButtons(){
 if(page!=='logForm')return;
 let form=document.querySelector('#logForm'),status=form?.querySelector('[name="status"]');
 if(!status||form.querySelector('#quickStatus'))return;
 let bar=document.createElement('div');bar.className='field';bar.id='quickStatus';bar.innerHTML='<label>เลือกสถานะอย่างรวดเร็ว</label><div class="pills">'+['สอนครบ','สอนไม่ครบ','งดสอน','สอนชดเชย'].map(x=>'<button type="button" data-quickstatus="'+x+'" class="'+(status.value===x?'active':'')+'">'+x+'</button>').join('')+'</div>';
 status.closest('.field')?.after(bar);
}

function slotVisualStatus(slot,date){
 const now=new Date(),today=localDate(),log=sessionOf(slot,date);
 let state='upcoming',label='ยังไม่เริ่ม',color='#64748b';
 if(date<today){state='ended';label='หมดคาบแล้ว';color='#dc2626'}
 else if(date===today){
  const current=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  const tm=t=>Number(t.slice(0,2))*60+Number(t.slice(3,5));
  const a=tm(slot.start),b=tm(slot.end);
  if(current>=b){state='ended';label='หมดคาบแล้ว';color='#dc2626'}
  else if(current>=a&&b-current<=5){state='ending';label='ใกล้หมดคาบ';color='#ea580c'}
  else if(current>=a){state='teaching';label='กำลังสอน';color='#16a34a'}
 }
 if(log && log.status==='งดสอน')return {state:'cancelled',label:'งดสอนแล้ว',color:'#64748b',log};
 return {state,label,color,log};
}
function statusRibbon(slot,date){
 const v=slotVisualStatus(slot,date);
 const now=new Date(),total=msTime(now,slot.end)-msTime(now,slot.start);
 const elapsed=now-msTime(now,slot.start);
 const percent=date===localDate()?Math.max(0,Math.min(100,Math.round(100*elapsed/Math.max(1,total)))):(date<localDate()?100:0);
 return '<div class="teacher-status" style="border-left:5px solid '+v.color+';padding-left:10px;margin:9px 0 2px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span style="font-size:12px;font-weight:700;color:'+v.color+'">● '+v.label+'</span>'+(v.log?'<span style="font-size:12px;color:#166534">✓ บันทึก: '+esc(v.log.status)+'</span>':(v.state==='ended'?'<span style="font-size:12px;color:#b45309">ยังไม่บันทึกการสอน</span>':''))+'</div><div style="height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden;margin-top:7px"><div style="width:'+percent+'%;height:100%;background:'+v.color+';transition:width .3s"></div></div></div>';
}
function decorateCards(){
 if(!['home','schedule'].includes(page))return;
 const cards=[...document.querySelectorAll('main.wrap .rowcard')];
 const date=page==='schedule'?(selectedScheduleDate||dayDate(dayFilter)):localDate();
 const ordered=slots.filter(s=>s.day===(page==='schedule'?dayFilter:new Date().getDay())).sort((a,b)=>a.start.localeCompare(b.start));
 cards.forEach((card,index)=>{
   const slot=ordered[index];if(!slot||card.querySelector('.teacher-status'))return;
   const v=slotVisualStatus(slot,date);
   card.style.borderLeft='5px solid '+v.color;
   const timeBox=card.querySelector('.time');
   if(timeBox){
     timeBox.style.cssText='background:'+v.color+';color:#fff;border-radius:12px;padding:10px 8px;min-width:77px;text-align:center;font-weight:800';
     const sm=timeBox.querySelector('small');if(sm){sm.style.color='#fff';sm.style.opacity='.95'}
     const previous=timeBox.querySelector('.period-caption');if(previous)previous.remove();
     const label=document.createElement('div');label.className='period-caption';label.style.cssText='font-size:11px;font-weight:700;line-height:1.3;margin-top:6px;color:white';label.textContent='คาบ '+slot.period+' · '+(v.state==='teaching'?'กำลังสอน':v.state==='ending'?'ใกล้หมด':v.state==='ended'?'หมดเวลา':v.state==='cancelled'?'งดสอน':'รอเริ่ม');timeBox.appendChild(label);
   }

   const grow=card.querySelector('.grow');if(grow)grow.insertAdjacentHTML('beforeend',statusRibbon(slot,date));
 });
}

const smartBaseRender=render;
render=function(){
 smartBaseRender();
 if(page==='home'){
 const title=document.querySelector('main.wrap .h1');
 if(title)title.insertAdjacentHTML('afterend',smartPanel());
 }
 if(page==='more'){const stack=document.querySelector('main.wrap .stack');if(stack)stack.insertAdjacentHTML('beforebegin',reminderPreferences()+'<div class="card panel"><h2>ปฏิทินมือถือ</h2><div class="muted">ส่งออกตารางสอนแบบซ้ำทุกสัปดาห์ 20 สัปดาห์ และตั้งเตือนก่อนคาบได้ 5 นาทีผ่านแอปปฏิทิน</div><button class="btn full" data-exportics="1">ดาวน์โหลดตารางเรียน (.ics)</button></div>')}
 quickLogButtons();
 decorateCards();
};
document.addEventListener('click',async e=>{
 let b=e.target.closest('button');if(!b)return;
 if(b.dataset.quickstatus){let sel=document.querySelector('#logForm [name="status"]');if(sel){sel.value=b.dataset.quickstatus;quickLogButtons();document.querySelectorAll('#quickStatus button').forEach(x=>x.classList.toggle('active',x.dataset.quickstatus===sel.value))}return}
 if(b.dataset.remmin){reminderMinutes=Number(b.dataset.remmin);await saveReminder();render();return}
 if(b.dataset.remtoggle){reminderEnabled=!reminderEnabled;await saveReminder();render();return}
 if(b.dataset.rempermission){if(!('Notification'in window)){toast('เบราว์เซอร์ไม่รองรับการแจ้งเตือน');return}let p=await Notification.requestPermission();toast(p==='granted'?'อนุญาตแจ้งเตือนแล้ว':'ยังไม่ได้รับสิทธิ์แจ้งเตือน');return}
 if(b.dataset.exportics){exportIcs();return}
});
function exportIcs(){
 const fmt=d=>d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';
 const escapeICS=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
 let now=new Date(),first=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 let events=slots.map(slot=>{
 let d=new Date(first);d.setDate(d.getDate()+(slot.day-d.getDay()+7)%7);
 let start=msTime(d,slot.start),end=msTime(d,slot.end);
 return ['BEGIN:VEVENT','UID:'+slot.id+'-'+fmt(start)+'@myteacherplanner','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),
 'DTSTART;TZID=Asia/Bangkok:'+fmt(start),'DTEND;TZID=Asia/Bangkok:'+fmt(end),'RRULE:FREQ=WEEKLY;COUNT=20','SUMMARY:'+escapeICS(slot.room+' - '+slot.subject),'DESCRIPTION:'+escapeICS(slot.type+' / คาบ '+slot.period),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:เตรียมเข้าสอน','TRIGGER:-PT5M','END:VALARM','END:VEVENT'].join('\r\n');
 });
 const zone=['BEGIN:VTIMEZONE','TZID:Asia/Bangkok','BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:+0700','TZOFFSETTO:+0700','TZNAME:ICT','END:STANDARD','END:VTIMEZONE'].join('\r\n');
 download('my-teacher-timetable.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//My Teacher Planner//TH',zone,...events,'END:VCALENDAR'].join('\r\n'),'text/calendar;charset=utf-8');
 toast('ดาวน์โหลดไฟล์ปฏิทินแล้ว');
}
setInterval(()=>{if(document.visibilityState==='visible'&&db){if(page==='home'||page==='schedule')render();checkReminder().catch(console.error)}},30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&db){loadReminder().then(()=>{if(page==='home')render();checkReminder()})}});
setTimeout(()=>{if(db)loadReminder().then(()=>checkReminder())},1000);
