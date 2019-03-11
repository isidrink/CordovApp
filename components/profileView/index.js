'use strict';

(function () {
    var view = app.profileView = kendo.observable();

    var localDataSource;
    function showResults(snap) {
        console.log(snap.val());
        $('ul.index').empty();
        $('ul.groups').empty();
        localDataSource = new kendo.data.DataSource({
            data: snap.val()
            //data: JSON.stringify(snap.val())
        });
         //$('pre').text( JSON.stringify(snap.val(), null, 2) );
        snap.forEach(function (ss) {
            var classDis = '';           
            /*console.log("index list--->",ss.val());
            if ( ss.val().players != undefined){
                console.log(Object.keys(ss.val().players).length);
                if(ss.val().num_players == Object.keys(ss.val().players).length) classDis = 'disabled';
            }*/
            var key = ss.key;
            $('<option />')
                .prop('value',key)
                .text(key)
                .appendTo('select.partidasSelect');
            //$('#index').append('<li><label><input type="checkbox" name="'+key+'" />'+key+'</label></li>'); 
            $('ul.index').append('<li data-id="'+key+'">'+key+' <button type="button" '+classDis+'></button></li>'); 
                       
        });

        /*$("select.partidasSelect").kendoDropDownList({
            select: function (e) { console.log(e.dataItem.value);$('#game_name').val(e.dataItem.value); getInfoGames(e.dataItem.value);},
            change: function (e) { console.log('--change select partidas--');},
        }); */ 

        initFirebaseGroups();
    } 

    var lastSnapAdded ='';
    var startF = false;
    var count = 0;
        
    function initFirebaseGroups(){
        
            app.utils.loading(false);
        console.log(startF);
        firebase.database().ref('users/' + app.user.uid + '/groups').on('child_added', added);
        firebase.database().ref('users/' + app.user.uid + '/groups').on('child_removed', removed);

            //app.utils.loading(false);
        function added(idxSnap, prevId) {
            // when an item is added to the index, fetch the data
            console.log("roomId initFirebaseGroups -->"+idxSnap.key);
            //if (lastSnapAdded != idxSnap.key){
                firebase.database().ref('games/'+idxSnap.key).once('value', function (dataSnap) {
                    //console.log(dataSnap.key, dataSnap.val().playing);
                    //console.log(dataSnap.key, dataSnap.val().num_players);
                    /*if(dataSnap.val().playing){                    
                        //app.set("roomID", dataSnap.key);
                        //app.navigation.navigateChat(dataSnap.key);  
                        //app.navigation.navigateUsersChat(dataSnap.key); 
                        app.mobileApp.navigate('components/contactsView/view.html');  

                    }*/
                    //console.log(lastSnapAdded);
                    //console.log("----lastSnapAdded-------");
                    addToList(dataSnap.key, dataSnap.val(), prevId);
                });
                lastSnapAdded = idxSnap.key;
            //}
        }

        function removed(snap) {
            count = 0;
            dropFromList(snap.key);
        }
        
        // catch button clicks and trigger add/remove
        watchForButtonClicks(addToIndex, dropFromIndex);
        
        function addToIndex(id) {
            firebase.database().ref('users/' + app.user.uid + '/groups/'+id).set(true);
        }
        
        function dropFromIndex(id) {
            firebase.database().ref('users/' + app.user.uid + '/groups/'+id).remove();
        }

        var indexGroups = {};
        firebase.database().ref('users/' + app.user.uid + '/groups').on('value', update);

        function watchForButtonClicks(add, remove) {
            $('ul.index button').click(function() {
                console.log("click");
                startF = true;
                console.log(startF);
            var myId = $(this).closest('li').attr('data-id');
                if( !indexGroups.hasOwnProperty(myId) ) {
                    add(myId);   
                    console.log("add");
                    addPlayersToGame(myId);
                }
                else {
                    remove(myId); 
                    console.log("remove");
                    removePlayersToGame(myId);
                }
                console.log("---------------------------------------");
            });   
        }
        function update(snap) {
            indexGroups = snap.val()||{};
            log(snap);
            $('ul.index li').each(function() {
                var myId = $(this).attr('data-id');
                var hasGroup = indexGroups.hasOwnProperty(myId);
                $(this).find('button').text(hasGroup? 'salir ' : 'entrar ').addClass(hasGroup? 'warning':'').removeClass(!hasGroup? 'warning':'').append(hasGroup? '<i class="fa fa-sign-out" aria-hidden="true"></i>' : '<i class="fa fa-sign-in" aria-hidden="true"></i>');
            });
        }

        function log(snap) {
            $('pre').text(JSON.stringify(snap.val(), null, 2));
        }    

        firebase.database().ref('games').on("child_changed", function(snapshot) {
            //console.log(snapshot.key, snapshot.child("players").numChildren());
            var b = snapshot.child("players").numChildren(); 
            $("input[name='players']").val(b);
            //listGames
            $('ul.groups').find('li[data-id="'+snapshot.key+'"]').find('span.members').text(b);
            $('ul.groups').find('li[data-id="'+snapshot.key+'"]').find('span.level').text(snapshot.val().level);
            $('ul.groups').find('li[data-id="'+snapshot.key+'"]').find('span.step2').addClass(snapshot.val().playing? 'active' : '').removeClass(!snapshot.val().playing? 'active' : '');
        });
    }

    function setNomineeToInactive(key){
        firebase.database().ref('games/'+key).child('votes').once('value', function(snapshot) {
            var exists = (snapshot.val() !== null);
            if (!exists){
                console.log(snapshot.val());
            }
        });
    }

    function increaseRound(key){
        var keyGame = key;
        var newScore =0;
        console.log("increaseRound");        
        firebase.database().ref('games/'+key).child('round').transaction(function(current_value) {
           newScore= current_value + 1;
           return (current_value || 0) + 1;
        }, function(error, committed) {
            if (committed) {
                firebase.database().ref('games/'+keyGame).child('playing').set(true);
                setNomineeToInactive(keyGame);
            }
        });
    }

    //https://gist.github.com/anantn?page=1
    
    function addToList(key, data, prevId) {
        var players = 0;
        if (data.players != null){
            console.log(count);
            count = count +1;
            console.log(lastSnapAdded);
            //console.log("----lastSnapAdded-------");
            if (count >= 2 && startF && lastSnapAdded==key)
            {
                console.log("random e");
                return;
            }else{
                lastSnapAdded=key;
                console.log("e random");
                
                $('#game_name').val(key);
                getInfoGames(key);
            }
            //if(lastSnapAdded != key){
                console.log("data addToList",data.timeStart, key);
                players = Object.keys(data.players).length;
                console.log("add users To List-->"+Object.keys(data.players).length);
                if(data.num_players == Object.keys(data.players).length){
                    $('input.submit').removeClass('hide');
                    //alert("Play Game");
                    firebase.database().ref('games/'+key).child('timeStart').once('value', function(snapshot) {
                        var exists = (snapshot.val() !== null);
                        if (!exists){
                            var dateTimeStamp = new Date().getTime();
                            console.log("dateTimeStamp-->",dateTimeStamp);
                            var dateString = new Date();
                            console.log("dateString--->",dateString.getUTCHours);
                            var formattedDate = (dateString.getUTCMonth() + 1) + ' ' + (dateString.getUTCDate() + data.num_players) +  ', ' +  dateString.getUTCFullYear() + ', ' + (dateString.getUTCHours() + 1)+':'+ dateString.getUTCMinutes();
                            console.log("formattedDate-->",formattedDate);
                            //var d1= "2 25, 2018, 6:16 pm";
                            firebase.database().ref('games/'+key).child('timeStart').set(formattedDate);
                            increaseRound(key);
                        }
                    });
                }
            //}
        }
        var className = '';
       var $prev = getPrevItem(prevId);
       var $prev2 = getPrevItem2(prevId);
       if (data.playing){
           className = 'step2 active'
       } else{
            className = 'step2'
       }
       var $item3 = $('<li data-icon="contacts" id="'+key+'">'+key + '</li>');
       var $item = $('<li class="info" data-id="'+key+'"><span>'+key + '</span>  <span class="members"><i class="fa fa-user-circle-o"></i> '+players+'</span> <span class="level">level '+data.level+'</span><span class="right '+className+'"><i class="fa fa-dot-circle-o" aria-hidden="true"></i> </span></li>');
       /*var $item = $('<li></li>')
           .text(key + '  jugadores : ' )
           //.text(key)
           .attr('data-id',key);*/
        if( $prev || $prev2) {
           $item.insertAfter($prev);
           $item3.insertAfter($prev2);    
        }
        else {
           $item.prependTo('ul.groups');  
            $item3.prependTo('#listGames'); 
        }
        return $item;   
    }
    function dropFromList(key) {
       $('ul.groups').find('li[data-id="'+key+'"]').remove();
       $('#listGames').find('li[data-id="'+key+'"]').remove();
    }
    
    function getPrevItem(prevId) {
        if( prevId !== null ) {
           return $('ul.groups').find('li[data-id="'+prevId+'"]');   
        }
    }
     function getPrevItem2(prevId) {
        if( prevId !== null ) {
           return $('#listGames').find('li[data-id="'+prevId+'"]');   
        }
    }
    function addPlayersToGame(roomId){
       console.log("roomId addPlayersToGame -->"+roomId);
       firebase.database().ref('games/'+roomId).child("players").child(app.user.uid).set(true); 
    }
    function removePlayersToGame(roomId){
       console.log("roomId removePlayersToGame -->"+roomId);
       firebase.database().ref('games/'+roomId).child("players").child(app.user.uid).remove();
    }

    function getInfoGames (roomId){
        //console.log(roomId);
        profileViewModel.set("usersInGame", []);
        firebase.database().ref('games/'+roomId).once("value")
        .then(function(snapshot) {
            var a = snapshot.numChildren();
            var b = snapshot.child("players").numChildren(); 
            console.log("------"+a,b);
            $("input[name='players']").val(b);
            snapshot.child("players").forEach(function (child) {
                var result;
                firebase.database().ref('users/' + child.key)
                .once('value')
                .then(function(snap) {
                    profileViewModel.addUser(snap.val());
                    //console.log(snap.val());
                    return snap.val();
                })
                //app.users = new kendo.data.ObservableArray(result);
                //console.log(app.users);
            });
        });
    }

    var validator;
    var profileViewModel = kendo.observable({
        profile: null,
        uploader: null,
        photoChanged: false,
        usersInGame:[],
        addUser: function(user) {
            console.log(user);
            console.log(this.get("usersInGame"));
            this.get("usersInGame").push({
                name: user.username,
                price: user.age,
                unitsInStock: 3
            });
        },
        gamesDataSource: new kendo.data.DataSource({
        data: [
            { name: "Alpha", lang: "es-ES", level: "0" },
            { name: "Bravo", lang: "es-ES", level: "3" },
            { name: "THe Godfather", lang: "ca-ES", level: "1" },
            { name: "The Simpsons", lang: "en-US", level: "1" }
        ]}),
        onSelectGame: function(e) {
            console.log(this.value);
            console.log("onSelectGame....");
        },
        onPlayGame: function(e) {
            console.log("onPlayGame");
            var roomName =  $('#game_name').val();
            //app.navigation.navigateChat(roomName);
            app.mobileApp.navigate('components/contactsView/view.html?id=' + roomName);
        },
        onChangeF: function(e) {
            var level = $("#levelF").val();
            var lang = $("#languageF").val();
            var city = $("#cityF").val();
            console.log("onChangeF");
            //var level, lang, city;
            //console.log($("#levelF").val(), $("#languageF").val(), $("#cityF").val());
            //console.log("onChangeF...."+JSON.stringify(localDataSource));
        },
        kendoFormattedText: function() {
            return kendo.format('{0:C}', 1234.5678);
        },
        loadKendoCulture: function(cultureName) {
            var cultureFileName = 'http://kendo.cdn.telerik.com/2017.2.504/js/cultures/kendo.culture.' + cultureName + '.min.js';
            console.log('loading kendo culture file: ' + cultureFileName);
            
            $.getScript(cultureFileName)
                .done(function() {         
                    console.log('kendo culture file successfully loaded');
                    kendo.culture(cultureName);
                    profileViewModel.trigger("change", {field: "kendoFormattedText"}); 
                })
                .fail(function() { 
                    console.log('failed to load kendo culture file');
                });
        },
        onChangeLanguage: function (e) {
            console.log(e);
            console.log($("#language").val());
            var str = ''
            switch($("#language").val()){
                case '1':this.loadKendoCulture('en-US');str = 'en';break;
                case '0':this.loadKendoCulture('es-ES');str = 'es';break;
                case '2':this.loadKendoCulture('ca-ES');str = 'ca';break;
            }
            console.log(str);
            app.localization.set('currentCulture', str);
        },
        onShow: function (e) {
            var profileID = e.view.params.pid;
            console.log(profileID);
            if(profileID =="undefined")app.mobileApp.navigate('components/authenticationView/view.html');
            //if (!roomID) roomID = "game1";
            
            console.log("onShow profileView");
            var userId = firebase.auth().currentUser.uid;
            //alert(userId);
            var userRef = firebase.database().ref('presence/'+ userId);
            userRef.set(true);
            var profileScroller = e.view.scroller;
            profileScroller.reset();
            var user = firebase.auth().currentUser;
            //console.log("-->"+JSON.stringify(user));

            var profile = kendo.observable({
                DisplayName: user.displayName,
                Email: user.email,
                Language: 'es-ES',
                Picture: user.photoURL
            });
            
            $('#preview').show();
            $('#local-preview').hide();
            $('#preview2').show();
            $('#local-preview2').hide();
            /*$('#preview').show();
            $('#local-preview').hide();*/

            app.fetchUser(user.uid).then(function(result){
                //console.log(result);
                console.log("user photoURL"+user.photoURL);
                profile.Picture = result.profile_picture ? result.profile_picture : '';
                profile.PictureUrl = result.profile_picture ? result.profile_picture : '';
                profile.Age= result.age;
                profile.City= result.city;
                profile.Wins= result.resume.wins;
                profile.Played= result.resume.played;
                profile.Position= result.resume.position;
                profileViewModel.set('profile', profile);
            });  

            if (profile.Picture) {
                console.log(profile.Picture);
                //profile.PictureUrl = app.constants.whitePicture;

                $('#local-preview').show();
                $('#preview').hide();
                $('#local-preview2').show();
                $('#preview2').hide();
            } else {
                $('#preview').attr('src', app.constants.defaultPicture);
                $('#preview2').attr('src', app.constants.defaultPicture);
                $('#preview').hide();
                $('#local-preview').show();
            }
            
            this.uploader = new app.utils.imageUploader('.chooseFile', '#msform', '#profile-activity-photo');
            this.uploader.onImage(function (uri) {
                /*
                console.log(uri);
                this.set('photoChanged', true);
                this.set('profile.PictureUrl', uri);
                $('#preview').hide();
                $('#local-preview').show();
                $('#preview2').hide();
                $('#local-preview2').show();
                */
               app.getDataUri(uri, function(dataUri) {
                        // Do whatever you'd like with the Data URI!
                        //console.log("///***///"+dataUri);
                        //alert("///***///"+dataUri);
                        profileViewModel.set('photoChanged', true);
                        profileViewModel.set('profile.PictureUrl', dataUri);
                        $('#preview').hide();
                        $('#local-preview').show();
                        $('#preview2').hide();
                        $('#local-preview2').show();
                    });
            }.bind(this));

            validator = app.validate.getValidator('#msform');
            /******************************next and prev buttons**************************************/
            var i=2;
            $('input.next').click(function(){
                var whichStep = $(this).parent().attr('id');                
                $(this).parent().hide().next().show();
                /****************************/
                $('.progress .circle:nth-of-type(' + i + ')').addClass('active');
                $('.progress .circle:nth-of-type(' + (i - 1) + ')').removeClass('active').addClass('done');
                $('.progress .circle:nth-of-type(' + (i - 1) + ') .label').html('&#10003;');
                $('.progress .bar:nth-of-type(' + (i - 1) + ')').addClass('active');
                $('.progress .bar:nth-of-type(' + (i - 2) + ')').removeClass('active').addClass('done');
                i++;
            });
            $('input.previous').click(function(){
                i--;
                $(this).parent().hide().prev().show();
                $('.progress .circle:nth-of-type(' + i + ')').removeClass().addClass('circle');
                $('.progress .circle:nth-of-type(' + (i - 1) + ')').addClass('active').removeClass('done');
                $('.progress .circle:nth-of-type(' + (i - 1) + ') .label').html(i-1);
                $('.progress .bar:nth-of-type(' + (i - 1) + ')').removeClass('active');
                $('.progress .bar:nth-of-type(' + (i - 2) + ')').addClass('active').removeClass('done');                
            });

            $('select.partidasSelect').on('change', function() {
                //console.log(localDataSource); 
                $('#game_name').val(this.value);
                getInfoGames(this.value);
                $('#step2next').removeClass("hide");
            });
            
            console.log(app.localization.currentCulture);
            if(app.localization.currentCulture == '')app.localization.set('currentCulture',  app.localization.defaultCulture);
            app.localization.set('currentCulture',  app.localization.currentCulture);
        },
        onInit: function () {
            console.log("onInit");
            app.utils.loading(true);
            /*$('#language').trigger('click');
            

            $('#language').click(function(){
            alert($(this).val());
            });*/
            /************************firebase groups*****************************/
            // get infoPartidas for dropdown
            firebase.database().ref('games').once('value', showResults, console.error);
           
        },
        onHide: function () {
            count = 0;
            startF = false;
            this.uploader.detach();
            $('#preview').attr('src', app.constants.whitePicture);
            $('#local-preview').attr('src', app.constants.whitePicture);
            $('#preview2').attr('src', app.constants.whitePicture);
            $('#local-preview2').attr('src', app.constants.whitePicture);
        },
        updateProfile: function () {
            if (!validator.validate()) {
                return;
            }

            var profile = this.profile;
            var user = app.user;
            var model = {
                Id: user.uid
            };

            if (profile.DisplayName !== user.DisplayName) {
                model.DisplayName = profile.DisplayName;
            }

            if (profile.Language !== user.Language) {
                model.Language = profile.Language;
            }

            if (profile.Age !== user.Age) {
                model.Age = profile.Age;
            }

            if (profile.City !== user.City) {
                model.City = profile.City;
            }

            if (profile.Email !== user.Email) {
                model.Email = profile.Email;
            }

            app.utils.loading(true);
            var promise;

            var user = firebase.auth().currentUser;
            
            //https://codepen.io/brandontravis/pen/VYmdGp
            console.log(profile);
            user.updateProfile({
                displayName: profile.DisplayName,
                //photoURL: profile.PictureUrl
            }).then(function(user) {
                // Update successful.
                //app.user = user;
                var user2 = firebase.auth().currentUser;
                console.log("--++--"+user2+"--++--");
                app.utils.loading(false);
                console.log(profile);
                app.writeUserData2(user2.uid, profile);
            }).catch(function(error) {
              // An error happened.
            });          
        }
    });

    view.set('profileViewModel', profileViewModel);
}());
