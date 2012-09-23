// Create an empty global object where we can store settings for connecting to Delicious
		    var delicious = {};

		    // When users click on a link, open it in a new window
		    $('a').live('click', function() {
		       // window.open($(this).attr('href'));
	            $('iframe').prop("src", $(this).attr('href'));
                $('iframe').prop("title", $(this).text());
                console.log($('iframe').prop("title", $(this).text()));
                return false;
		    });

            $(document).ready(function() {

                $('#out').hide();

                // Load bookmarks for the specified user when the #load-bookmarks form is submitted
                $('#load-bookmark').submit(function() {

                    //console.log("i'm in load-bookmark submit call");

                    var username = $('#username').val();
                    // This cross-domain request requires that you use '?callback=?' because it is done using JSONP

                    $.getJSON('http://feeds.delicious.com/v2/json/' + username + '?callback=?',
                     function(json){

                        $(json).each(function(index) {
                            // this.u // url
                            // this.d // description
                            // this.n // extended notes
                            // this.t // array of tags
                            //console.log(this.d);
                            //console.log(this.n);

                            //Ashley: Code to retrieve the User's Saved Trails
                            $('<li></li>').html('<a href="' + this.u + '">' + this.d + '</a>')
                                .data('extended', this.n)
                                .data('tags', this.t)
                                //ash
                                //.data('user_name', user_name)
                                //
                                .appendTo('#bookmarks ul');
                            
                            var trail_name = this.t[0].split(":");
                            var step_name = this.t[1];

                            $('<li></li>').html(trail_name[1] + "-" + step_name)
                                          .appendTo('#trail-list');

                        });
                        $('#bookmarks li').draggable({revert: true});
                        //Ashley: Code to move links back to Bokmarks List
                        $('#bookmarks').droppable({
                        accept: 'li',
                        drop: function(event, ui){

                        $(ui.draggable.css({top: '0px', left: '0px'}).appendTo('#bookmarks ul'));
                        }
                        });
                    });

                    return false;

                });

                // Use jQuery UI to make the #new-trail div droppable
				$('#new-trail').droppable({
					accept: 'li',
					drop: function(event, ui) {
					    // Don't confuse ul, the <ul> unordered-list with ui, the user interface element
                        //Ashley: Modified Code to move links back to Bokmarks List
					$(ui.draggable).css({top: '0px', left: '0px'}).appendTo('#new-trail ul');
					}
				});



                $('#save-trails').submit(function() {
                	// Let's ask the user for a name for the trail
                	// We are storing the name that the user enters as the text of the
                	// h2 in the #new-trail div
                	// The || syntax here lets us specify a default value
                    $('#new-trail h2').text(prompt('Enter a name for your trail:') || 'My New Trail');

                    // Store the username and password to send with each request
                    // This isn't the best security practice, but we do it here
                    // in the interest of brevity
                    
                    delicious.stepNum = 0;

                    saveTrail();
                    return false;
            	});


                $('#sign-in').submit(function(){
                    delicious.username = $('#save-username').val();
                    delicious.password = $('#save-password').val();

                    //console.log(delicious.username);
                    //console.log(delicious.password);

                    $('#in').hide('fast');
                    $('#user').append(delicious.username);
                    $('#out').show('fast');
                 ;
                    return false;

                });

                $('#log-out').click(function(){
                    //console.log("i'm in log out button click");
                    $('#save-username').val(null);
                    $('#save-password').val(null);
                    $('#user').text('');
                    $('#in').show('fast');
                    $('#out').hide('fast');

                });



                $('#add-note').submit(function(event) {

                    event.preventDefault();

                    $('#trailnotes').data('extended',$('#trailnotes').val());
                    delicious.username = $('#save-username').val();
                    delicious.password = $('#save-password').val();

                    console.log("trying to create note");
                    console.log(delicious.username);
                    console.log(delicious.password);

                    //$.delay(1000);
                    postNote();
                    return false;
                });



                // Allow the user to rearrange the list of bookmarks in the new trail
				$('#new-trail ul').sortable();
            
            /*
             $('#transfer').click(function(){
                $('#bookmarks').hide('slow');
                $('#new-trail').hide('slow');
                console.log("I'm hiding!?");

             });
            */


            });

            function postNote () {
                // Assemble the data to send to Delicious
                var postData = {

                    url: $('iframe').prop("src"),
                    description: $('iframe').prop("title"),
                    extended: $('#trail_notes').val(),
                    tags: '',//(bookmark.data('tags') == "" ? "" : bookmark.data('tags').join(',') + ',') + newTrailName + ',' + 'step:' + delicious.stepNum,
                    method: 'posts/add',
                    username: delicious.username,
                    password: delicious.password
                };
                
                console.log(delicious.username);
                console.log(delicious.password);
                console.log($('iframe').prop("src"));
                console.log($('iframe').prop("title"));
                console.log($('#trail_notes').val());
                console.log(postData);
                console.log("i'm in postNote function");

                $.getJSON("http://courses.ischool.berkeley.edu/i290-iol/f12/resources/trailmaker/delicious_proxy.php?callback=?",
                postData,

                 function(rsp){

                    console.log("i'm checking some stuff");

                    if (rsp.result_code === "access denied") {
                        alert('The provided Delicious username and password are incorrect.');
                    } else if (rsp.result_code === "something went wrong") {
                        alert('There was an unspecified error communicating with Delicious.');
                    } else if (rsp.result_code === "done") {
                        // Bookmark was saved properly
                      
                            alert ("Your trail has been saved!");


                        }

                    console.log("almost done");
                    
                });

            }


            function saveTrail () {
                // We need to keep track of which bookmark number we are saving, so we
                // can use the `step:2` syntax that we have established
                // When the user submitted the form we started with stepNum = 0,
                // so we can increment it each time we call saveTrail
                delicious.stepNum++;

                // Change spaces in the trail name to underscores to follow our trail syntax
                // By default, the .replace() method doesn't replace ALL the occurrances
            	// of a string, so we are using the global flag in our regular expression
            	// to replace everything. The global flag is set with the "g" after
            	// the regular expression (/ /g)
                var newTrailName = 'trail:' + $('#new-trail h2').text().toLowerCase().replace(/ /g, '_');

                // Get the first bookmark to save, which is the first element of the #new-trail list
                var bookmark = $('#new-trail li:first');

                // Assemble the data to send to Delicious
                var postData = {
                    url: bookmark.find('a').attr('href'),
                    description: bookmark.find('a').text(),
                    extended: bookmark.data('extended'),
                    //if(bookmark.data('user_name') === delicious.username){
                    //tags: (bookmark.data('tags') == "" ? "" : bookmark.data('tags').join(',') + ',') + newTrailName + ',' + 'step:' + delicious.stepNum,
                    //tags: bookmark.data('tags').join(',') + ',' + newTrailName + ',' + 'step:' + delicious.stepNum,
                    //else{
					tags: newTrailName + ',' + 'step:' + delicious.stepNum,
                    //}
                    method: 'posts/add',
                    username: delicious.username,
                    password: delicious.password
                };

                   /* function savedtrail(trail){
                    //Ashley: Adding trails to the Saved Trails form   
                    alert(trail);
                    $('<li></li>').html('<button id="trail-button' + count +'">' + trail + '</button>')
                    //.data('extended', this.n)
                    //.data('tags', this.t)
                    .appendTo('#your-saved-trails ul');
					};
                    */

                // Send the data to Delicious through a proxy and handle the response
                // Use $.post if the script is located on the same server
                // Otherwise, use $.get to avoid cross-domain problems
                // $.post('delicious_proxy.php',
                $.getJSON("http://courses.ischool.berkeley.edu/i290-iol/f12/resources/trailmaker/delicious_proxy.php?callback=?",
                postData,
                 function(rsp){
                    if (rsp.result_code === "access denied") {
                        alert('The provided Delicious username and password are incorrect.');
                    } else if (rsp.result_code === "something went wrong") {
                        alert('There was an unspecified error communicating with Delicious.');
                    } else if (rsp.result_code === "done") {
                        // Bookmark was saved properly
                        $('#new-trail li:first').remove(); // Remove the line for the bookmark we just saved
                        if ($('#new-trail li').length > 0) {
                            // Save the next bookmark in the trail in 1000ms (1 second)
                            // We have to wait this period of time to comply with the
                            // terms of the Delicious API. If we don't we may have access denied.
                            setTimeout(saveTrail, 1000);
                        } else {
                            // We're done saving the trail
                            window.delicious_password = null;
                            alert ("Your trail has been saved!");
                        }
                    }
                });
            }

