
/* lexical grammar */
%lex

%%

\s+                   /* skip whitespace */
\/\/.*                /* skip comments */
"let"                 return 'LET'
"open"                return 'OPEN'
"in"                  return 'IN'
"end"                 return 'END'
"new"                 return 'NEW'
"delete"              return 'DELETE'
"fun"                 return 'FUN'
"true"                return 'BOOLEAN'
"false"               return 'BOOLEAN'
"debug"               return 'DEBUG'
"case"                return 'CASE'
"of"                  return 'OF'
"focus"               return 'FOCUS'
"defocus"             return 'DEFOCUS'
"share"               return 'SHARE'
"as"                  return 'AS'
"typedef"             return 'TYPEDEF'
"rec"                 return 'REC'
"none"                return 'NONE'
"(+)"                 return '(+)'
"||"                  return '||'
"|"                   return '|'
"#"                   return '#'
"("                   return '('
")"                   return ')'
"<"                   return '<'
">"                   return '>'
"{"                   return '{'
"}"                   return '}'
"+"                   return '+'
"*"                   return '*'
"."                   return '.'
","                   return ','
";"                   return ';'
":="                  return ':='
"::"                  return '::'
":"                   return ':'
"=>"                  return '=>'
"="                   return '='
"!"                   return '!'
"["                   return '['
"]"                   return ']'
"-o"                  return '-o'
"->"                  return '->'
"rw"                  return 'RW'
"ref"                 return 'REF'
"exists"              return 'EXISTS'
"forall"              return 'FORALL'
[0-9]+                return 'NUMBER'
[a-zA-Z0-9_]+         return 'IDENTIFIER'
\"[^"\r\n]*\"         return 'STRING'
<<EOF>>               return 'EOF'
/lex

%start file

%% /* language grammar */

file : program EOF { return $1; };

// TYPES

type_root :
	  type_fun
	| FORALL IDENTIFIER '.' type_root
		{ $$ = AST.makeForallType($2,$4,@$); }
	| EXISTS IDENTIFIER '.' type_root
		{ $$ = AST.makeExistsType($2,$4,@$); }
	// | REC IDENTIFIER '.' type_root // FIXME
	| type_fun '(+)' type_root
		{ $$ = AST.makeAlternativeType($1,$3,@$); }
	;

type_fun :
	  type_cap
	| type_fun '-o' type_cap
		{ $$ = AST.makeFunType($1,$3,@$); }
	| type_fun '=>' type_cap
		{ $$ = AST.makeRelyType($1,$3,@$); }
	| type_fun ';' type_cap
		{ $$ = AST.makeGuaranteeType($1,$3,@$); }
	| type_fun '[' type_root ']'
		{ $$ = AST.makeTypeApp($1,$3,@$); }
	;

type_cap :
	  type
	| type_cap '::' type
		{ $$ = AST.makeStackedType($1,$3,@$); }
	| type_cap '*' type
		{ $$ = AST.makeStarType($1,$3,@$); }
	| type_cap '+' type
		{ $$ = AST.makeSumType($1,$3,@$); }
	;

type :
	 '!' type
 	  	{ $$ = AST.makeBangType($2,@$); }
	| IDENTIFIER
	 	{ $$ = AST.makeNameType(yytext,@$); }
	| REF IDENTIFIER
	 	{ $$ = AST.makeRefType($2,@$); }
	| '(' type_root ')'
	 	{ $$ = $2; }
	| IDENTIFIER '#' type
	 	{ $$ = AST.makeTaggedType($1,$3,@$); }
	| RW IDENTIFIER type
		{ $$ = AST.makeCapabilityType($2,$3,@$); }
	| NONE
	| '[' ']'
	 	{ $$ = AST.makeRecordType([],@$); }
	| '[' field_types ']'
	 	{ $$ = AST.makeRecordType($2,@$); }
	| '[' type_list ']'
		{ $$ = AST.makeTupleType($2,@$); }
	;

type_list :
	type_root
		{ $$ = [$1]; }
	| type_root ',' type_list
		{ $$ = [$1].concat($3); }
	;

field_type :
	IDENTIFIER ':' type_root
		{ $$ = AST.makeFieldType($1,$3,@$); }
	;
	
field_types :
	  field_type
		{ $$ = [$1]; }
	| field_type ',' field_types
		{ $$ = [$1].concat($3); }
	;

// EXPRESSIONS

program :
	sequence
	| typedef program
		{ $$ = AST.makeTypedefs($1,$2,@$); }
	;

typedef :
	TYPEDEF IDENTIFIER "=" type_root
		{ $$ = AST.makeTypedef($2,$4,@$); }
	;
	
sequence :
	sharing
	| sharing ';' sequence
		{ $$ = AST.makeLet(null,$1,$3,@$); }
	;

sharing :
	nonsequence
	| DEFOCUS
		{ $$ = AST.makeDefocus(@$); }
	| FOCUS ids_list
		{ $$ = AST.makeFocus($2,@$); }
	| SHARE ids_list AS type '||' type
		{ $$ = AST.makeShare($2,$4,$6,@$); }
	;

nonsequence :
	expression
	| DEBUG expression
		{ $$ = AST.makeDebug($2,@$); }
	| nonsequence "." IDENTIFIER
		{ $$ = AST.makeSelect($1,$3,@$); }
	| nonsequence ":=" expression
		{ $$ = AST.makeAssign($1,$3,@$); }
	| nonsequence expression
		{ $$ = AST.makeCall($1,$2,@$); }
	| nonsequence '[' IDENTIFIER ']'
		{ $$ = AST.makeTypeApp($1,$3,@$); }
	| nonsequence '::' type
		{ $$ = AST.makeCapStack($1,$3,@$); }
	;

expression :
	  value
	| "!" expression
		{ $$ = AST.makeDeRef($2,@$); }
	| NEW expression
		{ $$ = AST.makeNew($2,@$); }
	| '<' IDENTIFIER '>' expression
		{ $$ = AST.makeForall($2,$4,@$); }
	| '<' type_root ',' sequence '>'
		{ $$ = AST.makePack($2,null,$4,@$); }
	| '<' type_root ':' IDENTIFIER ',' sequence '>'
		{ $$ = AST.makePack($2,$4,$6,@$); }
	| DELETE expression
		{ $$ = AST.makeDelete($2,@$); }
	| LET IDENTIFIER '=' sequence IN sequence END
		{ $$ = AST.makeLet($2,$4,$6,@$); }
	| LET '[' ids_list ']' '=' sequence IN sequence END
		{ $$ = AST.makeLetTuple($3,$6,$8,@$); }
	| OPEN '<'IDENTIFIER ',' IDENTIFIER'>' '=' sequence IN sequence END
		{ $$ = AST.makeOpen($3,$5,$8,$10,@$); }
	| "(" sequence ")"
		{ $$ = $2; }
	| function
	| IDENTIFIER '#' expression
		{ $$ = AST.makeTagged($1,$3,@$); }
	| CASE expression OF branches END
		{ $$ = AST.makeCase($2,$4,@$); }
    ;

branches :
	  branch
	  	{ $$ = [$1]; }
	| branch '|' branches
		{ $$ = [$1].concat($3); }
	;

branch :
	IDENTIFIER '#' IDENTIFIER '->' sequence
		{ $$ = AST.makeBranch($1,$3,$5,@$); }
	;

function :
	FUN '(' function_body
		{ $$ = $3; }
	| FUN IDENTIFIER '(' function_body
		{ $$ = AST.makeRecursion($2,$4,@$); }
	;

function_body :
	  parameter ')' '.' expression
		{ $$ = AST.makeFun($1,$4,@$); }
	| parameter ',' function_body
		{ $$ = AST.makeFun($1,$3,@$); }
	;
	
parameter : 
	IDENTIFIER  ':' type_root
		{ $$ = AST.makeParameters($1,$3,@$); }
	;

ids_list :
	IDENTIFIER
		{ $$ = [$1]; }
	| IDENTIFIER ',' ids_list
		{ $$ = [$1].concat($3); }
	;

value :
      IDENTIFIER 
      	{ $$ = AST.makeID(yytext,@$); }
    | NUMBER
		{ $$ = AST.makeNumber(yytext,@$); }
    | BOOLEAN
		{ $$ = AST.makeBoolean(yytext,@$); }
    | STRING
		{ $$ = AST.makeString(yytext,@$); }
    | record
 	;
	
record :
	  '{' '}'
	  	{ $$ = AST.makeRecord([],@$); }
	| '{' fields '}'
		{ $$ = AST.makeRecord($2,@$); }
	| '{' values '}'
		{ $$ = AST.makeTuple($2,@$); }
	;

values :
	nonsequence
		{ $$ = [$1]; }
	| nonsequence ',' values
		{ $$ = [$1].concat($3); }
	;
	
field :
	IDENTIFIER '=' nonsequence
		{ $$ = AST.makeField($1,$3,@$); }
	;

fields :
	  field
	  	{ $$ = [$1]; }
	| field ',' fields
		{ $$ = [$1].concat($3); }
	;
