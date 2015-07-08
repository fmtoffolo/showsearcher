var showsearcher = require('./index.js');

showsearcher({
        name: 'the flash',
        season: 2,
        episode: 22,
        quality: '720p'
    }).then(function(finalData) {
        console.log(finalData);
    })
    .catch(function(error) {
        console.log(error);
    });
