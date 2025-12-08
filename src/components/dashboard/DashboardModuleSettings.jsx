import React, { useMemo, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, label, enabled, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
      <div className="flex items-center gap-3">
        <button className="cursor-grab text-white/60" {...attributes} {...listeners} aria-label="Drag">⋮⋮</button>
        <span className="text-white/80 text-sm">{label}</span>
      </div>
      <label className="flex items-center gap-2 text-xs text-white/70">
        <input type="checkbox" checked={enabled} onChange={onToggle} />
        Enabled
      </label>
    </div>
  );
}

export default function DashboardModuleSettings({ open, onClose, modules, setModules }) {
  const [items, setItems] = useState(modules);

  React.useEffect(() => setItems(modules), [modules]);

  const labels = useMemo(() => ({
    sleep: 'Sleep Summary',
    habits: 'Habit Checklist',
    pillars: 'Pillar Progress',
    readiness: 'Daily Readiness',
    trends: 'Weekly Trends',
    actions: 'Quick Actions',
  }), []);

  if (!open) return null;

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleSave = () => {
    setModules(items);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b1220] border border-white/10 shadow-xl p-5">
        <div className="text-white text-lg font-semibold">Customize Dashboard</div>
        <div className="mt-1 text-white/60 text-sm">Show/hide and reorder modules.</div>

        <div className="mt-4 space-y-2">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  label={labels[item.id] ?? item.id}
                  enabled={item.enabled}
                  onToggle={() => setItems(items.map(i => i.id === item.id ? { ...i, enabled: !i.enabled } : i))}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="px-3 py-2 rounded-xl bg-white/10 text-white/80" onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
