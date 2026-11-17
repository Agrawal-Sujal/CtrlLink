import { UrlStatsResponse } from '../types/url';

export interface FolderTreeNode {
  id: string; // e.g. "root", "youtube", "project", "project/ctrllink"
  name: string; // e.g. "Root", "youtube", "project", "ctrllink"
  fullPath: string; // e.g. "", "youtube", "project", "project/ctrllink"
  isRoot: boolean;
  parentId: string | null;
  children: FolderTreeNode[];
  customUrlsCount: number;
  autoUrlsCount: number;
  totalUrlsCount: number;
  urls: UrlStatsResponse[];
  depth: number;
  x?: number;
  y?: number;
}

export interface TreeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  d: string;
}

export interface TreeLayoutResult {
  root: FolderTreeNode;
  nodes: FolderTreeNode[];
  edges: TreeEdge[];
  canvasWidth: number;
  canvasHeight: number;
}

const STORAGE_KEY_PREFIX = 'ctrllink_folders_user_';

export function getStoredFolders(userId?: number | string | null): string[] {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredFolders(userId: number | string | null | undefined, folders: string[]): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
    // Deduplicate and normalize
    const cleaned = Array.from(new Set(folders.map((f) => f.trim().toLowerCase()).filter(Boolean)));
    localStorage.setItem(key, JSON.stringify(cleaned));
  } catch {
    // Ignore storage quota errors
  }
}

export function addStoredFolder(userId: number | string | null | undefined, folderPath: string): string[] {
  const current = getStoredFolders(userId);
  const normalized = folderPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  if (!normalized || current.includes(normalized)) return current;
  const updated = [...current, normalized];
  saveStoredFolders(userId, updated);
  return updated;
}

export function removeStoredFolder(userId: number | string | null | undefined, folderPath: string): string[] {
  const current = getStoredFolders(userId);
  const normalized = folderPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  // Remove this folder and any subfolders of it
  const updated = current.filter(
    (f) => f !== normalized && !f.startsWith(normalized + '/')
  );
  saveStoredFolders(userId, updated);
  return updated;
}

export function isCustomUrl(url: UrlStatsResponse): boolean {
  if (url.custom !== undefined) return Boolean(url.custom);
  if (url.isCustom !== undefined) return Boolean(url.isCustom);
  // Fallback: if shortId contains numbers & uppercase/lowercase mix typical of Base62
  // or customPath differs from shortId with custom alias
  return false;
}

/**
 * Builds a hierarchical tree from a flat list of URLs and user-defined empty folders.
 */
export function buildFolderTree(
  links: UrlStatsResponse[],
  storedFolders: string[] = []
): FolderTreeNode {
  const nodeMap = new Map<string, FolderTreeNode>();

  // 1. Initialize root node
  const rootNode: FolderTreeNode = {
    id: 'root',
    name: 'Root',
    fullPath: '',
    isRoot: true,
    parentId: null,
    children: [],
    customUrlsCount: 0,
    autoUrlsCount: 0,
    totalUrlsCount: 0,
    urls: [],
    depth: 0,
  };
  nodeMap.set('root', rootNode);

  // Helper to ensure a folder path exists in nodeMap and is linked to its parent
  const ensureFolderNode = (folderPath: string): FolderTreeNode => {
    const cleanPath = folderPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    if (!cleanPath) return rootNode;

    if (nodeMap.has(cleanPath)) {
      return nodeMap.get(cleanPath)!;
    }

    const segments = cleanPath.split('/');
    const folderName = segments[segments.length - 1];
    const parentPath = segments.slice(0, -1).join('/');

    const parentNode = parentPath ? ensureFolderNode(parentPath) : rootNode;

    const newNode: FolderTreeNode = {
      id: cleanPath,
      name: folderName,
      fullPath: cleanPath,
      isRoot: false,
      parentId: parentNode.id,
      children: [],
      customUrlsCount: 0,
      autoUrlsCount: 0,
      totalUrlsCount: 0,
      urls: [],
      depth: segments.length,
    };

    nodeMap.set(cleanPath, newNode);
    parentNode.children.push(newNode);
    return newNode;
  };

  // 2. Register all stored folders (even if empty)
  for (const stored of storedFolders) {
    if (stored && stored.trim()) {
      ensureFolderNode(stored.trim());
    }
  }

  // 3. Process all links and place them in appropriate folder nodes
  for (const link of links) {
    const isCustom = isCustomUrl(link);
    const customPath = (link.customPath || link.shortId || '').trim();

    if (!customPath.includes('/')) {
      // Direct child of Root
      rootNode.urls.push(link);
      rootNode.totalUrlsCount++;
      if (isCustom) {
        rootNode.customUrlsCount++;
      } else {
        rootNode.autoUrlsCount++;
      }
    } else {
      // Nested under folders: e.g. "youtube/project/ctrllink"
      const segments = customPath.split('/');
      const folderSegments = segments.slice(0, -1);
      const folderPath = folderSegments.join('/');

      const folderNode = ensureFolderNode(folderPath);
      folderNode.urls.push(link);
      folderNode.totalUrlsCount++;
      if (isCustom) {
        folderNode.customUrlsCount++;
      } else {
        folderNode.autoUrlsCount++;
      }
    }
  }

  // Sort children alphabetically by name for deterministic rendering
  for (const node of nodeMap.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
  }

  return rootNode;
}

/**
 * Calculates (x, y) coordinates for all nodes in the tree
 * and builds smooth cubic bezier SVG paths with arrowheads between parent and child nodes.
 */
export function computeTreeLayout(
  root: FolderTreeNode,
  nodeWidth = 260,
  nodeHeight = 136,
  levelGap = 120,
  siblingGap = 32
): TreeLayoutResult {
  const allNodes: FolderTreeNode[] = [];
  const edges: TreeEdge[] = [];

  let currentLeafY = 40;

  // Post/pre-order traversal to position nodes nicely
  function positionNode(node: FolderTreeNode, depth: number): void {
    node.depth = depth;
    node.x = 40 + depth * (nodeWidth + levelGap);

    if (node.children.length === 0) {
      node.y = currentLeafY;
      currentLeafY += nodeHeight + siblingGap;
    } else {
      for (const child of node.children) {
        positionNode(child, depth + 1);
      }
      const firstChildY = node.children[0].y ?? 0;
      const lastChildY = node.children[node.children.length - 1].y ?? 0;
      node.y = (firstChildY + lastChildY) / 2;
    }

    allNodes.push(node);
  }

  positionNode(root, 0);

  // Generate edges with cubic bezier curves
  for (const node of allNodes) {
    if (node.children.length > 0) {
      const startX = (node.x ?? 0) + nodeWidth;
      const startY = (node.y ?? 0) + nodeHeight / 2;

      for (const child of node.children) {
        const endX = child.x ?? 0;
        const endY = (child.y ?? 0) + nodeHeight / 2;
        const dx = endX - startX;

        // Smooth cubic bezier with midpoint inflection
        const cp1x = startX + dx * 0.45;
        const cp1y = startY;
        const cp2x = endX - dx * 0.45;
        const cp2y = endY;

        const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
        edges.push({
          id: `${node.id}->${child.id}`,
          sourceId: node.id,
          targetId: child.id,
          d,
        });
      }
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of allNodes) {
    maxX = Math.max(maxX, (n.x ?? 0) + nodeWidth + 60);
    maxY = Math.max(maxY, (n.y ?? 0) + nodeHeight + 60);
  }

  return {
    root,
    nodes: allNodes,
    edges,
    canvasWidth: Math.max(maxX, 900),
    canvasHeight: Math.max(maxY, 500),
  };
}
