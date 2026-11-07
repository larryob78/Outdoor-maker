import {fit, safe, template, wrapText} from './formats.js';

export function canvas(w,h) {
  const c=document.createElement('canvas'); c.width=w; c.height=h; return c;
}

export function drawArt(c, f, l, assets, {guides=false, motion}={}) {
  const {w,h}=f, ctx=c.getContext('2d');
  ctx.setTransform(c.width/w,0,0,c.height/h,0,0);
  ctx.fillStyle=l.tone==='light'?'#fff':'#141414'; ctx.fillRect(0,0,w,h);
  ctx.imageSmoothingQuality='high';
  if (assets.art) {
    const {width:sw,height:sh}=assets.art;
    const r=fit(sw,sh,w,h,l.mode!=='fit',l.x,l.y,l.zoom);
    ctx.save();
    if (motion) {
      ctx.translate(w/2,h/2); ctx.scale(motion.zoom,motion.zoom); ctx.translate(-w/2,-h/2);
      ctx.globalAlpha=motion.opacity;
    }
    ctx.drawImage(assets.art,r.x,r.y,r.w,r.h);
    ctx.restore();
  } else {
    ctx.save();
    if (motion) ctx.globalAlpha=motion.opacity;
    const g=ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#101c2c');g.addColorStop(1,'#175a77');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#e5e34e';ctx.beginPath();
    ctx.arc(w*.72,h*.42,Math.min(w,h)*.3*(motion?.zoom??1),0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='700 '+Math.round(Math.min(w,h)*.14)+'px system-ui';
    if(l.mode!=='template'||!l.headline.trim()) ctx.fillText('YOUR IDEA',w*.08,h*.74,w*.84);
    ctx.restore();
  }
  const warnings=[];
  if (assets.art) {
    const r=fit(assets.art.width,assets.art.height,w,h,l.mode!=='fit',l.x,l.y,l.zoom);
    if (r.scale>1.001) warnings.push('Artwork is enlarged beyond its source pixels.');
  }
  if(l.mode==='template') {
    const {text,logo}=template(f,l);
    if(l.headline.trim()) {
      const pad=Math.min(w,h)*.024, maxW=text.w-pad*2, maxH=text.h-pad*2;
      let size=Math.floor(Math.min(w,h)*.15*l.textScale), lines;
      do {
        ctx.font='700 '+size+'px system-ui';
        lines=wrapText(l.headline.trim(),v=>ctx.measureText(v).width,maxW);
        if(lines.length*size*1.16<=maxH && lines.every(v=>ctx.measureText(v).width<=maxW)) break;
      } while(--size>1);
      if(size<Math.min(w,h)*.045) warnings.push('Headline may be hard to read at distance. Try fewer words.');
      ctx.fillStyle='#111';ctx.fillRect(text.x,text.y,text.w,lines.length*size*1.16+2*pad);
      ctx.fillStyle='#fff';ctx.textBaseline='top';
      lines.forEach((v,i)=>ctx.fillText(v,text.x+pad,text.y+pad+i*size*1.16));
      if(assets.logo && text.x<logo.x+logo.w && text.x+text.w>logo.x &&
        text.y<logo.y+logo.h && text.y+lines.length*size*1.16+2*pad>logo.y) warnings.push('Headline and logo zones overlap.');
    }
    if(assets.logo) {
      const r=fit(assets.logo.width,assets.logo.height,logo.w,logo.h,false,l.lx,l.ly);
      ctx.drawImage(assets.logo,logo.x+r.x,logo.y+r.y,r.w,r.h);
    }
  }
  if(guides) {
    const m=safe(f);
    ctx.setLineDash([m*.25,m*.15]);ctx.lineWidth=Math.max(1,m*.05);
    ctx.strokeStyle='#111';ctx.strokeRect(m,m,w-2*m,h-2*m);
    ctx.setLineDash([m*.25,m*.15]);ctx.lineDashOffset=m*.2;ctx.strokeStyle='#fff';
    ctx.strokeRect(m,m,w-2*m,h-2*m);ctx.setLineDash([]);ctx.lineDashOffset=0;
  }
  return warnings;
}
