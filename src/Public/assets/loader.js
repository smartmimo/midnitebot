$('form').on('submit', function(e) {
    e.preventDefault()

    $("button").attr("disabled", true);

    const raw = $(this).serializeArray().reduce(function(obj, item) {
        if (item.value && item.value != "") obj[item.name] = item.value;
        return obj;
    }, {})

    if (!raw.key) {
        return $(".err").html("Non autorisé.")
    }

    $.post(window.location.origin + '/hh', raw, function(res) {
            $("button").attr("disabled", false);
            window.location.href = "/"
        })
        .fail(function(e) {
            $("button").attr("disabled", false);
            $('.err').html("Non autorisé.");
        })
})