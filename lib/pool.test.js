const test = require('ava');
const Pool = require('./pool');

const nullFactory = () => {
  return {
    create: () => {},
    destroy: () => null,
  };
};

test('fails to construct without a factory', t => {
  t.throws(() => {
    new Pool();
  });
});

test('is an event emitter', t => {
  const pool = new Pool({});
  pool.on('event', () => t.pass());
  pool.emit('event');
});

test('event: checkOut occurs after tracking', t => {
  t.plan(1);
  const pool = new Pool({ create: () => {} }, { size: 1 });
  pool.on('checkOut', () => {
    t.is(pool.outstanding, 1);
  });
  return pool.with(() => {});
});

test('event: checkIn occurs after tracking', t => {
  t.plan(1);
  const pool = new Pool({ create: () => {} }, { size: 1 });
  pool.on('checkIn', () => {
    t.is(pool.outstanding, 0);
  });
  return pool.with(() => {});
});

test('provides a resource created from the factory', t => {
  const resource = {};
  const factory = {
    create: () => resource
  };
  const pool = new Pool(factory);

  return pool.with((given) => {
    t.is(given, resource);
  });
});

test('throws when requesting > size', t => {
  const factory = { create: () => {} };
  const pool = new Pool(factory, { size: 1 });

  return pool.with(() => {
    return t.throwsAsync(pool.with(() => {}));
  });
});

test('.with: throws and resource is returned when borrower throws', async t => {
  const factory = { create: () => {} };
  const pool = new Pool(factory, { size: 1 });

  await t.throwsAsync(
    pool.with((given) => {
      t.is(pool.available, 0);
      throw new Error('oops');
    })
  );

  t.is(pool.available, 1);
});

test('resource is created when space is available', async t => {
  let created = 0;
  const factory = {
    create: () => {
      created += 1;
      return {};
    }
  };
  const pool = new Pool(factory, { size: 2 });

  await pool.with(async () => {
    t.is(pool.available, 0);
    t.is(pool.outstanding, 1);
    t.is(pool.deficit, 1);
    await pool.with(() => {
      t.is(pool.available, 0);
      t.is(pool.outstanding, 2);
      t.is(pool.deficit, 0);
    });
    t.is(pool.available, 1);
    t.is(pool.outstanding, 1);
    t.is(pool.deficit, 0);
  });

  t.is(created, 2);
  t.is(pool.available, 2);
  t.is(pool.deficit, 0);
});
