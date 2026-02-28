// /opt/gpti/gpti-site/components/FileExplorer.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  onFileSelect?: (filePath: string) => void;
  selectedPath?: string;
}

export function FileExplorer({ onFileSelect, selectedPath }: FileExplorerProps) {
  const [roots, setRoots] = useState<FileNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoots();
  }, []);

  const fetchRoots = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/file-explorer/');
      const data = await res.json();
      setRoots(data.roots || []);
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'directory') {
      toggleExpand(node.path);
    } else if (onFileSelect) {
      onFileSelect(node.path);
    }
  };

  const FileTreeNode = ({ node, depth = 0 }: { node: FileNode; depth?: number }) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="select-none">
        <div
          onClick={() => handleFileClick(node)}
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer rounded ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.type === 'directory' && (
            <span className="w-4 h-4 flex items-center justify-center">
              {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </span>
          )}
          
          {node.type === 'directory' ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-yellow-500" />
            ) : (
              <Folder size={16} className="text-yellow-500" />
            )
          ) : (
            <File size={16} className="text-gray-400" />
          )}

          <span className="text-sm truncate flex-1">{node.name}</span>

          {node.type === 'file' && node.size && (
            <span className="text-xs text-gray-400">
              {formatFileSize(node.size)}
            </span>
          )}
        </div>

        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-sm">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">📁 Workspace Explorer</h3>
      </div>
      <div className="p-2">
        {roots.map((root) => (
          <FileTreeNode key={root.path} node={root} />
        ))}
      </div>
    </div>
  );
}
