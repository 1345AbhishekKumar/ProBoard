const fs = require('fs');

const files = [
  'hooks/useActions.ts',
  'hooks/useMinimap.ts',
  'hooks/useCanvasEvents.ts',
  'hooks/useCanvasMouseEvents.ts',
  'hooks/useKeyboardEvents.ts',
  'components/Sidebar.tsx',
  'components/Header.tsx',
  'components/Canvas.tsx',
  'components/TrashOverlay.tsx',
  'components/Minimap.tsx',
  'components/ContextMenu.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/\bstate\b/g, 'stateRef');
  content = content.replace(/\bhistory\b/g, 'historyRef');
  content = content.replace(/\bhistoryPtr\b/g, 'historyPtrRef');
  content = content.replace(/\bisDragging\b/g, 'isDraggingRef');
  content = content.replace(/\bdragMode\b/g, 'dragModeRef');
  content = content.replace(/\bdragStart\b/g, 'dragStartRef');
  content = content.replace(/\blastMouse\b/g, 'lastMouseRef');
  content = content.replace(/\bresizeTarget\b/g, 'resizeTargetRef');
  
  fs.writeFileSync(file, content);
});
console.log('Done');
