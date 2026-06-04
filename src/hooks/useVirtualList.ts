/**
 * useVirtualList.ts  —  FASE 9: Rendimiento
 *
 * Virtualización ligera de listas sin dependencias externas.
 * Solo renderiza los elementos visibles + un overscan buffer.
 *
 * Para listas de mensajes con muchos elementos (>100):
 *  - Sin esto: 1000 mensajes = 1000 nodos DOM activos
 *  - Con esto: solo ~20-30 nodos DOM independientemente del tamaño
 *
 * Uso:
 *   const { virtualItems, totalHeight, scrollerRef } = useVirtualList({
 *     items: messages,
 *     estimatedItemHeight: 60,
 *   });
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface VirtualItem<T> {
  index:  number;
  item:   T;
  top:    number;
  height: number;
}

export interface UseVirtualListOptions<T> {
  items:               T[];
  estimatedItemHeight: number;
  overscan?:           number;   // elementos extra fuera del viewport
  containerHeight?:    number;   // si se conoce de antemano
}

export interface UseVirtualListReturn<T> {
  virtualItems:  VirtualItem<T>[];
  totalHeight:   number;
  scrollerRef:   React.RefObject<HTMLDivElement>;
  scrollToEnd:   () => void;
  scrollToIndex: (index: number) => void;
}

export function useVirtualList<T>({
  items,
  estimatedItemHeight,
  overscan = 5,
  containerHeight: fixedHeight,
}: UseVirtualListOptions<T>): UseVirtualListReturn<T> {
  const scrollerRef    = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop]   = useState(0);
  const [viewHeight, setViewHeight] = useState(fixedHeight ?? 600);

  // Medir el contenedor
  useEffect(() => {
    if (fixedHeight) return;
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      setViewHeight(entries[0]?.contentRect.height ?? 600);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedHeight]);

  // Escuchar scroll
  const handleScroll = useCallback(() => {
    setScrollTop(scrollerRef.current?.scrollTop ?? 0);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Calcular qué elementos renderizar
  const h         = estimatedItemHeight;
  const totalHeight = items.length * h;
  const startIndex  = Math.max(0, Math.floor(scrollTop / h) - overscan);
  const endIndex    = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + viewHeight) / h) + overscan
  );

  const virtualItems: VirtualItem<T>[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index:  i,
      item:   items[i],
      top:    i * h,
      height: h,
    });
  }

  const scrollToEnd = useCallback(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = index * estimatedItemHeight;
  }, [estimatedItemHeight]);

  return { virtualItems, totalHeight, scrollerRef, scrollToEnd, scrollToIndex };
}
