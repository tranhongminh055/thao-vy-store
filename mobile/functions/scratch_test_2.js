const val = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
console.log('encodeURIComponent:', encodeURIComponent(val).replace(/%20/g, '+'));
console.log('URLSearchParams:   ', new URLSearchParams({x: val}).toString().substring(2));
