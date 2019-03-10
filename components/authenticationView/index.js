'use strict';

(function () {
    /**
    * @return {!Object} The FirebaseUI config.
    */
   function getUiConfig() {
     return {
       'callbacks': {
         // Called when the user has been successfully signed in.
         'signInSuccess': function(user, credential, redirectUrl) {
           handleSignedInUser(user);
           // Do not redirect.
           return false;
         }
       },
       // Opens IDP Providers sign-in flow in a popup.
       'signInFlow': 'popup',
       'signInOptions': [
           // The Provider you need for your app. We need the Phone Auth
           //firebase.auth.GoogleAuthProvider.PROVIDER_ID,
           firebase.auth.FacebookAuthProvider.PROVIDER_ID,
           //firebase.auth.TwitterAuthProvider.PROVIDER_ID,
           //firebase.auth.GithubAuthProvider.PROVIDER_ID,
           firebase.auth.EmailAuthProvider.PROVIDER_ID,
           {
             provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
             recaptchaParameters: {
               //size: getRecaptchaMode()
               type: 'image',
               size: 'invisible',
               badge: 'bottomleft'
             }
         }
       ],
       // Terms of service url.
       'tosUrl': 'https://www.google.com'
     };
   }
   /**
    * Displays the UI for a signed in user.
    * @param {!firebase.User} user
    */
   var handleSignedInUser = function(user) {
     /*document.getElementById('user-signed-in').style.display = 'block';
     document.getElementById('user-signed-out').style.display = 'none';
     document.getElementById('name').textContent = user.displayName;
     document.getElementById('email').textContent = user.email;
     document.getElementById('phone').textContent = user.phoneNumber;
     if (user.photoURL){
       document.getElementById('photo').src = user.photoURL;
       document.getElementById('photo').style.display = 'block';
     } else {
       document.getElementById('photo').style.display = 'none';
     }*/
     
        console.log("update displayname");
        console.log(user);
        app.writeUserData(user.uid, user.displayName, user.email, user.photoURL);
        app.mobileApp.navigate('components/profileView/view.html');
   };
   
    var view = app.authenticationView = kendo.observable({
        onShow: function () {
            mode = app.constants.authenticationModeSignin; //reset the view mode
            init();
        },
        afterShow: function () {
            
            var ui = new firebaseui.auth.AuthUI(firebase.auth());
            //provider.users.currentUser().then(successHandler, init)
            ui.start('#firebaseui-container', getUiConfig());
        }
    });

    var provider = app.data.defaultProvider;
    var mode = app.constants.authenticationModeSignin;
    var registerRedirect = 'activitiesView';
    var signinRedirect = 'activitiesView';

    function init(error) {
        app.utils.loading(false);
        if (error) {
            app.notify.error(error);
            return false;
        }

        var activeView = mode === app.constants.authenticationModeSignin ? '.signin-view' : '.signup-view';
        
            $(activeView).show().siblings().hide();
    }

    function successHandler(data) {
        var redirect = mode === app.constants.authenticationModeSignin ? signinRedirect : registerRedirect;

        if (data && data.result) {
            app.data.defaultProvider.users.currentUser()
                .then(function (res) {
                    app.user = res.result;
                    //app.mobileApp.navigate('components/' + redirect + '/view.html');
                     //app.navigation.navigateMap();

                    app.drawerModel.set("isAnomymous", false);
                    app.utils.loading(false);
                });
        } else {
            init();
        }
    }

    var vm = kendo.observable({
        user: {
            displayName: '',
            username: '',
            password: '',
            email: ''
        },
        loginValidator: null,
        registerValidator: null,
        signin: function (email, password) {
            var model = vm.user;
            if (typeof email !== 'string') {
                email = model.username;
            }

            if (typeof password !== 'string') {
                password = model.password;
            }

            this.loginValidator = app.validate.getValidator('#login-form');
            if (!this.loginValidator.validate()) {
                return;
            }

            app.utils.loading(true);
            firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
                // Sign-in successful.
                vm.set('user.email', '');
                vm.set('user.password', '');
                //alert(email);
                //successHandler(data);
                //app.writeUserData(app.user.uid, app.user.displayName, app.user.email, app.user.photoURL);
                app.mobileApp.navigate('components/profileView/view.html');
                app.utils.loading(false);                    
              }).catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // ...
                if (errorCode === 'auth/wrong-password') {
                    alert('Wrong password.');
                } else {
                    alert(errorMessage);
                }
                init(error);
            });
        }
    });

    view.set('authenticationViewModel', vm);
}());
