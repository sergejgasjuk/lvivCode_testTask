var $ = require('jquery');

let imageUpload = $("#userImage");
let imgUploadLabel = $(imageUpload).siblings("label");
let imgUploadSubmit = $(imageUpload).siblings("input[name='submit']");

// file upload onchange handler
$(imageUpload).on("change", function(e){
  let value;
  let file = e.target.files[0];
  let mimeType = /image.*/;

  if (!file.type.match(mimeType)) {
    alert("Please choose image.");
    return;
  }

  if ($(this).val()) {
    value = $(this).val();

    $(imgUploadLabel).html($(imgUploadLabel).text() + "<span>" + ` "${value}"` + "</span>");
    $(imgUploadSubmit).removeClass("hidden");
  }
});

// file upload onsubmit handler
$("#uploadForm").on("submit", function(e) {
  e.preventDefault();

  let formData = new FormData();
  let file = $(imageUpload)[0].files[0];
  formData.append('userImage', file);

  if (!file) { return; }

  $.ajax({
    url: $(this).attr("action"),
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    error(err) {
      alert(err);
    },
    success(data) {
      let item = `
                  <a class="photo-item" href="#" data-name="${data.name}">
                    <img src="photos/${data.name}" alt="${data.name}"/>
                  </a>
                  `;
      $(".photo-list").append(item);
      $(imgUploadLabel).text("Upload Image");
      $(imgUploadSubmit).addClass("hidden");
      if ($(".photo-list").find(".title-secondary").length) {
        $(".photo-list").find(".title-secondary").remove();
      }

      clearImgUploadForm();
    }
  });

  return false;
});

// comment form submit handler
$("body").on("submit", "#commentForm", function(e) {
  e.preventDefault();

  let commentAmount = $(this).siblings(".comments-amount").find("span");
  let comment = $(this).find("[name='comment']").val();
  let photo = $(this).find("[name='photo']").val();
  let self = this;

  if (comment.length < 1) {
    alert('Field can\'t be empty');
    return;
  }

  $.ajax({
    context: this,
    url: $(this).attr("action"),
    type: $(this).attr("method"),
    data: {comment, photo},
    error(err) {
      alert(err);
    },
    success(data) {
      $(commentAmount).text(+$(commentAmount).text() + 1);
      $(this).find("[name='comment']").val('');
      $(this).hide().siblings(".success").fadeIn(200);
    }
  });

  return false;
});

// show comment form
$("body").on("click", "#showCommentForm", function(e) {
  e.preventDefault();
  $(this).parent().hide().siblings("#commentForm").fadeIn(200);
});

// view comments list
$("body").on("click", ".view-comments", function(e) {
  e.preventDefault();

  if ($(this).siblings(".comments-list-box").length) {
    $(this).siblings(".comments-list-box").show();
    $(this).siblings(".hide-comments").show();
    $(this).hide();
    return false;
  }

  $.ajax({
    context: this,
    method: 'POST',
    data: {
      photo: $(this).attr("data-photo")
    },
    url: "/commentsList",
    error(err) {
      alert(err);
    },
    success(data) {
      $(this).parents(".comments-section").append(data);
      $(this).siblings(".hide-comments").show();
      $(this).hide();
    }
  });
});

// hide comments list
$("body").on("click", ".hide-comments", function(e) {
  e.preventDefault();

  if ($(this).siblings(".comments-list-box").length) {
    $(this).siblings(".comments-list-box").hide();
    $(this).siblings(".view-comments").show();
    $(this).hide();
  }
});

// image modal open
$("body").on("click", ".photo-item", function(e){
  e.preventDefault();

  $.ajax({
    method: 'POST',
    data: {
      name: $(this).attr("data-name")
    },
    url: "/imgModal",
    error(err) {
      alert(err.message);
    },
    success(data) {
      $("body").append(data);
      if ($(imageUpload).length) {
        $("#imgModal").show();
      }
    }
  });
});

// image modal close
$("body").on("click", "#imgModal .modal-dialog, #imgModal .modal-close", function(){
  if ($("body").find("#imgModal").length) {
    $("#imgModal").remove();
  }
}).on("click", "#imgModal .modal-body", function(e) {
  e.stopPropagation();
});

function clearImgUploadForm() {
  if ($(imageUpload).length) {
    $(imageUpload).closest('form').get(0).reset();
  }
}
