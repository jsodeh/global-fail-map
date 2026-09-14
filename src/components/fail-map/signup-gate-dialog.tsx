'use client';

import { ArrowUpRight, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GateTrigger } from '@/lib/signup-gate';

/**
 * Each rule gets its own sentence. A reader who just hit the random button
 * again and a reader who just asked to research a place are in
 * different places, and one generic wall would read as a wall to both.
 */
const copy: Record<GateTrigger, { title: string; body: string }> = {
  random: {
    title: 'Keep pulling stories',
    body: 'You have read one at random. Sign up or log in with Valyu to keep shuffling through the atlas, and to research any place on it yourself.',
  },
  stories: {
    title: 'Keep exploring the atlas',
    body: 'You have opened two stories. Sign up or log in with Valyu for the rest of the collection, and to research any place on the map yourself.',
  },
  research: {
    title: 'Research this place',
    body: 'Research runs on your own Valyu account, and reports are saved to it. Sign up or log in to investigate what was attempted here and why it ended, with sources.',
  },
};

export function SignupGateDialog({
  trigger,
  onDismiss,
  onSignUp,
  connecting = false,
}: {
  trigger: GateTrigger | null;
  onDismiss: () => void;
  onSignUp: () => void;
  connecting?: boolean;
}) {
  /* Held so the copy does not blank out during the closing animation. */
  const content = trigger ? copy[trigger] : null;

  return (
    <Dialog
      open={!!trigger}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <DialogContent className="signup-dialog" showCloseButton={false}>
        <div className="dialog-topline">
          <DialogTitle>{content?.title ?? 'Create an account'}</DialogTitle>
          <DialogClose className="icon-button" aria-label="Close">
            <X size={18} />
          </DialogClose>
        </div>
        <DialogDescription>{content?.body}</DialogDescription>
        <ul className="signup-perks">
          <li>Every story in the atlas, unlimited</li>
          <li>Research any place on the map, with cited sources</li>
          <li>Your reports saved and shareable</li>
        </ul>
        <button
          className="primary-button"
          onClick={onSignUp}
          disabled={connecting}
        >
          {connecting ? (
            <Loader2 size={17} className="spin" />
          ) : (
            <ArrowUpRight size={17} />
          )}
          {connecting ? (
            'One moment...'
          ) : (
            <>
              Continue with
              <span className="valyu-auth-logo" aria-label="Valyu" role="img" />
            </>
          )}
        </button>
        <button className="signup-later" onClick={onDismiss}>
          Keep looking around
        </button>
      </DialogContent>
    </Dialog>
  );
}
