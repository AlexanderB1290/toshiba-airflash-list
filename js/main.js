/**
 * Hostname or IP address of AirFlash SD card
 */
var host = window.location.host;


var URL = {
    BASE: "http://" + host
};
URL["UPLOAD"] = URL.BASE + "/upload.cgi";
URL["COMMAND"] = URL.BASE + "/command.cgi";

function setBusy() {
    // Shows spinner in top left, for operations that should not take long
    $("#pleaseWaitDialog").modal();
}

function clearBusy() {
    $("#pleaseWaitDialog").modal('hide');
}


//Upload interface
var fileDelete = function (path) {
    setBusy();
    $.ajax({
        url: (URL.UPLOAD + "?DEL=" + path),
        type: "GET",
        success: function (result) {
            clearBusy();
            window.location.reload();
        },
        error: function (error) {
            clearBusy();
            console.error(error);
        }
    });
};

var uploadFileList = function (fileList) {
    setBusy();
    var formData = new FormData();
    for (var i = 0; i < fileList.length; i++) {
        var fl = fileList.item(i);
        var nName = fl.name.replace(/[^.a-zA-Z _-]/g, "");
        formData.append(fl.name, fl, fl.name);
    }
    console.dir(formData);
    $.ajax({
        url: URL.UPLOAD,
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (result) {
            clearBusy();
            window.location.reload();
            console.log("File uploaded");
        },
        error: function (error) {
            clearBusy();
            console.error(error);
        }
    });
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
        fileobj.append(delBtn);
        // Append a file entry or directory to the end of the list.
        $("#list").append(
            fileobj.append(
                filelink.append(
                    caption
                )
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

function fancyFileSize(bytes) {
    if(bytes < 1e3)
        return bytes + "&nbsp;B";
    if(bytes < 1e6)
        return Math.round(bytes/1e3) + "&nbsp;kB";
    if(bytes < 1e8)
        return Math.round(bytes/1e4)/100 + "&nbsp;MB";
    if(bytes < 1e9)
        return Math.round(bytes/1e6) + "&nbsp;MB";
    if(bytes < 1e11)
        return Math.round(bytes/1e7)/100 + "&nbsp;GB";
    return Math.round(bytes/1e9) + "&nbsp;GB";
}

function showFreeSpace(numItems) {
    var url = "/command.cgi?op=140";
    // Issue CGI command.
    $.get(url, function (data) {
        // Split sizes,sectorSize.
        var items = data.split(/,/g);
        // Ignore the first line (title) and last line (blank).
        var sectorSize = items.pop();
        items = items[0].split(/\//g);
        var freeSpace = items[0] * sectorSize;
        var totalSpace = items[1] * sectorSize;
        var percent = Math.round(freeSpace/totalSpace);
        $("#freeSpace").html(fancyFileSize(freeSpace) + " free of " + fancyFileSize(totalSpace));
        $('#spaceFull').attr('aria-valuenow', percent).css('width', percent);
    });
}

// Document Ready
$(function () {
    if (isV1(wlansd)) {
        convertFileList(wlansd);
    }
    wlansd.sort(cmptime);
    showFileList(location.pathname);
    showFreeSpace(wlansd.length);
});