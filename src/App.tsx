import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import FloorPlan from './FloorPlan';
import { racks,binLabel } from './domain';
import { useSelection } from './store';
const RackScene=lazy(()=>import('./RackScene'));
class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="fallback">3D 화면을 사용할 수 없습니다.<br/>아래 칸 목록에서 위치를 선택할 수 있습니다.</div>:this.props.children;}
}
function Detail(){
  const {rackId,binId,selectBin,close}=useSelection();
  const rack=racks.find(r=>r.id===rackId)!;
  const [level,setLevel]=useState(0),[row,setRow]=useState(0),[cameraKey,setCameraKey]=useState(0);
  const bin=rack.bins.find(b=>b.id===binId);
  const choose=(id:string)=>{selectBin(id);};
  return <aside className="detail">
    <div className="section-label">RACK INSPECTOR <button aria-label="상세 닫기" onClick={close}>×</button></div>
    <h2>{rack.code}<span className="pill">3D 상세</span></h2><p className="muted">{rack.name}</p>
    <div className="dimensions"><span>{rack.width/1000} m <small>너비</small></span><span>{rack.depth/1000} m <small>깊이</small></span><span>{rack.height/1000} m <small>높이</small></span></div>
    <div className="scene" data-testid="rack-scene"><SceneBoundary><Suspense fallback={<div className="fallback">3D 랙을 준비하고 있습니다…</div>}><RackScene key={cameraKey} rack={rack} selected={binId} onSelect={choose} level={level} row={row}/></Suspense></SceneBoundary><span className="scene-label">앞면 기준 · 마우스로 회전</span></div>
    <div className="filters"><label>단 <select aria-label="단 필터" value={level} onChange={e=>setLevel(Number(e.target.value))}><option value={0}>전체</option>{Array.from({length:rack.levels},(_,i)=><option key={i} value={i+1}>{i+1}단</option>)}</select></label><label>행 <select aria-label="행 필터" value={row} onChange={e=>setRow(Number(e.target.value))}><option value={0}>전체</option>{Array.from({length:rack.rows},(_,i)=><option key={i} value={i+1}>{i+1}행</option>)}</select></label><button onClick={()=>{setCameraKey(k=>k+1);setLevel(0);setRow(0);}}>시점 초기화</button></div>
    <div className="bin-heading"><h3>보관 위치</h3><span>{rack.bins.length}개 칸</span></div>
    <div className="bin-grid" style={{gridTemplateColumns:`repeat(${rack.columns},1fr)`}}>{[...rack.bins].sort((a,b)=>b.level-a.level||a.row-b.row||a.column-b.column).filter(b=>(!level||b.level===level)&&(!row||b.row===row)).map(b=><button key={b.id} aria-pressed={binId===b.id} className={binId===b.id?'bin active':'bin'} onClick={()=>choose(b.id)}>{binLabel(b)}</button>)}</div>
    <div className="selection" aria-live="polite"><span className="section-label">선택한 위치</span><strong>{bin?`${rack.code} / ${binLabel(bin)}`:'칸을 선택해 주세요'}</strong><p>{bin?'빈 칸 · 물품 배정은 다음 단계에서 제공됩니다.':'3D의 칸이나 위 목록을 누르면 위치가 강조됩니다.'}</p></div>
  </aside>;
}
export default function App(){
  const {rackId,selectRack}=useSelection();
  return <div className="app"><header><div className="brand"><span className="brand-icon">▦</span><div>WAREHOUSE<span>VISUAL WORKSPACE</span></div></div><div className="header-right"><span className="dot"/>로컬 시제품 <span className="version">01 / 공간 탐색</span></div></header>
    <div className="workspace"><nav className="sidebar"><div className="section-label">WORKSPACE</div><h2>본창고 <span className="muted">↗</span></h2><p className="muted">14 × 10 m · 단일 창고</p><div className="nav-active">▧　창고 탐색</div><div className="rack-heading">배치된 랙 <span>02</span></div>{racks.map(r=><button key={r.id} className={`rack-card ${rackId===r.id?'selected':''}`} onClick={()=>selectRack(r.id)} aria-pressed={rackId===r.id}><div><strong>{r.code}</strong><span>↗</span></div><p>{r.name}</p><small>{r.columns}열 · {r.rows}행 · {r.levels}단 <b>{r.bins.length}칸</b></small></button>)}<div className="sidebar-note"><span>첫 번째 단계</span><p>평면도에서 위치를 찾고,<br/>3D에서 칸을 확인하세요.</p><small>현재는 샘플 배치입니다.<br/>편집·재고 저장은 후속 단계입니다.</small></div></nav>
    <main><div className="page-heading"><div className="section-label">SPATIAL INVENTORY / 01</div><h1>창고를 한눈에.</h1><p>랙을 선택하고, 보관 위치를 입체적으로 살펴보세요.</p></div><div className="map-panel"><div className="map-heading"><strong>본창고 평면도</strong><span><i/>조회 모드</span></div><FloorPlan/><div className="map-footer"><span>■ 선택한 랙　<span className="muted">■ 일반 랙</span></span><span>1칸 = 1 m · ↑ 랙 앞면</span></div></div><div className="summary"><div><small>배치된 랙</small><strong>2 <span>개</span></strong></div><div><small>전체 보관 칸</small><strong>24 <span>칸</span></strong></div><div><small>탐색 방식</small><strong className="summary-text">2D → 3D</strong></div></div></main>
    {rackId?<Detail key={rackId}/>:<aside className="detail empty"><span>↖</span><h2>랙을 선택해 주세요</h2><p>평면도나 왼쪽 목록에서 선택하면<br/>3D 구조를 확인할 수 있습니다.</p></aside>}</div></div>;
}
