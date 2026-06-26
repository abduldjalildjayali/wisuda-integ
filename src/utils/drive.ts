/**
 * Utility to convert Google Drive sharing links into direct image links
 * that can be rendered inside standard <img> tags.
 */
export function getGoogleDriveDirectLink(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  const cleanUrl = url.trim();
  if (!cleanUrl) return undefined;
  
  // If it's not a Google Drive URL, return it as-is
  if (!cleanUrl.includes("drive.google.com") && !cleanUrl.includes("docs.google.com")) {
    return cleanUrl;
  }
  
  // Match standard file path format: /file/d/{FILE_ID}/view...
  const fileDMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }
  
  // Match query parameter format: ?id={FILE_ID} or &id={FILE_ID}
  const idMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }
  
  // Fallback
  return cleanUrl;
}
