"use strict";
var fs = require('fs');

var sym = {
	"+": function(){ stack.push(stack.pop() + stack.pop()); },
	"*": function(){ stack.push(stack.pop() * stack.pop()); },
	"-": function(){ 
		var tosubtract = stack.pop();
		stack.push(stack.pop() - tosubtract); 
	},
	"/": function(){ 
		var todivide = stack.pop();
		stack.push(stack.pop() / todivide); 
	},
	"%": function(){ 
		var tomodulo = stack.pop();
		stack.push(stack.pop() % tomodulo); 
	},
	".": function(){
		stack.push(stack.pop().toString() + stack.pop().toString());
	}, 
	"pop": function(){
		stack.pop();
	}, 
	"swap": function(){
		var first = stack.pop();
		var second = stack.pop();
		stack.push(first);
		stack.push(second);
	},
	"dup": function(){ 
		var a = stack.pop();
		stack.push(a);
		stack.push(a);
	},
	"<=": function(){ stack.push(stack.pop() >= stack.pop()); },
	">=": function(){ stack.push(stack.pop() <= stack.pop()); },
	"<": function(){ stack.push(stack.pop() > stack.pop()); },
	">": function(){ stack.push(stack.pop() < stack.pop()); },
	"==": function(){ stack.push(stack.pop() == stack.pop()); },
	"print": function(){
		console.log(stack.pop());
	}
};

var infile = process.argv[2];
var input = "";
var stack = [];
var fstack = [];
var prog = [];
var debug = false;
if (typeof infile == "undefined") {
	process.stdin.setEncoding('utf8');
	process.stdin.on('readable', function() {
		var chunk = process.stdin.read();
		if (chunk !== null) {
			parse(chunk);
		}
		process.stdout.write('> ');
	});

	process.stdin.on('end', function() {
		process.stdout.write('bye!');
	});
} else {
	input = fs.readFileSync(infile, "utf8");
	parse(input);
}

function tokenize(input) {
	var tokens = [];
	for (var i = 0; i < input.length; i++) {
		if (input[i] === "(") {
			var compile = "";
			var name = "";
			i = i + 2;
			while (input[i] !== " "){
				name += input[i];
				i++;
			}
			i++;
			while (input[i] !== ")"){
				compile += input[i];
				i++;
			}
			i++;
			var tokened = tokenize(compile);
			sym[name] = function() {};
			var fn = "sym['" + name + "'] = function(){";
			for (var j = 0; j < tokened.length; j++) {
				if (tokened[j] === "?") {
					fn += "stack.pop()?function(){";
				} else if (tokened[j] === ":") {
					fn += "}():function(){";
				} else if (tokened[j] === ";"){
					fn += "}();";
				} else if (typeof sym[tokened[j]] !== "undefined") {
					fn += "sym['" + tokened[j] + "']();";
				} else {
					fn += "stack.push(" + parseFloat(tokened[j]) + ");";
				}
			}
			fn += "};";
			if (debug) console.log(fn);
			eval(fn);
		} else {
			var stackval = "";
			while(input[i] !== " " && i < input.length){
				stackval += input[i];
				i++;
			}
			tokens.push(stackval);
		}
	}
	return tokens;
}

function internStrings(input) {
	var len = input.length;
	for (var i = 0; i < len; i++) {
		len = input.length;
		if (input[i] === "'") {
			var start = i;
			var stringlit = "";
			i++;
			while (input[i] !== "'"){
				stringlit += input[i];
				i++;
			}
			i++;
			var original = stringlit;
			stringlit = hashString(stringlit);
			sym[stringlit] = function() { stack.push(original); };
			input = input.replace("'" + original + "'", stringlit);
			i = start;
		}
	}
	return input;
}

/*
store every token as an object so we can keep additional data alongside
ex. an if could store how far you have to jump to reach a conditional or the end
*/

function parse(input) {
	input = input.replace(/\n|\r/g, " ");
	input = input.trim();
	input = internStrings(input);
	input = input.replace(/\s+/g, " ");
	var tokens = tokenize(input);//program queue
	var jmp = 0;
	for (var i = 0; i < tokens.length; i++) {
		if (debug) console.log(stack, tokens[i]);
		if (tokens[i] === "?") {
			var cond;
			var end;
			for (var j = i; j < tokens.length; j++) {
				if (tokens[j] === ":") {
					cond = j;
					break;
				}
			}
			for (var j = i; j < tokens.length; j++) {
				if (tokens[j] === ";") {
					end = j;
					break;
				}
			}
			if (stack.pop()) {
				jmp = end - cond;
			} else {
				i = cond;
			}
		} else if (tokens[i] === ":") {
			if (jmp !== 0) {
				i += jmp;
				jmp = 0;
			}
		} else if (tokens[i] === ";"){
			i++;
		} else if (typeof sym[tokens[i]] !== "undefined") {
			sym[tokens[i]]();
		} else {
			stack.push(parseFloat(tokens[i]));
		}
	}
}

function hashString(s) {
	var hash = 0, i, char;
	if (s.length == 0) return hash;
	for (var i = 0, l = s.length; i < l; i++) {
		char = s.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash |= 0;
	}
	return hash;
}
//var input = "1 2 + 1 + 2 /"
//var input = "1 2 + ' times ' . 'world' . 'hello ' .";
//var input = "( 4 2 / m ) ( 'cake' c ) ( ' ' swap . . combine ) m c combine print"
//console.log(stack);
/*( pop 2 / div2 )
( pop 3 * mult3 )
4 mult3 div2
3 %
0 == if
( 1 1 + q )
else
( 1 2 + q )
end q print"*/