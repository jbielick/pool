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

test.todo('fails if no create function is present');
test.todo('fails if no destroy function is present');

test('is an event emitter', t => {
  const pool = new Pool({});
  pool.on('event', () => t.pass());
  pool.emit('event');
});


test.todo('it creates up to .size resources if needed');
test.todo('it retries a create if failed once');
test.todo('it validates the resource before lending');
test.todo('ignores unknown resources');

test.todo('throws on first checkout if create does not succeed');

// drain
test.todo('waits for borrowed resources to be returned');

test.todo('waits for awaiting creates to finish');

// timeout
test.todo('throws after {timeout} if create does not succeed');

test.todo('fails after {timeout} trying to request size + 1 resource');

// idles
test.todo('destroys resources idle for {idleTimeout}');
// set timeout low,
// checkout and in a couple times beforehand exceeding timeout period,
// wait timeout period,
// check that is destroyed

test.todo('does not close last connection due to idleTimeout??');

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
