"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./cinematic-film.module.css";

export function CinematicFilm() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video?.play().catch(() => {
      // The native play control remains available if autoplay is blocked.
    });
    return () => video?.pause();
  }, []);

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
    <section className={styles.theater} aria-label="Visible Medicine cinematic opening">
      <div className={styles.screen}>
        <video
          ref={videoRef}
          className={styles.video}
          src="/media/splash/visible-medicine-cinematic-v1.mp4"
          poster="/media/splash/cinematic-film-poster.webp"
          controls
          muted={muted}
          playsInline
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onVolumeChange={() => setMuted(videoRef.current?.muted ?? true)}
          onError={() => setError(true)}
          aria-label="A 6.6-second film moving from a chest X-ray through CT slices and brain MRI to the Visible Medicine logo. Optional abstract sound design, no spoken content."
        />
      </div>
      <div className={styles.controls}>
        <div className={styles.playback}>
          <span className={playing ? styles.live : styles.idle} aria-hidden="true" />
          <span>{playing ? "Now playing" : "Cinematic opening"}</span>
          <span className={styles.divider}>/</span>
          <span className={styles.duration}>00:06.6</span>
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={() => replay(false)}>
            <span aria-hidden="true">↻</span> Replay
          </button>
          <button type="button" onClick={() => replay(true)} className={styles.soundButton}>
            Play with sound <span aria-hidden="true">↗</span>
          </button>
          <a href="/media/splash/visible-medicine-cinematic-v1.mp4" download="Visible-Medicine-Opening.mp4">
            Download film <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>
      {error && <p className={styles.error} role="status">Playback did not start. Use the video’s play control or download the film to watch it.</p>}
    </section>
  );
}
