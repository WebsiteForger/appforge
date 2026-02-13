/**
 * Capture a screenshot of the preview iframe.
 * Returns a base64 data URL of the screenshot.
 */
export async function capturePreviewScreenshot(
  fullPage: boolean = false,
): Promise<string | null> {
  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
  if (!iframe) return null;

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc?.body) return null;

    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(iframeDoc.body, {
      useCORS: true,
      allowTaint: true,
      scrollY: fullPage ? undefined : 0,
      windowHeight: fullPage
        ? iframeDoc.body.scrollHeight
        : iframe.clientHeight,
      width: iframe.clientWidth,
      height: fullPage ? iframeDoc.body.scrollHeight : iframe.clientHeight,
      backgroundColor: null,
    });

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn('Screenshot capture failed:', err);

    // Fallback: try to get DOM structure as text description
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc?.body) {
        return `[Screenshot unavailable. DOM structure: ${iframeDoc.body.innerHTML.slice(0, 2000)}]`;
      }
    } catch {
      // ignore
    }

    return null;
  }
}
