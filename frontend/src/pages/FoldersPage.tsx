import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FolderTree,
  Link2,
  Zap,
  RefreshCw,
  Folder,
  Layers,
  ListTree,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AlertBanner } from '../components/AlertBanner';
import { FolderTreeCanvas } from '../components/url/FolderTreeCanvas';
import { CreateFolderItemModal } from '../components/url/CreateFolderItemModal';
import { FolderDetailsDrawer } from '../components/url/FolderDetailsDrawer';
import { UrlSuccessModal } from '../components/url/UrlSuccessModal';
import { urlApi, getErrorMessage } from '../services/api';
import { UrlStatsResponse, ShortenResponse } from '../types/url';
import { useAuth } from '../context/AuthContext';
import {
  FolderTreeNode,
  buildFolderTree,
  getStoredFolders,
  addStoredFolder,
  removeStoredFolder,
  isCustomUrl,
} from '../utils/folderTree';

export const FoldersPage: React.FC = () => {
  const { user } = useAuth();

  // Data state
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [storedFolders, setStoredFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View mode: 'canvas' (visual tree matching drawing) vs 'list' (nested explorer list)
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  // Selected folder for details drawer
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTargetFolder, setCreateModalTargetFolder] = useState<string>('');

  // Success modal
  const [successModalData, setSuccessModalData] = useState<ShortenResponse | null>(null);

  // Global alert
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // 1. Load user stored folders from localStorage
  const loadStoredFolders = useCallback(() => {
    const list = getStoredFolders(user?.email);
    setStoredFolders(list);
  }, [user?.email]);

  // 2. Load user links from backend
  const fetchLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch up to 1000 links to build complete hierarchy tree
      const data = await urlApi.getMyLinks('', 0, 1000);
      setLinks(data.content || []);
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: 'Failed to load links: ' + getErrorMessage(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredFolders();
    fetchLinks();
  }, [loadStoredFolders, fetchLinks]);

  // 3. Build tree
  const treeRoot = useMemo(() => {
    return buildFolderTree(links, storedFolders);
  }, [links, storedFolders]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalCustom = 0;
    let totalAuto = 0;
    const folderPaths = new Set<string>();

    for (const link of links) {
      if (isCustomUrl(link)) {
        totalCustom++;
      } else {
        totalAuto++;
      }
      if (link.customPath && link.customPath.includes('/')) {
        const segs = link.customPath.split('/').slice(0, -1);
        for (let i = 1; i <= segs.length; i++) {
          folderPaths.add(segs.slice(0, i).join('/'));
        }
      }
    }

    for (const sf of storedFolders) {
      if (sf) {
        const segs = sf.split('/');
        for (let i = 1; i <= segs.length; i++) {
          folderPaths.add(segs.slice(0, i).join('/'));
        }
      }
    }

    return {
      totalFolders: folderPaths.size,
      totalCustom,
      totalAuto,
      totalLinks: links.length,
    };
  }, [links, storedFolders]);

  // Find currently selected node in tree
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    const findNode = (curr: FolderTreeNode): FolderTreeNode | null => {
      if (curr.id === selectedNodeId) return curr;
      for (const child of curr.children) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };
    return findNode(treeRoot);
  }, [selectedNodeId, treeRoot]);

  // Handle clicking on a node
  const handleSelectNode = (node: FolderTreeNode) => {
    setSelectedNodeId(node.id);
    setIsDrawerOpen(true);
  };

  // Handle clicking '+' on a node or top header
  const handleOpenCreateModal = (targetFolder: string) => {
    setCreateModalTargetFolder(targetFolder);
    setIsCreateModalOpen(true);
  };

  // Handle creating a new folder
  const handleFolderCreated = (newFolderPath: string) => {
    const updated = addStoredFolder(user?.email, newFolderPath);
    setStoredFolders(updated);
    setAlert({
      type: 'success',
      message: `Folder "/${newFolderPath}" created successfully.`,
    });
    // Auto-select new folder
    setSelectedNodeId(newFolderPath);
  };

  // Handle deleting an empty folder
  const handleDeleteFolder = (folderPath: string) => {
    const updated = removeStoredFolder(user?.email, folderPath);
    setStoredFolders(updated);
    if (selectedNodeId === folderPath) {
      setSelectedNodeId(null);
      setIsDrawerOpen(false);
    }
    setAlert({
      type: 'info',
      message: `Folder "/${folderPath}" removed.`,
    });
  };

  // Handle URL creation success
  const handleUrlCreated = (res: ShortenResponse) => {
    fetchLinks();
    setSuccessModalData(res);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignore
    }
  };

  // Handle URL deletion from drawer
  const handleDeleteUrl = async (shortId: string) => {
    try {
      await urlApi.deleteUrl(shortId);
      setAlert({
        type: 'success',
        message: 'Short link deleted successfully.',
      });
      await fetchLinks();
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: 'Could not delete link: ' + getErrorMessage(err),
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <FolderTree className="w-4.5 h-4.5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Folder Hierarchy
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Visually map and organize your short links into custom nested folders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchLinks()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh tree data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal('')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Item</span>
            </button>
          </div>
        </div>

        {/* Global Alert */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Folders */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Folders
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalFolders}
              </div>
            </div>
          </div>

          {/* Card 2: Custom URLs */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Custom URLs
              </div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {stats.totalCustom}
              </div>
            </div>
          </div>

          {/* Card 3: Auto-generated URLs */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 fill-emerald-600/20" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Auto URLs
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.totalAuto}
              </div>
            </div>
          </div>

          {/* Card 4: Total Links */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Links
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {stats.totalLinks}
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Visual Tree Diagram</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Explorer List</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Organized hierarchically with directed arrows from Root
          </div>
        </div>

        {/* Canvas or List View */}
        {viewMode === 'canvas' ? (
          <FolderTreeCanvas
            root={treeRoot}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            onPlusClick={handleOpenCreateModal}
            onDeleteFolder={handleDeleteFolder}
          />
        ) : (
          /* Explorer List View */
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Folder Directory
              </h2>
              <button
                type="button"
                onClick={() => handleOpenCreateModal('')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Add Root Item
              </button>
            </div>

            <RecursiveNodeList
              node={treeRoot}
              onSelect={handleSelectNode}
              onPlus={handleOpenCreateModal}
              selectedId={selectedNodeId}
            />
          </div>
        )}

        {/* Create Item Modal */}
        <CreateFolderItemModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          targetFolder={createModalTargetFolder}
          onFolderCreated={handleFolderCreated}
          onUrlCreated={handleUrlCreated}
        />

        {/* Folder Details Drawer */}
        <FolderDetailsDrawer
          node={selectedNode}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpenCreateModal={handleOpenCreateModal}
          onDeleteFolder={handleDeleteFolder}
          onDeleteUrl={handleDeleteUrl}
          onSelectSubfolder={(subPath) => setSelectedNodeId(subPath)}
        />

        {/* URL Success Modal */}
        {successModalData && (
          <UrlSuccessModal
            url={successModalData}
            isOpen={Boolean(successModalData)}
            onClose={() => setSuccessModalData(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

// Helper component for Recursive List view
interface RecursiveNodeListProps {
  node: FolderTreeNode;
  onSelect: (node: FolderTreeNode) => void;
  onPlus: (folderPath: string) => void;
  selectedId: string | null;
}

const RecursiveNodeList: React.FC<RecursiveNodeListProps> = ({
  node,
  onSelect,
  onPlus,
  selectedId,
}) => {
  const isSelected = selectedId === node.id;

  return (
    <div className="space-y-1">
      <div
        onClick={() => onSelect(node)}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
          isSelected
            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
            : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-bold">{node.name}</span>
          <span className="text-[10px] font-mono text-slate-400">
            {node.isRoot ? '/' : `/${node.fullPath}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            {node.customUrlsCount} Custom
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            {node.autoUrlsCount} Auto
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlus(node.fullPath);
            }}
            className="p-1 rounded-md text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            title="Add item in this folder"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-1 my-1">
          {node.children.map((child) => (
            <RecursiveNodeList
              key={child.id}
              node={child}
              onSelect={onSelect}
              onPlus={onPlus}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
