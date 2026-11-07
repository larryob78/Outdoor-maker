import test from 'node:test';
import assert from 'node:assert/strict';
import {fit,formats,template,safe,defaultLayout,wrapText} from '../src/formats.js';
import {projector} from '../src/perspective.js';
import {initialScene,scenePresets} from '../src/scenes.js';
import {motionAt} from '../src/motion.js';

test('fit preserves entire source and crop fills without distortion',()=>{
  assert.deepEqual(fit(400,200,200,300,false),{x:0,y:100,w:200,h:100,scale:.5});
  assert.deepEqual(fit(400,200,200,300,true),{x:-200,y:0,w:600,h:300,scale:1.5});
  assert.deepEqual(fit(400,200,200,300,true,1),{x:-400,y:0,w:600,h:300,scale:1.5});
});
test('all six presets are distinct; both maximum-size lockups stay inside guides',()=>{
  assert.equal(new Set(formats.map(f=>f.id)).size,6);
  for(const f of formats){
    const m=safe(f);
    for(const pos of [0,1]){
      const layout={...defaultLayout,tx:pos,ty:pos,lx:pos,ly:pos,logoScale:2};
      for(const box of Object.values(template(f,layout))){
        assert.ok(box.x>=m&&box.y>=m);
        assert.ok(box.x+box.w<=f.w-m+1e-9&&box.y+box.h<=f.h-m+1e-9);
      }
    }
  }
});
test('headlines wrap long words and preserve deliberate line breaks',()=>{
  assert.deepEqual(wrapText('Good day\nWATERFALL',s=>s.length,5),['Good','day','WATER','FALL']);
});
test('projective mapping hits all corners and does not treat trapezoid as a rectangle',()=>{
  const q=[[0,0],[8,0],[6,5],[2,5]], project=projector(q);
  for(const [i,p] of [[0,[0,0]],[1,[1,0]],[2,[1,1]],[3,[0,1]]]){
    project(...p).forEach((v,j)=>assert.ok(Math.abs(v-q[i][j])<1e-9));
  }
  assert.ok(project(.5,.5)[1]>2.5);
  assert.equal(projector([[0,0],[1,1],[0,1],[1,0]]),null);
  assert.equal(projector([[0,0],[1,0],[1,0],[0,1]]),null);
});
test('scene editing cannot mutate its reset preset',()=>{
  const p=scenePresets[0], scene=initialScene(p.quad,p.format);
  scene.quad[0][0]=0;
  assert.notEqual(p.quad[0][0],0);
});
test('motion is bounded and deterministic with a stable, readable hold',()=>{
  const m={duration:6,fade:.6,zoom:1.2};
  assert.deepEqual(motionAt(-1,m),{zoom:1,opacity:0});
  assert.deepEqual(motionAt(3,m),{zoom:1.1,opacity:1});
  assert.deepEqual(motionAt(7,m),{zoom:1.2,opacity:0});
  assert.equal(motionAt(0,{...m,fade:0}).opacity,1);
});
