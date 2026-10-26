# Workbook draft history protection

Imaging teaching and assessment workbook drafts now use the same native history guard as lecture drafts. Cancelling a cancellable same-document browser Back or Forward keeps the editor and unsaved content. Choosing to leave proceeds. A successful draft save refreshes the guard so clean navigation does not warn.

The existing content-change warning and external-link protection remain. The guard uses committed dirty state, cleans up on unmount, and never adds sentinel history or rewrites the router. Browsers without the optional cancellable Navigation API retain link and unload protection; noncancellable traversal is not intercepted. This does not add draft persistence or save content automatically.

Verification covers actual WorkbookBuilder with synthetic data and browser-native traversal, plus whole regression roots. Synthetic save responses and prompt choices do not establish real-account or database acceptance. Existing publication, review, entitlement and source-data boundaries are unchanged.
