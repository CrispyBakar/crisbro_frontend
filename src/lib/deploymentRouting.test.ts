import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('deployment routing dan admin auth guard', () => {
  it('meneruskan /api ke backend deployment', () => {
    const config = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'vercel.json'), 'utf8'),
    ) as { rewrites?: Array<{ source: string; destination: string }> };

    expect(config.rewrites).toContainEqual({
      source: '/api/:path*',
      destination: 'https://crisbro-backend.vercel.app/api/:path*',
    });
  });

  it('admin memvalidasi sesi server dan tidak kembali ke layar kosong', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'src/features/admin/AdminPage.tsx'),
      'utf8',
    );

    expect(source).toContain('apiProfile()');
    expect(source).not.toContain('useMemo(() => getUser()');
    expect(source).toContain('if (authChecking || !canAccess) return <AdminPageSkeleton');
  });
});
