import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { fetchLinkDetails, placeholderDetails } from './linkDetails';
import { parseMusicLink } from './links';

const fx = (name: string) => readFileSync(join(__dirname, '__fixtures__', name), 'utf8');
const ok = (body: string) => async () => ({ ok: true, status: 200, text: async () => body });

test('spotify page tags', async () => {
  const p = parseMusicLink('https://open.spotify.com/track/abc')!;
  expect(await fetchLinkDetails(p, ok(fx('spotify-track.html')))).toEqual({
    title: 'Yellow',
    artist: 'Coldplay',
    album: 'Parachutes',
    artworkUrl: 'https://i.scdn.co/image/ab67616d0000b273yellow',
    durationMs: 266_000,
  });
});

test('youtube oembed drops " - Topic"', async () => {
  const p = parseMusicLink('https://music.youtube.com/watch?v=yKNxeF4KMsY')!;
  let asked = '';
  const d = await fetchLinkDetails(p, async (url) => {
    asked = url;
    return { ok: true, status: 200, text: async () => fx('ytmusic-oembed.json') };
  });
  expect(asked).toContain('https://www.youtube.com/oembed?format=json&url=');
  expect(d).toMatchObject({ title: 'Yellow', artist: 'Coldplay', artworkUrl: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg' });
});

test('apple music page tags', async () => {
  const p = parseMusicLink('https://music.apple.com/ph/song/1122782283')!;
  expect(await fetchLinkDetails(p, ok(fx('apple-song.html')))).toMatchObject({
    title: 'Yellow',
    artist: 'Coldplay',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/yellow/1200x630wp.png',
    durationMs: 266_000,
  });
});

test('offline or non-200 gives null', async () => {
  const p = parseMusicLink('https://open.spotify.com/track/abc')!;
  expect(
    await fetchLinkDetails(p, async () => {
      throw new Error('offline');
    }),
  ).toBeNull();
  expect(await fetchLinkDetails(p, async () => ({ ok: false, status: 404, text: async () => '' }))).toBeNull();
});

test('placeholder names the app', () => {
  expect(placeholderDetails(parseMusicLink('https://open.spotify.com/track/abc')!).title).toBe('Spotify song');
});
