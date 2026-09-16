'use client';

import Image from 'next/image';
import { BookOpen, Info, Shuffle } from 'lucide-react';

export interface AtlasDockProps {
  onHome: () => void;
  onStories: () => void;
  onAbout: () => void;
  onRandom?: () => void;
  keyOpen?: boolean;
}

export function AtlasDock(props: AtlasDockProps) {
  return (
    <nav className="atlas-dock" aria-label="Atlas navigation">
      <button className="dock-item" onClick={props.onHome} aria-label="Home">
        <Image src="/favicon-64.png" alt="" width={25} height={25} />
        <span className="dock-tooltip">Home</span>
      </button>
      <span className="dock-divider" />
      <button
        className="dock-item"
        onClick={props.onStories}
        aria-label="Browse projects"
      >
        <BookOpen size={21} />
        <span className="dock-tooltip">Projects</span>
      </button>
      {props.onRandom && (
        <button
          className="dock-item is-random"
          onClick={props.onRandom}
          aria-label="Random project"
        >
          <Shuffle size={21} />
          <span className="dock-tooltip">Random</span>
        </button>
      )}
      <button
        className="dock-item"
        onClick={props.onAbout}
        aria-label="About"
      >
        <Info size={21} />
        <span className="dock-tooltip">About</span>
      </button>
    </nav>
  );
}
