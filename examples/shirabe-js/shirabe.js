var app = module.exports = require('appjs');
var fs = require('fs');
var lame = require('lame');
var Speaker = require('speaker');
var ID3 = require('id3')

var LastFmNode = require('lastfm').LastFmNode;
var lastfm = new LastFmNode({
  api_key: process.argv[2]
});

var playlist = '', repeat = -1;
var file_3v2, id3_3v2;
var artist, title, album;

app.serveFilesFrom(__dirname + '/content');

var menubar = app.createMenu([{
  label:'ファイル(&F)',
  submenu:[
	{
	  label:'開く...(&O)',
	  action: function(){
		window.frame.openDialog({
			type: 'open', // Either open or save
			title: 'Open...', // Dialog title, default is window title
			multiSelect: false, // Allows multiple file selection
			dirSelect: false, // Directory selector
			initialValue:'c:\\Program Files' // Initial save or open file name. Remember to escape backslashes.
		}, function( err , files ) {
			// save the file using fs module according to files array.
			playlist = files;

			file_3v2 = fs.readFileSync(playlist[0]);
			id3_3v2 = new ID3(file_3v2);
			id3_3v2.parse();
			artist = id3_3v2.get('artist');
			title = id3_3v2.get('title');
			album = id3_3v2.get('album');
			console.log(artist);
			console.log(title);
			console.log(album);

			window.updateTrackInfo(artist + ' - ' + title);

			var request = lastfm.request("album.getInfo", {
				artist: artist,
				album: album,
				handlers: {
					success: function(data) {
						console.log("Success: " + data.album.name);
						console.log("Success: " + data.album.url);
						console.log("Success: " + data.album.image[4]['#text']);
						window.updateAlbumArt(data.album.image[4]['#text']);
					},
					error: function(error) {
						console.log("Error: " + error.message);
					}
				}
			});
		});
	  }
	},{
	  label:''//separator
	},{
	  label:'終了(&Q)',
	  action: function(){
		window.close();
	  }
	}
  ]
},{
  label:'再生(&P)',
  submenu:[
	{
	  label:'再生(&P)',
	  action:function(){
		fs.createReadStream(playlist[0])
		  .pipe(new lame.Decoder())
		  .on('format', function (format) {
//			console.error(format);
			this.pipe(new Speaker())
		    .on('close', function () {
			  console.log('closed');
			})
		  });
	  }
	},{
	  label:'停止(&S)',
	  action:function(){
//        speaker.flush();
		speaker.close();
	  }
	},{
	  label:''//separator
	},{
	  label:'リピート(&R)',
	  action:function(){
		  repeat = repeat * -1;
		  console.error(repeat);
      }
	}
  ]
},{
  label:'表示(&V)',
  submenu:[
	{
	  label:'Fullscreen',
	  action:function(item) {
		window.frame.fullscreen();
		console.log(item.label+" called.");
	  }
	},
	{
	  label:'Minimize',
	  action:function(){
		window.frame.minimize();
	  }
	},
	{
	  label:'Maximize',
	  action:function(){
		window.frame.maximize();
	  }
	},
	{
	  label:''//separator
	},
	{
	  label:'Restore',
	  action:function(){
		window.frame.restore();
	  }
	},
	{
	  label:''//separator
	},
	{
	  label:'Album Art Cover',
	  action:function(){
		window.changeAlbumArtSize('cover');
	  }
	},
	{
	  label:'Album Art Contain',
	  action:function(){
		window.changeAlbumArtSize('contain');
	  }
	},
  ]
},{
  label:'ヘルプ(&H)',
  submenu:[
	{
	  label:'開発ツール(&T)',
	  action:function(){
		window.frame.openDevTools()
	  }
	},{
	  label:''//separator
	},{
	  label:'情報(&A)',
	  action:function(){
		window.frame.restore();
	  }
	}
  ]
}]);

menubar.on('select',function(item){
  console.log("menu item "+item.label+" clicked");
});

var trayMenu = app.createMenu([{
  label:'Show',
  action:function(){
	window.frame.show();
  },
},{
  label:'Minimize',
  action:function(){
	window.frame.hide();
  }
},{
  label:'Exit',
  action:function(){
	window.close();
  }
}]);

var statusIcon = app.createStatusIcon({
  icon:'./content/icons/32.png',
  tooltip:'AppJS Hello World',
  showChrome : false,
  alpha: true,
  menu:trayMenu,
  disableSecurity: false
});

var window = app.createWindow({
  width  : 480,
  height : 503,
  icons  : __dirname + '/content/icons'
});

window.on('create', function(){
  console.log("Window Created");
  window.frame.show();
  window.frame.center();
  window.frame.setMenuBar(menubar);
});

window.on('ready', function(){
  console.log("Window Ready");
  window.process = process;
  window.module = module;

  function F12(e){ return e.keyIdentifier === 'F12' }
  function Command_Option_J(e){ return e.keyCode === 74 && e.metaKey && e.altKey }

  window.addEventListener('keydown', function(e){
	if (F12(e) || Command_Option_J(e)) {
	  window.frame.openDevTools();
	}
  });
  window.addEventListener("drop", drop);
});

window.on('close', function(){
  console.log("Window Closed");
});

var drop = function(event) {
	event.preventDefault();
	var dt = event.dataTransfer;
	var files = dt.files;
	for (var i = 0; i<files.length; i++) {
		var file = files[i];
		console.log(file);
		// File is an object having lastModifiedDate, name, size, type, webkitRelativePath
	}
}

