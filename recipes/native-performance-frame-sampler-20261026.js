// QA-only browser function. Start before the chosen real keyboard interaction,
// then read await window.__vmDesktopQa.transitionSample. Counts browser rAF
// windows and WebGL calls; it does not certify GPU FPS or whole-tour performance.
() => {
  const q = window.__vmDesktopQa;
  if (!q) throw Error('Run the exact QA instrumentation before navigation');
  const start = performance.now(), begin = q.drawCalls, intervals = [];
  let last = start, draws = begin, windows = 0;
  q.transitionSample = new Promise(resolve => {
    function frame(time) {
      intervals.push(time - last);
      last = time;
      if (draws !== q.drawCalls) windows++;
      draws = q.drawCalls;
      if (time - start < 3000) requestAnimationFrame(frame);
      else {
        const sorted = intervals.slice(1).sort((a, b) => a - b);
        resolve({
          duration: time - start,
          frames: intervals.length,
          renderWindows: windows,
          drawCalls: q.drawCalls - begin,
          medianMs: sorted[Math.floor(sorted.length / 2)],
          p95Ms: sorted[Math.floor(sorted.length * .95)],
          maxMs: Math.max(...sorted),
          over50Ms: sorted.filter(value => value > 50).length,
        });
      }
    }
    requestAnimationFrame(frame);
  });
  return {started: true, visibility: document.visibilityState};
};
