
const $=selector=>document.querySelector(selector);
const rooms={cozy:{name:'Cozy Nook',price:1200},sunny:{name:'Sunny Suite',price:1800},garden:{name:'Garden Hangout',price:2600}};
const money=value=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
const todayParts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const today=`${todayParts.find(part=>part.type==='year').value}-${todayParts.find(part=>part.type==='month').value}-${todayParts.find(part=>part.type==='day').value}`;
const dateValue=(year,month,day)=>`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
const parse=value=>new Date(value+'T12:00:00');
const pretty=value=>parse(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const inField=$('#check-in'),outField=$('#check-out'),guests=$('#guest-count'),room=$('#room-choice'),form=$('#guest-form');
let month=new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,1),choosing='in',step='dates';
inField.min=outField.min=today;
const nights=()=>Math.round((Date.parse(outField.value+'T00:00:00Z')-Date.parse(inField.value+'T00:00:00Z'))/86400000);
function validateDates(){if(!inField.value||!outField.value)return 'Choose both check-in and check-out dates.';if(inField.value<today)return 'Check-in must be today or later.';if(nights()<1)return 'Check-out must be after check-in.';if(nights()>30)return 'Please choose a stay of 1–30 nights.';return '';}
function showStep(next,focus=true){step=next;document.querySelectorAll('[data-step]').forEach(el=>el.hidden=el.dataset.step!==next);$('.booking-redesign').dataset.activeStep=next;if(focus)$(`[data-step="${next}"] h3`).focus({preventScroll:true});}
function renderCalendar(){
  const container=$('#calendar-months');container.replaceChildren();
  $('#calendar-instruction').textContent=choosing==='in'?'Choose their check-in date.':'Choose their check-out date.';
  $('#previous-month').disabled=month.getFullYear()===Number(today.slice(0,4))&&month.getMonth()===Number(today.slice(5,7))-1;
  for(let offset=0;offset<2;offset++){
    const current=new Date(month.getFullYear(),month.getMonth()+offset,1),year=current.getFullYear(),m=current.getMonth();
    const panel=document.createElement('div');panel.className='calendar-month';const heading=document.createElement('h4');heading.textContent=current.toLocaleDateString('en-GB',{month:'long',year:'numeric'});panel.append(heading);
    const grid=document.createElement('div');grid.className='calendar-grid';
    for(const day of ['M','T','W','T','F','S','S']){const label=document.createElement('span');label.className='weekday';label.textContent=day;grid.append(label);}
    const leading=(current.getDay()+6)%7;for(let i=0;i<leading;i++)grid.append(document.createElement('span'));
    const days=new Date(year,m+1,0).getDate();
    for(let day=1;day<=days;day++){
      const value=dateValue(year,m,day),button=document.createElement('button');button.type='button';button.textContent=day;button.dataset.date=value;button.setAttribute('aria-label',pretty(value));button.disabled=value<today;
      const endpoint=value===inField.value||value===outField.value;button.setAttribute('aria-pressed',String(endpoint));
      if(endpoint)button.classList.add('selected-date');else if(inField.value&&outField.value&&value>inField.value&&value<outField.value)button.classList.add('in-range');
      if(value===today){button.classList.add('today');button.setAttribute('aria-current','date');}
      button.addEventListener('click',()=>{if(choosing==='in'){inField.value=value;if(outField.value<=value)outField.value='';choosing='out';}else if(value<=inField.value){inField.value=value;outField.value='';}else{outField.value=value;choosing='in';}$('#date-error').textContent=inField.value&&outField.value?validateDates():'';renderCalendar();const replacement=container.querySelector(`[data-date="${value}"]`);replacement?.focus({preventScroll:true});});
      button.addEventListener('keydown',event=>{const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(!(event.key in offsets))return;event.preventDefault();const target=parse(value);target.setDate(target.getDate()+offsets[event.key]);const next=dateValue(target.getFullYear(),target.getMonth(),target.getDate());if(next<today)return;let nextButton=container.querySelector(`[data-date="${next}"]`);if(!nextButton){month=new Date(target.getFullYear(),target.getMonth(),1);renderCalendar();nextButton=container.querySelector(`[data-date="${next}"]`);}nextButton?.focus();});grid.append(button);
    }panel.append(grid);container.append(panel);
  }
}
$('#previous-month').addEventListener('click',()=>{month.setMonth(month.getMonth()-1);renderCalendar();});$('#next-month').addEventListener('click',()=>{month.setMonth(month.getMonth()+1);renderCalendar();});
$('#clear-dates').addEventListener('click',()=>{inField.value=outField.value='';choosing='in';$('#date-error').textContent='';renderCalendar();});
for(const [field,mode] of [[inField,'in'],[outField,'out']]){field.addEventListener('focus',()=>{choosing=mode;renderCalendar();});field.addEventListener('change',()=>{if(field===inField&&outField.value<=inField.value)outField.value='';choosing=field===inField?'out':'in';if(field.value)month=new Date(parse(field.value).getFullYear(),parse(field.value).getMonth(),1);$('#date-error').textContent=inField.value&&outField.value?validateDates():'';renderCalendar();});}
function syncRoom(){const two=guests.value==='2';for(const option of room.options)option.disabled=two&&option.value!=='garden';if(two)room.value='garden';$('#sibling-label').hidden=!two;form.elements.sibling.required=two;form.elements.sibling.disabled=!two;$('#room-note').textContent=two?'Garden Hangout welcomes two dogs from the same household. One room rate covers both.':room.value==='cozy'?'For one small or medium dog. Choose a larger suite for dogs over 25 kg.':'For one dog, with plenty of room to settle in.';$('#room-total').textContent=money(rooms[room.value].price*nights());}
guests.addEventListener('change',syncRoom);room.addEventListener('change',syncRoom);
$('#date-form').addEventListener('submit',event=>{event.preventDefault();const problem=validateDates();$('#date-error').textContent=problem;if(problem)return;syncRoom();$('#availability-message').textContent=`Explore a sample stay for ${guests.value} ${guests.value==='1'?'dog':'dogs'} on your dates.`;$('#stay-dates').textContent=`${pretty(inField.value)} to ${pretty(outField.value)}`;$('#stay-length').textContent=`${nights()} ${nights()===1?'night':'nights'} · ${guests.value} ${guests.value==='1'?'dog':'dogs'}`;showStep('rooms');});
$('#add-details').addEventListener('click',()=>showStep('details'));
document.querySelectorAll('[data-back]').forEach(button=>button.addEventListener('click',()=>showStep(button.dataset.back)));
function reviewRow(label,value){const div=document.createElement('div');div.className='review-row';const key=document.createElement('span'),text=document.createElement('strong');key.textContent=label;text.textContent=value;div.append(key,text);$('#booking-review').append(div);}
form.addEventListener('submit',event=>{event.preventDefault();$('#guest-error').textContent='';for(const key of ['dogName','breed','owner',...(guests.value==='2'?['sibling']:[])]){if(!form.elements[key].value.trim()){$('#guest-error').textContent='Please complete the required details.';form.elements[key].focus();return;}}if(room.value==='cozy'&&form.elements.size.value==='large'){$('#guest-error').textContent='A large dog needs Sunny Suite or Garden Hangout. Go back to change their room.';return;}$('#booking-review').replaceChildren();$('#review-dog-name').textContent=form.elements.dogName.value.trim()+(guests.value==='2'?` & ${form.elements.sibling.value.trim()}`:'');reviewRow('Check in',pretty(inField.value));reviewRow('Check out',pretty(outField.value));reviewRow('Guests',`${guests.value} ${guests.value==='1'?'dog':'dogs'}`);reviewRow('Length of stay',`${nights()} ${nights()===1?'night':'nights'}`);$('#review-contact-name').textContent=form.elements.owner.value.trim();$('#review-contact-email').textContent=form.elements.email.value.trim();$('#review-consent').checked=false;$('#confirm-demo').disabled=true;$('#review-error').textContent='';showStep('review');});
$('#review-consent').addEventListener('change',event=>{$('#confirm-demo').disabled=!event.target.checked;});
$('#confirm-demo').addEventListener('click',()=>{if(!$('#review-consent').checked){$('#review-error').textContent='Please acknowledge the demo request before continuing.';return;}$('#booking-confirmation').textContent=`${form.elements.dogName.value.trim()}${guests.value==='2'?` and ${form.elements.sibling.value.trim()}`:''}: ${nights()} nights in ${rooms[room.value].name}, ${money(rooms[room.value].price*nights())}.`;showStep('complete');});
$('#start-again').addEventListener('click',()=>{form.reset();$('#date-form').reset();room.value='cozy';month=new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,1);choosing='in';$('#date-error').textContent=$('#guest-error').textContent='';$('#booking-review').replaceChildren();syncRoom();renderCalendar();showStep('dates');});
function openBooking(value){if(value){room.value=value;if(value!=='garden')guests.value='1';syncRoom();}showStep('dates',false);$('#booking').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});inField.focus({preventScroll:true});}
document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>openBooking()));document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>openBooking(button.dataset.room)));
$('#footer-year').textContent=new Date().getFullYear();renderCalendar();showStep('dates',false);
