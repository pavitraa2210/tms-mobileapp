const API_URL = "https://tms.shipmentx.com/driverapiv4";
const SESSION_DRIVER = "shipmentx.driver";
const TRIP_SELECTED = "item";
const SHIP_DOC_TYPES = "doc_types";
const LOCATIONS = "updatedLocation";
running_uploads = 0;
/*Swipe Functionality*/
(function() {
    var supportTouch = $.support.touch,
            scrollEvent = "touchmove scroll",
            touchStartEvent = supportTouch ? "touchstart" : "mousedown",
            touchStopEvent = supportTouch ? "touchend" : "mouseup",
            touchMoveEvent = supportTouch ? "touchmove" : "mousemove";
    $.event.special.swipeupdown = {
        setup: function() {
            var thisObject = this;
            var $this = $(thisObject);
            $this.bind(touchStartEvent, function(event) {
                var data = event.originalEvent.touches ?
                        event.originalEvent.touches[ 0 ] :
                        event,
                        start = {
                            time: (new Date).getTime(),
                            coords: [ data.pageX, data.pageY ],
                            origin: $(event.target)
                        },
                        stop;
                function moveHandler(event) {
                    if (!start) {
                        return;
                    }
                    var data = event.originalEvent.touches ?
                            event.originalEvent.touches[ 0 ] :
                            event;
                    stop = {
                        time: (new Date).getTime(),
                        coords: [ data.pageX, data.pageY ]
                    };
                    /*prevent scrolling*/
                    if (Math.abs(start.coords[1] - stop.coords[1]) > 10) {
                        event.preventDefault();
                    }
                }
                $this
                        .bind(touchMoveEvent, moveHandler)
                        .one(touchStopEvent, function(event) {
                    $this.unbind(touchMoveEvent, moveHandler);
                    if (start && stop) {
                        if (stop.time - start.time < 1000 &&
                                Math.abs(start.coords[1] - stop.coords[1]) > 30 &&
                                Math.abs(start.coords[0] - stop.coords[0]) < 75) {
                            start.origin
                                    .trigger("swipeupdown")
                                    .trigger(start.coords[1] > stop.coords[1] ? "swipeup" : "swipedown");
                        }
                    }
                    start = stop = undefined;
                });
            });
        }
    };
    $.each({
        swipedown: "swipeupdown",
        swipeup: "swipeupdown"
    }, function(event, sourceEvent){
        $.event.special[event] = {
            setup: function(){
                $(this).bind(sourceEvent, $.noop);
            }
        };
    });
})();

/*signature draw function*/
(function() {
    window.requestAnimFrame = (function(callback) {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
    var canvas = document.getElementById("sig-canvas");
    var ctx = canvas.getContext("2d");
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 0;
    var drawing = false;
    var mousePos = {
      x: 0,
      y: 0
    };
    var lastPos = mousePos;
    canvas.addEventListener("mousedown", function(e) {
      drawing = true;
      lastPos = getMousePos(canvas, e);
    }, false);
  
    canvas.addEventListener("mouseup", function(e) {
      drawing = false;
    }, false);
      canvas.addEventListener("mousemove", function(e) {
      mousePos = getMousePos(canvas, e);
    }, false);
      /*Add touch event support for mobile*/
    canvas.addEventListener("touchstart", function(e) {
  
    }, false);
    canvas.addEventListener("touchmove", function(e) {
      var touch = e.touches[0];
      var me = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(me);
    }, false);
  
    canvas.addEventListener("touchstart", function(e) {
      mousePos = getTouchPos(canvas, e);
      var touch = e.touches[0];
      var me = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvas.dispatchEvent(me);
    }, false);
  
    canvas.addEventListener("touchend", function(e) {
      var me = new MouseEvent("mouseup", {});
      canvas.dispatchEvent(me);
    }, false);
  
    function getMousePos(canvasDom, mouseEvent) {
      var rect = canvasDom.getBoundingClientRect();
      return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top
      }
    }
  
    function getTouchPos(canvasDom, touchEvent) {
      var rect = canvasDom.getBoundingClientRect();
      return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
      }
    }
  
    function renderCanvas() {
      if (drawing) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        lastPos = mousePos;
      }
    }
  
    /*Prevent scrolling when touching the canvas*/
    document.body.addEventListener("touchstart", function(e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchend", function(e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
    document.body.addEventListener("touchmove", function(e) {
      if (e.target == canvas) {
        e.preventDefault();
      }
    }, false);
  
    (function drawLoop() {
      requestAnimFrame(drawLoop);
      renderCanvas();
    })();
  
    function clearCanvas() {
      canvas.width = canvas.width;
    }
  
    var clearBtn = document.getElementById("sig-clearBtn");
    var submitBtn = document.getElementById("sig-submitBtn");
    clearBtn.addEventListener("click", function(e) {
        clearCanvas();
        /*sigText.innerHTML = "Data URL for your signature will go here!";
        sigImage.setAttribute("src", "");*/
    }, false);

    submitBtn.addEventListener("click", function(e) {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        var dataUrl = canvas.toDataURL();
    /*  sigText.innerHTML = dataUrl;
      sigImage.setAttribute("src", dataUrl);
        console.log(dataUrl)*/
        sendSigToMilestone(dataUrl)
    }, false);
  
  })();

/*Common functions starts here*/
function setOS() {
    if(/android/i.test(navigator.userAgent)) {
        sessionStorage.setItem('OS', 'Android')
    }else if(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        sessionStorage.setItem('OS', 'iOS')
    }else {
        sessionStorage.setItem('OS', 'Linux')
    } 
}

function getOS() {
    return sessionStorage.getItem('OS') 
}

function camelCase(str) {
    str = str.toLowerCase();
    arr =  str.split(' ');
    str_new = '';
    for ( j =0 ; j<arr.length; j++) {
        arr[j] = arr[j].replace(arr[j].charAt(0), arr[j].charAt(0).toUpperCase());        
        str_new += arr[j] + ' ';
    }
    return str_new;
}

function logOut() {
    clearSession();
    window.location = "login.html"
}

function saveUser(userJson){
    sessionStorage.setItem(SESSION_DRIVER, JSON.stringify(userJson));
    localStorage.setItem(SESSION_DRIVER, JSON.stringify(userJson))
}

function getUser(){
    var user = null;
    user = JSON.parse(sessionStorage.getItem(SESSION_DRIVER));
    user = JSON.parse(localStorage.getItem(SESSION_DRIVER));
    return user;
}

function getDriverImei() {
    if(isDriverLoggedIn()) {
        console.log('IMEI: ', getUser().imei)
        return getUser().imei
    }
    return "";
}

function getSelectedTrip() {
    var trip = null;
    trip = JSON.parse(sessionStorage.getItem(TRIP_SELECTED));
    return trip;
}

function getShipmentDocTypes() {
    var docs = null;
    docs = JSON.parse(sessionStorage.getItem(SHIP_DOC_TYPES));
    return docs;
}

function clearSession() {
    sessionStorage.clear();
    localStorage.clear();
}

function isDriverLoggedIn() {
    var user = getUser();
    return (user != null && user.id != null)
}

function getTimeZone() {
    var user = getUser();
    return user.timzone;
}

function warning(message, desc) {
    var icon = "./assets/img/popup-warning-icon.svg";
    createPopup(message, desc, icon)
}

function success(message, desc, location, icon="./assets/img/status_check_ver.svg") {
    /*var icon = "./assets/img/order-accepted.svg"
    var icon = "./assets/img/status_check_ver.svg";*/
    createPopup(message, desc, icon, location)
}

function error(message, desc, location) {
    var icon = "./assets/img/popup-error-icon.svg"
    createPopup(message, desc, icon, location)
}

function confirmation(head, desc, target_function) {
    var body = document.getElementsByTagName("BODY")[0];
    var div = document.createElement('div');
    div.className = 'popup-bg';
    div.id = 'confirm';
    div.innerHTML +=
    `<div class="popup confirm">
        <div class="text-head">${head}</div>
        <div class="text-detail">${desc}</div>
        <div class= "td-50 confirm-btn yes" onclick="closeConfirm(true, ${target_function})">Yes</div>
        <div class="vertical-line"></div>
        <div class= "td-50 confirm-btn no" onclick="closeConfirm(false, ${target_function})">No</div>
    </div>`;
    body.appendChild(div);
}

function closeConfirm(response, target_function) {
    console.log(target_function)
    if(response) {
        target_function();
    }
    document.getElementById('confirm').remove();
}

function createPopup(head, desc, icon, location) {
    var body = document.getElementsByTagName("BODY")[0];
    var div = document.createElement('div');
    div.className = 'popup-bg';
    div.id = 'popup';
    div.innerHTML +=
    `<div class="popup">
        <div class="icon">
            <img src=${icon} height=72 width=72 />
        </div>
        <div class="text-head">${head}</div>
        <div class="text-detail">${desc}</div>
        <div class= "popup-btn" onclick="closePopup('${location}')">OK</div>
    </div>`;
    body.appendChild(div);
}

function closePopup(location) {
    document.getElementById('popup').remove();
    if(location != 'undefined') {
        window.location=location;
    }
}

function get_date(timestamp, timezone) {
    const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    date_time = new Date(timestamp * 1000).toLocaleString("en-US", {timeZone: timezone})
    date = date_time.split(",")[0].split("/");
    date_str = date[1] + " " + MONTHS[date[0]] + ", " + date[2]%100;
    return date_str;
}

function get_time(timestamp, timezone) {
    date_time = new Date(timestamp * 1000).toLocaleString("en-US", {timeZone: timezone})
    time = date_time.split(",")[1].split(":");
    time_str = time[0]+":"+time[1]+ " " + time[2].split(" ")[1];
    return time_str;
}

function getLatLng() {
    loc = JSON.parse(sessionStorage.getItem(LOCATIONS))
    if (loc == null)
        loc = JSON.parse(localStorage.getItem(LOCATIONS))
    return loc
}

function setLatLng(latitude, longitude) {
    lat_lng = {
        "latitude": latitude,
        "longitude": longitude
    }
    sessionStorage.setItem(LOCATIONS, JSON.stringify(lat_lng));
    localStorage.setItem(LOCATIONS, JSON.stringify(lat_lng));
    console.log('set cordinates: ', latitude, longitude)
}

/*starts the location fetching in both Android and IOS device if any active shipments is 
there for the driver*/
function startLocationService() {
    /*if(locationServiceEnabled) 
        return
    locationServiceEnabled = true*/
    if(getOS() == 'Android') {
        Android.startLocationService('location service started from webview')
        console.log('Android')
    } 
    if(getOS() == 'iOS') {
        window.webkit.messageHandlers.startLocationService.postMessage({ message: "start"})
        console.log('iOS')
    }
}

function show_loader(text="Loading...", type) {
    if (document.getElementById('loading') != null) {
        let container = document.getElementById('loading-container')
        var loader = 
        `<div id="${type}-encloser">
            <div id="file-name-${type}" class="text-loading">
                Uploading: ${text}
            </div>
            <div id="percent-text-${type}" class="text-loading" style="font-size: 20px">
                0%
            </div>
            <div id="progressbar">
                <div id="progressbar-progress-${type}"></div>
            </div>
        </div>`;
        container.innerHTML += loader
        $("#loading-container").css("top", `${screen.height/2 - running_uploads*40}px`);
        return 
    }

    let body = document.getElementsByTagName('BODY')[0]
    var loader = 
    `<div id="loading">
        <div class="popup-bg">
            <div id="loading-container" class="center-loading">
                <div id="${type}-encloser">
                    <div id="file-name-${type}" class="text-loading">
                        Uploading: ${text}
                    </div>
                    <div id="percent-text-${type}" class="text-loading" style="font-size: 20px">
                        0%
                    </div>
                    <div id="progressbar">
                        <div id="progressbar-progress-${type}"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
    body.innerHTML += loader
    return 
}

function hide_loader_with_bg() {
    document.getElementById('loading').remove();
}

function hide_loader(type) {
    console.log(document.getElementById(`${type}-encloser`))
    document.getElementById(`${type}-encloser`).remove();
}

/*AJAX Calls starts here*/
function startMultipleShipments(shipments, lat, lng) {
    var driver = getUser();
    var data_send = {
        "driver_id": driver.id,
        "shipments": shipments,
        "imei": driver.imei,
        "latitude": lat,
        "longitude": lng,
        "timezone": driver.timezone   
    }
    console.log('datasend', data_send)
    $.ajax({
        "url": API_URL+"/startMultipleShipments",
        "method": "POST",
        "data": data_send,
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                success('Order Accepted', 'Great Let\'s start our journey.!', "dashboard.html", icon="./assets/img/order-accepted.svg");
            } else {
                error('Something went wrong!', data.data);
            }
        },
        error:function(data) {
            if(data.status == 1){
                console.log(data);
            } else {
                error('Something went wrong!', 'Something seems broken from our side!')
            }
        }
    })
}

function driverLogin(mobile, password, token, imei, mobile_number) {
    $.ajax({
        url: API_URL + "/driverLogin",
        method: "POST",
        data: {
            mobile: mobile,
            password: password,
            token: token,
            imei: imei,
            mobile_number: mobile_number,
        },
        dataType: "JSON",
        success: function (data) {
            if (data.status == 1) {
                saveUser(data.data)
                window.location = "././dashboard.html";
            } else {
                error(data.message, 'Invalid Mobile or Password!')
            }
        },
    });
}

function getshipments(type) {
    var driver = getUser();
    var search="";
    $.ajax({
        "url": API_URL+"/getshipments",
        "method": "POST",
        "data": {
          "driver_id": driver.id,
          "search": search,
          "type": type,
          "imei": driver.imei,
        },
        dataType:"JSON",
        success:function(data){
          if(data.status == 1){
              populate_data(data, type);
          } else {  
                if(type == 2) 
                    show_empty_completed_shipments()
                else 
                    show_empty_shipments()
    
          }
        }
      }) 
}

function getshipmentstops(shift_id, shift_veh_id, trip_id, caller) {
    $.ajax({
        "url": API_URL+"/getshipmentstops",
        "method": "POST",
        "data": {
            "shift_id": shift_id,
            "shift_veh_id": shift_veh_id,
            "trip_id": trip_id,        
        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                switch(caller) {
                    case 'shipment_acceptance':
                        populate_data(data.data);
                        process_data(data);
                        break;
                    case 'shipment_status_view':
                        fill_pickup_drop_values(data.data)
                        break;
                    case 'shipment_milestone':
                        populate_data_milestone(data.data)
                        break;
                    default:
                        break;
                }
            }
        }
    })
}


function getshipstatuses(trip_id, timezone, caller,  stop_id, shipment_id, stop_detail_id, ) {
    console.log(trip_id, timezone, shipment_id, stop_id, stop_detail_id)
    $.ajax({
        "url": API_URL+"/getshipstatuses",
        "method": "POST",
        "data": {
            "timezone": timezone,
            "trip_id": trip_id,  
            "shipment_id": shipment_id,
            "stop_id": stop_id,  
            "stop_detail_id": stop_detail_id,       
        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                console.log('getshipstatuses' ,data);
                if(caller == 'milestone')
                    changeStatusButton(data.data, stop_id)
                else
                    populate_status(data.data);
            } else {
                error('Empty List!', 'Nothing to show');
            }
        }
    })
}

function closeTrip(trip_id, driver_id, timezone) {
    console.log(trip_id, driver_id, timezone)
    $.ajax({
        "url": API_URL+"/closeTrip",
        "method": "POST",
        "data": {
            "trip_id": trip_id,   
            "driver_id": driver_id,
            "timezone": timezone,
        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                success('Trip Closed!', 'Suceessfully completed Trip.', "dashboard.html")
            } else {
                error('Empty List!', 'Nothing to show');
            }
        }
    })
}

function setshipAbort(trip_id, driver_id, timezone, latitude, longitude, reason, type, vehicle_id, shipment_id) {
    console.log("abort", trip_id, driver_id, timezone, latitude, longitude, reason, type, vehicle_id, shipment_id)
    $.ajax({
        "url": API_URL+"/setshipAbort",
        "method": "POST",
        "data": {
            "trip_id": trip_id,   
            "driver_id": driver_id,
            "timezone": timezone,
            "latitude": latitude,
            "longitude": longitude,   
            "reason": reason,
            "type": type,
            "vehicle_id": vehicle_id,
            "shipment_id": shipment_id,

        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                success('Trip Aborted!', 'Suceessfully aborted this trip.', "dashboard.html")
            } else {
                console.log('error' ,data);
                error('Error!', data.data);
            }
        }
    })
}

function rescheduleShift(date, reason) {
    data = getSelectedTrip();
    data.reason = reason
    data.reschedule_date = date
    data = JSON.stringify(data)
    console.log("rescheduleShift", date, reason)
    $.ajax({
        "url": API_URL+"/rescheduleShift",
        "method": "POST",
        "data": {
            data
        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                success('Trip Reschedule Requested!', 'You will be notified about Acceptance or Denial of request', "dashboard.html")
            } else {
                console.log('error' ,data);
                error('Error!', data.data);
            }
        }
    })
}

function setShipReject(reason) {
    trip_data = getSelectedTrip();
    data = {}
    data.trip_id = trip_data.id
    data.latitude = trip_data.slat
    data.longitude = trip_data.slng
    data.reason = reason
    data.type = trip_data.type
    data.vehicle_id = trip_data.vehicle_id
    data.driver_id = trip_data.driver_id
    data.shipment_id = trip_data.shift_id
    data = JSON.stringify(data)
    $.ajax({
        "url": API_URL+"/setShipReject",
        "method": "POST",
        "data": {
            data
        },
        dataType:"JSON",
        success:function(data) {
            if(data.status == 1){
                success('Trip Rejected!', 'You have successfully rejected this trip', "dashboard.html")
            } else {
                console.log('error' ,data);
                error('Error!', data.data);
            }
        }
    })
}

function get_parties_data(user_id, dropdown, value, caller_id) {
    if(value.length > 1) {
        $.ajax({
            "url": API_URL+"/parties",
            "method": "POST",
            "data": {
                "user_id": user_id,
                "name": value,
            },
            dataType:"JSON",
            success:function(response){
                if(response.status == 1){
                    fill_dropdown(response.data, dropdown, caller_id);
                } else {
                    clear_dropdown(dropdown);
                }
            }
        })
    } 
}

function drivercollection(data) {
    driver = getUser();
    $.ajax({
        "url": API_URL+"/drivercollection",
        "method": "POST",
        "data": {
            "driver_id": driver.id, 
            "user_id": driver.user_id,
            "imei": driver.imei,
            "customer_id":driver.customer_id,
            "data": data 
        },
        success:function(data) {
            if(data.status == 1){
                success('Shipment Collected!', 'You have successfully collected Shipment', "dashboard.html")
            } else {
                error('Error!' ,data.data);
            }
        }
    })
}

function getshipmentdocuments(shipment_id, stop_id) {
    console.log('getshipmentdocuments', shipment_id, stop_id)
    $.ajax({
        "url": API_URL+"/getshipmentdocuments",
        "method": "POST",
        "data": {
            "shipment_id": shipment_id, 
            "stop_id": stop_id
        },
        success:function(data) {
            if(data.status == 1){
                populate_docs(data.data, stop_id)
            } else {
                error('Error!' ,data.data);
            }
        }
    })
}

function updatepassword(new_password) {
    $.ajax({
        "url": API_URL+"/updatepassword",
        "method": "POST",
        "data": {
            "driver_id": getUser().id, 
            "user_id": getUser().user_id,
            "newpassword": new_password
        },
        success:function(data) {
            if(data.status == 1){
                success('Password Changed!', 'Your password is successfully updated.', 'profile.html')
            } else {
                error('Error!' ,data.data);
            }
        }
    })
}

function setShipstopStatus(status, latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, 
    driver_id, stop_detail_type, status_type, timezone, fileName, file, signName, sign, camName, cam, 
    cam_orientation, file_orientation) {
        console.log('setShipstopStatus' ,status, latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, 
        driver_id, stop_detail_type, status_type, timezone, fileName, file, signName, sign, camName, cam, 
        cam_orientation, file_orientation)
    if(fileName != '') {
        uploadFile(latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, 
            driver_id, stop_detail_type, '2', timezone, fileName, file, 'file', file_orientation)
    }
    if(signName != '') {
        uploadFile(latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, 
            driver_id, stop_detail_type, '1', timezone, signName, sign, 'sign', -2)
    }
    if(camName != '') {
        uploadFile(latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, 
            driver_id, stop_detail_type, '2', timezone, camName, cam, 'cam', cam_orientation)
    }
    if(status == 1)
        return 

    data_to_send = {
        "status": status,
        "latitude": latitude,
        "longitude": longitude,
        "trip_id": trip_id,
        "shipment_id": shipment_id,
        "stop_id": stop_id,
        "employee_id": employee_id,
        "stop_type": stop_type,
        "driver_id": driver_id,
        "stop_detail_type": stop_detail_type,
        "status_type": status_type,
        "timezone": timezone
    }
    callSetShipstopStatus(data_to_send)
}

function callSetShipstopStatus(data_send) {
    $.ajax({
        "url": API_URL+"/setShipstopStatus",
        "method": "POST",
        "data": data_send,
        success:function(data) {
            console.log(data)
            try {
                data = JSON.parse(data)
            } catch {}
            if(data.status == 1){
                success('Status Updated!', 'Shipment status is successfully updated.', 'shipment_milestone.html')
            } else {
                error('Error!', data.data);
            }
        }
    })
}

function uploadFile(latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, driver_id, 
    stop_detail_type, status_type, timezone, fileName, file, type, image_orientation) {
        running_uploads += 1
        show_loader(fileName, type)
        console.log('sendingFileToServer', latitude, longitude, trip_id, shipment_id, stop_id, employee_id, stop_type, driver_id, 
            stop_detail_type, status_type, timezone, fileName, file, type, image_orientation)
    var fd = new FormData();
    fd.append("file_name", file, fileName);
    fd.append("latitude", latitude);
    fd.append("longitude", longitude);
    fd.append("trip_id", trip_id);
    fd.append("shipment_id", shipment_id);
    fd.append("stop_id", stop_id);
    fd.append("employee_id", employee_id);
    fd.append("stop_type", stop_type);
    fd.append("driver_id", driver_id);
    fd.append("stop_detail_type", stop_detail_type);
    fd.append("status_type", status_type);
    fd.append("timezone", timezone);
    fd.append("image_orientation", image_orientation);
    
    /*for updating status once all files are uploaded*/
    var data_to_send_new = {
        "status": 1,
        "latitude": latitude,
        "longitude": longitude,
        "trip_id": trip_id,
        "shipment_id": shipment_id,
        "stop_id": stop_id,
        "employee_id": employee_id,
        "stop_type": stop_type,
        "driver_id": driver_id,
        "stop_detail_type": stop_detail_type,   
        "status_type": '1',
        "timezone": timezone
    }

    $.ajax({
        xhr: function() {
            var xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    var percentComplete = (evt.loaded / evt.total) * 100;
                    /*Place upload progress bar visibility code here*/
                    percentComplete = parseInt(percentComplete * 100)/100
                    document.getElementById(`progressbar-progress-${type}`).style = `width: ${percentComplete}%`
                    document.getElementById(`percent-text-${type}`).innerHTML = `${percentComplete}%`
                }
            }, false);
            return xhr;
        },
        "url": API_URL+"/setShipstopStatus",
        "method": "POST",
        "data": fd,
        "processData": false,
        "contentType": false,
        success:function(data) {
            hide_loader(type)
            running_uploads -= 1
            console.log('running_uploads', running_uploads)
            if (running_uploads == 0) {
                callSetShipstopStatus(data_to_send_new)
                hide_loader_with_bg()
            }
            try {            
                data = JSON.parse(data)
            } catch { }
            console.log(data)
            if(data.status == 1){
                console.log('setShipstopStatus', data)
                if(getOS() == 'Android')
                    Android.showToast(fileName + ' uploaded Successfully!')
                else if (getOS() == 'iOS')
                    window.webkit.messageHandlers.showMessage.postMessage({ message: fileName + ' uploaded Successfully!'})
                else
                    console.log(fileName + 'uploaded')
            } else {
                error('Error!' ,data.data);
            }
        }
    })
} 

function addrtdrivelocations(latitude, longitude, speed, battery, accuracy, bearing)
{
    setLatLng(latitude, longitude)
    driver = getUser()
    var location = {
        'latitude': latitude,
        'longitude': longitude,
        'mobileimei': getUser().imei,
        'timestamp': parseInt(Date.now()/1000),
        'speed': speed,
        'accuracy': accuracy,
        'battery': battery,
        'bearing': bearing,
        'driver_id': driver.id,
        'trip_id': driver.trip_id,
        'vehicle_id': driver.vehicle_id
    }
    var locations = [location]
    locations = JSON.stringify(locations)
    data = {
        'locations': locations
    }
    data  = JSON.parse(JSON.stringify(data));
    console.log(JSON.stringify(data))
    $.ajax({
        url: 'https://tms.shipmentx.com/Mycontroller' + '/addrtdrivelocations',
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify(data),
        success:function(data) {
            console.log('periodic location update response:', JSON.stringify(data))
        }
    })
}

function get_expense(user_id, dropdown, value, caller_id) {
    if(value.length > 1) {
        $.ajax({
            "url": API_URL+"/getExpenseTypes",
            "method": "POST",
            "data": {
                "user_id": user_id,
                "name": value,
            },
            dataType:"JSON",
            success:function(data){
                if(data.status == 1){
                    fill_dropdown(data.data, dropdown, caller_id);
                } else {
                    clear_dropdown(dropdown);
                }
            }
        })
    } 
}

function get_vehicle(user_id, dropdown, value, caller_id) {
    if(value.length > 1) {
        $.ajax({
            "url": API_URL+"/getDriverExpenseData",
            "method": "POST",
            "data": {
                "user_id": user_id,
                "name": value,
            },
            dataType:"JSON",
            success:function(data){
                if(data.status == 1){
                    fill_dropdown(data.data, dropdown, caller_id, 'vehicle_number');
                } else {
                    clear_dropdown(dropdown);
                }
            }
        })
    } 
}

function getDriverExpenseData(type) {
    var driver = getUser();
    var search="";
    $.ajax({
        "url": API_URL+"/getDriverExpenseData",
        "method": "POST",
        "data": {
          "driver_id": driver.id,
          "vehicle_id":driver.vehicle_id
        },
        dataType:"JSON",
        success:function(data){
          if(data.status == 1){
              console.log(data)
              typeof(data);
              populate_data(data, type);
          } else {  
                if(type == 2) 
                    show_empty_completed_shipments()
                else 
                    show_empty_shipments()
          }
        }
    }) 
}

function updateDriverExpenses(formData,mylocation) {
    driver = getUser();
    formData.append("driver_id", driver.id);
    formData.append("vehicle_id", driver.vehicle_id);
    formData.append("latitude", getLatLng.latitude);
    formData.append("longitude", getLatLng.longitude);
    $.ajax({
        url: API_URL + "/updateDriverExpenses",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (respdata) {
            if (respdata.status == 1) {
                /*console.log('updateDriverExpenses', respdata);*/
                success('Expenses Updates!', 'You have successfully updated expenses');
            } else {
                error('Error!', formData);
            }
        }
    });
}

function addDriverExpenses(formData) {
    driver = getUser();
    formData.append("driver_id", driver.id);
    formData.append("vehicle_id", driver.vehicle_id);
    formData.append("latitude", getLatLng.latitude);
    formData.append("longitude", getLatLng.longitude);
    $.ajax({
        url: API_URL + "/addDriverExpenses",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (respdata) {
            if (respdata.status == 1) {
                console.log('addDriverExpenses', respdata);
                success('Expenses Added!', 'You have successfully added expenses');
            } else {
                error('Error!', formData);
            }
        }
    });
}
  
function getInspectionTypes() {
    $.ajax({
    "url": API_URL+"/getInspectionTypes",
        dataType: "JSON",
        success: function (data) {
            if (data.status == 1) {
                displaycheckboxes(data.data);
            } else {
                console.log("Failed");
            }
        },
        error: function () {
            console.log("Failed ");
        }
    });
}

function settripvehicleinspections(formData) {
    driver = getUser();
    formData.append("driver_id", driver.id);
    formData.append("vehicle_id", driver.vehicle_id);
    formData.append("trip_id", driver.trip_id);
    $.ajax({
        url: API_URL + "/settripvehicleinspections",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (respdata) {
            if (respdata.status == 1) {
                console.log('settripvehicleinspections', respdata);
                success('Vehicle Inspections Added!', 'You have successfully added vehicle inspection');
            }else {
                error('Error!', formData);
            }
        }
    });
}

function drivercheck(checkType, latitude, longitude) {
    const driver = getUser(); // get driver id
    const formData = new FormData();
    formData.append("driver_id", driver.id);
    formData.append("check_type", checkType);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);

    $.ajax({
        url: API_URL + "/drivercheckin", 
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (respdata) {
            if (respdata.status == 1) {
                console.log('drivercheck', respdata);
                
            } 
            else if(respdata.status == 2) {
                console.log('drivercheck', respdata);

            }
            else {
                error('Error!', respdata);
            }
        },
    });
}
