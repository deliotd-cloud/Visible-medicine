# Specimen identification readiness

Identification answers, reveal, Next/Finish and round replay require the current
renderer and every required source bundle to be ready. Renderer loss and bundle
failure revoke a shared readiness ref immediately, before React rerenders, so
callbacks captured while a button was enabled cannot change the question,
feedback, score or round after availability is lost. Visible controls are also
disabled while unavailable. No answers or progress are discarded on loss.

Events are also bound to a question/round epoch and the exact question-array,
index and target identity. Next or successful replay revokes the preceding epoch
immediately. An old answer, reveal, Next or round-replay callback cannot alter
the next question or a new round, including before rerender. The original
identification reducer remains unchanged.

Renderer recovery restores the same question and permits normal answering.
Bundle failure retains the existing instruction to return to dissection to retry;
there is no new in-place recovery promise. Back to dissection remains available.

`node scripts/validate-um-limb-learning.mjs` exercises production handlers for
queued answers/reveal, queued Next, disabled Finish, bundle failure and round
replay, alongside existing exact-source teaching/scoring and markup assertions.
The shared identification reducer, source lessons and geometry are unchanged.
These are software safeguards, not assessment validity or clinical certification.
