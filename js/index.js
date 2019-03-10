/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var bootstrap = function () {
    $(function () {
        
        /*app.mobileApp = new kendo.mobile.Application(document.body, {
            skin: 'flat',
            initial: 'components/emptyView/view.html',
            init: function () {
                app.data.defaultProvider.users.currentUser()
                    .then(function (res) {
                        if (res.result) {
                            app.user = res.result;
                            //we are logged in
                            app.navigation.navigateActivities();
                        } else {
                            throw new Error('not authenticated');
                        }
                    })
                    .catch(function () {
                        //we are not logged in
                        app.navigation.navigateAuthentication();
                    });
            }
        });*/
        console.log("bootstrap");
    });
};

var app = {
    // Application Constructor
    initialize: function() {
        console.log(app.isCordova);
        /*if(app.isCordova){
            document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        }else{
            bootstrap();
        }*/
        
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

    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};
app.isCordova = !!window.cordova;

app.keepActiveState = function _keepActiveState(item) {
    var currentItem = item;
    $('#navigation-container li a.active').removeClass('active');
    currentItem.addClass('active');
};

app.initialize();