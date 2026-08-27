import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const DndContextValue = createContext(null);
const noop = () => {};
export class PointerSensor {}
export const closestCorners = () => null;
export function useSensor(sensor, options = {}) { return { sensor, options }; }
export function useSensors(...sensors) { return sensors; }

function normalizeData(data) { return { current: data || {} }; }

export function DndContext({ children, onDragStart = noop, onDragOver = noop, onDragEnd = noop, onDragCancel = noop }) {
  const registry = useRef(new Map());
  const [activeId, setActiveId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const activeRef = useRef(null);
  const overRef = useRef(null);

  const register = useCallback((id, data) => {
    registry.current.set(String(id), data || {});
    return () => registry.current.delete(String(id));
  }, []);

  const identifyOver = useCallback((clientX, clientY) => {
    const element = document.elementFromPoint(clientX, clientY);
    const target = element?.closest?.('[data-dnd-id]');
    if (!target) return null;
    const id = target.getAttribute('data-dnd-id');
    const data = registry.current.get(String(id)) || {};
    return { id, data: normalizeData(data) };
  }, []);

  const finish = useCallback((event, cancelled = false) => {
    const active = activeRef.current;
    if (!active) return;
    const over = cancelled ? null : (identifyOver(event.clientX ?? 0, event.clientY ?? 0) || overRef.current);
    if (cancelled) onDragCancel({ active });
    else onDragEnd({ active, over });
    activeRef.current = null;
    overRef.current = null;
    setActiveId(null);
    setOverId(null);
  }, [identifyOver, onDragCancel, onDragEnd]);

  useEffect(() => {
    const move = (event) => {
      if (!activeRef.current) return;
      event.preventDefault();
      const over = identifyOver(event.clientX, event.clientY);
      overRef.current = over;
      setOverId(over ? String(over.id) : null);
      setPointer({ x: event.clientX, y: event.clientY });
      onDragOver({ active: activeRef.current, over });
    };
    const up = (event) => finish(event, false);
    const cancel = (event) => finish(event, true);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    };
  }, [finish, identifyOver, onDragOver]);

  const start = useCallback((event, id, data) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const active = { id, data: normalizeData(data) };
    activeRef.current = active;
    setActiveId(String(id));
    setPointer({ x: event.clientX, y: event.clientY });
    onDragStart({ active });
    try { event.currentTarget?.setPointerCapture?.(event.pointerId); } catch {}
  }, [onDragStart]);

  const value = useMemo(() => ({ activeId, overId, pointer, register, start }), [activeId, overId, pointer, register, start]);
  return React.createElement(DndContextValue.Provider, { value }, children);
}

export function useDroppable({ id, data }) {
  const context = useContext(DndContextValue);
  const nodeRef = useRef(null);
  const setNodeRef = useCallback((node) => {
    nodeRef.current = node;
    if (node) node.setAttribute('data-dnd-id', String(id));
  }, [id]);
  useEffect(() => context?.register(id, data), [context, data, id]);
  return { setNodeRef, isOver: context?.overId === String(id), active: context?.activeId ? { id: context.activeId } : null };
}

export function useDndSortable({ id, data }) {
  const context = useContext(DndContextValue);
  const setNodeRef = useCallback((node) => {
    if (node) node.setAttribute('data-dnd-id', String(id));
  }, [id]);
  useEffect(() => context?.register(id, data), [context, data, id]);
  const listeners = { onPointerDown: (event) => context?.start(event, id, data) };
  const attributes = { role: 'button', tabIndex: 0, 'aria-roledescription': 'draggable' };
  return { attributes, listeners, setNodeRef, transform: null, transition: undefined, isDragging: context?.activeId === String(id) };
}

export function DragOverlay({ children }) {
  const context = useContext(DndContextValue);
  if (!children || !context?.activeId) return null;
  return React.createElement('div', { className: 'dnd-local-overlay', 'aria-hidden': 'true', style: { left: context.pointer.x, top: context.pointer.y } }, children);
}
