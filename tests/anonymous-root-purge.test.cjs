const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

test('expired anonymous root cleanup protects current revisions and accounts', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  try {
    for (const file of [
      'tests/sql/anonymous-root-purge.sql',
      'supabase/migrations/20261112081000_purge_expired_anonymous_root.sql',
      'tests/sql/anonymous-root-purge-assertions.sql',
    ]) {
      await db.exec(readFileSync(join(__dirname, '..', file), 'utf8'));
    }
  } finally {
    await db.close();
  }
});
