$( document ).ready(function() {
  $(".addUser").click(function(){
    $(".collapse").show();
    $(".addUser").hide();
    $("#submit-login").text("Create Account");
    $("#main-form").attr("action","/addUser");
  });

});
