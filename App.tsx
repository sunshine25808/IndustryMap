import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import saveAs from 'file-saver';
import { Icons, IconButton } from './components/Icons';
import { EditableText } from './components/EditableText';
import { ImportModal } from './components/ImportModal';
import { INITIAL_DATA, generateId } from './constants';
import { IndustryMapData, ColumnData, Section, Category, Item } from './types';

// --- Helper Component for Counts ---
interface CountSlotProps {
  value: number;
  onSave: (val: string) => void;
  className?: string;
  isOverridden?: boolean;
}

const CountSlot: React.FC<CountSlotProps> = ({ value, onSave, className = "", isOverridden = false }) => {
  const hasValue = value > 0;
  
  return (
    <span className={`inline-flex items-center gap-0.5 align-baseline ${className}`}>
      {hasValue && <span>(</span>}
      <EditableText 
        text={hasValue ? value.toLocaleString() : ""} 
        onSave={onSave}
        placeholder=""
        className={`
          text-center transition-all
          ${hasValue ? 'min-w-[10px]' : 'min-w-[12px] h-4 inline-block hover:bg-blue-100/50 cursor-text'}
          ${isOverridden ? 'text-blue-200 font-bold manual-override-number' : ''}
        `}
      />
      {hasValue && <span>)</span>}
    </span>
  );
};

function App() {
  const [data, setData] = useState<IndustryMapData>(INITIAL_DATA);
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  // Global Layout State
  const [globalCategoryLayout, setGlobalCategoryLayout] = useState<'single' | 'double'>('double');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- Helpers for Formatting ---
  const parseItemString = (str: string): { name: string; count: number } => {
    const match = str.match(/^(.*)\(([\d,]+)\)\s*$/);
    if (match) {
      return {
        name: match[1].trim(),
        count: parseInt(match[2].replace(/,/g, ''), 10)
      };
    }
    return { name: str, count: 0 };
  };

  const constructItemString = (name: string, count: number): string => {
    if (count > 0) {
      return `${name.trim()} (${count.toLocaleString()})`;
    }
    return name.trim();
  };

  // --- Handlers for Data Mutation ---
  const updateGlobal = (key: keyof IndustryMapData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const updateGlobalCountOverride = (newVal: string) => {
    const num = newVal.trim() === '' ? undefined : parseInt(newVal.replace(/,/g, ''), 10);
    setData(prev => ({
      ...prev,
      overrideCount: isNaN(parseInt(newVal.replace(/,/g, ''), 10)) && newVal !== '0' ? undefined : parseInt(newVal.replace(/,/g, ''), 10)
    }));
  };

  const addSection = (colId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: [...col.sections, { id: generateId(), title: "New Group", categories: [], colMode: undefined }]
          };
        }
        return col;
      })
    }));
  };

  const deleteSection = (colId: string, secId: string) => {
     if (!window.confirm("确认删除该分组及其中所有内容吗？")) return;
     setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.filter(s => s.id !== secId)
          };
        }
        return col;
      })
    }));
  };

  const updateSectionTitle = (colId: string, secId: string, newTitle: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => s.id === secId ? { ...s, title: newTitle } : s)
          };
        }
        return col;
      })
    }));
  };

  const updateSectionCountOverride = (colId: string, secId: string, newVal: string) => {
    const num = newVal.trim() === '' ? undefined : parseInt(newVal.replace(/,/g, ''), 10);
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => s.id === secId ? { ...s, overrideCount: num } : s)
          };
        }
        return col;
      })
    }));
  };

  // NEW: Update Section specific column mode
  const updateSectionColMode = (colId: string, secId: string, mode: '1col' | '2col') => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
               if (s.id === secId) {
                 return { ...s, colMode: mode };
               }
               return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const addCategory = (colId: string, secId: string) => {
     setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: [...s.categories, { id: generateId(), title: "New Category", items: [] }]
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const deleteCategory = (colId: string, secId: string, catId: string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id !== colId) return col;
        const sectionIndex = col.sections.findIndex(s => s.id === secId);
        if (sectionIndex === -1) return col;
        const section = col.sections[sectionIndex];
        if (section.categories.length === 1 && section.categories[0].id === catId) {
            return {
                ...col,
                sections: col.sections.filter(s => s.id !== secId)
            };
        }
        return {
          ...col,
          sections: col.sections.map(s => {
            if (s.id === secId) {
              return {
                ...s,
                categories: s.categories.filter(c => c.id !== catId)
              };
            }
            return s;
          })
        };
      })
    }));
  };

  const updateCategoryTitle = (colId: string, secId: string, catId: string, newTitle: string) => {
    if (newTitle.trim() === '') {
        setData(prev => {
            const col = prev.columns.find(c => c.id === colId);
            const section = col?.sections.find(s => s.id === secId);
            if (section && section.categories.length === 1 && section.categories[0].id === catId) {
                return {
                    ...prev,
                    columns: prev.columns.map(c => {
                        if (c.id !== colId) return c;
                        return {
                            ...c,
                            sections: c.sections.filter(s => s.id !== secId)
                        };
                    })
                };
            }
             return {
                ...prev,
                columns: prev.columns.map(col => {
                    if (col.id === colId) {
                    return {
                        ...col,
                        sections: col.sections.map(s => {
                        if (s.id === secId) {
                            return {
                            ...s,
                            categories: s.categories.map(c => c.id === catId ? { ...c, title: newTitle } : c)
                            };
                        }
                        return s;
                        })
                    };
                    }
                    return col;
                })
            };
        });
        return;
    }

    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: s.categories.map(c => c.id === catId ? { ...c, title: newTitle } : c)
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const updateCategoryCountOverride = (colId: string, secId: string, catId: string, newVal: string) => {
    const num = newVal.trim() === '' ? undefined : parseInt(newVal.replace(/,/g, ''), 10);
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: s.categories.map(c => c.id === catId ? { ...c, overrideCount: num } : c)
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const addItem = (colId: string, secId: string, catId: string) => {
     setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: s.categories.map(c => {
                    if (c.id === catId) {
                      return {
                        ...c,
                        items: [...c.items, { id: generateId(), text: "New Item (1)" }]
                      };
                    }
                    return c;
                  })
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const deleteItem = (colId: string, secId: string, catId: string, itemId: string) => {
     setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: s.categories.map(c => {
                    if (c.id === catId) {
                      return {
                        ...c,
                        items: c.items.filter(i => i.id !== itemId)
                      };
                    }
                    return c;
                  })
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const updateItemInternal = (colId: string, secId: string, catId: string, itemId: string, updater: (oldText: string) => string) => {
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            sections: col.sections.map(s => {
              if (s.id === secId) {
                return {
                  ...s,
                  categories: s.categories.map(c => {
                    if (c.id === catId) {
                      return {
                        ...c,
                        items: c.items.map(i => i.id === itemId ? { ...i, text: updater(i.text) } : i)
                      };
                    }
                    return c;
                  })
                };
              }
              return s;
            })
          };
        }
        return col;
      })
    }));
  };

  const updateItemName = (colId: string, secId: string, catId: string, itemId: string, newName: string) => {
    updateItemInternal(colId, secId, catId, itemId, (oldText) => {
      const { count } = parseItemString(oldText);
      return constructItemString(newName, count);
    });
  };

  const updateItemCount = (colId: string, secId: string, catId: string, itemId: string, newCountStr: string) => {
     updateItemInternal(colId, secId, catId, itemId, (oldText) => {
      const { name } = parseItemString(oldText);
      const newCount = parseInt(newCountStr.replace(/,/g, ''), 10) || 0;
      return constructItemString(name, newCount);
    });
  };

  const extractNumber = (text: string): number => {
    const { count } = parseItemString(text);
    return count;
  };

  const getCategorySum = (category: Category) => {
    if (category.overrideCount !== undefined) return category.overrideCount;
    return category.items.reduce((sum, item) => sum + extractNumber(item.text), 0);
  };

  const getSectionSum = (section: Section) => {
    if (section.overrideCount !== undefined) return section.overrideCount;
    return section.categories.reduce((sum, cat) => sum + getCategorySum(cat), 0);
  };

  const getGlobalSum = () => {
    if (data.overrideCount !== undefined) return data.overrideCount;
    return data.columns.reduce((colSum, col) => 
      colSum + col.sections.reduce((secSum, sec) => secSum + getSectionSum(sec), 0)
    , 0);
  };

  const handleImportData = (rows: string[][]) => {
    if (!rows || rows.length < 2) return;
    const newColumns: ColumnData[] = [
      { id: 'upstream', title: '上游', colorTheme: 'blue', sections: [] },
      { id: 'midstream', title: '中游', colorTheme: 'blue', sections: [] },
      { id: 'downstream', title: '下游', colorTheme: 'blue', sections: [] },
    ];

    let lastColType = '';
    let lastSectionTitle = '';
    let lastCategoryTitle = '';

    rows.forEach((row) => {
      if (row.every(cell => !cell)) return;
      const colTypeRaw = row[0] || lastColType;
      const sectionTitle = row[1] || lastSectionTitle;
      const categoryTitle = row[2] || lastCategoryTitle;
      const product = row[3] || '';
      const count = row[4] || '';

      lastColType = colTypeRaw;
      lastSectionTitle = sectionTitle;
      lastCategoryTitle = categoryTitle;

      let colId: 'upstream' | 'midstream' | 'downstream' | null = null;
      if (colTypeRaw.includes('上游')) colId = 'upstream';
      else if (colTypeRaw.includes('中游')) colId = 'midstream';
      else if (colTypeRaw.includes('下游')) colId = 'downstream';

      if (!colId || !sectionTitle) return;
      const column = newColumns.find(c => c.id === colId)!;
      let section = column.sections.find(s => s.title === sectionTitle);
      if (!section) {
        section = { id: generateId(), title: sectionTitle, categories: [], colMode: undefined };
        column.sections.push(section);
      }
      if (!categoryTitle) return;
      let category = section.categories.find(c => c.title === categoryTitle);
      if (!category) {
        category = { id: generateId(), title: categoryTitle, items: [] };
        section.categories.push(category);
      }
      if (product) {
        let itemText = product;
        let num = 0;
        if (count) {
             const parsed = parseInt(count.replace(/,/g, ''), 10);
             if (!isNaN(parsed)) num = parsed;
        }
        itemText = constructItemString(product, num);
        category.items.push({ id: generateId(), text: itemText });
      }
    });

    setData({ ...data, columns: newColumns });
  };

  const handleExport = useCallback(async () => {
    if (mapRef.current) {
      setIsExporting(true);
      try {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const fileName = `${data.title}__${dateStr}.png`;

        const dataUrl = await toPng(mapRef.current, {
           cacheBust: true,
           backgroundColor: '#ffffff',
           pixelRatio: 2,
           filter: (node) => {
             return !node.classList?.contains('no-export');
           },
           onClone: (clonedNode) => {
             const overrides = clonedNode.querySelectorAll('.manual-override-number');
             overrides.forEach((el) => {
               el.classList.remove('text-blue-200');
               el.classList.remove('font-bold');
             });

             // Remove scrollbars and resize handles for export
             const scrollables = clonedNode.querySelectorAll('.export-no-scroll');
             scrollables.forEach((el) => {
                if (el instanceof HTMLElement) {
                    el.style.overflow = 'hidden';
                    el.style.resize = 'none';
                }
             });
           }
        });
        saveAs(dataUrl, fileName);
      } catch (err) {
        console.error('Export failed', err);
        alert('Failed to export image.');
      } finally {
        setIsExporting(false);
      }
    }
  }, [data.title]);

  const globalTotal = getGlobalSum();

  // Helper to determine effective layout for a section
  const getEffectiveColMode = (section: Section): 'single' | 'double' => {
     if (section.colMode === '1col') return 'single';
     if (section.colMode === '2col') return 'double';
     return globalCategoryLayout;
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-slate-50">
      
      <ImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onImport={handleImportData} 
      />

      {/* --- Toolbar --- */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm border-b z-50 flex items-center justify-between px-8">
         <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold text-gray-800">
             Industry Graph Builder
           </h1>
           <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
           
           {/* Global Layout (Horizontal/Vertical) */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setLayout('horizontal')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${layout === 'horizontal' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Landscape (Horizontal A3)"
              >
                <Icons.Layout className="rotate-90" size={14} /> 横版
              </button>
              <button 
                onClick={() => setLayout('vertical')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${layout === 'vertical' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Portrait (Vertical A3)"
              >
                <Icons.Layout size={14} /> 竖版
              </button>
           </div>

           {/* Category Density (Single/Double Column) */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setGlobalCategoryLayout('single')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${globalCategoryLayout === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Global Single Column"
              >
                <Icons.List size={14} /> 全局单列
              </button>
              <button 
                onClick={() => setGlobalCategoryLayout('double')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${globalCategoryLayout === 'double' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Global Double Column"
              >
                <Icons.Columns size={14} /> 全局双列
              </button>
           </div>
         </div>

         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
            >
              <Icons.Table size={16} /> 导入数据
            </button>
            <button 
              onClick={() => setData(INITIAL_DATA)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              <Icons.Refresh size={16} /> 重置
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              {isExporting ? '生成中...' : <><Icons.Download size={16} /> 导出图片</>}
            </button>
         </div>
      </div>

      <div className="h-16 w-full" />

      {/* --- Main Canvas Container --- */}
      {/* Removed flex justify-center to avoid clipping left side on overflow. Added block and scroll. */}
      <div className="w-full max-w-[100vw] overflow-x-auto p-8 block">
        <div 
           ref={mapRef} 
           className={`bg-white p-8 border border-gray-100 shadow-xl rounded-xl relative transition-all duration-300 mx-auto ${
             layout === 'horizontal' 
               ? 'min-w-[1400px] w-[1400px]' 
               : 'min-w-[1000px] w-[1000px]'
           }`}
           style={{ 
             minHeight: layout === 'horizontal' ? '900px' : '1400px'
           }}
        >
          {/* Map Header */}
          <div className="flex justify-center items-start mb-8 relative">
             <div className="bg-[#1e4b8f] text-white px-10 py-4 rounded-lg shadow-md text-3xl font-bold tracking-wide flex items-center gap-2">
                <EditableText 
                   text={data.title} 
                   onSave={(val) => updateGlobal('title', val)}
                   className="hover:bg-white/10"
                />
                <CountSlot 
                  value={globalTotal}
                  onSave={updateGlobalCountOverride}
                  className="text-3xl"
                  isOverridden={data.overrideCount !== undefined}
                />
             </div>
          </div>

          {/* Columns Container */}
          <div className={`relative w-full flex ${
            layout === 'horizontal' ? 'flex-row gap-2' : 'flex-col gap-12'
          }`}>
             
             {data.columns.map((column, colIndex) => (
                <React.Fragment key={column.id}>
                    
                    {/* Column Content */}
                    <div className="flex-1 min-w-0 flex flex-col relative group/col h-full">
                        {/* Column Header */}
                        {/* Added flex justify-center to center the title */}
                        <div className="mb-4 relative flex justify-center">
                            <div className="inline-block relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-transparent transform -skew-x-12 rounded-sm" />
                                <h2 className="relative px-8 py-2 text-2xl font-bold text-[#446ba6] border-b-2 border-[#446ba6]">
                                {column.title}
                                </h2>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className={`flex-1 flex flex-col gap-6 ${layout === 'vertical' ? 'min-h-[200px]' : ''}`}>
                            {column.sections.map((section) => {
                                const sectionSum = getSectionSum(section);
                                const isSectionOverridden = section.overrideCount !== undefined;
                                
                                const effectiveMode = getEffectiveColMode(section);
                                const isSingle = effectiveMode === 'single';

                                // Determine active styles for the toggle buttons
                                const btnActive = "text-blue-600 bg-blue-100 border-blue-200";
                                const btnInactive = "text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-transparent";
                                
                                return (
                                <div key={section.id} className="border border-[#8aa6c8] rounded-lg p-4 pt-8 relative group/section bg-white h-full">
                                    
                                    {/* Section Title */}
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#445b8f] text-white text-sm font-medium px-4 py-1.5 rounded shadow-sm z-10 whitespace-nowrap flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <EditableText 
                                          text={section.title} 
                                          onSave={(val) => updateSectionTitle(column.id, section.id, val)}
                                      />
                                      <CountSlot 
                                        value={sectionSum}
                                        onSave={(val) => updateSectionCountOverride(column.id, section.id, val)}
                                        isOverridden={isSectionOverridden}
                                      />
                                    </div>
                                    {/* Removed Group Delete Button */}
                                    </div>

                                    {/* Action Buttons (Layout Toggle) - Always visible now */}
                                    <div 
                                      className="absolute -top-3 right-4 z-50 flex items-center gap-1 bg-white rounded-md shadow-sm border border-gray-100 p-0.5"
                                    >
                                       <button
                                          className={`p-1 rounded ${section.colMode === '1col' ? btnActive : btnInactive}`}
                                          title="Force Single Column"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateSectionColMode(column.id, section.id, '1col');
                                          }}
                                       >
                                          <Icons.List size={14} />
                                       </button>
                                       <button
                                          className={`p-1 rounded ${section.colMode === '2col' ? btnActive : btnInactive}`}
                                          title="Force Double Column"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateSectionColMode(column.id, section.id, '2col');
                                          }}
                                       >
                                          <Icons.Columns size={14} />
                                       </button>
                                       {section.colMode && (
                                           <button 
                                            className="p-1 text-xs text-gray-400 hover:text-red-500 border-l ml-1 pl-1"
                                            title="Clear manual override (Auto)"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setData(prev => ({
                                                    ...prev,
                                                    columns: prev.columns.map(c => c.id === column.id ? {
                                                        ...c,
                                                        sections: c.sections.map(s => s.id === section.id ? { ...s, colMode: undefined } : s)
                                                    } : c)
                                                }));
                                            }}
                                           >
                                            <Icons.Undo size={12} />
                                           </button>
                                       )}
                                    </div>

                                    {/* Categories Layout */}
                                    <div className="flex flex-wrap gap-4 justify-center">
                                    {section.categories.map((category) => {
                                        const catSum = getCategorySum(category);
                                        const isCatOverridden = category.overrideCount !== undefined;

                                        return (
                                        <div key={category.id + '-' + effectiveMode} 
                                            className={`
                                            border border-blue-200 rounded flex flex-col group/card shadow-sm hover:shadow-md transition-shadow bg-white relative
                                            resize-both overflow-auto min-w-[140px] min-h-[100px] export-no-scroll
                                            ${isSingle ? 'w-full' : 'w-[calc(50%-0.6rem)]'}
                                        `}>
                                            {/* Category Header */}
                                            <div className="bg-[#618cc7] text-white px-3 py-2 text-sm font-medium text-center relative h-auto flex items-center justify-center gap-1 leading-snug break-words">
                                                <EditableText 
                                                    text={category.title} 
                                                    onSave={(val) => updateCategoryTitle(column.id, section.id, category.id, val)}
                                                    multiline={true}
                                                    className="hover:bg-white/20 text-center block"
                                                />
                                                <CountSlot 
                                                  value={catSum}
                                                  onSave={(val) => updateCategoryCountOverride(column.id, section.id, category.id, val)}
                                                  isOverridden={isCatOverridden}
                                                  className="whitespace-nowrap"
                                                />
                                                <div className="absolute right-1 top-1 opacity-0 group-hover/card:opacity-100 flex gap-1 bg-[#618cc7]">
                                                    <IconButton 
                                                        icon={Icons.Trash} 
                                                        className="text-white hover:text-red-200" 
                                                        onClick={(e) => { e.stopPropagation(); deleteCategory(column.id, section.id, category.id); }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            {/* Items */}
                                            <div className="bg-white p-2 flex-1 min-h-[50px] flex flex-col gap-2">
                                                {category.items.map((item) => {
                                                    const { name, count } = parseItemString(item.text);

                                                    return (
                                                    <div key={item.id} 
                                                        className="border border-gray-100 rounded px-2 py-1.5 text-xs text-gray-700 bg-gray-50 flex items-start justify-between gap-1 group/item hover:border-blue-200 resize-both overflow-auto min-h-[32px] w-full export-no-scroll"
                                                    >
                                                      <div className="flex-1 min-w-0 text-left leading-snug">
                                                          <span className="break-words align-baseline">
                                                            <EditableText 
                                                                text={name} 
                                                                onSave={(val) => updateItemName(column.id, section.id, category.id, item.id, val)}
                                                                className="inline"
                                                                multiline={true}
                                                            />
                                                          </span>
                                                          <CountSlot 
                                                            value={count}
                                                            onSave={(val) => updateItemCount(column.id, section.id, category.id, item.id, val)}
                                                            className="text-gray-500 inline-block ml-1 align-baseline"
                                                          />
                                                      </div>
                                                      <IconButton 
                                                          icon={Icons.Trash} 
                                                          className="opacity-0 group-hover/item:opacity-100 scale-75 flex-shrink-0 mt-0.5"
                                                          variant="danger"
                                                          onClick={() => deleteItem(column.id, section.id, category.id, item.id)}
                                                      />
                                                    </div>
                                                );
                                                })}
                                                <button 
                                                onClick={() => addItem(column.id, section.id, category.id)}
                                                className="text-center text-xs text-blue-400 hover:text-blue-600 hover:bg-blue-50 py-1 rounded border border-dashed border-blue-200 mt-auto no-export w-full"
                                                >
                                                +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                    })}
                                    
                                    <button 
                                        onClick={() => addCategory(column.id, section.id)}
                                        className={`
                                            border border-dashed border-blue-300 rounded flex items-center justify-center p-4 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors min-h-[100px] no-export
                                            ${isSingle ? 'w-full' : 'w-[calc(50%-0.5rem)]'}
                                        `}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Icons.Plus size={20} />
                                            <span className="text-xs">Add</span>
                                        </div>
                                    </button>
                                    </div>
                                </div>
                            );
                            })}

                            <button 
                                onClick={() => addSection(column.id)}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-300 hover:bg-white transition-all no-export"
                            >
                                <span className="font-medium flex items-center gap-2">
                                    <Icons.Plus /> Add Group
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Arrow between columns */}
                    {colIndex < data.columns.length - 1 && (
                       <div className={`flex items-center justify-center pointer-events-none shrink-0 ${
                           layout === 'horizontal' ? 'w-10' : 'h-10 w-full'
                       }`}>
                           <div 
                             className={`w-0 h-0 border-solid drop-shadow-sm ${
                               layout === 'horizontal' 
                                 ? 'border-t-[18px] border-t-transparent border-b-[18px] border-b-transparent border-l-[30px] border-l-[#bfdbfe]'
                                 : 'border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[30px] border-t-[#bfdbfe]'
                             }`}
                           />
                       </div>
                    )}
                </React.Fragment>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;