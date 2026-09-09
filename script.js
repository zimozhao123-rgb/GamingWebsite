const canvas=document.querySelector('#bike-canvas'),ctx=canvas.getContext('2d'),keys={};
const FINISH_X=6500,WHEEL_X=24,WHEEL_Y=12,WHEEL_RADIUS=14,GRAVITY=900,MAX_SPEED=600,ACCELERATION=300,MAX_REVERSE_SPEED=180,REVERSE_ACCELERATION=220,BRAKE_FORCE=700,MAX_SPIN=2.8;
const LOOP_X=4250,LOOP_Y=250,LOOP_RADIUS=140,GAPS=[[2500,2750],[4800,5100]];
let bike,terrain=[],last=0;

addEventListener('keydown',e=>{keys[e.key]=true;if(e.key.toLowerCase()==='r')resetBike()});
addEventListener('keyup',e=>keys[e.key]=false);
document.querySelector('#reset').onclick=resetBike;

function resetBike(){
  bike={x:100,y:310,vx:0,vy:0,angle:0,spin:0,grounded:false,looping:false,loopComplete:false,loopProgress:0,started:false,done:false,dead:false,crashReason:'',start:0,finishTime:0,crashTime:0};
  terrain=[];
  for(let x=0;x<=6700;x+=50)terrain.push({x,y:terrainHeight(x)});
  last=performance.now();
}

function terrainHeight(x){
  let y=410;
  if(x>350&&x<900)y=410-Math.sin((x-350)/550*Math.PI)*75;
  if(x>=900&&x<1700)y=410-Math.sin((x-900)/800*Math.PI)*155;
  if(x>=1700&&x<2200)y=410+Math.sin((x-1700)/500*Math.PI)*38;
  if(x>=2200&&x<=2500)y=410-(x-2200)*.38;
  if(x>=2750&&x<3150)y=315+(x-2750)*.24;
  if(x>=3150&&x<3550)y=411-Math.sin((x-3150)/400*Math.PI)*130;
  if(x>=3550&&x<4400)y=390;
  if(x>=4400&&x<=4800)y=410-(x-4400)*.32;
  if(x>=5100&&x<5450)y=325+(x-5100)*.24;
  if(x>=5450&&x<6200)y=409-Math.sin((x-5450)/750*Math.PI)*145;
  return y;
}

function isGapAt(x){return GAPS.some(([start,end])=>x>start&&x<end)}

function groundAt(x){
  if(isGapAt(x))return null;
  const n=Math.max(0,Math.min(terrain.length-2,Math.floor(x/50))),a=terrain[n],b=terrain[n+1];
  return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);
}

function groundSlopeAt(x){const before=groundAt(x-3),after=groundAt(x+3);return before===null||after===null?0:(after-before)/6}

function finishLevel(t){
  bike.done=true;
  bike.finishTime=(t-bike.start)/1000;
  bike.x=FINISH_X;
  bike.y=groundAt(FINISH_X)-WHEEL_Y-WHEEL_RADIUS;
  bike.vx=0;bike.vy=0;bike.spin=0;bike.grounded=true;
  let best=localStorage.getItem('pp-bike-best');
  if(!best||bike.finishTime<best){best=bike.finishTime;localStorage.setItem('pp-bike-best',best)}
  PixelRewards.earn(15,'COURSE COMPLETE');
}

function crashBike(t,reason='HEAD IMPACT — RUN OVER'){
  bike.dead=true;
  bike.crashReason=reason;
  bike.crashTime=bike.started?(t-bike.start)/1000:0;
  bike.vx=0;bike.vy=0;bike.spin=0;bike.grounded=false;
}

function worldPoint(localX,localY){
  const cos=Math.cos(bike.angle),sin=Math.sin(bike.angle);
  return{x:bike.x+localX*cos-localY*sin,y:bike.y+localX*sin+localY*cos};
}

function headHitsGround(){
  const head=worldPoint(3,-40);
  const ground=groundAt(head.x);
  return ground!==null&&head.y+9>=ground;
}

function wheelContacts(){
  return[-WHEEL_X,WHEEL_X].map(localX=>{
    const point=worldPoint(localX,WHEEL_Y);
    const ground=groundAt(point.x);
    return{...point,penetration:ground===null?-Infinity:point.y+WHEEL_RADIUS-ground};
  });
}

function loop(t){
  const dt=Math.min(.025,(t-last)/1000||.016);last=t;
  if(!bike.done&&!bike.dead){
    if(keys.ArrowDown){
      if(bike.vx>0)bike.vx=Math.max(0,bike.vx-BRAKE_FORCE*dt);
      else bike.vx=Math.max(-MAX_REVERSE_SPEED,bike.vx-REVERSE_ACCELERATION*dt);
      if(!bike.started){bike.started=true;bike.start=t}
    }else if(keys.ArrowUp){
      bike.vx=Math.min(MAX_SPEED,bike.vx+ACCELERATION*dt);
      if(!bike.started){bike.started=true;bike.start=t}
    }else bike.vx*=Math.pow(.992,dt*60);
    const lean=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0);
    bike.spin+=lean*(bike.grounded?4.2:7)*dt;
    if(!bike.grounded)bike.spin+=.35*dt;
    bike.spin=Math.max(-MAX_SPIN,Math.min(MAX_SPIN,bike.spin));
    if(!lean)bike.spin*=Math.pow(bike.grounded?.12:.72,dt);

    if(!bike.looping&&!bike.loopComplete&&bike.x>=LOOP_X-8&&bike.x<LOOP_X+12&&bike.vx>=280){bike.looping=true;bike.loopProgress=0;bike.grounded=true}
    if(bike.looping){
      bike.loopProgress+=Math.max(320,bike.vx)/(LOOP_RADIUS-WHEEL_Y-WHEEL_RADIUS)*dt;
      const progress=Math.min(Math.PI*2,bike.loopProgress),rideRadius=LOOP_RADIUS-WHEEL_Y-WHEEL_RADIUS;
      bike.x=LOOP_X+rideRadius*Math.sin(progress);bike.y=LOOP_Y+rideRadius*Math.cos(progress);bike.angle=-progress;bike.vy=0;bike.spin=0;
      if(bike.loopProgress>=Math.PI*2){bike.looping=false;bike.loopComplete=true;bike.x=LOOP_X+45;bike.y=groundAt(bike.x)-WHEEL_Y-WHEEL_RADIUS;bike.angle=0}
    }else{
      bike.vy+=GRAVITY*dt;
      bike.x+=bike.vx*dt;
      bike.x=Math.max(30,bike.x);
      bike.y+=bike.vy*dt;
      bike.angle+=bike.spin*dt;
      if(headHitsGround())crashBike(t);
      else if(bike.y>570)crashBike(t,'FELL INTO A PIT — RUN OVER');
      else{
        const contacts=wheelContacts(),deepest=Math.max(contacts[0].penetration,contacts[1].penetration);
        if(deepest>=0){
          bike.y-=deepest;
          const slope=groundSlopeAt(bike.x),rampVelocity=slope*bike.vx;
          if(bike.vy>rampVelocity){const impact=bike.vy-rampVelocity;bike.vy=rampVelocity-Math.min(55,impact*.1)}
          bike.grounded=true;bike.spin+=(contacts[0].penetration-contacts[1].penetration)*.018;
          bike.spin=Math.max(-MAX_SPIN,Math.min(MAX_SPIN,bike.spin));bike.spin*=Math.pow(.18,dt);
          bike.angle+=(Math.atan(slope)-bike.angle)*(1-Math.pow(.0002,dt));
        }else bike.grounded=false;
        if(bike.x>=FINISH_X&&bike.started)finishLevel(t);
      }
    }
  }
  draw(t);
  requestAnimationFrame(loop);
}

function drawTerrain(cam){
  const chunks=[];let chunk=[];
  terrain.forEach(point=>{if(isGapAt(point.x)){if(chunk.length)chunks.push(chunk);chunk=[]}else chunk.push(point)});
  if(chunk.length)chunks.push(chunk);
  chunks.forEach(points=>{
    ctx.fillStyle='#111520';ctx.beginPath();ctx.moveTo(points[0].x-cam,500);points.forEach(point=>ctx.lineTo(point.x-cam,point.y));ctx.lineTo(points[points.length-1].x-cam,500);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d7ff38';ctx.lineWidth=4;ctx.beginPath();points.forEach((point,index)=>index?ctx.lineTo(point.x-cam,point.y):ctx.moveTo(point.x-cam,point.y));ctx.stroke();
  });
}

function draw(t){
  const cam=Math.max(0,bike.x-220);
  const design=PixelRewards.equipped('bikeDesign'),bikeColors=design==='ghost'?{frame:'#69efff',body:'#f3fbff',rider:'#9befff'}:design==='inferno'?{frame:'#ffbf36',body:'#ff3b20',rider:'#ff8a24'}:{frame:'#d7ff38',body:'#ff5a36',rider:'#7b61ff'};
  ctx.clearRect(0,0,960,500);
  const sky=ctx.createLinearGradient(0,0,0,500);sky.addColorStop(0,'#20243a');sky.addColorStop(1,'#ff5a36');ctx.fillStyle=sky;ctx.fillRect(0,0,960,500);
  ctx.fillStyle='#d7ff38';ctx.beginPath();ctx.arc(780-cam*.08,100,48,0,7);ctx.fill();
  drawTerrain(cam);
  // Vertical loop track.
  ctx.strokeStyle='#111520';ctx.lineWidth=13;ctx.beginPath();ctx.arc(LOOP_X-cam,LOOP_Y,LOOP_RADIUS,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='#d7ff38';ctx.lineWidth=4;ctx.beginPath();ctx.arc(LOOP_X-cam,LOOP_Y,LOOP_RADIUS,0,Math.PI*2);ctx.stroke();
  ctx.save();ctx.translate(bike.x-cam,bike.y);ctx.rotate(bike.angle);
  // Tires, rims, hubs, and moving spokes.
  for(const wheelX of[-WHEEL_X,WHEEL_X]){
    ctx.save();ctx.translate(wheelX,WHEEL_Y);ctx.rotate(bike.x/WHEEL_RADIUS);
    ctx.fillStyle='#090b12';ctx.beginPath();ctx.arc(0,0,WHEEL_RADIUS+2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f2efe6';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,WHEEL_RADIUS,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#777b86';ctx.lineWidth=1;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*11,Math.sin(a)*11);ctx.stroke()}
    ctx.fillStyle=bikeColors.frame;ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  // Swingarm, frame, suspension fork, and handlebars.
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=bikeColors.frame;ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(-WHEEL_X,WHEEL_Y);ctx.lineTo(-3,2);ctx.lineTo(12,-11);ctx.lineTo(WHEEL_X,WHEEL_Y);ctx.moveTo(-3,2);ctx.lineTo(15,4);ctx.lineTo(12,-11);ctx.stroke();
  ctx.strokeStyle='#f2efe6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(12,-11);ctx.lineTo(WHEEL_X,WHEEL_Y);ctx.moveTo(11,-13);ctx.lineTo(21,-17);ctx.lineTo(25,-14);ctx.stroke();
  // Engine, fuel tank, seat, and exhaust.
  ctx.fillStyle='#737784';ctx.fillRect(-5,-1,13,11);ctx.fillStyle=bikeColors.body;ctx.beginPath();ctx.moveTo(1,-13);ctx.quadraticCurveTo(11,-20,16,-11);ctx.lineTo(8,-6);ctx.lineTo(0,-7);ctx.fill();
  ctx.strokeStyle='#c9cad0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-4,5);ctx.lineTo(-14,8);ctx.lineTo(-21,3);ctx.stroke();
  ctx.strokeStyle='#20232d';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-11,-12);ctx.lineTo(1,-12);ctx.stroke();
  // Rider: legs, torso, arms, and helmet.
  ctx.strokeStyle='#f2efe6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-2,-25);ctx.lineTo(0,-12);ctx.lineTo(-7,2);ctx.lineTo(-16,7);ctx.moveTo(0,-12);ctx.lineTo(9,1);ctx.lineTo(17,5);ctx.moveTo(-1,-23);ctx.lineTo(10,-17);ctx.lineTo(20,-16);ctx.stroke();
  ctx.strokeStyle=bikeColors.rider;ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(1,-36);ctx.lineTo(-2,-24);ctx.stroke();
  ctx.fillStyle=bikeColors.body;ctx.beginPath();ctx.arc(3,-40,9,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f2efe6';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#090b12';ctx.fillRect(4,-42,8,3);ctx.restore();
  ctx.fillStyle='#fff';ctx.font='11px monospace';ctx.fillText('FINISH',FINISH_X-cam,260);ctx.fillStyle='#d7ff38';ctx.fillRect(FINISH_X-cam,270,5,140);

  const elapsed=bike.started?(bike.done?bike.finishTime:bike.dead?bike.crashTime:(t-bike.start)/1000):0;
  document.querySelector('#bike-time').textContent=elapsed.toFixed(1);
  const best=localStorage.getItem('pp-bike-best');document.querySelector('#bike-best').textContent=best?Number(best).toFixed(1):'--';

  if(bike.done){
    ctx.fillStyle='#090b12dd';ctx.fillRect(205,155,550,190);ctx.strokeStyle='#d7ff38';ctx.lineWidth=3;ctx.strokeRect(205,155,550,190);
    ctx.textAlign='center';ctx.fillStyle='#d7ff38';ctx.font='38px sans-serif';ctx.fillText('LEVEL COMPLETE',480,220);
    ctx.fillStyle='#f2efe6';ctx.font='18px monospace';ctx.fillText('FINISH TIME  '+bike.finishTime.toFixed(1)+'s',480,265);
    ctx.fillStyle='#989aa3';ctx.font='12px monospace';ctx.fillText('PRESS R OR USE RESTART TO RIDE AGAIN',480,310);ctx.textAlign='left';
  }
  if(bike.dead){
    ctx.fillStyle='#090b12dd';ctx.fillRect(205,155,550,190);ctx.strokeStyle='#ff5a36';ctx.lineWidth=3;ctx.strokeRect(205,155,550,190);
    ctx.textAlign='center';ctx.fillStyle='#ff5a36';ctx.font='38px sans-serif';ctx.fillText('RIDER DOWN',480,225);
    ctx.fillStyle='#f2efe6';ctx.font='15px monospace';ctx.fillText(bike.crashReason,480,270);
    ctx.fillStyle='#989aa3';ctx.font='12px monospace';ctx.fillText('PRESS R OR USE RESTART TO TRY AGAIN',480,310);ctx.textAlign='left';
  }
}

resetBike();requestAnimationFrame(loop);
