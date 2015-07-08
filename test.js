var showsearcher = require('./index.js');
var Q = require('q');
//opensubtitles = require('opensubtitles-client');

// showsearcher({
//     name: 'supernatural',
//     season: 9,
//     episode: 15,
//     quality: '720p'
// }, function(error, results) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log(results);
//     }
// });

showsearcher({
    name: 'the flash',
    season: 1,
    episode: 22,
    quality: '720p'
})    .then(function(finalData) {
        console.log(finalData);
    })
    .
catch (function(error) {
    console.log(error);
});