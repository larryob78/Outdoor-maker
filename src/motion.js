import {canvas,drawArt} from './art.js';

export const smooth = p => {const t=Math.max(0,Math.min(1,p));return t*t*(3-2*t);};

export function motionAt(time,{duration,fade,zoom}) {
  const t=Math.max(0,Math.min(duration,time));
  return {zoom:1+(zoom-1)*smooth(t/duration),
    opacity:fade===0?1:Math.min(smooth(t/fade),smooth((duration-t)/fade))};
}

export function videoType() {
  if(!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return '';
  return ['video/mp4;codecs=avc1','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4']
    .find(v=>MediaRecorder.isTypeSupported(v)) ?? '';
}

export async function recordMotion(f,l,assets,settings,progress) {
  const type=videoType();
  if(!type) throw new Error('Video recording unavailable. Use PNG frames ZIP.');
  if(document.hidden) throw new Error('Keep this tab visible while recording.');
  const c=canvas(f.w,f.h);
  const draw=t=>drawArt(c,f,l,assets,{motion:motionAt(t,settings)});
  draw(0);
  const stream=c.captureStream(30);
  const chunks=[];
  let raf, recorder, visibility;
  try {
    recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:8_000_000});
    return await new Promise((resolve,reject)=>{
      recorder.ondataavailable=e=>{if(e.data.size) chunks.push(e.data);};
      recorder.onerror=()=>reject(new Error('Recording failed. Use PNG frames ZIP.'));
      recorder.onstop=()=>{
        const blob=new Blob(chunks,{type:recorder.mimeType||type});
        if(!blob.size) reject(new Error('Recording was empty. Use PNG frames ZIP.'));
        else resolve(blob);
      };
      visibility=()=>{if(document.hidden) reject(new Error('Recording stopped when the tab was hidden. Try again or use PNG frames ZIP.'));};
      document.addEventListener('visibilitychange',visibility);
      recorder.start();
      const start=performance.now();
      function tick(now) {
        const time=Math.min(settings.duration,(now-start)/1000);
        try {
          draw(time);progress(time/settings.duration);
          if(time<settings.duration) raf=requestAnimationFrame(tick);
          else recorder.stop();
        } catch(error){reject(error);}
      }
      raf=requestAnimationFrame(tick);
    });
  } finally {
    cancelAnimationFrame(raf);
    if(visibility) document.removeEventListener('visibilitychange',visibility);
    if(recorder && recorder.state!=='inactive') recorder.stop();
    stream.getTracks().forEach(t=>t.stop());
  }
}
