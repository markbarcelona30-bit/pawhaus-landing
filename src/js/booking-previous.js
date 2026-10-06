const rooms={cozy:{name:'Cozy Nook',price:1200,photo:'cozy'},sunny:{name:'Sunny Suite',price:1800,photo:'sunny'},garden:{name:'Garden Hangout',price:2600,photo:'garden'}};
const form=document.querySelector('#booking-form');
const checkIn=document.querySelector('#check-in'),checkOut=document.querySelector('#check-out');
const error=document.querySelector('#booking-error');
const currency=value=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(value);
const localDate=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const today=localDate(new Date());checkIn.min=today;checkOut.min=today;
const dayNumber=value=>Date.parse(value+'T00:00:00Z')/86400000;
const prettyDate=value=>new Date(value+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
const selectedRoom=()=>form.elements.room.value;
function nights(){return checkIn.value&&checkOut.value?dayNumber(checkOut.value)-dayNumber(checkIn.value):0;}
function dateError(){if(checkIn.value&&checkIn.value<localDate(new Date()))return 'Choose a check-in date today or later.';if(checkIn.value&&checkOut.value){if(nights()<1)return 'Check-out must be at least one day after check-in.';if(nights()>30)return 'Please choose a stay of 30 nights or fewer for this demo.';}return '';}
function updateSummary(){
  const room=rooms[selectedRoom()],count=nights(),valid=count>=1&&count<=30&&!dateError();
  document.querySelector('#summary-room').textContent=room.name;
  const photo=document.querySelector('#summary-photo');photo.className=`photo photo-${room.photo}`;photo.setAttribute('aria-label',`${room.name} room preview`);
  document.querySelector('#summary-dates').textContent=valid?`${prettyDate(checkIn.value)} → ${prettyDate(checkOut.value)}`:'Choose valid dates to plan their stay.';
  document.querySelector('#summary-calculation').textContent=valid?`${currency(room.price)} × ${count} ${count===1?'night':'nights'}`:`${currency(room.price)} per night`;
  document.querySelector('#summary-subtotal').textContent=valid?currency(room.price*count):'—';
  document.querySelector('#summary-total').textContent=valid?currency(room.price*count):'—';
  const garden=selectedRoom()==='garden';document.querySelector('.second-dog-choice').hidden=!garden;
  const toggle=document.querySelector('#second-dog-toggle');if(!garden)toggle.checked=false;
  const second=garden&&toggle.checked;document.querySelector('#second-dog-fields').hidden=!second;
  for(const id of ['second-dog-name','second-dog-detail']){const field=document.getElementById(id);field.required=second;field.disabled=!second;}
  error.textContent=dateError();
}
checkIn.addEventListener('change',()=>{
  if(checkIn.value){const next=new Date(checkIn.value+'T12:00:00');next.setDate(next.getDate()+1);checkOut.min=localDate(next);if(checkOut.value&&checkOut.value<=checkIn.value)checkOut.value='';}
  updateSummary();
});
form.addEventListener('input',updateSummary);form.addEventListener('change',updateSummary);
document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#booking').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});checkIn.focus({preventScroll:true});}));
document.querySelectorAll('[data-room]').forEach(button=>button.addEventListener('click',()=>{form.querySelector(`input[name="room"][value="${button.dataset.room}"]`).checked=true;updateSummary();document.querySelector('#booking').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});checkIn.focus({preventScroll:true});}));
const dialog=document.querySelector('#review-dialog'),content=document.querySelector('#review-content'),confirm=document.querySelector('#confirm-booking'),edit=document.querySelector('#edit-booking');
let reviewed=null;
function line(label,value){const row=document.createElement('div');row.className='review-row';const key=document.createElement('span'),text=document.createElement('strong');key.textContent=label;text.textContent=value;row.append(key,text);content.append(row);}
form.addEventListener('submit',event=>{
  event.preventDefault();error.textContent='';
  if(dateError()){error.textContent=dateError();return;}
  if(!form.elements.dogName.value.trim()||!form.elements.breed.value.trim()){error.textContent="Please enter your dog's name and breed.";return;}
  if(selectedRoom()==='cozy'&&form.elements.size.value==='large'){error.textContent='For a large dog, choose Sunny Suite or Garden Hangout for more room.';form.querySelector('input[value="sunny"]').focus();return;}
  if(document.querySelector('#second-dog-toggle').checked&&(!form.elements.secondDogName.value.trim()||!form.elements.secondDogDetail.value.trim())){error.textContent="Please enter the second dog's name, breed, and age.";return;}
  const room=rooms[selectedRoom()];reviewed={room:room.name,dog:form.elements.dogName.value.trim(),count:nights(),total:room.price*nights()};
  content.replaceChildren();document.querySelector('#review-title').textContent='Their stay, at a glance.';
  line('Guest',reviewed.dog);line('Breed / age',`${form.elements.breed.value.trim()} · ${form.elements.age.value} years`);line('Size',form.elements.size.selectedOptions[0].textContent);
  if(document.querySelector('#second-dog-toggle').checked)line('Sibling',`${form.elements.secondDogName.value.trim()} · ${form.elements.secondDogDetail.value.trim()}`);
  line('Room',room.name);line('Check-in',prettyDate(checkIn.value));line('Check-out',prettyDate(checkOut.value));line('Stay',`${reviewed.count} ${reviewed.count===1?'night':'nights'}`);
  if(form.elements.notes.value.trim())line('Care notes',form.elements.notes.value.trim());
  line('Demo total',currency(reviewed.total));confirm.hidden=false;edit.textContent='Edit details';dialog.showModal();
});
confirm.addEventListener('click',()=>{if(!reviewed)return;document.querySelector('#review-title').textContent='One happy little plan.';content.replaceChildren();const message=document.createElement('p');message.textContent=`${reviewed.dog}'s sample stay in ${reviewed.room} is ready: ${reviewed.count} ${reviewed.count===1?'night':'nights'}, ${currency(reviewed.total)}. No real reservation was made and no payment was taken.`;content.append(message);confirm.hidden=true;edit.textContent='Plan another stay';});
edit.addEventListener('click',()=>dialog.close());document.querySelector('.close-review').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelector('#footer-year').textContent=new Date().getFullYear();updateSummary();
