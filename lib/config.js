/**
create and export configuration variables
**/

//container for all the environments
var environments = {};


// staging {default} environment
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
   'envName': 'staging',
   'hashingSecret': 'thisIsASecret',
   'maxChecks': 5,
   'twilio':{
     'accountSid':'',
     'authToken':'',
     'fromPhone':''
   },
   'templateGlobals':{
     'appName': 'UptimeChecker',
     'companyName': 'NotARealCompany, Inc',
     'yearCreated':'2018',
     'baseUrl':'http://localhost:3000/'
   }

};

// production environment
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsAlsoASecret',
  'maxChecks': 5,
  'twilio':{
    'accountSid':'',
    'authToken':'',
    'fromPhone':''
  },
  'templateGlobals':{
    'appName': 'UptimeChecker',
    'companyName': 'NotARealCompany, Inc',
    'yearCreated':'2018',
    'baseUrl':'http://localhost:5000/'
  }
};


// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the currentEnvironment is one of the environments above , if not , default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;


// export the module
module.exports = environmentToExport;
