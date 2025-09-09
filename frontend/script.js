const canvas = document.getElementById('network');
const ctx = canvas.getContext('2d');
let W, H;
function resize(){W=canvas.width=innerWidth; H=canvas.height=innerHeight}
window.addEventListener('resize', resize); resize();

const nodes = [];
for(let i=0;i<60;i++){
  nodes.push({
    x: Math.random()*W,
    y: Math.random()*H,
    vx: (Math.random()-0.5)*0.25,
    vy: (Math.random()-0.5)*0.25,
    r: 1 + Math.random()*1.6
  });
}
function drawNetwork(){
  ctx.clearRect(0,0,W,H);
  // draw lines close nodes
  for(let i=0;i<nodes.length;i++){
    const a = nodes[i];
    for(let j=i+1;j<nodes.length;j++){
      const b = nodes[j];
      const dx = a.x-b.x, dy = a.y-b.y, d = Math.hypot(dx,dy);
      if(d < 160){
        ctx.strokeStyle = 'rgba(180,220,255,' + (1 - d/160)*0.08 + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }
    }
  }
  // draw dots
  for(let p of nodes){
    p.x += p.vx; p.y += p.vy;
    if(p.x < -20) p.x = W + 20; if(p.x > W + 20) p.x = -20;
    if(p.y < -20) p.y = H + 20; if(p.y > H + 20) p.y = -20;
    ctx.fillStyle = 'rgba(180,220,255,0.06)';
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  }
  requestAnimationFrame(drawNetwork);
}
drawNetwork();

/* ----------------- stats animate ----------------- */
function animateNumber(el, to, ms=1300){
  const start = performance.now();
  (function step(t){
    const p = Math.min(1,(t-start)/ms);
    el.textContent = Math.round(p*to).toLocaleString();
    if(p<1) requestAnimationFrame(step);
  })(start);
}
animateNumber(document.getElementById('statAcc'), 96);
animateNumber(document.getElementById('statImgs'), 50231);
animateNumber(document.getElementById('statUsers'), 10392);

/* ----------------- upload & preview ----------------- */
const drop = document.getElementById('drop');
const fileInput = document.getElementById('file');
const preview = document.getElementById('preview');
const meta = document.getElementById('meta');
const resEl = document.getElementById('res');
const sizeEl = document.getElementById('size');
const analyzeBtn = document.getElementById('analyze');
const clearBtn = document.getElementById('clear');
const downloadBtn = document.getElementById('download');

drop.addEventListener('click', ()=> fileInput.click());
drop.addEventListener('dragover', e=> { e.preventDefault(); drop.classList.add('drag'); });
drop.addEventListener('dragleave', ()=> drop.classList.remove('drag'));
drop.addEventListener('drop', e=> { e.preventDefault(); drop.classList.remove('drag'); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', e=> { if(e.target.files[0]) handleFile(e.target.files[0]) });

let currentFile = null;
function handleFile(f){
  if(!f.type.startsWith('image/')) { alert('Select an image file'); return; }
  currentFile = f;
  preview.src = URL.createObjectURL(f);
  preview.classList.remove('hidden');
  preview.onload = ()=> { resEl.textContent = preview.naturalWidth + '×' + preview.naturalHeight; }
  sizeEl.textContent = (f.size/1024/1024).toFixed(2) + ' MB';
  meta.classList.remove('hidden');
  analyzeBtn.disabled = false;
  clearBtn.disabled = false;
  downloadBtn.disabled = true;
}

/* ----------------- simulated pipeline ----------------- */
const p1 = document.getElementById('p1'), p2 = document.getElementById('p2'), p3 = document.getElementById('p3');
const s1 = document.getElementById('s1'), s2 = document.getElementById('s2'), s3 = document.getElementById('s3');

const DISEASES = [
  {
    name: 'Healthy Paddy',
    severity: 'Low',
    tips: [
      'Maintain proper spacing between plants',
      'Ensure balanced irrigation',
      'Provide sufficient sunlight and nutrients'
    ],
    treat: 'No treatment required. Keep monitoring the crop.'
  },
  {
    name: 'Brown Spot',
    severity: 'Medium',
    tips: [
      'Use resistant varieties if available',
      'Avoid excess nitrogen fertilizer',
      'Maintain good field sanitation'
    ],
    treat: 'Apply fungicides like Mancozeb or Carbendazim as recommended.'
  },
  {
    name: 'Bacterial Leaf Blight',
    severity: 'High',
    tips: [
      'Avoid water stagnation in fields',
      'Disinfect seeds before sowing',
      'Ensure proper drainage and avoid over-irrigation'
    ],
    treat: 'Use copper-based bactericides and remove heavily infected plants.'
  },
  {
    name: 'Rice Blast',
    severity: 'High',
    tips: [
      'Use balanced fertilizer (avoid too much nitrogen)',
      'Grow resistant varieties',
      'Maintain field hygiene and crop rotation'
    ],
    treat: 'Spray tricyclazole or isoprothiolane fungicides as per guidelines.'
  },
  {
    name: 'Hispa',
    severity: 'Medium',
    tips: [
      'Remove damaged leaves early',
      'Avoid overuse of nitrogen fertilizers',
      'Encourage natural predators in the field'
    ],
    treat: 'Apply recommended insecticides like Chlorpyriphos if infestation is severe.'
  }
];


async function step(barEl, stateEl, text, ms, target=100){
  stateEl.textContent = text;
  return new Promise(res=>{
    const start = performance.now();
    function anim(t){
      const p = Math.min(1,(t-start)/ms);
      barEl.style.width = Math.round(p*target) + '%';
      if(p<1) requestAnimationFrame(anim); else { stateEl.textContent = 'done'; res(); }
    }
    requestAnimationFrame(anim);
  });
}

function inferenceSim(){
  return new Promise(r=>{
    setTimeout(()=>{
      const obj = DISEASES[Math.floor(Math.random()*DISEASES.length)];
      const conf = Math.floor(74 + Math.random()*22);
      r({label: obj.name, conf, obj});
    }, 800);
  });
}

analyzeBtn.addEventListener('click', async ()=>{
  if(!currentFile){ alert('Please upload an image first'); return; }
  analyzeBtn.disabled = true;
  clearBtn.disabled = true;

  // reset UI
  [p1,p2,p3].forEach(x=>x.style.width='0%');
  [s1,s2,s3].forEach(x=>x.textContent='pending');

  await step(p1,s1,'loading model',700,100);
  await step(p2,s2,'preprocessing',900,100);
  const r = await inferenceSim();
  await step(p3,s3,'inference',1100, r.conf);

  showResult(r);
  analyzeBtn.disabled = false;
  clearBtn.disabled = false;
  downloadBtn.disabled = false;
});

function showResult(r){
  document.getElementById('resLabel').textContent = r.label;
  document.getElementById('resConf').textContent = r.conf + '%';
  document.getElementById('confBar').style.width = (r.conf || 80) + '%';
  document.getElementById('resSev').textContent = r.obj.severity;
  document.getElementById('resTreat').textContent = r.obj.treat;
  document.getElementById('resPrev').innerHTML = '<ul style="margin:6px 0 0 18px">'+ r.obj.tips.map(t=>`<li>${t}</li>`).join('') +'</ul>';
  drawGauge(r.conf || 80);
  drawBars(r.label);
  window._lastResult = { timestamp: new Date().toISOString(), label: r.label, confidence: r.conf, severity: r.obj.severity, treatment: r.obj.treat, prevention: r.obj.tips };
}

/* clear/reset */
clearBtn.addEventListener('click', ()=>{
  currentFile = null; preview.classList.add('hidden'); meta.classList.add('hidden');
  [p1,p2,p3].forEach(x=>x.style.width='0%'); [s1,s2,s3].forEach(x=>x.textContent='pending');
  document.getElementById('resLabel').textContent='—'; document.getElementById('resConf').textContent='—';
  document.getElementById('confBar').style.width='0%'; document.getElementById('resSev').textContent='—';
  document.getElementById('resTreat').textContent='—'; document.getElementById('resPrev').textContent='—';
  analyzeBtn.disabled = true; clearBtn.disabled = true; downloadBtn.disabled = true;
});

/* download JSON report */
downloadBtn.addEventListener('click', ()=>{
  const r = window._lastResult;
  if(!r) return alert('No result to download');
  const fn = 'plantdoc_report_' + (new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')) + '.json';
  const blob = new Blob([JSON.stringify(r,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fn; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

/* demo buttons */
document.querySelectorAll('[data-demo]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const mode = btn.dataset.demo;
    let demoObj;
    if(mode==='healthy') demoObj = {label:'Healthy Plant', conf:95, obj:DISEASES[0]};
    else demoObj = {label:'Bacterial Blight', conf:78, obj:DISEASES[2]};
    // simulate pipeline with given result
    (async ()=>{
      analyzeBtn.disabled = true; clearBtn.disabled = true;
      [p1,p2,p3].forEach(x=>x.style.width='0%'); [s1,s2,s3].forEach(x=>x.textContent='pending');
      await step(p1,s1,'loading model',500,100);
      await step(p2,s2,'preprocessing',700,100);
      await step(p3,s3,'inference',900,demoObj.conf);
      showResult(demoObj);
      analyzeBtn.disabled = false; clearBtn.disabled = false; downloadBtn.disabled = false;
    })();
  });
});

/* gauge & bars draw */
const g = document.getElementById('gauge').getContext('2d');
const b = document.getElementById('bars').getContext('2d');
function drawGauge(val=80){
  const cw = g.canvas.width, ch = g.canvas.height;
  g.clearRect(0,0,cw,ch);
  const cx = cw/2, cy = ch-10, r = Math.min(cw, ch*2)/2 - 20;
  g.lineWidth = 16; g.strokeStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(cx,cy,r,Math.PI,0); g.stroke();
  const ang = Math.PI + (Math.PI)*(val/100);
  const grd = g.createLinearGradient(0,0,cw,0); grd.addColorStop(0,getComputedStyle(document.documentElement).getPropertyValue('--accent')); grd.addColorStop(1,getComputedStyle(document.documentElement).getPropertyValue('--accent2'));
  g.strokeStyle = grd; g.beginPath(); g.arc(cx,cy,r,Math.PI,ang); g.stroke();
  const nx = cx + (r-8)*Math.cos(ang), ny = cy + (r-8)*Math.sin(ang);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(nx,ny,5,0,Math.PI*2); g.fill();
  g.font = '700 22px Inter'; g.fillStyle = '#eaf6ff'; g.textAlign='center'; g.fillText(val + '%', cx, cy-22);
  g.font = '600 12px Inter'; g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillText('Confidence', cx, cy+6);
}
function drawBars(label='Healthy Plant'){
  const classes = ['Healthy Paddy','Brown Spot','Bacterial LB','Rice Blast','Hispa'];
  const cw = b.canvas.width, ch = b.canvas.height, pad = 36;
  b.clearRect(0,0,cw,ch);
  const idx = classes.findIndex(c => label.toLowerCase().includes(c.split(' ')[0].toLowerCase()));
  const vals = classes.map((_,i) => i===idx ? Math.max(60, 60 + Math.floor(Math.random()*30)) : Math.floor(5 + Math.random()*30));
  const max = Math.max(...vals), w = (cw - pad*2)/vals.length - 14;
  const grd = b.createLinearGradient(0,0,cw,0); grd.addColorStop(0,getComputedStyle(document.documentElement).getPropertyValue('--accent')); grd.addColorStop(1,getComputedStyle(document.documentElement).getPropertyValue('--accent2'));
  b.font = '600 12px Inter'; b.textAlign='center';
  vals.forEach((v,i)=>{
    const h = (ch - 48)*(v/max), x = pad + i*(w+14), y = ch - 28 - h;
    b.fillStyle = 'rgba(255,255,255,0.06)'; b.fillRect(x, ch-28-(ch-48), w, ch-48);
    b.fillStyle = grd; b.fillRect(x, y, w, h);
    b.fillStyle = 'rgba(255,255,255,0.9)'; b.fillText(v + '%', x + w/2, y-8);
    b.fillStyle = 'rgba(255,255,255,0.6)'; b.fillText(classes[i], x + w/2, ch-8);
  });
}

/* initial placeholder visuals */
drawGauge(78); drawBars('Healthy Plant');

/* ----------------- language switch (hero text) ----------------- */
const lang = document.getElementById('lang');
const heroTitle = document.getElementById('heroTitle');
const heroLead = document.getElementById('heroLead');
const i18n = {
  en: ['Detect Plant Diseases with <span class="highlight">Pixel-Perfect</span> Precision','Upload a leaf photo, run the model, and get a clean diagnosis with confidence score, treatment and prevention — all in a slick interactive UI.'],
  hi: ['AI से पौधों की बीमारियों का पता लगाएं','पत्ते की फोटो अपलोड करें और तुरंत निदान और उपचार सुझाव प्राप्त करें।'],
  kn: ['AI ನಿಖರತೆಯೊಂದಿಗೆ ಸಸ್ಯ ರೋಗಗಳನ್ನು ಪತ್ತೆಹಚ್ಚಿ','ಎಲೆ ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ತ್ವರಿತವಾಗಿ ಫಲಿತಾಂಶ ಪಡೆಯಿರಿ.'],
  ta: ['AI துல்லியத்துடன் தாவர நோய்களை கண்டறியவும்','இலைப் புகைப்படத்தை பதிவேற்று உடனடி முடிவுகளைப் பெறுங்கள்.']
}
lang.addEventListener('change', ()=>{
  const v = lang.value; heroTitle.innerHTML = i18n[v][0]; heroLead.textContent = i18n[v][1];
});

/* ----------------- theme color dots -------------- */
document.querySelectorAll('.color-dot').forEach(dot=>{
  dot.addEventListener('click', ()=>{
    const t = dot.getAttribute('data-theme');
    if(t==='a'){ document.documentElement.style.setProperty('--accent','#22d3ee'); document.documentElement.style.setProperty('--accent2','#34d399'); }
    if(t==='b'){ document.documentElement.style.setProperty('--accent','#34d399'); document.documentElement.style.setProperty('--accent2','#f59e0b'); }
    if(t==='c'){ document.documentElement.style.setProperty('--accent','#a78bfa'); document.documentElement.style.setProperty('--accent2','#22d3ee'); }
    // redraw visuals to pick up new CSS variables
    drawGauge( parseInt(document.getElementById('resConf').textContent) || 78 );
    drawBars(document.getElementById('resLabel').textContent || 'Healthy Plant');
  });
});

/* keyboard & accessibility */
drop.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') file.click() });
document.getElementById('startBtn').addEventListener('click', ()=> document.getElementById('drop').scrollIntoView({behavior:'smooth', block:'center'}));
document.getElementById('watchDemo').addEventListener('click', ()=> document.getElementById('features').scrollIntoView({behavior:'smooth'}));

/* small: wire demo start buttons in features section */
document.querySelectorAll('[data-demo]').forEach(b=> b.addEventListener('click', ()=> b.click())); // placeholder if any