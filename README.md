show searcher
=========

Search your show, get torrent file.

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