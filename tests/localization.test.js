import { describe, expect, it } from 'vitest';
import { copyForMode } from '../src/localization.js';

describe('localized copy selection', () => {
  const copy = { en: 'Play', hi: 'सुनें' };

  it.each([
    ['en', 'Play'],
    ['hi', 'सुनें'],
    ['both', 'Play · सुनें'],
  ])('renders %s labels without caller-side branching', (mode, expected) => {
    expect(copyForMode(copy, mode)).toBe(expected);
  });

  it('supports prose-specific bilingual spacing', () => {
    expect(copyForMode(copy, 'both', ' ')).toBe('Play सुनें');
  });
});
