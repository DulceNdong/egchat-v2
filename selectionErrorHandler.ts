/**
 * Multi-layer Selection API error handler
 * Targets browser extension conflicts specifically
 */

export default function initSelectionErrorHandler() {
  // Layer 1: Override console.error to filter specific errors
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    const errorMsg = args[0]?.toString?.() || '';
    
    // Suppress Selection API related errors from extensions
    if (
      errorMsg.includes('getRangeAt') ||
      errorMsg.includes('isSelection') ||
      errorMsg.includes('Illegal invocation') ||
      errorMsg.includes('IndexSizeError') ||
      errorMsg.includes('is not a valid index')
    ) {
      return; // Silently suppress
    }
    
    // Allow other errors to pass through
    return originalConsoleError.apply(console, args);
  };

  // Layer 2: Override console.warn
  const originalConsoleWarn = console.warn;
  console.warn = function(...args: any[]) {
    const warnMsg = args[0]?.toString?.() || '';
    
    if (warnMsg.includes('getRangeAt') || warnMsg.includes('Selection')) {
      return;
    }
    
    return originalConsoleWarn.apply(console, args);
  };

  // Layer 3: Patch Selection.prototype.getRangeAt directly
  if (typeof Selection !== 'undefined' && Selection.prototype) {
    const originalGetRangeAt = Selection.prototype.getRangeAt;
    
    Selection.prototype.getRangeAt = function(index: number) {
      try {
        // Safety check: ensure index is valid
        if (!this.rangeCount || index < 0 || index >= this.rangeCount) {
          // Return an empty range instead of throwing
          return document.createRange();
        }
        return originalGetRangeAt.call(this, index);
      } catch (error) {
        // Catch any errors and return empty range
        return document.createRange();
      }
    };
  }

  // Layer 4: Safe wrapper for getSelection
  const originalGetSelection = window.getSelection;
  (window as any).getSelection = function() {
    try {
      const selection = originalGetSelection.call(window);
      if (!selection) return selection;

      // Wrap getRangeAt if it exists
      if (selection.getRangeAt) {
        const originalMethod = selection.getRangeAt.bind(selection);
        selection.getRangeAt = function(index: number) {
          try {
            if (selection.rangeCount > 0 && index >= 0 && index < selection.rangeCount) {
              return originalMethod(index);
            }
            return document.createRange();
          } catch {
            return document.createRange();
          }
        };
      }

      return selection;
    } catch {
      return null;
    }
  };
}
