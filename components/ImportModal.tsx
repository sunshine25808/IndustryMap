import React, { useState, useRef } from 'react';
import { Icons, IconButton } from './Icons';
import * as XLSX from 'xlsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: string[][]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTextImport = () => {
    if (!text.trim()) return;
    const rows = text.split(/\r?\n/).map(row => row.split('\t').map(cell => cell.trim()));
    onImport(rows);
    resetAndClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // Get data as array of arrays
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
      
      // Basic cleanup: remove empty rows
      const cleanData = jsonData.filter(row => row && row.length > 0 && row.some(cell => !!cell));
      
      // Convert all cells to strings to match expected format
      const stringData = cleanData.map(row => row.map(cell => String(cell || '').trim()));

      onImport(stringData);
      resetAndClose();
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.");
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetAndClose = () => {
    setText('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">导入表格数据</h2>
          <IconButton icon={Icons.Trash} variant="ghost" onClick={resetAndClose} className="hover:bg-gray-100 p-2" />
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Excel Upload Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
             <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
               <Icons.Table size={18} /> 方式一：上传 Excel 文件
             </h3>
             <p className="text-sm text-blue-600 mb-3">
               支持 .xlsx 或 .xls 格式。列顺序：产业分布 | 细分产业 | 所属行业 | 具体产品 | 总数
             </p>
             <div className="flex items-center gap-3">
               <input 
                 type="file" 
                 accept=".xlsx, .xls"
                 ref={fileInputRef}
                 onChange={handleFileUpload}
                 className="block w-full text-sm text-slate-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-100 file:text-blue-700
                   hover:file:bg-blue-200
                 "
               />
             </div>
             {fileName && <p className="text-xs text-green-600 mt-2">已选择: {fileName} (正在处理...)</p>}
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">或</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Text Paste Section */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
               <Icons.Layout size={18} /> 方式二：粘贴文本数据
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              从 Excel 复制并粘贴到下方文本框。
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-40 border border-gray-300 rounded p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={`上游\t农业投入与原料生产\t农业资源\t土地资源开发\t14,922\n上游\t农业投入与原料生产\t农业投入品\t种子培育\t388...`}
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button 
            onClick={resetAndClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
          >
            取消
          </button>
          <button 
            onClick={handleTextImport}
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            使用粘贴文本生成
          </button>
        </div>
      </div>
    </div>
  );
};