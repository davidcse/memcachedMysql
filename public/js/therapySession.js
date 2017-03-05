var url_str="davilin.cse356.compas.cs.stonybrook.edu";
var url_str = "localhost"
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
    $('#human_resp').on('submit', function(e){
    	e.preventDefault();
    	var humanText = $('#humanmsg').val()
		$("#chatlist").append('<li class="human_bubble text-center">'+ humanText +'</li><br>');
    	$.ajax({
  		  type: "post",
  		  url: "http://" + url_str + "/eliza/DOCTOR",
	  	  data: {'human':humanText},
	  	  timeout: 2000
	  	}).done(eliza_response);
    });
});
