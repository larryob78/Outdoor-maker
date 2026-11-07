import {test,expect,devices} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {unzipSync} from 'fflate';
import {formats} from '../src/formats.js';
const size=bytes=>[new DataView(bytes.buffer,bytes.byteOffset).getUint32(16),new DataView(bytes.buffer,bytes.byteOffset).getUint32(20)];
const download=async(page,button,info)=>{
  const result=page.waitForEvent('download');
  await page.getByRole('button',{name:button,exact:true}).click();
  const file=await result, name=file.suggestedFilename(),path=info.outputPath(name);
  await file.saveAs(path);return {name,bytes:await readFile(path)};
};
const ready=async page=>{
  await expect(page.getByRole('status')).toContainText('Ready.');
  await expect(page.locator('#scene-preview')).toHaveAttribute('width','1000');
};
async function image(page,selector,color,name,w=800,h=560){
  const b64=await page.evaluate(({color,w,h})=>{
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');
    ctx.fillStyle=color;ctx.fillRect(0,0,w,h);return c.toDataURL().split(',')[1];
  },{color,w,h});
  await page.locator(selector).setInputFiles({name,mimeType:'image/png',buffer:Buffer.from(b64,'base64')});
  await expect(page.getByRole('status')).toContainText('Image opened.');
}
test('desktop: upload, edit, save and reopen; export PNGs, composite, PDF and motion',async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await ready(page);
  const shot=async(name,label)=>{
    if(process.env.OUTDOOR_SCREENSHOTS)await page.locator('section[aria-labelledby="'+label+'"]').screenshot({path:'docs/screenshots/'+name+'.jpg',type:'jpeg',quality:87});
  };
  await shot('editor','format-title');
  for(const [name,shotName,id] of [['Street poster','scene','photo-street'],['Roadside billboard','roadside','photo-road'],['Retail digital screen','retail','photo-retail']]){
    await page.locator('#scenes').getByRole('button',{name,exact:true}).click();
    await expect(page.locator('#scene-kind')).toHaveText('AI-GENERATED PHOTO MOCKUP');
    await expect(page.locator('#scene-png')).toBeEnabled();
    const mock=await download(page,'Download mockup PNG',info);
    expect(mock.name).toBe(id+'-mockup.png');
    expect(size(mock.bytes)).toEqual([1536,1024]);
    await shot(shotName,'scene-title');
  }
  await image(page,'#art-upload','#e22a55','campaign.png');
  await page.getByRole('combobox',{name:'Layout',exact:true}).selectOption('template');
  await page.getByLabel('Headline',{exact:true}).fill('Make the city look up.');
  await image(page,'#logo-upload','#fcde35','lockup.png',96,40);
  await page.getByRole('button',{name:'Save on this device'}).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device.');
  await page.reload();await ready(page);
  await expect(page.getByLabel('Headline',{exact:true})).toHaveValue('Make the city look up.');
  await expect(page.locator('#logo-name')).toHaveText('lockup.png');
  await expect(page.locator('#art-name')).toHaveText('campaign.png');
  expect(size((await download(page,'Download artwork PNG',info)).bytes)).toEqual([600,900]);
  const entries=unzipSync((await download(page,'Download all artwork ZIP',info)).bytes);
  for(const f of formats)expect(size(entries[f.id+'.png'])).toEqual([f.w,f.h]);
  await image(page,'#photo-upload','#113355','location.png');
  await page.getByRole('combobox',{name:'Click on the photo to'}).selectOption('mask');
  const surface=page.locator('#scene-guides');
  await surface.scrollIntoViewIfNeeded();
  const box=await surface.boundingBox();
  for(const [x,y] of [[.4,.4],[.6,.4],[.6,.6],[.4,.6]])
    await surface.click({position:{x:box.width*x,y:box.height*y}});
  await page.waitForFunction(()=>{
    const c=document.getElementById('scene-preview'),ctx=c.getContext('2d');
    const at=(x,y)=>Array.from(ctx.getImageData(c.width*x,c.height*y,1,1).data).slice(0,3).join();
    return at(.5,.5)==='17,51,85'&&at(.3,.5)==='226,42,85'&&at(.1,.5)==='17,51,85';
  });
  await page.getByRole('button',{name:'Clear mask'}).click();
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  expect(size((await download(page,'Download mockup PNG',info)).bytes)).toEqual([800,560]);
  const pdf=(await download(page,'Download PDF deck',info)).bytes.toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf).toMatch(/\/Count 10\b/);
  const frames=unzipSync((await download(page,'Download PNG frames ZIP',info)).bytes);
  expect(Object.keys(frames).filter(x=>x.endsWith('.png'))).toHaveLength(36);
  expect(size(frames['frame-000.png'])).toEqual([960,540]);
  expect(Buffer.from(frames['frame-000.png']).equals(Buffer.from(frames['frame-010.png']))).toBe(false);
  if(await page.getByRole('button',{name:'Download video',exact:true}).count()){
    const video=await download(page,'Download video',info);
    expect(video.name).toMatch(/\.(mp4|webm)$/);
    expect(video.bytes.length).toBeGreaterThan(5000);
    const metadata=await page.evaluate(async({payload,mp4})=>{
      const data=Uint8Array.from(atob(payload),c=>c.charCodeAt(0));
      const url=URL.createObjectURL(new Blob([data],{type:mp4?'video/mp4':'video/webm'}));
      try{
        const video=document.createElement('video');
        await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error('Video could not decode'));video.src=url;});
        return [video.videoWidth,video.videoHeight];
      } finally {URL.revokeObjectURL(url);}
    },{payload:video.bytes.toString('base64'),mp4:video.name.endsWith('.mp4')});
    expect(metadata).toEqual([1920,1080]);
  }
  expect(errors).toEqual([]);
});
test.describe('phone-sized touch workflow',()=>{
  const {defaultBrowserType:_, ...phone}=devices['iPhone 13'];
  test.use(phone);
  test('can switch, edit, undo and save without horizontal overflow',async({page})=>{
    await page.goto('/');await ready(page);
    await page.getByRole('button',{name:'Digital portrait',exact:true}).tap();
    await page.getByRole('combobox',{name:'Layout',exact:true}).selectOption('template');
    await page.getByLabel('Headline',{exact:true}).fill('Seen on the street');
    await page.getByRole('button',{name:'Save on this device'}).tap();
    await expect(page.getByRole('status')).toHaveText('Saved on this device.');
    await page.reload();await ready(page);
    await expect(page.getByLabel('Headline',{exact:true})).toHaveValue('Seen on the street');
    await page.getByLabel('Headline',{exact:true}).fill('Second version');
    await page.getByRole('button',{name:'Undo',exact:true}).tap();
    await expect(page.getByLabel('Headline',{exact:true})).toHaveValue('Seen on the street');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(process.env.OUTDOOR_SCREENSHOTS)await page.screenshot({path:'docs/screenshots/phone.jpg',type:'jpeg',quality:87});
  });
});
