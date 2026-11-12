import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { racks, warehouse } from './domain';
import { useSelection } from './store';
export default function FloorPlan(){
  const host=useRef<HTMLDivElement>(null);
  const [size,setSize]=useState({width:600,height:550});
  const [view,setView]=useState({x:0,y:0,zoom:1});
  const {rackId,selectRack}=useSelection();
  useEffect(()=>{const node=host.current!;const observer=new ResizeObserver(([entry])=>setSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(node);return()=>observer.disconnect();},[]);
  const base=Math.max(.005,Math.min((size.width-100)/warehouse.width,(size.height-120)/warehouse.depth));
  const scale=base*view.zoom;
  const ox=(size.width-warehouse.width*base)/2, oy=(size.height-warehouse.depth*base)/2;
  return <div className="floor-shell">
    <div className="canvas-host" ref={host} aria-label="창고 2D 평면도. 랙은 왼쪽 목록에서도 선택할 수 있습니다.">
      <Stage width={size.width} height={size.height} x={view.x} y={view.y} draggable onDragEnd={e=>{if(e.target===e.target.getStage())setView(v=>({...v,x:e.target.x(),y:e.target.y()}));}} onWheel={e=>{e.evt.preventDefault();const stage=e.target.getStage()!;const p=stage.getPointerPosition()!;const next=Math.max(.5,Math.min(3,view.zoom*(e.evt.deltaY<0?1.1:1/1.1)));const ratio=next/view.zoom;setView({zoom:next,x:p.x-ox-(p.x-ox-view.x)*ratio,y:p.y-oy-(p.y-oy-view.y)*ratio});}}>
        <Layer><Group x={ox} y={oy} scaleX={scale} scaleY={scale}>
          <Rect width={warehouse.width} height={warehouse.depth} fill="#fcfdfb" stroke="#879c92" strokeWidth={2/scale}/>
          {Array.from({length:13},(_,i)=><Line key={`x${i}`} points={[(i+1)*1000,0,(i+1)*1000,warehouse.depth]} stroke="#e4ebe5" strokeWidth={1/scale}/>)}
          {Array.from({length:9},(_,i)=><Line key={`y${i}`} points={[0,(i+1)*1000,warehouse.width,(i+1)*1000]} stroke="#e4ebe5" strokeWidth={1/scale}/>)}
          <Text x={0} y={-35/scale} text="14.0 m" fontSize={12/scale} fill="#6c7c75"/>
          <Text x={warehouse.width+12/scale} y={warehouse.depth/2} text="10 m" fontSize={12/scale} fill="#6c7c75"/>
          <Text x={500} y={700} text="본창고 / 01" fontSize={13/scale} fill="#8d9b94"/>
          {racks.map(r=><Group key={r.id} x={r.x} y={r.y} onClick={()=>selectRack(r.id)} onTap={()=>selectRack(r.id)}>
            <Rect width={r.width} height={r.depth} fill={rackId===r.id?'#c3e6d5':'#e4e9e1'} stroke={rackId===r.id?'#147958':'#8d9e92'} strokeWidth={(rackId===r.id?3:1.5)/scale} cornerRadius={4/scale}/>
            {Array.from({length:r.columns-1},(_,i)=><Line key={i} points={[(i+1)*r.width/r.columns,0,(i+1)*r.width/r.columns,r.depth]} stroke="#85a896" strokeWidth={1/scale}/>)}
            {Array.from({length:r.rows-1},(_,i)=><Line key={`r${i}`} points={[0,(i+1)*r.depth/r.rows,r.width,(i+1)*r.depth/r.rows]} stroke="#85a896" strokeWidth={1/scale}/>)}
            <Line points={[0,0,r.width,0]} stroke="#17684f" strokeWidth={4/scale}/>
            <Text y={-24/scale} text={`${r.code}  ↑ 앞면`} fontSize={12/scale} fontStyle="bold" fill="#235443"/>
            <Text y={r.depth+12/scale} text={`${r.columns}열 × ${r.rows}행 × ${r.levels}단`} fontSize={11/scale} fill="#6b7c71"/>
          </Group>)}
          <Rect x={5500} y={warehouse.depth-70} width={3000} height={140} fill="#c6d8c9"/>
          <Text x={5900} y={warehouse.depth+16/scale} text="출입구" fontSize={12/scale} fill="#718174"/>
        </Group></Layer>
      </Stage>
    </div>
    <div className="map-tip">드래그로 화면 이동 · 휠로 확대 · 랙을 눌러 3D 확인</div>
    <div className="zoom-tools"><button aria-label="축소" onClick={()=>setView(v=>({...v,zoom:Math.max(.5,v.zoom/1.2)}))}>−</button><span>{Math.round(view.zoom*100)}%</span><button aria-label="확대" onClick={()=>setView(v=>({...v,zoom:Math.min(3,v.zoom*1.2)}))}>＋</button><button onClick={()=>setView({x:0,y:0,zoom:1})}>맞춤</button></div>
  </div>;
}
