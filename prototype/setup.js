// Notes about used libraries and location of plugin files:
// * jison ( http://zaach.github.com/jison/ )
//      The custom rules are in 'grammar.jison' file.
//      Library files were fetched from the project's github repo.
//      NOTE: jison was modified so that errors use 'this.lexer.yylineno' 
//      instead of was just 'yylineno' for line number. 
// * ace editor ( http://ace.ajax.org/index.html )
//      Custom highlighter mode is in 'mode-grammar.js'
//      Library files are based on the project's github 'ace-builds' repo
//      (and not the one directly linked from the project's website) and is
//      a copy of the 'src-noconflict' folder.
// [copies of around August 21st, 2012]

// HTML element IDs that need to be present in the .html file
var INFO ="info";
var EDITOR = "editor";
var OUTPUT = "output";
var EXAMPLES = "examples";
var AUTORUN = "autorun";
var TYPING = 'typing';
var TYPEINFO = 'typeinfo';
// convenient constants to use with jQuery
var _OUTPUT_ = "#"+OUTPUT;
var _AUTORUN_ = "#"+AUTORUN;
var _EXAMPLES_ = "#"+EXAMPLES;
var _CURSOR_ = "#cursor-position";
var _TYPEINFO_ = '#'+TYPEINFO;
var _TYPING_ = '#'+TYPING;
var _RESET_ = '#reset';

var TYPE_INFO_WIDTHS = null

$(document).ready(function() {
	
	
	$.ajaxSetup({ cache: false }); // FIXME debug
	
	//
	// window layout setup
	//
 
	window.onresize = function () {
		// note that all these constants must be set through javascript
		// or they will not be accessible to use in these computaitons.
		// the values are just empirically picked to look OK.
		
		var w = window.innerWidth;
		var h = window.innerHeight;

		// all values in pixels
		var console_height = 100;
		var split = 270;
		var horizontal_padding = 10;
		var vertical_padding = 5;
		var border_width = 1;
		
		var info = document.getElementById(INFO);
		info.style.width = (split-(2*horizontal_padding)-border_width)+"px";
		info.style.padding = vertical_padding+"px "+horizontal_padding+"px";
		info.style.borderRightWidth = border_width+"px";
	
		var editor = document.getElementById(EDITOR);
		editor.style.left = split+"px";
		editor.style.borderLeftWidth = border_width+"px";
    	editor.style.width = (w-split)+"px";
		
		editor.style.height = (h-console_height)+"px";
			
		var output = document.getElementById(OUTPUT);
		output.style.left = split+"px";
		//output.style.padding = vertical_padding+"px "+horizontal_padding+"px";
		output.style.borderWidth = border_width+"px";
		//output.style.width = (w-split-(2*horizontal_padding)-(2*border_width))+"px";
		output.style.width = (w-split)+"px";
		output.style.top = (h-console_height)+"px";
		//output.style.height = (console_height-(2*vertical_padding)-(2*border_width))+"px";
		output.style.height = (console_height)+"px";
		
		var typing = document.getElementById(TYPING);
		typing.style.padding = "5px 10px";
		typing.style.margin = "2px 2px";
		typing.style.border = "2px solid #f1c661";
		var maxWidth = (split-(2*10)-(2*2)-(2*2));
		var limitWidth = (w-(2*10)-(2*2)-(2*2));
		typing.style.maxWidth = maxWidth+"px";
		TYPE_INFO_WIDTHS = { max : maxWidth , limit : limitWidth };
	
	}
	
 	window.onresize(); // only do this after the rest is initialized!
    
    //
    // Editor and Buttons setup
    //
    
    var editor = ace.edit(EDITOR);

	(function(){
    	//editor.setTheme("ace/theme/twilight");
    	editor.setTheme("ace/theme/monokai");
    		
		var STYLE_LIST = $("#editor-style");
		$.get( "themes-list" , function(data) {
			var themes = data.split('\n');
			for( var i=0 ; i<themes.length ; ++i ){
				var name = themes[i];
				name = name.replace('-','/');
				name = name.replace('.js','');
				var option = $('<option/>', {
	        		value: name,
	        		text: name
				});
				STYLE_LIST.append(option);
	    	}
	    	
	    	STYLE_LIST.bind("change click", function () {
	    		editor.setTheme("ace/"+$(this).val());
    		});
	   });
	})();
	
    // disable code folding
    editor.getSession().setFoldStyle("manual");
    editor.getSession().setMode("ace/mode/grammar");
    editor.setShowPrintMargin(false);
	
	(function(){ // Examples buttons.
		var setEditor = function(text){
			// disable event handlers while updating content
			// to avoid having to handle incomplete events
			editor.selection.removeListener('changeCursor', onCursorChange);
			editor.removeListener('change', onChange);
						
			// set new source code and gain focus.
			editor.getSession().setValue(text);
			editor.focus();
						
			// re-enable event handlers
			editor.selection.on("changeCursor", onCursorChange);
			editor.on("change", onChange );
			onChange();
		}
		
		var addExample = function(file,name){
			var button = $('<button/>', {
				class: 'button',
	        	text: name,
	        	click: function(){
	        		button.text(name+' (Loading...)');
	        		
	        		$.get( file , function(data) {
						setEditor(data);
						button.text(name);
					});
				}
	    	});
			$(_EXAMPLES_).append(button);
		}
		
		$.get( "examples-list" , function(data) {
			var examples = data.split('\n');
			for( var i=0 ; i<examples.length ; ++i ){
				if( examples[i][0] != '#' ) // ignore commented stuff
					addExample( 'examples/'+examples[i] , examples[i] );
			}
		});
		
		//$("#examples").hide();
	    $("#examples-button").click(function() {
	        $("#examples").slideToggle(25);
	    });
	    
	    //load examples given as parameters
	    var parameters = document.URL.split('?');
	    if( parameters.length > 1 ){
	    	//console.log(document.URL);
	    	parameters = parameters[1].split('=');
	    	if( parameters.length > 1 ){
	    		var option = parameters[0];
	    		var value = parameters[1];
	    		switch( option ){
	    			case 'file': // load file
		    			$.get( value , function(data) {
							setEditor(data);
							//console.log(data);
						});
	    				break;
	    			default: // not other options for now.
	    				break;
	    		}
	    	}
	    }
    })();
    
    

	(function(){ // Auto-Run button
		var autorun = true;
		var button = $(_AUTORUN_);
		button.click( function(event){
			autorun = !autorun;
			button.html( autorun ? "<b>ON</b>" : "OFF");
			comm.autorun(autorun);			
			editor.focus();
		} );		
	})();
	
	var typeinfo = true;
	(function(){ // Typing-information panel.
		var button = $(_TYPEINFO_);
		var panel = $(_TYPING_);
		
		// toggle button.
		button.click( function(event){
			typeinfo = !typeinfo;
			if( typeinfo ){
				button.html("<b>SHOW</b>");
				if( panel.html() != '' )
					panel.show();
			}
			else{
				button.html("HIDE");
				panel.fadeOut('fast');
			}
			editor.focus();
		} );
	
		// quick way to hide just the panel.
		panel.click( function(){
			panel.fadeOut('fast');
			editor.focus();
		} );
		
		var t;
		panel.hover(function() {
	        window.clearTimeout(t);
	        t = window.setTimeout(function () {
	            panel.animate({"max-width": TYPE_INFO_WIDTHS.limit }, 'fast');
	          }, 500);
	    });
	    panel.mouseleave(function() {
	        window.clearTimeout(t);
	        t = window.setTimeout(function () {
	            panel.animate({"max-width": TYPE_INFO_WIDTHS.max }, 'slow');
	          }, 250);
	    });
		
	})();
	
	(function(){ // reset worker button.
		var button = $(_RESET_);
		
		button.click( function(event){
			comm.reset();
			editor.focus();
		});
	})();
	
	//
	// Worker Setup
	//
	
	var worker;
	var send;
	
	var resetWorker = function(){
		worker = new Worker('code/worker.js');
		worker.addEventListener('message', function(e) {
			var m = e.data;
			try{
				receive[m.kind](m.data);
			}catch(e){
				console.error(e);
			}
		}, false);
		send = function(k,msg){
			worker.postMessage({ kind: k, data: msg });
		};
	};
	resetWorker();

	var comm = {
		eval : function(){
			send('EVAL', editor.getSession().getValue());		
		},
		checker : function(p){
			send('CHECKER' , p);		
		},
		autorun : function(v){
			send('AUTO', v);
		},
		reset : function(){
			worker.terminate();
			resetWorker();
			comm.eval();
		}
	};

    //
    // Editor & Listeners Setup
    //

    var out = new function(){
    	var o = $('#out');
    	var t = $('#typing');
    	
    	this.clearAll = function(){
    		o.removeClass('bad');
    		o.html('');
    		this.clearTyping();
    	};
    	
    	this.printError = function(error){
    		o.addClass('bad');
    		o.html(error);
    	}
    	
    	this.println = function(val){
    		if( o.html() )
    			o.html( o.html() +"\n"+ val.toString() );
    		else
    			o.html( val.toString() );
    	};
    	
    	this.clearTyping = function(){
    		this.printTyping('');
    	}
    	
    	this.printTyping = function( val ){
    		if( val == '' ){
    			t.hide();
    		}else{
    			if( typeinfo )
    				t.show();
    		}
    		t.html( val.toString() );
    	};
    	
    };
    
    var DEBUG_MSG = true;
	
	var receive = {
		
		//
		// debug
		//
		
		log : function(msg){ console.log('[Worker] '+msg); },
		debug : function(msg){ console.debug('[Worker] '+msg); },
		error : function(msg){ console.error('[Worker] '+msg); },
		
		//
		// info
		//
		
		printError : function(msg){
			out.printError(msg);
		},
		clearAll : function(){
			out.clearAll();
		},
		println : function(msg){
			out.println(msg);
		},
		clearTyping : function(){
			out.clearTyping();
		},
		printTyping : function(msg){
			out.printTyping(msg);
		},
		
		//
		// error handling & annotaitons
		//
		
		errorHandler : function(e){
			e = JSON.parse(e); //deserialize object
			var msg = "";
        	var line = 1;
        	var groupName = null;
        	
			if ( e.hasOwnProperty('ast') && e.ast !== undefined ) {
				line = e.ast.line;
				// for printing we must +1 to properly match ACE's counting
				msg += e.kind+" on line "+(e.ast.line+1)+
					(e.ast.col?(":"+e.ast.col):'')+" - ";
			}else{
				groupName = 'Exception:';	
			}
			msg += ( e.message || e )+".";
			
			if( DEBUG_MSG || groupName != null ){
				if( groupName == null ) {
					console.groupCollapsed( '[Debug-Info] '+msg );
				} else {
					// real error, show expanded
					console.group( groupName );
					//console.debug( 'Message: '+msg );
				}
				console.debug("Extra Info: "+e.debug+"\nStack Trace:\n"+e.stack);
				console.groupEnd();
				//console.error("@"+source+"@");
				//console.error("AST dump:"+"\n"+JSON.stringify(ast,undefined,2));
			}
            out.printError( msg );

			receive.updateAnnotations( { reason : msg, line : line } );
		},
		
    	updateAnnotations : function(res){
	    	if (res !== null) {
	            editor.getSession().setAnnotations([{
	                row : res.line,
	                column : 0,
	                text : res.reason,
	                type : "error",
	                lint : "error"
	            }]);
	        } else {
	            // no error, clear old annotations
	            editor.getSession().clearAnnotations();
	        }
        }
	};

	var cursor_elem = $(_CURSOR_);
	
    var onCursorChange = function(){
        try{
            var pos = editor.getCursorPosition();
            cursor_elem.html((pos.row+1)+":"+pos.column);
            comm.checker(pos);
        }catch(e){
            // do nothing.
        }
    };
    
    var onChange = function(e) {
    	// simply re-do everything, ignore diff.
    	// more efficient incremental parser left as future work...
    	comm.eval();
    };

	editor.selection.on("changeCursor", onCursorChange);
    editor.on("change", onChange );

    // the initial run to parse the example text.
    onChange();
    // editor apparently automatically gets focused, even without this.
    editor.focus();
   
});
