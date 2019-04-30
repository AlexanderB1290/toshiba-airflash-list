/**
 * Hostname or IP address of AirFlash SD card
 */
var host = "prusa.flashair";

//Upload interface
var uploadUrl = "http://" + host + "/upload.cgi";
var fileDelete = function (path) {
    $('#pleaseWaitDialog').modal();
    $.ajax({
        url: (uploadUrl + "?DEL=" + path),
        type: "GET",
        success: function (result) {
            $('#pleaseWaitDialog').modal('hide');
            window.location.reload();
        },
        error: function (error) {
            $('#pleaseWaitDialog').modal('hide');
            console.error(error);
        }
    });
};

var uploadFileList = function (fileList) {
    $('#pleaseWaitDialog').modal();
    var formData = new FormData();
    for (var i = 0; i < fileList.length; i++) {
        var fl = fileList.item(i);
        console.dir(fl);
        formData.append(fl.name, fl, fl.name);
    }
    console.dir(formData);
    $.ajax({
        url: uploadUrl,
        type: "POST",
        data: formData,
        processData: false,
        contentType: "multipart/form-data",
        success: function (result) {
            $('#pleaseWaitDialog').modal('hide');
            window.location.reload();
            console.log("File uploaded");
        },
        error: function (error) {
            $('#pleaseWaitDialog').modal('hide');
            console.error(error);
        }
    })
};


// JavaScript Document
// Judge the card is V1 or V2.
function isV1(wlansd) {
    if (wlansd.length == undefined || wlansd.length == 0) {
        // List is empty so the card version is not detectable. Assumes as V2.
        return false;
    } else if (wlansd[0].length != undefined) {
        // Each row in the list is array. V1.
        return true;
    } else {
        // Otherwise V2.
        return false;
    }
}

// Convert data format from V1 to V2.
function convertFileList(wlansd) {
    for (var i = 0; i < wlansd.length; i++) {
        var elements = wlansd[i].split(",");
        wlansd[i] = new Array();
        wlansd[i]["r_uri"] = elements[0];
        wlansd[i]["fname"] = elements[1];
        wlansd[i]["fsize"] = Number(elements[2]);
        wlansd[i]["attr"] = Number(elements[3]);
        wlansd[i]["fdate"] = Number(elements[4]);
        wlansd[i]["ftime"] = Number(elements[5]);
    }
}

// Callback Function for sort()
function cmptime(a, b) {
    if (a["fdate"] == b["fdate"]) {
        return a["ftime"] - b["ftime"];
    } else {
        return a["fdate"] - b["fdate"];
    }
}

// Show file list
function showFileList(path) {
    // Clear box.
    $("#list").html('');
    // Output a link to the parent directory if it is not the root directory.
    if (path != "/") {
        // Make parent path
        var parentpath = path;
        if (parentpath[parentpath.length - 1] != '/') {
            parentpath += '/';
        }
        parentpath += '..';
        // Make a link to the parent path.
        $("#list").append(
            $("<div></div>").append(
                $('<a href="' + parentpath + '" class="dir">..</a>')
            )
        );
    }
    $.each(wlansd, function () {
        var file = this;
        // Skip hidden file.
        if (file["attr"] & 0x02) {
            return;
        }
        // Make a link to directories and files.
        var urnFl = file["r_uri"] + '/' + file["fname"];
        var filelink = $('<a></a>').attr('href', urnFl);
        var caption = file["fname"];
        var fileobj = $("<div></div>");
        //Make a button for deletion
        var delBtn = $('<button type="button" class="close text-danger" aria-label="Delete"><span aria-hidden="true">&times;</span></button>').attr('onclick', "deleteFile('" + urnFl + "')");
        // Append a file entry or directory to the end of the list.
        $("#list").append(
            fileobj.append(
                filelink.append(
                    caption
                ),
                delBtn
            )
        );
    });
}

function deleteFile(path) {
    console.debug("Deleting file: " + path);
    fileDelete(path);
}


function uploadFile() {
    console.debug("Uploading file");
    var files = $('#file-upload')[0].files;
    if (files.length > 0) {
        uploadFileList(files);
    }
}

function triggerUpload() {
    console.debug("Trigger upload");
    $('#file-upload').click();
}

// Document Ready
$(function () {
    if (isV1(wlansd)) {
        convertFileList(wlansd);
    }
    wlansd.sort(cmptime);
    showFileList(location.pathname);
});