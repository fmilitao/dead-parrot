
// http://qunitjs.com/cookbook/

$.ajaxSetup({ cache: false }); // FIXME debug

// this cache is different from jQueries since we are just avoiding
// re-fetching the same file multiple times, but on each test we must
// make sure that we are using the most up to date version of that test.
var cache = {};

var fetchCode = function(file) {
	var res = {};
	if( !cache.hasOwnProperty(file) ){
		$.ajax({
			type : 'GET',
			async : false,
			url : file,
			success : function(data) {
				res.data = data;
				cache[file] = data;
			}
		});
	}else{
		res.data = cache[file];
	}
	
	/*
	 * test results, assumed format:
	 * FIRST LINE (interpreter result)
	 * 	//OK VALUE
	 * 	//FAIL ERROR_MESSAGE
	 * SECOND LINE (typechecker result)
	 * 	//OK VALUE
	 * 	//FAIL ERROR_MESSAGE
	 */
	var lines = res.data.split('\n');
	
	// interprester results:
	var i = 0;
	var result_type = lines[i].substr(0,lines[i].indexOf(' '));
	var result = lines[i].substr(lines[i].indexOf(' ')+1);

	res.i_ok = undefined;
	res.i_fail = undefined;
	if( result_type == '//OK')
		res.i_ok = result;
	else if( result_type == '//FAIL')
		res.i_fail = result;
	else
		throw new Error('Unexpected test result: '+result_type+' on '+file);

	// typechecker results:
	i = 1;
	result_type = lines[i].substr(0,lines[i].indexOf(' '));
	result = lines[i].substr(lines[i].indexOf(' ')+1);

	res.t_ok = undefined;
	res.t_fail = undefined;
	if( result_type == '//OK')
		res.t_ok = result;
	else if( result_type == '//FAIL')
		res.t_fail = result;
	else
		throw new Error('Unexpected test result: '+result_type+' on '+file);

	return res;
};

var examples_dir = "examples/tests/";
var examples = [];

// synchronous fetch of test list
$.ajax({
		type : 'GET',
		async : false,
		url : "tests-list",
		success : function(data) {
			examples = data.split('\n');
			var tmp = [];
			for(var i=0;i<examples.length;++i){
				if( examples[i][0] != '#' ) // ignore commented stuff
					tmp.push( examples[i] );
			}
			examples = tmp;
		}
	});

var parser = Parser('code/grammar.jison');

module('Parser');

	test( "Parses Examples", function() {
		for( var i in examples ){
			var test = fetchCode(examples_dir+examples[i]);
			var ast = parser(test.data);
		  	ok( ast != null , "'"+examples[i]+"' parsed.");
		}
	});

var interpreter = Interpreter.run;

module('Interpreter Tests');
	test( "Runs Examples", function() {
		for( var i in examples ){
			var test = fetchCode(examples_dir+examples[i]);
			var ast = parser(test.data);
			if( ast === null ){
				// forced failure due to paserser failur
		  		ok( false , "'"+examples[i]+"' parser failure.");
		  		continue;
		  	}
		  	try{
		  		equal( interpreter( ast ).toString(),
					test.i_ok, "'"+examples[i]+"' result check." );
		  	}catch(e){
		  		equal( e.message,
					test.i_fail, "'"+examples[i]+"' error check." );
		  	}
		}
	});
	
var typechecker = TypeChecker.check;

module('Typechecker Tests');
	test( "Typecheck Examples", function() {
		for( var i in examples ){
			var test = fetchCode(examples_dir+examples[i]);
			var ast = parser(test.data);
		  	if( ast === null ){
				// forced failure due to paserser failur
		  		ok( false , "'"+examples[i]+"' parser failure.");
		  		continue;
		  	}
		  	try{
		  		equal( typechecker( ast , null , null ).toString(),
					test.t_ok, "'"+examples[i]+"' type check." );
		  	}catch(e){
		  		equal( e.message,
					test.t_fail, "'"+examples[i]+"' error check." );
		  	}
		}
	});
	
/*
test( "hello test", function() {
  ok( 1 == "1", "Passed!" );
  equal( 1, 1, 'one equals one');
  //deepEqual( {a:"asd"}, {a:"Asd"});  
});

test( "subtyping", function() {
  ok( 1 == "1", "Passed!" );
  equal( 1, 1, 'one equals one');
  //deepEqual( {a:"asd"}, {a:"Asd"});  
});

//ok( true , "OK!\nAST:\n"+JSON.stringify(ast,undefined,2) );
*/



