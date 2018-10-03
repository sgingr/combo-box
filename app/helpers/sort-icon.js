import { helper } from '@ember/component/helper';

export function sortIcon(params/*, hash*/) {

  if(params[0] === params[1]) {
    if(params[2]) {
      return "fa fa-sort-desc";
    } else {
      return "fa fa-sort-asc";
    }
  } else {
    return "";
  }
}

export default helper(sortIcon);
