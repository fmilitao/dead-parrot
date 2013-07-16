
// http://www.gnu.org/software/bison/manual/html_node/Actions-and-Locations.html#Actions-and-Locations 
var AST = new function(){
	var aux = function(id,ast, info){
		ast.kind = id;
		if ( info ) {
			// Jison lines start at line 1, but ACE indexing starts at 0
			ast.line = info.first_line - 1;
			ast.col = info.first_column;
		}
		return ast;
	};
	
	var Enum = function() {
	    for (var i in arguments) {
	    	// technically, this would be more efficient with ints:
	        // this[arguments[i]] = i;
	        // but since this is a dynamically type language, it is more
	        // convenient to just use strings to figure out errors quicker.
	        this[arguments[i]] = arguments[i];
	    }
	};
	
	this.kinds = new Enum (
		'DEBUG',
		// types
		'FUN_TYPE',
		'CAP_TYPE',
		'BANG_TYPE',
		'EXISTS_TYPE',
		'FORALL_TYPE',
		'STACKED_TYPE',
		'RECORD_TYPE',
		// constructs
		'FORALL',
		'PACK',
		'OPEN',
		'TYPE_APP',
		'BOOLEAN',
		'NUMBER',
		'STRING',
		'NAME_TYPE',
		'CAP_STACK',
		'REF_TYPE',
		'ID',
		'FIELD_TYPE',
		'FIELDS_TYPE',
		'FIELD',
		'FIELDS',
		'RECORD',
		'PARAM',
		'CASE',
		'BRANCH',
		'BRANCHES',
		'TAGGED',
		'LET',
		'SELECT',
		'ASSIGN',
		'CALL',
		'DEREF',
		'NEW',
		'DELETE',
		'FUN',
		'SHARE',
		'FOCUS',
		'DEFOCUS',
		'TYPEDEF',
		'TYPEDEFS',
		'TUPLE',
		'LET_TUPLE',
		'RECURSION'
	);
	
	this.makeLetTuple = function(ids,val,exp,info){
		return aux( this.kinds.LET_TUPLE, {ids:ids,val:val,exp:exp}, info);
	}
	this.makeTuple = function(vals,info){
		return aux( this.kinds.TUPLE, {vals:vals}, info);
	}
	
	// FIXME
	this.makeRecursion = function(id,exp,info){
		return aux( this.kinds.RECURSION, {id:id,exp:exp}, info);
	}
	this.makeFocus = function(locs,info){
		return aux( this.kinds.FOCUS, {locs:locs}, info);
	}
	this.makeDefocus = function(info){
		return aux( this.kinds.DEFOCUS, { }, info);
	}
	this.makeShare = function(locs,a,b,info){
		return aux( this.kinds.SHARE, {locs:locs,a:a,b:b}, info);
	}
	this.makeTypedef = function(id,type,info){
		return aux( this.kinds.TYPEDEF, {id:id,type:type}, info);
	}
	this.makeTypedefs = function(left,right,info){
		return aux( this.kinds.TYPEDEFS, {left:left,right:right}, info);
	}

	// expressions
	this.makeLet = function(id,val,exp, info){
		return aux( this.kinds.LET, {id: id, val: val, exp: exp}, info);
	}
	this.makeSelect = function(left,right, info){
		return aux( this.kinds.SELECT, {left: left, right : right}, info);
	}
	this.makeAssign = function(lvalue,exp, info){
		return aux( this.kinds.ASSIGN, {lvalue: lvalue, exp : exp}, info);
	}
	this.makeCall = function(fun,arg, info){
		return aux( this.kinds.CALL, {fun: fun, arg : arg}, info);	
	}
	this.makeDeRef = function(exp,info){
		return aux( this.kinds.DEREF, {exp: exp}, info);
	}
	this.makeDeRef = function(exp,info){
		return aux( this.kinds.DEREF, {exp: exp}, info);
	}
	this.makeNew = function(exp,info){
		return aux( this.kinds.NEW, {exp: exp}, info);
	}
	this.makeDelete = function(exp,info){
		return aux( this.kinds.DELETE, {exp: exp}, info);
	}
	this.makeFun = function(parms,exp,info){
		return aux( this.kinds.FUN, {parms: parms, exp: exp}, info);
	}
	this.makeID = function(id,info){
		return aux( this.kinds.ID, {text: id}, info);
	}
	this.makeNumber = function(val,info){
		return aux( this.kinds.NUMBER, {text: val}, info);
	}
	this.makeBoolean = function(val,info){
		return aux( this.kinds.BOOLEAN, {text: val}, info);
	}
	this.makeString = function(val,info){
		return aux( this.kinds.STRING, {text: val}, info);
	}
	this.makeRecord = function(exp,info){
		return aux( this.kinds.RECORD, {exp: exp}, info);
	}
	this.makeField = function(id,exp,info){
		return aux( this.kinds.FIELD, {id : id , exp : exp }, info);
	}
	this.makeFields = function(left,right,info){
		return aux( this.kinds.FIELDS, {left: left, right: right}, info);
	}
	this.makeParameters = function(id,type, info){
		return aux( this.kinds.PARAM, {id: id, type: type}, info);
	}
	this.makeForall = function(id,exp, info){
		return aux( this.kinds.FORALL, {id: id, exp: exp}, info);
	}
	this.makePack = function(id,label,exp, info){
		return aux( this.kinds.PACK, {id: id, label:label, exp: exp}, info);
	}
	this.makeOpen = function(type,id,val,exp, info){
		return aux( this.kinds.OPEN, {type: type, id: id, val: val, exp: exp}, info);
	}
	this.makeTypeApp = function(exp,type,info){
		return aux( this.kinds.TYPE_APP, {exp: exp, id: type}, info);
	}
	this.makeCapStack = function(exp,type,info){
		return aux( this.kinds.CAP_STACK, {exp: exp, type: type}, info);
	}
	this.makeTagged = function(tag,exp,info){
		return aux( this.kinds.TAGGED, {tag:tag,exp: exp}, info);
	}
	this.makeBranch = function(tag,id,exp,info){
		return aux( this.kinds.BRANCH, {tag:tag, id:id,exp: exp}, info);
	}
	this.makeBranches = function(left,right,info){
		return aux( this.kinds.BRANCHES, {left:left, right:right}, info);
	}
	this.makeCase = function(exp,branches,info){
		return aux( this.kinds.CASE, {exp:exp, branches:branches}, info);
	}
	// types
	this.makeExistsType = function(id,type, info){
		return aux( this.kinds.EXISTS_TYPE, {id: id, type: type}, info);
	}
	this.makeForallType = function(id,type, info){
		return aux( this.kinds.FORALL_TYPE, {id: id, exp: type}, info);
	}
	this.makeStackedType = function(left,right, info){
		return aux( this.kinds.STACKED_TYPE, {left: left, right: right}, info);
	}
	this.makeFunType = function(arg,exp, info){
		return aux( this.kinds.FUN_TYPE, {arg: arg, exp: exp}, info);
	}
	this.makeCapabilityType = function(id,type, info){
		return aux( this.kinds.CAP_TYPE, {id: id, type: type}, info);
	}
	this.makeNameType = function(text, info){
		return aux( this.kinds.NAME_TYPE, {text: text}, info);
	}
	this.makeRefType = function(text, info){
		return aux( this.kinds.REF_TYPE, {text: text}, info);
	}
	this.makeBangType = function(type, info){
		return aux( this.kinds.BANG_TYPE, {type: type}, info);
	}
	this.makeUnitType = function(info){
		return aux( this.kinds.RECORD_TYPE, { }, info);
	}
	this.makeRecordType = function(exp, info){
		return aux( this.kinds.RECORD_TYPE, {exp: exp}, info);
	}
	this.makeFieldType = function(id,exp, info){
		return aux( this.kinds.FIELD_TYPE, {id: id, exp: exp}, info);
	}
	this.makeFieldsType = function(left,right, info){
		return aux( this.kinds.FIELDS_TYPE, { left: left , right: right }, info);
	}
	
	this.makeDebug = function(exp, info){
		return aux( this.kinds.DEBUG, { exp: exp }, info);
	}
	
	// auxiliar record inspector
	this.onEachField = function(rec,f){
		var next = rec.exp;
		while (next != null) {
			var field = null;
			switch( next.kind ) {
				case this.kinds.FIELDS_TYPE:
				case this.kinds.FIELDS: {
					field = next.left;
					next = next.right;
					break;
				}
				case this.kinds.FIELD_TYPE:
				case this.kinds.FIELD: {
					field = next;
					next = null;
					break;
				}
				default:
					throw new Error('Assertion Failed.');
				}
			
			f( field );	
		}
	}
}();

var assertF = function(kind,f,msg,ast){
	var result = f;
	var debug = null;
	try{
		if( f !== undefined && f !== false )
			result = f();
	}catch(e){
		debug = ( e || e.message );
	}
	if( result === undefined || result === false ){
		throw {
			message : msg,
			kind: kind,
			ast: ast,
			debug: debug,
			stack : new Error().stack.toString()
		};
	}
	return result;
}

// FIXME: this should be the same as above...?
// problem if f returns false that value should not be considered for testing?
// difference between a wrapErrors and assert... rethink this.
var assertD = function(kind,f,msg,ast){
	var result = undefined;
	var debug = null;
	try{
		result = f();
	}catch(e){
		debug = ( e || e.message );
	}
	if( result === undefined ){
		throw {
			message : msg,
			kind: kind,
			ast: ast,
			debug: debug,
			stack : new Error().stack.toString()
		};
	}
	return result;
}

var Parser = function(file){
	var wrap = function(parser){
		return function(source){
			try{
				return parser.parse(source);
			}catch(e){
				throw {
					message : e.message,
					kind: 'Parse Error',
					ast: { line: parser.lexer.yylineno,
							col: undefined },
					debug: e,
					stack : e.stack
				};
			}
		};
	}

    if( typeof grammar == 'undefined' ){
		var parser = null;
		
        console.log('"grammar" undefined, generating a new one now...');

        var Jison = require('jison'), bnf = require('jison/bnf');
        
        // synchronous fetch of grammar file (this doesn't work locally due to
        // permissions on fetching from javascript, must be run in a server)
        var r = new XMLHttpRequest();
 		r.open("GET", file, false); //note async
 		r.send(null);
 		if( r.status == 200 )
 			grammar = r.responseText;
 		else{
 			console.error('Error fetching grammar.');
 			return null;
 		}

        try {
            var cfg = bnf.parse(grammar);
        	parser = new Jison.Generator(cfg, { type : "lalr" });
		} catch (e) {
			console.error("Error parsing grammar file.\n" + e);
			return null;
        }

        if (!parser.conflicts) {
            console.debug('Parser generated successfully.');
            parser = parser.createParser();
        } else {
            console.error('Error generating parser, conflicts encountered:');
            parser.resolutions.forEach(function(res) {
                var r = res[2];
                if (!r.bydefault)
                    return null;
                console.error(r.msg + "\n" + "(" + r.s + ", " + r.r + ") -> " + r.action);
            });
        }
        
        return wrap(parser);
    }else{
        // a precompiled grammar is available, (include 'grammar.js' for this)
        return wrap(new grammar.Parser());
    }
    
}
