const { SchemasClient, DescribeSchemaCommand } = require('@aws-sdk/client-schemas');
const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { LambdaClient, InvokeCommand, GetLayerVersionByArnCommand, GetFunctionCommand } = require('@aws-sdk/client-lambda');
//used for testFunc
const lambdaClient = new LambdaClient ({
  region: "us-east-1",
  credentials: defaultProvider() 
})

const schemasClient = new SchemasClient({ 
  region: "us-east-1",
  credentials: defaultProvider() 
})


//used for get Test

const testController = {};

testController.getTest = async (req, res, next) => {
  console.log('top of getTest');
  const funcNames = res.locals.passedRuntime;
  // console.log('res.locals: ', res.locals);
  console.log('funcNames from res.locals: ', funcNames)

  
  try {
    const schemaData = funcNames.map(async (funcName) => {
      const input = {
      RegistryName: "lambda-testevent-schemas",
      SchemaName: `_${funcName}-schema`
      };
      const command = new DescribeSchemaCommand(input);
      const response = await schemasClient.send(command);
      console.log('command:', command)
      const data = JSON.parse(response.Content);
      //console.log('data: ', data.components.examples);
      const dataComp = data.components.examples;
      return dataComp;
      // res.locals.schemaData = {
      //   ...schemaData,
      //   dataComp 
      // };
    });
    const schemaDataPromise = await Promise.all(schemaData)
    // console.log('schemaDataPromise: ', schemaDataPromise);
    console.log('PASSED getTest')
    res.locals.schemaData = schemaDataPromise;
    console.log('schemaData: ', schemaDataPromise)
    return next();
  } catch(error) {
    console.log('Error in testController.getTest:', error);
    return next({
      log: ('there was a problem in testController.getTest. Error: ', error),
      status: 400,
      message: {err: 'No tests to find'}
    })
  }
}

testController.testRuntime = async (req, res, next) => {
  console.log('in test Run Time');
  const passFuncs = [];
  const failFuncs = []
  const { ARN, functionArray } = req.body;
  const getLayerVersionCommand = new GetLayerVersionByArnCommand({ Arn: ARN });
  const getLayerResponse = await lambdaClient.send(getLayerVersionCommand);
  const layerRuntime = getLayerResponse.CompatibleRuntimes;
  
    const runTimeFunction = async (element) => {
      try {
        const getFunctionCommand = new GetFunctionCommand({FunctionName: element});
        const getFunctionResponse = await lambdaClient.send(getFunctionCommand);
        const functionRuntime = getFunctionResponse.Configuration.Runtime;
        // console.log(`functionRuntime for ${element}: ${functionRuntime}`);
        
        if(layerRuntime.includes(functionRuntime)){
          console.log('passed runtime tests');
          // console.log('element:', element);
          passFuncs.push(element);
        } else {
          // console.log('failed');
          failFuncs.push(element)
        }
        console.log('PASSED testRunTime')
        // return next();
      } catch(error) {
        console.log('Error in testController.testRuntime:', error);
        return next({
          log: ('there was a problem in testController.testRuntime. Error: ', error),
          status: 400,
          message: {err: 'Problem testing runtime'}
        })
      }
    }
    // console.log('passedFunc:', passFuncs)
    // console.log('failedFuncs:', failFuncs)
    res.locals.passedRuntime = passFuncs;
    res.locals.failRuntime = failFuncs;
    try {
      await Promise.all(functionArray.map(async func => runTimeFunction(func)))
      return next();
      // next();
    } catch (error) {
      return res.status(403).send( error.message );
    }
  }



testController.testDependencies = async (req, res, next) => {
  const funcNames = res.locals.passedRuntime;
  const listOfTests = res.locals.schemaData;
  //console.log('in testFunc');
  const listOfErrors = [];
/*
  res.locals.passedRuntime (funcNames) stores the array of function names, in order. eg [ 'createAccount', 'getAccountBalance' ]
  res.locals.schemaData (listOfTests) stores the array of function test payloads, in order. each function gets an object like {firstTestName: {value: test payload}, secondTestName: {value: test payload}}
  eg [{"1stShareableTest":{"value":{"AcctNo":"12346"}},"2ndShareableEvent":{"value":{"AcctNo":"12347"}}},{"3rdSharebableTest":{"value":{"AcctNo":"12345"}}}]
  console.log(listOfTests)
*/
  console.log('funcNames inside test depend', funcNames);
  console.log('tests inside test depend', JSON.stringify(listOfTests));

  const dependenciesFunction = async (element, index) => {
    try {
      const passedFuncs = [];
      const failedFunctions = [];
      // iterate over tests and extract the payload "value"
      for (const key in listOfTests[index]) {
        const payload = listOfTests[index][key].value;
        const lambdaInput = {
          FunctionName: element,
          Payload: JSON.stringify(
            payload
          )
        }
        console.log()
        const command = new InvokeCommand(lambdaInput)
        const response = await lambdaClient.send(command);
        console.log('response' , response)
        //console.log('response.FunctionError: ', response.FunctionError);
      
        if (response.FunctionError) {
          console.log('Lambda Function Error:', response.FunctionError, 'Payload:', response.Payload.transformToString());
          const failedFuncName = lambdaInput.FunctionName;
          const errorType = response.Payload.transformToString().errorType;
          const specError = response.Payload.transformToString().errorMessage;
          const messageToUser = {
            Function: `There was an error in ${failedFuncName} when attaching this layer`,
            errorType: `There was a ${errorType}`,
            message:`Please fix ${specError} and try again`
          };
          failedFunctions.push(lambdaInput.FunctionName);
          console.log('FailedFunctions: ', failedFunctions);
          res.locals.failedFunctions = failedFunctions;

          listOfErrors.push(messageToUser);
          res.locals.errorMessageToUser = listOfErrors;
          //302 - Not modified
        } else {
          // push passing funcs to arr
          console.log('passed dependencies test')
          if(!passedFuncs.includes(element)){
            passedFuncs.push(element);
          }
        }
        //console.log(listOfErrors);
        //const data = JSON.parse(response.Payload.transformToString());
        //console.log(`Function name: ${element}. Event: ${key}. Data: ${JSON.stringify(data)}`);
      }
      console.log('PASSED testDependecies')
      res.locals.passFuncs = passedFuncs;
      console.log('passedFuncs inside testController', passedFuncs)
      // return next();
    } catch(error) {
        console.log('Error in testController.testDependencies:', error);
        return next({
          log: ('there was a problem in testController.testDependencies. Error: ', error),
          status: 400,
          message: {err: 'Your test failed'}
        })
    }

  }
  
  try {
    await Promise.all(funcNames.map((func, index) => dependenciesFunction(func, index)));
    return next();
    // next();
  } catch (error) {
    return res.status(403).send( error.message );
  }
}


module.exports = testController;