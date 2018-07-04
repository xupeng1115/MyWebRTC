var PREFIX = 'quick_' + SDKAPPID;
// var SDKAPPID = 1400037025;
var ACCOUNTTYPE = 14418;
var SVRDOMAIN = "https://sxb.qcloud.com/sxb_dev/";
var Constants = {
  View: {
    Login: 0,
    RoomList: 1,
    RoomDetail: 2
  }
};
var reportSto = null;

//角色
var Role = {
  Guest: 0, //观众
  LiveMaster: 1, //主播
  LiveGuest: 2 //连麦观众
};


var AppSvr = {
  setErrorHandler: function(cb) {
    // Add a response interceptor
    axios.interceptors.response.use(function(response) {
      // Do something with response data
      // console.debug('axios',response);
      if (cb) {
        cb(response);
      }
      return response;
    }, function(error) {
      // Do something with response error
      return Promise.reject(error);
    });
  },
  heartBeatReport: function(opts) {
    var self = this;
    clearTimeout(reportSto);
    if (!opts.roomnum) return;
    axios.post(SVRDOMAIN + '?svc=live&cmd=heartbeat', JSON.stringify(opts)).then(function(response) {}).
    catch (function(error) {});
    reportSto = setTimeout(function() {
      self.heartBeatReport(opts);
    }, 3000);
  },
  createRoom: function(opts, succ, err) {
    axios.post(SVRDOMAIN + '?svc=live&cmd=create', JSON.stringify({
      "type": 'live',
      "token": ILiveSDK.loginInfo.token
    }))
      .then(function(response) {
        if (response.status == 200) {
          succ(response.data);
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },
  reportRoom: function(opts) {
    var self = this;
    var device = navigator.userAgent.match(/iPhone|iPad/i) && 4 || (navigator.userAgent.match(/android/gi) && 3) || 5;
    device = 2;
    var reportObj = {
      "token": ILiveSDK.loginInfo.token,
      "room": {
        "title": opts.roomname || '[极速模式] ' + opts.identifier,
        "roomnum": opts.RoomNumber,
        "type": "live",
        "groupid": String(opts.RoomNumber),
        "appid": SDKAPPID,
        "device": device,
        "videotype": 0
      }
    };
    axios.post(SVRDOMAIN + '?svc=live&cmd=reportroom', JSON.stringify(reportObj))
      .then(function(response) {
        if (response.status == 200) {
          self.heartBeatReport({
            "token": ILiveSDK.loginInfo.token,
            "roomnum": opts.RoomNumber,
            "role": Role.LiveMaster,
            "thumbup": 0
          });
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },
  reportJoinRoom: function(opts) {
    var self = this;
    var device = navigator.userAgent.match(/iPhone|iPad/i) && 4 || (navigator.userAgent.match(/android/gi) && 3) || 5;
    device = 2;
    var reportObj = {
      "token": ILiveSDK.loginInfo.token,
      "roomnum": parseInt(opts.RoomNumber),
      "role": Role[opts.role],
      "operate": opts.operate
    };
    axios.post(SVRDOMAIN + '?svc=live&cmd=reportmemid', JSON.stringify(reportObj))
      .then(function(response) {
        if (response.status == 200) {
          self.heartBeatReport({
            "token": ILiveSDK.loginInfo.token,
            "roomnum": parseInt(opts.RoomNumber),
            "role": Role[opts.role],
            "thumbup": 0
          });
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },
  register: function(opts, succ, err) {
    axios.post(SVRDOMAIN + '?svc=account&cmd=regist', JSON.stringify({
      "id": opts.username,
      "pwd": opts.password,
      "appid": SDKAPPID
    }))
      .then(function(response) {
        if (response.status == 200) {
          succ(response.data);
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },

  login: function(opts, succ, err) {
    axios.post(SVRDOMAIN + '?svc=account&cmd=login', JSON.stringify({
      "id": opts.username,
      "pwd": opts.password,
      "appid": SDKAPPID
    }))
      .then(function(response) {
        if (response.status == 200) {
          succ(response.data);
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },

  getUserList: function(opts, succ, err) {
    axios.post(SVRDOMAIN + '?svc=live&cmd=roomidlist', JSON.stringify({
      "token": ILiveSDK.loginInfo.token,
      "roomnum": opts.roomnum,
      "index": 0,
      "size": 40
    }))
      .then(function(response) {
        if (response.status == 200) {
          succ(response.data);
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  },


  getRoomList: function(opts, succ, err) {
    axios.post(SVRDOMAIN + '?svc=live&cmd=roomlist', JSON.stringify({
      "type": 1,
      "token": ILiveSDK.loginInfo.token,
      "index": opts.page || 0,
      "size": opts.size || 30,
      "appid": SDKAPPID
    }))
      .then(function(response) {
        if (response.status == 200) {
          succ(response.data);
        } else {
          err(response.data);
        }
      })
      .
    catch (function(error) {
      err(error);
    });
  }
};


Vue.directive('focus', {
  // When the bound element is inserted into the DOM...
  inserted: function(el) {
    // Focus the element
    el.focus();
  }
});


var renderRoomListItv = null,
  renderUserListItv = null,
  applySto = null;
var app = new Vue({
  el: '#app-main',
  data: {
    form: {
      msg: null,
      username: store.get(PREFIX + "username") || null,
      password: store.get(PREFIX + "password") || null
    },
    role: BomQuery('role'),
    onMic: 0,
    logined: false,
    view: store.get(PREFIX + "roomview") || 0,
    roomList: [],
    userList: [],
    chatList: [],
    roomnum: null,
    loginInfo: null,
    entryType: 'join',
    selToID: null,
    joinRoomModal: false,
    createRoomModal: false,
    modalForm: {
      roomname: null,
      roomnum: null
    },
    applying: false,
    mode: store.get(PREFIX + "mode") || 'fixed',
    video_list: [],
    video_map: {},
    apply_list: [],
    resolution: store.get(PREFIX + "resolution") || "auto",
    frameRate: store.get(PREFIX + "frameRate") || "auto",
    configRole: store.get(PREFIX + "configRole") || "ed640",
    SpearConfig: SpearConfig.data.conf,
    open: {
      audio: true,
      video: true
    }
  },
  components: {
    'vue-toastr': window.vueToastr
  },


  filters: {
    getSrcTinyId: function(val) {
      return val.split("_")[0]
    },
    getOpenId: function(val) {
      var srctinyid = val.split("_")[0]
      return WebRTCAPI.getOpenId(srctinyid);
    }
  },

  watch: {
    view(val) {
      if (val == 1) {
        clearInterval(renderRoomListItv)
        this.getRoomList();
        renderRoomListItv = setInterval(this.getRoomList, 3000);
      } else {
        clearInterval(renderRoomListItv)
      }
      if (val == 2) {
        this.renderUserList();
        renderUserListItv = setInterval(this.renderUserList, 3000);
      } else {
        clearInterval(renderUserListItv);
        clearTimeout(reportSto);
      }
    },
    resolution(val) {
      store.set(PREFIX + "resolution", val);
    },
    frameRate(val) {
      store.set(PREFIX + "frameRate", val);
    },
    configRole(val) {
      store.set(PREFIX + "configRole", val);
      if (WebRTCAPI.changeSpearRole) {
        WebRTCAPI.changeSpearRole(val)
        this.$root.$refs.toastr.s("切换角色配置 -> " + val)
      }
    }
  },

  mounted() {
    AppSvr.setErrorHandler(function(response) {
      var data = response.data;
      switch (data.errorCode) {
        case 0:
        case 10003:
          break;
        case 10009:
          self.$root.$refs.toastr.w("登录态失效");
          self.logout();
          break;
        default:
          self.$root.$refs.toastr.w(data.errorInfo);
          break;
      }
    });

    var self = this;
    var loginInfo = store.get(PREFIX + "loginInfo");
    if (loginInfo) {
      ILiveSDK.loginInfo = loginInfo;
      self.loginInfo = loginInfo;
      self.renderRoomList();
      return;
    }

  },
  methods: {
    restoreVideo: function() {
      var self = this;
      setTimeout(function() {
        Array.prototype.forEach.call(self.video_list, function(item, idx) {
          var video = document.getElementById(item.videoId)
          if (!video) return
          // if ( (item.stream.id != video.srcObject.id) || (item.stream && video && video.srcObject && video.srcObject.active === false)) {
            (function(video,openId){
              // video.srcObject = self.video_map[openId];
              console.error( openId, video.srcObject.id , self.video_map[openId].id  )
              if( video.srcObject.id !== self.video_map[openId]){
                video.srcObject = self.video_map[openId];
              }
            })(video,item.openId);
          // }
        })
      }, 100);
    },

    repainVideoElement: function(){
      // just for testing
      for(var a in this.video_map){

      }
    },
    chanceMode: function(mode) {
      this.mode = mode;
      store.set(PREFIX + "mode", mode);
    },
    login: function(e) {
      var self = this;
      if (this.form.username && this.form.password) {
        store.set(PREFIX + "username", this.form.username);
        store.set(PREFIX + "password", this.form.password);
      }
      AppSvr.login(this.form, function(data) {
        if (data && data.errorCode === 0) {
          ILiveSDK.loginInfo.identifier = self.form.username;
          ILiveSDK.loginInfo.token = data.data.token;
          ILiveSDK.loginInfo.userSig = data.data.userSig;
          store.set(PREFIX + "loginInfo", ILiveSDK.loginInfo);
          self.loginInfo = ILiveSDK.loginInfo;
          self.$root.$refs.toastr.s("登录成功");
          self.renderRoomList();
        } else {
          console.error(data)
          alert("获取UserSig失败, Info = " + JSON.stringify(data));
        }
      }, function(error) {
        console.error(error)
      });
    },
    register: function(e) {
      var self = this;

      if( !this.form.username || !this.form.password){
          this.$root.$refs.toastr.w("请输入用户名和密码")
      }
      if (this.form.username && this.form.password) {
        store.set(PREFIX + "username", this.form.username);
        store.set(PREFIX + "password", this.form.password);
      }
      AppSvr.register(this.form, function(data) {
        if (data && data.errorCode === 0) {
          self.$root.$refs.toastr.s("注册成功");
          self.login();
        } else if (data.errorCode === 10004) {
          // self.$root.$refs.toastr.e("账号已存在");
        } else {
          // self.$root.$refs.toastr.s(data);
          // self.$root.$refs.toastr.e(JSON.stringify(data));
        }
      }, function(error) {
        self.$root.$refs.toastr.e(JSON.stringify(error));
      });
    },

    logout: function() {
      store.remove(PREFIX + "loginInfo");
      this.view = 0;
    },

    unshiftThis: function(event) {
      var videoId = $(event.currentTarget).data("id");
      var video_list = this.video_list;
      _.each(video_list, function(item) {
        if (item.first) {
          item.first = false;
        }
        if (item.videoId == videoId) {
          item.first = true;
        }
      });
      this.video_list = video_list;
    },

    renderRoomList: function(data) {
      this.view = Constants.View.RoomList;
    },

    getRoomList: function() {
      var self = this;
      AppSvr.getRoomList({}, function(data) {
        self.roomList = _.filter(data.data.rooms || [], function(item) {
          // return item.info && item.info.title.indexOf("极速模式") != -1;
          return item.info;
        }) || [];
      }, function(error) {});
    },

    showCreateRoom: function() {
      this.createRoomModal = true;
    },

    hideCreateRoom: function() {
      this.createRoomModal = false;
    },

    showJoinRoom: function() {
      this.joinRoomModal = true;
    },

    hideJoinRoom: function() {
      this.joinRoomModal = false;
    },

    initWebRTC: function() {
      var self = this;
      var rtclistener = {
        onRemoteCloseAudio: self.onRemoteCloseAudio,
        onRemoteLeave: self.onRemoteLeave,
        onRemoteCloseVideo: self.onRemoteCloseVideo,
        onKickout: self.onKickout,
        onInitResult: self.onInitResult,
        onLocalStreamAdd: self.onLocalStreamAdd,
        onRemoteStreamAdd: self.onRemoteStreamAdd,
        onWebSocketClose: self.onWebSocketClose,
        onRelayTimeout: self.onRelayTimeout,
        onIceConnectionClose: self.onIceConnectionClose,
        onRemoteStreamRemove: self.onRemoteStreamRemove,
        onUpdateRemoteStream: self.onUpdateRemoteStream,
        onChangeRemoteStreamState: $.noop
      };

      var imlistener = {
        onMsgNotify: self.onMsgNotify,
        onConnNotify: self.onConnNotify,
        onBigGroupMsgNotify: self.onBigGroupMsgNotify,
        onKickedEventCall: function() {
          console.error("kicked");
        }
      };
      var ret = ILiveSDK.init(rtclistener, imlistener, {
        "token": ILiveSDK.loginInfo.token,
        "openid": ILiveSDK.loginInfo.identifier,
        "userSig": ILiveSDK.loginInfo.userSig,
        "sdkAppId": SDKAPPID,
        "accountType": ACCOUNTTYPE
      });

      var defaultSetting = {
        width: null,
        height: null,
        frameRate: null
      };
      /*
            var resolution = this.resolution;
            if(resolution != "auto"){
                var opts = resolution.split("x");
                defaultSetting.width= parseInt(opts[0]);
                defaultSetting.height= parseInt(opts[1]);
            }

            var frameRate = this.frameRate;
            if(frameRate != "auto"){
                defaultSetting.frameRate=  parseInt(frameRate);
            }
            ILiveSDK.setConstraints(defaultSetting);
      */
      if (ret !== 0) {
        alert("初始化失败！！！");
      }
    },
    onMsgNotify: function(newMsgList) {
      var sess,
        newMsg;
      for (var j in newMsgList) { //遍历新消息
        newMsg = newMsgList[j];
        if (newMsg.getSession().id() == this.roomnum) { //为当前聊天对象的消息
          console.debug('newMsg.getElems()[0]', newMsg.getElems()[0])
          if (newMsg.getElems()[0].type == "TIMCustomElem"
            // && this.role =='LiveMaster' && !newMsg.getIsSend()
          ) {
            this.dealCustomMessage(newMsg.getFromAccount(), JSON.parse(newMsg.toHtml()));
          } else {
            this.chatList.push({
              who: newMsg.getFromAccount(),
              content: newMsg.toHtml(),
              isSelfSend: newMsg.getIsSend(),
              isSystem: newMsg.getFromAccount() === "@TIM#SYSTEM" || false
            });
          }
        }
      }
      //消息已读上报，以及设置会话自动已读标记
      // webim.setAutoRead(selSess, true, true);
    },

    onBigGroupMsgNotify: function(newMsgList) {
      var sess,
        newMsg;
      for (var j in newMsgList) { //遍历新消息
        newMsg = newMsgList[j];
        if (newMsg.getSession().id() == this.roomnum) { //为当前聊天对象的消息
          console.debug('newMsg.getElems()[0]', newMsg.getElems()[0])
          if (newMsg.getElems()[0].type == "TIMCustomElem"
            // && this.role =='LiveMaster' && !newMsg.getIsSend()
          ) {
            this.dealCustomMessage(newMsg.getFromAccount(), JSON.parse(newMsg.toHtml()));
          } else {
            this.chatList.push({
              who: newMsg.getFromAccount(),
              content: newMsg.toHtml(),
              isSelfSend: newMsg.getIsSend(),
              isSystem: newMsg.getFromAccount() === "@TIM#SYSTEM" || false
            });
          }
          $(".chatting-area").scrollTop(100000)
        }
      }
      //消息已读上报，以及设置会话自动已读标记
      // webim.setAutoRead(selSess, true, true);
    },

    onConnNotify: function(resp) {
      switch (resp.ErrorCode) {
        case webim.CONNECTION_STATUS.ON:
          webim.Log.warn('建立连接成功: ' + resp.ErrorInfo);
          break;
        case webim.CONNECTION_STATUS.OFF:
          info = '连接已断开，无法收到新消息，请检查下你的网络是否正常: ' + resp.ErrorInfo;
          // alert(info);
          webim.Log.warn(info);
          break;
        case webim.CONNECTION_STATUS.RECONNECT:
          info = '连接状态恢复正常: ' + resp.ErrorInfo;
          // alert(info);
          webim.Log.warn(info);
          break;
        default:
          webim.Log.error('未知连接状态: =' + resp.ErrorInfo);
          break;
      }
    },

    applyAgree: function(e) {
      var self = this;
      var who = String(e.currentTarget.getAttribute("data-id"));
      ILiveSDK.applyAgree(who, function() {
        var list = self.apply_list;
        var new_arr = [];
        [].forEach.call(list, function(item) {
          console.debug(list);
          if (item.who !== who) {
            new_arr.push(item);
          }
        });
        self.apply_list = new_arr;
      });

    },

    applyReject: function(e) {
      var self = this;
      var who = String(e.currentTarget.getAttribute("data-id"));
      ILiveSDK.rejectAgree(who, function() {
        var list = self.apply_list;
        var new_arr = [];
        [].forEach.call(list, function(item) {
          console.debug(list);
          if (item.who !== who) {
            new_arr.push(item);
          }
        });
        self.apply_list = new_arr;
      });
    },

    dealCustomMessage: function(user, msg) {
      var self = this;
      switch (msg.userAction) {
        case IM_CustomCmd.AVIMCMD_EnterLive:
          self.$root.$refs.toastr.s(user + '进入了房间');
          break;
        case IM_CustomCmd.AVIMCMD_ExitLive:
          self.$root.$refs.toastr.w('主播' + user + '退出了房间');
          self.quitRoom();
          break;
        case IM_CustomCmd.AVIMCMD_Praise:
          self.$root.$refs.toastr.s(user + '点了赞');
          break;
        case IM_CustomCmd.AVIMCMD_Host_Leave:
        case IM_CustomCmd.AVIMCMD_Host_Back:
          break;
        case IM_CustomCmd.AVIMCMD_Multi:
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Host_Invite:
          break;
        case IM_CustomCmd.AVIMCMD_Multi_CancelInteract:
          //被主播下麦
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Interact_Join:
          self.$root.$refs.toastr.s("对方接受了你的邀请");
          this.renderUserList();
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Interact_Refuse:
          self.$root.$refs.toastr.s("对方拒绝了你的邀请");
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Apply_Interact:
          if (this.role == 'LiveMaster') {
            this.apply_list.push({
              who: user
            });
          }
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Apply_Agree_Interact:
          //同意邀请
          if (this.loginInfo.identifier == msg.actionParam) {
            this.$root.$refs.toastr.s("同意上麦");
            this.onMic = 1;
            clearInterval(applySto);
            ILiveSDK.startPushStream();
          }
          break;
        case IM_CustomCmd.AVIMCMD_Multi_Apply_Reject_Interact:
          //同意邀请
          if (this.loginInfo.identifier == msg.actionParam) {
            this.$root.$refs.toastr.w("拒绝了你的连麦请求");
          }
          break;
        default:
          break;
      }
    },


    handleMsgSend: function() {
      var self = this;
      msgContent = _.trim(this.form.msg);

      if (!msgContent) {
        return;
      }
      this.form.msg = '';
      var selType = webim.SESSION_TYPE.GROUP; //当前聊天类型
      var selToID = null; //当前选中聊天id（当聊天类型为私聊时，该值为好友帐号，否则为群号）
      var selSess = null; //当前聊天会话对象
      var recentSessMap = {}; //保存最近会话列表
      if (self.roomnum > 0) {
        selToID = String(self.roomnum);
      }
      if (!selSess) {
        var selSess = new webim.Session(selType, selToID, selToID, null, Math.round(new Date().getTime() / 1000));
      }
      var isSend = true; //是否为自己发送
      var seq = -1; //消息序列，-1表示sdk自动生成，用于去重
      var random = Math.round(Math.random() * 4294967296); //消息随机数，用于去重
      var msgTime = Math.round(new Date().getTime() / 1000); //消息时间戳
      var subType; //消息子类型
      if (selType == webim.SESSION_TYPE.C2C) {
        subType = webim.C2C_MSG_SUB_TYPE.COMMON;
      } else {
        subType = webim.GROUP_MSG_SUB_TYPE.COMMON;
      }
      var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, self.loginInfo.identifier, subType, self.loginInfo.identifierNick);

      msg.addText(new webim.Msg.Elem.Text(msgContent));
      msg.originContent = msgContent;
      // addMsg(msg);
      webim.sendMsg(msg, function(resp) {}, function(err) {});
    },

    renderUserList: function() {
      var self = this;
      AppSvr.getUserList({
        roomnum: this.roomnum
      }, function(data) {
        self.userList = data.data.idlist;
      }, function() {});
    },

    renderRoom: function() {
      this.view = 2;
      this.chatList = [];
      this.createRoomModal = false;
      this.joinRoomModal = false;

    },

    joinSpecificRoom: function() {
      if (!this.role) {
        // this.role = 'Guest';
        this.role = 'LiveGuest';
      }
      if (!this.modalForm.roomnum) {
        this.$root.$refs.toastr.e("请输入房间id");
        return;
      }
      this.entryType = 'join';
      this.roomnum = String(this.modalForm.roomnum);
      this.renderRoom();
      this.initWebRTC();
    },

    joinRoom: function(e) {
      if (!this.role) {
        // this.role = 'Guest';
        this.role = 'LiveGuest';
      }
      this.entryType = 'join';
      this.roomnum = String(e.currentTarget.getAttribute("data-roomnum"));
      this.renderRoom();
      this.initWebRTC();
    },

    createRoom: function() {
      var self = this;
      this.entryType = 'create';
      this.role = 'LiveMaster';
      AppSvr.createRoom({}, function(data) {
        self.roomnum = data.data.roomnum;
        self.renderRoom();
        self.initWebRTC();
        AppSvr.reportRoom({
          roomname: '[极速模式] ' + self.modalForm.roomname,
          RoomNumber: self.roomnum
        });
      }, function() {});
    },
    quitRoom: function() {
      var self = this;
      ILiveSDK.quitRoom();
      AppSvr.reportJoinRoom({
        RoomNumber: self.roomnum,
        role: self.role,
        operate: 1
      });
      this.view = 1;
      this.onMic = 0;
      this.video_list = [];
      this.apply_list = [];
      this.role = BomQuery('role');
      clearInterval(applySto);
      this.applying = 0;
    },

    applyPushStream: function() {
      if (this.applying > 0) return;
      var self = this;
      this.applying = 30;
      clearInterval(applySto);
      applySto = setInterval(function() {
        if (self.applying <= 0) {
          self.applying = 0;
          clearInterval(applySto);
        }
        self.applying--;
      }, 1000);
      ILiveSDK.applyPushStream();
    },



    onRemoteCloseAudio: function() {
      console.log("on remote close audio!");
    },

    onRemoteLeave: function() {
      console.log("on remote leave!");
    },

    onRemoteCloseVideo: function() {
      console.log("on remote close video!");
    },

    onIceConnectionClose: function() {
      console.log("onIceConnectionClose!");
    },

    onKickout: function() {
      console.log("on kick out!");
      var self = this;
      self.$root.$refs.toastr.e("其他地方登录，被T下线");
      self.quitRoom();
      self.logout();
    },

    onRelayTimeout: function() {
      console.error('relayTimeout')
    },

    onRemoteStreamRemove: function(videoId) {
      // _.remove(this.video_list, function(o) {
      //   return o.videoId == videoId
      // })
      console.error('onRemoteStreamRemove', videoId)
      var newArr = [];
      var needResetFirst = false;
      _.each(this.video_list, function(o) {
        if (o.videoId != videoId) {
          newArr.push(o);
        } else if (o.first) {
          needResetFirst = true;
        }
      });
      console.debug(needResetFirst);
      if (needResetFirst && newArr[0]) {
        newArr[0].first = true;
      }
      console.debug('newArr', newArr);
      this.video_list = newArr;
      this.restoreVideo();
      var openid = WebRTCAPI.getOpenId(videoId.split('_')[0])
      this.chatList.push({
        who: openid,
        content: openid + "断开了视频连接",
        isSelfSend: 0,
        isSystem: 1
      });
    },

    onCreateRoomCallback: function(result) {
      var self = this;
      if (result !== 0) {
        self.$root.$refs.toastr.e("create room failed!!!");
        //return;
      }
      this.onMic = 1;
      ILiveSDK.startPushStream();
      if (self.role != 'LiveMaster') {
        AppSvr.reportJoinRoom({
          RoomNumber: self.roomnum,
          role: self.role,
          operate: 0
        });
      }
    },

    onJoinRoomCallback: function(result) {
      var self = this;
      if (result !== 0) {
        self.$root.$refs.toastr.e("create room failed!!!");
        return;
      }

      AppSvr.reportJoinRoom({
        RoomNumber: self.roomnum,
        role: self.role,
        operate: 1
      });
    },

    onLocalStreamAdd: function(stream) {
      var self = this;
      var videoId = "local";
      if (!_.find(this.video_list, function(o) {
        return o.videoId == videoId;
      })) {
        if (this.video_list.length == 0) {
          this.video_list.push({
            videoId: videoId,
            openId: "local",
            first: true,
            stream: stream
          });
        } else {
          this.video_list.push({
            videoId: videoId,
            openId: "local",
            stream: stream
          });
        }
      }

      if( stream ){
        this.video_map["local"] = stream;
      }
      if (!document.getElementById("local")) {
        setTimeout(function() {
          self.onLocalStreamAdd(stream);
        }, 50);
        return;
      }
      var video = document.getElementById("local");
      if (stream) {
        video.srcObject = stream;
      } else {
        video.poster = 'http://docs-1253488539.cossh.myqcloud.com/novideo.png';
      }
      video.muted = true
      // document.getElementById("local_extinfo").innerHTML = video.videoWidth + "x" + video.videoHeight

    },


    bindVideoStream: function( stream , videoId , openId){
      var self = this
      if (!document.getElementById(videoId)) {
        setTimeout(function() {
          self.bindVideoStream(stream, videoId, openId);
        }, 50);
        return;
      }
      var video = document.getElementById(videoId);
      video.srcObject = stream;
    },

    onRemoteStreamAdd: function(stream, videoId, openId) {
      console.debug( 'onRemoteStreamAdd',stream, videoId, openId )
      var self = this;
      if (!_.find(this.video_list, function(o) {
        return o.videoId == videoId;
      })) {
        if (this.video_list.length == 0) {
          this.video_list.push({
            videoId: videoId,
            first: true,
            openId: openId,
            stream: stream
          });
        } else {
          this.video_list.push({
            videoId: videoId,
            openId: openId,
            stream: stream
          });
        }
      }
      if( stream ){
        this.video_map[openId] = stream;
      }
      this.bindVideoStream( stream , videoId , openId);
    },

    onUpdateRemoteStream: function(stream, videoId,  type, state, openId) {
      console.debug( 'onUpdateRemoteStream openId',openId )
      this.chatList.push({
        who: openId,
        content: openId + "新增/更新了视频",
        isSelfSend: 0,
        isSystem: 1
      });
      this.onRemoteStreamAdd(stream, videoId, openId);
    },

    onWebSocketClose: function() {
      var self = this;
      self.quitRoom();
    },

    toggleMic: function() {

      if (this.open.audio) {
        ILiveSDK.closeMic();
      } else {
        ILiveSDK.openMic();
      }

      this.open.audio = !this.open.audio
    },
    toggleCamera: function() {
      if (this.open.video) {
        ILiveSDK.closeCamera();
      } else {
        ILiveSDK.openCamera();
      }
      this.open.video = !this.open.video
    },
    onInitResult: function(result) {
      var self = this;
      console.log("on init result : " + result);
      if (result !== 0) {
        var errorStr = "";
        if (result === -10001) {
          errorStr = "WebRTCJSAPI初始化参数不正确";
        } else if (result === -10002) {
          errorStr = "浏览器版本不正确";
        } else if (result === -10003) {
          errorStr = "sig校验失败";
        } else if (result === -10006) {
          errorStr = "WebSocket 初始化失败";
        } else {
          errorStr = "初始化错误";
        }
        alert(errorStr);
      } else {
        //自动完成登录，进房间操作
        if (self.entryType == "join") {
          if (self.role == 'Guest') {
            ILiveSDK.login(function() {
              // WebRTCAPI.ping(10, function(avg, list) {
              //   self.$root.$refs.toastr.Add({
              //     msg: "[Ping Res] avg:" + avg + "ms, list:" + list.join(','),
              //     timeout: 5000
              //   })
              // })
              ILiveSDK.joinRoom({
                roomid: self.roomnum,
                role: self.configRole
              }, self.onJoinRoomCallback);
            });
          } else {
            console.clear();
            ILiveSDK.login(function() {
              // WebRTCAPI.ping(10, function(avg, list) {
              //   self.$root.$refs.toastr.Add({
              //     msg: "[Ping Res] avg:" + avg + "ms, list:" + list.join(','),
              //     timeout: 5000
              //   })
              // })
              ILiveSDK.joinRoom({
                roomid: self.roomnum,
                role: self.configRole
              }, self.onCreateRoomCallback, self.onCreateRoomCallback);
            });
          }
        } else {
          ILiveSDK.login(function() {
            WebRTCAPI.ping(10, function(avg, list) {
              self.$root.$refs.toastr.Add({
                msg: "[Ping Res] avg:" + avg + "ms, list:" + list.join(','),
                timeout: 5000
              })
            })
            ILiveSDK.createRoom({
              roomid: self.roomnum,
              role: self.configRole
            }, self.onCreateRoomCallback);
          });
        }
      }
    }
  }
})
