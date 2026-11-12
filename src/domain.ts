export interface Bin { id: string; column: number; row: number; level: number; }
export interface Rack { id: string; code: string; name: string; x: number; y: number; width: number; depth: number; height: number; columns: number; rows: number; levels: number; bins: Bin[]; }
export function makeRack(input: Omit<Rack, 'bins'>): Rack {
  const bins: Bin[] = [];
  for (let level = 1; level <= input.levels; level++)
    for (let row = 1; row <= input.rows; row++)
      for (let column = 1; column <= input.columns; column++)
        bins.push({id: `${input.id}-c${column}-r${row}-l${level}`, column, row, level});
  return {...input, bins};
}
export const racks = [
  makeRack({id:'rack-a',code:'A-01',name:'일반 선반 랙',x:2000,y:2500,width:3600,depth:1200,height:2600,columns:3,rows:1,levels:4}),
  makeRack({id:'rack-b',code:'B-01',name:'깊이 2행 선반 랙',x:7800,y:4300,width:2800,depth:2400,height:2200,columns:2,rows:2,levels:3}),
];
export const warehouse = {width:14000,depth:10000};
export const binLabel = (bin: Bin) => `${bin.column}열 · ${bin.row}행 · ${bin.level}단`;
// The front is local y=0; increasing rows go away from the front.
export function binGeometry(rack: Rack, bin: Bin) {
  const w = rack.width / rack.columns / 1000;
  const d = rack.depth / rack.rows / 1000;
  const h = rack.height / rack.levels / 1000;
  return {position:[(bin.column-.5)*w-rack.width/2000,(bin.level-.5)*h,rack.depth/2000-(bin.row-.5)*d] as [number,number,number], size:[w-.12,h-.12,d-.12] as [number,number,number]};
}
