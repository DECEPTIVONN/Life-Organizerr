import React, { useState, useRef } from 'react';
import { 
  Archive, 
  Search, 
  UploadCloud, 
  File, 
  Trash2, 
  Download, 
  Tag, 
  Folder,
  X,
  FileText,
  AlertCircle,
  Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ArchivedDocument } from '../types';

interface DocumentsViewProps {
  documents: ArchivedDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<ArchivedDocument[]>>;
  addXp: (amount: number) => void;
}

export default function DocumentsView({ documents, setDocuments, addXp }: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState('Pessoal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Todos', 'Pessoal', 'Financeiro', 'Estudos', 'Trabalho', 'Contratos', 'Outros'];

  // Handle Drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Process uploaded mock files
  const processFiles = (files: FileList) => {
    setIsUploading(true);
    
    // Simulate minor network lag
    setTimeout(() => {
      const newDocs: ArchivedDocument[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Calculate readable file size
        const sizeInMb = file.size / (1024 * 1024);
        const formattedSize = sizeInMb < 0.1 
          ? `${Math.round(file.size / 1024)} KB` 
          : `${sizeInMb.toFixed(1)} MB`;

        newDocs.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          category: customCategory,
          date: new Date().toISOString().split('T')[0],
          size: formattedSize
        });
      }

      setDocuments(prev => [...newDocs, ...prev]);
      setIsUploading(false);
      setIsDragActive(false);
      
      // Reward XP for life organization
      addXp(25);
    }, 800);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  // Filter and search
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="documents-view" className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Archive className="h-6 w-6 text-orange-500" />
          Arquivamento de Documentos
        </h1>
        <p className="text-gray-400 text-xs mt-1">
          Guarde, filtre e organize seus comprovantes, PDFs e contratos importantes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone (Left Column) */}
        <div className="space-y-4">
          <div className="bg-[#0a0a0c]/40 p-5 rounded-2xl border border-zinc-800 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Enviar Novo Arquivo
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Selecione a categoria padrão do lote antes do envio
              </p>
            </div>

            {/* Category Selector for upload */}
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 font-bold block mb-1 uppercase">Categoria do Lote</label>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-orange-500/50"
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              onPaste={(e) => {
                const files = e.clipboardData?.files;
                if (files && files.length > 0) {
                  e.preventDefault();
                  processFiles(files);
                }
              }}
              tabIndex={0}
              className={`h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all outline-none focus:border-orange-500 ${
                isDragActive
                  ? 'border-orange-500 bg-orange-500/5'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
              />
              {isUploading ? (
                <div className="space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500 mx-auto" />
                  <p className="text-xs text-orange-500 font-bold">Arquivando documentos...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="h-10 w-10 text-gray-500 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-white">Arraste seus arquivos aqui</p>
                  <p className="text-[10px] text-gray-500">ou clique para navegar no sistema <span className="text-orange-500 font-bold">(Suporta Ctrl+V)</span></p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  if (navigator.clipboard && navigator.clipboard.read) {
                    const items = await navigator.clipboard.read();
                    const filesList: File[] = [];
                    for (const item of items) {
                      for (const type of item.types) {
                        const blob = await item.getType(type);
                        const file = new File([blob], `clipboard-file-${Date.now()}.${type.split('/')[1] || 'bin'}`, { type });
                        filesList.push(file);
                      }
                    }
                    if (filesList.length > 0) {
                      const container = new DataTransfer();
                      filesList.forEach(f => container.items.add(f));
                      processFiles(container.files);
                    }
                  }
                } catch (err) {
                  console.error('Clipboard files paste failed:', err);
                }
              }}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 hover:border-amber-500/40 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clipboard className="h-4 w-4 text-amber-400" />
              <span>Colar Arquivo / Imagem da Área de Transferência</span>
            </button>

            <div className="flex items-start gap-2 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10 text-[10px] text-gray-400">
              <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <span>Ganha +25 XP para cada lote de arquivos organizados para incentivar a produtividade e ordem.</span>
            </div>
          </div>
        </div>

        {/* Documents list & search (Right 2/3 Column) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Row */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Quick Categories Filter */}
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto py-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-950 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Documents */}
          <div className="space-y-2">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/10 rounded-2xl border border-zinc-900">
                <Folder className="h-10 w-10 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Nenhum documento arquivado ou correspondente à busca.</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  className="p-4 bg-[#0a0a0c]/40 hover:bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between gap-4 group transition-all"
                  layout
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2.5 bg-zinc-900 border border-zinc-800 text-orange-500 rounded-lg">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-white truncate" title={doc.name}>{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono text-gray-500">{doc.date}</span>
                        <span className="text-gray-700">•</span>
                        <span className="text-[9px] font-mono text-gray-500">{doc.size}</span>
                        <span className="text-gray-700">•</span>
                        <span className="text-[9px] font-bold uppercase text-orange-500 bg-orange-500/10 px-1.5 py-0.2 rounded font-mono">
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        // Simulated safe download triggering a alert-free action
                        const link = document.createElement('a');
                        link.href = '#';
                        link.setAttribute('download', doc.name);
                        link.click();
                      }}
                      className="p-1.5 text-gray-400 hover:text-white bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors"
                      title="Download Simulado"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-gray-500 hover:text-red-500 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
