/** Runtime-owned helpers must never become project content or disposable gameplay copies. */
export function isEditorOnlyNode(node) {
  return Boolean(node?._studioEditorOnly) || node?.name === 'EditorGrid' || node?.name === 'EditorCamera';
}
