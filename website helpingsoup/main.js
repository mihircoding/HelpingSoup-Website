window.addEventListener("DOMContentLoaded",function () {
    var form = document.getElementById("my-form") //my-form variable in html
    var status = document.getElementById("status") // status id in html

    function emailorphoneshower() {
        var chkYes = document.getElementById("chkYes");
        var chkNo = document.getElementById('chkNo');
        var emailaddress = document.getElementById("emailaddress");
        var phonenumber = document.getElementById('phonenumber')
        emailaddress.style.display = chkYes.checked ? "block" : "none";
        phonenumber.style.display = chkNo.checked ? "block" : "none";
    }
    //success and error functions after forms is submitted
    function success() {
        form.reset();
        status.classList.add('success');
        status.innerHTML = "Thanks!";
    }
    //filling inside of html error
    //monkey
    function error() {
        status.classList.add('error');
        status.innerHTML = "An error has occured"
    }


    form.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var data = new FormData(form);
        ajax(form.method, form.action, data, success, error)
    });
});

//method for checking status of site data
function ajax(method, url, data, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.open(method,url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        if (xhr.status == 200) {
            success(xhr.response, xhr.responseType);
        } else {
            error(xhr.status,xhr.response,xhr.responseType);
        }
    };
    xhr.send(data);
}