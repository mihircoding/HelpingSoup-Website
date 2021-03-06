var protocol = "http://";
const config = {
    frontendDomain: protocol + "localhost:5500/",
    backendDomain: protocol + "localhost:4000/"
};

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error"); // change to error text
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message; // changes error to input message
}

function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error"); // removes error class
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = ""; // removes message
}

function finalSubmit(canSubmit, mode){
    var ret = true;
    var selectClass = "";
    switch(mode){
        case 0:
            selectClass = ".form__input";
            break;
        case 1:
            selectClass = ".loginform__input";
            break;
        case 2:
            selectClass = ".forgotform__input";
            break;
    }
    document.querySelectorAll(selectClass).forEach(inputElement => {
        if(inputElement.value.length === 0){
            setInputError(inputElement, "Please enter information here.");
            ret = false;
        }
    });
    if(canSubmit == false) ret = false;
    return ret;
}

document.addEventListener("DOMContentLoaded", () => { // form has loaded
    const loginForm = document.querySelector("#login"); 
    const createAccountForm = document.querySelector("#createAccount");
    const forgotForm = document.querySelector("#forgot");
    var status = document.getElementById("status");
    var canSubmitSignUp = true;
    var signUpPassError = false;
    var emailError = false;
    var zipError = false;

    $(document).on("click", "#linkCreateAccount", e => {
        e.preventDefault(); // preventing href link, or refreshing the page when link clicked
        loginForm.classList.add("form--hidden"); // hiding login form and showing create-account form
        forgotForm.classList.add("form--hidden");
        createAccountForm.classList.remove("form--hidden");
    });

    $(document).on("click", "#linkLogin", e => {
        e.preventDefault(); // preventing href link, or refreshing the page when link clicked
        loginForm.classList.remove("form--hidden"); //hiding create-account form and showing login form
        forgotForm.classList.add("form--hidden");
        createAccountForm.classList.add("form--hidden");
    });

    $(document).on("click", "#linkForgotPassword", e => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        createAccountForm.classList.add("form--hidden");
        forgotForm.classList.remove("form--hidden");
    });

    $(document).on("click", "#loginSubmit", e => {
        e.preventDefault();
        $(status).removeClass();
        $(status).html("");
        var submit = finalSubmit(true, 1);
        if(submit){
            var formData = {
                email: $("#loginEmail").val(),
                password: $("#loginPass").val(),
              }
            $.ajax({
                type: "POST",
                url: config.backendDomain + "volunteerLogin",
                data: formData,
                dataType: "json",
                encode: true,
                success: function(data){
                    if(data.CanLogin == true){
                        console.log("logged in!");
                        $(loginForm).trigger("reset");
                        $(status).addClass('success');
                        $(status).html("Great! You've been logged in!");
                        var url = config.frontendDomain + "frontend/pages/userpage.html?email=" + formData.email;
                        console.log("this is the url " + url);
                        window.location.replace(url);
                    }
                    else{
                        console.log("didn't work!");
                        alert("Sorry, this username and password combination is incorrect. Please try again.");
                    }
                },
                error: function(data){
                    console.log("error");
                    $(loginForm).trigger("reset");
                    alert("Sorry, an error has occurred. Please try again later.");
                }
              });
        }
        else{
            console.log("Can't  submit!");
            alert("Sorry, an error occurred with your inputs. Please try again.");
        }
    });

    $(document).on("click", "#forgotSubmit", e => {
        e.preventDefault();
        $(status).removeClass();
        $(status).html("");
        var submit = finalSubmit(true, 2);
        if(submit){
            var formData = {
                email: $("#forgotEmail").val(),
            };
            $.ajax({
                type: "POST",
                url: config.backendDomain + "forgotPasswordEmail",
                data: formData,
                dataType: "json",
                encode: true,
                success: function(data){
                    if(data.success == true){
                        console.log("success!");
                        $(forgotForm).trigger("reset");
                        $(status).addClass('success');
                        $(status).html("Great! An email has been sent to this address. Check your spam email if you do not see it.");
                    }
                    else{
                        console.log("didn't work!");
                        $(forgotForm).trigger("reset");
                        alert("Sorry, this email does not exist within our records. Please try again.");
                    }
                },
                error: function(data){
                    console.log("error");
                    $(loginForm).trigger("reset");
                    alert("Sorry, an error has occurred. Please try again later.");
                }
              });
        }
        else{
            console.log("Can't  submit!");
            alert("Sorry, an error occurred with your inputs. Please try again.");
        }
    });

    $(document).on("click", "#signUpSubmit", e => {
        e.preventDefault();
        $(status).removeClass();
        $(status).html("");
        var optIn = false;
        var submit = finalSubmit(canSubmitSignUp, 0);
        if(submit) {
            if(document.getElementById('emailOpt').checked){
                optIn = true;
            }
            var formData = {
                firstName: $("#firstName").val(),
                lastName: $("#lastName").val(),
                email: $("#email").val(),
                address: $("#address").val(),
                city: $("#city").val(),
                state: $("#state").val(),
                zip: $("#zip").val(),
                school: $("#school").val(),
                password: $("#password").val(),
                emailOpt: optIn
              };
            $.ajax({
                type: "POST",
                url: config.backendDomain + "volunteerSignUp",
                data: formData,
                dataType: "json",
                encode: true,
                success: function(data){
                    if(data.success == true){
                        console.log("success!");
                        $(createAccountForm).trigger("reset");
                        $(status).addClass('success');
                        $(status).html("Great! Your account has been made!");
                    }
                    else{
                        console.log("email already in use");
                        alert("Sorry, that email is already in use. Please try again.");
                    }
                },
                error: function(data){
                    console.log("error");
                    $(createAccountForm).trigger("reset");
                    alert("Sorry, an error occurred with your inputs. Please try again.");
                }
              });
        }
        else {
            console.log("Can't submit!");
            alert("Sorry, an error occurred with your inputs. Please try again.");
        }
        optIn = false;
    });

    document.querySelectorAll(".form__input, .forgotform__input, .loginform__input").forEach(inputElement => { // looks at all form__input classes
        inputElement.addEventListener("blur", e => { // when user inputs something then clicks off
            if ((e.target.id === "confirmPassword" || e.target.id === "password") && (($("#confirmPassword").val().length > 0 && $("#password").val().length > 0) && $("#confirmPassword").val() !== $("#password").val())) {
                setInputError(inputElement, "Please make sure your passwords match."); // calls setInputError method
                canSubmitSignUp = false;
                signUpPassError = true;
            }
            if(e.target.id === "zip" && (e.target.value.length > 0 && (e.target.value.match(/^[0-9]+$/) == null || e.target.value.length != 5))){
                setInputError(inputElement, "Please make sure you inputted your zip code in the correct format.");
                canSubmitSignUp = false;
                zipError = true;
            }
            var re = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
            if(e.target.id === "email" && (e.target.value.length > 0 && !re.test(e.target.value))){
                setInputError(inputElement, "Please make you inputted your email address in the correct format.");
                canSubmitSignUp = false;
                emailError = true;
            }
            //console.log("errors " + errors + " canSubmit " + canSubmit);
        });

        inputElement.addEventListener("input", e => { // when user types again
            if(inputElement.id == "password" || inputElement.id == "confirmPassword"){
                var p1 = document.querySelector("#password");
                var p2 = document.querySelector("#confirmPassword");
                clearInputError(p1);
                clearInputError(p2);
                signUpPassError = false;
            }
            else if(inputElement.id == "zip"){
                clearInputError(inputElement);
                zipError = false;
            }
            else if(inputElement.id == "email"){
                clearInputError(inputElement);
                emailError = false;
            }
            else{
                clearInputError(inputElement);
            }
            if((!signUpPassError) && (!zipError && !emailError)) canSubmitSignUp = true;
            //console.log("errors " + errors + " canSubmit " + canSubmit);
        });
    });
});