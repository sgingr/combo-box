import Component from '@ember/component';
import { computed } from '@ember/object';
import RecLayout from '../recur';

export default Component.extend({
  dataObj: RecLayout.create(),
  data: computed('dataObj', function() {
    return this.dataObj.files;
  }),
  checkedRows: [],

});
