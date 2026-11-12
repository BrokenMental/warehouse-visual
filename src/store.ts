import { create } from 'zustand';
import { racks } from './domain';
interface Selection { rackId:string|null; binId:string|null; selectRack:(id:string)=>void; selectBin:(id:string)=>void; close:()=>void; }
export const useSelection = create<Selection>((set,get)=>({
  rackId:racks[0].id,binId:null,
  selectRack:(id)=>{if(racks.some(r=>r.id===id))set({rackId:id,binId:null});},
  selectBin:(id)=>{if(racks.find(r=>r.id===get().rackId)?.bins.some(b=>b.id===id))set({binId:id});},
  close:()=>set({rackId:null,binId:null}),
}));
