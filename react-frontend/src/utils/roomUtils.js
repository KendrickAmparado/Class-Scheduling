// Shared room utilities: normalization and display helpers
export const normalizeRoomName = (name) => {
  if (!name) return '';
  let s = String(name).trim().toUpperCase();
  // Remove common prefixes like 'ROOM', 'RM', 'R.'
  s = s.replace(/^ROOM\s+|^RM\s+|^R\.\s+/i, '');
  // Remove non-alphanumeric characters
  s = s.replace(/[^A-Z0-9]/g, '');
  return s;
};

// Format label for UI display: collapse whitespace and capitalize words
export const formatRoomLabel = (raw) => {
  if (!raw) return '';
  const s = String(raw).trim().replace(/\s+/g, ' ');
  // Keep original casing but trim; for stricter consistency you could uppercase
  return s;
};
const roomUtils = { normalizeRoomName, formatRoomLabel };

export default roomUtils;
