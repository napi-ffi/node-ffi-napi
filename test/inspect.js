'use strict';
const assert = require('assert');
const { inspect } = require('util');
const ffi = require('../');

// Regression test for https://github.com/napi-ffi/node-ffi-napi/issues/4
//
// RTLD_NEXT (and on macOS: RTLD_DEFAULT, RTLD_SELF, RTLD_MAIN_ONLY) are dlsym
// sentinel values like (void*)-1 = 0xffffffffffffffff. Due to an N-API
// limitation, WrapPointer(ptr, 0) creates a length=1 Buffer to preserve the
// pointer address. The single backing byte at the sentinel address is not
// readable; util.inspect must not try to read it or the process crashes with a
// SIGSEGV.

describe('inspect(ffi) — RTLD sentinel buffers must not crash', function () {
  it('console.log(ffi) must not crash', function () {
    // This is the exact repro from the issue report
    assert.doesNotThrow(() => {
      inspect(ffi);
    });
  });

  it('util.inspect(ffi) must return a string', function () {
    const result = inspect(ffi);
    assert.strictEqual(typeof result, 'string');
    assert.ok(result.length > 0);
  });

  it('RTLD_NEXT must be a Buffer with a non-zero address', function () {
    if (!ffi.RTLD_NEXT) return this.skip();
    assert.ok(Buffer.isBuffer(ffi.RTLD_NEXT));
    assert.notStrictEqual(ffi.RTLD_NEXT.hexAddress(), '0');
  });

  it('util.inspect(ffi.RTLD_NEXT) must not crash', function () {
    if (!ffi.RTLD_NEXT) return this.skip();
    assert.doesNotThrow(() => inspect(ffi.RTLD_NEXT));
  });

  it('util.inspect(ffi.RTLD_NEXT) must include its address', function () {
    if (!ffi.RTLD_NEXT) return this.skip();
    const result = inspect(ffi.RTLD_NEXT);
    assert.ok(result.includes(ffi.RTLD_NEXT.hexAddress()),
      `Expected address in: ${result}`);
  });

  // macOS-only sentinels
  ['RTLD_DEFAULT', 'RTLD_SELF', 'RTLD_MAIN_ONLY'].forEach(prop => {
    it(`util.inspect(ffi.${prop}) must not crash when present and non-null`, function () {
      const val = ffi[prop];
      if (!val || !Buffer.isBuffer(val) || val.length === 0) return this.skip();
      assert.doesNotThrow(() => inspect(val));
    });
  });

  it('util.inspect(ffi.FFI_TYPES) must not crash', function () {
    assert.doesNotThrow(() => inspect(ffi.FFI_TYPES));
  });

  it('RTLD_NEXT address is still usable as a dlsym handle', function () {
    if (!ffi.RTLD_NEXT) return this.skip();
    // The buffer must hold the sentinel address so ffi can pass it to dlsym.
    // On all POSIX platforms RTLD_NEXT == (void*)-1 == max-uintptr.
    const addr = BigInt('0x' + ffi.RTLD_NEXT.hexAddress());
    const maxPtr = (BigInt(1) << BigInt(64)) - BigInt(1);
    assert.strictEqual(addr, maxPtr,
      `Expected RTLD_NEXT = 0xffffffffffffffff, got 0x${ffi.RTLD_NEXT.hexAddress()}`);
  });
});
