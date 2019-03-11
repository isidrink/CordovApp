(function () {
    var app = {
        data: {},
        localization: {
            defaultCulture: 'es',
            cultures: [{
                name: "Catalan",
                code: "ca"
            },{
                name: "Español",
                code: "es"
            },{
                name: "English",
                code: "en"
            }]
        },
        navigation: {
            viewModel: kendo.observable()
        }};

    var bootstrap = function () {
        $(function () {
            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'nova',
                initial: 'components/emptyView/view.html',
                init: function () {
                    console.log("init App");
                    firebase.auth().onAuthStateChanged(function(user) {
                        console.log(user);
                        if (user) {
                            // User is signed in.
                            app.user = user;                                                              
                            //app.navigation.navigateUsers();
                            app.mobileApp.navigate('components/profileView/view.html');
                            //app.mobileApp.navigate('components/contactsView/view.html');
                            
                        } else {
                          // No user is signed in.
                            app.mobileApp.navigate('components/authenticationView/view.html');
                        }
                    });
                }
            });
        });
    };

    app.isCordova = !!window.cordova;

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li a.active').removeClass('active');
        currentItem.addClass('active');
    };
    
    
    app.events = {
        dragging: function(e) {
          var left = e.sender.element.position().left;
          if (left <= 0) {
            e.sender.element.css("left", left + e.touch.x.delta);
          }
        },
        dragend: function(e) {
          //console.log(e);
          var el = e.sender.element;
          // get the listview width 
          var width = $("ul").width();
          // set a threshold of 75% of the width
          var threshold = (width * .25);          
          // if the item is less than 75% of the way across, slide it out
          if (Math.abs(el.position().left) > threshold) {
            kendo.fx(el).slideIn("right").duration(500).reverse();
          }
          else {
            el.animate({ left: 0 });
          }
        },
        swipe: function(e) {
          if (e.direction === "left") {
            var del = e.sender.element;
            kendo.fx(del).slideIn("right").duration(500).reverse();
          }
        },
        tap: function(e) {
          // make sure the initial touch wasn't on the archive button
          var initial = e.touch.initialTouch;
          var target = e.touch.currentTarget;
          //console.table([{ initial: initial, target: target }]);
          // if we are tapping outside the archive area, cancel the action
          if (initial === target) 
          {
            // get the closest item and slide it back in
            var item = e.sender.element.siblings();
            item.css({ left: 0 });
            kendo.fx(item).slideIn("left").duration(500).play();
          }
          // else we are archiving so remove it
          else {
            e.sender.element.closest("li").addClass("collapsed");
          }
        }
    };

    app.toDataURL = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
        callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
    }

    app.getDataUri = function (url, callback) {

        var image = new Image();
        //image.crossOrigin = 'use-credentials';
        //image.crossOrigin = "Anonymous";
        image.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

            canvas.getContext('2d').drawImage(this, 0, 0);

            // Get raw image data
            //callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

            // ... or get as Data URI
            callback(canvas.toDataURL('image/png'));
        };
        image.crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'
        image.src = url;
    }
    
    app.writeUserData = function (userId, name, email, imageUrl) {
        firebase.database().ref('users/' + userId).set({
            username: name,
            email: email,
            age: 18,
            city: 'Barcelona',
            resume : {wins : "0", played : "0", position : "0" },
            profile_picture : imageUrl == null ? app.constants.defaultPicture : imageUrl
        });
        /*firebase.database().ref('users/' + userId).ref().set(
            { company : {name : "Telerik"}, message: "Hello World" },
            function(msg) {console.log('Message written, error: ' + msg)}
        );*/
        console.log(userId, name, email, imageUrl);
    };

    app.writeUserData2 = function (userId, profile) {
        console.log(userId);
        firebase.database().ref('users/' + userId).update({
            username: profile.DisplayName,
            age: profile.Age,
            profile_picture : profile.PictureUrl == null ? app.constants.defaultPicture : profile.PictureUrl,
            //profile_picture: 'http://vignette.wikia.nocookie.net/es.starwars/images/d/d6/Yoda_SWSB.png',
            city: 'Barcelona'
        });
    };
    
    app.fetchUser = function (userId) {
        return firebase.database().ref('users/' + userId)
        .once('value')
        .then(function(snap) {
            return snap.val();
        })
    }
    
    if (app.isCordova) {
        document.addEventListener('deviceready', function() {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            var element = document.getElementById('appDrawer');
            if (typeof(element) != 'undefined' && element !== null) {
                if (window.navigator.msPointerEnabled) {
                    $('#navigation-container').on('MSPointerDown', 'a', function() {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function() {
                        app.keepActiveState($(this));
                    });
                }
            }

            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    app.drawerModel = kendo.observable({
        logout: function () {
            firebase.auth().signOut().then(function() {
                // Sign-out successful.
                    localStorage.clear();
                    console.log("logout OK");
            }).catch(function(error) {
                // An error happened.
                app.notify.error(error);
            });
        },
        goToProfile: function () {
            app.navigation.navigateProfile();
        },
        showFeedback: function () {
            if (app.utils.isInSimulator() || !window.feedback) {
                return app.notify.info('The feedback feature is not available in simulator or browser environment. ' +
                    'Try deploying to device or emulator.');
            }

            window.feedback.showFeedback();
        }
    });

    window.app = app;
}());


/// start app modules
(function localization(app) {
    var localization = app.localization = kendo.observable({
            cultures: app.localization.cultures,
            defaultCulture: app.localization.defaultCulture,
            currentCulture: '',
            strings: {},
            viewsNames: [],
            registerView: function(viewName) {
                app[viewName].set('strings', getStrings() || {});

                this.viewsNames.push(viewName);
            }
        }),
        i, culture, cultures = localization.cultures,
        getStrings = function() {
            var code = localization.get('currentCulture'),
                strings = localization.get('strings')[code];

            return strings;
        },
        updateStrings = function() {
            var i, viewName, viewsNames,
                strings = getStrings();

            if (strings) {
                viewsNames = localization.get('viewsNames');

                for (i = 0; i < viewsNames.length; i++) {
                    viewName = viewsNames[i];

                    app[viewName].set('strings', strings);
                }

                //app.navigation.viewModel.set('strings', strings);
                app.drawerModel.set('strings', strings);
                app.profileView.profileViewModel.set('strings', strings);
            }
        },
        loadCulture = function(code) {
            $.getJSON('cultures/' + code + '/app.json',
                function onLoadCultureStrings(data) {
                    localization.strings.set(code, data);
                });
        };

    localization.bind('change', function onLanguageChange(e) {
        console.log(e.field);
        if (e.field === 'currentCulture') {
            var code = e.sender.get('currentCulture');

            updateStrings();
        } else if (e.field.indexOf('strings') === 0) {
            updateStrings();
        } else if (e.field === 'cultures' && e.action === 'add') {
            loadCulture(e.items[0].code);
        }
    });

    for (i = 0; i < cultures.length; i++) {
        loadCulture(cultures[i].code);
    }

    //localization.set('currentCulture', localization.defaultCulture);
})(window.app);
/// end app modules