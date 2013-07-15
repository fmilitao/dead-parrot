
var Interpreter = function(){
	
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
			return "Record Value";
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
	
	var wrapError = function( f, msg, ast ){
		return assertD("Execution error",f,msg,ast);
	}
	
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
				return wrapError(function() {
					return env.get(ast.text);
				}, "Identifier \'" + ast.text + "\' not found", ast);
			case AST.kinds.DEREF: {
				var exp = run(ast.exp, env);
				return wrapError(function(){
					return exp.get();
				},"Invalid dereference",ast);
			}
			case AST.kinds.NEW: {
				var exp = run(ast.exp, env);
				return new Reference(exp);
			}
			case AST.kinds.DEBUG: {
				var exp = run(ast.exp, env);
				debug(exp);
				return exp;
			}
			case AST.kinds.ASSIGN: {
				var lvalue = run(ast.lvalue, env);
				var value = run(ast.exp, env);
				return wrapError(function(){
					return lvalue.set(value);
				},"Invalid assign",ast.lvalue);
			}
			case AST.kinds.DELETE: {
				var lvalue = run(ast.exp, env);
				return wrapError(function(){
					return lvalue.free();
				},"Invalid delete",ast.lvalue);
			}
			case AST.kinds.FUN: {
				return new Function(ast.exp, ast.parms.id,env);
			}
			case AST.kinds.CALL: {
				var fun = run(ast.fun, env);
				var arg = run(ast.arg, env);
				return wrapError(function(){
					return fun.call(arg);
				},"Invalid call",ast.arg);
			}

			case AST.kinds.SELECT: {
				var rec = run(ast.left, env);
				var id = ast.right;
				return wrapError(function() {
					return rec.select(id);
				}, "Invalid field \'" + id + "\' for record", ast);
			}

			case AST.kinds.RECORD: {
				var rec = new Record();
				AST.onEachField(ast, function(field){
					var id = field.id;
					var value = run(field.exp, env);
					wrapError(function() {
						return rec.add(id, value);
					}, "Duplicated field \'" + id + "\' in record", field);
				});
				return rec;
			}
			
			case AST.kinds.CAP_STACK:
			case AST.kinds.PACK:
			case AST.kinds.FORALL:
			case AST.kinds.TYPE_APP:
				return run(ast.exp, env);
			
			case AST.kinds.NUMBER:
			case AST.kinds.BOOLEAN:
			case AST.kinds.STRING:
			// DANGER: assumes parser properly filters to only allow
			// primitive javascript types.
				return eval(ast.text);
			default:
				wrapError(function(){return undefined;},
					"Assertion Error "+ast.kind,ast);
				break;
		}

	}

	var debug = function(arg){};

	return function(ast,printF){
		if( printF != undefined )
			debug = printF;
		return run( ast, new Heap(null) );
	}
}