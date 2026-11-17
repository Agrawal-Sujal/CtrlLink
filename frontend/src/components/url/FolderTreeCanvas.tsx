import React, { useState, useRef } from 'react';
import {
  Folder,
  Plus,
  Link2,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Server,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { FolderTreeNode, computeTreeLayout } from '../../utils/folderTree';

interface FolderTreeCanvasProps {
  root: FolderTreeNode;
  selectedNodeId: string | null;
  onSelectNode: (node: FolderTreeNode) => void;
  onPlusClick: (folderPath: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
}

export const FolderTreeCanvas: React.FC<FolderTreeCanvasProps> = ({
  root,
  selectedNodeId,
  onSelectNode,
  onPlusClick,
  onDeleteFolder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);

  // Compute layout (nodes with x, y and curved bezier edges)
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 136;
  const layout = computeTreeLayout(root, NODE_WIDTH, NODE_HEIGHT, 120, 32);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="relative w-full h-[620px] bg-slate-50/60 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden select-none">
      {/* Canvas Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-semibold px-1 text-slate-600 dark:text-slate-400 min-w-[42px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Hint / Legend */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 p-2 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xs text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Custom URLs</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Auto-generated URLs</span>
        </span>
        <span className="text-[11px] text-slate-400">
          • Click card to view contents, click <span className="font-bold">+</span> to add
        </span>
      </div>

      {/* Scrollable / Zoomable Canvas Area */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-auto cursor-grab active:cursor-grabbing p-8"
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            position: 'relative',
          }}
          className="transition-transform duration-100 ease-out"
        >
          {/* SVG Layer for Curved Bezier Arrows */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={layout.canvasWidth}
            height={layout.canvasHeight}
            style={{ width: layout.canvasWidth, height: layout.canvasHeight }}
          >
            <defs>
              <marker
                id="tree-arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-slate-400 dark:fill-slate-500"
                />
              </marker>
            </defs>

            {layout.edges.map((edge) => (
              <path
                key={edge.id}
                d={edge.d}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#tree-arrowhead)"
                className="text-slate-400 dark:text-slate-600 transition-colors"
              />
            ))}
          </svg>

          {/* HTML Nodes Layer */}
          {layout.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const x = node.x ?? 0;
            const y = node.y ?? 0;

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                onClick={() => onSelectNode(node)}
                className={`group rounded-2xl p-3.5 border-2 transition-all cursor-pointer shadow-md select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-[#131C2E] ring-4 ring-blue-500/15'
                    : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#111827] hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-lg'
                }`}
              >
                {/* Node Header: Icon, Name & Plus Button */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        node.isRoot
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {node.isRoot ? (
                        <Server className="w-4 h-4" />
                      ) : (
                        <Folder className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {node.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {node.isRoot ? '/' : `/${node.fullPath}`}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!node.isRoot && node.totalUrlsCount === 0 && node.children.length === 0 && onDeleteFolder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove empty folder "${node.name}"?`)) {
                            onDeleteFolder(node.fullPath);
                          }
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        title="Delete empty folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlusClick(node.fullPath);
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      title={`Add under /${node.fullPath || 'root'}`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Node Body: Custom vs Auto Badges */}
                <div className="grid grid-cols-2 gap-1.5 my-1">
                  {/* Custom URLs Pill */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    <Link2 className="w-3 h-3 -rotate-45 shrink-0" />
                    <span className="text-[11px] font-bold">
                      {node.customUrlsCount} <span className="font-normal text-[10px] opacity-80">Custom</span>
                    </span>
                  </div>

                  {/* Auto URLs Pill */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                    <Zap className="w-3 h-3 fill-emerald-600/20 shrink-0" />
                    <span className="text-[11px] font-bold">
                      {node.autoUrlsCount} <span className="font-normal text-[10px] opacity-80">Auto</span>
                    </span>
                  </div>
                </div>

                {/* Node Footer: Total count & View indicator */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="font-medium text-slate-500 dark:text-slate-400">
                    {node.totalUrlsCount === 0
                      ? 'Empty folder'
                      : `${node.totalUrlsCount} link${node.totalUrlsCount === 1 ? '' : 's'}`}
                  </span>
                  <span className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>View</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
