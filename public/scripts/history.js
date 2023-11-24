document.getElementById('okButton').addEventListener('click', () => {
  fetch("/clear-history", {
            method: "POST"
        })
        .then((response) => {
            if(response.ok) {
                window.location.reload();
            }
        })
});