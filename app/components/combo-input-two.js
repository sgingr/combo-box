import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import $ from 'jquery';

export default Component.extend({
  /*
  | -----------------------------------------------------------------------
  |  Properties
  | -----------------------------------------------------------------------
  */
  selectId: computed('comboName', function() {
    return '#' + this.comboName;
  }),
  selectize: computed('mainObj', function() {
    if(this.mainObj) {
      return this.mainObj[0].selectize;
    }
  }),
  disabledObsrv: observer('disabled', function() {
    let obj = this;
    obj._handleDisable();
  }),
  valueObsrv: observer('value', function() {
    let obj = this;
    if(obj.selectize) {
      console.log(obj.selectize);
      console.log('Setting in the value observer');
      obj.selectize.clear(true);
      obj.selectize.addItem(obj.value, true);
    }
  }),

  /*
  | -----------------------------------------------------------------------
  |  Properties
  | -----------------------------------------------------------------------
  */
  didInsertElement() {
    let obj = this;

    obj.set('mainObj', $(obj.selectId).selectize({
      create: true,
      persist: false,
      openOnFocus: false,
      selectOnTab: true,
      sortField: obj.labelField,
      valueField: obj.valueField,
      labelField: obj.labelField,
      searchField: obj.labelField,
      options: obj.options,
      maxOptions: 100,
      onChange: function(value) {
        console.log('You changed me!! ' + value);
        obj.set('value', value);
      },
      items: [obj.value]
    }));

    //Trigger initial disable if present
    obj._handleDisable();
  },

  /*
  | -----------------------------------------------------------------------
  |  _handleDisable
  | -----------------------------------------------------------------------
  */
  _handleDisable() {
    let obj = this;
    if(obj.selectize) {
      if(obj.disabled) {
        console.log('Disabling');
        obj.selectize.disable();
      } else {
        console.log('Enabling');
        obj.selectize.enable();
      }
    }
  }
});
