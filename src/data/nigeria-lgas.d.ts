declare module '@/data/nigeria-lgas.json' {
  export interface NigeriaLGA {
    state: string;
    alias: string;
    lgas: string[];
  }
  
  const lgaData: NigeriaLGA[];
  export default lgaData;
}
