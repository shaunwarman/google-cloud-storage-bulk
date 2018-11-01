const test = require('ava');

const GCS = require('..');

test('init', t => {
  const gcs = new GCS({});
  t.true(gcs instanceof GCS);
});
