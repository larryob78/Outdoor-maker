// Closed-form projective transform of a unit square onto four ordered points.
export function projector(q) {
  if(q.length!==4 || q.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))) return null;
  for(let i=0;i<4;i++){
    const [a,b,c]=[q[i],q[(i+1)%4],q[(i+2)%4]];
    if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<=1e-6) return null;
  }
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=q;
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3;
  const dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
  const det=dx1*dy2-dx2*dy1;
  const g=(dx3*dy2-dx2*dy3)/det, h=(dx1*dy3-dx3*dy1)/det;
  return (u,v)=>{
    const z=1+g*u+h*v;
    return [(x0+(x1-x0+g*x1)*u+(x3-x0+h*x3)*v)/z,
            (y0+(y1-y0+g*y1)*u+(y3-y0+h*y3)*v)/z];
  };
}

function path(ctx, points) {
  ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();
}

export function composite(c, photo, art, scene) {
  const ctx=c.getContext('2d');
  ctx.resetTransform();ctx.clearRect(0,0,c.width,c.height);
  ctx.drawImage(photo,0,0,c.width,c.height);
  const q=scene.quad.map(([x,y])=>[x*c.width,y*c.height]);
  const project=projector(q);
  if(!project) return false;
  ctx.save();
  // Clip the perimeter and any foreground cutout together, keeping the original photo underneath.
  path(ctx,q);
  if(scene.mask.length>=3) {
    // Intersect the cutout with the placement even when its vertices extend beyond it.
    ctx.clip();
    path(ctx,[[0,0],[c.width,0],[c.width,c.height],[0,c.height]]);
    scene.mask.forEach(([x,y],i)=>i?ctx.lineTo(x*c.width,y*c.height):ctx.moveTo(x*c.width,y*c.height));
    ctx.closePath();
  }
  ctx.clip('evenodd');
  // Mesh on its own layer so seams can overlap without accumulating scene opacity.
  const layer=scene.layer ?? document.createElement('canvas');
  if(layer.width!==c.width||layer.height!==c.height) {layer.width=c.width;layer.height=c.height;}
  const mesh=layer.getContext('2d');
  mesh.clearRect(0,0,layer.width,layer.height);mesh.imageSmoothingQuality='high';
  const n=18, sw=art.width/n, sh=art.height/n;
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){
    const p=project(i/n,j/n), r=project((i+1)/n,j/n);
    const s=project(i/n,(j+1)/n), t=project((i+1)/n,(j+1)/n);
    triangle(p,r,s,i*sw,j*sh,sw,sh);
    triangle(t,s,r,(i+1)*sw,(j+1)*sh,-sw,-sh);
  }
  ctx.globalAlpha=scene.opacity;
  ctx.filter=scene.brightness===1?'none':'brightness('+scene.brightness+')';
  ctx.drawImage(layer,0,0);
  ctx.restore();
  return true;

  function triangle(a,b,d,x,y,w,h){
    const [ax,ay]=a, sx=(b[0]-ax)/w, sy=(b[1]-ay)/w;
    const tx=(d[0]-ax)/h,ty=(d[1]-ay)/h;
    mesh.save();
    const cx=(ax+b[0]+d[0])/3,cy=(ay+b[1]+d[1])/3;
    path(mesh,[a,b,d].map(([px,py])=>{
      const dx=px-cx,dy=py-cy, k=.85/(Math.hypot(dx,dy)||1);
      return [px+dx*k,py+dy*k];
    }));
    mesh.clip();mesh.setTransform(sx,sy,tx,ty,ax-sx*x-tx*y,ay-sy*x-ty*y);
    mesh.drawImage(art,0,0);mesh.restore();
  }
}
