
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
  layoutMode?: 'grid' | 'centered'; // Deprecated in favor of colMode, but kept for compatibility
  colMode?: '1col' | '2col'; // '1col' | '2col'. If undefined, follows global setting.
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
