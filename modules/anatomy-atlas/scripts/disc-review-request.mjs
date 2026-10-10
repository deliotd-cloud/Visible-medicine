const revisionPattern = /^[a-f0-9]{64}$/;

// The local source inspector may omit a revision; a hosted copy must carry it.
export function discSceneRequest(href, reportSha256, assetBase) {
 if (!revisionPattern.test(reportSha256)) throw Error('Missing report revision');
 const page = new URL(href);
 if (!['http:', 'https:', 'file:'].includes(page.protocol) || page.username || page.password || page.hash ||
     !(page.pathname.endsWith('/index.html') || page.pathname.endsWith('/'))) throw Error('Invalid review URL');
 const local = page.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(page.hostname);
 const query = page.search;
 if (page.href.includes('?')) {
  if (query !== `?revision=${reportSha256}`) throw Error('Invalid review revision');
 } else if (!local) throw Error('Missing review revision');
 const directory = new URL('./', page);
 const base = assetBase === undefined ? directory : new URL(assetBase);
 if (base.href !== directory.href) throw Error('Invalid review asset base');
 const scene = new URL('scene.json', base);
 if (query) scene.search = query;
 return {url: scene.href, expectedRevision: reportSha256};
}
