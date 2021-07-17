// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

//arc(XCentre, YCentre, ZCentre, r, aStart, arcAngle, CW/CCW, nSegments, [Overrides])

function
  = lineCartesianFunc / lineEquation / linePolar / repeatPolar / customGCode / repeatCartesian
  
repeatCartesian
	= _ "repeatCartesian" _ "(" _ repeatedFeatures:range _ "," _ xDisp:number _ "," 
    _ yDisp:number _ "," _ zDisp:number "," _ numberOfRepeats:number _ repeatRules:("," _ range _ )? _ ")" _ {
    
    const result = {
    	"name":"repeatCartesian",
        "repeatedFeatures":repeatedFeatures,
       	"xDisp":xDisp,
        "yDisp":yDisp,
        "zDisp":zDisp,
        "numberOfRepeats": numberOfRepeats
    }
    
    result.xDisp.type = "REL";
    result.yDisp.type = "REL";
    result.zDisp.type = "REL";
    
    if (repeatRules != undefined)
    	result["repeatRules"] = repeatRules[2];
        
    return result;
    }

customGCode
	= _ "customGCode" _ "(" _ code:gCode _ ")" {
    	return {name: "customGCode", value:code}
    }
  
repeatPolar
	= _ "repeatPolar" _ "(" _ repeatedFeatures:range _ "," _ xCentre:argumentNumber _ "," 
    _ yCentre:argumentNumber _ "," _ angleIncrement:number _ "," _ radiusIncrement:number _ ","
    _ zDisp:number _ "," _ numberOfRepeats:number _ repeatRules:("," _ range _ )? _ ")" _ {
    
    const result = {
    	"name":"repeatPolar",
        "repeatedFeatures":repeatedFeatures,
       	"xCentre":xCentre,
        "yCentre":yCentre,
        "angleIncrement":angleIncrement,
        "radiusIncrement":radiusIncrement,
        "zDisp":zDisp,
        "numberOfRepeats": numberOfRepeats
    }
    
    if (repeatRules != undefined)
    	result["repeatRules"] = repeatRules[2];
        
    return result;
    }

linePolar
	= _ "linePolar" _ "(" _ xCentre:argumentNumber _ "," _ yCentre:argumentNumber _ "," _ zCentre:argumentNumber _ "," 
    _ radiusPoint1:number _ "," _ angleStart:number _ "," _ z1:number _ ","
    _ radiusPoint2:number _ "," _ angleEnd:number _ "," _ z2:number _ ","
	_ mType:printOrTravel _ "," _ width:number _","_ height:number _
    _ overrides:("," _ overrides _)? _ ")" _ {  
    
    const result = {
    	"name":"linePolar",
       	"xCentre":xCentre,
        "yCentre":yCentre,
        "zCentre":zCentre,
        "radiusPoint1":radiusPoint1,
        "angleStart":angleStart,
        "z1":z1,
        "radiusPoint2":radiusPoint2,
        "angleEnd":angleEnd,
        "z2":z2,
        "mType":mType,
        "width":width,
        "height":height
    }
    
    if (overrides != undefined)
    	result["overrides"] = overrides[2];
        
    return result;
 }


    
lineEquation
	= _ "lineEquation" _ "(" _ xf:(relativeNumber/Expression) _ "," _ yf:(relativeNumber/Expression) _ "," 
    _ zf:(relativeNumber/Expression) _ "," _ tStart:number _ "," _ tEnd:number _ "," 
    _ tStep:number _ "," _ width:Expression _"," 
    _ height:Expression _ overrides:("," _ overridesWithExpression _)? _ ")" _ {  
    
    const result = {
    	"name":"lineEquation",
       	"xf":xf,
        "yf":yf,
        "zf":zf,
        "tStart":tStart,
        "tEnd":tEnd,
        "tStep":tStep,
        "width":width,
        "height":height,   
    }
    
    if (overrides != undefined)
    	result["overrides"] = overrides[2];
        
    return result;
    }


lineCartesianFunc
	= _ "lineCartesian" _ "(" _ x1:argumentNumber _ "," _ y1:argumentNumber _ "," 
    _ z1:argumentNumber _ "," _ x2:argumentNumber _ "," _ y2:argumentNumber _ "," 
    _ z2:argumentNumber _ "," _ mType:printOrTravel _"," _ width:number _"," 
    _ height:number _ overrides:("," _ overrides _)? _ ")" _ {  
    
    const result = {
    	"name":"lineCartesian",
       	"x1":x1,
        "y1":y1,
        "z1":z1,
        "x2":x2,
        "y2":y2,
        "z2":z2,
        "mType":mType,
        "width":width,
        "height":height,   
    }
    
    if (overrides != undefined)
    	result["overrides"] = overrides[2];
    
    return result;
    }
    


Expression
  = _ "if" _ "(" _ bool0:BooleanTerm _ ")" _ ret0:Term _ ";" 
  	bools:(_ "else if" _ "(" _ BooleanTerm _ ")" _ Term _ ";")*
    boolf:(_ "else" _ Term _ ";")? 
    {
    	let result = {};
        
        result["if"] = { "condition": bool0, "returnValue": ret0};
        
        if (bools.length > 0)
        {
        	result["elif"] = [];
            
            for (let elem of bools)
            {

                result["elif"].push({"condition": elem[5], "returnValue": elem[9]});
            }
            
        }
        
        if (boolf !== null)
        {
        	result["else"] = {"returnValue": boolf[3]};
        }
        
    	return {type:"expressionConditional", value: result};
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
  	let result = "Math."+variable+"(";
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
  / num:number {return num.value} / positionVal / tVal / tStep / MathFunction
  
tVal
  = "tVal"!alphanum {return "tVal";}
  
tStep
  = "tStep"!alphanum {return "tStep";}
  
positionVal
  = ("xVal"/"yVal"/"zVal")!alphanum { return text(); }
  
argument
  = arg:(relativeNumber/number/printOrTravel/Expression) {return arg;}

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
          for (let i = arg0[0].value; i<=arg0[4].value; i++)
            result["value"].push(i);
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
                  for (let i = arg[2][0].value; i<=arg[2][4].value; i++)
                    result["value"].push(i);
                }
            }
       
        }
        
        
        return result;
    }

argumentNumber
 = arg:(relativeNumber/number) {return arg;}
 
overridesWithExpression
 = "["_ char0:char _ "=" _ arg0:Expression _  args:("," _ char:char _ "=" _ arg:Expression _)* "]"
  { 
  	const returnObj = { "type": "overrides"};
    
    returnObj[char0] = arg0;
    
    args.forEach( (array) => {
    	returnObj[array[2]] = array[6];
    	
    });
  
  	return returnObj;
  }

overrides
  = "["_ char0:char _ "=" _ arg0:number _  args:("," _ char:char _ "=" _ arg:number _)* "]"
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
  = chars:([a-zA-Z0-9"_"]+) { return chars.join("");}

char
  = char:[A-Z] {return char;}
_ "whitespace"
  = [ \t\n\r]* 