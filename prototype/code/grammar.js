/* Jison generated parser */
var grammar = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"file":3,"program":4,"EOF":5,"type_root":6,"type_fun":7,"FORALL":8,"IDENTIFIER":9,".":10,"EXISTS":11,"type_cap":12,"-o":13,"type":14,"::":15,"capability":16,"!":17,"REF":18,"[":19,"]":20,"field_types":21,"(":22,")":23,"RW":24,"field_type":25,":":26,",":27,"sequence":28,"nonsequence":29,";":30,"expression":31,"DEBUG":32,":=":33,"value":34,"NEW":35,"<":36,">":37,"DELETE":38,"LET":39,"=":40,"IN":41,"END":42,"OPEN":43,"function":44,"FUN":45,"function_body":46,"parameter":47,"NUMBER":48,"BOOLEAN":49,"STRING":50,"record":51,"{":52,"}":53,"fields":54,"field":55,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"FORALL",9:"IDENTIFIER",10:".",11:"EXISTS",13:"-o",15:"::",17:"!",18:"REF",19:"[",20:"]",22:"(",23:")",24:"RW",26:":",27:",",30:";",32:"DEBUG",33:":=",35:"NEW",36:"<",37:">",38:"DELETE",39:"LET",40:"=",41:"IN",42:"END",43:"OPEN",45:"FUN",48:"NUMBER",49:"BOOLEAN",50:"STRING",52:"{",53:"}"},
productions_: [0,[3,2],[6,1],[6,4],[6,4],[7,1],[7,3],[12,1],[12,3],[14,2],[14,1],[14,2],[14,2],[14,3],[14,3],[16,3],[25,3],[21,1],[21,3],[4,1],[28,1],[28,3],[29,1],[29,2],[29,3],[29,3],[29,2],[29,4],[29,3],[31,1],[31,2],[31,2],[31,4],[31,5],[31,2],[31,7],[31,11],[31,3],[31,3],[31,1],[44,3],[46,4],[46,3],[47,3],[34,1],[34,1],[34,1],[34,1],[34,1],[51,2],[51,3],[55,3],[54,1],[54,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1]; 
break;
case 3: this.$ = AST.makeForallType($$[$0-2],$$[$0],this._$); 
break;
case 4: this.$ = AST.makeExistsType($$[$0-2],$$[$0],this._$); 
break;
case 6: this.$ = AST.makeFunType($$[$0-2],$$[$0],this._$); 
break;
case 8: this.$ = AST.makeStackedType($$[$0-2],$$[$0],this._$); 
break;
case 9: this.$ = AST.makeBangType($$[$0],this._$); 
break;
case 10: this.$ = AST.makeNameType(yytext,this._$); 
break;
case 11: this.$ = AST.makeRefType($$[$0],this._$); 
break;
case 12: this.$ = AST.makeUnitType(this._$); 
break;
case 13: this.$ = AST.makeRecordType($$[$0-1],this._$); 
break;
case 14: this.$ = $$[$0-1]; 
break;
case 15: this.$ = AST.makeCapabilityType($$[$0-1],$$[$0],this._$); 
break;
case 16: this.$ = AST.makeFieldType($$[$0-2],$$[$0],this._$); 
break;
case 18: this.$ = AST.makeFieldsType($$[$0-2],$$[$0],this._$); 
break;
case 21: this.$ = AST.makeLet(null,$$[$0-2],$$[$0],this._$); 
break;
case 23: this.$ = AST.makeDebug($$[$0],this._$); 
break;
case 24: this.$ = AST.makeSelect($$[$0-2],$$[$0],this._$); 
break;
case 25: this.$ = AST.makeAssign($$[$0-2],$$[$0],this._$); 
break;
case 26: this.$ = AST.makeCall($$[$0-1],$$[$0],this._$); 
break;
case 27: this.$ = AST.makeTypeApp($$[$0-3],$$[$0-1],this._$); 
break;
case 28: this.$ = AST.makeCapStack($$[$0-2],$$[$0],this._$); 
break;
case 30: this.$ = AST.makeDeRef($$[$0],this._$); 
break;
case 31: this.$ = AST.makeNew($$[$0],this._$); 
break;
case 32: this.$ = AST.makeForall($$[$0-2],$$[$0],this._$); 
break;
case 33: this.$ = AST.makePack($$[$0-3],$$[$0-1],this._$); 
break;
case 34: this.$ = AST.makeDelete($$[$0],this._$); 
break;
case 35: this.$ = AST.makeLet($$[$0-5],$$[$0-3],$$[$0-1],this._$); 
break;
case 36: this.$ = AST.makeOpen($$[$0-8],$$[$0-6],$$[$0-3],$$[$0-1],this._$); 
break;
case 37: this.$ = AST.makeQuickOpen($$[$0-2],$$[$0],this._$); 
break;
case 38: this.$ = $$[$0-1]; 
break;
case 40: this.$ = $$[$0]; 
break;
case 41: this.$ = AST.makeFun($$[$0-3],$$[$0],this._$); 
break;
case 42: this.$ = AST.makeFun($$[$0-2],$$[$0],this._$); 
break;
case 43: this.$ = AST.makeParameters($$[$0-2],$$[$0],this._$); 
break;
case 44: this.$ = AST.makeID(yytext,this._$); 
break;
case 45: this.$ = AST.makeNumber(yytext,this._$); 
break;
case 46: this.$ = AST.makeBoolean(yytext,this._$); 
break;
case 47: this.$ = AST.makeString(yytext,this._$); 
break;
case 49: this.$ = AST.makeRecord(null,this._$); 
break;
case 50: this.$ = AST.makeRecord($$[$0-1],this._$); 
break;
case 51: this.$ = AST.makeField($$[$0-2],$$[$0],this._$); 
break;
case 53: this.$ = AST.makeFields($$[$0-2],$$[$0],this._$); 
break;
}
},
table: [{3:1,4:2,9:[1,14],17:[1,8],22:[1,15],28:3,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{1:[3]},{5:[1,23]},{5:[2,19]},{5:[2,20],9:[1,14],10:[1,25],15:[1,29],17:[1,8],19:[1,28],22:[1,15],23:[2,20],30:[1,24],31:27,33:[1,26],34:7,35:[1,9],36:[1,10],37:[2,20],38:[1,11],39:[1,12],41:[2,20],42:[2,20],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,22],9:[2,22],10:[2,22],15:[2,22],17:[2,22],19:[2,22],22:[2,22],23:[2,22],27:[2,22],30:[2,22],33:[2,22],35:[2,22],36:[2,22],37:[2,22],38:[2,22],39:[2,22],41:[2,22],42:[2,22],43:[2,22],45:[2,22],48:[2,22],49:[2,22],50:[2,22],52:[2,22],53:[2,22]},{9:[1,14],17:[1,8],22:[1,15],31:30,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,29],9:[2,29],10:[2,29],15:[2,29],17:[2,29],19:[2,29],22:[2,29],23:[2,29],27:[2,29],30:[2,29],33:[2,29],35:[2,29],36:[2,29],37:[2,29],38:[2,29],39:[2,29],41:[2,29],42:[2,29],43:[2,29],45:[2,29],48:[2,29],49:[2,29],50:[2,29],52:[2,29],53:[2,29]},{9:[1,14],17:[1,8],22:[1,15],31:31,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,14],17:[1,8],22:[1,15],31:32,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,33]},{9:[1,14],17:[1,8],22:[1,15],31:34,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,35]},{36:[1,36]},{5:[2,44],9:[2,44],10:[2,44],15:[2,44],17:[2,44],19:[2,44],22:[2,44],23:[2,44],26:[1,37],27:[2,44],30:[2,44],33:[2,44],35:[2,44],36:[2,44],37:[2,44],38:[2,44],39:[2,44],41:[2,44],42:[2,44],43:[2,44],45:[2,44],48:[2,44],49:[2,44],50:[2,44],52:[2,44],53:[2,44]},{9:[1,14],17:[1,8],22:[1,15],28:38,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,39],9:[2,39],10:[2,39],15:[2,39],17:[2,39],19:[2,39],22:[2,39],23:[2,39],27:[2,39],30:[2,39],33:[2,39],35:[2,39],36:[2,39],37:[2,39],38:[2,39],39:[2,39],41:[2,39],42:[2,39],43:[2,39],45:[2,39],48:[2,39],49:[2,39],50:[2,39],52:[2,39],53:[2,39]},{5:[2,45],9:[2,45],10:[2,45],15:[2,45],17:[2,45],19:[2,45],22:[2,45],23:[2,45],27:[2,45],30:[2,45],33:[2,45],35:[2,45],36:[2,45],37:[2,45],38:[2,45],39:[2,45],41:[2,45],42:[2,45],43:[2,45],45:[2,45],48:[2,45],49:[2,45],50:[2,45],52:[2,45],53:[2,45]},{5:[2,46],9:[2,46],10:[2,46],15:[2,46],17:[2,46],19:[2,46],22:[2,46],23:[2,46],27:[2,46],30:[2,46],33:[2,46],35:[2,46],36:[2,46],37:[2,46],38:[2,46],39:[2,46],41:[2,46],42:[2,46],43:[2,46],45:[2,46],48:[2,46],49:[2,46],50:[2,46],52:[2,46],53:[2,46]},{5:[2,47],9:[2,47],10:[2,47],15:[2,47],17:[2,47],19:[2,47],22:[2,47],23:[2,47],27:[2,47],30:[2,47],33:[2,47],35:[2,47],36:[2,47],37:[2,47],38:[2,47],39:[2,47],41:[2,47],42:[2,47],43:[2,47],45:[2,47],48:[2,47],49:[2,47],50:[2,47],52:[2,47],53:[2,47]},{5:[2,48],9:[2,48],10:[2,48],15:[2,48],17:[2,48],19:[2,48],22:[2,48],23:[2,48],27:[2,48],30:[2,48],33:[2,48],35:[2,48],36:[2,48],37:[2,48],38:[2,48],39:[2,48],41:[2,48],42:[2,48],43:[2,48],45:[2,48],48:[2,48],49:[2,48],50:[2,48],52:[2,48],53:[2,48]},{22:[1,39]},{9:[1,43],53:[1,40],54:41,55:42},{1:[2,1]},{9:[1,14],17:[1,8],22:[1,15],28:44,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,45]},{9:[1,14],17:[1,8],22:[1,15],31:46,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,26],9:[2,26],10:[2,26],15:[2,26],17:[2,26],19:[2,26],22:[2,26],23:[2,26],27:[2,26],30:[2,26],33:[2,26],35:[2,26],36:[2,26],37:[2,26],38:[2,26],39:[2,26],41:[2,26],42:[2,26],43:[2,26],45:[2,26],48:[2,26],49:[2,26],50:[2,26],52:[2,26],53:[2,26]},{9:[1,47]},{16:48,24:[1,49]},{5:[2,23],9:[2,23],10:[2,23],15:[2,23],17:[2,23],19:[2,23],22:[2,23],23:[2,23],27:[2,23],30:[2,23],33:[2,23],35:[2,23],36:[2,23],37:[2,23],38:[2,23],39:[2,23],41:[2,23],42:[2,23],43:[2,23],45:[2,23],48:[2,23],49:[2,23],50:[2,23],52:[2,23],53:[2,23]},{5:[2,30],9:[2,30],10:[2,30],15:[2,30],17:[2,30],19:[2,30],22:[2,30],23:[2,30],27:[2,30],30:[2,30],33:[2,30],35:[2,30],36:[2,30],37:[2,30],38:[2,30],39:[2,30],41:[2,30],42:[2,30],43:[2,30],45:[2,30],48:[2,30],49:[2,30],50:[2,30],52:[2,30],53:[2,30]},{5:[2,31],9:[2,31],10:[2,31],15:[2,31],17:[2,31],19:[2,31],22:[2,31],23:[2,31],27:[2,31],30:[2,31],33:[2,31],35:[2,31],36:[2,31],37:[2,31],38:[2,31],39:[2,31],41:[2,31],42:[2,31],43:[2,31],45:[2,31],48:[2,31],49:[2,31],50:[2,31],52:[2,31],53:[2,31]},{27:[1,51],37:[1,50]},{5:[2,34],9:[2,34],10:[2,34],15:[2,34],17:[2,34],19:[2,34],22:[2,34],23:[2,34],27:[2,34],30:[2,34],33:[2,34],35:[2,34],36:[2,34],37:[2,34],38:[2,34],39:[2,34],41:[2,34],42:[2,34],43:[2,34],45:[2,34],48:[2,34],49:[2,34],50:[2,34],52:[2,34],53:[2,34]},{40:[1,52]},{9:[1,53]},{9:[1,14],17:[1,8],22:[1,15],31:54,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{23:[1,55]},{9:[1,58],46:56,47:57},{5:[2,49],9:[2,49],10:[2,49],15:[2,49],17:[2,49],19:[2,49],22:[2,49],23:[2,49],27:[2,49],30:[2,49],33:[2,49],35:[2,49],36:[2,49],37:[2,49],38:[2,49],39:[2,49],41:[2,49],42:[2,49],43:[2,49],45:[2,49],48:[2,49],49:[2,49],50:[2,49],52:[2,49],53:[2,49]},{53:[1,59]},{27:[1,60],53:[2,52]},{40:[1,61]},{5:[2,21],23:[2,21],37:[2,21],41:[2,21],42:[2,21]},{5:[2,24],9:[2,24],10:[2,24],15:[2,24],17:[2,24],19:[2,24],22:[2,24],23:[2,24],27:[2,24],30:[2,24],33:[2,24],35:[2,24],36:[2,24],37:[2,24],38:[2,24],39:[2,24],41:[2,24],42:[2,24],43:[2,24],45:[2,24],48:[2,24],49:[2,24],50:[2,24],52:[2,24],53:[2,24]},{5:[2,25],9:[2,25],10:[2,25],15:[2,25],17:[2,25],19:[2,25],22:[2,25],23:[2,25],27:[2,25],30:[2,25],33:[2,25],35:[2,25],36:[2,25],37:[2,25],38:[2,25],39:[2,25],41:[2,25],42:[2,25],43:[2,25],45:[2,25],48:[2,25],49:[2,25],50:[2,25],52:[2,25],53:[2,25]},{20:[1,62]},{5:[2,28],9:[2,28],10:[2,28],15:[2,28],17:[2,28],19:[2,28],22:[2,28],23:[2,28],27:[2,28],30:[2,28],33:[2,28],35:[2,28],36:[2,28],37:[2,28],38:[2,28],39:[2,28],41:[2,28],42:[2,28],43:[2,28],45:[2,28],48:[2,28],49:[2,28],50:[2,28],52:[2,28],53:[2,28]},{9:[1,63]},{9:[1,14],17:[1,8],22:[1,15],31:64,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,14],17:[1,8],22:[1,15],28:65,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{9:[1,14],17:[1,8],22:[1,15],28:66,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{27:[1,67]},{5:[2,37],9:[2,37],10:[2,37],15:[2,37],17:[2,37],19:[2,37],22:[2,37],23:[2,37],27:[2,37],30:[2,37],33:[2,37],35:[2,37],36:[2,37],37:[2,37],38:[2,37],39:[2,37],41:[2,37],42:[2,37],43:[2,37],45:[2,37],48:[2,37],49:[2,37],50:[2,37],52:[2,37],53:[2,37]},{5:[2,38],9:[2,38],10:[2,38],15:[2,38],17:[2,38],19:[2,38],22:[2,38],23:[2,38],27:[2,38],30:[2,38],33:[2,38],35:[2,38],36:[2,38],37:[2,38],38:[2,38],39:[2,38],41:[2,38],42:[2,38],43:[2,38],45:[2,38],48:[2,38],49:[2,38],50:[2,38],52:[2,38],53:[2,38]},{5:[2,40],9:[2,40],10:[2,40],15:[2,40],17:[2,40],19:[2,40],22:[2,40],23:[2,40],27:[2,40],30:[2,40],33:[2,40],35:[2,40],36:[2,40],37:[2,40],38:[2,40],39:[2,40],41:[2,40],42:[2,40],43:[2,40],45:[2,40],48:[2,40],49:[2,40],50:[2,40],52:[2,40],53:[2,40]},{23:[1,68],27:[1,69]},{26:[1,70]},{5:[2,50],9:[2,50],10:[2,50],15:[2,50],17:[2,50],19:[2,50],22:[2,50],23:[2,50],27:[2,50],30:[2,50],33:[2,50],35:[2,50],36:[2,50],37:[2,50],38:[2,50],39:[2,50],41:[2,50],42:[2,50],43:[2,50],45:[2,50],48:[2,50],49:[2,50],50:[2,50],52:[2,50],53:[2,50]},{9:[1,43],54:71,55:42},{9:[1,14],17:[1,8],22:[1,15],29:72,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,27],9:[2,27],10:[2,27],15:[2,27],17:[2,27],19:[2,27],22:[2,27],23:[2,27],27:[2,27],30:[2,27],33:[2,27],35:[2,27],36:[2,27],37:[2,27],38:[2,27],39:[2,27],41:[2,27],42:[2,27],43:[2,27],45:[2,27],48:[2,27],49:[2,27],50:[2,27],52:[2,27],53:[2,27]},{9:[1,75],14:73,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{5:[2,32],9:[2,32],10:[2,32],15:[2,32],17:[2,32],19:[2,32],22:[2,32],23:[2,32],27:[2,32],30:[2,32],33:[2,32],35:[2,32],36:[2,32],37:[2,32],38:[2,32],39:[2,32],41:[2,32],42:[2,32],43:[2,32],45:[2,32],48:[2,32],49:[2,32],50:[2,32],52:[2,32],53:[2,32]},{37:[1,79]},{41:[1,80]},{9:[1,81]},{10:[1,82]},{9:[1,58],46:83,47:57},{6:84,7:85,8:[1,86],9:[1,75],11:[1,87],12:88,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{53:[2,53]},{9:[1,14],10:[1,25],15:[1,29],17:[1,8],19:[1,28],22:[1,15],27:[2,51],31:27,33:[1,26],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22],53:[2,51]},{5:[2,15],9:[2,15],10:[2,15],13:[2,15],15:[2,15],17:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],27:[2,15],30:[2,15],33:[2,15],35:[2,15],36:[2,15],37:[2,15],38:[2,15],39:[2,15],41:[2,15],42:[2,15],43:[2,15],45:[2,15],48:[2,15],49:[2,15],50:[2,15],52:[2,15],53:[2,15]},{9:[1,75],14:90,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{5:[2,10],9:[2,10],10:[2,10],13:[2,10],15:[2,10],17:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],27:[2,10],30:[2,10],33:[2,10],35:[2,10],36:[2,10],37:[2,10],38:[2,10],39:[2,10],41:[2,10],42:[2,10],43:[2,10],45:[2,10],48:[2,10],49:[2,10],50:[2,10],52:[2,10],53:[2,10]},{9:[1,91]},{9:[1,95],20:[1,92],21:93,25:94},{6:96,7:85,8:[1,86],9:[1,75],11:[1,87],12:88,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{5:[2,33],9:[2,33],10:[2,33],15:[2,33],17:[2,33],19:[2,33],22:[2,33],23:[2,33],27:[2,33],30:[2,33],33:[2,33],35:[2,33],36:[2,33],37:[2,33],38:[2,33],39:[2,33],41:[2,33],42:[2,33],43:[2,33],45:[2,33],48:[2,33],49:[2,33],50:[2,33],52:[2,33],53:[2,33]},{9:[1,14],17:[1,8],22:[1,15],28:97,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{37:[1,98]},{9:[1,14],17:[1,8],22:[1,15],31:99,34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{5:[2,42],9:[2,42],10:[2,42],15:[2,42],17:[2,42],19:[2,42],22:[2,42],23:[2,42],27:[2,42],30:[2,42],33:[2,42],35:[2,42],36:[2,42],37:[2,42],38:[2,42],39:[2,42],41:[2,42],42:[2,42],43:[2,42],45:[2,42],48:[2,42],49:[2,42],50:[2,42],52:[2,42],53:[2,42]},{23:[2,43],27:[2,43]},{13:[1,100],20:[2,2],23:[2,2],27:[2,2]},{9:[1,101]},{9:[1,102]},{13:[2,5],15:[1,103],20:[2,5],23:[2,5],27:[2,5]},{13:[2,7],15:[2,7],20:[2,7],23:[2,7],27:[2,7]},{5:[2,9],9:[2,9],10:[2,9],13:[2,9],15:[2,9],17:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],27:[2,9],30:[2,9],33:[2,9],35:[2,9],36:[2,9],37:[2,9],38:[2,9],39:[2,9],41:[2,9],42:[2,9],43:[2,9],45:[2,9],48:[2,9],49:[2,9],50:[2,9],52:[2,9],53:[2,9]},{5:[2,11],9:[2,11],10:[2,11],13:[2,11],15:[2,11],17:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],27:[2,11],30:[2,11],33:[2,11],35:[2,11],36:[2,11],37:[2,11],38:[2,11],39:[2,11],41:[2,11],42:[2,11],43:[2,11],45:[2,11],48:[2,11],49:[2,11],50:[2,11],52:[2,11],53:[2,11]},{5:[2,12],9:[2,12],10:[2,12],13:[2,12],15:[2,12],17:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],27:[2,12],30:[2,12],33:[2,12],35:[2,12],36:[2,12],37:[2,12],38:[2,12],39:[2,12],41:[2,12],42:[2,12],43:[2,12],45:[2,12],48:[2,12],49:[2,12],50:[2,12],52:[2,12],53:[2,12]},{20:[1,104]},{20:[2,17],27:[1,105]},{26:[1,106]},{23:[1,107]},{42:[1,108]},{40:[1,109]},{5:[2,41],9:[2,41],10:[2,41],15:[2,41],17:[2,41],19:[2,41],22:[2,41],23:[2,41],27:[2,41],30:[2,41],33:[2,41],35:[2,41],36:[2,41],37:[2,41],38:[2,41],39:[2,41],41:[2,41],42:[2,41],43:[2,41],45:[2,41],48:[2,41],49:[2,41],50:[2,41],52:[2,41],53:[2,41]},{9:[1,75],12:110,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{10:[1,111]},{10:[1,112]},{16:113,24:[1,49]},{5:[2,13],9:[2,13],10:[2,13],13:[2,13],15:[2,13],17:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],27:[2,13],30:[2,13],33:[2,13],35:[2,13],36:[2,13],37:[2,13],38:[2,13],39:[2,13],41:[2,13],42:[2,13],43:[2,13],45:[2,13],48:[2,13],49:[2,13],50:[2,13],52:[2,13],53:[2,13]},{9:[1,95],21:114,25:94},{6:115,7:85,8:[1,86],9:[1,75],11:[1,87],12:88,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{5:[2,14],9:[2,14],10:[2,14],13:[2,14],15:[2,14],17:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],27:[2,14],30:[2,14],33:[2,14],35:[2,14],36:[2,14],37:[2,14],38:[2,14],39:[2,14],41:[2,14],42:[2,14],43:[2,14],45:[2,14],48:[2,14],49:[2,14],50:[2,14],52:[2,14],53:[2,14]},{5:[2,35],9:[2,35],10:[2,35],15:[2,35],17:[2,35],19:[2,35],22:[2,35],23:[2,35],27:[2,35],30:[2,35],33:[2,35],35:[2,35],36:[2,35],37:[2,35],38:[2,35],39:[2,35],41:[2,35],42:[2,35],43:[2,35],45:[2,35],48:[2,35],49:[2,35],50:[2,35],52:[2,35],53:[2,35]},{9:[1,14],17:[1,8],22:[1,15],28:116,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{13:[2,6],15:[1,103],20:[2,6],23:[2,6],27:[2,6]},{6:117,7:85,8:[1,86],9:[1,75],11:[1,87],12:88,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{6:118,7:85,8:[1,86],9:[1,75],11:[1,87],12:88,14:89,17:[1,74],18:[1,76],19:[1,77],22:[1,78]},{13:[2,8],15:[2,8],20:[2,8],23:[2,8],27:[2,8]},{20:[2,18]},{20:[2,16],27:[2,16]},{41:[1,119]},{20:[2,3],23:[2,3],27:[2,3]},{20:[2,4],23:[2,4],27:[2,4]},{9:[1,14],17:[1,8],22:[1,15],28:120,29:4,31:5,32:[1,6],34:7,35:[1,9],36:[1,10],38:[1,11],39:[1,12],43:[1,13],44:16,45:[1,21],48:[1,17],49:[1,18],50:[1,19],51:20,52:[1,22]},{42:[1,121]},{5:[2,36],9:[2,36],10:[2,36],15:[2,36],17:[2,36],19:[2,36],22:[2,36],23:[2,36],27:[2,36],30:[2,36],33:[2,36],35:[2,36],36:[2,36],37:[2,36],38:[2,36],39:[2,36],41:[2,36],42:[2,36],43:[2,36],45:[2,36],48:[2,36],49:[2,36],50:[2,36],52:[2,36],53:[2,36]}],
defaultActions: {3:[2,19],23:[2,1],71:[2,53],114:[2,18]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:/* skip whitespace */
break;
case 1:/* skip comments */
break;
case 2:return 39
break;
case 3:return 43
break;
case 4:return 41
break;
case 5:return 42
break;
case 6:return 35
break;
case 7:return 38
break;
case 8:return 45
break;
case 9:return 49
break;
case 10:return 49
break;
case 11:return 32
break;
case 12:return 22
break;
case 13:return 23
break;
case 14:return 36
break;
case 15:return 37
break;
case 16:return 52
break;
case 17:return 53
break;
case 18:return 10
break;
case 19:return 27
break;
case 20:return 30
break;
case 21:return 33
break;
case 22:return 15
break;
case 23:return 26
break;
case 24:return 40
break;
case 25:return 17
break;
case 26:return 19
break;
case 27:return 20
break;
case 28:return 13
break;
case 29:return 24
break;
case 30:return 18
break;
case 31:return 11
break;
case 32:return 8
break;
case 33:return 48
break;
case 34:return 9
break;
case 35:return 50
break;
case 36:return 5
break;
}
};
lexer.rules = [/^(?:\s+)/,/^(?:\/\/.*)/,/^(?:let\b)/,/^(?:open\b)/,/^(?:in\b)/,/^(?:end\b)/,/^(?:new\b)/,/^(?:delete\b)/,/^(?:fun\b)/,/^(?:true\b)/,/^(?:false\b)/,/^(?:debug\b)/,/^(?:\()/,/^(?:\))/,/^(?:<)/,/^(?:>)/,/^(?:\{)/,/^(?:\})/,/^(?:\.)/,/^(?:,)/,/^(?:;)/,/^(?::=)/,/^(?:::)/,/^(?::)/,/^(?:=)/,/^(?:!)/,/^(?:\[)/,/^(?:\])/,/^(?:-o\b)/,/^(?:rw\b)/,/^(?:ref\b)/,/^(?:exists\b)/,/^(?:forall\b)/,/^(?:[0-9]+)/,/^(?:[a-zA-Z0-9_]+)/,/^(?:"[^"\r\n]*")/,/^(?:$)/];
lexer.conditions = {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;
function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = grammar;
exports.Parser = grammar.Parser;
exports.parse = function () { return grammar.parse.apply(grammar, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}