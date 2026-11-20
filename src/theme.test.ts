import { expect, test } from 'vitest';
import { colors, gradient, icon, radius, space, type } from './theme';

test('tokens match the design system', () => {
  expect(colors).toMatchObject({ primary: '#A855F7', accent: '#6826F5', background: '#08090E', surface: '#24222E', text: '#F8F6FC' });
  expect(space).toEqual([4, 8, 12, 16, 24, 32]);
  expect(radius).toEqual({ sm: 12, md: 16, lg: 24, xl: 32 });
  expect(type.display).toMatchObject({ fontFamily: 'Inter-Bold', fontSize: 28 });
  expect(type.heading).toMatchObject({ fontFamily: 'Inter-SemiBold', fontSize: 22 });
  expect(type.body).toMatchObject({ fontFamily: 'Inter-Regular', fontSize: 14 });
  expect(type.caption).toMatchObject({ fontFamily: 'Inter-Regular', fontSize: 11 });
  expect(icon).toEqual({ size: 20, stroke: 1.8 });
  expect(gradient.primary).toEqual(['#A855F7', '#6826F5']);
});
