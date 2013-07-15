
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
"("                   return '('
")"                   return ')'
"<"                   return '<'
">"                   return '>'
"{"                   return '{'
"}"                   return '}'
"."                   return '.'
","                   return ','
";"                   return ';'
":="                  return ':='
"::"                  return '::'
":"                   return ':'
"="                   return '='
"!"                   return '!'
"["                   return '['
"]"                   return ']'
"-o"                  return '-o'
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
	;

type_fun :
	  type_cap
	| type_fun '-o' type_cap
		{ $$ = AST.makeFunType($1,$3,@$); }
	;

type_cap :
	  type
	| type_cap '::' capability
		{ $$ = AST.makeStackedType($1,$3,@$); }
	;

type :
 	  '!' type
 	  	{ $$ = AST.makeBangType($2,@$); }
	 | IDENTIFIER
	 	{ $$ = AST.makeNameType(yytext,@$); }
	 | REF IDENTIFIER
	 	{ $$ = AST.makeRefType($2,@$); }
	 | '[' ']'
	 	{ $$ = AST.makeUnitType(@$); }
	 | '[' field_types ']'
	 	{ $$ = AST.makeRecordType($2,@$); }
	 | '(' type_root ')'
	 	{ $$ = $2; }
	 ;

capability :
	RW IDENTIFIER type
	{ $$ = AST.makeCapabilityType($2,$3,@$); }
	;

field_type :
	IDENTIFIER ':' type_root
		{ $$ = AST.makeFieldType($1,$3,@$); }
	;
	
field_types :
	field_type
	| field_type ',' field_types
		{ $$ = AST.makeFieldsType($1,$3,@$); }
	;

// EXPRESSIONS

program :
	sequence
	;
	
sequence :
	nonsequence
	| nonsequence ';' sequence
		{ $$ = AST.makeLet(null,$1,$3,@$); }
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
	| nonsequence '::' capability
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
	| '<' IDENTIFIER ',' sequence '>'
		{ $$ = AST.makePack($2,$4,@$); }
	| DELETE expression
		{ $$ = AST.makeDelete($2,@$); }
	| LET IDENTIFIER '=' sequence IN sequence END
		{ $$ = AST.makeLet($2,$4,$6,@$); }
	| OPEN '<'IDENTIFIER ',' IDENTIFIER'>' '=' sequence IN sequence END
		{ $$ = AST.makeOpen($3,$5,$8,$10,@$); }
	| "(" sequence ")"
		{ $$ = $2; }
	| function 
    ;
    
function :
	FUN '(' function_body
		{ $$ = $3; }
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
	  	{ $$ = AST.makeRecord(null,@$); }
	| '{' fields '}'
		{ $$ = AST.makeRecord($2,@$); }
	;
	
field :
	IDENTIFIER '=' nonsequence
		{ $$ = AST.makeField($1,$3,@$); }
	;

fields :
	  field
	| field ',' fields
		{ $$ = AST.makeFields($1,$3,@$); }
	;
