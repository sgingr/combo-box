import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | combo-two', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:combo-two');
    assert.ok(route);
  });
});
