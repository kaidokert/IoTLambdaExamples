//Log on to Cognito, establish AWS credentials then display the result 
function testLogon(params) {
	
//	Single user available 'testUser' with password 'Password1';
	
	var user = params.formUserName.value;
	var pass = params.formPassword.value
	
	var region = 'eu-west-2';
	var userPool = 'eu-west-2_6Qk8UHkl5';
	var cognitoAppId = '41pboo7igtsbm6bfi18sje5p96';
	var identityPool = 'eu-west-2:72c461e0-ca5f-47ce-882e-bee6cc92812b';
	var cognitoLogin = 'cognito-idp.'+region+'.amazonaws.com/'+userPool;
	
	var authenticationData = {
        Username : user,
        Password : pass,
    };

	// Need to provide placeholder keys unless unauthorised user access is enabled for user pool
	AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})

	var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

	var poolData = {
			UserPoolId : userPool,
			ClientId : cognitoAppId
	};
	var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

	var userData = {
			Username : user,
			Pool : userPool
	};
	
	AWS.config.region = region;

	//Authenticate with Cognito
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var accessToken = result.getAccessToken().getJwtToken();
            var idToken = result.idToken.jwtToken;
            
            //console.log(idToken);
            
            //Cognito logon sucessful. Update our configuration with our JWT Token
            AWS.config.update({
	              credentials: new AWS.CognitoIdentityCredentials({
	              	IdentityPoolId: identityPool,
	                Logins: {
	                	[cognitoLogin] : result.getIdToken().getJwtToken()
	                }
	              }),
	              region: region
	            });
            
            //Now use our cognito logon to get our AWS credentials
            AWS.config.credentials.get(function(err) {
				if (err) {
					console.log(err);
				} else {
					console.log("Retrieved credentials");
					alert('Sucessful Cognito Log On. AWS credentials established.');
				}
			});
        },

        //Login failure
        onFailure: function(err) {
            alert(err);
        },
        
        //New password flow. Only used for first log in
	    newPasswordRequired: function(usrAttributes, requiredAttributes) {	    	
	    	alert('New password required');
	    	delete usrAttributes.email_verified;
	    	cognitoUser.completeNewPasswordChallenge('Password1', usrAttributes, this);
	    }
    });
 }