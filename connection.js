function getHost(){
    var urlparts = window.location.href.split('/');
    var host = urlparts[0] + '//' + urlparts[2] + '/api/';
    // The following line is only needed for local testing
    host = host.replace("8000/api", "5000");
    return host;
}


// Manage refresh token

function setRefreshToken(refreshToken){
    localStorage.setItem("refresh_token_timestamp", Date.now());
    localStorage.setItem("refresh_token", refreshToken);
}

function getRefreshToken(){
    var refreshToken = localStorage.getItem("refresh_token");
    var timestamp = localStorage.getItem("refresh_token_timestamp");

    if (timestamp===null || refreshToken===null){
        location.href = "login.html";
    } else {
        var current = Date.now();  
        var dayDifference = (current-timestamp)/1000/60/60/24;
        if (dayDifference > 29){
            location.href = "sessionexpired.html";
        } else {
            return refreshToken;
        }
    }
}


// Manage access token

function setAccessToken(accessToken){
    sessionStorage.setItem("access_token_timestamp", Date.now());
    sessionStorage.setItem("access_token", accessToken);
}

function accessTokenValid(accessToken){
    var timestamp = sessionStorage.getItem("access_token_timestamp");

    if (timestamp===null || accessToken===null){
        return false;
    } else {
        var current = Date.now();  
        var minDifference = (current-timestamp)/1000/60;
        return minDifference < 14;
    }
}

// Requests 

function sendRequestAfterRefresh(endpoint, requestType, jsonData, onSuccess, onError){
    var refreshToken = getRefreshToken();
    var onSuccessfulRefresh = function(data) {
        accessToken = data["access_token"];
        setAccessToken(accessToken)
        sendAuthenticatedRequest(endpoint, requestType, jsonData, onSuccess, onError, accessToken);
    }
    sendAuthenticatedRequest("refresh", "POST", {}, onSuccessfulRefresh, standardErrorAlert, refreshToken);
}

function sendAuthenticatedRequest(endpoint, requestType, jsonData, onSuccess, onError, token){
    $.ajax({
        url : getHost() + endpoint,
        type : requestType,
        data : JSON.stringify(jsonData),
        dataType: "json",
        contentType: "application/json",
        success : onSuccess,
        error : function(response, error) {
            if (response["status"]==500) {
                onError(response, error)
            } else {
                authorizationErrorAlert(response, error);
            }
        },
		beforeSend: function(xhr) {
			xhr.setRequestHeader("Authorization", "Bearer " + token);
        },
        cached: false
    });
}

function sendRequest(endpoint, requestType, jsonData, onSuccess, onError){
    var accessToken = sessionStorage.getItem("access_token");
    if (accessTokenValid(accessToken)){
        sendAuthenticatedRequest(endpoint, requestType, jsonData, onSuccess, onError, accessToken);
    } else {
        sendRequestAfterRefresh(endpoint, requestType, jsonData, onSuccess, onError);
    }
}


function standardErrorAlert(response, error) {
    alert("Something went wrong.");
}

function authorizationErrorAlert(response, error) {
    localStorage.clear();
    sessionStorage.clear();
    alert("Something went wrong. Try logging in again.");
    location.href = "login.html";
}