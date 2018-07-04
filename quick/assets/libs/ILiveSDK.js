var sdkLog = new function() {
    var TAG = "ILiveSDK : ";
    this._debugLogOpen = true;
    this.openDebugLog = function() {
      this._debugLogOpen = true;
    };
    this.closeDebugLog = function() {
      this._debugLogOpen = false;
    };
    this.error = function(msg) {
      console.error(TAG + msg);
    };
    this.debug = function(msg) {
      if (!this._debugLogOpen) {
        return;
      }
      console.log(TAG + msg);
    }
  };

var IM_CustomCmd = {
  AVIMCMD_None: 0, // 无事件：0
  AVIMCMD_EnterLive: 1, // 用户加入直播, Group消息 ： 1
  AVIMCMD_ExitLive: 2, // 用户退出直播, Group消息 ： 2
  AVIMCMD_Praise: 3, // 点赞消息, Demo中使用Group消息 ： 3
  AVIMCMD_Host_Leave: 4, // 主播或互动观众离开, Group消息 ： 4
  AVIMCMD_Host_Back: 5, // 主播或互动观众回来, Group消息 ： 5
  AVIMCMD_Multi: 2048, // 多人互动消息类型 ： 2048
  AVIMCMD_Multi_Host_Invite: 2049, // 多人主播发送邀请消息, C2C消息 ： 2049
  AVIMCMD_Multi_CancelInteract: 2050, // 已进入互动时，断开互动，Group消息，带断开者的imUsreid参数 ： 2050
  AVIMCMD_Multi_Interact_Join: 2051, // 多人互动方收到AVIMCMD_Multi_Host_Invite多人邀请后，同意，C2C消息 ： 2051
  AVIMCMD_Multi_Interact_Refuse: 2052, // 多人互动方收到AVIMCMD_Multi_Invite多人邀请后，拒绝，C2C消息 ： 2052
  AVIMCMD_Multi_Apply_Interact: 2053, // 主动申请连麦
  AVIMCMD_Multi_Apply_Agree_Interact: 2054, // 同意连麦
  AVIMCMD_Multi_Apply_Reject_Interact: 2055, // 拒绝连麦
};


var ILiveSDK = {
  RoomNumber: null,
  Role: null,
  selSess: null,
  loginInfo: {
    'sdkAppId': null,
    'openid': null,
    'identifier': null,
    'userSig': null,
    'identifierNick': null,
    'headurl': null,
    'token': null
  },
  webimlistener: {
    onConnNotify: function(data) {},
    onMsgNotify: function(data) {},
    onBigGroupMsgNotify: function(data) {}
  },
  init: function(rtclistener, webimlistener, loginInfo) {
    loginInfo.sdkAppID = loginInfo.sdkAppId;
    loginInfo.identifier = loginInfo.openid;
    loginInfo.closeLocalMedia = true;
    this.loginInfo = loginInfo;
    this.webimlistener = webimlistener;
    return WebRTCAPI.init(rtclistener, loginInfo);
  },
  login: function(succ, error) {
    var self = this;
    console.debug(self.loginInfo);
    webim.login(self.loginInfo, self.webimlistener, {
        'isAccessFormalEnv': true,
        'isLogOn': true
      },
      function(identifierNick) {
        webim.Log.info('webim登录成功');
        if (self.RoomNumber > 0) {
          selToID = String(self.RoomNumber);
        }
        if (succ) {
          succ();
        }
      },
      function(err) {
        sdkLog.error(err.ErrorInfo);
        if (error) {
          error(err);
        }
      }
    );
  },
  logout: function() {
    webim.logout();
    this.loginInfo = {
      'identifier': null,
      'userSig': null,
      'identifierNick': null,
      'headurl': null,
      'token': null
    };
  },

  createRoom: function(opts, succ, error) {
    var self = this;
    self.RoomNumber = opts.roomid;
    self.Role = opts.role;
    WebRTCAPI.createRoom({
      roomid: self.RoomNumber,
      role: self.Role
    }, function(result) {
      if (result !== 0) {
        sdkLog.error("create room failed!!!");
        return;
      }
      var options = {
        'GroupId': String(self.RoomNumber),
        'Owner_Account': self.loginInfo.identifier,
        'Type': "AVChatRoom", //Private/Public/ChatRoom/AVChatRoom
        'ApplyJoinOption': 'FreeAccess',
        'Name': String(self.RoomNumber),
        'Notification': "",
        'Introduction': "",
        'MemberList': [],
      };
      webim.createGroup(
        options,
        function(resp) {
          webim.applyJoinBigGroup({
            'GroupId': String(self.RoomNumber),
            'ApplyMsg': '',
            'UserDefinedField': ''
          }, function(resp) {
            console.warn('applyJoinGroupSucc', self.RoomNumber)
            if (succ) succ(0);
          }, function(err) {
            if (err.ErrorCode == 10013) {
              console.warn('applyJoinGroupSucc', self.RoomNumber)
              if (succ) succ(0);
              return;
            }
            // if (error) error(err.ErrorCode);
            if (succ) succ(0);
          });
        },
        function(err) {
          if (err.ErrorCode == 10025) {
            if (succ) succ(0);
          } else {
            sdkLog.error(err.ErrorInfo);
            if (error) error(err.ErrorCode);
          }
        }
      );
    });
  },

  joinRoom: function(opts, succ, error) {
    var self = this;
    self.RoomNumber = opts.roomid;
    self.Role = opts.role;
    WebRTCAPI.createRoom({
      roomid: self.RoomNumber,
      role: self.Role
    }, function(result) {
      if (result !== 0) {
        sdkLog.error("create room failed!!!");
        return;
      }
      webim.applyJoinBigGroup({
        'GroupId': String(self.RoomNumber),
        'ApplyMsg': '',
        'UserDefinedField': ''
      }, function(resp) {
        console.warn('applyJoinGroupSucc', self.RoomNumber)
        if (succ) succ(0);
      }, function(err) {
        if (err.ErrorCode == 10013) {
          console.warn('applyJoinGroupSucc', self.RoomNumber)
          if (succ) succ(0);
          return;
        }
        // if (error) error(err.ErrorCode);
        if (succ) succ(0);
      });
    });
  },
  quitRoom: function(cbOk, cbErr) {
    var self = this;
    WebRTCAPI.quit();
    webim.quitGroup({
      GroupId: self.RoomNumber
    }, cbOk, cbErr);
  },
  openCamera: function() {
    return WebRTCAPI.openVideo();
  },
  closeCamera: function() {
    return WebRTCAPI.closeVideo();
  },
  openMic: function() {
    return WebRTCAPI.openAudio();
  },
  closeMic: function() {
    return WebRTCAPI.closeAudio();
  },
  setMicVolume: function(val) {
    if (val > 1)
      val = 1;
    if (val < 0)
      val = 0;
    return WebRTCAPI.setMicVolume(val);
  },
  setConstraints: function(val) {
    return WebRTCAPI.setConstraints(val);
  },
  applyPushStream: function(succ, error) {
    this.sendGroupNotify({
      "userAction": IM_CustomCmd.AVIMCMD_Multi_Apply_Interact,
      "actionParam": ''
    }, succ, error);
  },
  applyAgree: function(who, succ, error) {
    this.sendGroupNotify({
      "userAction": IM_CustomCmd.AVIMCMD_Multi_Apply_Agree_Interact,
      "actionParam": who
    }, succ, error);
  },
  rejectAgree: function(who, succ, error) {
    this.sendGroupNotify({
      "userAction": IM_CustomCmd.AVIMCMD_Multi_Apply_Reject_Interact,
      "actionParam": who
    }, succ, error);
  },
  startPushStream: function() {
    WebRTCAPI.startWebRTC(function(result) {
      if (result !== 0) {
        var errorStr = "";
        if (result === -10007) {
          errorStr = "PeerConnection 创建失败";
        } else if (result === -10008) {
          errorStr = "getUserMedia 失败";
        } else if (result === -10009) {
          errorStr = "getLocalSdp 失败";
        } else {
          errorStr = "start WebRTC failed!!!";
        }
        console.error(errorStr, 'error');
      }
    });
  },
  sendGroupMessage: function(msgContent, succ, error) {
    if (this.RoomNumber > 0) {
      var selToID = String(this.RoomNumber);
    } else {
      sdkLog.error("没有指定群id");
    }
    if (!this.selSess) {
      this.selSess = new webim.Session(webim.SESSION_TYPE.GROUP, selToID, selToID, null, Math.round(new Date().getTime() / 1000));
    }
    var isSend = true; //是否为自己发送
    var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
    var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
    var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
    var subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
    var msg = new webim.Msg(
      this.selSess,
      isSend,
      seq,
      random,
      msgTime,
      this.loginInfo.identifier,
      subType,
      this.loginInfo.identifierNick
    );
    var text_obj = new webim.Msg.Elem.Text(msgContent);
    msg.addText(text_obj);
    msg.originContent = msgContent;
    webim.sendMsg(msg, function(resp) {
      if (succ) succ(resp);
    }, function(err) {
      if (error) error(err);
    });
  },

  sendGroupNotify: function(msgContent, succ, error) {
    if (this.RoomNumber > 0) {
      var selToID = String(this.RoomNumber);
    } else {
      sdkLog.error("没有指定群id");
    }
    if (!this.selSess) {
      this.selSess = new webim.Session(webim.SESSION_TYPE.GROUP, selToID, selToID, null, Math.round(new Date().getTime() / 1000));
    }
    var isSend = true; //是否为自己发送
    var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
    var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
    var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
    var subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
    var msg = new webim.Msg(
      this.selSess,
      isSend,
      seq,
      random,
      msgTime,
      this.loginInfo.identifier,
      subType,
      this.loginInfo.identifierNick
    );
    var custom_obj = new webim.Msg.Elem.Custom(JSON.stringify(msgContent), null, null);
    msg.addCustom(custom_obj);
    webim.sendMsg(msg, function(resp) {
      if (succ) succ(resp);
    }, function(err) {
      if (error) error(err);
    });
  }
};
