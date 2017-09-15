function add_user(username) {

  var user_column = document.getElementById("user-column");
  var rendered = parseTemplate("user-list-child",{_avatar: "https://tgmbrasil.com.br/download/file.php?avatar=1074_1473025794.gif",_user: String(username)});
  $(rendered).appendTo($(user_column));

}
function remove_user(username) {
    var els = document.getElementById("user-column").getElementsByClassName("user-list-child");
    for(var i = 0; i < els.length; i++) {
        if(els[i].getElementsByClassName("user-list-name")[0].innerHTML == username) {
            document.getElementById("user-column").removeChild(els[i]);
            break;
        }
    }
}
function user_exists(username) {
    var els = document.getElementById("user-column").getElementsByClassName("user-list-child");
    for(var i = 0; i < els.length; i++) {
      if(els[i].getElementsByClassName("user-list-name")[0].innerHTML == username) {
            return true;
        }
    }
    return false;
}
