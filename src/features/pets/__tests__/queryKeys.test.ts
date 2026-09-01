import { petKeys } from '../api';

describe('petKeys', () => {
  it('nests consistently under the "pets" root', () => {
    expect(petKeys.all).toEqual(['pets']);
    expect(petKeys.lists()).toEqual(['pets', 'list']);
    expect(petKeys.details()).toEqual(['pets', 'detail']);
    expect(petKeys.detail('p1')).toEqual(['pets', 'detail', 'p1']);
  });

  it('list() embeds the filter so different filters cache separately', () => {
    const a = petKeys.list({ page: 1, pageSize: 20, status: 'ACTIVE' });
    const b = petKeys.list({ page: 1, pageSize: 20, status: 'ACTIVE', search: 'x' });
    expect(a).not.toEqual(b);
    expect(a.slice(0, 2)).toEqual(['pets', 'list']);
  });

  it('lists() is a prefix of every detail/list key for prefix invalidation', () => {
    expect(petKeys.detail('p1').slice(0, 1)).toEqual(petKeys.all);
    expect(petKeys.list({ page: 1, pageSize: 20 }).slice(0, 2)).toEqual(petKeys.lists());
  });
});
