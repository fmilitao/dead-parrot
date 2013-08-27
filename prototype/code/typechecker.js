/**
 * Notes:
 * 	- syntax direct alternatives using: @p Expression. Later this can be 
 * replaced with just linear search for the correct way to open an (+) type.
 * 
 * REQUIRED Global variables (all declared in parser.js):
 * 	- AST.kinds, for all AST case analysis needs.
 *  - assertf, for error handling/flagging.
 */

var TypeChecker = (function(AST,assertF){

	var exports = {};
	
	var assert = function(f,msg,ast){
		return assertF('Type error',f,msg,ast);
	}

	//
	// TYPES
	//
	
	// types enumeration, useful for case analysis
	var types = {};
	var addType = function(label){
		assert( !types.hasOwnProperty(label), 'Duplicated label: '+label );
		types[label] = label;
		// later it may be useful to change away from strings, but for now
		// they are very useful when debugging problems.
		return label;
	}
	
	var inherit = function(obj,type){
		obj.type = function(){ return type; }
		obj.toString = function() { return toString(obj); }
	}

	// types factory
	var fct = {};
	var newType = function( type, constructor ){
		assert( !types.hasOwnProperty(type) && !fct.hasOwnProperty(type),
			'Error duplicated type: '+type );
		
		var wrp = function(){
			// add common methods by wrapping constructor
			this.type = function(){ return type; }
			this.toString = function() { return toString(this); }
			// now call constructor with the supplied arguments
			constructor.apply(this,arguments);
		};

		// later it may be useful to change away from strings, but for now
		// they are very useful when debugging problems.
		types[type] = type;
		fct[type] = wrp;
		return wrp;
	};

	var FunctionType = function() {
		var type = addType('FunctionType');
	
		return function( argument, body ) {
			inherit( this, type );
			this.argument = function(){ return argument; }
			this.body = function(){ return body; }
		};
	}();
	
	/*
	newType('FunctionType',
		function( argument, body ) {
			this.argument = function(){ return argument; }
			this.body = function(){ return body; }
		} );
	*/
	
	var BangType = function(){
		var type = addType('BangType');
		
		return function( inner ) {
			inherit( this, type );
			this.inner = function(){ return inner; }
		};
	}();

	var SumType = function(){
		var type = addType('SumType');
		
		return function() {
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
		
		return function() {
			inherit( this, type );
			
			var types = [];
			this.add = function( inner ){
				types.push(inner);
				return null;
			}
			this.inner = function(){ return types; }
		};
	}();
	
	var AlternativeType = function(){
		var type = addType('AlternativeType');
		
		return function() {
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
			this.id = function(){ return id; }
			this.inner = function(){ return inner; }
		};
	}();
	
	var ExistsType = function(){
		var type = addType('ExistsType');
		
		return function(id,inner){
			inherit( this, type );
			this.id = function(){ return id; }
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
	
	var NoneType = new function(){ // FIXME how to do singleton with new style?
		var type = addType('NoneType');
		
		inherit( this, type );
	}(); // calls function immediately, so there is a singleton value.
	
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
		var type = addType('RecursiveType');
		
		return function(id,inner){
			inherit( this, type );

			this.id = function(){ return id; }
			this.inner = function(){ return inner; }
		};
	}();
	
	var RelyType = function(){
		var type = addType('RelyType');
		
		return function(rely,guarantee){
			inherit( this, type );

			this.rely = function(){ return rely; }
			this.guarantee = function(){ return guarantee; }
		};
	}();
	
	var GuaranteeType = function(){
		var type = addType('GuaranteeType');
		
		return function(guarantee,rely){
			inherit( this, type );
			
			this.rely = function(){ return rely; }
			this.guarantee = function(){ return guarantee; }
		};
	}();
	
	// this is a "fake" type that is just convenient
	var DelayedApp = function(){
		var type = addType('DelayedApp');
		
		return function(delayed_type,app_type){
			inherit( this, type );

			this.inner = function(){ return delayed_type; }
			this.id = function(){ return app_type; }
		};
	}();
	
	exports.types = types;
	exports.factory = { // this looks dumb... how to improve?
		FunctionType : FunctionType, 
		BangType : BangType,
		SumType : SumType,
		StarType : StarType,
		AlternativeType : AlternativeType,
		ForallType : ForallType,
		ExistsType : ExistsType,
		RecordType : RecordType,
		NoneType : NoneType,
		TupleType : TupleType,
		ReferenceType : ReferenceType,
		StackedType : StackedType,
		CapabilityType : CapabilityType,
		LocationVariable : LocationVariable,
		TypeVariable : TypeVariable,
		PrimitiveType : PrimitiveType,
		RecursiveType : RecursiveType,
		RelyType : RelyType,
		GuaranteeType : GuaranteeType,
		DelayedApp : DelayedApp
	};

	//
	// VISITORS
	//
	
	/**
	 * Searchs types 't' for location variable 'loc'. isFree if NOT present.
	 * @param {Type} t that is to be traversed
	 * @param {LocationVariable,TypeVariable} loc that is to be found
	 * @return {Boolean} true if location variableis NOT in type.
	 * Note that all variable names collide so that checking for 
	 * LocationVariable versus TypeVariable is not necessary.
	 */
	var isFree = function (t,loc){
		switch ( t.type() ){
			case types.FunctionType:
				return isFree( t.argument(), loc ) &&
					isFree( t.body(), loc );
			case types.BangType:
				return isFree( t.inner(), loc );
			case types.RelyType: {
				return isFree(t.rely()) && isFree(t.guarantee());
			}
			case types.GuaranteeType: {
				return isFree(t.guarantee()) && isFree(t.rely());
			}
			case types.SumType:{
				var tags = t.tags();
				for( var i in tags ){
					if( !isFree(t.inner(tags[i]),loc) )
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
				return isFree(t.id(),loc) && isFree(t.inner(),loc);
			case types.ReferenceType:
				return isFree( t.location(), loc );
			case types.StackedType:
				return isFree( t.left(), loc ) && isFree( t.right(), loc );
			case types.CapabilityType:
				return isFree( t.location(), loc ) && isFree( t.value(), loc );
			case types.RecordType: {
				var fs = t.getFields();
				for( var i in fs ){
					if( !isFree(fs[i],loc) )
						return false;
				}
				return true;
			}
			case types.AlternativeType:
			case types.StarType:{
				var inners = t.inner();
				for( var i=0; i<inners.length; ++i )
					if( !isFree(inners[i],loc) )
						return false;
				return true;
			}
			case types.TupleType: {
				var vs = t.getValues();
				for( var i in vs ){
					if( !isFree(vs[i],loc) )
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
			case types.DelayedApp:
				return isFree(t.inner(),loc) && isFree(t.id(),loc);
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
		};

	// required also for testing
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
			case types.RelyType: {
				return toString(t.rely())+' => '+toString(t.guarantee());
			}
			case types.GuaranteeType: {
				return toString(t.guarantee())+' ; '+toString(t.rely());
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
			case types.AlternativeType:{
				var inners = t.inner();
				var res = [];
				for( var i=0; i<inners.length; ++i )
					res.push( toString( inners[i] ) ); 
				return res.join(' (+) ');
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
			case types.DelayedApp:
				return toString(t.inner())+'['+toString(t.id())+']';
			default:
				assert( false, "Assertion error on " +t.type() );
				break;
			}
	};
	
	/**
	 * Substitutes in 'type' any occurances of 'from' to 'to'
	 * 		type[from/to] ('from' for 'to')
	 * @param {Type} type that is to be searched
	 * @param {Type} when 'from' is found, it is replaced with
	 * @param {LocationVariable,TypeVariable} 'to'
	 * @return a *copy* of 'type' where all instances of 'from' have been
	 * 	replaced with 'to' (note that each to is the same and never
	 * 	cloned).
	 *  Note that it also RENAMES any bounded variable that colides with the
	 *  'from' name so that bounded names are never wrongly substituted.
	 */
	var substitution = function(type,from,to){
		// to clone variables
		var cloneVar = function(variable){
			switch( variable.type() ){
				case types.LocationVariable:
					return new LocationVariable(null);
				case types.TypeVariable:
					return new TypeVariable(null);
				default:
					assert( false, 'Expecting variable but got: '+variable, null);
			}
		};
		
		var rec = function(t){
			if( equals(t,from) )
				return to;
			
			switch ( t.type() ){
			case types.FunctionType:
				return new FunctionType( rec(t.argument()), rec(t.body()) );
			case types.BangType:
				return new BangType( rec(t.inner()) );
			case types.RelyType: {
				return new RelyType( rec(t.rely()), rec(t.guarantee()) );
			}
			case types.GuaranteeType: {
				return new GuaranteeType( rec(t.guarantee()), rec(t.rely()) );
			}
			case types.SumType:{
				var sum = new SumType();
				var tags = t.tags();
				for( var i in tags )
					sum.add( tags[i], rec(t.inner(tags[i])) );
				return sum;
			}
			case types.AlternativeType:{
				var star = new AlternativeType();
				var inners = t.inner();
				for( var i=0;i<inners.length;++i ){
					star.add( rec(inners[i]) ); 
				}	
				return star;
			}
			case types.StarType:{
				var star = new StarType();
				var inners = t.inner();
				for( var i=0;i<inners.length;++i ){
					star.add( rec(inners[i]) ); 
				}	
				return star;
			}
			// CAPTURE AVOIDANCE in the following cases...
			// Renaming is needed to avoid capture of bounded variables.
			// We have two cases to consider:
			// 1. The variable to be renamed is the same as bounded var:
			// (exists t.A){t/X} "t for X" 
			// in this case, we are done renaming, since t is bounded inside A.
			// 2. The *to* name is the same the bounded var:
			// (exists t.A){g/t} "g for t"
			// in this case we must rename the location 't' to avoid capture
			// in the case when 'g' occurs in A.
			case types.ExistsType: 
			case types.ForallType:
			case types.RecursiveType: {
				if( ( from.type() === types.LocationVariable ||
					  from.type() === types.TypeVariable )
						&& t.id().name() === from.name() ){
					// 'from' is bounded, thus we are done. 
					return t;
				}
				
				var nvar = t.id();
				var ninner = t.inner();
				if( ( to.type() === types.LocationVariable ||
					  to.type() === types.TypeVariable )
						&& t.id().name() === to.name() ){
					// capture avoiding substitution 
					nvar = cloneVar( t.id() );
					ninner = substitution( t.inner(), t.id(), nvar );
				}
				
				// switch again to figure out what constructor to use.
				switch( t.type() ){
					case types.ExistsType:
						return new ExistsType( nvar, rec(ninner) );
					case types.ForallType:
						return new ForallType( nvar, rec(ninner) );
					case types.RecursiveType:
						return new RecursiveType( nvar, rec(ninner) );
					default:
						assert( false, 'Not expecting '+t.type(), null);
				}
			}
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
			// these remain UNCHANGED
			// note that Location/Type Variable is teste ABOVE, not here
			case types.LocationVariable:
			case types.TypeVariable:
			case types.PrimitiveType:
			case types.NoneType:
				return t;
			case types.DelayedApp: {
				var inner = rec(t.inner());
				var id = rec(t.id());
				// ok to apply
				if( inner.type() === types.ForallType )
					return substitution( inner.inner(), inner.id(), id );
				
				/*
				if( inner.type() === types.RecursiveType &&
					inner.inner().type() === types.ForallType ){
						var ninner = inner.inner();
						var inside = substitution( ninner.inner(), ninner.id(), id );
						console.log( t );
						console.log( inner );
						console.log( inside );
						console.log( id );
						return new RecursiveType(inner.id(),inside);
				} */
				// still delayed
				return new DelayedApp(inner,id);
			}
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

		// recursion table so as to remember those pairs of types that were
		// already seen in order to avoid unending executions.
		var visited = [];
		var seen = function(a,b){
			for(var i=0;i<visited.length;++i){
				if( visited[i][0] === a && visited[i][1] === b )
					return true;
			}
			return false;
		}
		var push = function(a,b){
			visited.push( [a,b] );
		}
		var transitivity = function(a,b,left){
			var tmp = [];
			for(var i=0;i<visited.length;++i){
				if( left ){ // on left
					if( visited[i][1] === a ){
						tmp.push( [ visited[i][0], b ] );
					}
				}else{ // on right
					if( visited[i][0] === a ){
						tmp.push( [ b, visited[i][1] ] );
					}
				}
			}						
			visited = visited.concat(tmp);
		}
		
		// auxiliary function that is bound to the previous 'visited' table
		// and also uses temporary environments to remember type variables, etc.
		var equalsTo = function( t1, m1, t2, m2 ){
//console.debug( t1+' == '+t2 );
			
			if( t1 === t2 ) {// exactly the same
				return true;
			}
				
			if( seen( t1, t2 ) )
				return true;
			
			
			var var1 = t1.type() === types.TypeVariable;
			var var2 = t2.type() === types.TypeVariable;
			if( var1 ^ var2 ){
				
				// in here?? the next line makes no sense...
				push( t1, t2 ); // assume they are the same

				if( var1 ){
					t1 = m1.get( t1.name() );
					// some problem on getting the variable's definition
					// assume it is not equal.
					if( t1 === undefined )
						return false;
				}
				if( var2 ){
					t2 = m2.get( t2.name() );
					if( t2 === undefined )
						return false;
				}
				
				return equalsTo( t1, m1, t2, m2 );
			}
			
			// recursive types must be handled before hand
			// handle asymmetric comparision of recursive types
			var rec1 = t1.type() === types.RecursiveType;
			var rec2 = t2.type() === types.RecursiveType;
			if( rec1 ^ rec2 ){

//				push( t1, t2 ); // assume they are the same
				// if this is wrong, then it must be cause their internals
				// are different. Therefore, it will fail elsewhere and it is
				// OK to assume they are equal in here.

				if( rec1 ){
					m1 = m1.newScope();
					m1.set( t1.id().name(), t1 );
					t1 = t1.inner();
				}
				if( rec2 ){
					m2 = m2.newScope();
					m2.set( t2.id().name(), t2 );
					t2 = t2.inner();
				}
//console.debug( t1+' ?? ' +t2 )				
				return equalsTo( t1, m1, t2, m2 );
			}
			
			var del1 = t1.type() === types.DelayedApp;
			var del2 = t2.type() === types.DelayedApp;
			if( del1 ^ del2 ){
				
				//push( t1, t2 );

				if( del1 ){
					// special (ad-hoc?) lookahead
					if( t1.inner().type() === types.RecursiveType &&
						t1.inner().inner().type() === types.ForallType ){				
						var v = t1.id();
						var rec = t1.inner();
						var forall = rec.inner();
						
						// recursive type
						m1 = m1.newScope();
						m1.set( rec.id().name(), rec );
						
						// TRANSITIVITY: must ensure is considered same as other
						transitivity( v.name(), forall.id().name(), false );
	
						t1 = forall.inner();

						return equalsTo( t1, m1, t2, m2 );
					}
				}
				
				if( del2 ){
					// special (ad-hoc?) lookahead
					if( t2.inner().type() === types.RecursiveType &&
						t2.inner().inner().type() === types.ForallType ){				
//console.debug( t1 +' \n\tVS ' +t2 );
						var v = t2.id();
						var rec = t2.inner();
						var forall = rec.inner();
						
						// recursive type
						m2 = m2.newScope();
						m2.set( rec.id().name(), rec );
						
						// forall this is actually not necessary
						// m2 = m2.newScope();
						// m2.set( forall.id().name(), v );
						// what if it is a type variable?
						
						// TRANSITIVITY: must ensure is considered same as other
						transitivity( v.name(), forall.id().name(), true );
	
						t2 = forall.inner();
/*
console.debug('???' + v.name() + ' + ' + tmp);
console.debug('visited:\t\t '+ visited );
console.debug('?:\t\t '+ t1 );
console.debug('?:\t\t '+ t2 );
*/
						return equalsTo( t1, m1, t2, m2 );
/*
console.debug('res:\t\t ' + x );
console.debug('visited:\t\t '+ visited );
						return x;
*/
					}
				}
			}
			
			// ----
			
			if( t1.type() !== t2.type() ){
				//console.log( t1 + ' vs ' + t2 );
				return false;
			}
			
			// assuming both same type
			switch ( t1.type() ){
				case types.ForallType:		
				case types.ExistsType:
				case types.RecursiveType: {
//console.debug( '??'+ t1.id().name()+' '+t2.id().name() );
					if( t1.id().type() !== t2.id().type() )
						return false;

					// assume they are the same
					push( t1.id().name(), t2.id().name() );
//console.debug( '>>' +visited );
					if( t1.type() === types.RecursiveType ){
						// environment used to store the type for the case
						// unfolding is necessary on the recursive types
						m1 = m1.newScope();
						m2 = m2.newScope();
						
						m1.set( t1.id().name(), t1 );
						m2.set( t2.id().name(), t2 );
						
						push( t1, t2 );
					}
					
					
					return equalsTo( t1.inner(), m1, t2.inner(), m2 );
				}
				case types.TypeVariable:
				case types.LocationVariable: {
					return  t1.name() === t2.name() ||
						seen( t1.name(), t2.name() );
				}
				// =============================================================
				case types.FunctionType:
					return equalsTo( t1.argument(), m1, t2.argument(), m2 ) &&
						equalsTo( t1.body(), m1, t2.body(), m2 );
				case types.BangType:
					return equalsTo( t1.inner(), m1, t2.inner(), m2 );
				case types.RelyType: {
					return equalsTo( t1.rely(), m1, t2.rely(), m2 ) &&
						equalsTo( t1.guarantee(), m1, t2.guarantee(), m2 );
				}
				case types.GuaranteeType: {
					return equalsTo( t1.guarantee(), m1, t2.guarantee(), m2 ) &&
						equalsTo( t1.rely(), m1, t2.rely(), m2 );
				}
				case types.SumType: {
					var t1s = t1.tags();
					var t2s = t2.tags();
					// note that it is an array of tags (strings)
					if( t1s.length !== t2s.length )
						return false;
					for( var i=0; i<t1s.length; ++i ){
						//console.log('---'+ t1s );
						//console.log('---'+ t2s );
						//console.log( i );
						//console.log( t2s.hasOwnProperty(i) );
						//console.log( t2.inner(t2s[i]) );
						if( t2s.indexOf(t1s[i])===-1 ||
							!equalsTo( t1.inner(t1s[i]), m1, t2.inner(t1s[i]), m2 ) )
							return false;
					}
					return true;
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
				case types.PrimitiveType:
					return t1.name() === t2.name();
				case types.AlternativeType:
				case types.StarType:{
					var i1s = t1.inner();
					var i2s = t2.inner();
					
					if( i1s.length !== i2s.length )
						return false;
					// any order should do
					var tmp_i2s = i2s.slice(0); // copies array
					for(var i=0;i<i1s.length;++i){
						var curr = i1s[i];
						var found = false;
						// tries to find matching element
						for(var j=0;j<tmp_i2s.length;++j){
							var tmp = tmp_i2s[j];
							if( equalsTo(curr,m1,tmp,m2) ){
								tmp_i2s.splice(j,1); // removes element
								found = true;
								break; // continue to next
							}
						}
						// if not found, then must be different
						if( !found ){
							return false;
						}
					}
					return true;
				}
				case types.DelayedApp:{
					return equalsTo( t1.inner(), m1, t2.inner(), m2 ) &&
						equalsTo( t1.id(), m1, t2.id(), m2 ) ;
				}
				default:
					assert( false, "Assertion error on " +t2.type() );
					break;
				}
		}

//console.log( a +' \n\tVS ' +b );
		return equalsTo( a, new Environment(null), b, new Environment(null) );
	};
	
	/**
	 * Subtyping two types.
	 * @param {Type} t1
	 * @param {Type} t2
	 * @return {Boolean} true if t1 <: t2 (if t1 can be used as t2).
	 */
	var subtypeOf = function( t1 , t2 ){
		//console.log( ' ==== ' );
		
		// same as equals
		var visited = [];
		var seen = function(a,b){
			for(var i=0;i<visited.length;++i){
				if( visited[i][0] === a && visited[i][1] === b )
					return true;
			}
			return false;
		}
		var push = function(a,b){
			visited.push( [a,b] );
		}
	
		var subtype = function( t1, m1, t2, m2 ){
	
					//console.log(t1 +' <: '+t2 );
	
			if( t1 === t2 ) // if exactly the same thing
				return true;
				
			if( seen( t1, t2 ) )
				return true;
			
			// recursive types must be handled before hand
			// handle asymmetric comparision of recursive types
			var rec1 = t1.type() === types.RecursiveType;
			var rec2 = t2.type() === types.RecursiveType;
			if( rec1 ^ rec2 ){
				
				push( t1, t2 ); // assume they are the same
				// if this is wrong, then it must be cause their internals
				// are different. Therefore, it will fail elsewhere and it is
				// OK to assume they are equal in here.

				if( rec1 ){
					m1 = m1.newScope();
					m1.set( t1.id().name(), t1 );
					t1 = t1.inner();
				}
				if( rec2 ){
					m2 = m2.newScope();
					m2.set( t2.id().name(), t2 );
					t2 = t2.inner();
				}
				
				return subtype( t1, m1, t2, m2 );
			}
			
			var var1 = t1.type() === types.TypeVariable;
			var var2 = t2.type() === types.TypeVariable;
			if( var1 ^ var2 ){
				
				// in here?? the next line makes no sense...
				//push( t1, t2 ); // assume they are the same

				if( var1 ){
					t1 = m1.get( t1.name() );
					// some problem on getting the variable's definition
					// assume it is not equal.
					if( t1 === undefined )
						return false;
				}
				if( var2 ){
					t2 = m2.get( t2.name() );
					if( t2 === undefined )
						return false;
				}
				
				return subtype( t1, m1, t2, m2 );
			}
			// ----
	
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
			if( t1.type() !== t2.type() )
				return false;
			
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
				case types.RelyType: {
					return subtype( t1.rely(), m1, t2.rely(), m2 ) &&
						subtype( t1.guarantee(), m1, t2.guarantee(), m2 );
				}
				case types.GuaranteeType: {
					return subtype( t1.guarantee(), m1, t2.guarantee(), m2 ) &&
						subtype( t1.rely(), m1, t2.rely(), m2 );
				}
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
				case types.TupleType: {
					var t1s = t1.getValues();
					var t2s = t2.getValues();
					if( t1s.length !== t2s.length )
						return false;
					for( var i=0;i<t1s.length;++i )
						if( !subtype( t1s[i], m1, t2s[i], m2 ) )
							return false;
					return true;
				}
				case types.StackedType:
					return subtype( t1.left(), m1, t2.left(), m2 ) &&
						subtype( t1.right(), m1, t2.right(), m2 );
				case types.AlternativeType:
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
				case types.CapabilityType:
					return subtype( t1.location(), m1, t2.location(), m2 ) &&
						subtype( t1.value(), m1, t2.value(), m2 );
				
				case types.RecursiveType:
				case types.ForallType:		
				case types.ExistsType:{
					// uses environment to know the relation between the two names
					// instead of having to renamed the type to ensure matching
					// labels on their inner types.
					var n1 = m1.newScope();
					var n2 = m2.newScope();
					n1.set( t1.id().name(), t1 );
					n2.set( t2.id().name(), t2 );
					
					push( t1.id(), t2.id() ); // assume they are subtypes

					return subtype( t1.inner(), n1, t2.inner(), n2 );
				}

				case types.TypeVariable:
				case types.LocationVariable: {
					var a1 = m1.get( t1.name() );
					var a2 = m2.get( t2.name() );
					
					// note it also returns 'undefined' when name not bound
					// thus, if the variable is unknown (i.e. declared in the
					// context and not in the type) we can only compare its name
					if( a1 === undefined && a2 === undefined )
						return t1.name() === t2.name();
					
					assert( a1 !== undefined && a2 !== undefined,
						'Program error '+t1+' '+t2+' '+a1+' '+a2 );
					
					return subtype( a1, m1, a2, m2 );	
				}
				case types.DelayedApp: {
					return subtype( t1.inner(), m1, t2.inner(), m2 ) &&
						subtype( t1.id(), m1, t2.id(), m2 ) ;
				}
				default:
					assert( false, 'Assertion Error Subtype '+t1.type() );
			}
			
		};
		return subtype( t1, new Environment(null),
						t2, new Environment(null)  );
	}
	
	//
	// TYPING ENVIRONMENT
	//
	
	// The typing environment is a spaghetti stack where the parent
	// may be shared among several different typing environments.
	// All methods return:
	// 	undefined - new element collides with a previously existing one;
	//  null/value - if all OK.
	var Environment = function(parent){
		
		// scope methods		
		this.newScope = function(){ return new Environment(this); }
		this.endScope = function(){ return parent; }

		// CAREFUL: '$' cannot be a source-level identifier
		var TYPE_INDEX='$';
		var map = {};
		var caps = [];
		
		// operations over IDENTIFIERS
		this.set = function(id,value){
			if ( map.hasOwnProperty(id) )
				return undefined; // already exists
			map[id] = value;
			return null; // ok
		}
		this.get = function(id){
			if ( map.hasOwnProperty(id) )
				return map[id];
			if( parent === null )
				return undefined;
			return parent.get(id);
		}
		this.remove = function(id){
			if( map.hasOwnProperty(id) ){
				var tmp = map[id];
				 // ensures that it is no longer listed
				delete map[id];
				return tmp;
			}
			if( parent === null )
				return undefined; // not found
			return parent.remove(id);
		}
		
		// operations over VARIABLES
		// (includes both TypeVariables and LocationVariables)
		this.setType = function(id,value){
			// type variables cannot be hidden, must be unique
			// otherwise it would either require renaming collisions
			// or could allow access to parts that collide. 
			if( this.getType(id) !== undefined )
				return undefined; // already there
			return this.set(TYPE_INDEX+id,value);
		}
		this.getType = function(id){
			return this.get(TYPE_INDEX+id);
		}
		
		// other...
		this.size = function(){
			return Object.keys(map).length+
					caps.length+
				( parent === null ? 0 : parent.size() );
		}
		
		this.clone = function(){
			var env = parent !== null ?
				new Environment( parent.clone() ) :
				new Environment( null );

			for( var i in map ){
				// assuming it is OK to alias content (i.e. immutable stuff)
				env.set( i, map[i] );	
			}
			for( var i=0; i<caps.length;++i ){
				env.setCap( null, caps[i] ); // null is a trick for no id
			}
			return env;
		}
		
		// FIXME this does not preserve spaghetti structure!
		// this should not be visible outside the environment object
		/*
		this.__allElements__ = function(){
			var keys = Object.keys(map);
			if( parent !== null )
				keys = keys.concat( parent.__allElements__() );
			return keys;
		} */
		this.__caps__ = caps;
		this.__parent__ = parent;
		
		var comps = function(a,b,merge_caps){
			// compare nulls due to parents
			if( a === null && b === null )
				return true;
			if( a === null ^ b === null )
				return false;
			if( a.size() !== b.size() )
				return false;
			// 1st: just check above, never merging
			if( !comps(a.__parent__,b.__parent__,false) )
				return false
			
			// 2nd: check keys
			var a_map = a.__map__;
			var b_map = b.__map__;
			for( var id in a_map ){
				if( !b_map.hasOwnProperty(id) )
					return false;

				if( !equals( a_map[id], b_map[id] ) )
					return false;
			}
			
			var a_caps = a.__caps__;
			var b_caps = b.__caps__;
			
			// 3rd: merge caps
			if( merge_caps ){
				// this will merge b with a's caps
				// TODO
				
				// find those that are common
				var diff_a = [];
				var diff_b = [];
				var common = [];
				var seen = [];
				
				for( var i=0;i<a_caps.length;++i){
					var found = false;
					for( var j=0;j<b_caps.length;++j ){
						if( equals( a_caps[i], b_caps[j] ) && 
							seen.indexOf(j) === -1 ){
							found = true;
							seen.push(j);
							common.push( a_caps[i] );
							break;
						}
					}
					if( !found ){
						diff_a.push( a_caps[i] );
					}
				}
				for( var i=0;i<b_caps.length;++i ){
					if( seen.indexOf(i) === -1 ){
						diff_b.push(b_caps[i]);
					}
				}
				// empty the array
			var  s=a_caps.length;
			while( s-- > 0 ){
				a_caps.pop();
			}				
			s = common.length;
			while( s-- > 0 ){
				a_caps.push( common[s] );
			}

				if( diff_a.length > 0 || diff_b.length > 0 ){
					// if there is a difference in the two environments
					var at = NoneType;
					if( diff_a.length > 0 ){
						if( diff_a.length > 1 ){
							at = new StarType();
							for( var i = 0 ; i < diff_a.length; ++i ){
								at.add( diff_a[i] );
							}
						}else{
							at = diff_a[0];
						}
					}
					var bt = NoneType;
					if( diff_b.length > 0 ){
						if( diff_b.length > 1 ){
							bt = new StarType();
							for( var i = 0 ; i < diff_b.length; ++i ){
								bt.add( diff_b[i] );
							}
						}else{
							bt = diff_b[0];
						}
					}
					var alter = new AlternativeType();
					alter.add( at );
					alter.add( bt );
					a_caps.push( alter );
				}
				return true;
				
			} else { // just check if equal
				if( a_caps.length !== b_caps.length )
					return false;
				
				// may be with any order
				var seen = [];
				for( var i=0;i<a_caps.length;++i){
					var found = false;
					for( var j=0;j<b_caps.length;++j ){
						if( equals( a_caps[i], b_caps[j] ) && 
							seen.indexOf(j) === -1 ){
							seen.push(j);
							found = true;
							break;
						}
					}
					if( !found )
						return false;
				}
				return true;
			}
		}
		
		this.isEqual = function(other){
			return comps(this,other,true);
		}
		
		// no order is guaranteed!
		this.visit = function(all,f){
			for( var i in map ){
				var isType = (i[0] === TYPE_INDEX);
				f(i,map[i],false,isType);
			}
			for( var i=0; i<caps.length;++i ){
				f(null,caps[i],true,false);
			}
			if( all && parent !== null )
				parent.visit(all,f);
		}
				
		// CAUTION: the following functions/methods ASSUME there is a separation
		// in the domain of LocationVariables and TypeVariables so that just
		// comparing strings is enough to know if some string is equal to some
		// Loc/TypeVariable without needing to compare the types, just strings.
		/**
		 * @param {Type} val
		 * @param {String} id
		 * @return if there is a type/loc variable with name 'id' in type 'val'
		 */
		var capContains = function(id,val){
			switch( val.type() ){
				case types.CapabilityType:
					return val.location().name() === id;
				case types.TypeVariable:
					return val.name() === id;
				// cap may be anywhere, linear search
				case types.StarType:
				case types.AlternativeType:{
					var ins = val.inner();
					for(var i=0;i<ins.length;++i){
						if( capContains(id,ins[i]) )
							return true;
					}
					return false;
				}
				case types.RelyType:{
					return val.rely().location().name() === id;
					// FIXME not clean!
				}
				default:
					// another types disallowed, for now
					assert(false,'Error @capContains: '+val);
			}
		}
		this.__searchCap__ = function(id){
			for(var i=0;i<caps.length;++i){
				if( capContains(id,caps[i]) )
					return i;
			}
			return -1;
		}
		
		// TODO: is this 'id' relevant? is collision detection important?
		this.setCap = function(id,value){
			if( this.__searchCap__(id) !== -1 )
				return undefined; // already there
			caps.push(value); // add new capability
			return null;
		}
		this.removeCap = function(id){
			var i = this.__searchCap__(id);
			if( i !== -1 ){
				// removes and returns element
				return caps.splice(i,1)[0]; 
			}
			if( parent === null )
				return undefined; // not found
			return parent.removeCap(id);
		}
		
		this.checkCap = function(id){
			var i = this.__searchCap__(id);
			if( i !== -1 ){
				// removes and returns element
				return caps[i]; 
			}
			if( parent === null )
				return undefined; // not found
			return parent.checkCap(id);
		}

	};
	
	// TypeVariables must be upper cased.
	var isTypeVariableName = function(n){
		return n[0] === n[0].toUpperCase();
	}
	
	//
	// TYPE CHECKER
	//
		
	var findBranch = function(tag,ast){
		for( var i=0; i<ast.branches.length; ++i ){
			if( ast.branches[i].tag === tag )
				return ast.branches[i];
		}
		return undefined;
	}
	
	/**
	 * Attempts to merge the two types given as argument.
	 * @return undefined if they cannot be merged, or the type that is
	 * 	compatible with both.
	 */
	var mergeType = function(t1,t2){
		if( subtypeOf(t1,t2) )
			return t2;
		if( subtypeOf(t2,t1) )
			return t1;

		// if bang mismatch, we need to not consider the sum as banged because
		// our types cannot do a case on whether the type is liner or pure
		var b1 = t1.type() === types.BangType;
		var b2 = t2.type() === types.BangType;
		
		if( b1 ^ b2 ){
			if( b1 ) t1 = t1.inner();
			if( b2 ) t2 = t2.inner();
		}
		
		var s1 = t1.type() === types.StackedType;
		var s2 = t2.type() === types.StackedType;
		
		if( s1 ^ s2 ){
			if( !s1 ) t1 = new StackedType(t1,NoneType);
			if( !s2 ) t2 = new StackedType(t2,NoneType);
		}
		
		if( t1.type() !== t2.type () )
			return undefined;
		// both the same type
		
		if( t1.type() === types.StackedType ){
			var left = mergeType( t1.left(), t2.left() );
			if( left === undefined )
				return undefined;
			var right = mergeType( t1.right(), t2.right() );
			if( right === undefined ){
				// if they cannot be merged, then they are alternatives
				// TODO: maybe partially merge is possible?
				right = new AlternativeType();
				right.add( t1.right() );
				right.add( t2.right() );
			}
			return new StackedType(left,right);
		}
		
		if( t1.type() === types.BangType ){
			var tmp = mergeType( t1.inner(),t2.inner() );
			if( tmp !== undefined )
				return new BangType( tmp );
		}
		
		if( t1.type() === types.SumType ){
			// merge both types
			var tmp = new SumType();
			// add all the labels to the temporary sum
			var tags = t1.tags();
			for( var i in tags ){
				tmp.add( tags[i], t1.inner(tags[i] ) )
			}
			// now check the other to make sure any overlapping is ok or add
			// anything extra that it may have
			tags = t2.tags();
			for( var i in tags ){
				var overlap = tmp.inner(tags[i]);
				if( overlap !== undefined ){
					// make sure they match
					if( !equals( overlap, t2.inner(tags[i]) ))
						return undefined;
				}
				else{
					// make sure it was added.
					if( tmp.add( tags[i], t2.inner(tags[i] ) ) === undefined )
						return undefined;
				}
			}
			return tmp;
		}
		
		// all other cases must have exactly the same type
		if( equals(t1,t2) )
			return t1;
		// FIXME should subtyping replace equals? i.e.:
		// if( subtypeOf(t1,t2) ) return t2;
		// if( subtypeOf(t2,t1) ) return t1;
			
		return undefined;
	}

	// removes all BangTypes
	var unBang = function(t){
		// by subtyping rule: !A <: A
		while( t.type() === types.BangType )
			t = t.inner();
		return t;
	}
	
	var unAll = function(tt,ast){
		// the following are safeguards to bound execution
		var see = [];
		var visited = 0;
		
		var t = tt;
		while( true ) {
			// by subtyping rule: !A <: A
			if( t.type() === types.BangType ){
				t = t.inner();
				continue;
			}
			// by unfold: rec X.A <: A[rec X.A/X]
			if( t.type() === types.RecursiveType ){
				// these are not exactly perfect but two simple ways to check
				// if we may be unfolding an unending recursive type
				// counting is the easiest, the second is the most likely to
				// catch such pointless loops earlier.
				assert( (++visited) < 100 , 'Failed to unfold: '+tt +', max unfolds reached', ast);
				assert( see.indexOf( t ) === -1, 'Fix-point reached after '+visited+' unfolds' , ast);
				see.push( t );

				// unfold
				t = substitution(t.inner(),t.id(),t);
				continue;
			}
			
			if( t.type() === types.DelayedApp ){
				if( t.inner().type() === types.RecursiveType && 
					t.inner().inner().type() === types.ForallType ){
					var v = t.id();
					var rec = t.inner();
					
					// expand inner recursion
					t = substitution(rec.inner(),rec.id(),rec);
					// do type application
					t = substitution(t.inner(),t.id(),v);
					continue;
				}
				
			}
			
			break;
		}
		return t;
	}
	
	var unFold = function(tt,ast){
		// the following are safeguards to bound execution
		var see = [];
		var visited = 0;
		
		var t = tt;
		while( true ) {

			if( t.type() === types.DelayedApp ){
				var inner = t.inner();
				if( inner.type() === types.RecursiveType )
					inner = unFold(inner,ast);
				// intentionally leave for next if case
				if( inner.type() === types.ForallType )
					return substitution( inner.inner(), inner.id(), t.id() );
					
				assert( false, 'Cannot delay application any further', ast);
			}
			// by unfold: rec X.A <: A[rec X.A/X]
			if( t.type() === types.RecursiveType ){
				// these are not exactly perfect but two simple ways to check
				// if we may be unfolding an unending recursive type
				// counting is the easiest, the second is the most likely to
				// catch such pointless loops earlier.
				assert( (++visited) < 100 , 'Failed to unfold: '+tt +', max unfolds reached');
				assert( see.indexOf( t ) === -1, 'Fix-point reached after '+visited+' unfolds' , ast);
				see.push( t );

				// unfold
				t = substitution(t.inner(),t.id(),t);
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
	
	/**
	 * unstacks 'type' into the environment 'd'.
	 * @param type - the type with stacked stuff
	 * @param d - the typing environment that is to be extended
	 * @param ast - just for errors
	 * @return {Type} with the resulting type.
	 */
	var unstack = function( type, d, ast ){
		if( type.type() === types.StackedType ){
			// all types are on the right, recursion is on left
			unstackType( type.right(), d, ast );
			
			return unstack( type.left(), d, ast );
		}
		
		return type;
	}
	
	var unstackType = function(t, d, ast){
		switch( t.type() ){
		case types.CapabilityType:
			var loc = t.location().name(); 
			assert( d.setCap( loc, t ) ,
				'Duplicated capability for '+ loc, ast );
			break;
		case types.TypeVariable:
			var nam = t.name(); 
			assert( d.setCap( nam , t ) ,
			 'Duplicated capability for '+ nam, ast );
			break;
		case types.StarType:{
			var tps = t.inner();
			for( var i=0; i<tps.length; ++i ){
				unstackType(tps[i], d, ast);
			}
			break;
		}
		case types.NoneType:
			break; // nothing to do
		case types.AlternativeType:
		case types.RelyType:
			assert( d.setCap( null , t ) ,
			 'Duplicated capability '+ t, ast );
			break;
		default: 
			assert( false, 'Cannot unstack: '+t+' of '+t.type(), ast);
		}
	}
	
	/** Attempts to expand a type 't' so as to match type 'p'
	 * complete type. This may fail in certain cases to simplify
	 * but otherwise it will be almost like "auto-stacking" without
	 * having to explicitly state what needs to be pushed.
	 * @param {Type,Null} t - type that is to be expanded, null if
	 * 	nothing is there.
	 * @param {Type} p - type that is the target to match to
	 * @return {Type} that tries to add the missing bits to 'm' as
	 * 	much as possible.
	 */
	var autoStack = function(t,p,e,a){
		switch( p.type() ) {
			case types.StarType: {
				if( t !== null && t.type() === types.StarType ){
					// if the type is already a star type, we 
					// assume that it has all types there and do not
					// auto-stack anything since otherwise we would
					// need to compare and see what is missing, etc.
					return t;
				}
				else {
					// any other type should be ignored, but this
					// assert ensures nothing is silently dropped.
					assert( t === null, 'Error @autoStack ', a );
					
					var inners = p.inner();
					var tmp = new StarType();
					for(var i=0;i<inners.length;++i){
						tmp.add( autoStack(null, inners[i],e,a) );
					}
					return tmp;
				}
			}
			case types.StackedType: {
				if( t !== null && t.type() === types.StackedType ){
					return new StackedType(
						autoStack( t.left(), p.left(), e, a ),
						autoStack( t.right(), p.right(), e, a ) 
					);
				}
				else{
					// any non-stacked type is assume to be the left
					// part of the soon to be stacked type
					return new StackedType(
						autoStack( t, p.left(), e, a ),
						autoStack( null, p.right(), e, a ) 
					);
				}
			}
			case types.CapabilityType: {
				// note that the capability can either be already
				// (manually) stacked or needs to be automatically
				// stacked.
				var cap_loc = p.location().name();
				if( t !== null && t.type() === types.CapabilityType ){
					// if it was manually stacked, then just make
					// sure they are the same thing.
					var t_loc = t.location().name();
					assert( t_loc === cap_loc,
						'Incompatible capability '+
						t_loc+' vs '+cap_loc, a );
					return t;
				} else {
					assert( t === null, 'Error @autoStack ', a );
					var cap = assert( e.removeCap( cap_loc ),
						'Missing capability '+cap_loc, a );
					return cap;
				}
			}
			case types.TypeVariable: {
				// analogous case to capabilities, either manually
				// stacked or we need to do it here.
				var p_loc = p.name();
				if( t !== null && t.type() === types.TypeVariable ){
					var t_loc = t.name();
					assert( t_loc === p_loc,
						'Incompatible variable '+t_loc+' vs '+p_loc, a );
					return t;
				} else {
					assert( t===null, 'Error @autoStack ', a );
					// note that, by its name, it must be a TypeVariable
					var cap = assert( e.removeCap( p_loc ),
						'Missing capability '+p_loc, a );
					return cap;
				}
			}
			case types.AlternativeType:{
				assert( t == null , 'Error @autoStack ', a);
				var alts = p.inner();
				for( var i=0; i<alts.length; ++i ){
					var j = alts[i];
					switch( j.type() ){
						case types.CapabilityType:{
							var cap = e.checkCap( j.location().name() );
							// one of the alternatives is valid
//console.debug( cap + ' <: ' + j );
//console.debug( subtypeOf( cap, j ) );
							if( cap !== undefined && subtypeOf( cap, j ) ){
								e.removeCap( j.location().name() );
								return p;
							}
							break;
						}
						case types.TypeVariable: {
							if( e.removeCap( j.name() ) !== undefined )
								return p;
							break;
						}
						default:
							assert( false, 'Error @autoStack '+j.type(), a );
					}
				}
				// we must have one of the alternatives in order to stack (+)
				assert( false, 'Failed to stack any of the alternatives', a);
			}
			case types.NoneType:
				// always valid to stack a NoneType
				assert( t === null || t.type() === types.NoneType,
					'Error @autoStack ', a );
				return NoneType;
			default: // other types just fall through, 
					 // leave the given type in.
		}
		return t;
	}
	
	/**
	 * To properly end a scope we use the following idiom: stack all
	 * outstanding capabilities (of the delta environment) on top of the result
	 * 'type' and then pack all bounded type/location variables of the result
	 * @param ast - just for error flagging
	 * @param type - the final result type (should this not be needed?)
	 * @param env - the current scope to end, not that it remains unchanged
	 * @return the type with potentially stacked stuff. 
	 * 
	 * CAREFUL: this may conservatively packs stuff that could be free if it
	 * 	were packed manually! (i.e. there may be a less conservative packing
	 * 	order than the one picked by this function)
	 */
	var safelyEndScope = function( type, env, ast ){
		// 1. stack all capabilities
		var tmp = new StarType();

		env.visit(false, //only the elements at this level
			function(id,cap,isCap,isType){
			// ok to ignore type and location variable declarations
			if( isType )
				return;
			
			if( isCap ){
				tmp.add( cap );
				return;
			}
			
			switch( cap.type() ){
				// these can be ignored
				case types.BangType:
				case types.PrimitiveType:
					break;
				default:
					// fails if attempting to stack something else
					assert( false, 'Auto-stack failure, '+
						id+' : '+cap.type(), ast );
			}

		});
		
		var res = type;
		// if there's something to stack
		var ll = tmp.inner().length;
		if( ll > 0 ){
			if( ll === 1 ) // no need for star when there is just one
				res = new StackedType( res, tmp.inner()[0] );
			else
				res = new StackedType( res, tmp );
		}

		// 2. pack all bounded location variables
		env.visit(false,
			function(e,el,isCap,isType){
			// ignores all elements that are not type/location variables
			if( !isType )
				return;

			switch( el.type() ){
				case types.LocationVariable:
					if( !isFree(res,el) ){
						var loc = new LocationVariable(null);
						res = new ExistsType( loc, substitution( res, el, loc ) );
					}
					break;
				case types.TypeVariable:
					if( !isFree(res,el) ){
						var loc = new TypeVariable(null);
						res = new ExistsType( loc, substitution( res, el, loc ) );
					}
					break;
				default:
					// fails if attempting to stack something else
					assert( false, 'Auto-stack failure, '+e+' : '+el.type(), ast );
			}
		});
		return res;	
	}

	// this wrapper function allows us to inspect the type and envs
	// of some node, while leaving the checker mostly clean.
	var check = function(ast,env) {
		type_info.push( { ast : ast, env : env.clone() } );
		
		return check_inner( ast, env );
	};

	/**
	 * @param {AST} ast, tree to check
	 * @param {Environment} env, typing environment at beginning
	 * @return either the type checked for 'ast' or throws a type error with
	 * 	what failed to type check.
	 */
	var check_inner = function( ast, env ) {
		
		switch(ast.kind) {
			
			// EXPRESSIONS
			case AST.kinds.LET: {
				var value = check( ast.val, env );

				var e = env.newScope();
				// note that it should unstack to the local scope, so as to 
				// leave the enclosing environment unchanged
				value = unstack( value, e, ast );				
				// attempt to make resulting type a bang type
				value = purify(value);
				
				// sequence is encoded as LET with id 'null', but this construct
				// drops the first expression's value so it must be of BangType
				assert( ast.id !== null || value.type() === types.BangType,
					'Cannot drop linear type', ast );
				
				if( ast.id !== null ){
					// creating a new environment should avoid this error, but
					// include this check for consistency
					assert( e.set( ast.id, value ),
						'Identifier '+ ast.id +' already in scope', ast );
				}

				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast.exp );
			}
			
			case AST.kinds.LET_TUPLE: {
				var exp = check( ast.val, env );
				exp = unAll(exp, ast.val);
				assert( exp.type() === types.TupleType,
					"Type '" + exp + "' not tuple", ast.exp);
				
				var values = exp.getValues();
				assert( values.length === ast.ids.length,
					"Incompatible sizes "+ast.ids.length+" != "+values.length, ast.exp);

				var e = env.newScope();
				for( var i=0; i<ast.ids.length ; ++i ){
					assert( e.set( ast.ids[i], values[i] ),
						"Identifier '" + ast.ids[i] + "' already in scope", ast );
				}
				
				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast );
			}
			
			case AST.kinds.OPEN: {
				var value = check( ast.val, env );
				value = unAll( value, ast.val );
				
				assert( value.type() === types.ExistsType,
					"Type '" + value + "' not existential", ast.exp);

				var loc = ast.type;
				var locvar;
				if( isTypeVariableName(loc) )
					locvar = new TypeVariable(loc);
				else
					locvar = new LocationVariable(loc);

				assert( locvar.type() === value.id().type(),
					'Variable mismatch, expecting '+locvar.type()
					+' got '+value.id().type(), ast.val);

				value = substitution( value.inner(), value.id(), locvar );
				// unfold anything that became newly available
				value = unFold( value, ast );
				
				// any unstack occurs in the inner expression
				var e = env.newScope();
				value = unstack( value, e, ast);
				// attempt to make it pure before adding to typing env.
				value = purify( value );

				assert( e.set( ast.id, value ),
						"Identifier '" + ast.id + "' already in scope", ast );
				assert( e.setType( loc, locvar ),
						"Type '" + loc + "' already in scope", ast );
				
				var res = check( ast.exp, e );
				return safelyEndScope( res, e, ast);
			}
			
			case AST.kinds.CASE: {
				var val = unAll( check( ast.exp, env ), ast.exp );
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
					value = purify( unstack( value, e, branch.exp ) );

					assert( e.set( branch.id, value ),
						"Identifier '" + branch.id + "' already in scope", ast );
					
					var res = check( branch.exp, e );
					res = safelyEndScope( res, e, ast.exp );
					
					// check if effects are compatible
					if( endEnv === null ){
						endEnv = e.endScope();
					}else{
						assert( endEnv.isEqual( e.endScope() ),
							"Incompatible effects on branch '" + tag + "'", branch);
					}

					// if first result, remember it
					if( result === undefined )
						result = res;
					else { // else try to merge both
						var tmp = mergeType( result, res );
						assert( tmp, 'Incompatible branch results: '+
							result+' vs '+res, ast);
						result = tmp;
					}
				}
				return result;
			}
			
			case AST.kinds.PACK: {
				var exp = check(ast.exp, env);
				var packed = check(ast.id, env);

//console.debug( exp +' \n\t<< '+ packed );

				// CAREFUL 'ast.label' is left as null when unspecified which is
				// used on the constructors below to pick a fresh name.
				var label = ast.label;
				var variable;
				
				switch( packed.type() ){
					case types.TypeVariable:
					case types.LocationVariable: {
						// create the new type/location variable with the 
						// given label, even if null for fresh.
						if( isTypeVariableName(packed.name()) ){
							assert( label === null || isTypeVariableName(label),
								'TypeVariable is wrongly cased', ast );
							variable = new TypeVariable(label);
						} else {
							assert( label === null || !isTypeVariableName(label),
								'LocationVariable is wrongly cased', ast );
							variable = new LocationVariable(label);
						}
						
						break;
					}
					default: {
						assert( label === null || isTypeVariableName(label),
							'TypeVariables must be upper-cased', ast );
							
						variable = new TypeVariable(label);
						break;
					}
				}
				
				// This is necessary to avoid capture of the old
				// location/type variables that may occur in exp
				// We cannot ensure capture avoidance because the label
				// may be given, thus committing ourselves to some label
				// from which we may not be able to move without 
				// breaking programmer's expectations.
				assert( isFree(exp,variable),
					'Label "'+variable.name()+'" is not free in '+exp, ast );

				exp = substitution( exp , packed, variable );
				return new ExistsType(variable,exp);
			}
			
			case AST.kinds.ALTERNATIVE_OPEN: {
				var type = check(ast.type, env);
				assert( type.type() === types.LocationVariable ||
						type.type() === types.TypeVariable,
					'Cannot alt-open '+type,ast.type );
				
				var cap = env.removeCap( type.name() );
				
				assert( cap,
					'Missing cap: '+cap, ast.type );
					
				assert( cap.type() === types.AlternativeType,
					'Not AlternativeType '+cap, ast.type );
				
				var alts = cap.inner();
				var env_start = env.clone();
				var end_env = null;
				var result = null;
				
				for( var i=0; i<alts.length; ++i ){
					var tmp_env = end_env === null ? env : env_start.clone();
					var alternative = alts[i];
					alternative = unFold(alternative);
					unstackType( alternative, tmp_env, ast.type );

					var res = check( ast.exp, tmp_env );
					if( result === null )
						result = res;
					else {
						// attempt to merge results
						var tmp = mergeType( result, res );
						assert( tmp, 'Incompatible alternative results: '+
							result+' vs '+res, ast);
						result = tmp;
					}
					
					if( end_env === null )
						end_env = tmp_env;
					else{
						assert( end_env.isEqual( tmp_env ),
							"Incompatible effects on alternatives", ast.exp);
					}
				}
				return result;
			}
			
			case AST.kinds.SUM_TYPE: {
				var sum = new SumType();
				for( var i=0; i<ast.sums.length; ++i ){
					var tag = ast.sums[i].tag;
					sum.add( tag, check( ast.sums[i].exp, env ) );
				}
				return sum;
			}
			
			case AST.kinds.ALTERNATIVE_TYPE: {
				var alt = new AlternativeType();
				for( var i=0; i<ast.types.length; ++i ){
					alt.add( check( ast.types[i], env ) );
				}
				return alt;
			}
			case AST.kinds.STAR_TYPE: {
				var star = new StarType();
				for( var i=0; i<ast.types.length; ++i ){
					star.add( check( ast.types[i], env ) );
				}
				return star;
			}
			
			case AST.kinds.NAME_TYPE: {
				// the typing environment remains unchanged because all type
				// definitions and type/location variables should not interfere
				var label = ast.text;
				var tmp = env.getType( label );
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
			
			case AST.kinds.ID: {
				var id = ast.text;
				var val = env.get( id );
			
				assert( val, "Identifier '" + id + "' not found", ast);

				if( val.type() !== types.BangType )
					env.remove( id );

				return val;
			}
			
			case AST.kinds.NEW: {
				var exp = check(ast.exp, env);
				// 'null' used to get a fresh location variable
				var loc = new LocationVariable(null);
				return new ExistsType( loc,
							new StackedType(
								new ReferenceType( loc ),
								new CapabilityType( loc, purify(exp) ) ) );
			}
			
			case AST.kinds.DEREF: {
				var exp = unAll( check( ast.exp, env ), ast.exp );
				
				assert( exp.type() === types.ReferenceType,
					"Invalid dereference '"+exp+"'", ast );

				var loc = exp.location().name();
				var cap = env.removeCap( loc );
				
				assert( cap, "No capability to '"+loc+"'", ast );
				
				assert( cap.type() === types.CapabilityType,
					loc+" is not a capability, "+cap.type(), ast );
				
				var old = cap.value();
				
				var residual;
				// see if read must be destructive (i.e. leave unit)
				if( old.type() === types.BangType )
					residual = old;
				else
					residual = new BangType(new RecordType());
				
				cap = new CapabilityType( cap.location(), residual );
				assert( env.setCap( loc, cap ), 'Failed to re-add cap', ast );
				return old;
			}
			
			case AST.kinds.DELETE: {
				var exp = unAll( check( ast.exp, env ), ast.exp );
				
				if( exp.type() === types.ReferenceType ){
					var loc = exp.location().name();
					var cap = env.removeCap( loc );
					
					assert( cap, "No capability to '"+loc+"'", ast );
					
					assert( cap.type() === types.CapabilityType,
						loc +" is not a capability, "+cap.type(), ast );

					// just return the old contents of 'cap'
					return cap.value();
					
				} else if( exp.type() === types.ExistsType ){
					// Luis' delete rule...
					var inner = exp.inner();
					if( inner.type() === types.StackedType ){
						var ref = unBang( inner.left() );
						var cap = inner.right();
						assert( ref.type() === types.ReferenceType, "Expecting reference '"+exp+"'",ast);
						var loc = ref.location();
						assert( cap.type() === types.CapabilityType, "Expecting capability '"+exp+"'",ast);
						assert( loc.name() === exp.id().name(), "Expecting matching location '"+exp+"'",ast);
						return new ExistsType(exp.id(),cap.value());
					}
					
				} 

				assert( false, "Invalid delete '"+exp+"'",ast);

			}

			case AST.kinds.ASSIGN: {
				var lvalue = unAll( check( ast.lvalue, env ), ast.lvalue );
				var value = check( ast.exp, env );
				
				assert( lvalue.type() === types.ReferenceType,
					"Invalid assign '"+lvalue+"' := '"+value+"'", ast.lvalue);
				
				var loc = lvalue.location().name();
				var cap = env.removeCap( loc );
				
				assert( cap, "Cannot assign, no capability to '"+loc+"'", ast );
				
				assert( cap.type() === types.CapabilityType,
					loc+" is not a capability", ast );
				
				var old = cap.value();
				cap = new CapabilityType( cap.location(), purify(value) );
				env.setCap( loc , cap );
				return old;
			}
			
			case AST.kinds.SELECT: {
				var id = ast.right;
				var rec = unAll( check( ast.left, env ), ast.left );
				
				assert( rec.type() === types.RecordType,
					"Invalid field selection '"+id+"' for '"+rec+"'", ast );

				var res = rec.select(id);				
				assert( res, "Invalid field '" + id + "' for '"+rec+"'", ast );
				return res;
			}
			
			case AST.kinds.CALL: {
				var fun = unAll( check( ast.fun, env ), ast.fun );
				
				assert( fun.type() === types.FunctionType,
					'Type '+fun.toString()+' not a function', ast.fun );

				var arg = check( ast.arg, env );
				var fun_arg = fun.argument();
				
				// attempts to match given argument with expected one
				// this is necessary since parts of the argument may have been
				// manually stacked and other should be implicitly put there.
				arg = autoStack( arg, fun_arg, env, ast.arg );
				
				assert( subtypeOf( arg, fun_arg ),
					"Invalid call: expecting '"+fun_arg+"' got '"+arg+"'", ast.arg );
				
				// auto-unstack return
				return assert( unstack( fun.body(), env, ast ),
					"Unstack error on " + fun.body(), ast.exp );
			}
			
			case AST.kinds.DELAY_TYPE_APP: {
				// a delayed type application is a minor trick to simplify the
				// notation on recursive type definitions so that they can
				// abstract their locations without much trouble.
				var exp = check( ast.exp, env );
				exp = unAll(exp,ast.exp);
				var packed = check(ast.id, env); // the type to apply

				if( exp.type() === types.ForallType ){
					// can be applied immediately
					return substitution( exp.inner(), exp.id(), packed );
				}
				assert( packed.type() === types.TypeVariable ||
					packed.type() === types.LocationVariable, 
					'Expecting variable, got: '+packed, ast.id );

				// application cannot occur right now, but delayed applications
				// are only allowed on (bounded) type variables 
				assert( exp.type() === types.TypeVariable ||
					exp.type() === types.DelayedApp, // for nested delays 
					'Expecting TypeVariable, got: '+exp, ast.exp );
				
				return new DelayedApp(exp,packed);
			}
			
			case AST.kinds.TYPE_APP: {
				var exp = check( ast.exp, env );
				exp = unAll(exp,ast.exp);
				assert( exp.type() === types.ForallType , 
					'Not a Forall '+exp.toString(), ast.exp );
				
				var packed = check(ast.id, env);
				return substitution( exp.inner(), exp.id(), packed );
			}
			
			
			case AST.kinds.TAGGED: {
				var sum = new SumType();
				var tag = ast.tag;
				var exp = check(ast.exp, env);
				sum.add( tag, exp);
				if( exp.type() === types.BangType ){
					sum = new BangType(sum);
				}
				return sum;
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
					if( value.type() !== types.BangType )
						bang = false;
				}
				
				if( bang )
					rec = new BangType(rec);

				return rec;
			}
			
			case AST.kinds.SHARE: {
				//debugger;
				var locs = ast.locs;
				// FIXME assuming just one
				var cap = env.removeCap( locs[0] );
				
				assert( cap, "No capability to '"+locs[0]+"'", ast );
				
				var left = check( ast.a, env );
				var right = check( ast.b, env );
				/* TODO:
				 *  - protocol conformance, go through all possible
				 * interleavings in composed type and ensure all alternatives
				 * are allowed.
				 */
var checkProtocolConformance = function( s, a, b ){
	var visited = [];
	var max_visited = 100;
	
	var contains = function(s,a,b){
		for( var i=0; i<visited.length; ++i ){
			var tmp = visited[i];
			if( equals(s,tmp[0]) && equals(a,tmp[1]) && equals(b,tmp[2]) )
				return true;
		}
		return false;
	}
	
	var sim = function(s,p){
		p = unAll(p); // FIXME this also removes bangs!! unfold recursive type
		
		// first protocol
		if( p.type() === types.NoneType )
			return { s : s , p : p };

		// now state
		if( s.type() === types.AlternativeType ){
			var tmp_s = null;
			var tmp_p = null;
			var alts = s.inner();
			for( var i=0;i<alts.length; ++i ){
				var tmp = sim(alts[i],p);
				if( tmp_s === null ){
					tmp_s = tmp.s;
					tmp_p = tmp.p;
				}else{
					assert( equals( tmp_s, tmp.s ) && equals( tmp_p, tmp.p ),
						'[Protocol Conformance] Alternatives mimatch.\n'+
						'(1)\tstate:\t'+tmp_s+'\n\tstep:\t'+tmp_p+'\n'+
						'(2)\tstate:\t'+tmp.s+'\n\tstep:\t'+tmp.p+'\n', ast );
				}
			}
			return { s : tmp_s , p : tmp_p };
		}
		
		if( p.type() === types.AlternativeType ){
			var alts = p.inner();
			for( var i=0; i<alts.length; ++i ){
				try{
console.debug('attempt:: '+alts[i] +' s::'+s);
					return sim(s,alts[i]);
				}catch(e){
					// assume it is an assertion error, continue to try with
					// some other alternative
					continue;
				}
			}
			assert( false, '[Protocol Conformance] No matching alternative.\n'+
				'state:\t'+s+'\n'+
				'step:\t'+p, ast );
		}
		
		var pp = unAll( p );
		
		assert( pp.type() === types.RelyType,
			'Expecting RelyType, got: '+pp.type()+'\n'+pp, ast);
		
		assert( subtypeOf( s, pp.rely() ),
			'Invalid Step: '+s+' VS '+pp.rely(), ast );
		
		var next = pp.guarantee();
		assert( next.type() === types.GuaranteeType,
			'Expecting GuaranteeType, got: '+next.type(), ast);
		
		return { s : next.guarantee() , p : next.rely() };		
	}
	
	var work = [];
	work.push( [s,a,b] );

	while( work.length > 0 ){
		var state = work.pop();
		var _s = state[0];
		var _a = state[1];
		var _b = state[2];
		
		// already done
		if( contains(_s,_a,_b) )
			continue;
console.debug( 's:: '+_s+' p:: '+_a+' q:: '+_b);

		visited.push( [_s,_a,_b] );
		
		var l = sim(_s,_a);
		work.push( [l.s,l.p,_b] );
			
		var r = sim(_s,_b);
		work.push( [r.s,_a,r.p] );
		
		assert( max_visited-- > 0 ,'ERROR: MAX VISITED', ast);
	}
};
				checkProtocolConformance(cap, left, right);
				
				env.setCap( null, unAll(left) );
				env.setCap( null, unAll(right) );
				// returns unit
				return new BangType(new RecordType());
			} 
			
			case AST.kinds.FOCUS: {
				var locs = ast.locs;
				// locations to search for in the env
				/* TODO:
				 *  - fetch shared type, access rely, frame possible 
				 * interferences behind guarantee. 
				 */
				assert(false,'NOT DONE',ast); // FIXME
			} 
			
			case AST.kinds.DEFOCUS: {
				// no inner expression
				/* TODO:
				 *  - unframe accessible guarantee. 
				 */
				assert(false,'NOT DONE',ast); // FIXME
			} 
			
			// TYPES
			case AST.kinds.RELY_TYPE: {
				var rely = check( ast.left, env );
				var guarantee = check( ast.right, env );
				if( guarantee.type() !== types.GuaranteeType ){
					guarantee = new GuaranteeType( guarantee, NoneType );
				}
				return new RelyType( rely, guarantee );
			}
			
			case AST.kinds.GUARANTEE_TYPE: {
				var guarantee = check( ast.left, env );
				var rely = check( ast.right, env );
				return new GuaranteeType( guarantee, rely );
			}
			
			case AST.kinds.REF_TYPE: {
				var id = ast.text;
				var loc = env.getType( id );
				
				assert( loc !== undefined && loc.type() === types.LocationVariable,
					'Unknow Location Variable '+id, ast );
				
				return new ReferenceType( loc );
			}
			
			case AST.kinds.EXISTS_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				var variable;
				if( isTypeVariableName(id) )
					variable = new TypeVariable(id);
				else
					variable = new LocationVariable(id);
				
				e.setType( id, variable );

				return new ExistsType( variable, check( ast.type, e ) );
			}
			
			case AST.kinds.FORALL_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				var variable;
				if( isTypeVariableName(id) )
					variable = new TypeVariable(id);
				else
					variable = new LocationVariable(id);

				e.setType( id, variable );

				return new ForallType( variable, check( ast.exp, e ) );
			}
			
			case AST.kinds.RECURSIVE_TYPE: {
				var id = ast.id;
				var e = env.newScope();
				
				assert( isTypeVariableName(id),
					'Type Variables must be upper-cased', ast );
					
				var variable = new TypeVariable(id);
				e.setType( id, variable );
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
				var loc = env.getType( id );
				
				assert( loc !== undefined && loc.type() === types.LocationVariable,
					'Unknow Location Variable '+id, ast);

				var type = check( ast.type, env );
				return new CapabilityType( loc, purify(type) );
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
				var c = autoStack ( null, cap, env, ast.type );
				// make sure that the capabilities that were extracted from 
				// the typing environment can be used as the written cap.
				assert( subtypeOf( c , cap ),
					'Incompatible capability "'+c+'" vs "'+cap+'"', ast.type );
				return new StackedType( exp, cap );
			}
			
			case AST.kinds.RECORD_TYPE: {
				var rec = new RecordType();
				for( var i=0; i<ast.exp.length ; ++i ){
					var field = ast.exp[i];
					var id = field.id;
					var value = check( field.exp, env );
					assert( rec.add(id, value),
						"Duplicated field '" + id + "' in '"+rec+"'", field);
				}
				return rec;
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
					if( initial_size === env.size() )
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
							var variable;
							if( isTypeVariableName(id) )
								variable = new TypeVariable(id);
							else
								variable = new LocationVariable(id);

							var e = env.newScope();
							assert( e.setType( id, variable ),
								"Type '" + id + "' already in scope", ast );
			
							return new ForallType( variable, check( ast.exp, e ) );
						}
			
						case AST.kinds.FUN: {
							var id = ast.parms.id;
							var result = null;
							var initial_size = env.size();
							var e = env.newScope();
							var arg_type = check( ast.parms.type, e );
							
							// CAREFUL: only if it is a recursive function
							// can it have a result type attached, otherwise
							// currying of multiple arguments becomes messy
							
							if( ast.rec !== null ){ // recursive function
								result = check( ast.result, e );
								assert( result !== null ,'No result type given on recursive function', ast );								
								// note that all recursive functions must be pure
								var rec_fun = new BangType(
									new FunctionType(arg_type, result)
								);
								assert( e.set( ast.rec, rec_fun ),
									"Identifier '" + ast.rec + "' already in scope", ast );
							}
							
							
							var unstacked = unstack(arg_type,e,ast);
							
							assert( e.set( id, purify(unstacked) ),
									"Identifier '" + id + "' already in scope", ast );

							var res = check( ast.exp, e );
							res = safelyEndScope( res, e, ast.exp );
							
							if( ast.rec !== null ){
								assert( subtypeOf( res, result ),
									"Invalid result type '"+res+"' expecting '"+result+"'", ast);
								// we also need to ensure it is pure so that the
								// previously assumed bang is OK.
								assert( initial_size === env.size(),
									'Linear recursive function.', ast );
								// use the written return type
								res = result;
							}
							
							return new FunctionType(arg_type, res);
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
							return new PrimitiveType('int');
						case AST.kinds.BOOLEAN:
							return new PrimitiveType('boolean');
						case AST.kinds.STRING:
							return new PrimitiveType('string');

						default:
							assert(false,"Error @check " + ast.kind, ast);
				} });
		}

	}
	
	var type_info;
	var unique_counter;
	var typedefs;
	
	exports.check = function(ast,typeinfo,loader){
		// stats gathering
		var start = new Date().getTime();
		type_info = [];
		
		try{
			assert( ast.kind === AST.kinds.PROGRAM, 'Error @check', ast );
				
			// reset typechecke's state.
			unique_counter = 0;
			typedefs = {};
			var env = new Environment(null);
				
			if( ast.imports !== null ){
			 	// loader does not need to be provided, but all imports are errors
				assert( loader !== undefined, 'Error @check missing import loader', ast );
				var libs = ast.imports;
				for( var i=0; i<libs.length; ++i ){
					var lib = libs[i];
					var import_type = loader( lib, exports );
					assert( import_type, "Invalid import: "+lib, ast );
					assert( env.set( lib, import_type ),
						'Identifier '+ lib +' already in scope', ast );
				}
			}
				
			if( ast.typedefs !== null ){
				for(var i=0;i<ast.typedefs.length;++i){
					var type = ast.typedefs[i];
					assert( !typedefs.hasOwnProperty(type.id),
						'Duplicated typedef: '+type.id, type )
					// map of type names to typechecker types.
					typedefs[type.id] = check( type.type, env );
				}
			}
			
			return check( ast.exp, env );
		} finally {
			if( typeinfo ){
				typeinfo.diff = (new Date().getTime())-start;
				typeinfo.info = type_info; 
			}
		}

	};
	return exports;
})(AST,assertF); // required globals

