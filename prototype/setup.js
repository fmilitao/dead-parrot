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
var CONTROLS = "controls";
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

// from: http://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
function getScrollbarWidth() { // FIXME: to fix firefox scrollbar problem with box-sizing
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    document.body.appendChild(outer);
    
    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";
    
    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);        
    
    var widthWithScroll = inner.offsetWidth;
    
    // remove divs
    outer.parentNode.removeChild(outer);
    
    return widthNoScroll - widthWithScroll;
}

$(document).ready(function() {
	
	// FIXME debug
	$.ajaxSetup({ cache: false });
	var DEBUG_MSG = true;
	
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
		var controls_height = 20;
		var console_height = 80;
		var split = 270;
		
		var info = document.getElementById(INFO);
		info.style.width = split+"px";
	
		var editor = document.getElementById(EDITOR);
		editor.style.left = split+"px";
    	editor.style.width = (w-split)+"px";
		editor.style.height = (h-console_height-controls_height)+"px";
		editor.style.top = 0+"px";

		var controls = document.getElementById(CONTROLS);
		controls.style.left = split+"px";
		controls.style.width = (w-split)+"px";
		controls.style.height = (controls_height)+"px";
		controls.style.top = (h-controls_height)+"px";
					
		var output = document.getElementById(OUTPUT);
		output.style.left = split+"px";
		output.style.width = (w-split)+"px";
		output.style.height = (console_height)+"px";
		output.style.top = (h-console_height-controls_height)+"px";
		
		var typing = document.getElementById(TYPING);
		typing.style.top = 0+"px";
		typing.style.left = 0+"px";
		typing.style.maxHeight = h+"px";
		typing.style.maxWidth = split+"px";
		TYPE_INFO_WIDTHS = { max : split , limit : w };
	
	}
	
 	window.onresize(); // only do this after the rest is initialized!
    
    //
    // Editor and Buttons setup
    //
    
    var editor = ace.edit(EDITOR);

	(function(){
    	editor.setTheme("ace/theme/mono_industrial");
    	// selected="selected"
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
		});
	    	
		STYLE_LIST.change(function () {
			var style = $(this).val();
			if( style != '' )
	   			editor.setTheme("ace/"+style);
    	});
	})();
	
    // disable code folding
    editor.getSession().setFoldStyle("manual");
    editor.getSession().setMode("ace/mode/grammar");
    editor.setShowPrintMargin(false);
    editor.getSession().setTabSize(3);
	
	var worker_enabled = true;
	
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
			name = name.replace('.txt','');
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
	    	parameters = parameters[1].split('&');
	    	for( var i=0;i<parameters.length;++i ){
		    	var tmp = parameters[i].split('=');
		    	if( tmp.length > 1 ){
		    		var option = tmp[0];
		    		var value = tmp[1];
		    		switch( option ){
		    			case 'file': // load file
			    			$.get( value , function(data) {
								setEditor(data);
								//console.log(data);
							});
		    				break;
		    			case 'worker':
		    				worker_enabled = (value.toLowerCase() === 'true');
		    				break;
		    			default: // not other options for now.
		    				break;
		    		}
		    	}
	    	}
	    }else{ // no parameters given, load default
	    	$.get( 'examples/welcome.txt' , function(data) {
				setEditor(data);
			});
	    }

		// tests	    
	    var TEST_LIST = $("#test-file");
		$.get( "tests-list" , function(data) {
			var file = data.split('\n');
			for( var i=0 ; i<file.length ; ++i ){
				if( file[i][0] != '#' ){ // ignore commented out file
					var option = $('<option/>', {
		        		value: 'examples/tests/'+file[i],
		        		text: file[i]
					});
					TEST_LIST.append(option);
				}
	    	}
		});
	    	
		TEST_LIST.change(function () {
			var file = $(this).val();
			if( file != '' ){
				$.get( file , function(data) {
					setEditor(data);
				});
			}
    	});
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
		
		if( !worker_enabled ) {
			button.html("N/A");
		} else {
			button.click( function(event){
				comm.reset();
				editor.focus();
		});
		}
	})();
	
	//
	// Boxing Types
	//
	
	// when hovered over 'triggers' change 'changers' to a boxed style, on out
	// removes that style (which is the initial state).
	var triggers = 'Q';
	var changers = 'q';
	var refreshTypeListners = function(){
		$('.'+changers)
				.css('background-color', 'inherit')
			    .css('outline', 'none');
		
		$('.'+triggers).hover(
		  function(){
			  $(this)
			    .siblings('.'+changers)
			    .css('background-color', 'white')
			    .css('outline', '2px solid #bbbbbb');
		  },
		  function(){
			  $(this)
			    .siblings('.'+changers)
			    .css('background-color', 'inherit')
			    .css('outline', 'none');
		  }
		);		
	};
	
    //
    // Editor & Listeners Setup
    //

    var out = new function(){
    	var o = $(_OUTPUT_);
    	var t = $(_TYPING_);
    	
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
    		
    		// for boxing types
    		refreshTypeListners();
    	};
    	
    };
    
    //
    // Handler of (Received) Events
    //
    
	var handle = {
		
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

			handle.updateAnnotations( { reason : msg, line : line } );
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
	
	//
	// Worker Setup
	//
	
	var worker;
	var send;
	var receive = handle;
		
	if( worker_enabled ){
		
		// launch worker
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
		
	}else{
		/*
		 * This runs the typechecker, etc. locally.
		 * It is really just meant for debugging since some of the Chrome Dev
		 * Tools do not work properly when they are triggered from inside a
		 * Web Worker... WARNING: unpleasant code.
		 */
		
		var importScript = function(file){
			$.ajax({ type : 'GET',
				async : false,
				url : file,
				dataType:'script',
				success : function(data) {}
				});
		};
console.log('importing scripts for running locally...');
		importScript('lib/jison.js');
		importScript('code/parser.js');
		importScript('code/interpreter.js');
		importScript('code/typechecker.js');
console.log('done.');
console.log('importing worker code...');

		// make handle function available to worker THIS IS A GLOBAL VAR
		GLOBAL_HANDLER = handle;
		importScript('code/worker.js');
		
		var send_here = function(kind,data) {
			try{
				WORKER_HANDLER[kind](data);
			}catch(e){
				console.error(e);
			}
		};
		
	}
	
	var comm = (function(send){
		return { // communication object
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
	})( worker_enabled ? send : send_here );

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
