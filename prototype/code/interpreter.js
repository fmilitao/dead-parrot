/**
 * Notes:
 * 	- ignores all location and type abstractions (i.e. as if erased)
 * 
 * REQUIRED Global variables (all declared in parser.js):
 * 	- AST.kinds, for all AST case analysis needs.
 *  - assertf, for error handling/flagging.
 */
	
var Interpreter = (function( AST, assertF ){
	
	// stuff to be exported from this module to outside contexts	
	var exports = {};
	
	//
	// Values
	//
	
	var Function = function( body, variable, parent ) {
		this.call = function( argument ) {
			var env = new Heap( parent );
			env.set( variable, argument );
			return run( body, env );
		}
		this.toString = function() {
			return "Function Value";
		}
	}

	var Record = function() {
		var fields = {};

		this.add = function( id, value ) {
			if ( fields.hasOwnProperty(id) ){
				return undefined;
			}
			fields[id] = value;
			return null;
		}
		this.select = function( id ) {
			if (fields.hasOwnProperty(id)) {
				return fields[id];
			} else {
				return undefined;
			}
		}
		this.toString = function() {
			var res = [];
			for( var i in fields )
				res.push(i+"="+fields[i].toString());
			return "{"+res.join()+"}";
		}
	}
	
	var Tuple = function( vals ){
		this.values = function(){
			return vals;
		}
		this.toString = function() {
			return '{'+vals.join()+'}';
		}
	}
	
	var Tagged = function( t, v ) {
		this.tag = function(){
			return t;
		}
		this.value = function(){
			return v;
		}
		this.toString = function() {
			return t+"#"+v.toString();
		}
	}

	var Reference = function( i ) {
		var cell = i;

		this.set = function( value ) {
			var old = cell;
			cell = value;
			return old;
		}
		this.get = function() {
			return cell;
		}
		this.free = function() {
			var old = cell;
			cell = undefined;
			this.set = undefined;
			this.get = undefined;
			this.toString = function() {
				return "Dead Cell";
			}
			return old;
		}
		this.toString = function() {
			return "Reference Cell";
		}
	}

	exports.factory = {
		Function: Function, 
		Record: Record,
		Tuple: Tuple,
		Tagged: Tagged
		};

	//
	// Utils
	//

	var Heap = function( parent ) {
		var map = {};
		
		this.newScope = function(){ return new Heap(this); }
		this.endScope = function(){ return parent; }
		this.set = function( id, value ){
			map[id] = value;
		}
		this.get = function( id ){
			if ( map.hasOwnProperty(id) ) {
				return map[id]; 
			}else{
				if( parent === null )
					return undefined;
				else
					return parent.get(id);
			}
		}
	}
	
	var assert = function( f, msg, ast ){
		return assertF("Execution error",f,msg,ast);
	}
	
	//
	// Run
	//
	
	var run = function(ast,env) {

		switch(ast.kind) {
			case AST.kinds.OPEN:
			case AST.kinds.LET: {
				var value = run(ast.val, env);
				var newEnv = env;
				if( ast.id !== null ){
					newEnv = env.newScope();
					newEnv.set(ast.id, value);
				}
				return run(ast.exp, newEnv);
			}
			case AST.kinds.ID:
				return assert(function() {
					return env.get(ast.text);
				}, "Identifier \'" + ast.text + "\' not found", ast);
			case AST.kinds.DEREF: {
				var exp = run(ast.exp, env);
				return assert(function(){
					return exp.get();
				},"Invalid dereference",ast);
			}
			case AST.kinds.NEW: {
				var exp = run(ast.exp, env);
				return new Reference(exp);
			}
			case AST.kinds.ASSIGN: {
				var lvalue = run(ast.lvalue, env);
				var value = run(ast.exp, env);
				return assert(function(){
					return lvalue.set(value);
				},"Invalid assign",ast.lvalue);
			}
			case AST.kinds.DELETE: {
				var lvalue = run(ast.exp, env);
				return assert(function(){
					return lvalue.free();
				},"Invalid delete",ast.exp);
			}
			case AST.kinds.TAGGED: {
				var exp = run(ast.exp, env);
				return new Tagged(ast.tag,exp);
			}
			case AST.kinds.CASE: {
				var val = run(ast.exp, env);
				var tag = assert(function(){
					return val.tag();
				},"Invalid case",ast.exp);
				var branch = undefined;
				for(var i=0;i<ast.branches.length;++i){
					if( ast.branches[i].tag === tag ){
						branch = ast.branches[i];
						break;
					}
				}
				assert( branch, "No matching branch for "+tag, ast );
				var newEnv = env.newScope();
				newEnv.set(branch.id,val.value());
				return run(branch.exp, newEnv);
			}
			case AST.kinds.FUN: {
				if( ast.rec !== null ){ //recursion function
					var newEnv = env.newScope();
					var rec = new Function(ast.exp, ast.parms.id,newEnv);
					newEnv.set(ast.rec,rec);
					return rec;
				}
				return new Function(ast.exp, ast.parms.id,env);
			}
			case AST.kinds.CALL: {
				var fun = run(ast.fun, env);
				var arg = run(ast.arg, env);
				return assert(function(){
					return fun.call(arg);
				},"Invalid call",ast.arg);
			}
			case AST.kinds.SELECT: {
				var rec = run(ast.left, env);
				var id = ast.right;
				return assert(function() {
					return rec.select(id);
				}, "Invalid field \'" + id + "\' for record", ast);
			}
			case AST.kinds.RECORD: {
				var rec = new Record();
				for(var i=0; i < ast.exp.length; ++i) {
					var field = ast.exp[i];
					var id = field.id;
					var value = run(field.exp, env);
					assert(function() {
						return rec.add(id, value);
					}, "Duplicated field \'" + id + "\' in record", field);
				}
				return rec;
			}
			case AST.kinds.TUPLE: {
				var values = [];
  				for (var i=0; i < ast.exp.length; ++i) {
    				values.push( run(ast.exp[i], env) );
  				}
  				return new Tuple(values);
			}
			case AST.kinds.LET_TUPLE: {
				var vals = run(ast.val, env);
				vals = assert(function(){
					return vals.values();
				},"Invalid tuple",ast.val);
				var ids = ast.ids;
				assert( ids.length === vals.length,"Tuple size mismatch",ast.val);
				var newEnv = env;
				newEnv = env.newScope();
				for (var i = 0; i < vals.length; ++i) {
					newEnv.set(ids[i], vals[i]);
  				}
				return run(ast.exp, newEnv);
			}
			
			case AST.kinds.FOCUS:
			case AST.kinds.DEFOCUS:
			case AST.kinds.SHARE: 
				return new Record();

			case AST.kinds.CAP_STACK:
			case AST.kinds.PACK:
			case AST.kinds.FORALL:
			case AST.kinds.TYPE_APP:
			case AST.kinds.ALTERNATIVE_OPEN:
				return run(ast.exp, env);
			
			case AST.kinds.NUMBER:
			case AST.kinds.BOOLEAN:
			case AST.kinds.STRING:
			// DANGER: assumes parser properly filters to only allow
			// primitive javascript types.
				return eval(ast.text);
			default:
				assert(false,"Assertion Error "+ast.kind,ast);
				break;
		}

	}
	
	exports.run = function( ast, loader ){
		assert( ast.kind === AST.kinds.PROGRAM, 'Error @run', ast );
		
		var heap = new Heap(null);
		// only needs to look at imports, not typedefs.
		
		if( ast.imports !== null ){
		 	// loader does not need to be provided, but all imports are errors	
			assert( loader !== undefined, 'Error @run missing import loader', ast );
			var libs = ast.imports;
			for( var i=0; i<libs.length; ++i ){
				// remove initial and ending quotes of the import string
				var lib = libs[i].substring(1,libs[i].length-1);
				assert( loader( lib, heap, exports ),
					"Invalid import: "+lib, ast );
			}
		}
		return run( ast.exp, heap );
	};
	
	return exports;
})(AST,assertF); // required globals
