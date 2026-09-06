'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Layers3, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';

export const COMPACT_ANATOMY_QUERY = '(max-width: 1100px)';

/** One controls instance: a desktop rail or an on-demand, focus-managed sheet. */
function AnatomySidePanel({
  children,
  info = false,
  practice = false,
}: {
  children: ReactNode;
  info?: boolean;
  practice?: boolean;
}) {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(
      info ? '(max-width: 700px)' : COMPACT_ANATOMY_QUERY,
    );
    const update = () => {
      setCompact(media.matches);
      setOpen(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [info]);
  const label = info
    ? practice
      ? 'Practice'
      : 'Structure info'
    : 'Systems & tools';
  if (!compact)
    return (
      <aside
        className={info ? 'body-info' : 'body-rail anatomy-control-rail'}
        aria-label={
          info ? 'Anatomy study panel' : 'Systems and dissection tools'
        }
      >
        {children}
      </aside>
    );
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            className={info ? 'body-info-launcher' : 'body-controls-launcher'}
          />
        }
      >
        {info ? <Info /> : <Layers3 />} {label}
      </SheetTrigger>
      {/* SheetContent does not expose keepMounted; compose its existing primitives
          so closing the sheet retains library searches and unsaved view names. */}
      <Dialog.Portal keepMounted>
        <Dialog.Backdrop className="anatomy-controls-overlay" />
        <Dialog.Popup
          className="anatomy-controls-popup"
          data-side={info ? 'right' : 'left'}
        >
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>
              {info
                ? 'Search structures, read notes or review practice. Close to return to the model.'
                : 'Choose anatomy or a dissection view, then close to return to the model.'}
            </SheetDescription>
          </SheetHeader>
          <SheetClose
            render={
              <Button
                size="icon"
                variant="ghost"
                className="anatomy-controls-close"
              />
            }
            aria-label={`Close ${label.toLowerCase()}`}
          >
            <X />
          </SheetClose>
          <div
            className={
              info ? 'body-info anatomy-info-content' : 'anatomy-control-rail'
            }
          >
            {children}
          </div>
          <SheetClose
            render={
              <Button variant="outline" className="anatomy-controls-return" />
            }
          >
            Return to model
          </SheetClose>
        </Dialog.Popup>
      </Dialog.Portal>
    </Sheet>
  );
}

export function AnatomyControlRail({ children }: { children: ReactNode }) {
  return <AnatomySidePanel>{children}</AnatomySidePanel>;
}
export function AnatomyInfoPanel({
  children,
  practice = false,
}: {
  children: ReactNode;
  practice?: boolean;
}) {
  return (
    <AnatomySidePanel info practice={practice}>
      {children}
    </AnatomySidePanel>
  );
}
