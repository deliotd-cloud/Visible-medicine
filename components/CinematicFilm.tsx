"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import styles from "./cinematic-film.module.css";

const films = [
  {
    id: "reveal",
    version: "v3",
    number: "01",
    title: "Reveal",
    direction: "Cinematic · Sculptural · Dark",
    description: "A close-up of rotating 3D anatomy opens into X-ray, CT and MRI, with a widescreen finish.",
    duration: "7.2 seconds",
    accessibleDescription: "A camera pulls back from a lit three-dimensional brain, followed by close-up chest X-ray, CT head and sagittal brain MRI images. The Visible Medicine logo and tagline appear at the end.",
  },
  {
    id: "voyage",
    version: "v3",
    number: "02",
    title: "Voyage",
    direction: "Continuous · Spatial · Fluid",
    description: "A continuous camera journey past three imaging planes, with subtle depth and reflections.",
    duration: "6.8 seconds",
    accessibleDescription: "A continuous sideways camera move passes a chest X-ray, a CT head image and brain MRI on separate planes, ending with the Visible Medicine logo and tagline.",
  },
  {
    id: "signature",
    version: "v5",
    number: "03",
    title: "Signature",
    direction: "Original dark cut",
    description: "Soft scan reveals flow into one continuous frame-to-logo movement, followed by the approved wordmark.",
    duration: "5.2 seconds",
    accessibleDescription: "On a dark charcoal background, a fine teal frame surrounds a chest X-ray, CT head and brain MRI, revealed in turn by soft wipes. The same frame contracts and moves into the approved logo position as the white wordmark appears. The existing tagline completes the opening.",
  },
  {
    id: "aperture",
    version: "v6",
    number: "04",
    title: "Aperture",
    direction: "Window reveal",
    description: "A fine teal window opens onto the scans, closes to a line, then reveals the full identity.",
    duration: "5.4 seconds",
    accessibleDescription: "On a dark background, a thin rounded teal aperture opens vertically around a chest X-ray, CT head and brain MRI. It closes to a short line before the approved white Visible Medicine logo and tagline appear.",
  },
  {
    id: "glide",
    version: "v8",
    number: "05",
    title: "Glide",
    direction: "Website splash",
    description: "Three scans glide through a wide frame that flows continuously into the logo.",
    duration: "5.4 seconds",
    accessibleDescription: "Chest X-ray, CT head and brain MRI images move sideways in turn through a single teal-bracketed window on a flat matte charcoal background. The same four corners remain visible as the frame smoothly contracts into the approved logo, then the white wordmark and tagline appear.",
  },
  {
    id: "lumen",
    version: "v6",
    number: "06",
    title: "Lumen",
    direction: "Soft focus",
    description: "Larger, unframed scans emerge from the dark and gently dissolve into the logo.",
    duration: "5.6 seconds",
    accessibleDescription: "Large chest X-ray, CT head and brain MRI images appear in turn against a dark background without a frame. Brief focus pulls soften the transitions, then the scans fade and the approved white logo and tagline come into focus.",
  },
] as const;

type Film = (typeof films)[number];

export function CinematicFilm() {
  const [selection, setSelection] = useState({ index: 4, replay: 0, explicit: false });
  const selected = films[selection.index];

  function filmChoice(index: number) {
    const film = films[index];
    return (
          <button
            key={film.id}
            type="button"
            className={`${styles.choice} ${selection.index === index ? styles.selected : ""}`}
            aria-pressed={selection.index === index}
            aria-controls="opening-film"
            onClick={() => setSelection((current) => ({ index, replay: current.replay + 1, explicit: true }))}
          >
            <Image className={styles.thumbnail} src={`/media/splash/${film.id}-poster-${film.version}.webp`} width={192} height={108} alt="" />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}><span className={styles.number}>{film.number}</span>{film.title}</span>
              <span className={styles.direction}>{film.direction}</span>
              <span className={styles.choiceDuration}>{film.duration}</span>
            </span>
            <span className={styles.choicePlay} aria-hidden="true">▶</span>
          </button>
    );
  }

  return (
    <section className={styles.theater} aria-label="Compare the dark opening films">
      <div className={styles.choices} role="group" aria-label="Original Signature and three new variations">
        {[2, 3, 4, 5].map(filmChoice)}
      </div>
      <details className={styles.earlier}>
        <summary>Earlier directions — Reveal &amp; Voyage</summary>
        <div className={styles.earlierChoices} role="group" aria-label="Earlier opening films">
          {[0, 1].map(filmChoice)}
        </div>
      </details>
      <FilmPlayer key={`${selected.id}-${selected.version}-${selection.replay}`} film={selected} explicitPlay={selection.explicit} />
      <p className={styles.previewNote}>Glide is the website’s selected splash screen. Choosing another film here only previews it.</p>
    </section>
  );
}

function FilmPlayer({ film, explicitPlay }: { film: Film; explicitPlay: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);
  const source = `/media/splash/${film.id}-${film.version}.mp4`;

  useEffect(() => {
    const video = videoRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (explicitPlay || (!motion.matches && !connection?.saveData)) {
      video?.play().catch(() => { /* Native controls remain available when autoplay is blocked. */ });
    }
    const onMotionChange = () => { if (motion.matches) video?.pause(); };
    const onVisibilityChange = () => { if (document.hidden) video?.pause(); };
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      video?.pause();
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [explicitPlay]);

  async function replay(withSound = false) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = !withSound;
    setMuted(!withSound);
    try {
      await video.play();
      setError(false);
    } catch {
      setError(true);
    }
  }

  return (
    <div id="opening-film" className={styles.player}>
      <div className={styles.filmHeading}>
        <h2>{film.number} / {film.title}</h2>
        <p>{film.description}</p>
      </div>
      <div className={`${styles.screen} ${styles.signatureScreen} ${film.id === "glide" ? styles.glideScreen : ""}`}>
        <video
          ref={videoRef}
          className={styles.video}
          src={source}
          poster={`/media/splash/${film.id}-poster-${film.version}.webp`}
          controls
          muted={muted}
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onVolumeChange={() => setMuted(videoRef.current?.muted ?? true)}
          onError={() => setError(true)}
          aria-label={`${film.title}. ${film.accessibleDescription} Optional abstract sound; no speech.`}
        />
      </div>
      <div className={styles.controls}>
        <div className={styles.playback}>
          <span className={playing ? styles.live : styles.idle} aria-hidden="true" />
          <span>{playing ? "Playing" : film.title}</span>
          <span className={styles.divider}>/</span>
          <span className={styles.duration}>{film.duration}</span>
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={() => replay(false)}><span aria-hidden="true">↻</span> Replay</button>
          <button type="button" onClick={() => replay(true)} className={styles.soundButton}>Play with sound</button>
          <a href={source} download={`Visible-Medicine-${film.title}.mp4`}>Download film <span aria-hidden="true">↓</span></a>
        </div>
      </div>
      {error && <p className={styles.error} role="status">Playback did not start. Use the video’s play control or download the film to watch it.</p>}
    </div>
  );
}
