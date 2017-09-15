function insertMessage(text,user,date,msgid,avatar){

var message_array = document.getElementById("message-collection").getElementsByTagName("li");
var last_message = message_array[message_array.length-1];


    if (last_message != null)
    {
    var last_message_username = last_message.getElementsByClassName("message-name")[0].innerHTML;
    }
    
    if (last_message != null && last_message_username == user) {

        var message_content = last_message.getElementsByClassName("message-content")[0];
        var rendered = parseTemplate("message-line",{_text: parseBBCode(text),_msgid: String(msgid)});
        $(rendered).appendTo($(message_content));

        var msg_array = message_content.getElementsByClassName("message-line");
        msg_array[msg_array.length-1].innerHTML = parseBBCode(text);
    }
    else
    {
        var rendered = parseTemplate("message",{_user:user,_avatar:avatar,_text: parseBBCode(text),_msgid: String(msgid),_date: date});
        var msg_col = document.getElementById("message-collection");
        $(rendered).appendTo($(msg_col));

        var message_array = document.getElementById("message-collection").getElementsByTagName("li");
        var last_message = message_array[message_array.length-1];

        var msg_array = last_message.getElementsByClassName("message-content")[0].getElementsByClassName("message-line");

        msg_array[msg_array.length-1].innerHTML = parseBBCode(text);
    }



}

function parseTemplate(template,json)
{
  var templateHTML = null;
  var templates = document.getElementsByTagName("template");

  for(i=0;i<templates.length;i++)
  {
    if (templates[i].getAttribute("name") == String(template))
    {
      templateHTML = templates[i].innerHTML;
      break;
    }
  }

  if (templateHTML != null)
  {

    return Mustache.render(templateHTML, json);

  }
  else
  {
    return -1;
  }

}

/*
function insertMessage(text, user, date, msgid) {
    var msg_array = document.getElementsByClassName("message-column")[0].getElementsByClassName("message");
    var last_message = msg_array[msg_array.length-1];
    if (last_message != null) {
        var last_message_username = document.getElementsByClassName("message-column")[0].lastElementChild.getElementsByClassName("message-username")[0].innerHTML;
        var last_message_content = document.getElementsByClassName("message-column")[0].lastElementChild.getElementsByClassName("message-content")[0];
    }
    var message_column = document.getElementsByClassName("message-column")[0];

    if (last_message != null && last_message_username == user) {
        last_message_content.innerHTML += "<br><span>" + parseBBCode(text) + "</span>";
    } else {
        //Cria o message;
        var message = document.createElement("DIV");
        message.setAttribute("class", "message");

        var line_div = document.createElement("DIV");
        line_div.setAttribute("class", "line-separator");

        message.appendChild(line_div);

        if (last_message != null) {

            var row_div = document.createElement("DIV");
            row_div.setAttribute("class", "row");
            row_div.style = "margin-left:0;margin-right:0";

            last_message.appendChild(row_div);
        }
        var col_message_main_div = document.createElement("DIV");
        col_message_main_div.style = "height:100%";
        col_message_main_div.setAttribute("class", "col-xs-10 remove-paddings");

        var message_header_div = document.createElement("DIV");
        message_header_div.setAttribute("class", "message-header");
        var message_time_span = document.createElement("SPAN");
        message_time_span.setAttribute("class", "message-time");
        message_time_span.innerHTML = date;

        message_header_div.appendChild(message_time_span);

        var message_username_span = document.createElement("SPAN");
        message_username_span.setAttribute("class", "message-username");
        message_username_span.innerHTML = user;

        message_header_div.appendChild(message_username_span);

        col_message_main_div.appendChild(message_header_div);

        var message_content_div = document.createElement("DIV");
        message_content_div.setAttribute("class", "message-content");

        var span_val = document.createElement('span');
        span_val.innerHTML = parseBBCode(text);

        //message_content_div.innerHTML = parseBBCode(text);

        message_content_div.appendChild(span_val);

        col_message_main_div.appendChild(message_content_div);

        message.appendChild(col_message_main_div);

        var other_content_div = document.createElement("DIV");
        other_content_div.setAttribute("class", "col-xs-2 remove-paddings");
        other_content_div.style = "height:100%";

        var message_avatar_div = document.createElement("DIV");
        message_avatar_div.setAttribute("class", "message-avatar");

        var hex_div = document.createElement("DIV");
        hex_div.setAttribute("class", "hexagon");

        if (user != "LadyAnna") {
            $(hex_div).css("background-image", "url(https://tgmbrasil.com.br/download/file.php?avatar=51_1466149014.jpg)");
        } else {
            $(message).css("background-color", "#E84A5F");
            $(hex_div).css("background-image", "url(http://i946.photobucket.com/albums/ad306/manga_series_addict/Miku%20Hatsune%20Vocaloid/hastunemikuchibi.jpg)");
        }

        var hex_top_div = document.createElement("DIV");
        hex_top_div.setAttribute("class", "hexTop");

        hex_div.appendChild(hex_top_div);

        var hex_bottom_div = document.createElement("DIV");
        hex_bottom_div.setAttribute("class", "hexBottom");

        hex_div.appendChild(hex_bottom_div);

        message_avatar_div.appendChild(hex_div);

        var options_div = document.createElement("DIV");
        options_div.setAttribute("class", "message-options");

        message_avatar_div.appendChild(options_div);

        other_content_div.appendChild(message_avatar_div);

        message.appendChild(other_content_div);

        message_column.appendChild(message);

        message.setAttribute("id", msgid);
        // $(span_val).balloon({
        //     html: true,
        //     contents: '<a href="#">Any HTML!</a><br>' + '<input type="text" size="40">'
        // });
    }
}


function deleteMessage(message) {
    var w = message.offsetWidth;
    var h = message.offsetHeight;

    message.style.transform = "translateX(" + w + "px)";
    message.style.WebkitTransform = "translateX(" + w + "px)";
    message.style.msTransform = "translateX(" + w + "px)";
    message.style.opacity = 0;


    setTimeout(function () {
        message.parentNode.removeChild(message);
    }, 1000);

    setTimeout(function () {
        var message_array = document.getElementsByClassName("message");
        var message_number = 0;

        for (i = 0; i < message_array.length; i++) {
            if (message_array[i] == message) {
                message_number = i;
                break;
            }
        }

        for (i = message_array - 1; i > 0; i--) {
            message_array[i].style.transform = "translateY(" + h + "px)";
            message_array[i].style.WebkitTransform = "translateY(" + h + "px)";
            message_array[i].style.msTransform = "translateY(" + h + "px)";
        }

    }, 1200);

}

*/
function parseBBCode(text) {

    txt = String(parseEmoticon(text));

    var result = XBBCODE.process({
        text: txt,
        removeMisalignedTags: false,
        addInLineBreaks: false
    });

    return result.html;

}

function parseEmoticon(text) {
    return text;
}
