var request = require('request'),
    xml2js = require('xml2js'),
    Q = require('q'),
    parser = new xml2js.Parser(),
    opensubtitles = require('opensubtitles-client'),
    originalRequest;


var getSubtitles = function(showData, callback) {
    var deferred = Q.defer();

    opensubtitles.api.login()
        .done(function(token) {
            opensubtitles.api.search(token, 'all', showData.torrentData.fileName)
                .done(
                    function(results) {
                        var langList = [];
                        var subtitles = [];

                        var addUTF = function(url) {
                            var a = url;
                            var position = a.indexOf('download/');
                            var b = 'subencoding-utf8/';
                            var output = [a.slice(0, position), b, a.slice(position)].join('');
                            return output;
                        }

                        for (var i = 0; i < results.length; i++) {
                            if (langList.indexOf(results[i].SubLanguageID) === -1) {
                                langList.push(results[i].SubLanguageID);
                            };
                        };

                        for (var i = 0; i < langList.length; i++) { //filter elements of same language together for logic
                            var langSubs = results.filter(function(element) {
                                return element.SubLanguageID === langList[i];
                            })

                            var bestMatch = langSubs.filter(function(element) { //filter subs where release matches release name
                                if (element.MovieReleaseName.toLowerCase().replace(/\-/g, '.').indexOf(showData.torrentData.fileName.toLowerCase().replace(/\.(ettv|eztv|publichd)/g, '')) !== -1) {
                                    return element;
                                }
                            });

                            if (bestMatch.length === 0) {
                                continue;
                            }

                            bestMatch.sort(function(a, b) {
                                return b.SubDownloadsCnt - a.SubDownloadsCnt;
                            });



                            subtitles.push({ //pushes exact match to subtitles array
                                subtitleURL: addUTF(bestMatch[0].SubDownloadLink),
                                zipURL: addUTF(bestMatch[0].ZipDownloadLink),
                                srtURL: addUTF(bestMatch[0].SubDownloadLink).slice(0, addUTF(bestMatch[0].SubDownloadLink).length - 2) + 'srt',
                                languageID: bestMatch[0].SubLanguageID,
                                ISO639: bestMatch[0].ISO639,
                                language: bestMatch[0].LanguageName,
                                exactMatch: true,
                                releaseName: bestMatch[0].MovieReleaseName.toLowerCase().replace(/\-/g, '.')
                            });

                        };

                        for (var i = 0; i < subtitles.length; i++) { //remove langs that we already have best match from list
                            langList.splice(langList.indexOf(subtitles[i].languageID), 1);
                        };

                        for (var i = 0; i < langList.length; i++) { //filter elements of same language together for logic
                            var unsureLangSubs = results.filter(function(element) {
                                return element.SubLanguageID === langList[i];
                            })

                            unsureLangSubs.sort(function(a, b) {
                                return b.SubDownloadsCnt - a.SubDownloadsCnt;
                            })

                            subtitles.push({ //pushes exact match to subtitles array
                                subtitleURL: addUTF(unsureLangSubs[0].SubDownloadLink),
                                zipURL: addUTF(unsureLangSubs[0].ZipDownloadLink),
                                srtURL: addUTF(unsureLangSubs[0].SubDownloadLink).slice(0, addUTF(unsureLangSubs[0].SubDownloadLink).length - 2) + 'srt',
                                languageID: unsureLangSubs[0].SubLanguageID,
                                ISO639: unsureLangSubs[0].ISO639,
                                language: unsureLangSubs[0].LanguageName,
                                exactMatch: false,
                                releaseName: unsureLangSubs[0].MovieReleaseName.toLowerCase().replace(/\-/g, '.')
                            });

                        };



                        showData.subtitles = subtitles; //add array to general show object
                        deferred.resolve(showData);
                    }
                );
        });

    return deferred.promise.nodeify(callback);
}

//searching for the torrent
var getSearchRSS = function(searchString, callback) {
    var requestURL = 'http://kat.cr/json.php?q=',
        deferred = Q.defer();

    request(requestURL + searchString, function(error, response, body) {
        body = JSON.parse(body);
        if (!error && response.statusCode == 200) {
            if (body.list) {
                deferred.resolve(body.list);
            } else {
                deferred.reject(new Error('Episode not found'));
            }
        } else {
            deferred.reject(new Error('Episode not found'));
        }
    });

    return deferred.promise.nodeify(callback);
}

//just parsing the search response
var parseRSS = function(rawBody, callback) {
    var deferred = Q.defer();

    parser.parseString(rawBody, function(err, result) {
        if (!err) {
            deferred.resolve(result);
        } else {
            deferred.reject(new Error('Couldn\'t parse response'));
        }
    });

    return deferred.promise.nodeify(callback);
}

//get the parsed rss, sort by seeds and get the best.
var findBestTorrent = function(data, callback) {
    var torrentList = data,
        bestTorrent,
        fileName,
        deferred = Q.defer();

    torrentList.sort(function(a, b) {
        return b.seeds - a.seeds;
    });

    fileName = torrentList[0].torrentLink;
    fileName = fileName.substring(fileName.indexOf('[kat.cr]') + ('[kat.cr]').length, fileName.length);

    bestTorrent = {
        showName: originalRequest.showName,
        season: originalRequest.season,
        episode: originalRequest.episode,
        quality: originalRequest.quality,
        torrentData: {
            title: torrentList[0].title,
            seeds: torrentList[0].seeds,
            fileName: fileName,
            torrent: torrentList[0].torrentLink,
            fileSize: torrentList[0].size
        }
    }

    deferred.resolve(bestTorrent);
    return deferred.promise.nodeify(callback);

}


//util function to clean show name in case it brings weird characters
var cleanShowName = function(showName) {
    var newShowName = showName.replace(/\([0-9]{4}\)/g, '');
    newShowName = newShowName.replace(/[\']/g, '');
    newShowName = newShowName.replace(/[\(\)\:\!\?\,\.]/g, ' ');
    newShowName = newShowName.replace(/&/g, 'and');

    return newShowName;
};

var getShow = function(options, callback) {
    /*
    options = {
    name: show's name
    season:
    episode:
    quality:
    }
    */
    var seasonString = ('0' + options.season).slice(-2),
        episodeString = ('0' + options.episode).slice(-2),
        name = cleanShowName(options.name),
        filters,
        quality = ['hdtv', '720p', '1080p'],
        deferred = Q.defer();

    options.quality = options.quality.toLowerCase();

    if (quality.indexOf(options.quality) < 0) {
        //return callback(new Error('Quality not valid'));
        deferred.reject(new Error('Invalid quality value'));
    }

    switch (options.quality) {
        case 'hdtv':
            filters = '-720p -1080p';
            break;
        case '720p':
            filters = '-1080p';
            break;
        case '1080p':
            filters = '-720p';
            break;

    }


    var searchString = name + ' s' + seasonString + 'e' + episodeString + ' ' + options.quality;// + ' ' + filters + ' seeds:100 verified:1';

    originalRequest = {
        showName: options.name,
        season: options.season,
        episode: options.episode,
        quality: options.quality
    }

    deferred.resolve(searchString);
    return deferred.promise.nodeify(callback);

}


module.exports = function(options, callback) {
    var deferred = Q.defer();

    var promise = getShow(options);
    promise.then(getSearchRSS)
        // .then(parseRSS)
        .then(findBestTorrent)
        .then(getSubtitles)
        .then(function(finalData) {
            deferred.resolve(finalData);
        })
        .
    catch(function(error) {
        deferred.reject(error);
    });
    return deferred.promise.nodeify(callback);
}
