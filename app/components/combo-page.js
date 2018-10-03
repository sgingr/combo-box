import Component from '@ember/component';
import { computed } from '@ember/object';
import data from '../data';

export default Component.extend({
  dataObj: data.create(),
  options: computed('dataObj', function() {
    return this.dataObj.company;
  }),
  value: {},

});
