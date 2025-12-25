import { IndustryMapData } from './types';
import { v4 as uuidv4 } from 'uuid';

// Helper to generate IDs
export const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

export const INITIAL_DATA: IndustryMapData = {
  title: "先进石化化工新材料",
  totalCount: "", // Will be calculated automatically
  columns: [
    {
      id: 'upstream',
      title: "上游",
      colorTheme: 'blue',
      sections: [
        {
          id: generateId(),
          title: "石化化工原材料供应",
          categories: [
            {
              id: generateId(),
              title: "石油化工原材料",
              items: [{ id: generateId(), text: "石油 (20)" }]
            },
            {
              id: generateId(),
              title: "煤化工原材料",
              items: [{ id: generateId(), text: "煤炭 (11)" }]
            },
            {
              id: generateId(),
              title: "天然气化工原材料",
              items: [{ id: generateId(), text: "天然气 (6)" }]
            }
          ]
        }
      ]
    },
    {
      id: 'midstream',
      title: "中游",
      colorTheme: 'blue',
      sections: [
        {
          id: generateId(),
          title: "石化化工新材料加工制造",
          categories: [
            {
              id: generateId(),
              title: "高性能塑料及树脂",
              items: [
                { id: generateId(), text: "通用塑料 (5)" },
                { id: generateId(), text: "特种工程塑料 (1)" }
              ]
            },
            {
              id: generateId(),
              title: "电子化工新材料",
              items: [
                { id: generateId(), text: "超高纯化学试剂 (10)" },
                { id: generateId(), text: "光刻胶 (5)" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'downstream',
      title: "下游",
      colorTheme: 'blue',
      sections: [
        {
          id: generateId(),
          title: "石化化工新材料下游应用产品",
          categories: [
            {
              id: generateId(),
              title: "建筑业",
              items: [{ id: generateId(), text: "管材 (183)" }]
            },
             {
              id: generateId(),
              title: "农业",
              items: [{ id: generateId(), text: "地膜 (32)" }]
            }
          ]
        }
      ]
    }
  ]
};