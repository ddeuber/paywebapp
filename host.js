
function getHost(){
    var urlparts = window.location.href.split('/');
    var host = urlparts[0] + '//' + urlparts[2] + '/';
    host = host.replace("8000", "5000");
    return host;
}