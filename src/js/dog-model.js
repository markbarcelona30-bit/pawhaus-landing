import * as THREE from './node_modules/three/build/three.module.js';

// Solid geometry, with a neck pivot and independent eyeballs.
export class PawhausDog {
  constructor(row) {
    this.row=row;
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(420,560);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
    this.canvas=this.renderer.domElement;this.canvas.className='dog-model';
    this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(30,.75,.1,30);
    this.camera.position.set(0,1.18,6.1);this.camera.lookAt(0,1.18,0);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0xa5acac,2));
    for(const [color,intensity,position] of [[0xfff2da,3.2,[-3,5,5]],[0xdceeff,1.2,[4,2,2]],[0xffffff,2.2,[0,4,-3]]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(...position);if(intensity===3.2){light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2;light.shadow.camera.right=2;light.shadow.camera.top=3;light.shadow.camera.bottom=-1;light.shadow.normalBias=.025;light.shadow.bias=-.0002;}this.scene.add(light);}
    this.root=new THREE.Group();this.scene.add(this.root);
    const mat=(color,roughness=.78)=>new THREE.MeshStandardMaterial({color,roughness});
    this.fur=mat(row?'#ce9553':'#e7e2d7');this.cream=mat('#f6e6cc');this.black=mat('#252126',.3);
    this.yellow=mat('#e5bd4f',.36);this.blue=mat('#86aec5');this.pink=mat('#d57485',.52);
    this.gold=new THREE.MeshStandardMaterial({color:'#c79b35',metalness:.55,roughness:.28});
    this.sphere=new THREE.SphereGeometry(1,40,28);this.eyes=[];
    this.body=new THREE.Group();this.root.add(this.body);
    this.ball(this.body,[0,.38,0],[.61,.72,.43],row?this.fur:this.blue);
    this.ball(this.body,[0,.86,0],[.43,.43,.38],this.fur);
    this.ball(this.body,[0,.43,.33],[row?.43:.30,.59,.16],this.cream);
    for(const side of [-1,1]){
      this.ball(this.body,[side*.47,.14,.22],[.24,.48,.26],this.fur);
      this.ball(this.body,[side*.47,-.13,.47],[.28,.22,.38],row?this.cream:this.fur);
      for(let toe=-1;toe<=1;toe++)this.ball(this.body,[side*.47+toe*.13,-.15,.73],[.08,.13,.105],row?this.cream:this.fur);
    }
    this.tube(this.body,[[-.52,.83,0],[-.48,.71,.4],[0,.65,.53],[.48,.71,.4],[.52,.83,0]],.065,row?this.blue:this.yellow);
    this.ball(this.body,[0,.48,.58],[.105,.13,.035],this.gold);
    if(!row)for(const side of [-1,1])this.tube(this.body,[[side*.48,.78,.30],[side*.42,.40,.47],[side*.35,.03,.44]],.037,this.yellow);
    this.head=new THREE.Group();this.head.position.set(0,.91,0);this.root.add(this.head);
    this.ball(this.head,[0,.49,0],[.79,.73,.64],this.fur);
    this.addFur(this.head,[0,.49,0],[.79,.73,.64],row?2200:3200,row?.012:.026);
    if(row){
      for(const side of [-1,1]){const ear=new THREE.Group();ear.position.set(side*.57,1.01,-.06);ear.rotation.z=-side*.20;this.head.add(ear);this.ear(ear,.46,.60,.24,this.fur);const inner=this.ear(ear,.29,.40,.10,this.pink);inner.position.set(0,.07,.16);}
      this.ball(this.head,[0,.34,.44],[.69,.47,.36],this.cream);
      this.ball(this.head,[0,.86,.54],[.13,.32,.12],this.cream);
    }else{
      for(const side of [-1,1]){const ear=this.ball(this.head,[side*.75,.47,-.05],[.26,.54,.26],this.fur);ear.rotation.z=side*.18;this.addFur(ear,[0,0,0],[1,1,1],160,.04);}
    }
    this.ball(this.head,[0,.13,.69],[.26,.105,.17],this.black);
    if(row){this.tongue=this.ball(this.head,[0,.035,.82],[.13,.20,.055],this.pink);this.tongue.rotation.x=-.18;}
    for(const side of [-1,1])this.ball(this.head,[side*.19,.27,.68],[.30,.24,.26],row?this.cream:this.fur);
    this.ball(this.head,[0,.39,.91],[.185,.125,.115],this.black);
    this.ball(this.head,[-.045,.43,1.005],[.037,.016,.01],mat('#7c7270',.22));
    this.tube(this.head,[[0,.30,.916],[0,.20,.92],[-.09,.17,.87]],.013,this.black);
    this.tube(this.head,[[0,.20,.92],[.09,.17,.87]],.013,this.black);
    for(const side of [-1,1]){
      const eye=new THREE.Group();eye.position.set(side*.34,.70,.54);this.head.add(eye);
      this.ball(eye,[0,0,0],[.205,.235,.16],mat('#fcf6e9',.28));
      const gaze=new THREE.Group();eye.add(gaze);
      this.ball(gaze,[0,0,.133],[.160,.185,.065],mat('#794b29',.28));
      this.ball(gaze,[0,0,.181],[.094,.121,.033],mat('#151b1d',.16));
      this.ball(gaze,[-.035,.059,.210],[.029,.038,.012],mat('#ffffff',.1));
      this.ball(gaze,[.033,-.042,.211],[.012,.014,.006],mat('#ffffff',.1));
      this.eyes.push({eye,gaze});
      const brow=this.ball(this.head,[side*.34,.96,.49],[.24,.08,.13],this.fur);brow.rotation.z=side*.10;
    }
    this.glasses=new THREE.Group();this.head.add(this.glasses);
    for(const side of [-1,1]){
      if(row){const ring=new THREE.Mesh(new THREE.TorusGeometry(.245,.032,12,64),this.yellow);ring.position.set(side*.34,.70,.754);this.glasses.add(ring);}
      else this.roundedFrame(side*.34,.70,.754,.57,.43,.095);
      this.tube(this.glasses,[[side*.59,.76,.74],[side*.76,.75,.37],[side*.78,.65,-.12]],.025,this.yellow);
    }
    this.tube(this.glasses,[[-.10,.76,.76],[0,.80,.79],[.10,.76,.76]],.029,this.yellow);
    if(!row){
      const cap=new THREE.Group();cap.position.set(0,1.04,-.025);cap.rotation.z=-.08;this.head.add(cap);
      const dome=new THREE.Mesh(new THREE.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),this.yellow);dome.scale.set(.83,.48,.66);cap.add(dome);
      this.ball(cap,[0,.014,.41],[.87,.045,.54],this.yellow);this.ball(cap,[0,.49,0],[.075,.04,.075],this.yellow);
      const seam=mat('#c9a546');for(const side of [-1,0,1])this.tube(cap,[[side*.63,.045,.42],[side*.47,.29,.37],[side*.22,.44,.20],[0,.48,0]],.007,seam);
    }
    this.render(0,0,0,0);
  }
  ball(parent,position,scale,material){const mesh=new THREE.Mesh(this.sphere,material);mesh.position.set(...position);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  tube(parent,points,radius,material){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,32,radius,8,false),material);parent.add(mesh);return mesh;}
  roundedFrame(x,y,z,width,height,radius){
    const pts=[];
    for(let corner=0;corner<4;corner++){const cx=corner===0||corner===3?width/2-radius:-width/2+radius,cy=corner<2?height/2-radius:-height/2+radius;for(let step=0;step<=8;step++){const a=(corner*90+step*90/8)*Math.PI/180;pts.push([x+cx+Math.cos(a)*radius,y+cy+Math.sin(a)*radius,z]);}}
    pts.push(pts[0]);this.tube(this.glasses,pts,.029,this.yellow);
  }
  ear(parent,width,height,depth,material){
    const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.quadraticCurveTo(-width*.55,height*.5,0,height);shape.quadraticCurveTo(width*.55,height*.5,width/2,0);shape.quadraticCurveTo(0,-.08,-width/2,0);
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.065,bevelThickness:.06,curveSegments:16});geo.translate(0,0,-depth/2);const mesh=new THREE.Mesh(geo,material);parent.add(mesh);return mesh;
  }
  addFur(parent,center,radii,count,length){
    const mesh=new THREE.InstancedMesh(new THREE.ConeGeometry(.013,length,4),this.fur,count),dummy=new THREE.Object3D(),axis=new THREE.Vector3(0,1,0);
    for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,angle=i*2.39996323,r=Math.sqrt(1-y*y),normal=new THREE.Vector3(Math.cos(angle)*r,y,Math.sin(angle)*r);dummy.position.set(center[0]+normal.x*radii[0],center[1]+normal.y*radii[1],center[2]+normal.z*radii[2]);dummy.quaternion.setFromUnitVectors(axis,normal);dummy.scale.setScalar(.7+((i*37)%101)/170);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}parent.add(mesh);
  }
  render(x,y,blink,time=0){
    this.head.rotation.set(y*.29,x*.56,-x*.045+Math.sin(time*.65+this.row)*.012,'YXZ');
    for(const {eye,gaze} of this.eyes){eye.scale.y=Math.max(.07,1-blink*.94);gaze.position.x=x*.037;gaze.position.y=-y*.027;}
    if(this.tongue)this.tongue.rotation.x=-.18+Math.sin(time*1.2)*.025;
    this.renderer.render(this.scene,this.camera);
  }
}
