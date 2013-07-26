
/* INCOMPLETE STUFF:
 *  X fields as intersection type.
 *  X case, problem on merging environments and result? subtyping?
 *  X star type, auto-stack should first collect all then just stack once
 *  X ensure star is commutative
 *  X recursion
 *  X forall / exists with types and convenient labelling
 *  X none type

 * 	-- Find better way to merge environments/types? 
 *  - recursive types and typedefs, needs indirection on types?
		--- should also forbid unknown name types, only rec labels?

 *  - ALTERNATIVES ... this will be messy, probably
 
 *  - convenient way for stdlib?
 *  - all sharing bits: focus, defocus, sharing and their framing
 *  - rely/guarantee
 * 	- subtyping fixes: tagged sums, pairs, etc. all those rules are missing

 ---> PROBLEM: indexing must be rethought to allow duplicated entries once sharing is introduced.
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
				return Object.keys(fields).length===0;
			}
			this.getFields = function(){
				return fields;
			}
		};
	}();

	var UnitType = new BangType(new RecordType());
	
	var NoneType = new function(){
		var type = addType('NoneType');
		
		inherit( this, type );
	}(); // note that it calls function immediately, so there is a single type.
	
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
			
			var n = name===null ? 't<sub>'+(unique_counter++)+'</sub>' : name;
			
			this.name = function(){ return n; }
		};
	}();
	
	var TypeVariable = function(){
		var type = addType('TypeVariable');
		
		return function(name){
			inherit( this, type );
			
			var n = name===null ? 'T<sub>'+(unique_counter++)+'</sub>' : name;
			
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
	
	var RecursiveType = function(){
		//var unique_id = 0;
		var type = addType('RecursiveType');
		
		return function(id,inner){
			inherit( this, type );
			
			//this.unique = (++unique_id);
			this.id = function(){ return id; }
			this.inner = function(){ return inner; }
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
			case types.RecursiveType:
			case types.ExistsType:
			case types.ForallType:
				if( t.id().name() === loc.name() )
					// the name is already bounded, so loc must be fresh
					// because it does not occur free inside t.inner()
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
				return t.name() !== loc.name();
			case types.NoneType:
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
				if( inner.type() === types.ReferenceType ||
					inner.type() === types.FunctionType ||
					inner.type() === types.StackedType )
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
			case types.RecursiveType:
				return 'rec '+t.id().name()+'.('+toString(t.inner())+')';
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
			case types.PrimitiveType:
				return t.name();
			case types.NoneType:
				return 'none';
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
	};
	
	var toHTML = function (t){
		switch ( t.type() ){
			case types.FunctionType:
				return toHTML(t.argument())+" -o "+toHTML(t.body());
				//return toHTML(t.argument())+" &#x22b8; "+toHTML(t.body());
			case types.BangType:{
				var inner = t.inner();
				if( inner.type() === types.ReferenceType ||
					inner.type() === types.FunctionType ||
					inner.type() === types.StackedType || 
					inner.type() === types.SumType )
					return "!("+toHTML(t.inner())+')';	
				return "!"+toHTML(t.inner());
			}
			case types.SumType:{
				var tags = t.tags();
				var res = [];
				for( var i in tags ){
					res.push( '<span class="type_tag">'+tags[i]+'</span>#'+toHTML(t.inner(tags[i])) ); 
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
			case types.RecursiveType:
				return '<b>rec</b> '+
				( t.id() === types.LocationVariable ?
					'<span class="type_location">' :
					'<span class="type_variable">')
				+t.id().name()+'</span>'
				+'.('+toHTML(t.inner())+')';
			case types.ExistsType:
				return '&#8707;'+
				( t.id() === types.LocationVariable ?
					'<span class="type_location">' :
					'<span class="type_variable">')
				+t.id().name()+'</span>'
				+'.('+toHTML(t.inner())+')';
			case types.ForallType:
				return '&#8704;'+
				( t.id() === types.LocationVariable ?
					'<span class="type_location">' :
					'<span class="type_variable">')
				+t.id().name()+'</span>'
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
				return '<span class="type_variable">'+t.name()+'</span>';
			case types.PrimitiveType:
				return '<b>'+t.name()+'</b>';
			case types.NoneType:
				return '<b>none</b>';
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
				for( var i in tags )
					sum.add( tags[i], rec(t.inner(tags[i])) );
				return sum;
			}
			case types.StarType:{
				var star = new StarType();
				var inners = t.inner();
				for( var i=0;i<inners.length;++i ){
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
				if( ( target.type() === types.LocationVariable ||
					  target.type() === types.TypeVariable )
					&& t.id().name() === target.name() ){
					var nvar = cloneVar( t.id() );
					var ninner = rename( t.inner(), t.id(), nvar );
					return new ExistsType( nvar, rec(ninner) );	
				}
				return new ExistsType( t.id(), rec(t.inner()) );
			case types.ForallType:
				if( ( target.type() === types.LocationVariable ||
					  target.type() === types.TypeVariable )
					&& t.id().name() === target.name() ){
					var nvar = cloneVar( t.id() );
					var ninner = rename( t.inner(), t.id(), nvar );
					return new ForallType( nvar, rec(ninner) );	
				}
				return new ForallType( t.id(), rec(t.inner()) );
			case types.RecursiveType:
				if( target.type() === types.TypeVariable
					&& t.id().name() === target.name() ){
					var nvar = cloneVar( t.id() );
					var ninner = rename( t.inner(), t.id(), nvar );
					return new RecursiveType( nvar, rec(ninner) );	
				}
				return new RecursiveType( t.id(), rec(t.inner()) );
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
		// only creates environments when necessary
		return equalsTo( a, null, b, null );
	}
	
	var equalsTo = function( t1, m1, t2, m2 ){
		var rec1 = t1.type() === types.RecursiveType;
		var rec2 = t2.type() === types.RecursiveType;
		if( rec1 ^ rec2 ){
			if( rec1 )
				return equalsTo( t1.inner(), m1, t2, m2 );
			
			if( rec2 )
				return equalsTo( t1, m1, t2.inner(), m2 );
		}
		
		if( t1.type() !== t2.type() )
			return false;
		
		// assuming both same type
		switch ( t1.type() ){
			case types.FunctionType:
				return equalsTo( t1.argument(), m1, t2.argument(), m2 ) &&
					equalsTo( t1.body(), m1, t2.body(), m2 );
			case types.BangType:
				return equalsTo( t1.inner(), m1, t2.inner(), m2 );
			case types.SumType:{
				var t1s = t1.tags();
				var t2s = t2.tags();
				if( Object.keys(t1s).length !== Object.keys(t1s).length )
					return false;
				for( var i in t1s )
					if( !t2s.hasOwnProperty(i) ||
						!equalsTo( t1.inner(t1s[i]), m1, t2.inner(t1s[i]), m2 ) )
						return false;
				return true;
			}
			case types.RecursiveType:
			case types.ForallType:		
			case types.ExistsType:{
				// uses environment to know the relation between the two names
				// instead of having to renamed the type to ensure matching
				// labels on their inner types.
				var n1 = m1 === null ? new Environment(null) : m1.newScope();
				var n2 = m2 === null ? new Environment(null) : m2.newScope();
				n1.set( t1.id().name(), t2.id() );
				n2.set( t2.id().name(), t1.id() );
				return equalsTo( t1.inner(), n1, t2.inner(), n2 );
			}
			case types.ReferenceType:
				return equalsTo( t1.location(), m1, t2.location(), m2 );
			case types.StackedType:
				return equalsTo( t1.left(), m1, t2.left(), m2 ) &&
					equalsTo( t1.right(), m1, t2.right(), m2 );
			case types.CapabilityType:
				return equalsTo( t1.location(), m1, t2.location(), m2 ) &&
					equalsTo( t1.value(), m1, t2.value(), m2 );
			case types.RecordType: {
				var t1s = t1.getFields();
				var t2s = t1.getFields();
				if( Object.keys(t1s).length !== Object.keys(t2s).length )
					return false;
				for( var i in t1s )
					if( !t2s.hasOwnProperty(i) || 
						!equalsTo( t1s[i], m1, t2s[i], m2 ) )
						return false;
				return true;
			} 
			case types.TupleType: {
				var t1s = t1.getValues();
				var t2s = t2.getValues();
				if( t1s.length !== t2s.length )
					return false;
				for( var i=0;i<t1s.length;++i )
					if( !equalsTo( t1s[i], m1, t2s[i], m2 ) )
						return false;
				return true;
			}
			case types.TypeVariable:
			case types.LocationVariable:
				var a1 = m1 !== null ? m1.get(t1.name()) : undefined;
				var a2 = m2 !== null ? m2.get(t2.name()) : undefined;
				// note it also returns 'undefined' when name not bound
				if( a1 === undefined && a2 === undefined )
					return t1.name() === t2.name();
					
				// check they are related, as seen before
				return a1.type() === a2.type() &&
					a1.name() === t2.name() &&
					a2.name() === t1.name();

			case types.PrimitiveType:
				return t1.name() === t2.name();
			default:
				assert( false, "Assertion error on " +t2.type() );
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
		return subtype( t1, new Environment(null), t2, new Environment(null) );
	}
	
	var subtype = function( t1, m1, t2, m2 ){
			
		// confirm subtyping rules are synced with paper
							//console.log('SUBTYPE:');
							//console.log(t1);
							//console.log(t2);
							//console.log(t1.type()+'-----'+t2.type());

		if( t1.type() === types.RecursiveType ){
			m1.set( t1.id().name(), t1 ); // ok to fail silently
			return subtype( t1.inner(), m1, t2, m2 );
		}
		
		if( t2.type() === types.RecursiveType ){
			m2.set( t2.id().name(), t2 ); // ok to fail silently
			return subtype( t1, m1, t2.inner(), m2 );
		}

		// types that can be "banged"
		if ( t2.type() === types.BangType &&
			( t1.type() === types.ReferenceType
			|| t1.type() === types.PrimitiveType
			|| ( t1.type() === types.RecordType && t1.isEmpty() ) ) )
			return subtype( t1, m1, t2.inner(), m2 );
		
		// "ref" t1: (ref p) <: !(ref p)
		if ( t1.type() === types.ReferenceType && t2.type() === types.BangType )
			return subtype( t1, m1, t2.inner(), m2 );

		// "pure to linear" - ( t1: !A ) <: ( t2: A )
		if ( t1.type() === types.BangType && t2.type() !== types.BangType )
			return subtype( t1.inner(), m1, t2, m2 );

		// all remaining rule require equal kind of type
		if( t1.type() !== t2.type() ){
			// try to match with the type that was tabled
			if( t1.type() === types.TypeVariable && m1.get(t1.name()) !== undefined )
				return subtype(m1.get(t1.name()),m1,t2,m2);
				
			if( t2.type() === types.TypeVariable &&  m2.get(t2.name()) !== undefined )
				return subtype(t1,m1,m2.get(t2.name()),m2);

			return false;
		}
		
		//else: safe to assume same type from here on
		switch ( t1.type() ){
			case types.NoneType:
				return true;
			case types.PrimitiveType:
				return t1.name() === t2.name();
			case types.BangType:
				// if t2 is unit: "top" rule
				if( t2.inner().type() === types.RecordType && t2.inner().isEmpty() )
					return true;
				return subtype( t1.inner(), m1, t2.inner(), m2 );
			case types.ReferenceType:
				return subtype( t1.location(), m1, t2.location(), m2 );
			case types.FunctionType:
				return subtype( t2.argument(), m2, t1.argument(), m1 )
					&& subtype( t1.body(), m1, t2.body(), m2 );
			case types.RecordType:{
				if( !t1.isEmpty() && t2.isEmpty() )
					return false;

				// all fields of t2 must be in t1
				var t1fields = t1.getFields();
				var t2fields = t2.getFields();				
				for( var i in t2fields ){
					if( !t1fields.hasOwnProperty(i) ||
						!subtype( t1fields[i], m1, t2fields[i], m2 ) ){
						return false;
					}
				}
				return true;
			}
			case types.StackedType:
				return subtype( t1.left(), m1, t2.left(), m2 ) &&
					subtype( t1.right(), m1, t2.right(), m2 );
			case types.StarType:{
				var i1s = t1.inner();
				var i2s = t2.inner();
				
				if( i1s.length !== i2s.length )
					return false;
				// for *-type, any order will do
				var tmp_i2s = i2s.slice(0); // copies array
				for(var i=0;i<i1s.length;++i){
					var curr = i1s[i];
					var found = false;
					for(var j=0;j<tmp_i2s.length;++j){
						var tmp = tmp_i2s[j];
						if( subtype(curr,m1,tmp,m2) ){
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
						!subtype( t1.inner(i1s[i]), m1, j, m2 ) )
						return false;
				}
				return true;
			}
			case types.TypeVariable:
			case types.LocationVariable:

				var a1 = m1.get(t1.name());
				var a2 = m2.get(t2.name())
				
				if( a1 === undefined && a2 === undefined )
					return t1.name() === t2.name();

				if( a1.type() === types.RecursiveType && 
					a2.type() === types.RecursiveType )
					return true; // assume fails elsewhere
					
				// check they are related, as seen before
				return a1.type() === a2.type() &&
					a1.name() === t2.name() &&
					a2.name() === t1.name();

			case types.CapabilityType:
				return subtype( t1.location(), m1, t2.location(), m2 ) &&
					subtype( t1.value(), m1, t2.value(), m2 );
			
			case types.ForallType:		
			case types.ExistsType:{
				// uses environment to know the relation between the two names
				// instead of having to renamed the type to ensure matching
				// labels on their inner types.
				
				var n1 = m1.newScope();
				var n2 = m2.newScope();
				n1.set( t1.id().name(), t2.id() );
				n2.set( t2.id().name(), t1.id() );
				return subtype( t1.inner(), n1, t2.inner(), n2 );
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

				if( !equals( this.get(mine[id]), other.get(theirs[id]) ) )
					return false;
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
		// if bang mismatch, we need to not consider the sum as banged because
		// our types cannot do a case on whether the type is liner or pure
		var b1 = t1.type() === types.BangType;
		var b2 = t2.type() === types.BangType;
		
		if( b1 ^ b2 ){
			if( b1 ) t1 = t1.inner();
			if( b2 ) t2 = t2.inner();
		}
		
		if( t1.type() !== t2.type () )
			return undefined;
		
		// both the same type
		if( t1.type() === types.BangType ){
			var tmp = merge( t1.inner(),t2.inner() );
			if( tmp !== undefined )
				return new BangType( tmp );
		}
		
		if( t1.type() === types.SumType ){
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
		
		// all other cases must have exactly the same type
		if( equals(t1,t2) )
			return t1;
			
		return undefined;
	}

	// removes all BangTypes
	var unBang = function(t){
		while( t.type() === types.BangType )
			t = t.inner();
		return t;
	}
	
	var unAll = function(tt){
		// FIXME: how to properly table this? indexOf / equals does not appear to work
		// how to check for fix point?
		
		var visited = 100;
		var t = tt;
		while( true ) {
			if( t.type() === types.BangType ){
				t = t.inner();
				continue;
			}
			if( t.type() === types.RecursiveType ){
				//assert( visited.indexOf(t.unique()) === -1 , 'Unending unfolding of type: '+t );
				//visited.push(t);
				assert( (--visited) > 0 , 'Failed to unfold: '+tt +', max unfolds reached');
				
				// unfold
				t = rename(t.inner(),t.id(),t);
				continue;
			}
			break;
		}
		return t;
	}
		
	// attempts to convert type to bang
	var purify = function(t){
		if( t.type() !== types.BangType ){
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
				case types.NoneType:
					break; // nothing to do
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
			if( e[0] === '.' ) // ignore hidden elements
				return;
			if( el.type() == types.LocationVariable && !isFresh(res,el) ){
				var loc = new LocationVariable(null);
				res = new ExistsType( loc, rename( res, el, loc ) );
				return;
			}
			if( el.type() == types.TypeVariable && !isFresh(res,el) ){
				var loc = new TypeVariable(null);
				res = new ExistsType( loc, rename( res, el, loc ) );
				return;
			}
		});
		return res;	
	}

	var addName = function(id,value,e,ast){
		// check for collisions
		var ee;
		
		// cannot occur anywhere, cannot be hidden
		if( value.type() === types.LocationVariable ){
			ee = e.get(id);
			
			// ok to collide with capabilities since they cannot be accessed
			if( ee != undefined && ee.type() === types.CapabilityType )
				ee = undefined;
		}else{
			// cannot occur at the same level
			ee = e.hasKey(id);
		}
		assert( ee === undefined,
			"Identifier '" + id + "' already in scope", ast );

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
				
				value = unAll( value );
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
					case types.LocationVariable:
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
				val = unAll(val);
				assert( val.type() === types.SumType,
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
				
				exp = unAll(exp);
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
				exp = unAll(exp);
				
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
				
				lvalue = unAll(lvalue);
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
				rec = unAll(rec);
				
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
				fun = unAll(fun);
				
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
								for(var i=0;i<inners.length;++i){
									var tt = inners[i];
									
									switch( tt.type() ){ // TODO: code clean up
										case types.CapabilityType:
											var loc = tt.location().name();
											var capI = capIndex( loc )
											var cap = assert( env.remove( capI ),
												'Missing capability '+loc, ast.arg);
											tt = cap;
											break;
										case types.TypeVariable:
											var loc = tt.name();
											var capI = capIndex( loc )
											var cap = assert( env.remove( capI ),
												'Missing capability '+loc, ast.arg);
											tt = cap;
											break;
										case types.NoneType:
											tt = NoneType;
											break;
										default:
											assert( false, 'Auto-stack on '+tt, ast.arg);	
									}

									tmp.add( tt );
								}
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
						case types.NoneType: {
							return new StackedType( t, NoneType );
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
				exp = unAll(exp);
				assert( exp.type() == types.ForallType , 
					'Not a Forall '+exp.toString(), ast.exp );
				
				var packed = check(ast.id, env);
				return rename( exp.inner(), exp.id(), packed );
			}
			
			case AST.kinds.TUPLE_TYPE:
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
				exp = unAll(exp);
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
				
				assert( loc !== undefined && loc.type() === types.LocationVariable,
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
			
			case AST.kinds.RECURSIVE_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				assert( id[0] === id[0].toUpperCase(),
					'Type Variables must be upper-cased', ast );
					
				var variable = new TypeVariable(id);
				e.set( id, variable );
				return new RecursiveType( variable, check( ast.exp, e ) );
			}
						
			case AST.kinds.NONE_TYPE:
				return NoneType;
				
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
					
					switch( cap.type() ){
						case types.CapabilityType:
							var loc = cap.location().name();
							var capI = capIndex( loc );
							var c = assert( env.remove( capI ),
								'Missing capability '+loc, ast.type);
							var u = unBang(cap.value());
				
							assert( subtypeOf( c.value() , cap.value() ),
								'Incompatible capability '+c.value()+' vs '+cap.value(), ast.type );
		
							return cap;
						case types.TypeVariable:
							var loc = cap.name();
							var capI = capIndex( loc );
							var c = assert( env.remove( capI ),
								'Missing capability '+loc, ast.type);
							assert( subtypeOf( c , cap ),
								'Incompatible capability '+c+' vs '+cap, ast.type );
							return cap;
						case types.NoneType:
							return NoneType;
						case types.StarType:
							var tmp = new StarType();
							var inners = cap.inner();
							for(var i=0;i<inners.length;++i){
								tmp.add( capStack(inners[i]) );
							}
							return tmp;
						default:
							assert( false, 'Cannot stack '+cap.type(), ast );
					}

					return cap;
				};
				
				return new StackedType( exp, capStack(cap) );
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
				var label = ast.text;
				var tmp = env.get( label );
				// if label matches type in environment, but we only allow
				// access to type variables and location variables using this
				// AST.kind --- all other uses are assumed to be recursives.
				if( tmp !== undefined &&
					( tmp.type() === types.TypeVariable ||
					  tmp.type() === types.LocationVariable ) )
						return tmp;
				
				// look for type definitions
				var lookup = typedefs[label];
		
				// found something
				if( lookup !== undefined && lookup !== null )
					return lookup;
		
				assert( false, 'Unknown type '+label, ast);
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
	
	
	var type_info;
	var unique_counter;
	var typedefs;

	return function(ast,typeinfo){
		var start = new Date().getTime();
		
		try{
			assert( ast.kind === AST.kinds.PROGRAM, 'Failed program assertion', ast );
				
			// reset typechecke's state.
			var env = new Environment(null);
			type_info = [];
			unique_counter = 0;
			typedefs = {};
				
			assert( ast.imports === null , 'FIXME: imports not done.' , ast);
				
			if( ast.typedefs !== null ){
				for(var i=0;i<ast.typedefs.length;++i){
					var type = ast.typedefs[i];
					assert( !typedefs.hasOwnProperty(type.id),
						'Duplicated typedef: '+type.id, type )
					typedefs[type.id] = check( type.type, env );
				}
			}
			
			return check( ast.exp, env );
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