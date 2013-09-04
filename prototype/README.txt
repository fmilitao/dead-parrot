** PROTOTYPE CODE **

We use node.js ( http://nodejs.org/ ) to run javascript in the console.

To launch a simple local server (so that AJAX calls work), you can just install
node-static ( https://github.com/cloudhead/node-static ):
	npm install -g node-static
	(may need preceding 'sudo') and then running:
	static
	(from the prototype directory)

To generate the (static) grammar javascript file you need to install jison 
( http://zaach.github.com/jison/ ) that can also be done through node.js with
the command:
	npm install jison -g
	(may also need preceding 'sudo')
and then calling jison with our grammar to generate the grammar.js file:	
	jison grammar.jison
Then making sure the .html file includes grammar.js instead of jison.js and this
should be enough to avoid re-generating the grammar each time the prototype is
launched. Although the testing part should still use it... I guess.

// Notes about used libraries and location of plugin files:
// * jison ( http://zaach.github.com/jison/ )
//      The custom rules are in 'grammar.jison' file.
//      Library files were fetched from the project's github repo.
//      NOTE: jison was modified so that errors use 'this.lexer.yylineno' 
//      instead of just 'yylineno' for line number. 
// * ace editor ( http://ace.ajax.org/index.html )
//      Custom highlighter mode is in 'mode-grammar.js'
//      Library files are based on the project's github 'ace-builds' repo
//      (and not the one directly linked from the project's website) and is
//      a copy of the 'src-noconflict' folder.
// [copies of around August 21st, 2012]
