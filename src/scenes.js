const asQuad=points=>points.map(([x,y])=>[x/1200,y/780]);
export const illustrationPresets=[
  {id:'street',name:'Street poster frame',format:'6-sheet',quad:asQuad([[516,150],[726,174],[726,528],[516,576]])},
  {id:'road',name:'Roadside billboard',format:'48-sheet',quad:asQuad([[313,149],[917,181],[917,350],[313,384]])},
  {id:'retail',name:'Retail digital screen',format:'digital-portrait',quad:asQuad([[509,161],[701,194],[701,587],[509,630]])},
];
// Calibrated against the inner display edges in the 1536 × 1024 backgrounds.
const photoPoints=points=>points.map(([x,y])=>[x/1536,y/1024]);
export const scenePresets=[
  {id:'photo-street',name:'Street poster',format:'6-sheet',quad:photoPoints([[685,170],[990,141],[990,707],[685,693]])},
  {id:'photo-road',name:'Roadside billboard',format:'48-sheet',quad:photoPoints([[191,146],[988,238],[990,570],[193,582]])},
  {id:'photo-retail',name:'Retail digital screen',format:'digital-portrait',quad:photoPoints([[672,139],[943,111],[944,654],[673,643]])},
].map(p=>({...p,file:p.id+'.jpg'}));
export const allPresets=[...scenePresets,...illustrationPresets.map(p=>({...p,file:p.id+'.svg'}))];
export const photoQuad=[[.22,.22],[.78,.22],[.78,.78],[.22,.78]];
export const initialScene=(quad,format)=>({quad:quad.map(p=>[...p]),mask:[],format,opacity:1,brightness:1});
