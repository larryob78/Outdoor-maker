import {formats,defaultLayout} from './src/formats.js';
import {canvas,drawArt} from './src/art.js';
import {composite} from './src/perspective.js';
import {scenePresets,allPresets,illustrationPresets,photoQuad,initialScene} from './src/scenes.js';
import {motionAt,recordMotion,videoType} from './src/motion.js';
import {artwork,campaignZip,deck,download,framesZip,png} from './src/exports.js';
import {decode,loadImage,projectRecord} from './src/project.js';

const $=id=>document.getElementById(id);
const status=s=>$('status').textContent=s;
const each=(s,fn)=>document.querySelectorAll(s).forEach(fn);
const format=id=>formats.find(f=>f.id===id);
const options=(el,items)=>el.replaceChildren(...items.map(f=>new Option(f.name,f.id)));
const fresh=()=>({
  format:'6-sheet', layouts:Object.fromEntries(formats.map(f=>[f.id,{...defaultLayout}])),
  scene:scenePresets[0].id, scenes:Object.fromEntries([...allPresets,{id:'photo',quad:photoQuad,format:'6-sheet'}]
    .map(s=>[s.id,initialScene(s.quad,s.format)])),
  motion:{format:'digital-landscape',duration:6,zoom:1.15,fade:.6},
  files:{},guides:true
});
let state=fresh(), assets={}, time=1, raf=0, busy=false, paint=0, dirty=false;
const history=[], photos={}, layer=canvas(1,1);
const scene=()=>state.scenes[state.scene];
const current=()=>format(state.format);
const currentLayout=()=>state.layouts[state.format];
const snapshots=new WeakMap();
const checkpoint=()=>{
  history.push({state:structuredClone(state),assets:{...assets}});
  if(history.length>16) {
    const removed=history.shift();
    for(const [key,bitmap] of Object.entries(removed.assets)){
      if(assets[key]!==bitmap&&!history.some(h=>h.assets[key]===bitmap)) bitmap.close();
    }
  }
  $('undo').disabled=false;
};
const mark=()=>{if(!dirty) status('Unsaved changes. Save on this device to reopen them.');dirty=true;};
function change(fn){checkpoint();fn();mark();sync();}

function wireInputs(selector,get,refresh) {
  each(selector,el=>{
    el.addEventListener('input',()=>{
      if(busy) return;
      if(!snapshots.has(el)){checkpoint();snapshots.set(el,true);}
      const target=get(el), value=el.type==='range'?Number(el.value):el.value;
      target(value);mark();refresh();
    });
    const end=()=>snapshots.delete(el);
    el.addEventListener('change',end);el.addEventListener('blur',end);
  });
}
const previewSize=(c,w,h,max)=>{
  const s=Math.min(1,max/Math.max(w,h)), width=Math.round(w*s),height=Math.round(h*s);
  if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
};
function renderArt(){
  const f=current(),c=$('art-preview');
  previewSize(c,f.w,f.h,840);
  $('warnings').textContent=drawArt(c,f,currentLayout(),assets,{guides:state.guides}).join(' ');
  $('template-controls').hidden=currentLayout().mode!=='template';
  $('mode-note').textContent={
    fit:'Shows the whole source at the default zoom.',
    crop:'Fills the frame. Use position to choose what stays in view.',
    template:'Uses your headline and logo in adjustable safe zones. No AI generation.'
  }[currentLayout().mode];
}
function renderScene(){
  const id=state.scene, photo=id==='photo'?assets.photo:photos[id];
  if(!photo) return;
  const c=$('scene-preview'), g=$('scene-guides'), s=scene(),f=format(s.format);
  previewSize(c,photo.width,photo.height,1000);previewSize(g,photo.width,photo.height,1000);
  const art=canvas(Math.round(f.w*.5),Math.round(f.h*.5));
  drawArt(art,f,state.layouts[f.id],assets);
  const valid=composite(c,photo,art,{...s,layer});
  $('scene-warning').textContent=valid?'':'Corners must form a convex shape in clockwise order.';
  $('scene-png').disabled=!valid||busy;
  const ctx=g.getContext('2d');
  ctx.clearRect(0,0,g.width,g.height);
  if($('scene-tool').value==='-1')return;
  if(s.mask.length){
    ctx.beginPath();
    s.mask.forEach(([x,y],i)=>i?ctx.lineTo(x*g.width,y*g.height):ctx.moveTo(x*g.width,y*g.height));
    if(s.mask.length>=3) ctx.closePath();
    ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.setLineDash([5,5]);ctx.stroke();ctx.setLineDash([]);
    s.mask.forEach(([x,y])=>ctx.fillRect(x*g.width-3,y*g.height-3,6,6));
  }
  s.quad.forEach(([x,y],i)=>{
    ctx.fillStyle=$('scene-tool').value===String(i)?'#fff':'#000';
    ctx.beginPath();ctx.arc(x*g.width,y*g.height,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle=$('scene-tool').value===String(i)?'#000':'#fff';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(i+1),x*g.width,y*g.height);
  });
}
function schedule(){
  cancelAnimationFrame(paint);
  paint=requestAnimationFrame(()=>{renderArt();renderScene();renderMotion();});
}
function renderMotion(){
  const m=state.motion,f=format(m.format),c=$('motion-preview');
  previewSize(c,f.w,f.h,720);
  time=Math.min(time,m.duration);
  drawArt(c,f,state.layouts[f.id],assets,{motion:motionAt(time,m)});
  $('timeline').max=m.duration;$('timeline').value=time;
  $('duration-label').textContent=m.duration+' s';$('fade-label').textContent=m.fade.toFixed(1)+' s';
  $('zoom-label').textContent=Math.round(m.zoom*100)+'%';$('time-label').textContent=time.toFixed(2)+' s';
}
function stop(){cancelAnimationFrame(raf);raf=0;$('play').textContent='Play preview';}
function sync(){
  each('[data-format]',b=>b.setAttribute('aria-pressed',String(b.dataset.format===state.format)));
  each('[data-scene-id]',b=>{b.setAttribute('aria-pressed',String(b.dataset.sceneId===state.scene));if(b.dataset.sceneId==='photo')b.hidden=!assets.photo;});
  each('[data-layout]',el=>el.value=currentLayout()[el.dataset.layout]);
  each('[data-motion]',el=>el.value=state.motion[el.dataset.motion]);
  each('[data-scene]',el=>el.value=scene()[el.dataset.scene]);
  each('[data-corner]',el=>el.value=scene().quad[Number(el.dataset.corner)][Number(el.dataset.axis)]);
  $('dimensions').textContent=current().w+' × '+current().h+' PX / REVIEW SIZE';
  $('art-name').textContent=state.files.art?.name??'Demo artwork';
  $('logo-name').textContent=state.files.logo?.name??'No logo selected';
  $('photo-name').textContent=state.files.photo?.name??'';
  $('scene-kind').textContent=state.scene==='photo'?'YOUR UPLOADED PHOTO':state.scene.startsWith('photo-')?'AI-GENERATED PHOTO MOCKUP':'ILLUSTRATIVE SCENE';
  $('guides').checked=state.guides;$('scene-format').value=scene().format;$('motion-format').value=state.motion.format;
  $('undo').disabled=!history.length||busy;$('remove-logo').disabled=!assets.logo||busy;
  $('video').disabled=!videoType()||busy;
  $('video').textContent=videoType()?'Download video':'Video unavailable on this browser';
  schedule();
}
function pickers(id,items,key,select) {
  for(const item of items) {
    const b=document.createElement('button');b.type='button';b.dataset[key]=item.id;b.textContent=item.name;
    b.onclick=()=>change(()=>select(item.id));$(id).append(b);
  }
}
pickers('formats',formats,'format',v=>state.format=v);
const selectScene=v=>{state.scene=v;$('scene-tool').value='-1';};
pickers('scenes',[...scenePresets,{id:'photo',name:'Your photo'}],'sceneId',selectScene);
pickers('illustrations',illustrationPresets,'sceneId',selectScene);
options($('scene-format'),formats);options($('motion-format'),formats.filter(f=>f.digital));
for(const [index,name] of ['Top left','Top right','Bottom right','Bottom left'].entries()){
  for(const [axis,label] of ['horizontal','vertical'].entries()){
    const el=document.createElement('label');el.textContent=name+' '+label;
    const input=document.createElement('input');input.type='range';input.min=0;input.max=1;input.step=.001;
    input.dataset.corner=index;input.dataset.axis=axis;el.append(input);$('corners').append(el);
  }
}
wireInputs('[data-layout]',el=>v=>currentLayout()[el.dataset.layout]=v,schedule);
wireInputs('[data-scene]',el=>v=>scene()[el.dataset.scene]=v,schedule);
wireInputs('[data-corner]',el=>v=>scene().quad[Number(el.dataset.corner)][Number(el.dataset.axis)]=v,schedule);
wireInputs('[data-motion]',el=>v=>state.motion[el.dataset.motion]=v,()=>{stop();renderMotion();});
$('guides').onchange=()=>change(()=>state.guides=$('guides').checked);
$('scene-format').onchange=()=>change(()=>scene().format=$('scene-format').value);
$('motion-format').onchange=()=>change(()=>{stop();state.motion.format=$('motion-format').value;});
$('scene-tool').onchange=renderScene;
$('scene-guides').onclick=e=>{
  if(busy)return;
  const tool=$('scene-tool').value;
  if(tool==='-1'||(tool==='mask'&&scene().mask.length>=48))return;
  const r=e.currentTarget.getBoundingClientRect(),clamp=v=>Math.max(0,Math.min(1,v));
  const p=[clamp((e.clientX-r.left)/r.width),clamp((e.clientY-r.top)/r.height)];
  change(()=>{if(tool==='mask')scene().mask.push(p);else scene().quad[Number(tool)]=p;});
};
$('clear-mask').onclick=()=>change(()=>scene().mask=[]);
$('reset-placement').onclick=()=>change(()=>{
  const preset=allPresets.find(s=>s.id===state.scene);
  state.scenes[state.scene]=initialScene(structuredClone(preset?.quad??photoQuad),preset?.format??state.format);
});
$('timeline').oninput=()=>{stop();time=Number($('timeline').value);renderMotion();};
$('play').onclick=()=>{
  if(raf){stop();return;}
  const start=performance.now();
  time=0;$('play').textContent='Stop preview';
  const tick=now=>{
    time=Math.min(state.motion.duration,(now-start)/1000);renderMotion();
    if(time<state.motion.duration)raf=requestAnimationFrame(tick);else stop();
  };
  raf=requestAnimationFrame(tick);
};
$('undo').onclick=()=>{
  const last=history.pop();if(!last)return;
  for(const [key,bitmap] of Object.entries(assets))
    if(last.assets[key]!==bitmap&&!history.some(h=>h.assets[key]===bitmap))bitmap.close();
  state=last.state;assets=last.assets;stop();mark();sync();status('Change undone. Save to keep this version.');
};
$('remove-logo').onclick=()=>change(()=>{delete assets.logo;delete state.files.logo;});
function lock(active){
  busy=active;
  each('button,input,select,textarea',el=>el.disabled=active);
  if(!active)sync();
}
async function run(label,fn,done){
  if(busy)return;
  stop();lock(true);status(label);
  try{await fn();status(done);}
  catch(error){status(error.message||'Something went wrong. Please retry.');}
  finally{lock(false);}
}
for(const key of ['art','logo','photo']){
  const el=$(key+'-upload');
  el.onchange=()=>{
    const file=el.files?.[0];el.value='';if(!file)return;
    run('Opening image…',async()=>{
      const image=await decode(file);checkpoint();assets[key]=image;state.files[key]=file;
      if(key==='photo'){
        state.scene='photo';state.scenes.photo=initialScene(structuredClone(photoQuad),state.format);
        $('scene-tool').value='0';
      }
      mark();
    },'Image opened. Save on this device to reopen it.');
  };
}
$('save').onclick=()=>run('Saving on this device…',async()=>{await projectRecord('readwrite',state);dirty=false;},'Saved on this device.');
$('art-png').onclick=()=>run('Making PNG…',async()=>download(await png(artwork(current(),currentLayout(),assets)),state.format+'.png'),'Artwork PNG ready.');
function sceneCanvas(id,max=2400){
  const s=state.scenes[id],photo=id==='photo'?assets.photo:photos[id],f=format(s.format);
  if(!photo)throw new Error('Scene is still loading.');
  const c=canvas(1,1);previewSize(c,photo.width,photo.height,max);
  if(!composite(c,photo,artwork(f,state.layouts[f.id],assets),{...s,layer}))
    throw new Error('Fix the scene corners before exporting.');
  return c;
}
$('scene-png').onclick=()=>run('Making mockup…',async()=>download(await png(sceneCanvas(state.scene)),state.scene+'-mockup.png'),'Mockup PNG ready.');
$('zip').onclick=()=>run('Making six PNGs…',async()=>download(await campaignZip(formats,state.layouts,assets),'outdoor-artwork.zip'),'Artwork ZIP ready.');
$('pdf').onclick=()=>run('Building review deck…',async()=>{
  const pages=formats.map(f=>({title:f.name,note:f.w+' x '+f.h+' px artwork preset',render:()=>artwork(f,state.layouts[f.id],assets)}));
  for(const s of [...scenePresets,...(assets.photo?[{id:'photo',name:'Uploaded scene'}]:[])]){
    pages.push({title:s.name,note:s.id==='photo'?'Uploaded location photo':'AI-generated photographic mockup',render:()=>sceneCanvas(s.id,1200)});
  }
  download(await deck(pages),'outdoor-review.pdf');
},'PDF deck ready.');
$('video').onclick=()=>run('Recording video…',async()=>{
  const f=format(state.motion.format);
  const video=await recordMotion(f,state.layouts[f.id],assets,state.motion,p=>status('Recording video: '+Math.round(p*100)+'%'));
  download(video,f.id+(video.type.startsWith('video/mp4')?'.mp4':'.webm'));
},'Video ready.');
$('frames').onclick=()=>run('Rendering frames…',async()=>{
  const f=format(state.motion.format);
  download(await framesZip(f,state.layouts[f.id],assets,state.motion,p=>status('Rendering frames: '+Math.round(p*100)+'%')),f.id+'-frames.zip');
},'PNG frames ZIP ready.');
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
await run('Opening Outdoor Maker…',async()=>{
  await Promise.all(allPresets.map(async s=>photos[s.id]=await loadImage(import.meta.env.BASE_URL+'scenes/'+s.file)));
  const saved=await projectRecord('readonly');
  if(saved){
    const loaded={};
    try{for(const [key,file] of Object.entries(saved.files)) loaded[key]=await decode(file);}
    catch(error){Object.values(loaded).forEach(img=>img.close());throw error;}
    state={...saved,scenes:{...fresh().scenes,...saved.scenes}};assets=loaded;
    if(illustrationPresets.some(p=>p.id===state.scene)) $('legacy-scenes').open=true;
  }
},'Ready. Use the demo artwork or upload a campaign image.');
