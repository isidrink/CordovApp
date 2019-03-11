'use strict';


    var menuNav, menuNav2;
    var players = {};
    var last_timestamp='';
app.contactsView = kendo.observable({
    roomID: '',
    path: '',
    unread: [],
    usersDataSource: new kendo.data.DataSource({
        data: []
    }),
    uploader2: null, 
    uploader3: null,
    dataSourceChatGroup: new kendo.data.DataSource({
        sort: { field: "timestamp", dir: "asc" },
        data: []
    }),
    showButtons: true,
    showChatGroup: false,
    showChallenge: false,
    showUsers: true,
   showNominations:false,
    addChatGroup: function(message) {
        var user;
        app.fetchUser(message.user)
        .then(function(userData) {
            user = userData;
            //console.log(userData);                
        })
        .then(function() {
            //console.log("finish fetchuser addChatGroup?");
            //console.log(user);
            //console.log(new Date(message.date).getTime());
            app.contactsView.dataSourceChatGroup.add({
                id: message.user,
                name: user.username,
                timestamp: new Date(message.date).getTime(),
                img: user.profile_picture,
                //img: 'styles/img/default.jpg',
                message: message.message,
                date: message.date
            });
                    scrollToBottom();
        });
    },
    usersInRoom:[],
    addUser: function(user, userId, presence) {
        this.get("usersInRoom").push({
            id: userId,
            img: user.profile_picture,
            presence: presence,
            name: user.username,
            email: user.email
        });
    },
    updateSendButton: function () {
        $('#sendButton').data('kendoMobileButton').enable($('#messageTextBox').val().length);
    },
    updateSendButton2: function () {
        $('#sendButton2').data('kendoMobileButton').enable($('#messageTextBox2').val().length);
    },
    dataSourceChat: new kendo.data.DataSource({
        sort: { field: "timestamp", dir: "asc" },
        data: []
    }),
    onClickCheckbx: function (e) {
        console.log("onClickCheckbx chatView");
        console.log(e.data.name); 
        //$('#hiddenName').attr('value', e.target.value);   
        //$('#TxtAreaVotes').val("I nominee "+e.target.value+" because...");
        //updateSendButton();
    },
    sendNominee: function (e) {
        console.log("-- sendNominee --");
        var messageVotes = $('.TxtAreaVotes').val();
        console.log(messageVotes);
        var nominee = $('#hiddenName').val();       
        console.log(nominee);
        disableCheckbox(true);
        nomineePlayer(nominee);

    },
    hasData:true,
    addChatsRoom: function(snap) {
        //alert("random");
        var message = snap.val();
        var messageKey = snap.key;
        console.log(message.tmpstmp);
        
        var user;
        /*app.fetchUser(message.user)
        .then(function(userData) {
            user = userData;
            //console.log(userData);                
        })
        .then(function() {
            //console.log("finish fetchuser addChatGroup?");
            //console.log(user);
            //console.log(new Date(message.date).getTime());
            app.contactsView.dataSourceChat.add({
                id: message.user,
                name: '@',
                timestamp: new Date(message.date).getTime(),
                //img: 'styles/img/default.jpg',
                message: message.message,
                date: message.date
            });
            scrollToBottom();
        });*/
        if(last_timestamp != message.tmpstmp){
            app.contactsView.dataSourceChat.add({
                id: message.user,
                name:'',
                //timestamp: new Date(message.date).getTime(),
                timestamp: message.tmpstmp,
                message: message.message,
                date: message.date
            });
            scrollToBottom();
            last_timestamp = message.tmpstmp;
        }
        
        
        $(".fancybox")
        .attr('rel', 'gallery')
        .fancybox({
            openEffect  : 'none',
            closeEffect : 'none',
            nextEffect  : 'none',
            prevEffect  : 'none',
            padding     : 0,
            margin      : [20, 60, 20, 60] // Increase left/right margin
        });
    },
    onInitChat: function(e) {
        console.log("onInitChat chatView");
        var roomChatID = e.view.params.chid;
        console.log(roomChatID);
        
        /*app.contactsView.dataSourceChat.bind("change", function () {
            app.contactsView.set("hasData", app.contactsView.dataSourceChat.total() > 0);
        });*/
        this.uploader3 = new app.utils.imageUploader('.messageImage2', '#msform3', '#chat-message-photo2');
        this.uploader3.onImage(function (uri) {
            // Usage
            console.log("entra");
            console.log(app.contactsView.path);
            //sendImgFirebase(uri);
            app.getDataUri(uri, function(dataUri) {
                    // Do whatever you'd like with the Data URI!
                    //console.log(dataUri);
                    var now = new Date();
                    var userId = firebase.auth().currentUser.uid;           
                    firebase.database().ref(app.contactsView.path).push({
                        message: dataUri,
                        tmpstmp: firebase.database.ServerValue.TIMESTAMP,
                        date: now.toString(),
                        user: userId
                    });
                }); 
        }.bind(this));
    },
    onShowChat: function(e) {
        console.log(app.contactsView.userRoomID);
        console.log("onShowChat chatView");
        var roomChatID = e.view.params.chid;
        console.log(roomChatID);
        /*********chat room layout**********/
        menuNav2 = menuNav2 || $("#menu-navbar2").data("kendoMobileNavBar");

        fetchUser(roomChatID)
        .then(function(userData) {
            //console.log(userData.username, userData.profile_picture);
            $('img.profileImg').attr("src", userData.profile_picture);            
            menuNav2.title(userData.username);
            
            getData2(roomChatID);
        })
        .then(function() {
            console.log("finish fetchuser onShowChat?!");
        });
        
        /****************************/
        app.contactsView.updateSendButton2();
        
        $('#messageTextBox2').keyup(function () {
            app.contactsView.updateSendButton2();
        });
        
        /*firebase.database().ref('games/' +  app.contactsView.roomID).child('chatroom_members/'+app.contactsView.userRoomID).child(app.user.uid).set({
            status: "online",
            unread: 0
        });*/    
    },
    onHideChat: function(e) {
            console.log(app.contactsView.userRoomID);
            firebase.database().ref('games/' +  app.contactsView.roomID).child('chatroom_members/'+app.contactsView.userRoomID).child(app.user.uid).set({
                status: "offline",
                unread: 0
            });
            console.log("onHideChat chatView");
            //app.contactsView.set("showChatRoom", true);
            //app.contactsView.set('path', 'games/' + app.contactsView.roomID+'/chatgroup');
            app.contactsView.set('dataSourceChat',  new kendo.data.DataSource({
                //sort: { field: "timestamp", dir: "asc" },
                data: []
            }));
    },
    onShow: function(e) {
        console.log("onShow chatView");
        var roomID = e.view.params.id;
        console.log(roomID);
        
        if (!roomID) roomID = "game1";
        
        app.contactsView.updateSendButton();

        $('#messageTextBox').keyup(function () {
            app.contactsView.updateSendButton();
        });
        /***************************************/
        $(".kendo-switch").kendoMobileSwitch({
            change: function(e){
            alert(this.value())
            },
            onLabel: "YES",
            offLabel: "NO"
        }); 
        
        //var tabstrip = $("#menu-nav").data("kendoMobileTabStrip");
        // Set the first tab badge value to 5
        //tabstrip.badge(1, 5);
        $("input.serialcheck").click(function(){
            var test = $(this).val();
            console.log(test);
            $("input.serialcheck[value!="+test+"]").attr('disabled', $(this).is(":checked"));
        });
        //$("#listView").data("kendoListView").dataSource.read();
        //https://codepen.io/chriscoyier/pen/FCIap
    },
    send: function (e) {
        console.log(app.contactsView.path);
        var str = app.contactsView.path;
        //alert(str);
        e.preventDefault();
        if (str.indexOf("chatroom") >= 0){
            var message = $('#messageTextBox2').val();
            detectOfflineUnread(app.contactsView.path);
        }else{
            var message = $('#messageTextBox').val();
        }
        var now = new Date();
        var userId = firebase.auth().currentUser.uid;           
        firebase.database().ref(app.contactsView.path).push({
            message: message,
            tmpstmp: firebase.database.ServerValue.TIMESTAMP,
            date: now.toString(),
            user: userId
        });
        if (str.indexOf("chatroom") >= 0){
            $('#messageTextBox2').val(''); 
            app.contactsView.updateSendButton2();
        }else{
            $('#messageTextBox').val('');
            app.contactsView.updateSendButton();
        }                        
        scrollToBottom();
        //app.drawerModel.showChatMessageWithoutSound(message, userId,chatViewModel.roomID);
    },
    onInit: function(e) {
        console.log("onInit chatView");
        var roomID = e.view.params.id; 
        if (!roomID) roomID = "game1";
        app.contactsView.set('roomID', roomID);
        getData(roomID);
        //app.contactsView.set('path', 'games/' + roomID+'/chatgroup'); 
        $(".item").kendoTouch({
            tap: function(e) {
                console.log(e.touch.target + " was tapped");
            }
        });
        this.uploader2 = new app.utils.imageUploader('.messageImage', '#msform2', '#chat-message-photo');
        this.uploader2.onImage(function (uri) {
            // Usage
            console.log("entra");
            console.log(app.contactsView.path);
            //sendImgFirebase(uri);
            app.getDataUri(uri, function(dataUri) {
                    // Do whatever you'd like with the Data URI!
                    //console.log(dataUri);
                    var now = new Date();
                    var userId = firebase.auth().currentUser.uid;           
                    firebase.database().ref('games/'+app.contactsView.roomID+'/chatgroup/').push({
                        message: dataUri,
                        tmpstmp: firebase.database.ServerValue.TIMESTAMP,
                        date: now.toString(),
                        user: userId
                    });
                }); 
        }.bind(this));
        
        $(".fancybox")
        .attr('rel', 'gallery')
        .fancybox({
            openEffect  : 'none',
            closeEffect : 'none',
            nextEffect  : 'none',
            prevEffect  : 'none',
            padding     : 0,
            margin      : [20, 60, 20, 60] // Increase left/right margin
        });
    },
    afterShow: function(e) {
        
        //var listgroup = e.view.element.find("#userList").kendoMobileListView();
        
        //setTimeout(function(){
            //setBadges();			
        //}, 10000);
    }   
});
app.localization.registerView('contactsView');


function nomineePlayer(name){
    var ref2 = firebase.database().ref('games/' + app.contactsView.roomID);
    var nomineeScoreRef = ref2.child("votes").child("nomineeScore"), nomineeNameRef = ref2.child("votes").child("nomineeName"), upvotesRef = ref2.child("votes");
    var newScore =0;
    upvotesRef.child(name+"/nominees").transaction(function(current_value) {
       newScore= current_value + 1;
       return (current_value || 0) + 1;
    }, function(error, committed) {
        if (committed) {                
            upvotesRef.child(name).setWithPriority({ nominees:newScore }, newScore);
            nomineeScoreRef.transaction(function (currentHighestScore) {
                if (currentHighestScore === null || newScore > currentHighestScore) {
                  nomineeNameRef.set(name);
                  // The return value of this function gets saved to the server as the new highest score.
                  return newScore;
                }
                // if we return with no arguments, it cancels the transaction.
                return;
            });
        }
    });
}

function detectOfflineUnread(path){
    console.log(app.contactsView.path);
    firebase.database().ref('games/' +  app.contactsView.roomID).child('chatroom_members/'+app.contactsView.userRoomID).once('value', function(snap) {
        //console.log (snap.val());                
        //console.log("random detect");
        var snapData = snap.val();
        var snapKey = snap.key;
        $.each( snapData, function( key, value ) {  
            if(key != app.user.uid){
            console.log("++++++++++++++++++++++",key, value );
                if(value.status == "offline"){
                    console.log("transaction unread");
                    var newScore =0;
                    firebase.database().ref('games/' +  app.contactsView.roomID).child('chatroom_members/'+app.contactsView.userRoomID).child(key).child('unread').transaction(function(current_value) {
                        newScore= current_value + 1;
                        return (current_value || 0) + 1;
                    }, function(error, committed) {
                        if (committed) {
                            console.log("committed");
                        }
                    });
                }
            }
        });
    });
    /*firebase.database().ref(app.contactsView.path).ref('members/'+app.contactsView.roomID).once('value', function(snap) {
        console.log (snap.val());                
        var snapData = snap.val();
        var snapKey = snap.key;
        $.each( snapData, function( key, value ) {  
            if (key != firebase.auth().currentUser.displayName){
                console.log("++++++++++++++",key, "++++++++++++++"); 
                console.log("++++++++++++++",value, "++++++++++++++");
                if (!value){
                    console.log("++++++++++++transaction++++++++++", key+'_badge_'+firebase.auth().currentUser.uid);
                    var newScore =0;
                    firebase.database().ref('chatroom_unread').child(firebase.auth().currentUser.uid+'_badge_'+key).transaction(function(current_value) {
                        newScore= current_value + 1;
                        return (current_value || 0) + 1;
                    }, function(error, committed) {
                        if (committed) {
                            console.log("committed");
                        }
                    });
                }
            }
        });
    }); */           
}

function getDataUri(url, callback) {
    var image = new Image();

    image.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
}

function detectHasRoom(user1, user2){
    var fb = firebase.database().ref('games/' + app.contactsView.roomID);
    var online = "online";
    var findit = false;
    var membersRef2 = fb.child('memberschatroom');
    var membersRef = fb.child('members');
    membersRef.once('value')
    .then(function(snap) {
        console.log("--->",snap.val(),"<---");
        if (snap.val() != null && !findit){
            snap.forEach(function(childSnapshot) {
                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                //console.log("////"+childKey,childData);
                console.log("************"+childKey+"*************");
              
                if((childData.user1 == user1 || childData.user2 == user1)){
                    //console.log(user1+" find it");
                    if ((childData.user1 == user2 || childData.user2 == user2)){
                        //console.log(user2+" find it");
                        app.contactsView.set('userRoomID', childKey);
                        app.contactsView.set('path', 'games/' + app.contactsView.roomID+'/chatroom/'+childKey);
                        app.contactsView.set("showChatRoom", false); 
                        /************chatViewModel.userRoomID************/ 
                        findit = true;
                        // Cancel enumeration
                        return true;    
                    }
                }
            });
            console.log("**************findit?!****************", findit);
            if (!findit){
                var newRoomKey = fb.child('chatrooms').push().key;
                var membersRef2 = fb.child('chatroom_members');
                membersRef2.child(newRoomKey).child(user1).set({status: online, unread:0});
                membersRef2.child(newRoomKey).child(user2).set({status: online, unread:0});
                var membersRef = fb.child('members');
                membersRef.child(newRoomKey+"/user1").set(user1);
                membersRef.child(newRoomKey+"/user2").set(user2);
                app.contactsView.set('userRoomID', newRoomKey);
                app.contactsView.set('path', 'games/' + app.contactsView.roomID+'/chatroom/'+newRoomKey);
                app.contactsView.set("showChatRoom", false); 
            }
        }else{
            var newRoomKey = fb.child('chatrooms').push().key;
            var membersRef2 = fb.child('chatroom_members');
            membersRef2.child(newRoomKey).child(user1).set({status: online, unread:0});
            membersRef2.child(newRoomKey).child(user2).set({status: online, unread:0});
            var membersRef = fb.child('members');
            membersRef.child(newRoomKey+"/user1").set(user1);
            membersRef.child(newRoomKey+"/user2").set(user2);
            app.contactsView.set('userRoomID', newRoomKey);
            app.contactsView.set('path', 'games/' + app.contactsView.roomID+'/chatroom/'+newRoomKey);
            app.contactsView.set("showChatRoom", false); 
        }
         
        firebase.database().ref('games/' +  app.contactsView.roomID).child('chatroom_members/'+app.contactsView.userRoomID).child(app.user.uid).set({
            status: "online",
            unread: 0
        });
    });
}

function sendImgFirebase(img) {
    console.log("sendImg---->"+img);
    getDataUri(img, function(dataUri) {
        // Do whatever you'd like with the Data URI!
        console.log(dataUri);
    });
    var now = new Date();
    var userId = firebase.auth().currentUser.uid;           
    firebase.database().ref('chatroom/'+app.contactsView.roomID).push({
        message: img,
        date: now.toString(),
        user: userId
    });
};

function scrollToBottom() {
        var scroller = app.mobileApp.scroller();
        //console.log("scrollheight " + scroller.scrollHeight() + " height: " + scroller.height());
        var offset = scroller.height();
        if (offset == 0)
            offset = 60;
        if (scroller.height() < scroller.scrollHeight()) scroller.scrollTo(0, scroller.scrollHeight() * -1 + (offset-40));
}

 var books = {};
function getData(roomID) { 
  
    console.log("getData-->",roomID);
    firebase.database().ref('games/' + roomID).child('players').on('child_added', addPlayer);
    //firebase.database().ref('games/' + roomID).child('players').on('child_changed', changePlayer);
    firebase.database().ref('games/' + roomID).child('chatgroup').on('child_added', addMessageGroup);
    firebase.database().ref('games/' + roomID).child('chatroom_members/').on('child_changed', addBadge);
    //firebase.database().ref('quiz/').on('child_added', addQuestions);
    //firebase.database().ref('games/' + roomID).child('timeStart').on('value', changeTimer);
}
function getData2(roomChatID) {
    console.log(roomChatID);
    console.log(app.contactsView.path);
    firebase.database().ref(app.contactsView.path).on('child_added', app.contactsView.addChatsRoom); 
        /*app.contactsView.set('dataSourceChat',  new kendo.data.DataSource({
                sort: { field: "timestamp", dir: "asc" }
                data: []
            }));*/
    /*var listView = $("#chatUserRoomList").data("kendoListView");
    // refreshes the ListView
    listView.refresh();*/
}
/**********************************/
function fetchUser(userId) {
    console.log("*****fetchUser*****");
    return firebase.database().ref().child('users').child(userId)
    .once('value')
    .then(function(snap) {
        return snap.val();
    })
}

function addPlayer(snap) {
    console.log("*****addPlayer*****");
    var userStatus = snap.val();
    var userId = firebase.auth().currentUser.uid;
    var userKey = snap.key;
    console.log(userKey);
    console.log(userId);
    if(userKey != userId){
        fetchUser(userKey)
        .then(function(userData) {
            console.log(userData);
            app.contactsView.usersDataSource.add({
                id: userKey,
                img: userData.profile_picture,
                presence: userStatus,
                name: userData.username,
                email: userData.email
            });
            //app.contactsView.addUser(userData, userKey, userStatus);
            players[snap.key] = userData;
        })
        .then(updateUserList);
    }else{
        console.log("<--++-->",userStatus);
        if(userStatus == 'inactive'){
            console.log("sacamos notify"); 
            app.notify.info('You are inactive!!');
            app.contactsView.set("inactive", true);
        } 
    }
}

function addBadge(snap){
    var snapData = snap.val();
    var snapKey = snap.key;
    console.log("addBadge-->",snapData, snapKey,"<--");
    var stringid ="";
    firebase.database().ref('games/' + app.contactsView.roomID).child('chatroom_members/').child(snapKey).child(app.user.uid).once('value', function(snapshot) {
        var exists = (snapshot.val() !== null);
        var pathSnap="";
        var numUnread="";
        console.log(exists);
        if(exists){
            $.each( snapData, function( key, value ) {
                if(key != app.user.uid){
                    pathSnap=app.user.uid+"_badge_"+key;
                }else{
                    numUnread=value.unread;
                }
            });
            console.log("++++++++++++++++++string++++++++++++++++++",pathSnap,"--",numUnread); 
            //$('#'+stringid).kendoMobileButton({badge: value.unread});
            //console.log("+++--->",$('#'+stringid).data("kendoMobileButton"),"<--+++");
            if($('#'+pathSnap).data("kendoMobileButton") != null){
                if (numUnread == 0)
                    //$('#'+pathSnap).data("kendoMobileButton").badge(false);
                    $('#'+pathSnap).data("kendoMobileButton").badge(false);
                else
                    $('#'+pathSnap).kendoMobileButton({badge: numUnread});//$('#'+stringid).data("kendoMobileButton").badge(value.unread)
            }
        }
    });
    app.contactsView.get("unread").push(snapData);
    //var tabstrip = $(document).find("#menu-nav").data("kendoMobileTabStrip");
    //tabstrip.badge(1,Math.floor(Math.random()*150));
}

function addMessageGroup(snap) {
    console.log("*****addMessageGroup*****");
    var message = snap.val();
    var messageKey = snap.key;
    if (!app.contactsView.showChatGroup){
        var tabstrip = $(document).find("#menu-nav").data("kendoMobileTabStrip");
        var num_unread = tabstrip.badge(1); 
        //console.log(num_unread);
        if(num_unread == "undefined")num_unread=0;
        num_unread ++;
        tabstrip.badge(1, num_unread);
    }
    //console.log(message);
    // Get the current badge value on the first tab.
    //console.log(tabstrip.badge(1));     
    //$('pre').text( JSON.stringify(snap.val(), null, 2) );
    app.contactsView.addChatGroup(message);                    
}
 
function updateUserList() {
    console.log("*****updateUserList*****");
    //$('pre.usersList').text(JSON.stringify(players, null, 2));
    /******************************************************/

    // You can cancel the enumeration at any point by having your callback
    // function return true. For example, the following code sample will only
    // fire the callback function one time:
    var query = firebase.database().ref('games/' + app.contactsView.roomID).child('chatroom_members/').orderByKey();
    query.once("value")
    .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            var snapData = childSnapshot.val();
            var snapKey = childSnapshot.key;
            var i=0;
            var stringid ="";
            console.log(snapData, snapKey);
            firebase.database().ref('games/' + app.contactsView.roomID).child('chatroom_members/').child(snapKey).child(app.user.uid).once('value', function(snapshot) {
                var exists = (snapshot.val() !== null);
                var pathSnap="";
                var numUnread="";
                if(exists){
                    $.each( snapData, function( key, value ) {
                        if(key != app.user.uid){
                            pathSnap=app.user.uid+"_badge_"+key;
                        }else{
                            numUnread=value.unread;
                        }
                    });
                    console.log("++++++++++++++++++string++++++++++++++++++",pathSnap,"--",numUnread); 
                    //$('#'+stringid).kendoMobileButton({badge: value.unread});
                    //console.log("+++--->",$('#'+stringid).data("kendoMobileButton"),"<--+++");
                    if($('#'+pathSnap).data("kendoMobileButton") != null){
                        if (numUnread == 0)
                            $('#'+pathSnap).data("kendoMobileButton").badge(false);
                        else
                            $('#'+pathSnap).kendoMobileButton({badge: numUnread});//$('#'+stringid).data("kendoMobileButton").badge(value.unread)
                    }
                }
            });             
            // Cancel enumeration
            //return true;
        });
    });    
}
function disableCheckbox(stateC){
    console.log("alertVote"); 
    $('input[type=checkbox]').each(function () {
         //$(this).data("kendoMobileSwitch").enable(!$(this).is(":checked"));
         ///$(this).attr("disabled", stateC);
         //$(this).parent().addClass('km-state-disabled');
         var test = $(this).val();
         console.log("*********",test,"*************");
         $("input.serialcheck2[value!="+test+"]").attr('disabled', true);

     });

    
    /*var buttons = document.getElementsByClassName('buttonSwitch')
    for (var i = 0; i < buttons.length; i++) {
        var id = buttons[i].id;
        //$("#" + id).data("kendoMobileSwitch").enable(stateC);
        $("#" + id).data("kendoMobileSwitch").enable(stateC);
    }*/
}  
function setBadges() {
    
  var buttongroup = $("#buttongroup").data("kendoMobileButtonGroup");

  // Set the first button badge value to 5
  buttongroup.badge(0, 5);
  // Set the last button badge value to 10
  buttongroup.badge("li:last", 10);
  // Get the current badge value on the first button.
  console.log(buttongroup.badge(0));
  // Remove the first button badge
  buttongroup.badge("li:first", false);
}

function disable() {
    document.getElementById("myCheck").disabled = true;
    //$("#button0").data("kendoButton").enable(false);
}

function undisable() {
    document.getElementById("myCheck").disabled = false;
}


// START_CUSTOM_CODE_contactsView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
(function () {
    app.contactsView.set('title', 'Contacts');

    app.contactsView.set('dataSource', app.contactsView.usersDataSource);
    
    app.contactsView.set('changeView', function (e) { 
        //alert("value = " + tabStripData[selectedIndex].value);
        //console.log($(e.item));
        kendo.mobile.application.scroller().reset();
        //console.log($(e.item).index());
        switch($(e.item).index()){
            case 0:
                this.set("showNominations", false); 
                this.set("showChatFooter", false);              
                this.set("showButtons", true);
                this.set("showUsers", true);
                this.set("showChatGroup", false);
                break;
            case 1:
                this.set("showNominations", false);
                var tabstrip = $(document).find("#menu-nav").data("kendoMobileTabStrip");
                tabstrip.badge(1,false); 
                // Get the current badge value on the first tab.
                //console.log(tabstrip.badge(1));            
                app.contactsView.set('path', 'games/' + app.contactsView.roomID+'/chatgroup');
                this.set("showChatGroup", true);   
                this.set("showChatFooter", true); 
                this.set("showUsers", false);
                scrollToBottom();  
                break;
            case 2:        
                this.set("showChatFooter", false);     
                this.set("showButtons", false);
                this.set("showUsers", true);
                this.set("showChatGroup", false);
                    break;
            case 3:
                this.set("showNominations", false);
                this.set("showChatFooter", false); 
                this.set("showUsers", false);
                this.set("showChatGroup", false);
                break;
        }
    });
    app.contactsView.set('onSelect', function (e) { 
        console.log(e); 
    });
    
    app.contactsView.set('alertVote', function (e) {
        console.log(e.target.value); 
        $('#hiddenName').attr('value', e.target.value);   
        $('.TxtAreaVotes').val("I nominee "+e.target.value+" because...");
        this.set("showNominations", true);
        //disableCheckbox(true);
    });
    
    app.contactsView.set('acceptChatRequest', function (e) { 
        var userId = firebase.auth().currentUser.uid;
        //console.log(e.data);
        var id = e.data.id;
        detectHasRoom(userId, id);
        app.mobileApp.navigate('components/contactsView/userchat.html?chid=' + e.data.id);
    });
    
    app.contactsView.set('acceptRequest', function (e) { 
        //console.log(e.data); 
        app.mobileApp.navigate('components/profileView/view.html?pid=' + e.data.id);
    });
})();
// END_CUSTOM_CODE_contactsView