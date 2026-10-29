import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClinicalReviewInbox } from '../20261029-combined-website/website/components/ClinicalReviewInbox';

const host = document.getElementById('inbox-root');
if (!host) throw new Error('Synthetic inbox mount is missing.');
createRoot(host).render(<ClinicalReviewInbox />);
