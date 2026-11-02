'use strict';
// Reports are calculated locally. A past timetable slot is NOT proof of a taught lesson.
let reportMode='day',reportAnchor=localDate(),reportData={attendance:[],homework:[]};
function reportRange(){
 const d=new Date(reportAnchor+'T12:00:00');let a=new Date(d),b=new Date(d);
 if(reportMode==='week'){let offset=(d.getDay()+6)%7;a.setDate(d.getDate()-offset);b=new Date(a);b.setDate(a.getDate()+6)}
 if(reportMode==='month'){a=new Date(d.getFullYear(),d.getMonth(),1,12);b=new Date(d.getFullYear(),d.getMonth()+1,0,12)}
 return [localDate(a),localDate(b)];
}
function inRange(d,a,b){return d>=a&&d<=b}
function reportPage(){
 let [a,b]=reportRange(),attendance=reportData.attendance.filter(x=>inRange(x.date,a,b)),homework=reportData.homework;
 let days=[],start=new Date(a+'T12:00:00'),end=new Date(b+'T12:00:00');for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1))days.push(localDate(d));
 let scheduled=days.flatMap(date=>slots.filter(s=>s.day===new Date(date+'T12:00:00').getDay()).map(s=>({date,slot:s})));
 let teaching=scheduled.filter(x=>x.slot.type!=='กิจกรรม'),activities=scheduled.filter(x=>x.slot.type==='กิจกรรม');
 let attSet=new Set(attendance.map(x=>x.date+'|'+x.slotId));
 let recorded=teaching.filter(x=>attSet.has(x.date+'|'+x.slot.id)).length;
 let present=attendance.filter(x=>x.allPresent).length,leave=attendance.reduce((v,x)=>v+Number(x.leaveCount||0),0),sick=attendance.reduce((v,x)=>v+Number(x.sickCount||0),0),absent=attendance.reduce((v,x)=>v+Number(x.absentCount||0),0);
 let assigned=homework.filter(x=>inRange(x.assigned,a,b)),due=homework.filter(x=>inRange(x.due,a,b));
 const stat=(n,label)=>'<div class="stat"><strong>'+n+'</strong><span>'+label+'</span></div>';
 return pageTitle('รายงานและแดชบอร์ด','สรุปจากตารางสอนและข้อมูลที่บันทึกในอุปกรณ์นี้')
 +'<div class="pills">'+[['day','รายวัน'],['week','รายสัปดาห์'],['month','รายเดือน']].map(([k,v])=>'<button data-reportmode="'+k+'" class="'+(reportMode===k?'active':'')+'">'+v+'</button>').join('')+'</div>'
 +'<div class="field"><label>เลือกวันที่อ้างอิง</label><input id="reportAnchor" type="date" value="'+reportAnchor+'"><div class="muted">ช่วงรายงาน '+dateText(a)+' – '+dateText(b)+'</div></div>'
 +'<div class="section"><h2>ภาพรวมคาบเรียน</h2></div><div class="stats">'+stat(teaching.length,'คาบตามตาราง')+stat(recorded,'คาบที่เช็กชื่อแล้ว')+stat(teaching.length-recorded,'คาบยังไม่เช็กชื่อ')+'</div>'
 +'<div class="notice">จำนวนคาบเป็นรายการตามตาราง ไม่ใช่ยอดยืนยันการสอนจริง และยังไม่หักวันหยุดหรือสอนชดเชย</div>'
 +'<div class="section"><h2>การเข้าเรียน</h2></div><div class="stats">'+stat(present,'คาบที่มาครบ')+stat(leave,'ลากิจ (คน-ครั้ง)')+stat(sick,'ลาป่วย (คน-ครั้ง)')+'</div><div class="stats">'+stat(absent,'ขาด (คน-ครั้ง)')+stat(attendance.length,'รายการเช็กชื่อ')+stat(activities.length,'รายการกิจกรรม')+'</div>'
 +'<div class="section"><h2>การบ้าน</h2></div><div class="stats">'+stat(assigned.length,'งานที่สั่งในช่วงนี้')+stat(due.length,'งานครบกำหนดช่วงนี้')+stat(due.filter(x=>x.status!=='ปิดงาน').length,'กำหนดส่งที่ยังเปิด')+'</div>'
 +(due.length?due.slice().sort((x,y)=>x.due.localeCompare(y.due)).map(x=>'<div class="card panel"><strong>'+esc(displayGroup(x.room))+' · '+esc(x.title)+'</strong><div class="muted">ส่ง '+dateText(x.due)+' · '+esc(x.status)+'</div></div>').join(''):'<div class="empty">ไม่มีการบ้านครบกำหนดในช่วงที่เลือก</div>')
 +'<div class="section"><h2>สรุปรายวัน</h2></div>'
 +days.filter(date=>slots.some(s=>s.day===new Date(date+'T12:00:00').getDay())).map(date=>{
 const items=scheduled.filter(x=>x.date===date);let rec=attendance.filter(x=>x.date===date),work=homework.filter(x=>x.assigned===date),deadline=homework.filter(x=>x.due===date);
 return '<div class="card panel"><div class="strong">'+dateText(date)+' · '+items.filter(x=>x.slot.type!=='กิจกรรม').length+' คาบตามตาราง</div><div class="muted">วิชา: '+esc([...new Set(items.map(x=>x.slot.subject))].join(', ')||'—')+'</div><div class="muted">เช็กชื่อแล้ว '+rec.length+' รายการ · มาครบ '+rec.filter(x=>x.allPresent).length+' · ลากิจ '+rec.reduce((n,x)=>n+Number(x.leaveCount||0),0)+' · ลาป่วย '+rec.reduce((n,x)=>n+Number(x.sickCount||0),0)+' · ขาด '+rec.reduce((n,x)=>n+Number(x.absentCount||0),0)+'</div><div class="muted">สั่งการบ้าน '+work.length+' งาน · ถึงกำหนดส่ง '+deadline.length+' งาน</div></div>'
 }).join('')
 +'<button class="btn secondary full" data-reportcsv="1">ดาวน์โหลดรายงาน CSV</button>';
}
const baseReportRender=render;
render=function(){baseReportRender();if(page==='reports'){let m=document.querySelector('main.wrap');if(m)m.innerHTML=reportPage()}};
const baseReportRefresh=refresh;
refresh=async function(){if(db){reportData.attendance=await all('attendance_summary');reportData.homework=await all('assignments')}await baseReportRefresh()};
document.addEventListener('click',e=>{let b=e.target.closest('button');if(!b)return;if(b.dataset.reportmode){reportMode=b.dataset.reportmode;render()}if(b.dataset.reportcsv){let [a,z]=reportRange(),headers=['วันที่','ห้อง','คาบ','วิชา','เช็กชื่อ','มาครบ','ลากิจ','ลาป่วย','ขาด','การบ้านสั่ง','การบ้านกำหนดส่ง'];let lines=[headers];for(let d=new Date(a+'T12:00:00');d<=new Date(z+'T12:00:00');d.setDate(d.getDate()+1)){let day=localDate(d);for(let s of slots.filter(s=>s.day===d.getDay())){let r=reportData.attendance.find(x=>x.date===day&&x.slotId===s.id);lines.push([day,s.room,s.period,s.subject,r?'ใช่':'ไม่',r?.allPresent?'ใช่':'ไม่',r?.leaveCount||0,r?.sickCount||0,r?.absentCount||0,reportData.homework.filter(x=>x.assigned===day&&x.slotId===s.id).length,reportData.homework.filter(x=>x.due===day&&x.room===s.room).length])}}let q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';download('my-teacher-report-'+a+'-'+z+'.csv','\ufeff'+lines.map(row=>row.map(q).join(',')).join('\r\n'),'text/csv;charset=utf-8')}});
document.addEventListener('change',e=>{if(e.target.id==='reportAnchor'){reportAnchor=e.target.value;render()}});
