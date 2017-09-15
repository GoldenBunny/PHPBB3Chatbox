//var socket = io.connect("191.6.198.85:21094");
var socket = io('127.0.0.1:21094');
//document.getElementsByClassName("userView-name")[0].innerHTML=String(nick);

var CHAT_MSG_LIMIT = 50;

function check_command(str, command) {
    if (str.substr(0, command.length) == command) {
        return true;
    } else {
        return false;
    }
}

var get_archive = false;

$('#formdefault').submit(function () {
    var messageText = $("#inputdefault").val();
    if (messageText.substr(0, 1) == '/') {
        var arguments = messageText.split(' ');
        arguments.splice(0, 1);
        if (check_command(messageText, '/ban')) {
            if (arguments[0] != '') {
                var send_data = {
                    user_target: arguments[0]
                }
                socket.emit('ban', send_data);
            }
        } else if (check_command(messageText, '/unban')) {
            if(arguments[0] != '') {
                var send_data = {
                    user_target: arguments[0]
                }
                socket.emit('unban', send_data);
            }
        } else if (check_command(messageText, '/add-emoticon')) {
            if (arguments[0] != '' && arguments[1] != '' && arguments[2] != '') {
                var send_data = {
                    name: arguments[0],
                    url: arguments[1],
                    category: arguments[2],
                }
                socket.emit('create_emoticon', send_data);
                console.log('em_sending');
            }
        } else if (check_command(messageText, '/remove-emoticon')) {
            if (arguments[0] != "" && arguments[1] != "") {
                var send_data = {
                    name: arguments[0],
                    category: arguments[1],
                };
                socket.emit('delete_emoticon', send_data);
            }
        } else if (check_command(messageText, '/kick')) {
            if (arguments[0] != "") {
                var send_data = {
                    user_target: arguments[0]
                };
                console.log(arguments[0]);
                socket.emit("kick_user", send_data);
            }
        }
    } else {
        var send_data = {
            message_text: messageText,
        };
        socket.emit('post_message', send_data);
    }
    $('#inputdefault').val('');
    return false;
});

function message_list_scroll_down() {
    document.getElementById('message_list_column').scrollTop = 9999999;
}
socket.on('post_message', function (recdata) {
    if (document.getElementById("message-collection").childNodes.length > CHAT_MSG_LIMIT) {
        document.getElementById("message-collection").removeChild(document.getElementById("message-collection").childNodes[0]);
    }
    insertMessage(recdata.message_text, recdata.username, recdata.time, recdata.message_id, recdata.avatar);
    message_list_scroll_down();
});

function apply_limit_for_messages(limit) {
    var sz = document.getElementById('message-collection').childNodes.length - limit;
    for (var i = 0; i < sz; i++) {
        document.getElementById('message-collection').removeChild(document.getElementById('message-collection').childNodes[i]);
    }
}
socket.on('get_messages', function (recdata) {
    $("#message-collection").empty();
    for (var i = 0; i < recdata.messages.length; i++) {
        insertMessage(recdata.messages[i].message, recdata.messages[i].username, recdata.messages[i].date, recdata.messages[i].id);
    }
    apply_limit_for_messages(CHAT_MSG_LIMIT);
    message_list_scroll_down();
});
socket.on('get_emoticons', function (recdata) {
    for (var i = 0; i < recdata.emoticons.length; i++) {
        addEmoticon(recdata.emoticons[i].url, ':' + recdata.emoticons[i].name + ':', recdata.emoticons[i].category);
    }
});
socket.on('create_emoticon', function (recdata) {
    addEmoticon(recdata.url, ':' + recdata.name + ':', recdata.category);
});
socket.on('user_connect', function (recdata) {
    if (!user_exists(recdata.username)) {
        add_user(recdata.username, "");
    }
    console.log('user connect: ', recdata.username);
});
socket.on('get_users', function (recdata) {
    if (!user_exists(recdata.username)) {
        add_user(recdata.username, "");
    }
    console.log('user connect: ', recdata.username);
});
socket.on('user_disconnect', function (recdata) {
    if (user_exists(recdata.username)) {
        console.log("user exists");
        remove_user(recdata.username);
    }
    console.log('user_disconnect: ', recdata.username);
});
socket.on('PANIC', function (recdata) {
    insertMessage(recdata.message_text, 'LadyAnna', '', -1);
    console.log('FALHA FATAL!');
});
socket.on('disconnect', function (recdata) {
    alert('desconectado do servidor.');
});
socket.on('kick', function (recdata) {
    if (user_exists(recdata.username)) {
        insertMessage(recdata.username + ' foi desconectado do servidor.', '', '', -1);
        remove_user(recdata.username);
    }
});
socket.on('get_archive', function (recdata) {
    $("#message-collection").empty();
    for (var i = 0; i < recdata.messages.length; i++) {
        insertMessage(recdata.messages[i].message, recdata.messages[i].username, recdata.messages[i].date, recdata.messages[i].id);
    }
});
$("#get_archive_button").click(function () {
    if (!get_archive) {
        socket.emit('get_archive');
        get_archive = true;
    } else {
        socket.emit('get_messages');
        get_archive = false;
    }
    console.log("clicked");
});
