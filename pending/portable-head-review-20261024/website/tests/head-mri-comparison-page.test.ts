// All14 original scenarios execute from their byte-exact frozen test/pure graph.
// Current Guided Review behavior is tested independently, without filtering.
import {runHistoricalHeadReview} from './head-review-historical-source.mjs';
await runHistoricalHeadReview();
