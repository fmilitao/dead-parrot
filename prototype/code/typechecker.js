
/* INCOMPLETE STUFF:
 *  X fields as intersection type.
 *  X case, problem on merging environments and result? subtyping?
 *  X star type, auto-stack should first collect all then just stack once
 *  X ensure star is commutative
 *  X recursion
 * 	-- Find better way to merge environments/types?

 *  - forall / exists with types and convenient labelling
 * 		-- this needs way to replace part of the types.
 
 *  - ALTERNATIVES ... this will be messy, probably
 *  - recursive types and typedefs, needs indirection on types?
 
 * *  - convenient way for stdlib?
 *  - all sharing bits: focus, defocus, sharing and their framing
 *  - rely/guarantee
 * 	- subtyping fixes: tagged sums, pairs, etc. all those rules are missing

 ---> problem: indexing must be rethought to allow duplicated entries once 
 sharing is introduced.
 */

var TypeChecker = function(){

	var assert = function(f,msg,ast){
		return assertF("Type error",f,msg,ast);
	}

	//
	// TYPES
	//
	
	// All types are immutable references.

	// types enumeration
	var types = {};
	var addType = function(label){
		assert( !types.hasOwnProperty(label), 'Duplicated label: '+label );
		types[label] = label;
		return label; // later it may be useful to change away from strings
	}
	
	var inherit = function(obj,type){
		obj.type = function(){ return type; }
		obj.toString = function() { return toString(obj); }
		obj.toHTML = function(){ return toHTML(obj); }
	}

	var FunctionType = function() {
		var type = addType('FunctionType');
	
		return function( argument, body ) {
			inherit( this, type );
			this.argument = function(){ return argument; }
			this.body = function(){ return body; }
		};
	}();
	
	var BangType = function(){
		var type = addType('BangType');
		
		return function( inner ) {
			inherit( this, type );
			this.inner = function(){ return inner; }
		};
	}();

	var SumType = function(){
		var type = addType('SumType');
		
		return function( ) {
			inherit( this, type );
			
			var tags = {};
			this.add = function( tag, inner ){
				if ( tags.hasOwnProperty(tag) )
					return undefined; // already exists!
				tags[tag] = inner;
				return null;
			}
			this.tags = function(){ return Object.keys(tags); }
			this.inner = function(tag){ return tags[tag]; }
		};
	}();
	
	var StarType = function(){
		var type = addType('StarType');
		
		return function( ) {
			inherit( this, type );
			
			var types = [];
			this.add = function( inner ){
				types.push(inner);
				return null;
			}
			this.inner = function(){ return types; }
		};
	}();
	
	var ForallType = function(){
		var type = addType('ForallType');
		
		return function(id, inner) {
			inherit( this, type );
			this.id = function(){ return id; } // : LocationVariable
			this.inner = function(){ return inner; }
		};
	}();
	
	var ExistsType = function(){
		var type = addType('ExistsType');
		
		return function(id,inner){
			inherit( this, type );
			this.id = function(){ return id; } // : LocationVariable
			this.inner = function(){ return inner; }
		};
	}();

	var RecordType = function(){
		var type = addType('RecordType');
		
		return function(){
			inherit( this, type );

			var fields = {};
			this.add = function(id, type) {
				if ( fields.hasOwnProperty(id) ){
					return undefined;
				}
				fields[id] = type;
				return null;
			}
			this.select = function(id) {
				if (fields.hasOwnProperty(id)) {
					return fields[id];
				} else {
					return undefined;
				}
			}
			this.isEmpty = function(){
				return Object.keys(fields).length==0;
			}
			this.getFields = function(){
				return fields;
			}
		};
	}();

	var UnitType = new BangType(new RecordType());
	
	var TupleType = function(){
		var type = addType('TupleType');
		
		return function(){
			inherit( this, type );

			var values = [];
			this.add = function(type) {
				values.push(type);
				return null;
			}
			this.getValues = function(){
				return values;
			}
		};
	}();

	var ReferenceType = function(){
		var type = addType('ReferenceType');
		
		return function(location){
			inherit( this, type );
			this.location = function(){ return location; } // : LocationVariable
		};
	}();
	
	var StackedType = function(){
		var type = addType('StackedType');
		
		return function(left,right){
			inherit( this, type );
			this.left = function(){ return left; }
			this.right = function(){ return right; }
		};
	}();
	
	var CapabilityType = function(){
		var type = addType('CapabilityType');
		
		return function(loc,val){
			inherit( this, type );
			
			this.location = function(){ return loc; } // : LocationVariable
			this.value = function(){ return val; }
		};
	}();
	
	var LocationVariable = function(){
		var type = addType('LocationVariable');
		
		return function(name){
			inherit( this, type );
			
			var n = name==null ? 't<sub>'+(unique_counter++)+'</sub>' : name;
			
			this.name = function(){ return n; }
		};
	}();
	
	var TypeVariable = function(){
		var type = addType('TypeVariable');
		
		return function(name){
			inherit( this, type );
			
			var n = name==null ? 'T<sub>'+(unique_counter++)+'</sub>' : name;
			
			this.name = function(){ return n; }
		};
	}();
	
	var PrimitiveType = function(){
		var type = addType('PrimitiveType');
		
		return function(name){
			inherit( this, type );
			this.name = function(){ return name; }
		};
	}();
	
	var NameType = function(){
		var type = addType('NameType');
		
		return function(name){
			inherit( this, type );
			this.name = function(){ return name; }
		};
	}();
	
	//
	// VISITORS
	//
	
	/**
	 * Searchs types 't' for location variable 'loc'. isFresh if NOT present.
	 * @param {Type} t that is to be traversed
	 * @param {LocationVariable,TypeVariable} loc that is to be found
	 * @return {Boolean} true if location variableis NOT in type.
	 * Note that all variable names collide so that checking for 
	 * LocationVariable versus TypeVariable is not necessary.
	 */
	var isFresh = function (t,loc){
		switch ( t.type() ){
			case types.FunctionType:
				return isFresh( t.argument(), loc ) &&
					isFresh( t.body(), loc );
			case types.BangType:
				return isFresh( t.inner(), loc );
			case types.SumType:{
				var tags = t.tags();
				for( var i in tags ){
					if( !isFresh(t.inner(tags[i]),loc) )
						return false; 
				}	
				return true;
			}
			case types.ExistsType:
			case types.ForallType:
				if( t.id().name() === loc.name() )
					// the name is already bounded, so loc must be fresh
					return true;
				return isFresh(t.id(),loc) && isFresh(t.inner(),loc);
			case types.ReferenceType:
				return isFresh( t.location(), loc );
			case types.StackedType:
				return isFresh( t.left(), loc ) && isFresh( t.right(), loc );
			case types.CapabilityType:
				return isFresh( t.location(), loc ) && isFresh( t.value(), loc );
			case types.RecordType: {
				var fs = t.getFields();
				for( var i in fs ){
					if( !isFresh(fs[i],loc) )
						return false;
				}
				return true;
			}
			case types.StarType:{
				var inners = t.inner();
				var res = [];
				for( var i=0; i<inners.length; ++i )
					if( !isFresh(inners[i],loc) )
						return false;
				return true;
			}
			case types.TupleType: {
				var vs = t.getValues();
				for( var i in vs ){
					if( !isFresh(vs[i],loc) )
						return false;
				}
				return true;
			}
			case types.TypeVariable:
			case types.LocationVariable:
				return t.name() != loc.name();
			case types.NameType:
			case types.PrimitiveType:
				return true;
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
		};

	var toString = function (t){
		switch ( t.type() ){
			case types.FunctionType:
				return toString(t.argument())+" -o "+toString(t.body());
			case types.BangType: {
				var inner = t.inner();
				if( inner.type() == types.ReferenceType ||
					inner.type() == types.FunctionType ||
					inner.type() == types.StackedType )
					return "!("+toString(t.inner())+")";
				return "!"+toString(t.inner());
			}
			case types.SumType:{
				var tags = t.tags();
				var res = [];
				for( var i in tags ){
					res.push( tags[i]+'#'+toString(t.inner(tags[i])) ); 
				}	
				return res.join('+');
			}
			case types.StarType:{
				var inners = t.inner();
				var res = [];
				for( var i=0; i<inners.length; ++i )
					res.push( toString( inners[i] ) ); 
				return res.join(' * ');
			}
			case types.ExistsType:
				return 'exists '+t.id().name()+'.('+toString(t.inner())+')';
			case types.ForallType:
				return 'forall '+t.id().name()+'.('+toString(t.inner())+')';
			case types.ReferenceType:
				return "ref "+t.location().name();
			case types.CapabilityType:
				return 'rw '+t.location().name()+' '+toString(t.value());
			case types.StackedType:
				return toString(t.left())+' :: '+toString(t.right());
			case types.RecordType: {
				var res = [];
				var fields = t.getFields();
				for( var i in fields )
					res.push(i+": "+toString(fields[i]));
				return "["+res.join()+"]";
			}
			case types.TupleType:
				return "["+t.getValues().join()+"]";
			case types.LocationVariable:
			case types.TypeVariable:
			case types.NameType:
			case types.PrimitiveType:
				return t.name();
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
	};
	
	var toHTML = function (t){
		switch ( t.type() ){
			case types.FunctionType:
				return toHTML(t.argument())+" &#x22b8; "+toHTML(t.body());
			case types.BangType:{
				var inner = t.inner();
				if( inner.type() == types.ReferenceType ||
					inner.type() == types.FunctionType ||
					inner.type() == types.StackedType || 
					inner.type() == types.SumType )
					return "!("+toHTML(t.inner())+')';	
				return "!"+toHTML(t.inner());
			}
			case types.SumType:{
				var tags = t.tags();
				var res = [];
				for( var i in tags ){
					res.push( tags[i]+'#'+toHTML(t.inner(tags[i])) ); 
				}	
				return res.join('+');
			}
			case types.StarType:{
				var inners = t.inner();
				var res = [];
				for( var i=0; i<inners.length; ++i )
					res.push( toHTML( inners[i] ) ); 
				return res.join(' * ');
			}
			case types.ExistsType:
				return '&#8707;'+
				'<span class="type_location">'+t.id().name()+'</span>'
				+'.('+toHTML(t.inner())+')';
			case types.ForallType:
				return '&#8704;'+
				'<span class="type_location">'+t.id().name()+'</span>'
				+'.('+toHTML(t.inner())+')';
			case types.ReferenceType:
				return "<b>ref</b> "+
				'<span class="type_location">'+t.location().name()+'</span>';
			case types.CapabilityType:
				return '<b>rw</b> '+
				'<span class="type_location">'+t.location().name()+'</span> '+
				toHTML(t.value());
			case types.StackedType:
				return toHTML(t.left())+' :: '+toHTML(t.right());
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
				return "<b>loc</b>";
			case types.TypeVariable:
				return '<u><i>'+t.name()+'</i></u>';
			case types.NameType:
			case types.PrimitiveType:
				return '<b>'+t.name()+'</b>';
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
	};
	
	var cloneVar = function(variable){
		switch( variable.type() ){
			case types.LocationVariable:
				return new LocationVariable(null);
			case types.TypeVariable:
				return new TypeVariable(null);
			default:
				assert( false, 'Expecting variable but got: '+variable, null);
		}
	}
	
	/**
	 * Substitutes in 'type' any occurances of 'original' to 'target'
	 * 		type[original/target] ('original' for 'target')
	 * @param {Type} type that is to be searched
	 * @param {Type} when 'original' is found, it is replaced with
	 * @param {LocationVariable,TypeVariable} 'target'
	 * @return a *copy* of 'type' where all instances of 'original' have been
	 * 	replaced with 'target' (note that each target is the same and never
	 * 	cloned).
	 *  Note that it also RENAMES any bounded variable that colides with the
	 *  'original' name so that bounded names are never wrongly substituted.
	 */
	var rename = function(type,original,target){
		
		function rec(t){
			if( equals(t,original) )
				return target;
			
			switch ( t.type() ){
			case types.FunctionType:
				return new FunctionType( rec(t.argument()), rec(t.body()) );
			case types.BangType:
				return new BangType( rec(t.inner()) );
			case types.SumType:{
				var sum = new SumType();
				var tags = t.tags();
				for( var i in tags ){
					sum.add( tags[i], rec(t.inner(tags[i])) ); 
				}	
				return sum;
			}
			case types.StarType:{
				var star = new StarType();
				var inners = t.inner();
				for( var i=0;i<inners.length;++i){
					star.add( rec(inners[i]) ); 
				}	
				return star;
			}
			case types.ExistsType:
				// renaming is needed when the bounded location variable
				// of the exists type is the same as the target name to replace
				// or when it is the same as the original name to replace
				// 1. when variable to be renamed is the same as bounded var:
				// (exists t.(ref t)){t/X} -> must rename location of exists
				// 2. when target name is the same as bounded var:
				// (exists t.(ref t)){g/t} -> must rename location of exists
				if( t.id().name() === target.name() ){
					var nvar = cloneVar( t.id() );
					var ninner = rename( t.inner(), t.id(), nvar );
					return new ExistsType( nvar, rec(ninner) );	
				}
				return new ExistsType( t.id(), rec(t.inner()) );
			case types.ForallType:
				if( t.id().name() === target.name() ){
					var nvar = cloneVar( t.id() );
					var ninner = rename( t.inner(), t.id(), nvar );
					return new ForallType( nvar, rec(ninner) );	
				}
				return new ForallType( t.id(), rec(t.inner()) );
			case types.ReferenceType:
				return new ReferenceType( rec(t.location()) );
			case types.StackedType:
				return new StackedType( rec(t.left()), rec(t.right()) );
			case types.CapabilityType:
				return new CapabilityType( rec(t.location()), rec(t.value()) );
			case types.RecordType: {
				var r = new RecordType();
				var fs = t.getFields();
				for( var i in fs )
					r.add( i, rec(fs[i]) );
				return r;
			}
			case types.TupleType: {
				var r = new TupleType();
				var fs = t.getValues();
				for( var i in fs )
					r.add( rec(fs[i]) );
				return r;
			}
			case types.PrimitiveType:
			case types.NameType:
			case types.LocationVariable:
			case types.TypeVariable:
				return t;
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
		};
		return rec(type);
	};
	
	/**
	 * Tests if types 'a' and 'b' are the same.
	 * Up to renaming of bounded variables, so that it renames existentials
	 * and foralls. Thus, returns true when they are structurally equal, even
	 * if their labels in existentials are of different strings values.
	 * @param {Type} a
	 * @param {Type} b
	 * @return {Boolean} if the types are equal up to renaming.
	 */
	var equals = function(a,b){
		if( a.type() !== b.type() )
			return false;
		
		// assuming both same type
		switch ( a.type() ){
			case types.FunctionType:
				return equals(a.argument(),b.argument()) &&
					equals(a.body(),b.body());
			case types.BangType:
				return equals(a.inner(),b.inner());
			case types.SumType:{
				var as = a.tags();
				var bs = b.tags();
				if( Object.keys(as).length != Object.keys(bs).length )
					return false;
				for( var i in as )
					if( !bs.hasOwnProperty(i) || !equals(as[i],bs[i]) )
						return false;
				return true;
			}

			/* FIXME
			case types.StarType:{
				var star = new StarType();
				var inners = t.inner();
				for( var i=0;i<inners.length;++i){
					star.add( rec(inners[i]) ); 
				}	
				return star;
			} */
			
			/* FIXME
			case types.ExistsType:
				// renaming is needed when the bounded location variable
				// of the exists type is the same as the target name to replace
				// or when it is the same as the original name to replace
				// 1. when variable to be renamed is the same as bounded var:
				// (exists t.(ref t)){t/X} -> must rename location of exists
				// 2. when target name is the same as bounded var:
				// (exists t.(ref t)){g/t} -> must rename location of exists
				if( t.id().name() == original.name() ||
					t.id().name() == target ){
					var nloc = new LocationVariable(null); // fresh name
					var ninner = rename( t.inner(), t.id(), nloc );
					return new ExistsType( nloc, rec(ninner) );	
				}
				return new ExistsType( t.id(), rec(t.inner()) );
			case types.ForallType:
				if( t.id().name() == original.name() ||
					t.id().name() == target ){
					var nloc = new LocationVariable(null); // fresh name
					var ninner = rename( t.inner(), t.id(), nloc );
					return new ForallType( nloc, rec(ninner) );	
				}
				return new ForallType( t.id(), rec(t.inner()) );
				*/
			
			case types.ReferenceType:
				return equals( a.location(), b.location() );
			case types.StackedType:
				return equals( a.left(), b.left() ) &&
					equals( a.rigth(), b.rigth() );
			case types.CapabilityType:
				return equals( a.location(), b.location() ) &&
					equals( a.value(), b.value() );
			case types.RecordType: {
				var as = a.getFields();
				var bs = b.getFields();
				if( Object.keys(as).length != Object.keys(bs).length )
					return false;
				for( var i in as )
					if( !bs.hasOwnProperty(i) || !equals(as[i],bs[i]) )
						return false;
				return r;
			} 
			case types.TupleType: {
				var as = a.getValues();
				var bs = b.getValues();
				if( as.length != bs.length )
					return false;
				for( var i=0;i<as.length;++i )
					if( !equals(as[i],bs[i]) )
						return false;
				return true;
			}
			case types.PrimitiveType:
			case types.NameType:
			case types.LocationVariable:
			case types.TypeVariable:
				return a.name() === b.name();
			default:
				assert( false, "Assertion error on " +a.type() );
				break;
			}
	};
	
	/**
	 * Subtyping two types.
	 * @param {Type} t1
	 * @param {Type} t2
	 * @return {Boolean} true if t1 <: t2 (if t1 can be used as t2).
	 */
	var subtypeOf = function( t1 , t2 ){
			
							//console.log('SUBTYPE:');
							//console.log(t1);
							//console.log(t2);
							//console.log(t1.type()+'-----'+t2.type());

		// types that can be "banged"
		if ( ( t1.type() == types.ReferenceType
			|| t1.type() == types.PrimitiveType
			|| ( t1.type() == types.RecordType && t1.isEmpty() ) )
			&& t2.type() == types.BangType )
			return subtypeOf( t1, t2.inner() );
		
		// TODO all subtyping rules need to be synced with paper
		
		// "ref" t1: (ref p) <: !(ref p)
		if ( t1.type() == types.ReferenceType && t2.type() == types.BangType )
			return subtypeOf( t1, t2.inner() );

		// "pure to linear" - ( t1: !A ) <: ( t2: A )
		if ( t1.type() == types.BangType && t2.type() != types.BangType )
			return subtypeOf( t1.inner(), t2 );

		// all remaining rule require equal kind of type
		if( t1.type() != t2.type() )
			return false;
		
		//else: safe to assume same type from here on
		switch ( t1.type() ){
			case types.NameType:
			case types.PrimitiveType:
				return t1.name() == t2.name();
			case types.BangType:
				// if t2 is unit: "top" rule
				if( t2.inner().type() == types.RecordType && t2.inner().isEmpty() )
					return true;
				return subtypeOf( t1.inner(), t2.inner())
			case types.ReferenceType:
				return subtypeOf( t1.location(), t2.location() );
			case types.FunctionType:
				return subtypeOf( t2.argument(), t1.argument())
					&& subtypeOf( t1.body(), t2.body());
			case types.RecordType:{
				var t1fields = t1.getFields();
				var t2fields = t2.getFields();
				// all fields of t1 must be in t2 (but not the inverse)
				for( var i in t2fields ){
					if( !t1fields.hasOwnProperty(i) ||
						!subtypeOf( t1fields[i], t2fields[i] ) ){
						return false;
					}
				}
				// all fields of t1 that are not on t2 mut be pure
				for( var i in t1fields ){
					if( !t2fields.hasOwnProperty(i) &&
						t1fields[i].type() != types.BangType ){
						return false;
					}
				}
				return true;
			}
			case types.StackedType:
				return subtypeOf( t1.left(), t2.left() ) &&
					subtypeOf( t1.right(), t2.right() );
			case types.StarType:{
				var i1s = t1.inner();
				var i2s = t2.inner();

				if( i1s.length != i2s.length )
					return false;
				// for *-type, any order will do
				var tmp_i2s = i2s.splice(0); // copies array
				for(var i=0;i<i1s.length;++i){
					var curr = i1s[i];
					var found = false;
					for(var j=0;j<tmp_i2s.length;++j){
						var tmp = tmp_i2s[j];
						if( subtypeOf(curr,tmp) ){
							tmp_i2s.splice(j,1); // removes element
							found = true;
							break; // continue to next
						}
					}
					if( !found )
						return false;
				}
				return true;
			}
			case types.SumType:{
				var i1s = t1.tags();
				var i2s = t2.tags();
				for( var i in i1s ){
					var j = t2.inner(i1s[i]);
					if( j === undefined || // missing tag
						!subtypeOf( t1.inner(i1s[i]), j ) )
						return false;
				}
				return true;
			}
			case types.TypeVariable:
			case types.LocationVariable:
				return t1.name() == t2.name();
			case types.CapabilityType:
				return subtypeOf( t1.location(), t2.location() ) &&
					subtypeOf( t1.value(), t2.value() );
			
			case types.ForallType:		
			case types.ExistsType:{
				var loc = t1.id();
				// renamed to ensure location variables names match
				var rn = rename( t2.inner(), t2.id(), loc);
				return subtypeOf( t1.inner(), rn );
			}
			default:
				assert( false, 'Assertion Error Subtype '+t1.type() );
		}
		
	}
	
	//
	// TYPING ENVIRONMENT
	//
	
	var Environment = function(parent){
		var map = {};
		
		this.newScope = function(){ return new Environment(this); }
		this.endScope = function(){ return parent; }

		this.set = function(id,value){
			if ( map.hasOwnProperty(id) )
				return undefined; // already exists
			map[id] = value;
			return null;
		}
		this.get = function(id){
			if ( map.hasOwnProperty(id) )
				return map[id];
			else{
				if( parent === null )
					return undefined;
				return parent.get(id);				
			}
		}
		this.remove = function(id){
			if( map.hasOwnProperty(id) ){
				var tmp = map[id];
				 // so that it is no longer listed
				delete map[id];
				return tmp;
			} else {
				if( parent === null )
					return undefined; // not found
				return parent.remove(id);
			}
		}
		this.hasKey = function(id){
			return map[id];
		}
		
		this.size = function(){
			return Object.keys(map).length+( parent == null ? 0 : parent.size() );
		}
		this.allElements = function(){
			var keys = Object.keys(map);
			if( parent != null )
				keys = keys.concat( parent.allElements() );
			return keys;
		}
		this.elements = function(f){
			for( var i in map )
				f(i,map[i]);
		}
		
		this.clone = function(){
			var env = parent != null ?
				new Environment( parent.clone() ) :
				new Environment( null );

			this.elements( function(i,v) {
				// this only works if v is immutable.
				env.set(i,v);
			});
			return env;
		}
		
		this.isEqual = function(other){
			if( this.size() != other.size() )
				return false;
				
			var mine = this.allElements();
			var theirs = other.allElements();
			for( var id in mine ){
				if( !theirs.hasOwnProperty(id) )
					return false;
				// FIXME: missing comparing capabilities and subtyping
			}
			return true;
		}
	};
	
	//
	// TYPE CHECKER
	//
		
	var findBranch = function(tag,ast){
		for( var i=0; i<ast.branches.length; ++i ){
			if( ast.branches[i].tag == tag )
				return ast.branches[i];
		}
		return undefined;
	}
	
	// The only types that can be merged... for now?
	var merge = function(t1,t2){
		if( t1.type() !== t2.type () )
			return undefined;
		
		if( t1.type() == types.BangType ){
			var tmp = merge(t1.inner(),t2.inner());
			if( tmp !== undefined )
				return new BangType( tmp );
		}
		
		if( t1.type() == types.PrimitiveType && 
			t1.name() === t2.name() )
			return t1;
		
		if( t1.type() == types.SumType ){
			// merge both types
			var tmp = new SumType();
			var tags = t1.tags();
			for( var i in tags ){
				tmp.add( tags[i], t1.inner(tags[i] ) )
			}
			tags = t2.tags();
			for( var i in tags ){
				if( tmp.add( tags[i], t2.inner(tags[i] ) ) === undefined )
					return undefined;
			}
			return tmp;
		}
		return undefined;
	// TODO: needs match (type) and equals (type)
	}

	// removes all BangTypes
	var unBang = function(t){
		if( t.type() == types.BangType )
			return unBang( t.inner() );
		return t;
	}
		
	// attempts to convert type to bang
	var purify = function(t){
		if( t.type() != types.BangType ){
			var tmp = new BangType(t);
			if( subtypeOf(t,tmp) )
				return tmp;
		}
		return t;
	}
	
	var capIndex = function(id){ return "."+id; }
	
	// unstacks to 'delta' all capabilities stacked in type
	var unstack = function( type, d, ast ){
		
		if( type.type() === types.StackedType ){
			
			var unstackType = function(t){
				switch( t.type() ){
				case types.CapabilityType:
					var capN = t.location().name(); 
					var capI = capIndex( capN );
					assert( d.set( capI , t ) ,
						'Duplicated capability for '+ capN, ast );
					break;
				case types.TypeVariable:
					var capN = t.name(); 
					var capI = capIndex( capN );
					assert( d.set( capI , t ) ,
					 'Duplicated capability for '+ capN, ast );
					break;
				case types.StarType:{
					var tps = t.inner();
					for( var i=0; i<tps.length; ++i )
						unstackType(tps[i]);
					break;
				}
				default: 
					assert( false, 'Cannot unstack: '+t+' of '+t.type(), ast);
				}
			}
			
			// all types are on the right, recursion is on left
			unstackType( type.right() );
			
			return unstack( type.left(), d, ast );
		}
		
		return type;
	}
	
	// to properly end a scope we use the following idiom of stacking all
	// outstanding capability of the delta environment on top of the result
	// 'type' and then pack all bounded location variables of the result
	var safelyEndScope = function( type, env, ast ){
		// 1. stack all capabilities
		var tmp = new StarType();

		env.elements(function(id,cap){
			
			switch( cap.type() ){
				case types.CapabilityType:
					tmp.add( cap );
					break;
				// these can be ignored
				case types.BangType:
				case types.LocationVariable:
					break;
				case types.TypeVariable:
					// HACK, only ignores the type variables with name name as
					// abstracted type, since all other are regular (linear?)
					// variables that should be auto-stack or consumed.
					if( id !== cap.name() )
						tmp.add( cap );
					break;
				default:
					// fails if attempting to stack something else
					assert( false, 'Auto-stack failure: '+cap.type(), ast );
			}

		});
		
		var res = type;
		// if there's something to stack
		var ll = tmp.inner().length;
		if( ll > 0 ){
			if( ll == 1 ) // no need for star when there is just one
				res = new StackedType( res, tmp.inner()[0] );
			else
				res = new StackedType( res, tmp );
		}

		// 2. pack all bounded location variables
		env.elements(function(e,el){
			if( el.type() == types.LocationVariable && !isFresh(res,el) ){
				var loc = new LocationVariable(null);
				res = new ExistsType( loc, rename( res, el, loc ) );
			}
		});
		return res;	
	}

	var addName = function(id,value,e,ast){
		// check for collisions
		var ee;
		// FIXME TypeVariables are like location variables
		// FIXME PrimitiveTypes and NameTypes are indexed by their name and .#
		// problem with duplicates when sharing is introduced?
		if( value.type() == types.LocationVariable ){
			// cannot occur anywhere
			ee = e.get(id);
			
			// ok to collide with capabilities since they cannot be indexed
			if( ee != undefined && ee.type() == types.CapabilityType )
				ee = undefined;
		}else{
			// cannot occur at the same level
			ee = e.hasKey(id);
		}
		assert( ee==undefined,
			"Identifier '" + id + "' already in scope", ast );

//		var isPure = value.type() == types.BangType || 
//				value.type() == types.LocationVariable;
		e.set( id, value );
	}

	// this wrapper function allows us to inspect the type and envs
	// of some node, while leaving the checker mostly clean.
	var check = function(ast,env) {
		type_info.push( { ast : ast , env : env.clone() } );
		
		var res = check_inner(ast,env);
		return res;
	};

	// returns a type or throws exception with type error
	var check_inner = function( ast, env ) {
		
		switch(ast.kind) {
			
			case AST.kinds.PROGRAM:
				assert( ast.imports === null , 'FIXME: imports not done.' , ast);
				assert( ast.typedefs === null , 'FIXME: typedefs not done.' , ast);
				return check( ast.exp, env );
			
			// EXPRESSIONS
			case AST.kinds.LET: {
				var value = check( ast.val, env );
				value = unstack( value, env, ast );
				
				var e = env.newScope();
				
				value = purify(value);
				assert( ast.id != null || value.type() == types.BangType,
					'Cannot drop linear type', ast );
				
				if( ast.id != null )
					addName( ast.id, value, e, ast );

				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast.exp );
			}
			
			case AST.kinds.OPEN: {
				var value = check( ast.val, env );
				
				assert( value.type() == types.ExistsType,
					"Type '" + value + "' not existential", ast.exp);

				var e = env.newScope();
				var loc = ast.type;
				var locvar;
				if( loc[0] === loc[0].toUpperCase() )
					locvar = new TypeVariable(loc);
				else
					locvar = new LocationVariable(loc);

				assert( locvar.type() === value.id().type(),
					'Variable mismatch, expecting '+locvar.type()+' got '+value.id().type(), ast.val);

				value = rename( value.inner(), value.id(), locvar );
				value = unstack( value, e, ast);
				
				value = purify(value);

				addName( ast.id, value, e, ast );
				addName( loc, locvar, e, ast );
				
				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast);
			}
			
			case AST.kinds.PACK: {
				var exp = check(ast.exp, env);
				
				var packed = check(ast.id, env);
				switch( packed.type() ){
					case types.NameType:
						var label = ast.label;
						var name = packed.name();
						var id = env.get( packed.name() ); // old variable						
						assert( id, "Identifier '" + name + "' not found", ast);
						
						var loc;
						if( name[0] === name[0].toUpperCase() )
							loc = new TypeVariable(label);
						else
							loc = new LocationVariable(label);
						
						assert( id.type() === loc.type(),
							"'" + name + "' not a "+loc.type(), ast);
		
						assert( isFresh(exp,loc),
							'Label "'+loc.name()+'" is not fresh in '+exp, ast);
		
						exp = rename( exp , id, loc );
						return new ExistsType(loc,exp);
					default:
						var label = ast.label;
						assert( label===null || label[0] === label[0].toUpperCase(),
							'TypeVariables must be upper-cased',ast);
							
						var variable = new TypeVariable(label);

						assert( isFresh(exp,variable),
							'Label "'+variable.name()+'" is not fresh in '+exp, ast);
		
						exp = rename( exp , packed, variable );
						return new ExistsType(variable,exp);
				}
			}
			
			case AST.kinds.SUM_TYPE: {
				var sum = new SumType();
				for( var i=0; i<ast.sums.length;++i ){
					var tag = ast.sums[i].tag;
					var exp = check(ast.sums[i].exp, env);
					sum.add( tag, exp);
				}
				return sum;
			}
			
			case AST.kinds.STAR_TYPE: {
				var star = new StarType();
				for( var i=0; i<ast.types.length;++i ){
					star.add( check(ast.types[i], env) );
				}
				return star;
			}
			
			case AST.kinds.CASE: {
				var val = check(ast.exp, env);
				val = unBang(val);
				assert( val.type() == types.SumType,
					"'" + val.type() + "' not a SumType", ast);
				// checks only the branches that are listed in the sum type
				var tags = val.tags();
				var initEnv = env.clone();
				var endEnv = null;
				
				var result = undefined;
				for( var t in tags ){
					var tag = tags[t];
					var value = val.inner(tag);
					var branch = findBranch(tag,ast);
					assert( branch, 'Missing branch for '+tag, ast);

					var e = env;
					if( endEnv !== null ){
						e = initEnv.clone();
					}
					
					e = e.newScope();
					value = unstack( value, e, branch.exp );
					value = purify( value );
					addName( branch.id, value, e, ast );
					var res = check( branch.exp, e );
					
					if( endEnv === null ){
						endEnv = e.endScope();
					}else{
						assert( endEnv.isEqual( e.endScope() ),
							"Incompatible effects on field '" + id + "'", field);
					}
					res = safelyEndScope( res, e, ast.exp );
					if( result === undefined )
						result = res;
					else {
						var tmp = merge(result,res);
						assert( tmp,"Incompatible branch results: "+
							result+' vs '+res, ast);
						result = tmp;
					}
				}
				return result;
			}
			
			case AST.kinds.ID: {
				var id = ast.text;
				var val = env.get( id );
			
				assert( val, "Identifier '" + id + "' not found", ast);

				// the following types should not be accessible even
				// if they are in the typing environment
				assert( val.type() != types.CapabilityType,
					"'" + id + "' is a capability", ast );	
				assert( val.type() != types.LocationVariable,
					"'" + id + "' is a location variable", ast );

				if( val.type() != types.BangType )
					env.remove( id );
									
				return val;
			}
			
			case AST.kinds.NEW: {
				var exp = check(ast.exp, env);
				var loc = new LocationVariable(null); // fresh location var.
				return new ExistsType (
					loc,
					new StackedType(
						new ReferenceType( loc ),
						new CapabilityType( loc, purify(exp) ) )
				);
			}
			
			case AST.kinds.DEREF: {
				var exp = check(ast.exp, env);
				
				exp = unBang(exp);
				assert( exp.type() == types.ReferenceType,
					"Invalid dereference '"+exp+"'", ast );

				var loc = exp.location().name();
				var capI = capIndex( loc );
				var cap = env.remove( capI );
				
				assert( cap, "No capability to '"+loc+"'", ast );
				
				var old = cap.value();
				
				var residual;
				// see if read must be destructive (i.e. leave unit)
				if( old.type() == types.BangType )
					residual = old;
				else
					residual = UnitType;
				
				cap = new CapabilityType( cap.location(), residual );
				assert( env.set( capI, cap ) ,'Failed to re-add cap', ast);
				return old;
			}
			
			case AST.kinds.DELETE: {
				var exp = check(ast.exp, env);
				exp = unBang(exp);
				
				if( exp.type() == types.ReferenceType ){
					var loc = exp.location().name();
					var capI = capIndex( loc )
					var cap = env.remove( capI );
					
					assert( cap, "No capability to '"+loc+"'", ast );
					
					// just return the old contents of 'cap'
					return cap.value();
					
				} else if( exp.type() == types.ExistsType ){
					// Luis' delete rule...
					var inner = exp.inner();
					if( inner.type() == types.StackedType ){
						var ref = unBang( inner.left() );
						var cap = inner.right();
						assert( ref.type() == types.ReferenceType, "Expecting reference '"+exp+"'",ast);
						var loc = ref.location();
						assert( cap.type() == types.CapabilityType, "Expecting capability '"+exp+"'",ast);
						assert( loc.name() == exp.id().name(), "Expecting matching location '"+exp+"'",ast);
						return new ExistsType(exp.id(),cap.value());
					}
					
				} 

				assert( false, "Invalid delete '"+exp+"'",ast);

			}

			case AST.kinds.ASSIGN: {
				var lvalue = check(ast.lvalue, env);
				var value = check(ast.exp, env);
				
				lvalue = unBang(lvalue);
				assert( lvalue.type() == types.ReferenceType,
					"Invalid assign '"+lvalue+"' := '"+value+"'", ast.lvalue);
				
				var loc = lvalue.location().name();
				var capI = capIndex( loc );
				var cap = env.remove( capI );
				
				assert( cap, "Cannot assign, no capability to '"+loc+"'", ast );
				
				var old = cap.value();
				cap = new CapabilityType( cap.location(), purify(value) );
				env.set( capI , cap );
				return old;
			}
			
			case AST.kinds.SELECT: {
				var rec = check( ast.left, env );
				var id = ast.right;
				rec = unBang(rec);
				
				assert( rec.type() == types.RecordType,
					"Invalid field selection '"+id+"' for '"+rec+"'", ast );

				// 1st check if field exists
				var res = assert( rec.select(id),
					"Invalid field '" + id + "' for '"+rec+"'", ast);
					
				// 2nd check if other fields can be discarded
				var fs = rec.getFields();
				for(var i in fs ){
					if( i != id ){
						var f = purify(fs[i]);
						assert( f.type() == types.BangType ,
							"Discarding pure field '"+i+"' of record",ast);
					}
				}

				return res;
			}
			
			case AST.kinds.CALL: {
				var fun = check(ast.fun, env);
				fun = unBang(fun);
				
				assert( fun.type() == types.FunctionType,
					'Type '+fun.toString()+' not a function', ast.fun);

				var arg = check(ast.arg, env);
				var fun_arg = fun.argument();

				// try to match TYPE to function's PARAMETER
				var rec = function(t,p){
					switch( p.type() ) {
						case types.StarType: {
							var inners = p.inner();
							if( t.type() == types.StarType ){
								// if the type is already a star type, we 
								// assume that it has all types there and do not
								// auto-stack anything since otherwise we would
								// need to compare and see what is missing, etc.
								return t;
							}
							else {
								var tmp = new StarType();
								for(var i=0;i<inners.length;++i)
									tmp.add( inners[i] );
								return new StackedType( t, tmp );
							}
						}
						case types.StackedType: {
							if( t.type() == types.StackedType )
								return new StackedType(
									rec( t.left(), p.left() ),
									rec( t.right(), p.right() ) );
							else
								return rec( rec( t, p.left() ), p.right() );
						}
						case types.CapabilityType: {
							if( t.type() == types.CapabilityType ){
								var t_loc = t.location().name();
								var p_loc = p.location().name();
								assert( t_loc == p_loc,
									'Incompatible capability '+t_loc+' vs '+p_loc, ast.arg );
								break;
							} else {
								var loc = p.location().name();
								var capI = capIndex( loc )
								var cap = assert( env.remove( capI ),
									'Missing capability '+loc, ast.arg);
	
								return new StackedType( t, cap );
							}
						}
						case types.TypeVariable: {
							if( t.type() == types.TypeVariable ){
								var t_loc = t.name();
								var p_loc = p.name();
								assert( t_loc === p_loc,
									'Incompatible variable '+t_loc+' vs '+p_loc, ast.arg );
								break;
							} else {
								var loc = p.name();
								var capI = capIndex( loc )
								var cap = assert( env.remove( capI ),
									'Missing capability '+loc, ast.arg);
								return new StackedType( t, cap );
							}
						}
					}
					return t;
				}
				
				arg = rec( arg, fun_arg );
				
				assert( subtypeOf( arg, fun_arg ),
					"Invalid call: expecting '"+fun_arg+"' got '"+arg+"'", ast.arg);

				return assert( unstack( fun.body(), env, ast ),
					"Unstack error on " + fun.body(), ast.exp );
			}
			
			case AST.kinds.TYPE_APP: {
				var exp = check( ast.exp, env );
				exp = unBang(exp);
				assert( exp.type() == types.ForallType , 
					'Not a Forall '+exp.toString(), ast.exp );
				
				var packed = check(ast.id, env);
				switch( packed.type() ){
					case types.NameType:
						var id = packed.name();
						var variable = env.get( id );
						
						assert( variable !== undefined &&
							( variable.type() === types.LocationVariable ||
							  variable.type() === types.TypeVariable ),
							'Unknow Variable '+id, ast );
		
						return rename( exp.inner(), exp.id(), variable );
					default:
						return rename( exp.inner(), exp.id(), packed );
				}
			}
			
			case AST.kinds.TUPLE: {
				// Note that TUPLE cannot move to the auto-bang block
				// because it may contain pure values that are not in the
				// typing environment and therefore, its type is only bang
				// or not as a consequence of each field's type and not just
				// what it consumes from the environment
				var rec = new TupleType();
				var bang = true;
						
				for(var i=0;i<ast.exp.length;++i){
					var value = check( ast.exp[i], env );
					rec.add(value);
					if( value.type() != types.BangType )
						bang = false;
				}
				
				if( bang )
					rec = new BangType(rec);

				return rec;
			}
			
			case AST.kinds.LET_TUPLE: {
				var exp = check( ast.val, env );
				exp = unBang(exp);
				assert( exp.type() == types.TupleType,
					"Type '" + exp + "' not tuple", ast.exp);
				
				var values = exp.getValues();
				assert( values.length == ast.ids.length,
					"Incompatible sizes "+ast.ids.length+" != "+values.length, ast.exp);

				var e = env.newScope();
				for( var i=0;i<ast.ids.length;++i)
					addName( ast.ids[i], values[i], e, ast );
				
				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast);
			}
			
			// TYPES
			case AST.kinds.REF_TYPE: {
				var id = ast.text;
				var loc = env.get( id );
				
				assert( loc != undefined && loc.type() == types.LocationVariable,
					'Unknow Location Variable '+id, ast );
				
				return new ReferenceType( loc );
			}
			
			case AST.kinds.EXISTS_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				var variable;
				// type variable if starts with upper case
				if( id[0] === id[0].toUpperCase() )
					variable = new TypeVariable(id);
				else
					variable = new LocationVariable(id);
				
				e.set( id, variable );

				return new ExistsType( variable, check( ast.type, e ) );
			}
			
			case AST.kinds.FORALL_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				var variable;
				// type variable if starts with upper case
				if( id[0] === id[0].toUpperCase() )
					variable = new TypeVariable(id);
				else
					variable = new LocationVariable(id);

				e.set( id, variable );

				return new ForallType( variable, check( ast.exp, e ) );
			}
			
			case AST.kinds.BANG_TYPE:
				return new BangType( check( ast.type , env ) );
			
			case AST.kinds.FUN_TYPE: {
				return new FunctionType( 
					check( ast.arg, env ),
					check( ast.exp, env )
				);
			}
			
			case AST.kinds.CAP_TYPE: {
				var id = ast.id;
				var loc = env.get( id );
				
				assert( loc != undefined && loc.type() == types.LocationVariable,
					'Unknow Location Variable '+id, ast);

				var type = null
				if( ast.type !=null ){
					type = check( ast.type, env );
					type = purify(type);
				}
				return new CapabilityType( loc, type );
			}
			
			case AST.kinds.STACKED_TYPE: {
				return new StackedType(
					check( ast.left, env ),
					check( ast.right, env )
				);
			}
			
			case AST.kinds.CAP_STACK: {
				var exp = check( ast.exp, env );
				var cap = check( ast.type, env );
				
				var capStack = function(cap){
					 // FIXME this is limited to caps only, should allow types
					assert( cap.type() == types.CapabilityType, 
						'Cannot stack ' +cap.type(), ast);
					var loc = cap.location().name();
					var capI = capIndex( loc )
					var c = assert( env.remove( capI ),
						'Missing capability '+loc, ast.type);
					var u = unBang(cap.value());
		
					// MINOR HACK, if the type of the capability has name '_' just 
					// stack all of that type instead of 'cap'. This is only sound
					// as long as there is not type variable with name '_' since
					// there are no valid primitive types of that name. 
					if( u.type() == types.NameType && u.name() == '_')
						cap = c;
					else{
						assert( subtypeOf( c.value() , cap.value() ),
							'Incompatible capability '+c.value()+' vs '+cap.value(), ast.type );
					}
					return cap;
				};
				
				switch( cap.type() ){
					default:
						assert( false, 'Cannot stack '+cap.type(), ast.type );
					case types.CapabilityType:
						cap = capStack(cap);
						break;

					case types.StarType:
						var tmp = new StarType();
						var inners = cap.inner();
						for(var i=0;i<inners.length;++i){
							tmp.add( capStack(inners[i]) );
						}
						cap = tmp;
						break;
				}
				
				return new StackedType( exp, cap );
			}
			
			case AST.kinds.RECORD_TYPE: {
				var rec = new RecordType();
				for(var i=0;i<ast.exp.length;++i){
					var field = ast.exp[i];
					var id = field.id;
					var value = check( field.exp, env );
					assert( rec.add(id, value),
						"Duplicated field '" + id + "' in '"+rec+"'", field);
				}
				return rec;
			}
			
			case AST.kinds.NAME_TYPE: {
				var tmp = env.get( ast.text );
				// returns a TypeVariable, if it was defined
				if( tmp === undefined || tmp.type() !== types.TypeVariable )
					return new NameType(ast.text);
				else
					return tmp;
			}
			case AST.kinds.PRIMITIVE_TYPE:
				// any primitive type is acceptable but only ints, booleans
				// and strings have actual values that match a primitive type.
				return new PrimitiveType(ast.text);

			default:

				// attempts to bang the result of f() which should only happen
				// if it does not change the delta environment
				var tryBang = function(f){ // tryBang : is a closure
					var initial_size = env.size();
					var result = f();
					if( initial_size == env.size() )
						return new BangType(result);
					return result;
				};
		
				// VALUES
				return tryBang(function(){
					// Tries to mark it as pure, if it does not use any of the
					// parent environment. This check is done by counting the
					// number of elements of the parent environment (on entry)
					// and comparing with its value on exit. If it is the same
					// then it did not touch it.
					// This only holds true because any use of the linear env
					// will push elements down, never to be recovered in here.
					switch( ast.kind ){
						
						case AST.kinds.FORALL: {
							var id = ast.id;
							var e = env.newScope();
							
							var variable;
							// type variable if starts with upper case
							if( id[0] === id[0].toUpperCase() )
								variable = new TypeVariable(id);
							else
								variable = new LocationVariable(id);

							addName( id, variable, e, ast );
			
							return new ForallType( variable, check( ast.exp, e ) );
						}
			
						case AST.kinds.FUN: {
							var id = ast.parms.id;
							var result = undefined;
							var initial_size = env.size();
							var e = env.newScope();
							var arg_type = check( ast.parms.type, e );
							
							if( ast.rec !== null ){ // recursive function
								result = check( ast.result, e );
								
								// note that all recursive functions must be pure
								var rec_fun = new BangType(
									new FunctionType(arg_type, result)
								);
								addName( ast.rec, rec_fun, e, ast );
							}
							
							
							var unstacked = unstack(arg_type,e,ast);
							
							addName( id, purify(unstacked), e, ast );

							var res = check( ast.exp, e );
							res = safelyEndScope( res, e, ast.exp );
							
							if( ast.rec !== null ){
								assert( subtypeOf( res, result ),
									"Invalid result type '"+res+"' expecting '"+result+"'", ast);
								assert( initial_size === env.size(),
									'Linear recursive function.', ast );
							}
							
							return new FunctionType(arg_type, res);
						}
						
						case AST.kinds.TAGGED: {
							var sum = new SumType();
							var tag = ast.tag;
							var exp = check(ast.exp, env);
							sum.add( tag, exp);
							return sum;
						}
						
						case AST.kinds.RECORD: {
							var rec = new RecordType();
							
							var initEnv = env.clone();
							var endEnv = null;
			
							for(var i=0;i<ast.exp.length;++i){
								var field = ast.exp[i];
								var id = field.id;
								
								var value;
								if( endEnv === null ){
									value = check( field.exp, env );
									endEnv = env;
								}else{
									var tmp_env = initEnv.clone();
									value = check( field.exp, tmp_env );
									assert( endEnv.isEqual(tmp_env),
										"Incompatible effects on field '" + id + "'", field);
								}
								assert( rec.add(id, value),
									"Duplicated field '" + id + "' in '"+rec+"'", field);
							}
			
							return rec;
						}
						
						case AST.kinds.NUMBER:
							return new PrimitiveType("int");
						case AST.kinds.BOOLEAN:
							return new PrimitiveType("boolean");
						case AST.kinds.STRING:
							return new PrimitiveType("string");

						default:
							assert(false,"Assertion error on " + ast.kind, ast);
				} });
		}

	}
	
	var printEnvironment = function(env,ast,pos){
		var gamma = [];
		var delta = [];
		var keys = env.allElements();
		
		for( var i=0; i<keys.length; ++i ){
			var val = env.get(keys[i]);
			// if duplicated do not print it... sort of lame
			if( keys.indexOf(keys[i]) < i ){
				continue;
			}
			if( val.type() == types.BangType || val.type() == types.LocationVariable ){
				gamma.push('<span class="type_name">'+keys[i]+'</span>'+": "+val.toHTML());
				continue;
			}			
			if( keys[i][0] === '.' ){
				delta.push( val.toHTML() );
				continue;
			}
			// HACK to find type variable declaration (has same name as abstracted type)
			if( val.type() == types.TypeVariable && keys[i] === val.name() ){
				gamma.push('<span class="type_name">'+keys[i]+'</span>'+": <b>type</b>");
				continue;
			}
			
			delta.push('<span class="type_name">'+keys[i]+'</span>'+": "+val.toHTML());

		}
		
		gamma.sort(); // to ensure always the same order
		gamma = gamma.join(',\n    ');
		
		delta.sort(); // to ensure always the same order
		delta = delta.join(',\n    ');
	
		return "@"+(ast.line+1)+":"+ast.col+' '+ast.kind+"\n\u0393 = "+gamma+"\n"+
			   "\u0394 = "+delta;
	}
	
	var type_info = [];
	//var debug_msg = '';
	var unique_counter = 0;

	return function(ast,typeinfo){
		// reset typechecke's state.
		unique_counter = 0;
		type_info = [];
		//debug_msg = '';
		
		var start = new Date().getTime();
		try{
			return check( ast, new Environment(null) );
		} finally {
			var end = new Date().getTime();
			
			if( typeinfo ){
				typeinfo.info = function(pos){
					var ast = null;
					var ptr = null;
					
					// search for closest one FIXME: may exist more than 1
					for( var i in type_info ){
						ast = type_info[i].ast;
						if( ( ast.line < pos.row || 
					 		( ast.line == pos.row &&
								ast.col <= pos.column ) ) ){
					 			ptr = i;
					 	}
					}
					
					if( ptr == null )
						return '';
			
					var diff = end-start;
					return '<b title="click to hide">Type Information</b><br/>'+
						'('+diff+'ms) <br/>'+
						printEnvironment(
						type_info[ptr].env,
						type_info[ptr].ast,
						pos);
				}
			}
		}

	};
}