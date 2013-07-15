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


