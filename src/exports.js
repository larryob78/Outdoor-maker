import {zipSync,strToU8} from 'fflate';
import {canvas,drawArt} from './art.js';
import {motionAt} from './motion.js';

export const png=c=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed.')),'image/png'));
export function download(blob,name) {
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60_000);
}
export function artwork(f,layout,assets) {
  const c=canvas(f.w,f.h);drawArt(c,f,layout,assets);return c;
}
const bytes=async c=>new Uint8Array(await (await png(c)).arrayBuffer());
const zip=entries=>new Blob([zipSync(entries,{level:0})],{type:'application/zip'});

export async function campaignZip(formats, layouts, assets) {
  const entries={};
  for(const f of formats) entries[f.id+'.png']=await bytes(artwork(f,layouts[f.id],assets));
  entries['dimensions.txt']=strToU8(formats.map(f=>f.id+': '+f.w+' × '+f.h+' px').join('\n')+'\nReview files. Check vendor dimensions, bleed and colour before production.\n');
  return zip(entries);
}

export async function framesZip(f,l,assets,settings,progress) {
  const fps=6, scale=540/Math.min(f.w,f.h);
  const c=canvas(Math.round(f.w*scale),Math.round(f.h*scale));
  const entries={}, total=settings.duration*fps;
  for(let frame=0;frame<total;frame++){
    drawArt(c,f,l,assets,{motion:motionAt(frame/fps,settings)});
    entries['frame-'+String(frame).padStart(3,'0')+'.png']=await bytes(c);
    progress((frame+1)/total);
  }
  entries['README.txt']=strToU8(c.width+' × '+c.height+' px, '+fps+' frames per second, '+settings.duration+' seconds. Silent review sequence.\n');
  return zip(entries);
}

export async function deck(pages) {
  const {jsPDF}=await import('jspdf');
  const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:[960,540],compress:true});
  for(let i=0;i<pages.length;i++){
    const {title,note,render}=pages[i];
    if(i) pdf.addPage([960,540],'landscape');
    pdf.setFont('helvetica','bold');pdf.setFontSize(24);pdf.text(title,40,57);
    pdf.setFont('helvetica','normal');pdf.setFontSize(11);
    pdf.text(note,40,78);
    const c=render(), ratio=Math.min(880/c.width,398/c.height);
    const w=c.width*ratio,h=c.height*ratio;
    pdf.addImage(await bytes(c),'PNG',(960-w)/2,97+(398-h)/2,w,h,undefined,'FAST');
    pdf.text('NAPKIN OUTDOOR MAKER  /  CREATIVE REVIEW',40,518);
    pdf.text(String(i+1).padStart(2,'0'),920,518,{align:'right'});
  }
  return pdf.output('blob');
}
