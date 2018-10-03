import Component from '@ember/component';
import { computed, observer } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { later } from '@ember/runloop';
import { copy } from 'ember-copy';

export default Component.extend({
  /*
  | -----------------------------------------------------------------------
  |  Properties
  | -----------------------------------------------------------------------
  */
  inputId: computed('comboName', function() {
    return '#' + this.comboName + '-input';
  }),
  containerId: computed('comboName', function() {
    return '#' + this.comboName + '-combo-container';
  }),
  itemContainerId: computed('comboName', function() {
    return '#' + this.comboName + '-combo-item-container';
  }),
  menuId: computed('comboName', function() {
    return '#' + this.comboName + '-combo-option-menu';
  }),
  highlightedItemId: computed('comboName', function() {
    return '#' + this.comboName + '-combo-item-container .' + this.hoverClass;
  }),
  totalItems: computed('filteredOptions', function() {
    if(this.get('filteredOptions')) {
      return this.get('filteredOptions').length;
    }
  }),
  sortedOptions: computed('labelField', 'options', function() {
    return this.options.sortBy(this.labelField);
  }),
  shownItems: computed('filteredOptions', 'scrollTop', function() {
    const itemsBefore = Math.min(Math.floor(this.scrollTop / this.itemHeight), this.totalItems - this.itemsRendered);
    const itemsAfter = this.totalItems - (itemsBefore + this.itemsRendered);
    if(this.itemContainer) {
      const paddingTop = itemsBefore * this.itemHeight;
      const paddingBottom = itemsAfter * this.itemHeight;
      this.itemContainer.css({ paddingTop, paddingBottom });
    }
    this.set('startIdx', itemsBefore);
    this.set('endIdx', itemsBefore + this.itemsRendered);
    let startWithPad = (this.startIdx > 5) ? this.startIdx - 5 : this.startIdx;
    if(this.filteredOptions) {
      return this.get('filteredOptions').slice(startWithPad, this.endIdx);
    } else {
      return [];
    }
  }),
  value: {},
  filteredOptions: [],
  itemHeight: 20,
  itemsRendered: 12,
  lastFirstItem: 0,
  menuAnimationSpeed: 300,
  hoverClass: 'combo-item-hovered',
  enterKeyPress: false,
  autoCompleteEngaged: false,
  autoCompleteOff: true,

  /*
  | -----------------------------------------------------------------------
  |  Event namespaces
  | -----------------------------------------------------------------------
  */
  inputBlurNs: computed('comboId', function() {
    return 'blur.hideMenuDoc.' + this.comboName;
  }),
  selectNs: computed('comboId', function() {
    return 'click.selectNs.' + this.comboName;
  }),

  /*
  | -----------------------------------------------------------------------
  |  Event Methods
  | -----------------------------------------------------------------------
  */
  onValueChange(value){},
  onComboClick(event){},
  onValueChange(){},

  /*
  | -----------------------------------------------------------------------
  |  Event Listeners
  | -----------------------------------------------------------------------
  */
  keyDown(event) {
    var obj = this;
    var charCode = event.which;

    if(charCode === 40) { //Down Key
      if(!obj.menuShown) {
        obj.showOptionMenu(obj);
      } else {
        let current = obj.getHighlightedItemId(obj);
        obj.shiftHighlightedItemId(obj, current, 1);
      }
    } else if(charCode === 38) { //Up Key
      let current = obj.getHighlightedItemId(obj);
      obj.shiftHighlightedItemId(obj, current, -1);
    } else if(charCode === 13) { //Enter key
      let current = obj.getHighlightedItemId(obj);
      obj.set('enterKeyPress',true);
      if(current >= 0) {
        let text = $('#' + obj.comboName + '-combo-option-' + current).text();
        obj.setValue(obj, text);
        obj.hideOptionMenu(obj);
      } else if (obj.autoCompleteEngaged) {
        obj.set('autoCompleteEngaged',false);
        //obj.set('comboDisplay', $(obj.comboMainId).val());
        obj.hideOptionMenu(obj);
      }
    } else if(charCode === 27) { //Escape
      obj.hideOptionMenu(obj);
    } else if(charCode === 8 || charCode === 46) { //Backspace or Delete
      if(obj.autoCompleteEngaged) {
        obj.set('autoCompleteOff', true);
      }
    }
  },

  /*
  | -----------------------------------------------------------------------
  |  init
  | -----------------------------------------------------------------------
  */
  init() {
    let obj = this;

    obj.set('filteredOptions', computed('sortedOptions', 'value.' + obj.labelField, {
      get(key) {
        let val = obj.get('value.' + obj.labelField);
        if(val && val.length > 0) {
          return obj.sliceOptions(val);
        } else {
          return obj.sortedOptions;
        }
      },
      set(key, value) {
        return value;
      }
    }));
    this._super(...arguments);
  },

  /*
  | -----------------------------------------------------------------------
  |  didInsertElement
  | -----------------------------------------------------------------------
  */
  didInsertElement() {
    var obj = this;

    obj.set('scrollContainer',$(obj.containerId));
    obj.set('itemContainer',$(obj.itemContainerId));

    //Menu element
    obj.set('optionMenu', $(obj.menuId));

    //Input element
    obj.set('inputElem', $(obj.inputId));

    //Scroll listener
    obj.scrollContainer.scroll(() => {
      obj.set('scrollTop', obj.scrollContainer.scrollTop());
    });

    //Blur listener
    obj.inputElem.on(obj.inputBlurNs, function() {
      obj.hideOptionMenu();
      obj.setValue();
    });

    //Click option regex pattern
    let elemIdPattern = new RegExp(obj.comboName + '-combo-option-');

    //Select item listener
    obj.itemContainer.on(obj.selectNs, function(event) {
      if(event.target && elemIdPattern.test(event.target.id)) {
        let text = event.target.textContent;
        obj.setValue(obj, text);
      }
    });

    //Filter Change observer
    obj.addObserver('filteredOptions.length', obj, function() {
      if(!obj.menuShown && !obj.justSet) {
        obj.showOptionMenu();
      } else {
        obj.set('justSet', false);
      }
    });

    obj.set('scrollTop', 0);

  },

  /*
  | -----------------------------------------------------------------------
  |  actions
  | -----------------------------------------------------------------------
  */
  actions: {
    showMenu() {
      let obj = this;
      obj.showOptionMenu();
    },
    handleItemHover(event) {
      var obj = this;
      let id = event.target.id;
      $(obj.itemContainerId + ' div').removeClass(obj.hoverClass);
      $('#' + id).addClass(obj.hoverClass);
    },
  },

  /*
  | -----------------------------------------------------------------------
  |  setValue
  | -----------------------------------------------------------------------
  */
  setValue(obj, text) {
    //let obj = this;
    if(!obj.value) {
      let tmp = {};
      tmp[obj.labelField] = "";
      obj.set('value', tmp);
    }
    obj.set('justSet', true);
    obj.set('value', copy(obj.options.findBy(obj.labelField, text)));
    obj.set('scrollTop', 0);
  },

  /*
  | -----------------------------------------------------------------------
  |  showOptionMenu
  | -----------------------------------------------------------------------
  */
  showOptionMenu() {
    let obj = this;
    if(!obj.menuShown) {
      obj.inputElem.focus();
      obj.optionMenu.show(obj.menuAnimationSpeed);
      obj.set('menuShown', true);
    }
  },

  /*
  | -----------------------------------------------------------------------
  |  hideOptionMenu
  | -----------------------------------------------------------------------
  */
  hideOptionMenu() {
    let obj = this;
    obj.optionMenu.hide(obj.menuAnimationSpeed);
    //obj.set('menuShown', false);
    later(obj, function() {
      obj.set('menuShown', false);
    }, 500);
  },

  /*
  | -----------------------------------------------------------------------
  |  setValue
  | -----------------------------------------------------------------------
  */
  setValue() {
    let obj = this;
    //Set the value object
    console.log('In the closer');
    console.log('name = ' + obj.value[obj.labelField]);
    let item = obj.options.findBy(obj.labelField, obj.value[obj.labelField]);
    if(item) {
      console.log('setting value to ');
      console.log(item);
      obj.set('value', item);
    } else {
      let tmp = {};
      tmp[obj.labelField] = obj.value[obj.labelField];
      //tmp[obj.valueField] = obj.value[obj.labelField];
      console.log('setting value to ');
      console.log(tmp);
      obj.set('value', tmp);
    }
  },

  /*
  | -----------------------------------------------------------------------
  |  sliceOptions
  | -----------------------------------------------------------------------
  */
  sliceOptions(pattern) {
    let obj = this;
    let first = 0;
    let last = obj.sortedOptions.length-1;
    let len = pattern.length;
    console.log('pattern = ' + pattern);
    for(var i=0; i<obj.sortedOptions.length; i++) {
      if(obj.sortedOptions[i][obj.labelField].length >= len) {
        if(obj.sortedOptions[i][obj.labelField].substring(0,len).toUpperCase() === pattern.toUpperCase()) {
          first = i;
          //console.log('first Str = ' + obj.sortedOptions[i][obj.labelField].substring(0,len).toUpperCase());
          break;
        }
      }
    }

    for(var i=first; i<obj.sortedOptions.length; i++) {
      if(obj.sortedOptions[i][obj.labelField].length >= len) {
        if(obj.sortedOptions[i][obj.labelField].substring(0,len).toUpperCase() !== pattern.toUpperCase()) {
          last = i - 1;
          //console.log('last Str = ' + obj.sortedOptions[i][obj.labelField].substring(0,len).toUpperCase());
          break;
        }
      }
    }
    console.log('FIRST: ' + first);
    console.log('LAST : ' + last);
    return obj.sortedOptions.slice(first, last);
  },

  /*
  | -----------------------------------------------------------------------
  |  getHighlightedItemId - returns the first highlighted item from list
  | -----------------------------------------------------------------------
  */
  getHighlightedItemId(obj) {
    let id = -1;
    let sels = $(obj.highlightedItemId);
    if(sels.length > 0) {
      let parts = sels[0].id.split("-");
      id = parseInt(parts[parts.length-1]);
    }
    console.log('highlighted: ' + id);
    return id;
  },

  /*
  | -----------------------------------------------------------------------
  |  shiftHighlightedItemId - change hightlighted item (keyup/down)
  | -----------------------------------------------------------------------
  */
  shiftHighlightedItemId(obj, id, offset) {
    let nextId = id + offset;
    nextId = (nextId < 0) ? 0 : nextId;
    console.log('nextId: ' + nextId);
    if(nextId < (obj.shownItems.length)) {
      //Scroll menu
      obj.scrollMenu(obj.comboName + '-combo-option-' + nextId);
      //Remove current highlight
      $('#' + obj.comboName + '-combo-option-' + id).removeClass(obj.hoverClass);
      //Add highlight to next or previous
      $('#' + obj.comboName + '-combo-option-' + nextId).addClass(obj.hoverClass);
    }
  },

  /*
  | -----------------------------------------------------------------------
  |  scrollMenu - highlighted item is scrolled to view
  | -----------------------------------------------------------------------
  */
  scrollMenu(id) {
    let obj = this;
    console.log('id === ' + id);
    let elem = document.getElementById(id);
    //let parent = elem.parentNode;
    let parent = document.getElementById(obj.comboName + '-combo-container');
    let vpadding = 4;
    let bottom = (parent.scrollTop + (parent.offsetHeight - vpadding) - elem.offsetHeight);
    let top = parent.scrollTop + vpadding;
    if (elem.offsetTop <= top){
      parent.scrollTop = elem.offsetTop - vpadding;
    } else if (elem.offsetTop >= bottom) {
      parent.scrollTop = elem.offsetTop - ((parent.offsetHeight - vpadding) - elem.offsetHeight) ;
    }
  },
});
