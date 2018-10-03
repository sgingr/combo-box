import Component from '@ember/component';
import { computed } from '@ember/object';
import data from '../data';

export default Component.extend({
  dataObj: data.create(),
  options: computed('dataObj', function() {
    return this.dataObj.company;
  }),
  value: 2,
  comboDisabled: true,

  actions: {
    setValue() {
      let obj = this;
      obj.set('value', 5);
    },
    disableCombo() {
      let obj = this;
      obj.toggleProperty('comboDisabled');
    }
  }

});
