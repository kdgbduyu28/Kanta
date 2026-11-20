import { expect, test } from 'vitest';
import { CONTACTS, mailtoUrl } from './contact';

test('both contacts are listed', () => {
  expect(CONTACTS).toEqual([
    { name: 'Timothy Borja', email: 'timothyborja28@gmail.com' },
    { name: 'Jonathan De Jesus', email: 'durocabeza@gmail.com' },
  ]);
});

test('mailto link carries the subject', () => {
  expect(mailtoUrl('durocabeza@gmail.com')).toBe('mailto:durocabeza@gmail.com?subject=Kanta');
});
