var showsearcher = require('./index.js');

showsearcher({
        name: 'the flash',
        season: 1,
        episode: 22,
        quality: '1080p'
    }).then(function(finalData) {
        console.log(finalData);
    })
    .catch(function(error) {
        console.log(error);
    });
