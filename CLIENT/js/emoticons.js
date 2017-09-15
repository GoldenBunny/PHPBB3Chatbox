function addEmoticon(img,alt,category)
{
  var menu = document.getElementById("emoticon-menu");
  var cat_array = document.getElementById("emoticon-menu").getElementsByClassName("dropdown-header");

  var a_el = document.createElement("A");
  var att = document.createAttribute("href");
  att.value = "#";
  a_el.setAttributeNode(att);
  a_el.onclick = function(){document.getElementById("inputdefault").value+=alt};


  var img_el = document.createElement("IMG");
  var att = document.createAttribute("src");
  att.value = img;
  img_el.setAttributeNode(att);
  att = document.createAttribute("alt");
  att.value = alt;
  img_el.setAttributeNode(att);

  att = document.createAttribute("style");
  att.value = "padding:2px;max-width:100%;height:auto;";
  img_el.setAttributeNode(att);

  a_el.appendChild(img_el);

  for(i=0;i<cat_array.length;i++)
  {
    if (String(cat_array[i].innerHTML) == category)
    {
      menu.insertBefore(a_el,cat_array[i+1]);
      break;
    }
  }
}
function addCategory(category)
{
    var menu = document.getElementById("emoticon-menu");

    var li_el = document.createElement("LI");
    var att = document.createAttribute("class");
    att.value = "dropdown-header";
    li_el.setAttributeNode(att);
    var textnode = document.createTextNode(category);
    li_el.appendChild(textnode);

    menu.appendChild(li_el);

}
