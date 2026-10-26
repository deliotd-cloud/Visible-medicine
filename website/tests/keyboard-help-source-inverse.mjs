import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const sha = value => createHash('sha256').update(value).digest('hex');
const currentSha = '35ecba7a2f3bb94bb86f2d4a2662d3460bbfb04e93a080c1c3bbe711078ed75e';
const priorSha = '7d4d9d36f5f8b7a88477355ba76b3adb4e93d080cff9356dfe5725f3fc6c76d8';
const once = (text, after, before = '') => {
  assert.equal(text.split(after).length, 2, `exact keyboard Help seam: ${after.slice(0, 60)}`);
  return text.replace(after, before);
};

export function restorePreKeyboardHelp(source) {
  let text = source.replaceAll('\r\n', '\n');
  if (sha(text) === priorSha) return text; // Authenticated pre-Help historical reader.
  assert.equal(sha(text), currentSha, 'only verified Help-bound runtime enters this inverse');
  text = once(text, `// The bundled generic body runtime serves every region through this path. A relative
// source keeps the host's copy of the guide from describing an external frame.
const hasBundledKeyboardGuide = (src: string) =>
  /^\\/atlas-runtime\\/head-neck\\/index\\.html(?:\\?[^\\s#]*)?$/.test(src);

`);
  text = once(text, '  const help = useRef<HTMLDetailsElement>(null);\n');
  text = once(text, `  const onHelpKeyDown = (event: React.KeyboardEvent<HTMLDetailsElement>) => {
    if (event.key !== 'Escape' || !help.current?.open) return;
    event.preventDefault();
    event.stopPropagation();
    help.current.open = false;
    help.current.querySelector('summary')?.focus({preventScroll: true});
  };
  const onHelpBlur = (event: React.FocusEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      event.currentTarget.open = false;
    }
  };
`);
  text = once(text, "className=\"atlas-runtime-frame\" data-keyboard-guide={hasBundledKeyboardGuide(src) ? '' : undefined}", 'className="atlas-runtime-frame"');
  text = once(text, `<details ref={help} className="atlas-runtime-help"
        onKeyDown={onHelpKeyDown} onBlur={onHelpBlur}>`, '<details className="atlas-runtime-help">');
  text = once(text, `        {hasBundledKeyboardGuide(src) && <div className="atlas-runtime-keyboard-guide">
          <p><strong>Keyboard controls</strong></p>
          <p>Tab to the model canvas first. With the canvas focused and its controls enabled, arrow keys rotate the 3D view or pan a planar tray; hold Shift for finer movement. + or = zooms in; − zooms out. Tab moves to the next control.</p>
          <p>In the enabled Dissect workspace, Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z or Ctrl+Y redoes when available. These shortcuts do not capture typing in editors or dialogs. Controls can be unavailable while loading or locked.</p>
        </div>}
`);
  assert.equal(sha(text), priorSha, 'complete verified pre-Help frame restored');
  return text;
}
