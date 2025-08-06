"use client";

import { useRef, useEffect, useCallback } from 'react';

export function useDraggableScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const onMouseDown = useCallback((e: MouseEvent) => {
    const ele = ref.current;
    if (!ele) return;

    // Do not start dragging if the target is an interactive element
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], input, select, textarea')) {
      return;
    }
    
    // Prevents default drag behavior, like dragging an image or text selection.
    e.preventDefault();
    
    const initialPos = {
      scrollLeft: ele.scrollLeft,
      scrollTop: ele.scrollTop,
      x: e.clientX,
      y: e.clientY,
    };

    ele.style.cursor = 'grabbing';
    ele.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - initialPos.x;
      const dy = e.clientY - initialPos.y;
      ele.scrollTop = initialPos.scrollTop - dy;
      ele.scrollLeft = initialPos.scrollLeft - dx;
    };

    const onMouseUp = () => {
      ele.style.cursor = 'grab';
      ele.style.removeProperty('user-select');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (element) {
      element.style.cursor = 'grab';
      element.addEventListener('mousedown', onMouseDown);
    }
    
    return () => {
      if (element) {
        // Make sure to clean up listeners on the element
        element.removeEventListener('mousedown', onMouseDown);
      }
    };
  }, [onMouseDown]);

  return ref;
};
