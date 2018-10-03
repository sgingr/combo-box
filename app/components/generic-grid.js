import Component from '@ember/component';
import { set, computed, observer } from '@ember/object';
import { copy } from 'ember-copy';
import { debounce, later, cancel } from '@ember/runloop';
import { htmlSafe } from '@ember/string';
import $ from 'jquery';

export default Component.extend({
  mainId: computed('tableId', function() {
    return '#' + this.tableId;
  }),
  isLoadingObsrv: observer('isLoading', function() {
    if(this.isLoading) {
      this.showLoader(this);
    } else {
      this.hideLoader(this);
    }
  }),
  headerWidth: computed('layout.@each.width', function() {
    let tot = 0;
    this.layoutObj.forEach((fld) => {
      tot += fld.width;
    })
    return tot;
  }),
  dataObsrv: observer('data', function() {
    this.preProcessData(this);
  }),
  checkedRowsObsrv: observer('data.@each._checked', function() {
    console.log('up in teh check obsrv..');
    this.set('checkedRows', this.data.filterBy('_checked'));
    /*
    let tmp = [];
    this.data.forEach((item, idx) => {
      if(item._selected) {
        tmp.pushObject(idx);
      }
    });
    return tmp;
    */
  }),

  /*
  | -----------------------------------------------------------------------
  |  Options
  | -----------------------------------------------------------------------
  */
  maxWidth: null,
  tableHeight: null,
  resizeCols: true,
  verticalLinesHeader: true,
  verticalLines: false,
  horizontalLines: true,
  lineStyle: 'solid 1px silver',
  sortByCol: null,
  minColWidth: 15,
  resizeColDelay: 50,
  isLoading: false,

  /*
  | -----------------------------------------------------------------------
  |  Event Listeners
  | -----------------------------------------------------------------------
  */
  mouseUp(event) {
    let obj = this;
    obj.mouseUpLeave(obj);
  },

  mouseLeave(event) {
    let obj = this;
    obj.mouseUpLeave(obj);
  },

  mouseMove(event) {
    let obj = this;

    debounce(obj,function() {
      if(obj.resizeObj) {
        let endWidth = obj.resizeObj.startWidth + (event.pageX - obj.resizeObj.startX);
        obj.set('endWidth',endWidth);
        if(obj.endWidth > obj.minColWidth ) {
          obj.resizeLineStart.css('left', obj.getFieldStartOffset(obj,obj.resizeObj.index) + endWidth + 'px');
        }
      }
    }, obj.resizeColDelay);
  },

  /*
  | -----------------------------------------------------------------------
  |  actions
  | -----------------------------------------------------------------------
  */
  actions: {
    /*
    | -----------------------------------------------------------------------
    |  resizeStart
    | -----------------------------------------------------------------------
    */
    resizeStart(idx,event) {
      let obj = this;
      if(!obj.resizeCols) {
        return true;
      }
      console.log(event);
      if(event.target.className.match(/grid-header-cell-outer/)) {
        let fld = obj.layoutObj.objectAt(idx);
        let start = fld.width;
        let hdrStartWidth = obj.headerWidth;
        let tmp = {
          index: idx,
          startWidth: start,
          startX: event.pageX,
          hdrStartWidth: hdrStartWidth
        }
        obj.set('resizeObj',tmp);
        console.log(obj.resizeObj);
        $(obj.mainId).addClass("grid-resizing-col");
        obj.resizeLineEnd.css('left', obj.getFieldStartOffset(obj,idx) + 'px');
        obj.resizeLineStart.show();
        obj.resizeLineStart.css('left', obj.getFieldEndOffset(obj,idx) + 'px');
        obj.resizeLineEnd.show();
      }
    },

    /*
    | -----------------------------------------------------------------------
    |  sortRowsBy
    | -----------------------------------------------------------------------
    */
    sortRowsBy(key) {
      let obj = this;
      obj.sortByCol == key ? obj.toggleProperty('reverseSort') : obj.set('sortByCol', key);
      if(obj.reverseSort) {
        obj.set('data',obj.data.sortBy(obj.sortByCol).reverse());
      } else {
        obj.set('data',obj.data.sortBy(obj.sortByCol));
      }
    },

    /*
    | -----------------------------------------------------------------------
    |  sendActionUp
    | -----------------------------------------------------------------------
    */
    sendActionUp(actionName, row) {
      let obj = this;
      obj.sendAction(actionName, row);
    }
  },

  /*
  | -----------------------------------------------------------------------
  |  setUpScroll
  | -----------------------------------------------------------------------
  */
  didInsertElement() {
    let obj = this;

    //Preprocess Data
    obj.preProcessData(obj);

    //Resize Lines
    obj.set('resizeLineStart', $(obj.mainId + ' .grid-start-line'));
    obj.set('resizeLineEnd', $(obj.mainId + ' .grid-end-line'));

    if(obj.sortPrimary && obj.sortSecondary) {
      obj.set('data',obj.data.sortBy(obj.sortPrimary).sortBy(obj.sortSecondary));
    }

    obj.set('origData',copy(obj.data,true));

    //Height of table
    if(obj.tableHeight) {
      $(obj.mainId + ' .grid-body-section').css('height',obj.getWidthStr(obj.tableHeight));
    }

    //Set up the scrolling header
    obj.setUpScroll(obj);

    //Store the Loader
    obj.set('loaderElem', $(obj.mainId + '-loader'));


  },

  /*
  | -----------------------------------------------------------------------
  |  preProcessData
  | -----------------------------------------------------------------------
  */
  preProcessData(obj) {
    console.log('preProcessData');

    if(!obj.layoutObj) {
      return;
    }

    //Set up layout defaults and Options
    obj.layoutObj.forEach((fld, idx) => {
      //Initial Sort
      set(fld, "sort", idx);
      //Display
      let display = (fld.display !== undefined) ? fld.display : true;
      set(fld, "display", display);

    });

    if(obj.data) {
      obj.data.forEach((row) => {
        //These are metadata items added to the original data under _pg property
        if(!row._pg) {
          //let rowId = obj.incrementProperty ('rowIdCounter');
          let meta = {
            _row: { _id: obj.incrementProperty ('rowIdCounter'), _selected: false, _checked: false, },
          }
          let isChecked = false;
          obj.layoutObj.forEach((fld, fldNum) => {
            let colObj = { _data: row[fld.data] };

            //Class for column
            if(fld.class) {
              if(typeof(fld.class) === 'function') {
                colObj._class = fld.class(row);
              } else {
                colObj._class = fld.class;
              }
            }

            //Link - expects a funtion that returns array of link params
            if(fld.link && typeof(fld.link) === 'function') {
              colObj._link = fld.link(row);
            }

            //Data formatter
            if(fld.formatter && typeof(fld.formatter) === 'function') {
              let data = fld.formatter(row);
              if(fld.html) {
                data = htmlSafe(data);
              }
              colObj._data = data;
              colObj._title = data;
            }

            //Display Filter
            if(fld.displayOnlyValues && Array.isArray(fld.displayOnlyValues)) {
              if(!fld.displayOnlyValues.includes(colObj._data)) {
                colObj._data = "";
              }
            }

            //Checkbox Select
            if(fld.type === 'checkSelect') {
              let showCheck = true;
              if(fld.disableOn && typeof(fld.disableOn) === 'function') {
                showCheck = !fld.disableOn(row);
              }
              if(showCheck) {
                obj.set('checkboxDataKey', fld.data);
                meta._row._checked = Boolean(row[fld.data]);
                isChecked = Boolean(row[fld.data]);
              } else {
                set(row, '_disabled', true);
              }
            }

            meta['_col-' + fldNum] = colObj

          })
          set(row, '_pg', meta);

          //Add checked rows
          let found = obj.checkedRows.findBy(obj.checkboxIdCol, row[obj.checkboxIdCol])
          if(isChecked && !found) {
            obj.checkedRows.pushObject(row);
          }
          //if(isChecked) {
          //  obj.checkedRows.addObject(row);
          //}
        }

      })
    } else {
      //obj.set('data',[]);
    }


    console.log(obj.data);
  },

  /*
  | -----------------------------------------------------------------------
  |  setUpScroll
  | -----------------------------------------------------------------------
  */
  setUpScroll(obj) {
    const leftStart = parseInt(($(obj.mainId + ' .grid-header-section').css('left')).replace(/\D/g,""));
    $(obj.mainId + ' .grid-body-section').scroll(function() {
      $(obj.mainId + ' .grid-header-section').css('left', leftStart + (-1*this.scrollLeft));
    });
  },

  /*
  | -----------------------------------------------------------------------
  |  getWidthStr
  | -----------------------------------------------------------------------
  */
  getWidthStr(width) {
    if(!width) {
      return '0px';
    }
    return width.toString().replace(/\D/,"") + 'px';
  },


  /*
  | -----------------------------------------------------------------------
  |  getFieldStartOffset
  | -----------------------------------------------------------------------
  */
  getFieldStartOffset(obj, idx) {
    let offset = 0;
    obj.layoutObj.forEach((fld, fldIdx) => {
      if(idx > fldIdx) {
        offset += fld.width;
      }
    })
    return offset;
  },

  /*
  | -----------------------------------------------------------------------
  |  getFieldEndOffset
  | -----------------------------------------------------------------------
  */
  getFieldEndOffset(obj, idx) {
    let offset = 0;
    obj.layoutObj.forEach((fld, fldIdx) => {
      if(idx >= fldIdx) {
        offset += fld.width;
      }
    })
    return offset;
  },

  /*
  | -----------------------------------------------------------------------
  |  mouseUpLeave
  | -----------------------------------------------------------------------
  */
  mouseUpLeave(obj) {
    if(obj.resizeObj) {
      let ew = (obj.endWidth > obj.minColWidth) ? obj.endWidth : obj.minColWidth;
      let fld = obj.layoutObj.objectAt(obj.resizeObj.index);
      set(fld, 'width', ew);
      $(obj.mainId).removeClass("grid-resizing-col");
      obj.set('resizeObj',null);
      obj.resizeLineStart.hide();
      obj.resizeLineEnd.hide();
    }
  },
});
