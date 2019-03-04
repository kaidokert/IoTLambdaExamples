//Log on to Cognito, establish AWS credentials then display the result 
function testLambda(params) {

//	Single user available 'testUser' with password 'Password1';

	var user = params.formUserName.value;
	var pass = params.formPassword.value

	var region = 'us-west-2';
	var userPoolId = 'us-west-2_ktBhKK8jl';
	var cognitoAppId = '5shqas02ss795gogniogta21a9';
	var identityPool = 'us-west-2:c36042db-3359-424c-8bce-08ee013f601e';
	var cognitoLogin = 'cognito-idp.'+region+'.amazonaws.com/'+userPoolId;

	var authenticationData = {
			Username : user,
			Password : pass,
	};

	// Need to provide placeholder keys unless unauthorised user access is enabled for user pool
	AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'})

	var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

	var poolData = {
			UserPoolId : userPoolId,
			ClientId : cognitoAppId
	};
	var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

	var userData = {
			Username : user,
			Pool : userPool
	};

	AWS.config.region = region;

	//Authenticate with Cognito
	cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	cognitoUser.authenticateUser(authenticationDetails, {
		onSuccess: function (result) {
            alert('Sucessful Cognito Log On');
			console.log("Auth success");


            var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {

                    var idToken = result.idToken.jwtToken;

                    //console.log(idToken);

                    //Cognito logon sucessful. Update our configuration with our JWT Token
                    AWS.config.update({
                        credentials: new AWS.CognitoIdentityCredentials({
                            IdentityPoolId: identityPool,
                            Logins: {
                                [cognitoLogin]: idToken
                            }
                        }),
                        region: region
                    });

                    //Now use our cognito logon to get our AWS credentials
                    AWS.config.credentials.get(function (err) {
                        if (err) {
                            alert(err);
                            console.log(err);
                        } else {
                            console.log("Retrieved credentials");

                            //AWS credentials are now established - call the lambda
                            var lambda = new AWS.Lambda();
                            var payload = {}

                            var params = {
                                FunctionName: 'simpleLambda',
                                InvocationType: 'RequestResponse',
                                LogType: 'Tail',
                                Payload: JSON.stringify(payload),
                            };

                            //Invoke the lambda and parse the response
                            lambda.invoke(params, function (err, data) {
                                if (err) {
                                    alert(err);
                                    console.log(err, err.stack);
                                } else {
                                    console.log('Lambda called');
                                    var response = JSON.parse(data.Payload);
                                    alert('Sucessful Cognito Log On. Lambda executed: ' + response.body);
                                }
                            });
                        }
                    });

                }});
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