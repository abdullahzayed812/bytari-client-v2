import { REQUEST_GRID_TWO_COLUMN_MIN_WIDTH, requestGridColumns } from '../constants';

describe('requestGridColumns — pet-owner service request grid', () => {
  it('two cards per row on phones, tablets and web; one only on very narrow screens', () => {
    expect(requestGridColumns(320)).toBe(1);
    expect(requestGridColumns(REQUEST_GRID_TWO_COLUMN_MIN_WIDTH - 1)).toBe(1);
    expect(requestGridColumns(REQUEST_GRID_TWO_COLUMN_MIN_WIDTH)).toBe(2);
    expect(requestGridColumns(390)).toBe(2);
    expect(requestGridColumns(820)).toBe(2);
    expect(requestGridColumns(1440)).toBe(2);
  });
});
