import test from 'ava' ;

import { ll1 } from '@aureooms/js-grammar' ;

import { grammar , shakestring } from '../../src' ;

async function transform ( t , string , expected ) {
	let output = '' ;
	const out = { 'write' : buffer => output += buffer } ;
	await shakestring(string, out);
	t.is(output, expected);
}

async function throws ( t , string , expected ) {
	const out = { 'write' : buffer => undefined } ;
	await t.throws(async () => await shakestring(string, out), expected);
}

const immutable = async ( t , string ) => await transform( t , string , string ) ;

transform.title = ( title , string , expected ) => title || `shakestring('${string}') === '${expected}'` ;

throws.title = ( _ , string , expected ) => `throws('${string}') ~ '${expected}'` ;

immutable.title = ( title , string ) => transform.title( title , string , string ) ;

// Grammar should be LL1
test( 'Grammar is LL1' , t => t.true(ll1.is(grammar)) ) ;

// the empty document
test( immutable , '' ) ;

// text-only document
test( 'Text with a newline' , immutable , 'Lorem ipsum dolor\nsit amet.' ) ;

// undefined command
test( immutable , '\\usepackage{microtype}' ) ;

// undefined ifcmd
test( immutable , ' \\ifnum\\mynum>6 x \\fi ' ) ;
test( immutable , ' \\ifnum\\mynum>6 x \\else y \\fi ' ) ;

// Stars in some text
test( immutable , '*Lorem * ipsum* dolor sit $a*$ \\(m*e^*t_*\\)*' ) ;

// if fi
test( transform , '\\abctrue\\ifabc ah\\fi' , ' ah' ) ; // should
test( transform , '\\abcfalse\\ifabc ah\\fi' , '' ) ; // the

// if else fi
test( transform , '\\abctrue\\ifabc ah\\else oh\\fi' , ' ah' ) ; // space
test( transform , '\\abcfalse\\ifabc ah\\else oh\\fi' , ' oh' ) ; // disappear?

// with a newif
test( transform , '\\newif\\ifabc\\abctrue\\ifabc ah\\fi' , ' ah' ) ; // should

// def
test( transform , '\\def\\mymacro{Hello, world}\\mymacro', 'Hello, world') ;

// defception
test( transform , '\\def\\abc{\\def\\xyz{7}}\\abc\\xyz', '7') ;

// conditional defs
test( transform , '\\abctrue\\ifabc\\def\\xyz{A cat.}\\else\\def\\xyz{A dog.}\\fi\\xyz', 'A cat.') ;
test( transform , '\\abcfalse\\ifabc\\def\\xyz{A cat.}\\else\\def\\xyz{A dog.}\\fi\\xyz', 'A dog.') ;

// def and undefined
test( transform , '\\def\\affil{496}\\author[\\affil]{John Doe}' , '\\author[496]{John Doe}') ;

// newcommand single and no argument
test( transform , '\\newcommand\\aaa[1]{a#1}\\newcommand\\bbb{\\aaa{bc}}\\bbb', 'abc') ;
test( transform , '\\newcommand*\\aaa[1]{a#1}\\newcommand*\\bbb{\\aaa{bc}}\\bbb', 'abc') ;
test( transform , '\\newcommand{\\aaa}[1]{a#1}\\newcommand{\\bbb}{\\aaa{bc}}\\bbb', 'abc') ;

// newcommand single argument
test( transform , '\\newcommand\\aaa[1]{a#1}\\newcommand\\bbb[1]{\\aaa{b#1}}\\bbb{c}', 'abc') ;
test( transform , '\\newcommand*\\aaa[1]{a#1}\\newcommand*\\bbb[1]{\\aaa{b#1}}\\bbb{c}', 'abc') ;
test( transform , '\\newcommand{\\aaa}[1]{a#1}\\newcommand{\\bbb}[1]{\\aaa{b#1}}\\bbb{c}', 'abc') ;

// newcommand two arguments
test( transform , '\\newcommand\\swap[2]{#2#1}\\swap{a}{b}', 'ba') ;
test( transform , '\\newcommand*\\swap[2]{#2#1}\\swap{a}{b}', 'ba') ;
test( transform , '\\newcommand{\\swap}[2]{#2#1}\\swap{a}{b}', 'ba') ;


// comment
test( transform , '% Lorem ipsum dolor sit amet' , '%' ) ;
test( transform , 'Hello, world% Lorem ipsum dolor sit amet' , 'Hello, world%' ) ;
test( transform , 'Hello, world % Lorem ipsum dolor sit amet' , 'Hello, world %' ) ;
test( 'Comments with a newline' , transform , '1 % 2 \n 3' , '1 %\n 3' ) ;


// non matching brackets in math envs
test( immutable , '$[0,1)$' ) ;
test( immutable , '\\([0,1)\\)' ) ;
test( immutable , '$(0,1]$' ) ;
test( immutable , '\\((0,1]\\)' ) ;

// nested square brackets (not parsed as nested)
test( immutable , '\\nestedsquarebrackets[[]]') ;

// complex command call
test( transform , ' \\newtheorem{lemma}[theorem]{Lemma} % \\begin{Lemma}', ' \\newtheorem{lemma}[theorem]{Lemma} %') ;

// complex math env
test( 'Complex displaymath environment (equation 1)' , immutable , '\\begin{displaymath} S_r^\\ell(n,d) = O\\left( \\log dntr + \\frac{n^d}{t} ( \\log t + \\frac{r}{t^{d-2}} ) + t^{d+1} \\nu(t,d+1) + \\frac{n^d}{t^d} ( \\log \\nu(t,d+1) + t \\log t ) \\right), \\end{displaymath}' ) ;

test( 'Complex displaymath environment (equation 2)' , immutable , '\\[ S_r^\\ell(n,d) = O\\left( \\log dntr + \\frac{n^d}{t} ( \\log t + \\frac{r}{t^{d-2}} ) + t^{d+1} \\nu(t,d+1) + \\frac{n^d}{t^d} ( \\log \\nu(t,d+1) + t \\log t ) \\right), \\]' ) ;

test( 'Complex displaymath environment (matrix)' , immutable , '\\begin{displaymath}\n\t\\begin{vmatrix}\n\t\t1 & x_p & y_p \\\\\n\t\t1 & x_q & y_q \\\\\n\t\t1 & x_r & y_r\n\t\\end{vmatrix}.\n\\end{displaymath}' ) ;

// escaped newline
test( 'Escaped newline' , immutable , 'a\\\nb' ) ;

// incomplete arg number
test( throws , '#' , /Incomplete #/ ) ;
test( throws , '#x' , /Incomplete #/ ) ;

// no arguments defined
test( throws , '#1' , /no arguments in context/ ) ;

// escaped #
test( immutable , '\\#' ) ;
test( immutable , '\\#x' ) ;
test( immutable , '\\#1' ) ;

// simple command call with *
test( immutable , '\\paragraph*{Testing}' ) ;

// nonmatching curly brackets
test( throws , '{' , /unexpected end of file/ ) ;

// newcommand two arguments but one missing from call
test( throws , '\\newcommand\\test[2]{#1-#2}\\test{a}', /is defined with 2 arguments but 1 were given/) ;
test( throws , '\\newcommand\\test[2]{#1-#2}\\test{a}{b}{c}', /is defined with 2 arguments but 3 were given/) ;

// newcommand two arguments but one missing from definition
test( throws , '\\newcommand\\test[2]{#1-#2-#3}\\test{a}{b}', /only got 2 arguments/) ;

// errors at specific positions
test( throws , '\\newcommand\\test[{}]{x}', /1:18/) ;
test( throws , ' \\newcommand\\test[{}]{x}', /1:19/) ;
test( throws , '\n\\newcommand\\test[{}]{x}', /2:18/) ;

// a very long empty document (breaks recursive approaches)
// needs a fix in @aureooms/js-grammar
// for the moment we will not parse spaces and tabs
// this should be enough to allow for documents
// of a few thousand lines
const spaces = (new Array(100000)).join(' ') ;
test( 'long sequence of spaces' , immutable , spaces ) ;

const newlines = (new Array(100000)).join('\n') ;
test( 'long sequence of newlines' , immutable , newlines ) ;
