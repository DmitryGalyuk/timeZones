/*jslint node: true */
/*jslint esversion: 6 */
'use strict';

function* generator() {
  let a = yield;

  return 2 * a;
}

let iterator = generator();

iterator.next();

console.log(iterator.next(2));
console.log(iterator.next(2));
console.log(iterator.next(2));
