/**
 * Focus trap utility for modals and dialogs
 * Ensures keyboard focus stays within a modal when it's open
 */

export interface FocusTrapOptions {
  /**
   * Element to return focus to when trap is deactivated
   */
  returnFocusElement?: HTMLElement | null;
  /**
   * Additional elements to ignore in focus cycle
   */
  ignoreElements?: HTMLElement[];
}

/**
 * Trap focus within a container element
 * @param container - The container element to trap focus within
 * @param options - Optional configuration
 * @returns Cleanup function to remove focus trap
 */
export function trapFocus(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): () => void {
  const { returnFocusElement, ignoreElements = [] } = options;

  // Get all focusable elements within container
  const getFocusableElements = (): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    // Filter out ignored elements and hidden elements
    return focusable.filter(
      (el) =>
        !ignoreElements.includes(el) &&
        getComputedStyle(el).display !== 'none' &&
        getComputedStyle(el).visibility !== 'hidden'
    );
  };

  // Focus first focusable element
  const focusableElements = getFocusableElements();
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
  }

  // Handle tab key press
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const currentFocusable = getFocusableElements();

    if (currentFocusable.length === 0) return;

    const activeElement = document.activeElement as HTMLElement;
    const firstElement = currentFocusable[0];
    const lastElement = currentFocusable[currentFocusable.length - 1];

    // If shift+tab on first element, move to last
    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }
    // If tab on last element, move to first
    else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  // Handle escape key to close modal
  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      container.dispatchEvent(new CustomEvent('modal-close-request'));
    }
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown as EventListener);
  document.addEventListener('keydown', handleEscape as EventListener);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown as EventListener);
    document.removeEventListener('keydown', handleEscape as EventListener);

    // Return focus to original element
    if (returnFocusElement) {
      returnFocusElement.focus();
    }
  };
}

/**
 * Create a focus trap effect for React components
 * @param isActive - Whether the trap is active
 * @param containerRef - Ref to the container element
 * @param options - Optional configuration
 */
export function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement>,
  options?: FocusTrapOptions
) {
  if (typeof window === 'undefined') return; // SSR guard

  if (isActive && containerRef.current) {
    // Store the currently focused element to return to later
    const previousFocus = document.activeElement as HTMLElement;

    return trapFocus(containerRef.current, {
      returnFocusElement: previousFocus,
      ...options,
    });
  }

  return () => {};
}
