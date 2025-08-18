/*
[用户点击推流按钮]
  ↓
startPush() - 发送推流请求到服务器
  ↓
服务器返回SDP offer
  ↓
pushStream() - 创建RTCPeerConnection
  ↓
setRemoteDescription() - 设置远程描述
  │
  ├─成功→ setRemoteDescriptionSuccess()
  │       ↓
  │       window.postMessage() 请求屏幕共享
  │       ↓
  │       用户同意共享 → "SS_DIALOG_SUCCESS"消息
  │       ↓
  │       startScreenStreamFrom(streamId)
  │       ↓
  │       getUserMedia()获取屏幕流
  │       ↓
  │       handleSuccess(视频流)
  │       ↓
  │       获取音频流并合并
  │       ↓
  │       显示在localVideo
  │       ↓
  │       pc.addStream() 添加流
  │       ↓
  │       pc.createAnswer() 创建answer
  │       ↓
  │       CreateSessionDescriptionSuccess(answer)
  │           (这里应该设置本地描述并发送answer到服务器)
  │
  └─失败→ setRemoteDescriptionError()

*/

'use strict';

var remoteVideo = document.getElementById("remoteVideo");
var pullBtn = document.getElementById("pullBtn");
var stopPullBtn = document.getElementById("stopPullBtn");

pullBtn.addEventListener("click", startPull);
stopPullBtn.addEventListener("click", stopPull);

var uid = $("#uid").val();
var streamName = $("#streamName").val();
var audio = $("#audio").val();
var video = $("#video").val();
var offer = "";
var pc;
const config = {};
var remoteStream;
var lastConnectionState = "";

function startPull() {
    console.log("send push: /signaling/pull");

    $.post("/signaling/pull",
        {"uid": uid, "streamName": streamName, "audio": audio, "video": video},
        function(data, textStatus) {
            console.log("pull response: " + JSON.stringify(data));
            if ("success" == textStatus && 0 == data.errNo) {
                $("#tips1").html("<font color='blue'>拉流请求成功!</font>");
                console.log("offer sdp: \n" + data.data.sdp);
                offer = data.data;
                pullStream();
            } else {
                $("#tips1").html("<font color='red'>拉流请求失败!</font>");
            }
        },
        "json"
    );
}

function stopPull() {
    console.log("send stop pull: /signaling/stoppull");

    remoteVideo.srcObject = null;
    if (remoteStream && remoteStream.getAudioTracks()) {
        remoteStream.getAudioTracks()[0].stop();
    }

    if (remoteStream && remoteStream.getVideoTracks()) {
        remoteStream.getVideoTracks()[0].stop();
    }

    if (pc) {
        pc.close();
        pc = null;
    }

    $("#tips1").html("");
    $("#tips2").html("");
    $("#tips3").html("");

    $.post("/signaling/stoppull",
        {"uid": uid, "streamName": streamName},
        function(data, textStatus) {
            console.log("stop pull response: " + JSON.stringify(data));
            if ("success" == textStatus && 0 == data.errNo) {
                $("#tips1").html("<font color='blue'>停止拉流请求成功!</font>");
            } else {
                $("#tips1").html("<font color='red'>停止拉流请求失败!</font>");
            }
        },
        "json"
    );
}

function sendAnswer(answerSdp) {
    console.log("send answer: /signaling/sendanswer");

    $.post("/signaling/sendanswer",
        {"uid": uid, "streamName": streamName, "answer": answerSdp, "type": "pull"},
        function(data, textStatus) {
            console.log("push answer response: " + JSON.stringify(data));
            if ("success" == textStatus && 0 == data.errNo) {
                $("#tips3").html("<font color='blue'>answer发送成功!</font>");
            } else {
                $("#tips3").html("<font color='red'>answer发送失败!</font>");
            }
        },
        "json"
    );
}

function pullStream() {
    pc = new RTCPeerConnection(config);
    pc.oniceconnectionstatechange = function(e) {
        var state = "";
        if (lastConnectionState != "") {
            state = lastConnectionState + "->" + pc.iceConnectionState;
        } else {
            state = pc.iceConnectionState;
        }

        $("#tips2").html("连接状态: " + state);
        lastConnectionState = pc.iceConnectionState;        
    }

    pc.onaddstream = function(e) {
        remoteStream = e.stream;
        remoteVideo.srcObject = e.stream;
    }

    console.log("set remote sdp start");

    pc.setRemoteDescription(offer).then(
        setRemoteDescriptionSuccess,
        setRemoteDescriptionError
    );
}

function setRemoteDescriptionSuccess() {
    console.log("pc set remote sdp success");
    pc.createAnswer().then(
        createSessionDescriptionSuccess,
        createSessionDescriptionError
    );
}

function createSessionDescriptionSuccess(answer) {
    console.log("answer sdp: \n" + answer.sdp);
    console.log("pc set local sdp");
    pc.setLocalDescription(answer).then(
        setLocalDescriptionSuccess,
        setLocalDescriptionError
    );

    sendAnswer(answer.sdp);
}

function setLocalDescriptionSuccess() {
    console.log("set local sdp success");
}

function setRemoteDescriptionError() {
    console.log("pc set remote sdp error: " + error);
}

function setLocalDescriptionError() {
    console.log("pc set local sdp error: " + error);
}

function createSessionDescriptionError() {
    console.log("pc create answer error: " + error);
}
