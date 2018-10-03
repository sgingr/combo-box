import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export default helper(function(params) {
  return htmlSafe('<div><pre>' + JSON.stringify(params[0], null, 4) + '</pre></div>');
});
