import type { User } from '../../generated/prisma';
import { adminUserDto, privateUserDto, publicUserDto } from '../dtos/user.dto';
import { toAdminUser, toPrivateUser, toPublicUser, toUserCreateData } from '../mappers/user.mapper';

const user: User = {
  id: 'clx0000000000000000000001',
  email: 'ada@example.com',
  passwordHash: '$2a$10$secret-hash',
  displayName: 'Ada',
  bio: 'Analyst',
  role: 'ADMIN',
  internalNotes: 'VIP — handle with care',
  lastLoginAt: new Date('2026-10-08T09:30:00Z'),
  createdAt: new Date('2026-01-15T12:00:00Z'),
  updatedAt: new Date('2026-10-08T09:30:00Z'),
};

describe('output mappers', () => {
  it('public view: exactly id, displayName, bio and the join date', () => {
    expect(toPublicUser(user)).toEqual({ id: user.id, displayName: 'Ada', bio: 'Analyst', memberSince: '2026-01-15' });
  });

  it('private view adds email, role and last login — nothing else', () => {
    expect(Object.keys(toPrivateUser(user)).sort()).toEqual(
      ['bio', 'displayName', 'email', 'id', 'lastLoginAt', 'memberSince', 'role'].sort(),
    );
  });

  it('admin view adds notes and updatedAt', () => {
    expect(toAdminUser(user)).toMatchObject({
      internalNotes: 'VIP — handle with care',
      updatedAt: '2026-10-08T09:30:00.000Z',
    });
  });

  it.each([
    ['public', toPublicUser],
    ['private', toPrivateUser],
    ['admin', toAdminUser],
  ])('%s view never contains the password hash', (_view, map) => {
    expect(JSON.stringify(map(user))).not.toContain('secret-hash');
    expect(map(user)).not.toHaveProperty('passwordHash');
  });

  it('a column added to the entity later stays private by default', () => {
    const withNewColumn = { ...user, stripeCustomerId: 'cus_123' } as User;
    expect(JSON.stringify([toPublicUser, toPrivateUser, toAdminUser].map((map) => map(withNewColumn)))).not.toContain(
      'cus_123',
    );
  });

  it('outputs satisfy their DTO schemas (strictly)', () => {
    expect(publicUserDto.strict().safeParse(toPublicUser(user)).success).toBe(true);
    expect(privateUserDto.strict().safeParse(toPrivateUser(user)).success).toBe(true);
    expect(adminUserDto.strict().safeParse(toAdminUser(user)).success).toBe(true);
  });
});

describe('input mapper', () => {
  it('stores only email, display name and the hash — never the raw password', () => {
    expect(toUserCreateData({ email: 'a@b.co', password: 'plain-text', displayName: 'A' }, 'hash')).toEqual({
      email: 'a@b.co',
      displayName: 'A',
      passwordHash: 'hash',
    });
  });
});
