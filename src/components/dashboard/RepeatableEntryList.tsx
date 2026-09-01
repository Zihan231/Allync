import { CloseIcon, PlusIcon } from "@/components/icons";

export function RepeatableEntryList<T>({
  items,
  onChange,
  max,
  addLabel,
  removeLabel,
  entryLabel,
  emptyEntry,
  renderEntry,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  max: number;
  addLabel: string;
  removeLabel: string;
  entryLabel: (index: number) => string;
  emptyEntry: T;
  renderEntry: (entry: T, onEntryChange: (next: T) => void, index: number) => React.ReactNode;
}) {
  function updateEntry(index: number, next: T) {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  }

  function removeEntry(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function addEntry() {
    if (items.length >= max) return;
    onChange([...items, emptyEntry]);
  }

  return (
    <div className="space-y-4">
      {items.map((entry, i) => (
        <div key={i} className="rounded-lg border border-surface-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">{entryLabel(i)}</span>
            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-danger-ink"
              aria-label={removeLabel}
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 space-y-3">{renderEntry(entry, (next) => updateEntry(i, next), i)}</div>
        </div>
      ))}

      {items.length < max ? (
        <button
          type="button"
          onClick={addEntry}
          className="flex items-center gap-1.5 rounded-full border border-surface-line-strong px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      ) : null}
    </div>
  );
}
