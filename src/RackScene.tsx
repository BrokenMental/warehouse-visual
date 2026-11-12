import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import { binGeometry, type Rack } from './domain';
function Bar({position,size}:{position:[number,number,number];size:[number,number,number]}){return <mesh position={position}><boxGeometry args={size}/><meshStandardMaterial color="#7b8f85"/></mesh>;}
export default function RackScene({rack,selected,onSelect,level,row}:{rack:Rack;selected:string|null;onSelect:(id:string)=>void;level:number;row:number}){
  const w=rack.width/1000,d=rack.depth/1000,h=rack.height/1000;
  return <Canvas camera={{position:[5,3.8,6],fov:40}} fallback={<p>3D를 사용할 수 없습니다. 아래 칸 목록으로 위치를 확인하세요.</p>}>
    <color attach="background" args={['#edf2ed']}/><ambientLight intensity={1.5}/><directionalLight position={[4,8,5]} intensity={2}/>
    <group>
      {Array.from({length:rack.columns+1},(_,i)=>[0,1].map(j=><Bar key={`${i}-${j}`} position={[-w/2+i*w/rack.columns,h/2,j===0?d/2:-d/2]} size={[.055,h+.08,.055]}/>))}
      {Array.from({length:rack.levels+1},(_,i)=><Bar key={i} position={[0,i*h/rack.levels,0]} size={[w,.045,d]}/>)}
      {rack.bins.filter(b=>(!level||b.level===level)&&(!row||b.row===row)).map(b=>{const g=binGeometry(rack,b);return <mesh key={b.id} position={g.position} onClick={e=>{e.stopPropagation();onSelect(b.id);}}>
        <boxGeometry args={g.size}/><meshStandardMaterial color={selected===b.id?'#ecb754':'#5caf90'} transparent opacity={selected===b.id?.85:.14} depthWrite={false}/><Edges color={selected===b.id?'#a36b10':'#82ae9b'}/>
      </mesh>;})}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.06,0]}><planeGeometry args={[12,12]}/><meshStandardMaterial color="#e7eee7"/></mesh>
      <Bar position={[0,.015,d/2+.18]} size={[w,.025,.07]}/>
    </group>
    <OrbitControls makeDefault target={[0,h/2,0]} minDistance={2} maxDistance={12} maxPolarAngle={Math.PI/2-.02}/>
  </Canvas>;
}
