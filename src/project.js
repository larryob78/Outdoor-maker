// One project record, including original image blobs, committed in a single transaction.
export async function projectRecord(mode, value) {
  const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('napkin-outdoor',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('projects');
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    req.onblocked=()=>reject(new Error('Close other Outdoor Maker tabs and retry.'));
  });
  try {
    return await new Promise((resolve,reject)=>{
      const tx=db.transaction('projects',mode), store=tx.objectStore('projects');
      const req=mode==='readonly'?store.get('current'):store.put(value,'current');
      tx.oncomplete=()=>resolve(req.result);
      tx.onabort=()=>reject(tx.error);
      tx.onerror=()=>reject(tx.error);
    });
  } finally { db.close(); }
}

export async function decode(blob) {
  if(!blob || blob.size>30*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(blob.type))
    throw new Error('Choose a JPEG, PNG or WebP image up to 30 MB.');
  let img;
  try {img=await createImageBitmap(blob);}
  catch {throw new Error('This image could not be opened. Try a different file.');}
  if(img.width*img.height>50_000_000) {img.close();throw new Error('Choose an image under 50 megapixels.');}
  return img;
}

export function loadImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Scene could not load.'));
    image.src=url;
  });
}
