//
// Worker thread
//

var isThread = typeof(window) === 'undefined';

// only loads the following if it is a standalone thread
if( isThread ){

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

	// libs
	importScripts('../lib/jison.js');
	importScripts('parser.js','interpreter.js','typechecker.js');

}

var parser = Parser( (isThread?'':'code/') + 'grammar.jison' );
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

var send;
if( isThread ){
	send = function(k,msg){
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
}else{
	// Just for local debugging, GLOBAL_HANDLER is global var
	send = function(kind,data) {
		try{
			GLOBAL_HANDLER[kind](data);
		} catch(e) {
			console.error(e);
		}
	};
}

var receive = {
	EVAL : function(data){
		try{
			ast = null;
			typeinfo = {};
			send('clearAll',null);
	
			ast = parser( data );

			send('println', '<b>Type</b>: '+
				toHTML( checker( ast , typeinfo, libTyper ) ) );
			
			if( autorun ){
				send('println', '<b>Result</b>: '+
					interpreter( ast,
						function(msg){ send('println',msg.toString()) } ) );
			}
			
			// no errors!
			send('updateAnnotations', null);
		}catch(e){
			handleError(e);
		}
	},
	AUTO : function(auto){
		try{
			autorun = auto;
			if( autorun && ast !== null ){
				send('println', "<b>FORCED RUN - Result:</b> "+
					interpreter( ast,
						function(msg){ send('println',msg.toString()) } ) );
			}
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

if( !isThread ){
	var WORKER_HANDLER = receive;
}

//
// Quick and Dirty Standard Lib for basic arithm.
//

// for now it just supports 'add' and 'println'
var libLoader = function( file, ctx ){
	var v = ctx.factory;

	// println: forall T.( T -o T )
	if( file === 'println' ){
		var println = new v.Function();
		println.call = function(msg){
			send('println',msg.toString());
			return msg;
		};
		return println;
	}
	
	// add: int -o int -o !int
	if( file === 'add' ){	
		var add = new v.Function();
		add.call = function(msg){
			var tmp = new v.Function();
			tmp.call = function(arg){ return msg+arg; }
			return tmp;
		};
		return add;
	}
	
	// others are unknown
	return undefined;
};

var libTyper = function( file, ctx ){
	var v = ctx.factory;

	// println: !(forall T.( T -o T ))
	if( file === 'println' ){
		return new v.BangType(
			new v.ForallType(
				new v.TypeVariable('T'),
				new v.FunctionType(
					new v.TypeVariable('T'),
					new v.TypeVariable('T') 
					)
			) 
		);
	}
		
	// add: !(int -o int -o !int)
	if( file === 'add' ){
		return new v.BangType(
			new v.FunctionType(
				new v.PrimitiveType('int'),
				new v.FunctionType(
					new v.PrimitiveType('int'),
					new v.BangType(new v.PrimitiveType('int'))
					) 
			)
		);
	}
	
	// others are unknown
	return undefined;
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
			delta.push( toHTML(val) );
			return;
		}
		
		// only non-caps may not be repeated, since caps have null 'id'
		visited.push(id);
		
		if( isType ){
			// is a type/location variable
			if( val.type === types.LocationVariable ){
				gamma.push('<span class="type_location">'+val.name()+'</span>: <b>loc</b>');
				return;
			}
			if( val.type === types.TypeVariable ){
				gamma.push('<span class="type_variable">'+val.name()+'</span>: <b>type</b>');
				return;
			}
		}
		
		if( val.type === types.BangType ){
			gamma.push('<span class="type_name">'+id+'</span>'+": "+toHTML(val.inner()));
			return;
		}			
		// FIXME problem on priting multiple levels of capabilities
		// FIXME is it possible to delete twice if at multiple levels??
		delta.push('<span class="type_name">'+id+'</span>'+": "+toHTML(val));
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
		'('+diff+'ms)'; // TODO &#9659;
	
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

//
// Convert type to HTML
//

// defines which types get wrapping parenthesis
var _toHTML = function(t){
	if( t.type === types.ReferenceType ||
		t.type === types.FunctionType ||
		t.type === types.StackedType ||
		t.type === types.StarType || 
		t.type === types.AlternativeType ||
		t.type === types.SumType ){
			return '('+toHTML(t)+')';
		}
	return toHTML(t);
}

var wq = function(t){ return '<span class="q">'+t+'</span>'; } // changer
var wQ = function(t){ return '<span class="Q">'+t+'</span>'; } // trigger

var toHTML = function (t){
	switch ( t.type ){
		case types.FunctionType:
			return wq( 
				wq( _toHTML(t.argument()) ) +
				wQ( " &#x22b8; " ) +
				wq( _toHTML(t.body()) )
				);
		case types.BangType:{
			var inner = t.inner();	
			return wq( wQ("!") + wq(_toHTML(t.inner())) );
		}
		case types.SumType:{
			var tags = t.tags();
			var res = [];
			for( var i in tags ){
				res.push(
					wQ( '<span class="type_tag">'+tags[i]+'</span>#' )+
					wq( _toHTML(t.inner(tags[i])) )
				); 
			}	
			return wq( res.join('+') );
		}
		case types.StarType:{
			var inners = t.inner();
			var res = [];
			for( var i=0; i<inners.length; ++i )
				res.push( wq( _toHTML( inners[i] ) ) ); 
			return wq( res.join( wQ(' * ') ) );
		}
		case types.AlternativeType:{
			var inners = t.inner();
			var res = [];
			for( var i=0; i<inners.length; ++i )
				res.push( wq( _toHTML( inners[i] ) ) ); 
			return wq( res.join( wQ(' &#8853; ') ) );
		}
		case types.RecursiveType:
			return '<b>rec</b> '+
			( t.id().type === types.LocationVariable ?
				'<span class="type_location">' :
				'<span class="type_variable">')
			+t.id().name()+'</span>.'+_toHTML(t.inner());
		case types.ExistsType:
			return '&#8707;'+
			( t.id().type === types.LocationVariable ?
				'<span class="type_location">' :
				'<span class="type_variable">')
			+t.id().name()+'</span>.'+_toHTML(t.inner());
		case types.ForallType:
			return '&#8704;'+
			( t.id().type === types.LocationVariable ?
				'<span class="type_location">' :
				'<span class="type_variable">')
			+t.id().name()+'</span>.'+_toHTML(t.inner());
		case types.ReferenceType:
			return "<b>ref</b> "+
			'<span class="type_location">'+t.location().name()+'</span>';
		case types.CapabilityType:
			return '<b>rw</b> '+
			'<span class="type_location">'+t.location().name()+'</span> '+
			toHTML(t.value());
		case types.StackedType:
			return wq( wq(toHTML(t.left())) + wQ(' :: ')+ wq(toHTML(t.right())) );
		case types.RecordType: {
			var res = [];
			var fields = t.getFields();
			for( var i in fields )
				res.push('<span class="type_field">'+i+'</span>: '+toHTML(fields[i]));
			return "["+res.join(', ')+"]";
		}
		case types.TupleType: {
			var res = [];
			var values = t.getValues();
			for( var i in values )
				res.push( toHTML(values[i]) );
			return "["+res.join(', ')+"]";
		}
		case types.LocationVariable:
			return '<span class="type_location">'+t.name()+'</span>';
		case types.TypeVariable:
			return '<span class="type_variable">'+t.name()+'</span>';
		case types.PrimitiveType:
			return '<b>'+t.name()+'</b>';
		case types.NoneType:
			return '<b>none</b>';
		case types.DelayedApp:
			return wq( wq( _toHTML(t.inner()) )+wQ('[')+ wq( toHTML(t.id()) )+wQ(']') );
		case types.RelyType:
			return wq( wq( _toHTML(t.rely()) )+wQ(' &#8658; ') + wq(_toHTML(t.guarantee())) );
		case types.GuaranteeType:
			return wq( wq( _toHTML(t.guarantee()) )+wQ(' ; ') + wq(_toHTML(t.rely())) );
//			return wq( wq( _toHTML(t.inner()) )+wQ('[')+ wq( toHTML(t.id()) )+wQ(']') );
		default:
			console.error( "Error @toHTML: " +t.type );
			return null;
		}
};



