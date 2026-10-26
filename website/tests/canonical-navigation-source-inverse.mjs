import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha = text => createHash('sha256').update(text).digest('hex');
const currentSha = '058b63bd82d999cbc2020bc0e9221990432156f1d943b958b7aed1c222185af7';
const installedSha = '8512c42af12098b2833a901245ac08406f081c3edacbfabe2d6bc5d73b544d42';
const once = (text, after, before = '') => {
  assert.equal(text.split(after).length, 2, `one exact canonical navigation seam: ${after}`);
  return text.replace(after, before);
};

export function restorePreCanonicalNavigation(source) {
  let text = source.replaceAll('\r\n', '\n');
  assert.equal(sha(text), currentSha, 'only verified current body learning source enters the inverse');
  text = once(text, "import {sameAtlasDocument} from './atlas-runtime-state';\n");
  text = once(text,
    "      try{return sameAtlasDocument(src,element.contentWindow?.location.href??'',window.location.href);}",
    '      try{return element.contentWindow?.location.href===new URL(src,window.location.href).href;}');
  assert.equal(sha(text), installedSha, 'complete installed-era source restored');
  return text;
}
