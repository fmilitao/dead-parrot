
// http://qunitjs.com/cookbook/

$.ajaxSetup({ cache: false }); // FIXME debug
	
var fetchCode = function(file) {
	var res = {};
	$.ajax({
		type : 'GET',
		async : false,
		url : file,
		success : function(data) {
			res.data = data;
		}
	});
	
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

var examples_dir = "examples/";
var examples = [];

// synchronous fetch of test list
$.ajax({
		type : 'GET',
		async : false,
		url : "tests-list",
		success : function(data) {
			examples = data.split('\n'); 
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

var interpreter = Interpreter();

module('Interpreter Tests');
	test( "Runs Examples", function() {
		for( var i in examples ){
			var test = fetchCode(examples_dir+examples[i]);
			var ast = parser(test.data);
		  	ok( ast != null , "'"+examples[i]+"' parser check.");
		  	try{
		  		equal( interpreter( ast ).toString(),
					test.i_ok, "'"+examples[i]+"' result check." );
		  	}catch(e){
		  		equal( e.message,
					test.i_fail, "'"+examples[i]+"' error check." );
		  	}
		}
	});
	
var typechecker = TypeChecker();

module('Typechecker Tests');
	test( "Typecheck Examples", function() {
		for( var i in examples ){
			var test = fetchCode(examples_dir+examples[i]);
			var ast = parser(test.data);
		  	ok( ast != null , "'"+examples[i]+"' parser check.");
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



