var showsearcher = require('./index.js');

showsearcher({
        name: 'the flash',
        season: 1,
        episode: 17,
        quality: '720p'
    }).then(function(finalData) {
        console.log(finalData);
    })
    .
catch(function(error) {
    console.log(error);
});
