$(document).ready(function(){
    console.log("ready is called");
    changeHref();
    gettingURL();
});

function changeHref () {
    var urlParams = new URLSearchParams(window.location.search);
    var volunteerEmail = urlParams.get('email');
    $(`#linkUser`).attr("href","userpage.html?email=" + volunteerEmail);
}

function addRow (rowID,ID) {
    console.log("addRow is called");
    var delBtn = addDeleteBtn(rowID,ID);
    var doneBtn = addDoneBtn(rowID,ID);
    var InProgressBtn = addInProgressBtn(rowID,ID);
    var changeBtn = addChangeBtn(rowID,ID);
    var code =`<tr id="E${rowID}">
                <th id="E${rowID}0" hidden class="text-center"></th>
                <th id="E${rowID}1" class="text-center"></th>
                <th id="E${rowID}2" class="text-center"></th>
                <th id="E${rowID}3" class="text-center"></th>
                <th id="E${rowID}4" class="text-center"></th>
                <th id="E${rowID}5" class="text-center"></th>
                <th id="E${rowID}6" class="text-center notes"><p id="E${rowID}6p" class="straight"></p></th>
                <th id="E${rowID}7" class="text-center buttons">
                    <div hidden class="buttons" class="text" id="E${rowID}7t"></div>
                    <div class="buttons" id="E${rowID}7d">${doneBtn}</div> 
                    <div class="buttons" id="E${rowID}7i">${InProgressBtn}</div>
                    <div class="buttons" id="E${rowID}7de">${delBtn}</div>
                    <div hidden class="buttons" id="E${rowID}7c">${changeBtn}</div>
                </th>
                </tr>`;
    if (rowID == 1){
        $("#newRows").append(code);
    }
    else {
        $("#newRows").prepend(code);
    }
}



function gettingURL () {
    var urlParams = new URLSearchParams(window.location.search);
    var volunteerEmail = urlParams.get('email');
    var method = 'GET';
    var url = "http://localhost:4000/api/GetAllSelectedOrders?volunteerEmail=" + volunteerEmail;
    callAjax(url,method).
    done(function(data,textStatus,jqXHR) {
        if (data) {
            console.log(data);
            data.forEach(element => {
                var rowID = $(`#ordersTable tr`).length;
                var ID = element.customerID;
                var Name = element.customerFirstName + " " + element.customerLastName;
                var Address = element.customerStreetAddress;
                var goodsNotes = element.goodsNotes;
                var startTime = element.startTime;
                var endTime = element.endTime;
                endTime = timeConvert(endTime);
                startTime = timeConvert(startTime);
                var Date = element.pickupDate.substring(0,10);
                var Status = element.deliveryStatus;

                addRow(rowID,ID);

                if (Status == "done"){
                    $(`#E${rowID}7c`).attr('hidden',false);
                    $(`#E${rowID}7d`).attr('hidden',true);
                    $(`#E${rowID}7i`).attr('hidden',true);
                    $(`#E${rowID}7de`).attr('hidden',true);
                    $(`#E${rowID}7t`).html("done");
                    $(`#E${rowID}7t`).attr('hidden',false);
                }
                if (Status == "In Progress"){
                    $(`#E${rowID}7c`).attr('hidden',false);
                    $(`#E${rowID}7d`).attr('hidden',true);
                    $(`#E${rowID}7i`).attr('hidden',true);
                    $(`#E${rowID}7de`).attr('hidden',true);
                    $(`#E${rowID}7t`).html("In Progress");
                    $(`#E${rowID}7t`).attr('hidden',false);
                }

                $(`#E${rowID}0`).val(ID);
                $(`#E${rowID}1`).html(Name);
                $(`#E${rowID}2`).html(Address);
                $(`#E${rowID}3`).html(startTime);
                $(`#E${rowID}4`).html(endTime);
                $(`#E${rowID}5`).html(Date);
                $(`#E${rowID}6p`).html(goodsNotes);
            });
        };
    });
    /*
    addRow(rowID);
    $(`#E${rowID}1`).html(Name);
    $(`#E${rowID}2`).html(Address);
    $(`#E${rowID}3`).html(startTime);
    $(`#E${rowID}4`).html(endTime);
    $(`#E${rowID}5`).html(Date);
    $(`#E${rowID}6p`).html(goodNotes);
    */
}

//adding all buttons
function addDeleteBtn (rowID,ID) {
    var code = `<button class="btn btn-md btn-primary" onclick="delOrder(${rowID},${ID})" id="deleteBtn${rowID}">&#10060;</button>`;
    return code;
}

function addDoneBtn (rowID,ID) {
    var code = `<button class="btn btn-md btn-primary" onclick="doneOrder(${rowID},${ID})" id="doneBtn${rowID}">&#10004;</button>`;
    return code;
}

function addInProgressBtn (rowID,ID) {
    var code = `<button class="btn btn-md btn-primary" onclick="inProgressOrder(${rowID},${ID})" id="InProgressBtn${rowID}">&#9202;</button>`;
    return code;
}

function addChangeBtn (rowID,ID) {
    var code = `<button class="btn btn-md btn-primary" onclick="changeStatus(${rowID},${ID})" id="changeBtn${rowID}">Change Status</button>`;
    return code;
}

//deleting record out of volunteerdelivery
function delOrder (rowID,ID) {
    console.log("getting into delete");
    var method = "DELETE";
    var url = "http://localhost:4000/api/delSelectedOrder?customerID=" + ID;
    callAjax(url,method);
    $(`#E${rowID}`).remove();
}

//update to In Progress status
function inProgressOrder (rowID,ID) {
    console.log("getting into in progress");
    var method = "PUT";
    var url = "http://localhost:4000/api/updateStatus?customerID=" + ID + "&deliveryStatus=" + "In Progress";
    callAjax(url,method);
    console.log(`#E${rowID}7c`);
    $(`#E${rowID}7c`).attr('hidden',false);
    $(`#E${rowID}7d`).attr('hidden',true);
    $(`#E${rowID}7i`).attr('hidden',true);
    $(`#E${rowID}7de`).attr('hidden',true);
    $(`#E${rowID}7t`).html("In Progress");
    $(`#E${rowID}7t`).attr('hidden',false);
}

function changeStatus (rowID,ID) {
    console.log("getting into change status");
    var method = "PUT";
    var url = "http://localhost:4000/api/updateStatus?customerID=" + ID + "&deliveryStatus=" + "selected";
    callAjax(url,method);
    $(`#E${rowID}7c`).attr('hidden',true);
    $(`#E${rowID}7d`).attr('hidden',false);
    $(`#E${rowID}7i`).attr('hidden',false);
    $(`#E${rowID}7de`).attr('hidden',false);
    $(`#E${rowID}7t`).html("selected");
    $(`#E${rowID}7t`).attr('hidden',true);
}

function doneOrder (rowID,ID) {
    console.log("getting into done");
    var method = "PUT";
    var url = "http://localhost:4000/api/updateStatus?customerID=" + ID + "&deliveryStatus=" + "done";
    callAjax(url,method);
    $(`#E${rowID}7c`).attr('hidden',false);
    $(`#E${rowID}7d`).attr('hidden',true);
    $(`#E${rowID}7i`).attr('hidden',true);
    $(`#E${rowID}7de`).attr('hidden',true);
    $(`#E${rowID}7t`).html("done");
    $(`#E${rowID}7t`).attr('hidden',false);
}

//converting military time to real time
function timeConvert (time){
    console.log("timeConvert is called");
    var timeArray = time.split(':');
    time = timeArray[0] + ":" + timeArray[1];
    
    if (timeArray[0] >= 12) {
             
        time = time + " PM";
        if (timeArray[0] > 12) {
            var newHour = (timeArray[0] % 12).toString();
                
            time = newHour + time.substring(2)
        }
    }
    else{
        time = time + " AM";
    }
    return time;
}

function callAjax(uri, method, formData) {
    return $.ajax({
    url: uri,
    crossDomain:true,
    //dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    accepts:'application/json',
    data: formData,
    type: method
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        $('#info').html('<p>An error has occurred</p>');
        alert('I am in ajax error');
    })
    .always(function(data, textStatus, jqXHR) {
        
        // do any cleanup
    });
}