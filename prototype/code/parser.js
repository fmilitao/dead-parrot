
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
		'PROGRAM',
		'TYPEDEF',
		// types
		'FUN_TYPE',
		'CAP_TYPE',
		'BANG_TYPE',
		'EXISTS_TYPE',
		'FORALL_TYPE',
		'STACKED_TYPE',
		'SUM_TYPE',
		'ALTERNATIVE_TYPE',
		'RECORD_TYPE',
		'TUPLE_TYPE',
		'TAGGED_TYPE',
		'RELY_TYPE',
		'GUARANTEE_TYPE',
		'STAR_TYPE',
		'PRIMITIVE_TYPE',
		'NONE_TYPE',
		'RECURSIVE_TYPE',
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
		'FIELD',
		'RECORD',
		'PARAM',
		'CASE',
		'BRANCH',
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
		'TUPLE',
		'LET_TUPLE'
	);
	
	this.makeTypedef = function(id,type,info){
		return aux( this.kinds.TYPEDEF, {id:id,type:type}, info);
	}
	this.makeProgram = function(imports,typedefs,exp,info){
		return aux( this.kinds.PROGRAM, {imports:imports,typedefs:typedefs,exp:exp}, info);
	}
	
	//
	this.makeLetTuple = function(ids,val,exp,info){
		return aux( this.kinds.LET_TUPLE, {ids:ids,val:val,exp:exp}, info);
	}
	this.makeTuple = function(exp,info){
		return aux( this.kinds.TUPLE, {exp:exp}, info);
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
	this.makeFunction = function(rec,parms,exp,result,info){
		return aux( this.kinds.FUN, {rec:rec,parms: parms, result:result,exp: exp}, info);
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
	this.makeRecursiveType = function(id,type, info){
		return aux( this.kinds.RECURSIVE_TYPE, {id: id, exp: type}, info);
	}
	this.makeStackedType = function(left,right, info){
		return aux( this.kinds.STACKED_TYPE, {left: left, right: right}, info);
	}
	this.makeRelyType = function(left,right, info){
		return aux( this.kinds.RELY_TYPE, {left: left, right: right}, info);
	}
	this.makeGuaranteeType = function(left,right, info){
		return aux( this.kinds.GUARANTEE_TYPE, {left: left, right: right}, info);
	}
	this.makeSumType = function(sums, info){
		return aux( this.kinds.SUM_TYPE, {sums:sums}, info);
	}
	this.makeStarType = function(types, info){
		return aux( this.kinds.STAR_TYPE, {types:types}, info);
	}
	this.makeAlternativeType = function(types, info){
		return aux( this.kinds.ALTERNATIVE_TYPE, {types: types}, info);
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
	this.makePrimitiveType = function(text, info){
		return aux( this.kinds.PRIMITIVE_TYPE, {text: text}, info);
	}
	this.makeRefType = function(text, info){
		return aux( this.kinds.REF_TYPE, {text: text}, info);
	}
	this.makeBangType = function(type, info){
		return aux( this.kinds.BANG_TYPE, {type: type}, info);
	}
	this.makeRecordType = function(exp, info){
		return aux( this.kinds.RECORD_TYPE, {exp: exp}, info);
	}
	this.makeFieldType = function(id,exp, info){
		return aux( this.kinds.FIELD_TYPE, {id: id, exp: exp}, info);
	}
	this.makeTupleType = function(exp, info){
		return aux( this.kinds.TUPLE_TYPE, {exp: exp}, info);
	}
	this.makeTaggedType = function(tag,exp, info){
		return aux( this.kinds.TAGGED_TYPE, {tag:tag,exp: exp}, info);
	}
	this.makeNoneType = function(info){
		return aux( this.kinds.NONE_TYPE, {}, info);
	}

}();

var ErrorWrapper = function(msg,kind,ast,debug){
	this.message = msg;
	this.kind = kind;
	this.ast = ast;
	this.debug = debug;
	this.stack = new Error().stack.toString();
}

// convenient assert function to wrap errors
var assertF = function(kind,f,msg,ast){
	var result = undefined;
	var error = true; // because exceptions
	var debug = null;
	try{
		if( f instanceof Function ){
			result = f();
			error = result === undefined;
		}
		else {
			result = f;
			error = result === undefined || result === false;
		}
	}catch(e){
		// if it is already one of our own exceptions don't wrap
		if ( e instanceof ErrorWrapper )
			throw e;
		if( e instanceof RangeError )
			msg = e.message;
		debug = ( e || e.message );
	}
	if( error )
		throw new ErrorWrapper(msg,kind,ast,debug); 
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
