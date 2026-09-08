'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Sheet } from '@/components/ui/Sheet';

/** Temporary Phase 1 demo of the Sheet primitive that filters will use. */
export function SheetDemo({
  trigger,
  title,
  closeLabel,
  applyLabel,
  options,
}: {
  trigger: string;
  title: string;
  closeLabel: string;
  applyLabel: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        closeLabel={closeLabel}
        footer={
          <Button className="w-full" onClick={() => setOpen(false)}>
            {applyLabel}
          </Button>
        }
      >
        <div className="flex flex-col">
          {options.map((option) => (
            <Checkbox key={option} label={option} name="sheet-demo" />
          ))}
        </div>
      </Sheet>
    </>
  );
}
