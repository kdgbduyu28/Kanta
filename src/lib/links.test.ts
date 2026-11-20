import { expect, test } from 'vitest';
import { linkFromMediaId, parseMusicLink } from './links';

test('spotify links', () => {
  expect(parseMusicLink('https://open.spotify.com/intl-fil/track/4uLU6hMCjMI75M1A2tKUQC?si=abc')).toEqual({
    source: 'spotify',
    kind: 'track',
    sourceId: '4uLU6hMCjMI75M1A2tKUQC',
    link: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
  });
  expect(parseMusicLink('Listen to this! https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=x')?.kind).toBe('playlist');
  expect(parseMusicLink('spotify:album:1DFixLWuPkv3KT3TnV35m3')?.kind).toBe('album');
});

test('youtube music links', () => {
  expect(parseMusicLink('https://music.youtube.com/watch?v=dQw4w9WgXcQ&feature=share')).toEqual({
    source: 'ytmusic',
    kind: 'track',
    sourceId: 'dQw4w9WgXcQ',
    link: 'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  expect(parseMusicLink('https://youtu.be/dQw4w9WgXcQ?si=1')?.source).toBe('ytmusic');
  expect(parseMusicLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.link).toBe('https://music.youtube.com/watch?v=dQw4w9WgXcQ');
  expect(parseMusicLink('https://music.youtube.com/playlist?list=PL123')?.kind).toBe('playlist');
});

test('apple music links', () => {
  expect(parseMusicLink('https://music.apple.com/ph/album/yellow/1122782080?i=1122782283')).toEqual({
    source: 'applemusic',
    kind: 'track',
    sourceId: '1122782283',
    link: 'https://music.apple.com/ph/song/1122782283',
  });
  expect(parseMusicLink('https://music.apple.com/ph/album/parachutes/1122782080')?.kind).toBe('album');
});

test('not music links', () => {
  expect(parseMusicLink('https://example.com/song')).toBeNull();
  expect(parseMusicLink('no link here')).toBeNull();
});

test('link from media id', () => {
  expect(linkFromMediaId('spotify', 'spotify:track:abc')).toBe('https://open.spotify.com/track/abc');
  expect(linkFromMediaId('applemusic', 'whatever')).toBeNull();
});
