import { describe,it,expect,beforeEach } from 'vitest';
import { racks,binGeometry } from './domain';
import { useSelection } from './store';
describe('공간과 위치 식별',()=>{
  it('모든 칸의 ID가 고유하고 실제 랙 내부에 있다',()=>{const ids=new Set<string>();for(const r of racks){expect(r.bins).toHaveLength(r.columns*r.rows*r.levels);for(const b of r.bins){expect(ids.has(b.id)).toBe(false);ids.add(b.id);const g=binGeometry(r,b);expect(Math.abs(g.position[0])+g.size[0]/2).toBeLessThanOrEqual(r.width/2000);expect(Math.abs(g.position[2])+g.size[2]/2).toBeLessThanOrEqual(r.depth/2000);expect(g.position[1]-g.size[1]/2).toBeGreaterThanOrEqual(0);expect(g.position[1]+g.size[1]/2).toBeLessThanOrEqual(r.height/1000);}}});
  it('깊이 행은 앞에서 뒤로, 단은 아래에서 위로 진행한다',()=>{const r=racks[1];const front=binGeometry(r,r.bins.find(b=>b.column===1&&b.row===1&&b.level===1)!);const back=binGeometry(r,r.bins.find(b=>b.column===1&&b.row===2&&b.level===1)!);expect(front.position[2]).toBeGreaterThan(back.position[2]);const top=binGeometry(r,r.bins.find(b=>b.column===1&&b.row===1&&b.level===3)!);expect(top.position[1]).toBeGreaterThan(front.position[1]);});
});
describe('공통 선택 상태',()=>{beforeEach(()=>useSelection.getState().selectRack(racks[0].id));it('랙 전환 시 이전 칸 선택을 제거한다',()=>{useSelection.getState().selectBin(racks[0].bins[0].id);useSelection.getState().selectRack(racks[1].id);expect(useSelection.getState().binId).toBeNull();});it('다른 랙의 칸을 선택할 수 없다',()=>{useSelection.getState().selectBin(racks[1].bins[0].id);expect(useSelection.getState().binId).toBeNull();});});
