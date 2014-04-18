show searcher
=========

Search your show, get torrent file and subtitles.

I made this for another app I'm building. It's not perfect, mainly because most data sources are not perfect either.

It looks for torrents using the kickass search engine, selecting the verified torrent with the higher number of seeds(minimum 100). The search engine is pretty good, but also pretty exact. For example: 'american dad!' won't return anything. Mostly because most torrent files are stripped of all weird characters, such as :, . , ! , etc. The module will remove or replace these characters according to what will return something better.
For example: 'Marvel's agents S.H.I.E.L.D.' will be changed to 'marvels agent of s h i e l d', and the search will be successful.
Why did I write all this name parsing thingies? Because I wanted to use TVDB data.

Again, it's not perfect, but it works pretty well.

Once it gets that data, it searches opensubtitles using the torrent filename as the query string. This returns plenty of subtitles, so it groups them by language and sorts them by their download count. It also checks to see if the torrent filename matches the sub movie(even if they are tv shows) release name. By doing this we make sure that if there is an exact match for certain language, that's the one it will return. For the rest of the languages, it returns the sub with more downloads, but we can't be certain it's gonna work.


## Installation

  npm install showsearcher --save

## Usage



  var showsearcher = require('showsearcher');
      

  showsearcher({name: 'game of thrones',season: 4, episode:2, quality: '720p'}, function(err, result){
  	if(!err){
  	  console.log(result);
	}else{
	  console.log(err);
	}
	
  });
