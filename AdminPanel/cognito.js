var cognitoUser;

const region = 'us-west-2';

AWS.config.region = region;

const userPoolId = 'us-west-2_ktBhKK8jl';
const cognitoAppId = '5shqas02ss795gogniogta21a9';
const identityPool = 'us-west-2:d451301b-ac1f-401c-91e3-5d3c8182950c';
const cognitoLogin = 'cognito-idp.'+region+'.amazonaws.com/'+userPoolId;

//Log on to Cognito then display the result
function cognitoLogon(params) {

//	Single user available 'testUser' with password 'Password1';

	var user = params.formUserName.value;
	var pass = params.formPassword.value

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

			var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
			cognitoUser.authenticateUser(authenticationDetails, {
				onSuccess: function (result) {
					var idToken = result.idToken.jwtToken;

//					console.log(idToken);

					//Cognito logon sucessful. Update our configuration with our JWT Token
					AWS.config.update({
						credentials: new AWS.CognitoIdentityCredentials({
							IdentityPoolId: identityPool,
							Logins: {
								[cognitoLogin] : idToken
							}
						}),
						region: region
					});
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

function changeAttributeValue(params) {
	if (cognitoUser === undefined) {
		alert('Not logged in');
		return;
	}

	AWS.config.credentials.get(function(err) {
		if (err) {
			alert(err);
			console.log(err);
		} else {

			const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider({
				apiVersion: '2016-04-18'
			});

			var attributeList = [];
			var attribute = {
					Name : 'custom:'+params.formAttribute.value,
					Value : params.formAttributeValue.value
			};

			attributeList.push(attribute);

			cognitoidentityserviceprovider.adminUpdateUserAttributes( {
				UserAttributes: attributeList,
				UserPoolId: userPoolId,
				Username: params.formUser.value
			},
			function(err, data) {
				if (err){
					alert("Error updating attributes: "+err);
				} else {
					alert("Updated attribute");
				}
			}
			);
		}
	});
}