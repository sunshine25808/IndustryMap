export interface Item {
  id: string;
  text: string;
}

export interface Category {
  id: string;
  title: string;
  items: Item[];
  overrideCount?: number;
}

export interface Section {
  id: string;
  title: string;
  categories: Category[];
  overrideCount?: number;
  layoutMode?: 'grid' | 'centered'; // 'grid' (double column) or 'centered'
}

export interface ColumnData {
  id: 'upstream' | 'midstream' | 'downstream';
  title: string;
  colorTheme: string; // 'blue' | 'green' etc, primarily blue for this design
  sections: Section[];
}

export interface IndustryMapData {
  title: string;
  totalCount: string;
  overrideCount?: number; // Added for global manual override
  columns: ColumnData[];
}