import { expect, test } from 'vitest';
import { sourceCardState, sourceForPackage } from './sources';

test('maps packages to sources', () => {
  expect(sourceForPackage('com.spotify.music')).toBe('spotify');
  expect(sourceForPackage('com.google.android.apps.youtube.music')).toBe('ytmusic');
  expect(sourceForPackage('com.apple.android.music')).toBe('applemusic');
  expect(sourceForPackage('com.google.android.youtube')).toBeNull();
});

test('source card states', () => {
  expect(sourceCardState('ytmusic', ['spotify'], true, false)).toBe('not-installed');
  expect(sourceCardState('spotify', ['spotify'], false, false)).toBe('needs-access');
  expect(sourceCardState('spotify', ['spotify'], true, false)).toBe('ready');
  expect(sourceCardState('spotify', ['spotify'], true, true)).toBe('ready-remote');
  expect(sourceCardState('local', [], false, false)).toBe('ready');
});
