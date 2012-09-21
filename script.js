// Create an empty global object where we can store settings for connecting to Delicious
		    var delicious = {};

		    // When users click on a link, open it in a new window
		    $('a').live('click', function() {
		       // window.open($(this).attr('href'));
	            $('iframe').prop("src", $(this).attr('href'));
                return false;
		    });

            $(document).ready(function() {

                // Load bookmarks for the specified user when the #load-bookmarks form is submitted
                $('#load-bookmarks').submit(function() {
                    var username = $('#username').val();
                    // This cross-domain request requires that you use '?callback=?' because it is done using JSONP
                    $.getJSON('http://feeds.delicious.com/v2/json/' + username + '?callback=?',
                     function(json){
                        $(json).each(function(index) {
                            // this.u // url
                            // this.d // description
                            // this.n // extended notes
                            // this.t // array of tags
                            // this.dt //Date 
                            console.log(this.d);
                            console.log(this.n);
                            console.log(this.t);
                            //console.log(this.a);
                            //ash
                            //var date = this.dt.split("T");
                            //var created_date = date[0];
                            //console.log(this.a);
                            //
                            $('<li></li>').html('<a href="' + this.u + '">' + this.d + '</a>')
								.data('extended', this.n)
								.data('tags', this.t)
                                //ash
                                //.data('user_name', user_name)
                                //
								.appendTo('#bookmarks ul');
                        });
						$('#bookmarks li').draggable({revert: true});
						//Code to move links back to Bokmarks List
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
					$(ui.draggable).css({top: '0px', left: '0px'}).appendTo('#new-trail ul');
					}
				});

                $('#save-trail').submit(function() {
                	// Let's ask the user for a name for the trail
                	// We are storing the name that the user enters as the text of the
                	// h2 in the #new-trail div
                	// The || syntax here lets us specify a default value
                    $('#new-trail h2').text(prompt('Enter a name for your trail:') || 'My New Trail');

                    // Store the username and password to send with each request
                    // This isn't the best security practice, but we do it here
                    // in the interest of brevity
                    delicious.username = $('#save-username').val();
                    delicious.password = $('#save-password').val();
                    delicious.stepNum = 0;

                    saveTrail();
                    return false;
            	});

                // Allow the user to rearrange the list of bookmarks in the new trail
				$('#new-trail ul').sortable();
            });

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
					tags: 'Name:' + delicious.username + ',' + newTrailName + ',' + 'step:' + delicious.stepNum,
                    //}
                    method: 'posts/add',
                    username: delicious.username,
                    password: delicious.password
                };

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

