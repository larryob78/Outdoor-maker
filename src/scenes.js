const asQuad=points=>points.map(([x,y])=>[x/1200,y/780]);
export const scenePresets=[
  {id:'street',name:'Street poster frame',format:'6-sheet',quad:asQuad([[516,150],[726,174],[726,528],[516,576]])},
  {id:'road',name:'Roadside billboard',format:'48-sheet',quad:asQuad([[313,149],[917,181],[917,350],[313,384]])},
  {id:'retail',name:'Retail digital screen',format:'digital-portrait',quad:asQuad([[509,161],[701,194],[701,587],[509,630]])},
];
export const photoQuad=[[.22,.22],[.78,.22],[.78,.78],[.22,.78]];
export const initialScene=(quad,format)=>({quad:quad.map(p=>[...p]),mask:[],format,opacity:1,brightness:1});
