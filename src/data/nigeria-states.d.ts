declare module '@/data/nigeria-states.json' {
  export interface NigeriaState {
    name: string;
    capital: string;
    code: string;
  }
  
  const states: NigeriaState[];
  export default states;
}
