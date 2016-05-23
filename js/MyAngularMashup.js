/* Always start a Javascript file with this enclosure and also end it with the enclosure at the end of the page */
(function(){

/* 
 * Documentation
 * @title: My Angular Mashup
 * @owner: Rogier Helmus
 */

/*
 *    Fill in the host and port for Qlik engine
 *    Host:
 *    - Use window.location.hostname for Sense Server
 *    - Use localhost for Sense Desktop development
 *    Port:
 *    - Use window.location.port for Sense Server
 *    - Use 4848 for Sense Desktop development
 */

/* The prefix variable takes the current browser url from start to the string of "/extensions" */
var prefix = window.location.pathname.substr( 0, window.location.pathname.toLowerCase().lastIndexOf( "/extensions" ) + 1 );

/* The config object stores the variables host, prefix, port and isSecure in an array */

/* Use for Sense Server */

var config = {
	host: window.location.hostname,
	prefix: prefix,
	port: window.location.port,
	isSecure: window.location.protocol === "https:"
};


/* Use for Sense Desktop */
/*
var config = {
	host: 'localhost', 
	prefix: prefix,
	port: 4848,
	isSecure: window.location.protocol === "https:"
};
*/

/* To avoid errors in dev-hub: you can comment out the following when you have added an app via -> var app = qlik.openApp('') */

/*
var app;
require.config( {
	baseUrl: (config.isSecure ? "https://" : "http://" ) + config.host + (config.port ? ":" + config.port : "" ) + config.prefix + "resources"
} );
*/

/* Require loads qlik.js from the /js folder from the baseUrl. [] = load dependency */
require( ["js/qlik"], function ( qlik ) {

	var control = false;


	qlik.setOnError( function ( error ) {
		$( '#popupText' ).append( error.message + "<br>" );
		if ( !control ) {
			control = true;
			$( '#popup' ).delay( 1000 ).fadeIn( 1000 ).delay( 11000 ).fadeOut( 1000 );
		}
	} );

	// Adding overflow:hidden to the html body element prevents scroll bars. 
	// This is default from the Sense mashup template. overflow:hidden can also be set through a custom css stylesheet
	// in stylesheet: body {overflow:hidden}
	$( "body" ).css( "overflow: hidden;" );


	// The AppUi function sets all the Sense action buttons and app layout (exclusing the visualisations)
	function AppUi ( app ) {
		var me = this;
		this.app = app;

		// Method used to get information if the user is working in personal mode 
		// (returns true if Qlik Sense Desktop is used) or not (returns false if Qlik Sense Desktop is not used)
		app.global.isPersonalMode( function ( reply ) {
			me.isPersonalMode = reply.qReturn;
		} );

		// Method used to get layout for this Qlik Sense app and registering a callback to receive the data. 
		// It returns the dynamic properties (if any) in addition to the fixed properties.
		// Property examples: layout.qTitle and layout.qLastReloadTime
		app.getAppLayout( function ( layout ) {
			// $( "#title" ).html -> this will set the html contents of the DOM element with id="title" to be layout.qTitle
			// A title that is set in the html file will be overwritten 
			$( "#title" ).html( layout.qTitle );
			// $( "#title" ).attr -> this will set the attr contents (hover over tooltip) of the DOM element with id="title" to be layout.ReloadTime
			$( "#title" ).attr( "title", "Last reload:" + layout.qLastReloadTime.replace( /T/, ' ' ).replace( /Z/, ' ' ) );
			
			//TODO: bootstrap tooltip ??

		} );

		// Method used to get a list of internal Qlik Sense objects and to register a callback to receive the data.
		// There are several list types that can be fetched. E.g. FieldList, DimensionList, BookmarkList, SelectionObject, Sheet, etc. 
		app.getList( 'SelectionObject', function ( reply ) {
			// Check from the reply if the selections object has no backward (<1) selections and then set the parent object (li) to
			// a class of disabled. Disable will make the button text light gray and prevents clicking on it.
			// With $( "[data-qcmd='back']" ) you target all DOM elements with the tag "data-qcmd" and tag-contents "back",
			// e.g. <a class="qcmd" data-qcmd="back">Back</a>
			$( "[data-qcmd='back']" ).parent().toggleClass( 'disabled', reply.qSelectionObject.qBackCount < 1 );
			// Check from the reply if the selections object has no foward (<1) selections  and then set the parent object (li) to
			// a class of disabled
			$( "[data-qcmd='forward']" ).parent().toggleClass( 'disabled', reply.qSelectionObject.qForwardCount < 1 );
		} );

		// Get the list of Bookmarks
		app.getList( "BookmarkList", function ( reply ) {
			var str = "";
			// The response (callback) is stored in the reply object. 
			// the .foreach function loops through all items in reply.qBookmarkList.qItems
			reply.qBookmarkList.qItems.forEach( function ( value ) {
				// Check if the item has a title (the item exists)
				if ( value.qData.title ) {
					// Create a html list (<li>) item in a string containing the bookmark-id (value.qInfo.qId) 
					// and the bookmark-title (value.qData.title). The id and title are in a clickable link (<a>)
					str += '<li><a data-id="' + value.qInfo.qId + '">' + value.qData.title + '</a></li>';
				}
			} );
			// After the creation of a html string (str variable) containing a list of bookmarks with links, add a bookmark create link
			str += '<li><a data-cmd="create">Create</a></li>';

			// Set html contents of the DOM element with id="qbmlist" to the contents of the str variable.
			// Execute a function when the user clicks somewhere in the list
			$( '#qbmlist' ).html( str ).find( 'a' ).on( 'click', function () {
				// If the clicked element contains a data-id class, then execute the app.bookmark.apply method with the bookmark-id
				var id = $( this ).data( 'id' );
				if ( id ) {
					app.bookmark.apply( id );
				} else {
					// If the clicked element contains a data-cmd class and the contents of the class is 'create', then load the 
					// create bookmark modal (bookmark popup, see html)
					var cmd = $( this ).data( 'cmd' );
					if ( cmd === "create" ) {
						$( '#createBmModal' ).modal();
					}
				}
			} );
		} );

		// Catch clicks on all DOM elements with tag data-qcmd and perform a corresponding Sense command
		// e.g. <a class="qcmd" data-qcmd="back">Back</a>
		$( "[data-qcmd]" ).on( 'click', function () {
			var $element = $( this ); 
			// The switch-case function is an if-then-else form, read 'case' as 'if'
			switch ( $element.data( 'qcmd' ) ) {
				//app level commands
				case 'clearAll':
					app.clearAll();
					break;
				case 'back':
					app.back();
					break;
				case 'forward':
					app.forward();
					break;
				case 'lockAll':
					app.lockAll();
					break;
				case 'unlockAll':
					app.unlockAll();
					break;
				case 'createBm':
					var title = $( "#bmtitle" ).val(), desc = $( "#bmdesc" ).val();
					app.bookmark.create( title, desc );
					$( '#createBmModal' ).modal( 'hide' );
					break;
			}
		} );
	}

	/*
	 * Insert callback functions here
	 */  

	// QUESTION: what does this function have to do with the created list (also has v in it)
	function v(reply, app){}

	// QUESTION: What does this function do?
	function callback(reply, app){}


	/*
	 * Insert open apps here
	 */ 
	// Use the hashed app id when the mashup is published on the Sense server
	var app = qlik.openApp('a2ad16b8-e2e0-4c94-8472-c624aca49d34', config); 
	
	// Use the app name when the mashup is published in Sense Desktop
	// var app = qlik.openApp('Consumer_Sales.qvf', config);

	/*
	 * Insert the creation and retrieval of app objects here
	 */ 
	
	// Use the hashed object id when the mashup is published on the Sense server	
	app.getObject('QV02','7ddd7f2b-45ab-408a-a4ad-be6a7be0e732'); //Sales over time (line)
	app.getObject('QV01','9c00a669-1a82-427b-9460-d9b1b69f883d'); //Sales by product group (horizontal bar)
	
	// Use the short hashed object id when the mashup is published in Sense Desktop
	//app.getObject('QV02','JcJvj'); //Sales over time (line)
	//app.getObject('QV01','akDGX'); //Sales by product group (horizontal bar)

	// Alternative option to get a visualisation object through the visualization API
	/*
	app.visualization.get('akDGX').then(function(vis){
		vis.show("QV99");
	});
	*/

	// Example of creating a visualsation through the Visualisation API
	// More examples at: http://help.qlik.com/en-US/sense-developer/2.2/Subsystems/APIs/Content/VisualizationAPI/VisualizationAPI.htm
	app.visualization.create(
		'barchart',
		["Product Sub Group","=Sum([Sales Amount])"],
		{"title":"On the fly barchart"}
	).then(function(vis){
		vis.show("QV03"); // Binds the visualisation to objectid QV03
	});

	/*
	 * Insert the creation of Hypercubes and Lists here
	 */ 

	// Example: Create a Bootstrap html buttonlist from a list of cities from the City dimension through a Sense Hypercube
	app.createCube({
		qDimensions: [{
			qDef: {
				qFieldDefs: ["City"]
			}
		}],
		qInitialDataFetch:[{
			qHeight: 5, // Limit the number of cities to 5
			qWidth: 1 
		}]
	},function(reply){
		$("#buttonList").empty();

		// Loop through the 5 cities from the Hypercube
		$.each(reply.qHyperCube.qDataPages[0].qMatrix, function(){
			var item=this[0];
			if(!item.qIsEmpty) {
				$("#buttonList").append("<button type='button' class='btn btn-primary'>" + item.qText + "</button>");
			}
		});
	}
	);

	// Example: Create a Bootstrap html table from a list of Product Lines from a Sense List for id="productList"
	app.createList({
	"qDef": {
		"qFieldDefs": [
			"Product Type Desc"
		]
	},
	"qInitialDataFetch": [{
			qTop : 0,
			qLeft : 0,
			qHeight : 5,
			qWidth : 1
		}]
	}, function(reply) {
		var str = "";
		str += '<table class="col-md-12 table table-striped table-bordered table-hover"><tr><th>Product Types</th><th>Search Google</th><th>More info</th></tr>';
		$.each(reply.qListObject.qDataPages[0].qMatrix, function(key, value) {
			str += '<tr><td>' + value[0].qText + '</td><td><a class="button btn-success btn-sm" href="https://www.google.nl/search?&q=' + value[0].qText + '">Google</a></td>' +
				 '<td><button class="button btn-primary btn-sm" data-toggle="collapse" data-target="#demo">Info</button>' +
					'<div id="demo" class="collapse">'+ value[0].qText +'</div></td></tr>'
					;
		});
		str += '</table>';
		$('#productList').html(str);
	});

	// QUESTION: What does this do?
	if ( app ) {
		new AppUi( app );
	}

// End of require
} );

//Always end a Javascript file with this enclosure and also start it with the enclosure at the top of the page
})();
