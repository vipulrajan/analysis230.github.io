// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.



function
  = _ func:alphanum _ "(" _ arg0:argument _ args:(","_ argument _ )* ")" _ 
  { const result =  {
  	"name": func.value,
    "arguments": [arg0]
  };
  
  args.forEach( (arg) => {
  result["arguments"].push(arg[2])
  });
  
  return result;}


Expression
  = _ "if" _ "(" _ bool0:BooleanTerm _ ")" _ ret0:Term _ ";" 
  	bools:(_ "else if" _ "(" _ BooleanTerm _ ")" _ Term _ ";")*
    boolf:(_ "else" _ Term _ ";")? 
    {
    	let result = "";
        result = result + "if(" + bool0 + ")" + " " + ret0 + "; ";
        
        for (let elem of bools)
        {
        	result = result + "else if (";
            result = result + elem[5];
            result = result + ") " + elem[9] + "; ";
        }
        
        if (boolf !== null)
        {
        	result = result +"else "+ boolf[3] + "; ";
        }
    	return {type:"expression", value: result};
    } 
    / term:Term {return {type:"expression", value: term};} 

BooleanTerm
  = arg0:Term _ operator:( ">"/"<"/"<="/">="/"=="/"!=") _ arg1:Term 
  {
  	return arg0 + " " + operator + " " + arg1;
  }
  / "!" _ Term 
  {return text();}

Term 
  = head:Factor tail:(_ ("*" / "/" / "+" / "-") _ Factor )*
  {
	
    const result = []
    
    result.push(head);
    
    for (let elem of tail)
    {
    	result.push(elem[1]);
        result.push(elem[3]);
    }

  	return result.join(" ");
  }
  / "-" _ fac:Factor { return "-"+fac;}

MathFunction
  = "Math."variable:alphanum"(" _ arg0:Term _ args:(_ "," _ Term _)*  ")"
  { 
  	let result = "Math."+variable.value+"(";
    result = result + arg0;
    
    for (let elem of args)
    {
    	result = result + ", " + elem[3];
    }
    
    result = result + ")"
	return result;
  }

Factor
  = "(" _ expr:Term _ ")" { return "(" + expr + ")"; }
  / num:number {return num.value} / positionVal / tVal / tStep / MathFunction / 
  varVal:variable { return "`"+varVal.value+"`"; }
  
tVal
  = "tVal"!alphanum {return "tVal";}
  
tStep
  = "tStep"!alphanum {return "tStep";}
  
positionVal
  = ("xVal"/"yVal"/"zVal")!alphanum { return text(); }
  
argument
  = arg:(relativeNumber/printOrTravel/Expression/range/number/printOrTravel/overrides/variable/gCode) {return arg;}

range
  = "'" _ arg0:(( number _ "-" _ number )/number) _ args:("," _ (( number _ "-" _ number )/number) _ )* "'"
	{
 		const result = {"type": "range",
        				"value": []
        };
        
        if ( !Array.isArray(arg0) )
        {
        	result["value"].push(arg0.value)
        }
        else
        {
        	result["value"].push(arg0[0].value + "-" + arg0[4].value)
        }
        
        
        if (args !== undefined)
        {
        	for (let arg of args)
            {
            	if ( !Array.isArray(arg[2]) )
                {
                    result["value"].push(arg[2].value)
                }
                else
                {
                    result["value"].push(arg[2][0].value + "-" + arg[2][4].value)
                }
            }
       
        }
        
        
        return result;
    }

argumentNumber
 = arg:(relativeNumber/number) {return arg;}
 
overrides
  = "["_ char0:char _ "=" _ arg0:argument _  args:("," _ char:char _ "=" _ arg:argument _)* "]"
  { 
  	const returnObj = { "type": "overrides"};
    
    returnObj[char0] = arg0;
    
    args.forEach( (array) => {
    	returnObj[array[2]] = array[6];
    	
    });
  
  	return returnObj;
  }

printOrTravel
  = value:("Pr"/"Tr")!alphanum {return {"type":"travelType",value};}

relativeNumber "relativeNumber"
  = type:"R"value:number {return {"type": "REL", "value":value.value};}
  
number "number"
  = digits:([0-9]+("."[0-9]+)?) { return {"type": "ABS", "value":Number(digits.flat(3).join(""))}; }
  /digits:("-"[0-9]+("."[0-9]+)?) { return {"type": "ABS", "value":Number(digits.flat(3).join(""))}; }
  
variable "variable"
  = "`"value:alphanum"`"  { return {"type":"variable", "value":value.value};}

gCode "GCode"
  = "`" args:(_ char number _)* "`" 
   {
  	const result = {"type": "gCode", "value":{}};
    
    for (let elem of args)
    {
    
    	result["value"][elem[1]] = elem[2].value;
    }
    
    return result;
  }
  
alphanum "alphanum"
  = chars:([a-zA-Z0-9]+) { return {"type":"alphanum", "value":chars.join("")};}

char
  = char:[A-Z] {return char;}
_ "whitespace"
  = [ \t\n\r]*