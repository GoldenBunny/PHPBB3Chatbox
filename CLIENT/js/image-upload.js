function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.

  for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();
      // closure to capture file info
      reader.onload = (function(file, index) {
          return function(e) {

              if (file.type.match('image.*')) {
                document.getElementById("inputdefault").disabled = true;
                document.getElementById("inputdefault").style.backgroundImage="url('gears.svg')";

                var dataUri = e.target.result;
                var base64 = dataUri.substr(dataUri.indexOf(',') + 1);
                uploadImage(base64);
              }
          };
      })(f, i);
      // read file as data URI
      reader.readAsDataURL(f);
    }
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
}

// Setup the dnd listeners.
var dropZone = document.getElementsByClassName('container-fluid')[0];
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);


function uploadImage(base64)
{
$.ajax({
    url: 'https://api.imgur.com/3/image',
    headers: {
        'Authorization': 'Client-ID 7716c792d053393'
    },
    type: 'POST',
    data: {
        'image': base64
    },
    success: function(res,status,jqXHR) {
      console.log(res.data.link);
      document.getElementById("inputdefault").disabled = false;
      document.getElementById("inputdefault").style.backgroundImage="";
      document.getElementById("inputdefault").value = "[img]"+res.data.link+"[/img]";
      $("#inputdefault").trigger("submit");
    },
    error: function(jqXHR,status,err) {
      console.log(status);
      console.log(err);
      document.getElementById("inputdefault").disabled = false;
      document.getElementById("inputdefault").style.backgroundImage="";
      document.getElementById("inputdefault").value = "Falha no Envio";
    }

});

}
