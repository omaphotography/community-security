document.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", function(e){

        e.preventDefault();

        document.body.style.opacity = "0";

        setTimeout(() => {
            window.location.href = this.href;
        }, 500);

    });

});

window.onload = () => {
    document.body.style.opacity = "1";
};

document.body.style.transition =
"opacity .5s ease";