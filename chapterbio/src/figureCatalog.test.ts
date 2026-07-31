import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { figures } from './figureCatalog';

describe('figure catalogue', () => {
  it('contains every numbered figure in chapter order', () => {
    expect(figures).toHaveLength(48);
    expect(figures.map((figure) => figure.id)).toEqual(Array.from({ length: 48 }, (_, index) => index + 1));
    expect(figures.map((figure) => figure.chapterFigure)).toEqual(Array.from({ length: 48 }, (_, index) => `7-${index + 1}`));
  });

  it('has a local original asset for every figure', () => {
    for (const figure of figures) {
      const assetPath = join(process.cwd(), 'public', figure.asset.replace('/figures/', 'figures/'));
      expect(existsSync(assetPath), `${figure.chapterFigure} missing ${assetPath}`).toBe(true);
    }
  });

  it('marks only the requested ribosome A/P/E figure as the completed prototype', () => {
    const completed = figures.filter((figure) => figure.status === 'prototype');
    expect(completed.map((figure) => figure.chapterFigure)).toEqual(['7-33']);
  });
});
