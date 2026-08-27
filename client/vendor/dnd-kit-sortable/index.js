import React from 'react';
import { useDndSortable } from '@dnd-kit/core';
export const verticalListSortingStrategy = () => null;
export function SortableContext({ children }) { return React.createElement(React.Fragment, null, children); }
export function useSortable(options) { return useDndSortable(options); }
