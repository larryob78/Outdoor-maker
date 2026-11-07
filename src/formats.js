export const formats = [
  ['6-sheet', '6-sheet portrait', 600, 900],
  ['48-sheet', '48-sheet landscape', 1200, 600],
  ['96-sheet', '96-sheet wide', 1500, 500],
  ['bus-side', 'Bus-side panel', 1200, 420],
  ['digital-portrait', 'Digital portrait', 1080, 1920, true],
  ['digital-landscape', 'Digital landscape', 1920, 1080, true],
].map(([id, name, w, h, digital = false]) => ({id, name, w, h, digital}));

export function fit(sw, sh, w, h, cover, x = .5, y = .5, zoom = 1) {
  const scale = (cover ? Math.max : Math.min)(w/sw, h/sh) * zoom;
  const dw = sw*scale, dh = sh*scale;
  return { x:(w-dw)*x, y:(h-dh)*y, w:dw, h:dh, scale };
}

export const safe = ({w,h}) => Math.round(Math.min(w,h)*.07);
export const defaultLayout = {mode:'fit', x:.5, y:.5, zoom:1, headline:'', tx:0, ty:1, lx:1, ly:0, textScale:1, logoScale:1, tone:'dark'};
export function template({w,h}, layout) {
  const m = safe({w,h}), portrait = h>w;
  const textW = (w-2*m)*(portrait ? 1 : .57);
  const textH = (h-2*m)*(portrait ? .32 : .55);
  const logoW = (w-2*m)*(portrait ? .32 : .22)*layout.logoScale;
  const logoH = (h-2*m)*.19*layout.logoScale;
  return {
    text:{x:m+(w-2*m-textW)*layout.tx,y:m+(h-2*m-textH)*layout.ty,w:textW,h:textH},
    logo:{x:m+(w-2*m-logoW)*layout.lx,y:m+(h-2*m-logoH)*layout.ly,w:logoW,h:logoH},
  };
}

export function wrapText(value, measure, maxWidth) {
  const lines=[];
  for (const paragraph of value.split('\n')) {
    let line='';
    for (const word of paragraph.trim().split(/\s+/u)) {
      if (line && measure(line+' '+word)>maxWidth) { lines.push(line); line=''; }
      if (line) { line+=' '+word; continue; }
      for (const character of word) {
        if (line && measure(line+character)>maxWidth) {lines.push(line); line='';}
        line+=character;
      }
    }
    lines.push(line);
  }
  return lines;
}
