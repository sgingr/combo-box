import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({

  tableId: 'recurGrid',
  //checkedRows: [],
  tableHeight: 400,
  layoutObj: [
      {
        data: 'selected',
        label: ' ',
        width: 50,
        type: 'checkSelect',
        class: 'text-center',
        disableOn: function(row) {
          return (row.status === 'ISAMP Approved');
        }
      }, {
        data: 'ipFile',
        label: 'Input File',
        width: 342,
      }, {
        data: 'runcode',
        label: 'Runcode',
        width: 120,
      }, {
        data: 'recCnt',
        label: 'Record Count',
        width: 100,
        formatter: function(row) {
          return String(row.recCnt).replace(/(.)(?=(\d{3})+$)/g,'$1,')
        }
      }, {
        data: 'status',
        label: 'Status',
        width: 200,
      }, {
        data: 'xmedicLink',
        label: ' ',
        width: 100,
        class: 'text-center recur-clickable',
        formatter: function(row) {
          return (row.xmedicLink === 1) ? 'Xmedic' : '';
        }
      }, {
        data: 'cancel',
        label: ' ',
        width: 100,
        action: 'cancelFile',
        class: 'text-center recur-clickable',
        formatter: function() {
          return 'Cancel File';
        }
      }
    ],

    init() {
      let obj = this;
      obj._super(...arguments);
      obj.set('lastRefresh', new Date());
    },

    actions: {
      cancelFile(row) {
        console.log('Totally cancelled it yo..');
        console.log(row);
      }
    }

});
