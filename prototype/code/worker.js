//
// Quick and Dirty Standard Lib for basic arithm.
//

// for now it just supports 'add' and 'println'
var libLoader = function( file, e, ctx ){
	var v = ctx.factory;

	if( file === 'stdlib' ){
		var rec = new v.Record();
		
		// println: forall T.( T -o T )
		var println = new v.Function();
		println.call = function(msg){
			send('println',msg.toString());
			return msg;
		};
		rec.add('println',println);
		
		// add: int -o int -o !int
		var add = new v.Function();
		add.call = function(msg){
			var tmp = new v.Function();
			tmp.call = function(arg){ return msg+arg; }
			return tmp;
		};
		rec.add('add',add);
		
		// binds 'Lib' variable
		e.set('Lib',rec);
		
		return null;
	}
	// others are unknown
	return undefined;
};

var libTyper = function( file, e, ctx ){
	var v = ctx.factory;

	if( file === 'stdlib' ){
		var rec = new v.RecordType();
		
		// println: forall T.( T -o T )
		var println = new v.ForallType(
			new v.TypeVariable('T'),
			new v.FunctionType(
				new v.TypeVariable('T'),
				new v.TypeVariable('T') ) );
		rec.add('println',println);
		
		// add: int -o int -o !int
		var add = new v.FunctionType(
			new v.PrimitiveType('int'),
			new v.FunctionType(
				new v.PrimitiveType('int'),
				new v.BangType(new v.PrimitiveType('int')) ) );
		rec.add('add',add);
		
		// binds 'Lib' variable
		e.set('Lib',rec);
		
		return null;
	}
	// others are unknown
	return undefined;
};

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
// leave the next comment for the deploy script
//__DEV__g = 'grammar.js';
importScripts(g);

importScripts('parser.js','interpreter.js','typechecker.js');

var parser = Parser('grammar.jison');
var interpreter = function(ast){ return Interpreter.run(ast,libLoader); };
var types = TypeChecker.types;
var checker = TypeChecker.check;

// to avoid reparsing, the 'ast' is made available
// to the other listener functions through this var.

var ast = null;
var typeinfo = null;
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
			typeinfo = {};
			send('clearAll',null);
	
			ast = parser( data );

			send('println', '<b>Type</b>: '+ checker( ast , typeinfo, libTyper ).toHTML() );
			
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
			if( autorun && ast !== null )
				send('println', "<b>FORCED RUN - Result:</b> "+interpreter( ast,function(msg){ send('println',msg.toString())} ) );
		}catch(e){
			handleError(e);
		}
	},
	CHECKER: function(data){
		try{
			var pos = data;
			// only if parsed correctly
		   	if( ast === null || typeinfo === null )
		   		return;
		   	else{
		   		// resets typing output
		   		send('clearTyping',null);
		   	}
		    
			send('printTyping',info(typeinfo,pos).toString());
		}catch(e){
			handleError(e);
		}
	}
};


//
// Printing Type Information
//

var printEnvironment = function(env,ast,pos){
	var gamma = [];
	var delta = [];
	var visited = [];
	
	env.visit( true, // visit all elements 
	function(id,val,isCap,isType){
		// if duplicated do not print, this may happen due to
		// stack of environments for names (i.e. non type/loc vars).
		if( visited.indexOf(id) !== -1 )
			return;
		
		if( isCap ){
			delta.push( val.toHTML() );
			return;
		}
		
		// only non-caps may not be repeated, since caps have null 'id'
		visited.push(id);
		
		if( isType ){
			// is a type/location variable
			if( val.type() === types.LocationVariable ){
				gamma.push('<span class="type_location">'+val.name()+'</span>: <b>loc</b>');
				return;
			}
			if( val.type() === types.TypeVariable ){
				gamma.push('<span class="type_variable">'+val.name()+'</span>: <b>type</b>');
				return;
			}
		}
		
		if( val.type() === types.BangType ){
			gamma.push('<span class="type_name">'+id+'</span>'+": "+val.inner().toHTML());
			return;
		}			
		// FIXME problem on priting multiple levels of capabilities
		// FIXME is it possible to delete twice if at multiple levels??
		delta.push('<span class="type_name">'+id+'</span>'+": "+val.toHTML());
	});
	
	gamma.sort(); // to ensure always the same order
	gamma = gamma.join(',\n    ');
	
	delta.sort(); // ...same order
	delta = delta.join(',\n    ');

	return "@"+(ast.line+1)+":"+ast.col+' '+ast.kind+"\n\u0393 = "+gamma+"\n"+
		   "\u0394 = "+delta;
}


var info = function(tp,pos){
	var type_info = tp.info;
	var diff = tp.diff;
	var ptr = null;
	var indexes = [];
					
	// search for closest one
	for( var i in type_info ){
		var ast = type_info[i].ast;
		if( ptr === null ){
			ptr = i;
		} else {
			var old = type_info[ptr].ast;
			
			var dy = Math.abs(ast.line-pos.row);							
			var _dy = Math.abs(old.line-pos.row);
			
			if( dy < _dy ){
				// if closer, pick new one
				ptr = i;
				indexes = [i];
				continue;
			}
			
			// on same line
			if( dy === _dy ){
				var dx = Math.abs(ast.col-pos.column);
				var _dx = Math.abs(old.col-pos.column);
					
				// if closer, pick new one
				if( dx < _dx ){
					ptr = i;
					indexes = [i];
					continue;
				}else{
					if( dx === _dx ){
						// one more
						indexes.push(i);
						continue;
					}	
				}
			}
		}
		/*
		if( ( ast.line < pos.row || 
	 		( ast.line === pos.row &&
				ast.col <= pos.column ) ) ){
	 			ptr = i;
	 	}*/
	}
	
	if( ptr === null || indexes.length === 0 )
		return '';

	var msg = '<b title="click to hide">Type Information</b><br/>'+
		'('+diff+'ms)';
	
	for(var i=0;i<indexes.length;++i){
		var ptr = indexes[i];
		// minor trick: only print if the same kind since alternatives
		// are always over the same kind...
		// IMPROVE: is there a better way to display this information?
		if( type_info[ptr].ast.kind !==
			type_info[indexes[0]].ast.kind )
			continue;
		msg += '<br/>'+printEnvironment(
				type_info[ptr].env,
				type_info[ptr].ast, pos
			);
		}
		
	return msg;
}






