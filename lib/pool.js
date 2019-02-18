const EventEmitter = require('events');

const OUTSTANDING = Symbol('outstanding');
const RESOURCES = Symbol('resources');
const SIZE = Symbol('size');
const CHECKIN = Symbol('checkin');
const CHECKOUT = Symbol('checkout');

class Pool extends EventEmitter {
  constructor(factory, {
    size,
    timeout
  } = {
    size: 20,
    timeout: 5000
  }) {
    if (!factory) throw new Error('must provide factory');
    super();
    this.factory = factory;
    this.timeout = timeout;
    this[SIZE] = size;
    this[RESOURCES] = [];
    this[OUTSTANDING] = 0;
  }

  get size() {
    return this[SIZE];
  }

  get available() {
    return this[RESOURCES].length;
  }

  get deficit() {
    return this.size - (this.outstanding + this.available);
  }

  get outstanding() {
    return this[OUTSTANDING];
  }

  track(n) {
    this[OUTSTANDING] += n;
    if (n > 0) {
      this.emit('checkOut');
    } else {
      this.emit('checkIn');
    }
  }

  async checkOut() {
    if (this.available > 0) {
      this.track(1);
      return this[RESOURCES].pop();
    } else if (this.deficit > 0) {
      this.track(1);
      return this.factory.create();
    } else {
      // wait
      return new Promise((resolve) => {
        const onCheckIn = this.checkout.bind(this);
        let timeout;

        this.one('checkIn', () => {
          clearTimeout(timeout);
          resolve();
        });
        timeout = setTimeout(() => {
          this.removeEventListener('checkIn', onCheckIn);
          reject(new Error('exceeded timeout waiting for resource'));
        }, this.timeout);
      });

      throw new Error('exceeded');
    }
  }

  checkIn(resource) {
    this.track(-1);
    this[RESOURCES].push(resource);
  }

  async with(borrower) {
    const resource = await this.checkOut();

    try {
      return await Promise.resolve(borrower(resource));
    } finally {
      this.checkIn(resource);
    }
  }
}

module.exports = Pool;
