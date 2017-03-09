// url_str = "/";

/*
 * If re-opening a session on another tab, make rest call to get current session data.
 * Load into client UI.
 * @param data: json containing client chat data.
 */
function loadChatConversation(data){
	var conversation = data.conversation;
	for(var i=0;i<conversation.length;i++){
		if(conversation[i].name != 'eliza'){
			$('#chatlist').append('<li class="human_bubble text-center">'+ conversation[i].text +'</li><br>');
		}else{
			$('#chatlist').append('<li class="eliza_bubble text-center">'+ conversation[i].text +'</li><br>');
		}
	}
	$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
}

/*
 * Used by the server-injected javascript call.
 * Invoked when opening another tab, in the same client session.
 * @param indexUrl = server tells client to call where the server host is.
 * @param conversationId = server tells client to call rest endpoint with the conversation Object ID.
 */
function clientScriptRetrieveChat(indexUrl,conversationId){
  $(document).ready(function(){
    $.ajax({
      type: 'post',
      url: indexUrl + '/getconv',
      data: {'id': conversationId},
      timeout: 2000
    }).done(function(response){
			console.log(JSON.stringify(response));
			loadChatConversation(response);
    });
  });
}

/*
 * Process a response from eliza server. Appends to UI, depending on whether it is human/eliza response.
 */
function eliza_response(data){
	var data = JSON.parse(data);
	console.log(data);
	if(data.eliza){
		$("#chatlist").append('<li class="eliza_bubble text-center">'+ data.eliza +'</li><br>');
	}else{
		$("#chatlist").append('<li class="eliza_bubble text-center">Error: Eliza did not send back a valid response</li><br>');
	}
	//clear the text field
    $('#humanmsg').val('');
    //scroll the chatbox to the bottom
	$('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);

}

$(document).ready(function(){
	//Assigns handlers to the chat input during eliza chat session.
  $('#human_resp').on('submit', function(e){
  	e.preventDefault();
  	var humanText = $('#humanmsg').val();
		$("#chatlist").append('<li class="human_bubble text-center">'+ humanText +'</li><br>');
    	$.ajax({
  		  type: "post",
  		  url: "/DOCTOR",
	  	  data: {'human':humanText},
	  	  timeout: 2000
	  	}).done(eliza_response);
    });

	// handler to logout client from session.
	$("#logoutButton").click(function(){
		$.ajax({
			type: "post",
			url: "/logout",
			timeout: 2000
		}).done(function(data){
			window.location.replace(data.redirect);
		});
	});

	//handler to see conversation history. 
	$("#conversationHistoryButton").click(function(){
		$("#pastConversationsList").empty();
		$.ajax({
			type: "post",
			url:"/listconv",
			timeout: 2000
		}).done(function(data){
			//parse data and show into modal.
			for(var i=0;i<data.conversations.length;i++){
				var conversation = data.conversations[i];
				$("#pastConversationsList").append('<li><span><button type="button" class="btn btn-block btn-link">ID:'+
					conversation.id + "  Date:" + conversation.start_date + '</button><span></li>');
			}

		});
	})

});
