//
// Worker thread
//

// convenient debug stuff
var console = function(){
	var aux = function(k,arg){
		var tmp =[];
		for( var i in arg )
			tmp.push(arg[i].toString());
		self.postMessage({kind: k, data: tmp.join(' ') });
	}
	
	return {
		log : function(){ aux('log',arguments) },
		error : function(){ aux('error',arguments) },
		debug  : function(){ aux('debug',arguments) }
	};
}();

var g = '../lib/jison.js';
// leave the next comment for deploy script
//__DEV__g = 'grammar.js';
importScripts(g);

importScripts('parser.js','interpreter.js','typechecker.js');

var parser = Parser('grammar.jison');
var interpreter = Interpreter();
var checker = TypeChecker();

// to avoid reparsing, the 'ast' is made available
// to the other listener functions through this var.

var ast = null;
var types = null;
var autorun = true;

var handleError = function(e){
	if( e.stack )
		console.error( e.stack.toString() );
	send('errorHandler', JSON.stringify(e));
}

var send = function(k,msg){
	self.postMessage({kind: k, data: msg });
};

self.addEventListener('message', function(e) {
	var m = e.data;
	try{
		receive[m.kind](m.data);
	}catch(e){
		console.error(e);
	}
}, false);


var receive = {
	EVAL : function(data){
		try{
			ast = null;
			types = {};
			send('clearAll',null);
	
			ast = parser( data );
				
				
				//FIXME
			send('println', '<b>Type</b>: '+ checker( ast , types ).toHTML() );
			//send('println', '<b>FIXME: Type Checker Disabled</b>.');
			
			if( autorun )
				send('println', '<b>Result</b>: '+interpreter( ast,function(msg){ send('println',msg.toString())} ) );
			
			// no errors!
			send('updateAnnotations', null);
		}catch(e){
			handleError(e);
		}
	},
	AUTO : function(auto){
		try{
			autorun = auto;
			if( autorun && ast!=null )
				send('println', "<b>FORCED RUN - Result:</b> "+interpreter( ast,function(msg){ send('println',msg.toString())} ) );
		}catch(e){
			handleError(e);
		}
	},
	CHECKER: function(data){
		try{
			var pos = data;
			// only if parsed correctly
		   	if( ast == null || types == null || !types.info )
		   		return;
		   	else{
		   		// resets typing output
		   		send('clearTyping',null);
		   	}
		    
			send('printTyping',types.info(pos).toString());
		}catch(e){
			handleError(e);
		}
	}
};


















