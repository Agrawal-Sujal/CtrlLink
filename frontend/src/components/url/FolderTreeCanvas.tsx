import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Maximize2,
  Minimize2,
  Hand,
  MousePointer,
  Crosshair,
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

  // Canvas Viewport Transform State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 60 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'select' | 'hand'>('hand');

  // Drag tracking refs
  const dragStartRef = useRef<{ clientX: number; clientY: number }>({ clientX: 0, clientY: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 60, y: 60 });
  const hasMovedRef = useRef<boolean>(false);

  // Compute layout (nodes with x, y and curved bezier edges)
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 136;
  const layout = computeTreeLayout(root, NODE_WIDTH, NODE_HEIGHT, 130, 36);

  // Reset View
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 60, y: 60 });
  }, []);

  // Fit to screen
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const padding = 80;
    const scaleX = (clientWidth - padding) / layout.canvasWidth;
    const scaleY = (clientHeight - padding) / layout.canvasHeight;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.4), 1.2);
    const roundedScale = Math.round(fitScale * 100) / 100;

    const centeredX = Math.max((clientWidth - layout.canvasWidth * roundedScale) / 2, 40);
    const centeredY = Math.max((clientHeight - layout.canvasHeight * roundedScale) / 2, 40);

    setZoom(roundedScale);
    setPan({ x: centeredX, y: centeredY });
  }, [layout.canvasWidth, layout.canvasHeight]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(Math.round((z + 0.15) * 100) / 100, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(Math.round((z - 0.15) * 100) / 100, 0.3));
  };

  // Intercept wheel/pinch events strictly inside canvas container to prevent browser page zoom!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // Prevent browser viewport zoom (which zooms sidebar and rest of webpage)
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom gesture on trackpad or Ctrl+MouseWheel
        const zoomDelta = -e.deltaY * 0.005;
        setZoom((prevZoom) => {
          const next = Math.min(Math.max(prevZoom + zoomDelta, 0.3), 2.5);
          return Math.round(next * 100) / 100;
        });
      } else {
        // Two-finger trackpad scroll or regular mousewheel: pan the canvas
        setPan((prevPan) => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Listen for Escape key to exit fullscreen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMaximized]);

  // Global mouseup listener while panning
  useEffect(() => {
    if (!isPanning) return;
    const onGlobalMouseUp = () => setIsPanning(false);
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [isPanning]);

  // Mouse pan / hand tool drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or left click on background or when hand tool is active
    if (e.button === 1 || activeTool === 'hand' || !(e.target as HTMLElement).closest('.interactive-node-action')) {
      setIsPanning(true);
      hasMovedRef.current = false;
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
      startPanRef.current = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    setPan({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      className={
        isMaximized
          ? 'fixed inset-0 z-50 bg-slate-100 dark:bg-[#0B0F17] flex flex-col w-screen h-screen overflow-hidden select-none animate-in fade-in duration-200'
          : 'relative w-full h-[calc(100vh-270px)] min-h-[600px] bg-slate-50/70 dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden select-none transition-all'
      }
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Maximized Header or Canvas Status */}
        <div className="pointer-events-auto flex items-center gap-2 p-1.5 px-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-bold text-slate-800 dark:text-white">
            {isMaximized ? 'Visual Tree Diagram (Full Screen)' : 'Tree Canvas'}
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
            Drag to pan • Scroll to zoom
          </span>
        </div>

        {/* Right: Canvas Tools Toolbar */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md">
          {/* Tool mode: Hand vs Select */}
          <button
            type="button"
            onClick={() => setActiveTool((t) => (t === 'hand' ? 'select' : 'hand'))}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
              activeTool === 'hand'
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={activeTool === 'hand' ? 'Hand / Pan Tool Active' : 'Select Tool Active'}
          >
            {activeTool === 'hand' ? <Hand className="w-4 h-4" /> : <MousePointer className="w-4 h-4" />}
            <span className="hidden md:inline">{activeTool === 'hand' ? 'Hand' : 'Select'}</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Zoom Controls */}
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

          {/* Fit to View */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fit Tree to View"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Reset Zoom & Pan */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset View (100%)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* Maximize / Minimize Button */}
          <button
            type="button"
            onClick={() => setIsMaximized((m) => !m)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              isMaximized
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isMaximized ? 'Exit Full Screen (Esc)' : 'Maximize to Full Page'}
          >
            {isMaximized ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Full Page</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Maximize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Legend */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center gap-3 p-2 px-3 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md text-xs text-slate-500 dark:text-slate-400 pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Custom URLs</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Auto-generated URLs</span>
        </span>
        <span className="text-[11px] text-slate-400">
          • Click card to inspect • Click <span className="font-bold">+</span> to add
        </span>
      </div>

      {/* Main Pan/Zoom Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full relative overflow-hidden ${
          isPanning ? 'cursor-grabbing' : activeTool === 'hand' ? 'cursor-grab' : 'cursor-default'
        }`}
        style={{ touchAction: 'none' }}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            color: '#94a3b8',
          }}
        />

        {/* Transformed Canvas Container (Moves with pan and scales with zoom) */}
        <div
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          className={isPanning ? '' : 'transition-transform duration-75 ease-out'}
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
                onClick={() => {
                  if (!hasMovedRef.current) {
                    onSelectNode(node);
                  }
                }}
                className={`group rounded-2xl p-3.5 border-2 transition-all cursor-pointer shadow-md select-none flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 bg-white dark:bg-[#131C2E] ring-4 ring-blue-500/15 scale-[1.02]'
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
                  <div className="interactive-node-action flex items-center gap-1 shrink-0">
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
