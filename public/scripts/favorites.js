let imgButtonsFrom = document.querySelectorAll('#fromList img');
let imgButtonsTo = document.querySelectorAll('#toList img');
imgButtonsFrom.forEach((btn) => {
    btn.addEventListener('click', (e) => {
        let clickedButtonId = e.target.id;
        let respectiveLi = document.getElementById(clickedButtonId + '-li');

        //deleting
        fetch('/delete-from-favorites-from', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({currency:respectiveLi.innerText}),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });


        respectiveLi.parentElement.remove();
    })
});

imgButtonsTo.forEach((btn) => {

    btn.addEventListener('click', (e) => {
        let clickedButtonId = e.target.id;
        let respectiveLi = document.getElementById(clickedButtonId + '-li');

        //deleting
        fetch('/delete-from-favorites-to', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({currency:respectiveLi.innerText}),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });


        respectiveLi.parentElement.remove();

    })

});