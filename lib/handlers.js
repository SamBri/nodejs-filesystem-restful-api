/*
*Request handlers
*
*/


// dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config')

// define the handlers

var handlers = {

};

// users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  }
  else{
    callback(405);
  }
}


// Container for the users submethods
handlers._users = {};

//Users - post
//Required data: firstname, lastname, phone, password, tosAgreement
//Optional data: none

handlers._users.post = function(data, callback){
  // Check that all required fields are filled out.
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true: false;


   if(firstName && lastName && phone && password && tosAgreement){

     //Make sure that the user doesnt already exist.
   _data.read('users', phone, function(err,data){

     if(err){
       // Hash the password
       var hashedPassword = helpers.hash(password);

       // Create the user object
       if(hashedPassword)
       {
         var userObject = {

           'firstName':firstName,
           'lastName': lastName,
           'phone': phone,
           'hashedPassword': hashedPassword,
           'tosAgreement': true
         };

         // store the user
         _data.create('users', phone, userObject, function(err){
           if(!err)
          { callback(200);
            console.log
          }
           else
          { console.log(err);
           callback(500,{'Error':'Could not create the new user'});
         }
         });
       }
       else{
         callback(500,{'Error':'Could not hash user\'s password'})
       }

     }
     else {
       // user already exists
       callback(400, {'Error':'A user with that phone already exists'});
     }
   });

   }
   else {
     callback(400,{'Error': 'Missing required fields'});
   }







};

//Users - get
//Required data: phone
//Optional data: none
// @TODO only let an authenticated user access their object. Don't let them access anyoune
handlers._users.get = function(data, callback){

//Check that phone is valid
var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
if(phone)
{

  //  Get the token from the headers
  var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;
  // verify that the given token is valid for the phone number
  handlers._tokens.verifyToken(token, phone, function(tokenIsValid){

    if(tokenIsValid){
      // lookup the user
      _data.read('users', phone, function(err,data){
        if(!err && data)
        {
          // Remove the hashed password from the user object before returning it to the requester.
          delete data.hashedPassword;
          callback(200, data);
        }
        else {
          callback(404);
        }
      })
    } else{
      callback(403,{'Error':'Missing required token in header, or token is invalid'})
    }
  });


}else {
  callback(400,{'Error': 'Missing required field'});
}

};

//Users - put
// Required data : phone
// Optional data: firstName, lastName, password at least one must be specified;
//@TODO only let an authenticated user update their own object. Don't let them update anyone elses
handlers._users.put = function(data, callback){

//Check for the required field
var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

//Check for the optional fields
var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;


// Error if the phone is invalid
if(phone){

  if(firstName || lastName || password)
  {

    //  Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){

      if(tokenIsValid){

        // lookup the user
        _data.read('users', phone, function(err,userData){

            if(!err && userData)
            {
              //update the fields necessary
              if(firstName)
            { userData.firstName = firstName;}

            if(lastName)
            {
              userData.lastName = lastName;
            }

            if(password){
              userData.hashedPassword = helpers.hash(password);
            }

            // store the new update
            _data.update('users',phone, userData, function(err){
              if(!err)
              {
                callback(200);
              }else{
                console.log(err);
                callback(500,{'Error':'Could not update user'});
              }
            });

            }else{
              callback(400, {'Error':'The specified user does not exist'});
            }

        });

      }else{
        callback(400, {'Error': 'Missing fields to update'});
      }
    });

    }  else{
          callback(403,{'Error':'Missing required token in header, or token is invalid'});
        }
}else{
    callback(400,{'Error':'Missing required field'});
}

};

//Users - Delete
// Required field : phone
// @TODO only let an authenticated user delete their object
handlers._users.delete = function(data, callback){
  // Check that the phone is valid


  //Check for the required field
//  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;


  //Check that phone is valid
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  if(phone)
  {

    //  Get the token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token: false;

    // verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid){

      if(tokenIsValid){

            // lookup the user
            _data.read('users', phone, function(err,data){
              if(!err && data)
              {
                // Remove the hashed password from the user object before returning it to the requester.
                _data.delete('users', phone,function(err,data){
                  if(!err)
                {
                  callback(200);
               }else
               {
                 callback(500,{'Error': 'Could not delete the specified user'});
               }
             });

              }
              else {
                callback(400, {'Error':'Could not find the specified user'});
              }
            })
      }else{
        callback(403,{'Error':'Missing required token in header, or token is invalid'})

      }});


  }else {
    callback(400,{'Error': 'Missing required field'});
  }


};

// tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  }
  else{
    callback(405);
  }
}

//Container for all the tokens methods
handlers._tokens = {};


// Tokens - post
// Required data: phone, password
// Optional data: none
handlers._tokens.post = function(data,callback){

  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

   if(phone && password)
   {
     _data.read('users', phone, function(err, userData){
       if(!err && userData)
       {
         // hash the sent password and compare it to the password stored in the user password
         var hashedPassword = helpers.hash(password);

         if(hashedPassword == userData.hashedPassword)
         {
           //if valid, create a new token with a random name. Set expiration data 1 hour
           var tokenId = helpers.createRandomString(20);
           var expires = Date.now() * 1000 * 60 * 60;
           var tokenObject = {
             'phone': phone,
             'id': tokenId,
             'expires': expires
           };

           // Store the token
           _data.create('tokens', tokenId, tokenObject, function(err){

             if(!err){
               callback(200, tokenObject);
             }else{
               callback(500, {'Error': 'Could not create the new token'});
             }

           });

         }else{
           callback(400,{'Error': 'Password did not match the specified user\'s stored password'})
         }


       }else{
         //console.log(err);
        callback(400,{'Error':'Could not find the specified user'});
       }
     })

   }else{
     callback(400,{'Error': 'Missing required fields'});
   }



};

//Tokens - get
//Required data: id
//Optional data: none
handlers._tokens.get = function(data, callback){
  // Check that the id is valid

  //Check that phone is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id)
  {
    // lookup the user
    _data.read('tokens', id, function(err,tokenData){
      if(!err && tokenData)
      {

        callback(200, tokenData);
      }
      else {
        callback(404);
      }
    })
  }else {
    callback(400,{'Error': 'Missing required field'});
  }

}


//Tokens - put
// Required data: id, extend
//Optional data: none
handlers._tokens.put = function(data, callback){

  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;

  if(id && extend)
  {
    // lookup the token
    _data.read('tokens', id, function(err,tokenData){
      if(!err && tokenData){

        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){

          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          // store the new updates
          _data.update('tokens', id, tokenData, function(err){

            if(!err)
            {
              callback(200,{'tokenData':tokenData});
            }else{
              callback(500,{'Error': 'Could not update the token\'s expiration'});
            }

          });

        }else{
          callback(400,{'Error':'The token has already expired , and cannot be extended'})
        }

      }else{
        callback(400,{'Error': 'specified token does not exist'});
      }
    })

  }else{
    callback(400,{'Error':'Missing required field(s) or fields are invalid'});
  }

};


handlers._tokens.delete = function(data, callback){
  // Check that the ID is valid
 //Check for the required field
 var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

 //Check that phone is valid
 if(id)
 {
   // lookup the user
   _data.read('tokens', id, function(err,data){
     if(!err && data)
     {
       // Remove the hashed password from the user object before returning it to the requester.
       _data.delete('tokens', id,function(err,data){
         if(!err)
       {
         callback(200);
      }else
      {
        callback(500,{'Error': 'Could not delete the specified token'});
      }
    });

     }
     else {
       callback(400, {'Error':'Could not find the specified token'});
     }
   })
 }else {
   callback(400,{'Error': 'Missing required field'});
 }

}

// verify that a given id is valid for a given user
handlers._tokens.verifyToken = function(id,phone, callback){

    // lookup the token
    _data.read('tokens', id, function(err,tokenData){
      if(!err && tokenData)
      {
        // check that the token is valid for the user and has not expired
        if(tokenData.phone == phone && tokenData.expires > Date.now())
        {
          callback(true);
        }else{
          callback(false);
        }

      }else{
        callback(false);
      }
    });
};


handlers.checks = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data,callback);
  }
  else{
    callback(405);
  }
}

// Container for all the checks acceptableMethods
handlers._checks = {};


// Checks - post
// Required data: protocol, url,method, successCodes, setTimeoutSeconds;
//Optional data: none
handlers._checks.post = function(data, callback){
  var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post','get','delete', 'put'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0  ? data.payload.successCodes : false;
  var timeoutSeconds  = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

   if(protocol && url && method && successCodes && timeoutSeconds){

     // Get the token from the headers
     var token = typeof(data.headers.token) == 'string'?data.headers.token : false;

     // lookup the user by reading the token
     _data.read('tokens', token, function(err, tokenData){
       if(!err && tokenData)
       {
         var userPhone = tokenData.phone;

         // lookup the user _data
         _data.read('users', userPhone, function(err, userData){

           if(!err && userData){

             var userChecks = typeof(userData.checks) =='object' && userData.checks instanceof Array ? userData.checks : [];

             // verify that the user has less than maximum number of Checks
             if(userChecks.length < config.maxChecks)
             {
               var checkId = helpers.createRandomString(20);

               // create the check object and include the user userPhone
               var checkObject = {
                 "ID": checkId,
                 "userPhone": userPhone,
                 "url": url,
                 "method": method,
                 "successCodes": successCodes,
                 "timeoutSeconds": timeoutSeconds
               };

               _data.create("checks", checkId, checkObject, function(err){
                 if(!err){
                   // add the check id to the users userObject
                   userData.checks = userChecks;
                   userData.checks.push(checkId);
                   // save the new user data
                   _data.update("users", userPhone, userData, function(err){
                     if(!err)
                     {
                       // return the data about to the new check
                       callback(200, checkObject);

                     }else{
                       callback(500,{'Error':'Could not update the user with the new check'});
                     }
                   })
                 }else{
                   callback(500, {'Error': 'Could not create new check'});
                 }
               })
             }else{
               callback(400,{'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ")"});

             }


           }else {
             callback(403);
           }

         });
       }
       else {
         callback(403);
       }
     });

   }else{
     callback(400,{'Error': 'Missing required inputs or inputs are invalid'});
   }


}




// ping handler
handlers.ping = function(data, callback){
  callback(200);
}

handlers.sample = function(data, callback){
  // Callback a http status code, and  a payload
  callback(406,{'name': 'sample handler'})
};

// Not found handler
handlers.notFound = function(data, callback){
  callback(404);
};






// export the module
module.exports = handlers;
